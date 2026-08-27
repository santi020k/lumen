import type { Server as HttpServer } from 'node:http'

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type {
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse
} from 'express'

import { loadLumenData } from './data.js'
import { createLumenServer } from './server.js'

export type { LumenData } from './data.js'
export { loadLumenData } from './data.js'
export { createLumenServer } from './server.js'
export * from './tools.js'

/** Start the Lumen MCP server over stdio. Called by the `lumen-mcp` bin. */
export const startLumenMcp = async (): Promise<void> => {
  const server = createLumenServer()
  const transport = new StdioServerTransport()

  await server.connect(transport)
}

export interface LumenMcpHttpOptions {
  allowedHosts?: string[] | undefined
  endpoint?: string | undefined
  host?: string | undefined
  onError?: ((error: unknown) => void) | undefined
  openAiChallenge?: string | undefined
  port?: number | undefined
  rateLimit?: LumenMcpRateLimit | false | undefined
  trustProxy?: boolean | undefined
}

export interface LumenMcpRateLimit {
  maxRequests: number
  windowMs: number
}

export interface LumenMcpHttpServer {
  close: () => Promise<void>
  httpServer: HttpServer
  url: URL
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimiter {
  close: () => void
  middleware: (
    request: ExpressRequest,
    response: ExpressResponse,
    next: () => void
  ) => void
}

const defaultRateLimit = {
  maxRequests: 120,
  windowMs: 60_000
} as const

const maxTrackedRateLimitClients = 10_000

const passThroughRateLimiter: RateLimiter = {
  close: () => undefined,
  middleware: (_request, _response, next) => {
    next()
  }
}

const validatePositiveInteger = (value: number, name: string): void => {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }
}

const resolveRateLimit = (
  rateLimit: LumenMcpHttpOptions['rateLimit']
): LumenMcpRateLimit | false => {
  if (rateLimit === false) return false

  const resolved = rateLimit ?? defaultRateLimit

  validatePositiveInteger(resolved.maxRequests, 'rateLimit.maxRequests')

  validatePositiveInteger(resolved.windowMs, 'rateLimit.windowMs')

  return resolved
}

const validateOpenAiChallenge = (challenge: string | undefined): void => {
  if (challenge === undefined) return

  if (challenge.trim() === '' || challenge.includes('\n') || challenge.includes('\r')) {
    throw new Error('openAiChallenge must be a non-empty single-line token.')
  }
}

const createRateLimiter = (rateLimit: LumenMcpRateLimit | false): RateLimiter => {
  if (!rateLimit) return passThroughRateLimiter

  const entries = new Map<string, RateLimitEntry>()

  const cleanup = setInterval(() => {
    const now = Date.now()

    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(key)
    }
  }, rateLimit.windowMs)

  cleanup.unref()

  return {
    close: () => {
      clearInterval(cleanup)
    },
    middleware: (request, response, next) => {
      const now = Date.now()
      const key = request.ip ?? request.socket.remoteAddress ?? 'unknown'
      const current = entries.get(key)

      if (!current && entries.size >= maxTrackedRateLimitClients) {
        response.setHeader('retry-after', String(Math.ceil(rateLimit.windowMs / 1000)))

        response.status(429).json({ error: 'Too many MCP requests. Try again later.' })

        return
      }

      const entry = !current || current.resetAt <= now ?
        { count: 1, resetAt: now + rateLimit.windowMs } :
        { ...current, count: current.count + 1 }

      entries.set(key, entry)

      if (entry.count <= rateLimit.maxRequests) {
        next()

        return
      }

      response.setHeader(
        'retry-after',
        String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000)))
      )

      response.status(429).json({ error: 'Too many MCP requests. Try again later.' })
    }
  }
}

const toWebRequest = (request: ExpressRequest, host: string, options: LumenMcpHttpOptions): Request => {
  const headers = new Headers()

  for (const [name, value] of Object.entries(request.headers)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) headers.append(name, item)
    }
  }

  const hostHeader = request.headers.host ?? `${host}:${options.port ?? 3000}`
  const method = request.method

  return new Request(
    `http://${hostHeader}${request.url}`, {
      headers,
      method,
      ...(['GET', 'HEAD'].includes(method) ? {} : { body: JSON.stringify(request.body) })
    }
  )
}

const streamResponse = async (webResponse: Response, response: ExpressResponse) => {
  response.statusCode = webResponse.status

  for (const [name, value] of webResponse.headers.entries()) response.setHeader(name, value)

  if (!webResponse.body) {
    response.end()

    return
  }

  const reader = webResponse.body.getReader()

  response.once('close', () => {
    reader.cancel().catch(() => { /* no-op */ })
  })

  while (!response.destroyed) {
    const chunk = await reader.read()

    if (chunk.done) break

    response.write(Buffer.from(chunk.value))
  }

  if (!response.writableEnded) response.end()
}

const handleMcpRequest = async (
  request: ExpressRequest,
  response: ExpressResponse,
  host: string,
  options: LumenMcpHttpOptions,
  activeServers: Set<ReturnType<typeof createLumenServer>>
): Promise<void> => {
  let mcpServer: ReturnType<typeof createLumenServer> | undefined

  try {
    mcpServer = createLumenServer()

    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true
    })

    activeServers.add(mcpServer)

    await mcpServer.connect(transport)

    const webRequest = toWebRequest(request, host, options)

    const webResponse = await transport.handleRequest(webRequest, {
      parsedBody: request.body
    })

    await streamResponse(webResponse, response)
  } catch (error) {
    options.onError?.(error)

    if (response.headersSent) throw error

    response.statusCode = 500

    response.setHeader('content-type', 'application/json')

    response.end(JSON.stringify({ error: 'Lumen MCP HTTP request failed.' }))
  } finally {
    if (mcpServer?.isConnected()) await mcpServer.close()

    if (mcpServer) activeServers.delete(mcpServer)
  }
}

const sendJson = (
  response: ExpressResponse,
  status: number,
  data: unknown
): void => {
  response.setHeader('cache-control', 'no-store')

  response.setHeader('referrer-policy', 'no-referrer')

  response.setHeader('x-content-type-options', 'nosniff')

  response.setHeader('x-frame-options', 'DENY')

  response.status(status).type('application/json').send(JSON.stringify(data))
}

/** Start a self-hostable Streamable HTTP transport. Defaults to loopback for safety. */
export const startLumenMcpHttp = async (
  options: LumenMcpHttpOptions = {}
): Promise<LumenMcpHttpServer> => {
  const host = options.host ?? '127.0.0.1'
  const endpoint = options.endpoint ?? '/mcp'
  const rateLimit = resolveRateLimit(options.rateLimit)

  validateOpenAiChallenge(options.openAiChallenge)

  const app = createMcpExpressApp({
    host,
    ...(options.allowedHosts ? { allowedHosts: options.allowedHosts } : {})
  })

  app.set('trust proxy', options.trustProxy ?? false)

  app.use((_request: ExpressRequest, response: ExpressResponse, next: () => void) => {
    response.setHeader('cache-control', 'no-store')

    response.setHeader('referrer-policy', 'no-referrer')

    response.setHeader('x-content-type-options', 'nosniff')

    response.setHeader('x-frame-options', 'DENY')

    next()
  })

  const activeServers = new Set<ReturnType<typeof createLumenServer>>()
  const rateLimiter = createRateLimiter(rateLimit)

  if (options.openAiChallenge !== undefined) {
    app.get('/.well-known/openai-apps-challenge', (
      _request: ExpressRequest,
      response: ExpressResponse
    ) => {
      response.type('text/plain').send(options.openAiChallenge)
    })
  }

  app.all(endpoint, rateLimiter.middleware, async (
    request: ExpressRequest,
    response: ExpressResponse
  ) => {
    await handleMcpRequest(request, response, host, options, activeServers)
  })

  app.get('/health', (_request: ExpressRequest, response: ExpressResponse) => {
    sendJson(response, 200, { status: 'ok' })
  })

  app.get('/ready', (_request: ExpressRequest, response: ExpressResponse) => {
    try {
      const data = loadLumenData()

      sendJson(response, 200, {
        catalogHash: data.meta.catalogHash,
        serverVersion: data.meta.serverVersion,
        status: 'ready'
      })
    } catch (error) {
      options.onError?.(error)

      sendJson(response, 503, { error: 'Lumen MCP catalog is unavailable.' })
    }
  })

  app.use((
    error: unknown,
    _request: ExpressRequest,
    response: ExpressResponse,
    next: NextFunction
  ) => {
    options.onError?.(error)

    if (response.headersSent) {
      next(error)

      return
    }

    const isTooLarge = typeof error === 'object' && error !== null &&
      'type' in error && error.type === 'entity.too.large'

    const status = isTooLarge ? 413 : 400

    sendJson(response, status, { error: 'Invalid Lumen MCP HTTP request.' })
  })

  const httpServer = await new Promise<HttpServer>((resolve, reject) => {
    const listener = app.listen(options.port ?? 3000, host)

    listener.once('error', reject)

    listener.once('listening', () => {
      resolve(listener)
    })
  })

  const address = httpServer.address()

  if (!address || typeof address === 'string') {
    httpServer.close()

    throw new Error('Could not resolve the Lumen MCP HTTP listening address.')
  }

  const url = new URL(`http://${host.includes(':') ? `[${host}]` : host}:${address.port}${endpoint}`)

  return {
    close: async () => {
      rateLimiter.close()

      await Promise.all(
        [...activeServers].map(async server => {
          if (server.isConnected()) await server.close()
        })
      )

      await new Promise<void>((resolve, reject) => {
        httpServer.close(error => {
          if (error) reject(error)
          else resolve()
        })
      })
    },
    httpServer,
    url
  }
}

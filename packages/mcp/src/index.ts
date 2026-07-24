import type { Server as HttpServer } from 'node:http'

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type {
  Request as ExpressRequest,
  Response as ExpressResponse
} from 'express'

import { createLumenServer } from './server.js'

export { loadLumenData } from './data.js'
export type { LumenData } from './data.js'
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
  port?: number | undefined
}

export interface LumenMcpHttpServer {
  close: () => Promise<void>
  httpServer: HttpServer
  url: URL
}

/** Start a self-hostable Streamable HTTP transport. Defaults to loopback for safety. */
export const startLumenMcpHttp = async (
  options: LumenMcpHttpOptions = {}
): Promise<LumenMcpHttpServer> => {
  const host = options.host ?? '127.0.0.1'
  const endpoint = options.endpoint ?? '/mcp'

  const app = createMcpExpressApp({
    host,
    ...(options.allowedHosts ? { allowedHosts: options.allowedHosts } : {})
  })

  const activeServers = new Set<ReturnType<typeof createLumenServer>>()

  app.all(endpoint, async (
    request: ExpressRequest,
    response: ExpressResponse
  ) => {
    const mcpServer = createLumenServer()

    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true
    })

    activeServers.add(mcpServer)

    try {
      await mcpServer.connect(transport)

      const headers = new Headers()

      for (const [name, value] of Object.entries(request.headers)) {
        for (const item of Array.isArray(value) ? value : [value]) {
          if (item !== undefined) headers.append(name, item)
        }
      }

      const hostHeader = request.headers.host ?? `${host}:${options.port ?? 3000}`
      const method = request.method

      const webRequest = new Request(
        `http://${hostHeader}${request.url}`,
        {
          headers,
          method,
          ...(['GET', 'HEAD'].includes(method)
            ? {}
            : { body: JSON.stringify(request.body) })
        }
      )

      const webResponse = await transport.handleRequest(webRequest, {
        parsedBody: request.body
      })

      response.statusCode = webResponse.status

      for (const [name, value] of webResponse.headers.entries()) response.setHeader(name, value)

      if (!webResponse.body) {
        response.end()

        return
      }

      const reader = webResponse.body.getReader()

      response.once('close', () => {
        reader.cancel().catch(() => {})
      })

      while (!response.destroyed) {
        const chunk = await reader.read()

        if (chunk.done) break

        response.write(Buffer.from(chunk.value))
      }

      if (!response.writableEnded) response.end()
    } catch (error) {
      if (response.headersSent) throw error

      response.statusCode = 500

      response.setHeader('content-type', 'application/json')

      response.end(JSON.stringify({
        error: 'Lumen MCP HTTP request failed.',
        message: String(error)
      }))
    } finally {
      if (mcpServer.isConnected()) await mcpServer.close()

      activeServers.delete(mcpServer)
    }
  })

  app.get('/health', (_request: ExpressRequest, response: ExpressResponse) => {
    response.setHeader('content-type', 'application/json')

    response.end(JSON.stringify({ status: 'ok' }))
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
      await Promise.all(
        [...activeServers].map(async (server) => {
          if (server.isConnected()) await server.close()
        })
      )

      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    },
    httpServer,
    url
  }
}

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

import snapshot from '../data/lumen-data.json' with { type: 'json' }

import { type LumenData, setLumenData } from './data.js'
import { createLumenServer } from './server.js'

interface RateLimitBinding {
  limit: (input: { key: string }) => Promise<{ success: boolean }>
}

interface WorkerEnvironment {
  LUMEN_MCP_OPENAI_CHALLENGE?: string | undefined
  LUMEN_MCP_RATE_LIMITER?: RateLimitBinding | undefined
}

const safeHeaders = {
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY'
} as const

const jsonResponse = (
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response => new Response(
  JSON.stringify(data), {
    headers: {
      'content-type': 'application/json',
      ...safeHeaders,
      ...headers
    },
    status
  }
)

const withSafeHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers)

  for (const [name, value] of Object.entries(safeHeaders)) headers.set(name, value)

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  })
}

const lumenData = snapshot as LumenData

setLumenData(lumenData)

const handleMcpRequest = async (request: Request): Promise<Response> => {
  const server = createLumenServer()
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true })

  try {
    await server.connect(transport)

    return withSafeHeaders(await transport.handleRequest(request))
  } catch {
    return jsonResponse({ error: 'Lumen MCP request failed.' }, 500)
  } finally {
    if (server.isConnected()) await server.close()
  }
}

const applyRateLimit = async (
  environment: WorkerEnvironment,
  clientAddress: string
): Promise<Response | null> => {
  const limiter = environment.LUMEN_MCP_RATE_LIMITER

  if (!limiter) {
    return jsonResponse({ error: 'Lumen MCP rate limiting is unavailable.' }, 503)
  }

  try {
    const { success } = await limiter.limit({
      key: `public-mcp:${clientAddress}`
    })

    return success ?
      null :
      jsonResponse(
        { error: 'Too many MCP requests. Try again later.' },
        429,
        { 'retry-after': '60' }
      )
  } catch {
    return jsonResponse({ error: 'Lumen MCP rate limiting is unavailable.' }, 503)
  }
}

const handleUtilityRequest = (
  request: Request,
  environment: WorkerEnvironment,
  url: URL
): Response | null => {
  if (request.method !== 'GET') return null

  if (url.pathname === '/health') return jsonResponse({ status: 'ok' })

  if (url.pathname === '/ready') {
    return jsonResponse({
      catalogHash: lumenData.meta.catalogHash,
      serverVersion: lumenData.meta.serverVersion,
      status: 'ready'
    })
  }

  if (url.pathname !== '/.well-known/openai-apps-challenge') return null

  const challenge = environment.LUMEN_MCP_OPENAI_CHALLENGE

  if (!challenge) return jsonResponse({ error: 'Verification is not configured.' }, 404)

  return new Response(challenge, {
    headers: { 'content-type': 'text/plain; charset=utf-8', ...safeHeaders }
  })
}

export default {
  async fetch(request: Request, environment: WorkerEnvironment): Promise<Response> {
    const url = new URL(request.url)
    const utilityResponse = handleUtilityRequest(request, environment, url)

    if (utilityResponse) return utilityResponse

    if (url.pathname !== '/mcp') return jsonResponse({ error: 'Not found.' }, 404)

    const clientAddress = request.headers.get('cf-connecting-ip') ?? 'unknown'
    const rateLimitResponse = await applyRateLimit(environment, clientAddress)

    if (rateLimitResponse) return rateLimitResponse

    return handleMcpRequest(request)
  }
}

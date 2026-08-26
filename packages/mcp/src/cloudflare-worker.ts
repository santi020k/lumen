import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

import snapshot from '../data/lumen-data.json' with { type: 'json' }

import { type LumenData, setLumenData } from './data.js'
import { createLumenServer } from './server.js'

interface RateLimitBinding {
  limit: (input: { key: string }) => Promise<{ success: boolean }>
}

interface WorkerEnvironment {
  LUMEN_MCP_OPENAI_CHALLENGE?: string | undefined
  LUMEN_MCP_RATE_LIMITER: RateLimitBinding
}

const safeHeaders = {
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff'
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

setLumenData(snapshot as LumenData)

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

export default {
  async fetch(request: Request, environment: WorkerEnvironment): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse({ status: 'ok' })
    }

    if (url.pathname === '/.well-known/openai-apps-challenge' && request.method === 'GET') {
      const challenge = environment.LUMEN_MCP_OPENAI_CHALLENGE

      if (!challenge) return jsonResponse({ error: 'Verification is not configured.' }, 404)

      return new Response(challenge, {
        headers: { 'content-type': 'text/plain; charset=utf-8', ...safeHeaders }
      })
    }

    if (url.pathname !== '/mcp') return jsonResponse({ error: 'Not found.' }, 404)

    const clientAddress = request.headers.get('cf-connecting-ip') ?? 'unknown'

    const { success } = await environment.LUMEN_MCP_RATE_LIMITER.limit({
      key: `public-mcp:${clientAddress}`
    })

    if (!success) {
      return jsonResponse(
        { error: 'Too many MCP requests. Try again later.' },
        429,
        { 'retry-after': '60' }
      )
    }

    return handleMcpRequest(request)
  }
}

#!/usr/bin/env node
import { startLumenMcpHttp } from '../dist/index.js'

const port = Number.parseInt(process.env.LUMEN_MCP_PORT ?? '3000', 10)
const host = process.env.LUMEN_MCP_HOST ?? '127.0.0.1'

const parsePositiveInteger = (value, fallback, name) => {
  const parsed = Number.parseInt(value ?? String(fallback), 10)

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return parsed
}

const allowedHosts = process.env.LUMEN_MCP_ALLOWED_HOSTS
  ?.split(',')
  .map(value => value.trim())
  .filter(Boolean)

try {
  const maxRequests = parsePositiveInteger(
    process.env.LUMEN_MCP_RATE_LIMIT_MAX,
    120,
    'LUMEN_MCP_RATE_LIMIT_MAX'
  )

  const windowMs = parsePositiveInteger(
    process.env.LUMEN_MCP_RATE_LIMIT_WINDOW_MS,
    60_000,
    'LUMEN_MCP_RATE_LIMIT_WINDOW_MS'
  )

  const { url } = await startLumenMcpHttp({
    allowedHosts,
    host,
    openAiChallenge: process.env.LUMEN_MCP_OPENAI_CHALLENGE,
    port,
    rateLimit: { maxRequests, windowMs },
    trustProxy: process.env.LUMEN_MCP_TRUST_PROXY === 'true'
  })

  process.stderr.write(`lumen-mcp listening at ${url.href}\n`)
} catch (error) {
  process.stderr.write('lumen-mcp HTTP transport failed to start: ' + String(error) + '\n')

  process.exitCode = 1
}

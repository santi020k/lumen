#!/usr/bin/env node
import { startLumenMcpHttp } from '../dist/index.js'

const port = Number.parseInt(process.env.LUMEN_MCP_PORT ?? '3000', 10)
const host = process.env.LUMEN_MCP_HOST ?? '127.0.0.1'

const allowedHosts = process.env.LUMEN_MCP_ALLOWED_HOSTS
  ?.split(',')
  .map(value => value.trim())
  .filter(Boolean)

try {
  const { url } = await startLumenMcpHttp({ allowedHosts, host, port })

  process.stderr.write(`lumen-mcp listening at ${url.href}\n`)
} catch (error) {
  process.stderr.write('lumen-mcp HTTP transport failed to start: ' + String(error) + '\n')

  process.exitCode = 1
}

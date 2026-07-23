import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

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

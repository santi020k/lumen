#!/usr/bin/env node
import { startLumenMcp } from '../dist/index.js'

startLumenMcp().catch((error) => {
  console.error('lumen-mcp failed to start:', error)

  process.exitCode = 1
})

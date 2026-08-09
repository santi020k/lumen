#!/usr/bin/env node
import { startLumenMcp } from '../dist/index.js'

startLumenMcp().catch(error => {
  process.stderr.write('lumen-mcp failed to start: ' + String(error) + '\n')

  process.exitCode = 1
})

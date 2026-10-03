import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { migrateLumenV4, migrateLumenV4Source } from './v4-migration.js'

describe('v4 source migrations', () => {
  test('preserves aliases, quotes and comments while migrating known SDK module paths', () => {
    const source = `/* integration */
import { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
`
    const result = migrateLumenV4Source(source, 'server.ts')
    expect(result.source).toContain('import { McpServer as Server } from \'@modelcontextprotocol/server\'')
    expect(result.source).toContain('import type { Client } from "@modelcontextprotocol/client";')
    expect(result.source).toContain('from \'@modelcontextprotocol/server/stdio\'')
    expect(result.source).toContain('from \'@modelcontextprotocol/client/stdio\'')
    expect(result.changes).toHaveLength(4)
    expect(migrateLumenV4Source(result.source).changes).toEqual([])
  })

  test('does not rewrite comments, strings, templates, dynamic imports or unrelated paths', () => {
    const source = `/*
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
*/
const example = \`import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'\`
const dynamic = import('@modelcontextprotocol/sdk/server/mcp.js')
import { Other } from '@modelcontextprotocol/sdk/types.js'
`
    expect(migrateLumenV4Source(source)).toEqual({ changes: [], source })
  })

  test('handles adversarial-length unclosed input without edits', () => {
    for (const prefix of ['/*', '"', '`', '//']) {
      const source = prefix + 'import x from \'@modelcontextprotocol/sdk/server/mcp.js\' '.repeat(20000)
      expect(migrateLumenV4Source(source).source).toBe(source)
    }
  })

  test('reports positions for many imports without repeated prefix scans', () => {
    const source = 'import { McpServer } from \'@modelcontextprotocol/sdk/server/mcp.js\'\n'.repeat(10000)
    const result = migrateLumenV4Source(source)

    expect(result.changes).toHaveLength(10000)
    expect(result.changes.at(-1)?.line).toBe(10000)
    expect(result.changes.at(-1)?.column).toBe(27)
    expect(migrateLumenV4Source(result.source).changes).toEqual([])
  })

  test.each(['__proto__', 'constructor', 'toString', 'hasOwnProperty'])('never rewrites inherited module key %s', name => {
    const source = `import value from '${name}'`

    expect(migrateLumenV4Source(source)).toEqual({ changes: [], source })
  })

  test('handles repeated import keywords on one adversarial line without edits', () => {
    const source = 'import '.repeat(50000)

    expect(migrateLumenV4Source(source)).toEqual({ changes: [], source })
  })

  test('previews by default, inventories versions, applies safe edits, and retains manual reviews', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-v4-migration-test-'))
    try {
      await mkdir(join(root, 'node_modules', '@santi020k', 'lumen-react'), { recursive: true })
      await writeFile(join(root, 'node_modules', '@santi020k', 'lumen-react', 'package.json'), JSON.stringify({ version: '3.0.1' }))
      await writeFile(join(root, 'node_modules', 'ignored.ts'), 'import { McpServer } from \'@modelcontextprotocol/sdk/server/mcp.js\'')
      await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { '@santi020k/lumen-react': '^3.0.1' } }))
      const path = join(root, 'screen.ts')
      const source = 'import { McpServer } from \'@modelcontextprotocol/sdk/server/mcp.js\'\nimport { Button, DatePicker } from \'@santi020k/lumen-react\'\n'
      await writeFile(path, source)
      const preview = await migrateLumenV4({ cwd: root })
      expect(preview.applied).toBe(false)
      expect(preview.filesScanned).toBe(1)
      expect(preview.changedFiles).toEqual(['screen.ts'])
      expect(preview.packageVersions).toEqual({ 'package.json:@santi020k/lumen-react': '3.0.1' })
      expect(preview.manualReview.map(finding => finding.rule)).toContain('consumer-driven-component-polish')
      expect(await readFile(path, 'utf8')).toBe(source)
      const applied = await migrateLumenV4({ apply: true, cwd: root })
      expect(applied.applied).toBe(true)
      expect(await readFile(path, 'utf8')).toContain('from \'@modelcontextprotocol/server\'')
      expect((await migrateLumenV4({ cwd: root })).changes).toEqual([])
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
})

import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { formatLumenVersionMigration, migrateLumenVersion, migrateLumenVersionSource } from './version-migration.js'

describe('versioned source migrations', () => {
  test.each(['page.astro', 'page.html'])('preserves slash-star text while migrating %s markup', file => {
    const source = '<div>Path is /*/user/*.</div><lumen-stack gap="md"></lumen-stack>'

    expect(migrateLumenVersionSource(source, file, 'v4').source).toBe(
      '<div>Path is /*/user/*.</div><lumen-stack gap="group"></lumen-stack>'
    )
  })

  test('combines v4 layout and SDK migrations without changing previews or repeating edits', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-combined-migration-'))
    const sdkSource = 'import { Client } from \'@modelcontextprotocol/sdk/client/index.js\'\n'
    const layoutSource = 'import { Stack } from \'@santi020k/lumen-react\'\nexport const View = () => <Stack gap="md" />\n'

    try {
      await writeFile(join(root, 'sdk.ts'), sdkSource)
      await writeFile(join(root, 'View.tsx'), layoutSource)
      const preview = await migrateLumenVersion({ cwd: root, version: 'v4' })

      expect(preview.changes).toHaveLength(2)
      expect(preview.changes.filter(finding => finding.kind === 'embedded-mcp-sdk')).toHaveLength(1)
      expect(formatLumenVersionMigration(preview)).toContain('@modelcontextprotocol/client')
      expect(await readFile(join(root, 'sdk.ts'), 'utf8')).toBe(sdkSource)
      expect(await readFile(join(root, 'View.tsx'), 'utf8')).toBe(layoutSource)

      const applied = await migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })

      expect(applied.applied).toBe(true)
      expect(await readFile(join(root, 'sdk.ts'), 'utf8')).toContain('from \'@modelcontextprotocol/client\'')
      expect(await readFile(join(root, 'View.tsx'), 'utf8')).toContain('gap="group"')
      const repeated = await migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })

      expect(repeated.changes).toEqual([])
      expect(repeated.changedFiles).toEqual([])
      expect(await readFile(join(root, 'View.tsx'), 'utf8')).toContain('gap="group"')
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
  test.each(['v3', 'v4'] as const)('inventories coordinated %s dependencies without mutating the project', async version => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-version-dependencies-'))
    const manifest = JSON.stringify({ name: 'migration-fixture', packageManager: 'pnpm@12.8.1', dependencies: { '@santi020k/lumen-react': '^2.0.0' } })

    try {
      await writeFile(join(root, 'package.json'), manifest)
      const report = await migrateLumenVersion({ cwd: root, dependencies: true, version })

      expect(report.dependencies?.mode).toBe('inventory')
      expect(report.dependencies?.targetVersion).toBe(version === 'v3' ? '3.0.1' : '4.0.0')
      expect(report.dependencies?.repositories[0]?.references).toContainEqual(expect.objectContaining({ packageName: '@santi020k/lumen-react' }))
      expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(manifest)
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })
  test('v3 has no invented web rewrites and flags the native enum/rebuild boundary', () => {
    const source = 'import { Stack } from \'@santi020k/lumen-react\'\n<Stack gap="md" />'

    expect(migrateLumenVersionSource(source, 'src/app.tsx', 'v3')).toEqual({ source, changes: [], manualReview: [] })
    expect(migrateLumenVersionSource('import LumenUI\nswitch icon { }', 'App.swift', 'v3').manualReview[0]?.message).toContain('LumenIconName')
  })

  test('preserves explicit v3 gaps in aliased Astro, React and Elements markup', () => {
    const astro = '---\nimport { Stack as Flow, Grid } from \'@santi020k/lumen-astro\'\n---\n<Flow gap=\'md\' /><Grid gap={"lg"} /><lumen-stack gap=xl></lumen-stack>'
    const result = migrateLumenVersionSource(astro, 'src/app.astro', 'v4')

    expect(result.source).toContain('<Flow gap=\'group\' />')
    expect(result.source).toContain('<Grid gap={"xl"} />')
    expect(result.source).toContain('<lumen-stack gap=2xl>')
    expect(result.changes).toHaveLength(3)
    expect(result.changes[0]).toMatchObject({ file: 'src/app.astro', line: 4, column: 7 })
    const react = 'import { Stack as Flow } from \'@santi020k/lumen-react\'\nexport const View = () => <Flow gap="md" />'

    expect(migrateLumenVersionSource(react, 'View.tsx', 'v4').source).toContain('gap="group"')
  })

  test('does not rewrite unrelated components, strings, comments, scripts or frontmatter', () => {
    const source = `---
import { Stack as Flow } from '@santi020k/lumen-astro'
const example = '<Flow gap="md" />'
---
<!-- <Flow gap="md" /> -->
<script>const fixture = '<lumen-stack gap="xl">';</script>
<Stack gap="md" />
<Flow gap="sm" />
{'<Flow gap="md" />'}
`

    expect(migrateLumenVersionSource(source, 'src/app.astro', 'v4').source).toBe(source)
    const script = 'const sample = `<lumen-stack gap="lg"></lumen-stack>`; // <lumen-grid gap="md">'

    expect(migrateLumenVersionSource(script, 'src/fixture.ts', 'v4').changes).toEqual([])
  })

  test('leaves dynamic, spread and duplicated props for explicit review', () => {
    const source = 'import { Stack } from \'@santi020k/lumen-react\'\n<Stack gap={size} /><Stack gap="md" {...props} /><Stack gap="md" gap="lg" />'
    const result = migrateLumenVersionSource(source, 'app.tsx', 'v4')

    expect(result.source).toBe(source)
    expect(result.changes).toEqual([])
    expect(result.manualReview).toHaveLength(3)
  })

  test('reports product-specific layout and CSS without deleting application fixes', () => {
    const source = 'import { Card } from \'@santi020k/lumen-react\'\n<Card style={{ margin: 4 }}>Save</Card>'

    expect(migrateLumenVersionSource(source, 'app.tsx', 'v4')).toMatchObject({ source, changes: [], manualReview: [{ kind: 'component-review' }] })
    expect(migrateLumenVersionSource('.ui-button > span { display: none; }', 'theme.css', 'v4').manualReview).toHaveLength(1)
  })

  test('handles long malformed markup and many findings without backtracking', () => {
    const source = `import { Stack } from '@santi020k/lumen-react'\n${'<Stack gap="md" />\n'.repeat(10_000)}<Stack gap="${'x'.repeat(200_000)}`

    expect(migrateLumenVersionSource(source, 'large.tsx', 'v4').changes).toHaveLength(10_000)
  }, 5000)

  test('preview preserves files and repeated apply cannot rewrite overlapping gap names twice', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-version-migration-'))
    const path = join(root, 'App.tsx')
    const source = 'import { Stack } from \'@santi020k/lumen-react\'\n<Stack gap="lg" />'

    try {
      await writeFile(path, source)
      await mkdir(join(root, 'node_modules'))
      await writeFile(join(root, 'node_modules', 'ignored.tsx'), source)
      const preview = await migrateLumenVersion({ cwd: root, version: 'v4' })

      expect(preview.changedFiles).toEqual(['App.tsx'])
      expect(await readFile(path, 'utf8')).toBe(source)
      await migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })
      expect(await readFile(path, 'utf8')).toContain('gap="xl"')
      const repeated = await migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })

      expect(repeated.changes).toEqual([])
      expect(await readFile(path, 'utf8')).toContain('gap="xl"')
      await writeFile(path, `${await readFile(path, 'utf8')}\n// edited`)
      expect((await migrateLumenVersion({ cwd: root, version: 'v4' })).manualReview[0]?.message).toContain('already migrated')
      expect(formatLumenVersionMigration(preview)).toContain('lumen migrate v4 --apply')
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test.each(['constructor', '__proto__', 'toString'])('preserves unsupported gap %s rather than inherited object values', gap => {
    const source = `import { Stack } from '@santi020k/lumen-react'\n<Stack gap="${gap}" />`

    expect(migrateLumenVersionSource(source, 'Screen.tsx', 'v4').source).toBe(source)
  })

  test('one v4 apply composes layout and SDK edits into the same idempotent ledger', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-v4-composed-'))
    const screen = join(root, 'Screen.tsx')
    const server = join(root, 'server.mjs')
    const sdkSource = '// Preserve @modelcontextprotocol/sdk/server/stdio.js\nimport { StdioServerTransport } from \'@modelcontextprotocol/sdk/server/stdio.js\'\n'

    try {
      await writeFile(screen, 'import { Stack } from \'@santi020k/lumen-react\'\n<Stack gap="lg" />')
      await writeFile(server, sdkSource)

      const preview = await migrateLumenVersion({ cwd: root, version: 'v4' })

      expect(preview.changedFiles).toEqual(['Screen.tsx', 'server.mjs'])
      expect(preview.changes.map(finding => finding.kind)).toEqual(['layout-gap', 'embedded-mcp-sdk'])
      expect(await readFile(server, 'utf8')).toBe(sdkSource)

      const applied = await migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })

      expect(applied.changedFiles).toEqual(preview.changedFiles)
      expect(await readFile(screen, 'utf8')).toContain('gap="xl"')
      expect(await readFile(server, 'utf8')).toBe('// Preserve @modelcontextprotocol/sdk/server/stdio.js\nimport { StdioServerTransport } from \'@modelcontextprotocol/server/stdio\'\n')
      expect((await migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })).changedFiles).toEqual([])
    } finally {
      await rm(root, { force: true, recursive: true })
    }
  })

  test('does not follow source symlinks outside the consumer directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-version-symlink-'))
    const external = await mkdtemp(join(tmpdir(), 'lumen-version-external-'))
    const source = '<lumen-stack gap="md"></lumen-stack>'

    try {
      await writeFile(join(external, 'external.html'), source)
      await symlink(external, join(root, 'linked'))
      expect((await migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })).filesScanned).toBe(0)
      expect(await readFile(join(external, 'external.html'), 'utf8')).toBe(source)
    } finally {
      await rm(root, { force: true, recursive: true })
      await rm(external, { force: true, recursive: true })
    }
  })

  test('rejects malformed and redirected ledgers before writing source', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-version-ledger-'))
    const external = await mkdtemp(join(tmpdir(), 'lumen-version-ledger-target-'))
    const source = '<lumen-stack gap="lg"></lumen-stack>'

    try {
      await writeFile(join(root, 'app.html'), source)
      await mkdir(join(root, '.lumen'))
      await writeFile(join(root, '.lumen', 'migrations-v4.json'), '["invalid"]')
      await expect(migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })).rejects.toThrow('Invalid migration ledger')
      await rm(join(root, '.lumen'), { recursive: true })
      await symlink(external, join(root, '.lumen'))
      await expect(migrateLumenVersion({ apply: true, cwd: root, version: 'v4' })).rejects.toThrow('symbolic link')
      expect(await readFile(join(root, 'app.html'), 'utf8')).toBe(source)
    } finally {
      await rm(root, { force: true, recursive: true })
      await rm(external, { force: true, recursive: true })
    }
  })

  test('ignores commented and quoted import examples', () => {
    const source = `/*
import { Stack } from '@santi020k/lumen-react'
*/
const example = "import { Stack } from '@santi020k/lumen-react'";
<Stack gap="md" />`

    expect(migrateLumenVersionSource(source, 'example.tsx', 'v4').changes).toEqual([])
  })
})

// Build-time snapshot generator for the Lumen MCP server.
//
// Reads the authoritative sources in the monorepo (component catalog, Astro
// component files, design tokens, registry manifest, and llms.txt agent rules)
// and writes a single self-contained JSON payload the published server reads at
// runtime. This keeps @santi020k/lumen-mcp installable without the whole repo.

import { access,mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))

const findRepoRoot = async (start) => {
  let dir = start

  for (let depth = 0; depth < 10; depth += 1) {
    try {
      await access(join(dir, 'pnpm-workspace.yaml'))

      return dir
    } catch {
      const parent = dirname(dir)

      if (parent === dir) break

      dir = parent
    }
  }

  throw new Error('Could not locate repo root (pnpm-workspace.yaml).')
}

const exists = async (path) => {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

const readIfExists = async (path) => (await exists(path)) ? readFile(path, 'utf8') : ''

// Extract the quoted entries of `export const lumenComponentNames = [ ... ]`.
const parseComponentNames = (source) => {
  const match = source.match(/lumenComponentNames\s*=\s*\[([\s\S]*?)\]\s*as const/)

  if (!match) return []

  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

// Parse a `key: 'value'` object literal block into a record.
const parseTokenBlock = (source, identifier) => {
  const match = source.match(new RegExp(`${identifier}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*as const`))

  if (!match) return {}

  const out = {}

  for (const entry of match[1].matchAll(/(\w+)\s*:\s*'([^']*)'/g)) {
    out[entry[1]] = entry[2]
  }

  return out
}

// Pull the `interface Props { ... }` body out of Astro frontmatter and turn it
// into a compact list of { name, optional, type } records.
const parseProps = (source) => {
  const header = source.match(/interface Props(?:\s+extends\s+([^\n{]+))?\s*\{([\s\S]*?)\n\}/)

  if (!header) return { extends: null, props: [] }

  const extendsClause = header[1] ? header[1].trim() : null
  const body = header[2]
  const props = []

  for (const line of body.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue

    const m = trimmed.match(/^([A-Za-z_][\w-]*)(\?)?\s*:\s*(.+?);?$/)

    if (!m) continue

    props.push({ name: m[1], optional: Boolean(m[2]), type: m[3].trim() })
  }

  return { extends: extendsClause, props }
}

const toKebab = (name) =>
  name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').replaceAll(/[\s_]+/g, '-').toLowerCase()

const main = async () => {
  const repoRoot = await findRepoRoot(scriptDir)
  const p = (...parts) => resolve(repoRoot, ...parts)
  const componentsSource = await readIfExists(p('packages/core/src/components.ts'))
  const tokensSource = await readIfExists(p('packages/core/src/tokens.ts'))
  const rules = await readIfExists(p('llms.txt'))
  const readme = await readIfExists(p('README.md'))
  const aiUsage = await readIfExists(p('docs/ai-usage.md'))
  let registry = { items: [] }

  try {
    registry = JSON.parse(await readFile(p('registry/lumen.registry.json'), 'utf8'))
  } catch {
    // registry optional for the snapshot
  }

  const names = parseComponentNames(componentsSource)
  const colors = parseTokenBlock(tokensSource, 'lumenColors')
  const glass = parseTokenBlock(tokensSource, 'lumenGlass')

  const semanticTokens = [
    'canvas', 'surface', 'surface-muted', 'surface-strong', 'line',
    'ink', 'ink-soft', 'ink-muted', 'brand', 'brand-solid', 'brand-soft',
    'accent', 'success', 'warning', 'danger'
  ]

  const astroDir = p('packages/astro/components')

  const astroFiles = new Set(
    (await exists(astroDir)) ? (await readdir(astroDir)).filter((f) => f.endsWith('.astro')) : []
  )

  const reactSource = [
    await readIfExists(p('packages/react/src/components.tsx')),
    await readIfExists(p('packages/react/src/index.ts'))
  ].join('\n')

  const elementsSource = [
    await readIfExists(p('packages/elements/src/define.ts')),
    await readIfExists(p('packages/elements/src/primitives.ts')),
    await readIfExists(p('packages/elements/src/index.ts'))
  ].join('\n')

  // Map recipe / component-set membership per component name.
  const recipesByComponent = new Map()

  for (const item of registry.items ?? []) {
    for (const componentName of item.components ?? []) {
      const list = recipesByComponent.get(componentName) ?? []

      list.push({ name: item.name, type: item.type })

      recipesByComponent.set(componentName, list)
    }
  }

  const components = []

  for (const name of names) {
    const fileName = `${name}.astro`
    const hasAstro = astroFiles.has(fileName)
    const astroSource = hasAstro ? await readFile(join(astroDir, fileName), 'utf8') : ''
    const parsed = hasAstro ? parseProps(astroSource) : { extends: null, props: [] }
    const wholeWord = new RegExp(`\\b${name}\\b`)
    const kebab = toKebab(name)

    components.push({
      astroSource,
      frameworks: {
        astro: hasAstro,
        elements: elementsSource.includes(`lumen-${kebab}`) || wholeWord.test(elementsSource),
        react: wholeWord.test(reactSource)
      },
      kebab,
      name,
      props: parsed.props,
      propsExtends: parsed.extends,
      recipes: recipesByComponent.get(name) ?? []
    })
  }

  const payload = {
    components,
    docs: {
      aiUsage,
      readme
    },
    meta: {
      componentCount: components.length,
      generatedAt: new Date().toISOString(),
      packages: registry.packages ?? [
        '@santi020k/lumen-astro',
        '@santi020k/lumen-react',
        '@santi020k/lumen-elements',
        '@santi020k/lumen-core'
      ],
      registryName: registry.name ?? 'lumen',
      registryVersion: registry.version ?? 1
    },
    recipes: (registry.items ?? []).filter((i) => i.type === 'recipe' || i.type === 'component-set'),
    rules,
    tokens: {
      colors,
      glass,
      semantic: semanticTokens,
      themeAttribute: 'data-theme'
    }
  }

  const outDir = resolve(scriptDir, '..', 'data')

  await mkdir(outDir, { recursive: true })

  await writeFile(join(outDir, 'lumen-data.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  console.log(
    `lumen-mcp: wrote data/lumen-data.json (${components.length} components, ` +
    `${Object.keys(colors).length} color tokens, ${rules.length} bytes of rules)`
  )
}

main().catch((error) => {
  console.error(error)

  process.exitCode = 1
})

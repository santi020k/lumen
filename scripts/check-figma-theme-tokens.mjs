import { readFile } from 'node:fs/promises'

const rootUrl = new URL('../', import.meta.url)

const [contract, lumenCss, docsCss] = await Promise.all([
  readFile(new URL('registry/figma-theme-tokens.json', rootUrl), 'utf8').then(JSON.parse),
  readFile(new URL('packages/lumen/styles.css', rootUrl), 'utf8'),
  readFile(new URL('apps/docs/src/styles/global.css', rootUrl), 'utf8')
])

const readBlock = (css, marker) => {
  const markerIndex = css.indexOf(marker)
  if (markerIndex === -1) throw new Error(`Missing theme selector ${marker}`)

  const start = css.indexOf('{', markerIndex)
  let depth = 0

  for (let index = start; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1
    if (css[index] === '}') depth -= 1
    if (depth === 0) return css.slice(start + 1, index)
  }

  throw new Error(`Unclosed theme block for ${marker}`)
}

const readTokens = block =>
  Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)]
      .map(([, name, value]) => [name, value.trim()])
  )

const sources = [
  {
    label: 'packages/lumen Light',
    mode: 'Light',
    tokens: readTokens(readBlock(lumenCss, ':root[data-theme="light"]'))
  },
  {
    label: 'packages/lumen Dark',
    mode: 'Dark',
    tokens: readTokens(readBlock(lumenCss, ':root[data-theme="dark"]'))
  },
  {
    label: 'docs Lumen Light',
    mode: 'Light',
    tokens: readTokens(readBlock(docsCss, ':root[data-theme="lumen-light"]'))
  },
  {
    label: 'docs Lumen Dark',
    mode: 'Dark',
    tokens: readTokens(readBlock(docsCss, ':root[data-theme="lumen-dark"]'))
  },
  {
    label: 'docs santi020k Light',
    mode: 'santi020k Light',
    tokens: readTokens(readBlock(docsCss, ':root[data-theme="santi020k-light"]'))
  },
  {
    label: 'docs santi020k Dark',
    mode: 'santi020k Dark',
    tokens: readTokens(readBlock(docsCss, ':root[data-theme="santi020k-dark"]'))
  }
]

const mismatches = []

for (const source of sources) {
  const expected = contract.modes[source.mode]

  for (const [name, value] of Object.entries(expected)) {
    if (source.tokens[name] !== value) {
      mismatches.push({
        actual: source.tokens[name] ?? '<missing>',
        expected: value,
        source: source.label,
        token: name
      })
    }
  }
}

if (mismatches.length > 0) {
  console.error('Figma theme token contract mismatch:')
  console.error(JSON.stringify(mismatches, null, 2))
  process.exitCode = 1
} else {
  console.log(`Figma theme token contract matches ${sources.length} CSS theme blocks.`)
}

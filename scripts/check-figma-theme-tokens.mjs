import { readFile } from 'node:fs/promises'

const rootUrl = new URL('../', import.meta.url)

const contract = await readFile(
  new URL('registry/figma-theme-tokens.json', rootUrl),
  'utf8'
).then(JSON.parse)

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

const cssByFile = new Map()

const readCss = async file => {
  if (!cssByFile.has(file)) {
    cssByFile.set(file, await readFile(new URL(file, rootUrl), 'utf8'))
  }

  return cssByFile.get(file)
}

const sources = await Promise.all(
  Object.entries(contract.sources).map(async ([mode, source]) => ({
    label: `${source.role}: ${source.file} ${source.selector}`,
    mode,
    tokens: readTokens(readBlock(await readCss(source.file), source.selector))
  }))
)

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

for (const [mode, guardrail] of Object.entries(contract.guardrails ?? {})) {
  const expected = contract.modes[mode]

  for (const [token, value] of Object.entries(guardrail.anchors ?? {})) {
    if (expected[token] !== value) {
      mismatches.push({
        actual: expected[token] ?? '<missing>',
        expected: value,
        source: `${guardrail.identity} identity guard`,
        token
      })
    }
  }

  if (guardrail.mustDifferFrom) {
    const fallback = guardrail.mustDifferFrom

    const fallbackTokens = readTokens(
      readBlock(await readCss(fallback.file), fallback.selector)
    )

    const tokenNames = Object.keys(expected)
    const copiedFallback = tokenNames.every(token => fallbackTokens[token] === expected[token])

    if (copiedFallback) {
      mismatches.push({
        actual: `${fallback.file} ${fallback.selector}`,
        expected: `${guardrail.identity} product theme`,
        source: fallback.reason,
        token: '<entire mode>'
      })
    }
  }
}

if (mismatches.length > 0) {
  process.stderr.write('Figma theme token contract mismatch:\n')

  process.stderr.write(JSON.stringify(mismatches, null, 2) + '\n')

  process.exitCode = 1
} else {
  process.stdout.write(
    `Figma theme token contract matches ${sources.length} authoritative CSS theme blocks.\n`
  )
}

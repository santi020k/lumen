import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

const repositoryRoot = resolve(import.meta.dirname, '..')
const playgroundRoot = join(repositoryRoot, 'apps', 'playground-react-native')
const expoCli = createRequire(join(playgroundRoot, 'package.json')).resolve('expo/bin/cli')
const iterations = Number(process.env.LUMEN_BENCHMARK_ITERATIONS ?? 3)
const platform = process.env.LUMEN_BENCHMARK_PLATFORM ?? 'android'

assert.ok(Number.isInteger(iterations) && iterations > 0, 'Iterations must be a positive integer')

assert.ok(['android', 'ios'].includes(platform), 'Platform must be android or ios')

// Rebuild the package graph so exports never measure stale workspace output.
const buildOutput = []

const build = spawn('pnpm', ['--filter', '@santi020k/lumen-react-native...', 'run', 'build'], {
  cwd: repositoryRoot,
  env: { ...process.env, CI: '1' },
  stdio: ['ignore', 'pipe', 'pipe']
})

build.stdout.on('data', chunk => buildOutput.push(chunk))

build.stderr.on('data', chunk => buildOutput.push(chunk))

const buildCode = await new Promise((resolve, reject) => {
  build.once('error', reject)

  build.once('close', resolve)
})

assert.equal(buildCode, 0, `Native package build failed: ${Buffer.concat(buildOutput).toString()}`)

// Keep generated applications out of the playground's source lint/type-check surface.
const benchmarkRoot = join(playgroundRoot, '.build')

await mkdir(benchmarkRoot, { recursive: true })

const fixtureRoot = await mkdtemp(join(benchmarkRoot, 'native-import-benchmark-'))
const manifest = JSON.parse(await readFile(join(playgroundRoot, 'package.json'), 'utf8'))
const iconSource = await readFile(join(repositoryRoot, 'packages/react-native/src/icons.generated.tsx'), 'utf8')
const searchStart = iconSource.indexOf('const LumenSearchIconGraphic =')
const searchEnd = iconSource.indexOf('\n\nconst ', searchStart)

assert.ok(searchStart >= 0 && searchEnd > searchStart, 'Expected the canonical search graphic fixture')

const searchGraphic = iconSource.slice(searchStart, searchEnd)
const svgElements = [...new Set([...searchGraphic.matchAll(/<([A-Z][A-Za-z]*)\b/g)].map(match => match[1]))].sort()

const scenarios = {
  baseline: `import { Button } from 'react-native'
export default function App() { return <Button title="Search" onPress={() => {}} /> }
`,
  'root-no-icon': `import { LumenButton, LumenProvider } from '@santi020k/lumen-react-native'
export default function App() { return <LumenProvider><LumenButton>Search</LumenButton></LumenProvider> }
`,
  foundations: `import { LumenButton, LumenProvider } from '@santi020k/lumen-react-native/foundations'
export default function App() { return <LumenProvider><LumenButton>Search</LumenButton></LumenProvider> }
`,
  graphics: `import type { ReactElement } from 'react'
import { ${svgElements.join(', ')} } from 'react-native-svg'
import { LumenIcon, LumenProvider, type LumenIconGraphicProps } from '@santi020k/lumen-react-native/graphics'
${searchGraphic}
export default function App() { return <LumenProvider><LumenIcon icon={LumenSearchIconGraphic} label="Search" /></LumenProvider> }
`,
  'root-icon': `import { LumenButton, LumenIcon, LumenProvider } from '@santi020k/lumen-react-native'
export default function App() { return <LumenProvider><LumenButton><LumenIcon name="search" decorative />Search</LumenButton></LumenProvider> }
`
}

const bytecodeSize = async directory => {
  let bytes = 0

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) bytes += await bytecodeSize(path)
    else if (entry.name.endsWith('.hbc')) bytes += (await stat(path)).size
  }

  return bytes
}

const exportFixture = async (scenario, iteration) => {
  const directory = join(fixtureRoot, `${scenario}-${iteration}`)

  await mkdir(directory)

  await writeFile(join(directory, 'package.json'), `${JSON.stringify({ ...manifest, name: 'lumen-native-import-benchmark', main: 'index.js' })}\n`)

  await writeFile(join(directory, 'app.json'), JSON.stringify({ expo: { name: 'Lumen benchmark', slug: 'lumen-benchmark' } }))

  await writeFile(join(directory, 'index.js'), "import { registerRootComponent } from 'expo'\nimport App from './App'\nregisterRootComponent(App)\n")

  await writeFile(join(directory, 'App.tsx'), scenarios[scenario])

  const start = performance.now()

  const child = spawn(process.execPath, [expoCli, 'export', '--platform', platform, '--max-workers', '2'], {
    cwd: directory,
    env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  const output = []

  child.stdout.on('data', chunk => output.push(chunk))

  child.stderr.on('data', chunk => output.push(chunk))

  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject)

    child.once('close', resolve)
  })

  assert.equal(exitCode, 0, `Expo export failed: ${Buffer.concat(output).toString()}`)

  const bundleBytes = await bytecodeSize(join(directory, 'dist'))

  assert.ok(bundleBytes > 0, 'Expected production Hermes bytecode, not a web or debug bundle')

  return { bundleBytes, durationMs: Math.round(performance.now() - start) }
}

const median = values => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)]
const report = { platform, engine: 'Hermes', iterations, scenarios: {} }

try {
  for (const scenario of Object.keys(scenarios)) {
    const samples = []

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      samples.push(await exportFixture(scenario, iteration))
    }

    report.scenarios[scenario] = {
      bundleBytes: median(samples.map(sample => sample.bundleBytes)),
      durationMs: median(samples.map(sample => sample.durationMs)),
      samples
    }
  }

  if (process.argv.includes('--check')) {
    const budgets = JSON.parse(await readFile(join(repositoryRoot, 'registry', 'react-native-import-budgets.json'), 'utf8'))
    const baseline = report.scenarios.baseline.bundleBytes
    const foundations = report.scenarios.foundations.bundleBytes

    assert.ok(foundations - baseline <= budgets.foundationOverheadBytes, 'Foundation import exceeds its Hermes overhead budget')

    assert.ok(report.scenarios.graphics.bundleBytes - baseline <= budgets.graphicsOverheadBytes, 'Static graphics import exceeds its Hermes overhead budget')

    assert.ok(report.scenarios['root-icon'].bundleBytes <= budgets.rootBundleBytes, 'Root import exceeds its Hermes bundle budget')
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
} finally {
  await rm(fixtureRoot, { force: true, recursive: true })
}

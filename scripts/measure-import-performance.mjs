import { spawn } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readdir,
  rm,
  stat,
  writeFile
} from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtureRoot = await mkdtemp(join(repoRoot, 'apps', 'docs', '.lumen-import-benchmark-'))
const iterations = Math.max(1, Number(process.env.LUMEN_BENCHMARK_ITERATIONS ?? 3))

const pages = {
  deep: `---
import Button from '@santi020k/lumen-astro/components/Button'
import Card from '@santi020k/lumen-astro/components/Card'
import Icon from '@santi020k/lumen-astro/components/Icon'
---
<Card><Button><Icon name="search" decorative /> Search</Button></Card>
`,
  'deep-no-icon': `---
import Button from '@santi020k/lumen-astro/components/Button'
import Card from '@santi020k/lumen-astro/components/Card'
---
<Card><Button>Search</Button></Card>
`,
  root: `---
import { Button, Card, Icon } from '@santi020k/lumen-astro'
---
<Card><Button><Icon name="search" decorative /> Search</Button></Card>
`,
  'root-no-icon': `---
import { Button, Card } from '@santi020k/lumen-astro'
---
<Card><Button>Search</Button></Card>
`
}

const directorySize = async directory => {
  let bytes = 0

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) bytes += await directorySize(path)
    else bytes += (await stat(path)).size
  }

  return bytes
}

const sampleRss = async pid => {
  const child = spawn('ps', ['-o', 'rss=', '-p', String(pid)], { stdio: ['ignore', 'pipe', 'ignore'] })
  let output = ''

  for await (const chunk of child.stdout) output += chunk

  return Number(output.trim()) * 1024 || 0
}

const runBuild = async (name, iteration) => {
  const root = join(fixtureRoot, `${name}-${iteration}`)

  await mkdir(join(root, 'src', 'pages'), { recursive: true })

  await writeFile(join(root, 'src', 'pages', 'index.astro'), pages[name])

  const start = performance.now()

  const child = spawn(
    'pnpm',
    ['--filter', '@santi020k/lumen-docs', 'exec', 'astro', 'build', '--root', root],
    {
    cwd: repoRoot,
    env: { ...process.env, NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  let peakRssBytes = 0
  let stdout = ''
  let stderr = ''

  const sampler = setInterval(async () => {
    peakRssBytes = Math.max(peakRssBytes, await sampleRss(child.pid))
  }, 20)

  for await (const chunk of child.stdout) stdout += chunk

  for await (const chunk of child.stderr) stderr += chunk

  const exitCode = await new Promise(resolve => child.once('close', resolve))

  clearInterval(sampler)

  if (exitCode !== 0) throw new Error(`${name} build failed:\n${stdout}\n${stderr}`)

  return {
    durationMs: performance.now() - start,
    outputBytes: await directorySize(join(root, 'dist')),
    peakRssBytes
  }
}

const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0
const report = { generatedAt: new Date().toISOString(), iterations, scenarios: {} }

try {
  for (const name of Object.keys(pages)) {
    const results = []

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      results.push(await runBuild(name, iteration))
    }

    report.scenarios[name] = {
      durationMs: median(results.map(result => result.durationMs)),
      outputBytes: median(results.map(result => result.outputBytes)),
      peakRssBytes: median(results.map(result => result.peakRssBytes)),
      samples: results
    }
  }

  process.stdout.write(`${JSON.stringify(report, undefined, 2)}\n`)
} finally {
  await rm(fixtureRoot, { force: true, recursive: true })
}

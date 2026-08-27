import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const fixtureRoot = await mkdtemp(
  join(repositoryRoot, 'apps', 'next-smoke', '.lumen-server-benchmark-')
)

const iterations = Math.max(
  1,
  Number(process.env.LUMEN_BENCHMARK_ITERATIONS ?? 3)
)

const pages = {
  'client-root': `import { Badge, Progress, Skeleton } from '@santi020k/lumen-react'

export default function Page() {
  return <main><Badge>Ready</Badge><Progress value={72} /><Skeleton /></main>
}
`,
  'server-entry': `import { Badge, Progress, Skeleton } from '@santi020k/lumen-react/server'

export default function Page() {
  return <main><Badge>Ready</Badge><Progress value={72} /><Skeleton /></main>
}
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

const runBuild = async (name, iteration) => {
  const root = join(fixtureRoot, `${name}-${iteration}`)

  await mkdir(join(root, 'app'), { recursive: true })

  await writeFile(
    join(root, 'app', 'layout.tsx'),
    `import type { ReactNode } from 'react'

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
`
  )

  await writeFile(join(root, 'app', 'page.tsx'), pages[name])

  await writeFile(
    join(root, 'package.json'),
    `${JSON.stringify({ private: true, type: 'module' })}\n`
  )

  const start = performance.now()

  const child = spawn(
    'pnpm',
    ['--filter', '@santi020k/lumen-next-smoke', 'exec', 'next', 'build', root],
    {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
        NO_COLOR: '1'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  let output = ''

  for await (const chunk of child.stdout) output += chunk

  for await (const chunk of child.stderr) output += chunk

  const exitCode = await new Promise(resolve => {
    child.once('close', resolve)
  })

  if (exitCode !== 0) throw new Error(`${name} build failed:\n${output}`)

  return {
    clientOutputBytes: await directorySize(join(root, '.next', 'static')),
    durationMs: performance.now() - start
  }
}

const median = values =>
  [...values].sort((left, right) => left - right)[
    Math.floor(values.length / 2)
  ] ?? 0

const report = {
  generatedAt: new Date().toISOString(),
  iterations,
  scenarios: {}
}

try {
  for (const name of Object.keys(pages)) {
    const samples = []

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      samples.push(await runBuild(name, iteration))
    }

    report.scenarios[name] = {
      clientOutputBytes: median(
        samples.map(sample => sample.clientOutputBytes)
      ),
      durationMs: median(samples.map(sample => sample.durationMs)),
      samples
    }
  }

  process.stdout.write(`${JSON.stringify(report, undefined, 2)}\n`)
} finally {
  await rm(fixtureRoot, { force: true, recursive: true })
}

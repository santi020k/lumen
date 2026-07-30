import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const distEntry = join(packageRoot, 'dist/index.js')

const filesIn = async directory => {
  const fs = await import('node:fs/promises')
  const entries = await fs.readdir(directory, { withFileTypes: true })

  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name)

    return entry.isDirectory() ? filesIn(path) : [path]
  }))

  return nested.flat()
}

const needsBuild = async () => {
  const fs = await import('node:fs/promises')

  try {
    await fs.access(distEntry)
  } catch {
    return true
  }

  const outputTime = (await fs.stat(distEntry)).mtimeMs
  const sourceFiles = await filesIn(join(packageRoot, 'src'))
  const sourceTimes = await Promise.all(sourceFiles.map(async path => (await fs.stat(path)).mtimeMs))

  return sourceTimes.some(modifiedTime => modifiedTime > outputTime)
}

if (await needsBuild()) {
  const build = spawnSync(
    'pnpm', ['--filter', '@santi020k/lumen-mcp', 'build'], {
      cwd: repoRoot,
      stdio: ['ignore', process.stderr, process.stderr]
    }
  )

  if (build.status !== 0) {
    process.exitCode = build.status ?? 1
  }
}

if (!process.exitCode) {
  const { startLumenMcp } = await import('../dist/index.js')

  await startLumenMcp()
}

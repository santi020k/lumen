
import { spawnSync } from 'node:child_process'
import { access, readdir as readDirectory, stat as getStat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const distEntry = join(packageRoot, 'dist/index.js')

const filesIn = async (directory) => {
  const entries = await readDirectory(directory, { withFileTypes: true })

  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)

    return entry.isDirectory() ? filesIn(path) : [path]
  }))

  return nested.flat()
}

const needsBuild = async () => {
  try {
    await access(distEntry)
  } catch {
    return true
  }

  const outputTime = (await getStat(distEntry)).mtimeMs
  const sourceFiles = await filesIn(join(packageRoot, 'src'))
  const sourceTimes = await Promise.all(sourceFiles.map(async (path) => (await getStat(path)).mtimeMs))

  return sourceTimes.some((modifiedTime) => modifiedTime > outputTime)
}

if (await needsBuild()) {
  const build = spawnSync(
    'pnpm',
    ['--filter', '@santi020k/lumen-mcp', 'build'],
    {
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

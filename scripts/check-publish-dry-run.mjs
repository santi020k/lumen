import { spawnSync } from 'node:child_process'

const packages = [
  '@santi020k/lumen',
  '@santi020k/lumen-core',
  '@santi020k/lumen-astro',
  '@santi020k/lumen-react',
  '@santi020k/lumen-react-hook-form',
  '@santi020k/lumen-elements',
  '@santi020k/lumen-icons-brand',
  '@santi020k/lumen-mcp'
]

for (const packageName of packages) {
  const result = spawnSync(
    'pnpm',
    ['--filter', packageName, 'pack', '--dry-run'],
    { encoding: 'utf8', stdio: 'pipe' }
  )

  if (result.status !== 0) {
    process.stderr.write(result.stderr)

    process.stderr.write(result.stdout)

    throw new Error(`Publish dry run failed for ${packageName}`)
  }

  process.stdout.write(`Checked publish contents for ${packageName}\n`)
}

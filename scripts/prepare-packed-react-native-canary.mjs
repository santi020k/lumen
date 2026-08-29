import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const playgroundDirectory = join(repositoryRoot, 'apps', 'playground-react-native')
const manifestPath = join(playgroundDirectory, 'package.json')
const originalManifest = await readFile(manifestPath, 'utf8')
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'lumen-packed-rn-canary-'))

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' })

  if (result.status !== 0) {
    process.stderr.write(result.stdout)

    process.stderr.write(result.stderr)

    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`)
  }
}

try {
  for (const packageName of ['core', 'react-native']) {
    run('pnpm', ['pack', '--pack-destination', temporaryDirectory], join(repositoryRoot, 'packages', packageName))
  }

  const archiveNames = (await readdir(temporaryDirectory)).filter(name => name.endsWith('.tgz'))

  assert.equal(archiveNames.length, 2, 'Expected packed Core and React Native archives')

  const coreArchiveName = archiveNames.find(name => name.includes('lumen-core-'))
  const reactNativeArchiveName = archiveNames.find(name => name.includes('lumen-react-native-'))

  assert.ok(coreArchiveName, 'Expected a packed Core archive')

  assert.ok(reactNativeArchiveName, 'Expected a packed React Native archive')

  for (const archiveName of [coreArchiveName, reactNativeArchiveName]) {
    run(
      'pnpm',
      [
        'add',
        '--config.link-workspace-packages=deep',
        '--ignore-scripts',
        '--lockfile=false',
        '--save-prod',
        join(temporaryDirectory, archiveName),
      ],
      playgroundDirectory
    )
  }
} finally {
  await writeFile(manifestPath, originalManifest)

  await rm(temporaryDirectory, { force: true, recursive: true })
}

process.stdout.write('React Native playground now resolves packed Core and adapter archives.\n')

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const playgroundDirectory = join(repositoryRoot, 'apps', 'playground-react-native')
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

  for (const [packageName, archiveName] of [
    ['lumen-core', coreArchiveName],
    ['lumen-react-native', reactNativeArchiveName]
  ]) {
    const installDirectory = join(
      playgroundDirectory,
      'node_modules',
      '@santi020k',
      packageName
    )

    await rm(installDirectory, { force: true, recursive: true })

    await mkdir(installDirectory, { recursive: true })

    run(
      'tar',
      [
        '-xzf',
        join(temporaryDirectory, archiveName),
        '--strip-components=1',
        '-C',
        installDirectory,
      ],
      repositoryRoot
    )
  }

  const packedCoreDirectory = join(
    playgroundDirectory,
    'node_modules',
    '@santi020k',
    'lumen-core'
  )

  const packedCoreManifest = JSON.parse(
    await readFile(join(packedCoreDirectory, 'package.json'), 'utf8')
  )

  assert.equal(
    typeof packedCoreManifest.dependencies,
    'object',
    'Packed Core must declare its runtime dependencies'
  )

  for (const dependencyName of Object.keys(packedCoreManifest.dependencies)) {
    assert.match(
      dependencyName,
      /^(?:@[^/]+\/)?[^/]+$/u,
      `Packed Core contains an invalid dependency name: ${dependencyName}`
    )

    const dependencySegments = dependencyName.split('/')

    const source = join(
      repositoryRoot,
      'packages',
      'core',
      'node_modules',
      ...dependencySegments
    )

    const destination = join(
      packedCoreDirectory,
      'node_modules',
      ...dependencySegments
    )

    await mkdir(dirname(destination), { recursive: true })

    await cp(source, destination, { dereference: true, recursive: true })
  }
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true })
}

process.stdout.write('React Native playground now resolves packed Core and adapter archives.\n')

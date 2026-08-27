import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const packageDirectory = join(repositoryRoot, 'packages', 'react-native')
const sourceManifest = JSON.parse(await readFile(join(packageDirectory, 'package.json'), 'utf8'))
const temporaryRoot = await mkdtemp(join(tmpdir(), 'lumen-react-native-consumer-'))
const archiveDirectory = join(temporaryRoot, 'archive')
const consumerDirectory = join(temporaryRoot, 'consumer')

const run = (command, arguments_, cwd = repositoryRoot) => {
  const result = spawnSync(command, arguments_, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe'
  })

  if (result.status !== 0) {
    process.stderr.write(result.stdout)

    process.stderr.write(result.stderr)

    throw new Error(`${command} ${arguments_.join(' ')} failed with status ${result.status}`)
  }

  return result.stdout
}

try {
  await Promise.all([
    mkdir(archiveDirectory, { recursive: true }),
    mkdir(consumerDirectory, { recursive: true })
  ])

  run('pnpm', ['pack', '--pack-destination', archiveDirectory], packageDirectory)

  const archives = (await readdir(archiveDirectory)).filter(name => name.endsWith('.tgz'))

  assert.equal(archives.length, 1, 'Expected one React Native package archive')

  await writeFile(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      { name: 'lumen-react-native-consumer-smoke', private: true, type: 'module' },
      null,
      2
    )}\n`
  )

  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      join(archiveDirectory, archives[0]),
      '@types/react@19.2.18',
      'react@19.2.3',
      'react-native@0.86.2',
      'react-native-svg@15.15.4',
      'typescript@6.0.3'
    ],
    consumerDirectory
  )

  const installedPackageDirectory = join(
    consumerDirectory,
    'node_modules',
    '@santi020k',
    'lumen-react-native'
  )

  const installedManifest = JSON.parse(
    await readFile(join(installedPackageDirectory, 'package.json'), 'utf8')
  )

  assert.equal(installedManifest.version, sourceManifest.version)

  assert.deepEqual(installedManifest.peerDependencies, sourceManifest.peerDependencies)

  assert.deepEqual(installedManifest.peerDependenciesMeta, sourceManifest.peerDependenciesMeta)

  assert.equal(
    installedManifest.exports['./datetime'].import,
    './dist/datetime.js'
  )

  await Promise.all([
    access(join(installedPackageDirectory, 'dist', 'datetime.d.ts')),
    access(join(installedPackageDirectory, 'dist', 'datetime.js')),
    access(join(installedPackageDirectory, 'dist', 'index.js')),
    access(join(installedPackageDirectory, 'dist', 'index.d.ts')),
    access(join(installedPackageDirectory, 'LICENSE')),
    access(join(installedPackageDirectory, 'README.md')),
    access(join(installedPackageDirectory, 'THIRD_PARTY_NOTICES.md'))
  ])

  await assert.rejects(
    access(join(consumerDirectory, 'node_modules', '@react-native-community', 'datetimepicker', 'package.json')),
    { code: 'ENOENT' },
    'The root React Native consumer must not install the optional datetime picker'
  )

  await writeFile(
    join(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          exactOptionalPropertyTypes: true,
          jsx: 'react-jsx',
          lib: ['ES2022'],
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          noEmit: true,
          noUncheckedIndexedAccess: true,
          skipLibCheck: true,
          strict: true,
          target: 'ES2022',
          verbatimModuleSyntax: true
        },
        include: ['index.tsx']
      },
      null,
      2
    )}\n`
  )

  await writeFile(
    join(consumerDirectory, 'index.tsx'),
    `import { type ReactElement, useState } from 'react'

import {
  LumenButton,
  LumenProvider,
  LumenSurface,
  LumenText,
  LumenTextField,
  LumenToggle
} from '@santi020k/lumen-react-native'
import { type LumenDateRangeValue } from '@santi020k/lumen-react-native/datetime'

export function PackedConsumer(): ReactElement {
  const [enabled, setEnabled] = useState(false)
  const [name, setName] = useState('')
  const range: LumenDateRangeValue = { end: null, start: null }

  return (
    <LumenProvider scheme="light">
      <LumenSurface padding="md">
        <LumenText variant="title">Packed consumer {range.start?.toISOString()}</LumenText>
        <LumenTextField
          accessibilityLabel="Name"
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <LumenToggle label="Enabled" value={enabled} onValueChange={setEnabled} />
        <LumenButton onPress={() => setEnabled(true)}>Continue</LumenButton>
      </LumenSurface>
    </LumenProvider>
  )
}
`
  )

  run(
    process.execPath,
    [join(consumerDirectory, 'node_modules', 'typescript', 'bin', 'tsc')],
    consumerDirectory
  )

  process.stdout.write(
    `Packed @santi020k/lumen-react-native@${sourceManifest.version} passed clean install, peer, ` +
      'contents, and strict TypeScript consumer checks.\n'
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}

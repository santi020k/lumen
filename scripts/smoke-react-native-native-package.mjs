import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const packageDirectory = join(repositoryRoot, 'packages', 'react-native')
const playgroundPackageName = '@santi020k/lumen-playground-react-native'
const supportedPlatforms = new Set(['android', 'ios'])
const requestedPlatform = process.argv[2]

const readOption = name => {
  const index = process.argv.indexOf(name)

  if (index === -1) return undefined

  const value = process.argv[index + 1]

  assert.ok(value && !value.startsWith('--'), `${name} requires a value`)

  return value
}

const releaseVersion = readOption('--version')

assert.ok(
  requestedPlatform && supportedPlatforms.has(requestedPlatform),
  'Pass exactly one native platform: android or ios'
)

if (releaseVersion) {
  assert.match(
    releaseVersion,
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-z.-]+)?$/i,
    '--version must be an exact semantic version'
  )
}

if (requestedPlatform === 'ios') {
  assert.equal(process.platform, 'darwin', 'The iOS native package smoke test requires macOS')
}

const commandEnvironment = {
  ...process.env,
  CI: '1',
  COCOAPODS_DISABLE_STATS: 'true',
  NODE_ENV: 'production'
}

const run = (command, arguments_, cwd = repositoryRoot) => {
  const result = spawnSync(command, arguments_, {
    cwd,
    encoding: 'utf8',
    env: commandEnvironment,
    maxBuffer: 50 * 1024 * 1024,
    stdio: 'pipe'
  })

  if (result.status !== 0) {
    process.stderr.write(result.stdout)

    process.stderr.write(result.stderr)

    throw new Error(`${command} ${arguments_.join(' ')} failed with status ${result.status}`)
  }

  return result.stdout
}

if (requestedPlatform === 'ios') {
  const podProbe = spawnSync('pod', ['--version'], {
    encoding: 'utf8',
    env: commandEnvironment,
    stdio: 'pipe'
  })

  assert.equal(
    podProbe.status,
    0,
    'CocoaPods is required for the packed iOS native package smoke test'
  )
}

const temporaryRoot = await mkdtemp(join(tmpdir(), `lumen-react-native-${requestedPlatform}-`))
const archiveDirectory = join(temporaryRoot, 'archive')
const consumerDirectory = join(temporaryRoot, 'consumer')

const getResolvedPlaygroundDependencies = () => {
  const output = run(
    'pnpm',
    ['--filter', playgroundPackageName, 'list', '--json', '--depth=0']
  )

  const projects = JSON.parse(output)

  assert.equal(projects.length, 1, 'Expected one React Native playground project')

  const project = projects[0]

  const dependencyEntries = {
    ...project.dependencies,
    ...project.devDependencies
  }

  const requiredNames = [
    '@types/react',
    'expo',
    'react',
    'react-native',
    'react-native-svg',
    'typescript'
  ]

  return Object.fromEntries(requiredNames.map(name => {
    const dependency = dependencyEntries[name]

    assert.equal(
      typeof dependency?.version,
      'string',
      `Could not resolve the playground version for ${name}`
    )

    return [name, dependency.version]
  }))
}

try {
  await Promise.all([
    mkdir(archiveDirectory, { recursive: true }),
    mkdir(consumerDirectory, { recursive: true })
  ])

  let packageReference
  let packageSource

  if (releaseVersion) {
    packageReference = releaseVersion

    packageSource = 'Published'
  } else {
    run('pnpm', ['--filter', '@santi020k/lumen-react-native...', 'run', 'build'])

    run('pnpm', ['pack', '--pack-destination', archiveDirectory], packageDirectory)

    const archives = (await readdir(archiveDirectory)).filter(name => name.endsWith('.tgz'))

    assert.equal(archives.length, 1, 'Expected one React Native package archive')

    packageReference = `file:${join(archiveDirectory, archives[0])}`

    packageSource = 'Packed'
  }

  const dependencies = getResolvedPlaygroundDependencies()

  await writeFile(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        dependencies: {
          '@santi020k/lumen-react-native': packageReference,
          expo: dependencies.expo,
          react: dependencies.react,
          'react-native': dependencies['react-native'],
          'react-native-svg': dependencies['react-native-svg']
        },
        devDependencies: {
          '@types/react': dependencies['@types/react'],
          typescript: dependencies.typescript
        },
        main: 'index.ts',
        name: 'lumen-packed-native-consumer',
        private: true,
        version: '1.0.0'
      },
      null,
      2
    )}\n`
  )

  await writeFile(
    join(consumerDirectory, 'app.json'),
    `${JSON.stringify(
      {
        expo: {
          android: { package: 'com.santi020k.lumen.consumer' },
          ios: { bundleIdentifier: 'com.santi020k.lumen.consumer' },
          name: 'PackedLumen',
          newArchEnabled: true,
          slug: 'packed-lumen',
          version: '1.0.0'
        }
      },
      null,
      2
    )}\n`
  )

  await writeFile(
    join(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          exactOptionalPropertyTypes: true,
          jsx: 'react-jsx',
          noEmit: true,
          noUncheckedIndexedAccess: true,
          skipLibCheck: true,
          strict: true
        },
        extends: 'expo/tsconfig.base',
        include: ['index.ts', 'src/**/*.tsx']
      },
      null,
      2
    )}\n`
  )

  await writeFile(
    join(consumerDirectory, 'index.ts'),
    `import { registerRootComponent } from 'expo'

import App from './src/App'

registerRootComponent(App)
`
  )

  await mkdir(join(consumerDirectory, 'src'), { recursive: true })

  await writeFile(
    join(consumerDirectory, 'src', 'App.tsx'),
    `import { type ReactElement, useState } from 'react'

import {
  LumenButton,
  LumenProvider,
  LumenSurface,
  LumenText,
  LumenTextField,
  LumenToggle
} from '@santi020k/lumen-react-native'

export default function App(): ReactElement {
  const [enabled, setEnabled] = useState(false)
  const [name, setName] = useState('')

  return (
    <LumenProvider scheme="light">
      <LumenSurface padding="md" tone="canvas">
        <LumenText variant="title">Packed native consumer</LumenText>
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

  run('npm', ['install', '--no-audit', '--no-fund'], consumerDirectory)

  const installedManifest = JSON.parse(
    await readFile(
      join(consumerDirectory, 'node_modules', '@santi020k', 'lumen-react-native', 'package.json'),
      'utf8'
    )
  )

  if (releaseVersion) {
    assert.equal(
      installedManifest.version,
      releaseVersion,
      'The clean consumer did not install the requested React Native release'
    )
  }

  run(
    process.execPath,
    [join(consumerDirectory, 'node_modules', 'typescript', 'bin', 'tsc')],
    consumerDirectory
  )

  run(
    'npx',
    ['expo', 'prebuild', '--clean', '--platform', requestedPlatform],
    consumerDirectory
  )

  if (requestedPlatform === 'android') {
    run(join(consumerDirectory, 'android', 'gradlew'), ['-p', 'android', 'assembleDebug'], consumerDirectory)

    await access(join(consumerDirectory, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'))
  } else {
    const derivedDataPath = join(temporaryRoot, 'DerivedData')

    run(
      'xcodebuild',
      [
        '-workspace',
        'ios/PackedLumen.xcworkspace',
        '-scheme',
        'PackedLumen',
        '-destination',
        'generic/platform=iOS Simulator',
        '-derivedDataPath',
        derivedDataPath,
        'CODE_SIGNING_ALLOWED=NO',
        'build'
      ],
      consumerDirectory
    )

    await access(join(derivedDataPath, 'Build', 'Products', 'Debug-iphonesimulator', 'PackedLumen.app'))
  }

  process.stdout.write(
    `${packageSource} @santi020k/lumen-react-native@${installedManifest.version} produced a clean `
      + `${requestedPlatform} native debug application.\n`
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}

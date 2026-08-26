import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const repositoryRoot = resolve(import.meta.dirname, '..')

const readOption = name => {
  const index = process.argv.indexOf(name)

  if (index === -1) return undefined

  const value = process.argv[index + 1]

  assert.ok(value && !value.startsWith('--'), `${name} requires a value`)

  return value
}

const releaseUrl = readOption('--url')
const releaseVersion = readOption('--version')

assert.equal(
  Boolean(releaseUrl),
  Boolean(releaseVersion),
  '--url and --version must be provided together'
)

if (releaseVersion) {
  assert.match(
    releaseVersion,
    /^\d+\.\d+\.\d+(?:-[\da-z.-]+)?$/i,
    '--version must be a semantic version without a v prefix'
  )
}

const run = (command, arguments_, cwd = repositoryRoot) => {
  const result = spawnSync(command, arguments_, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, CI: '1' },
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

const resolveRemoteRevision = (url, version) => {
  const tag = `v${version}`

  const lines = run('git', ['ls-remote', '--tags', url, `refs/tags/${tag}*`])
    .trim()
    .split('\n')
    .filter(Boolean)

  const peeled = lines.find(line => line.endsWith(`refs/tags/${tag}^{}`))
  const direct = lines.find(line => line.endsWith(`refs/tags/${tag}`))
  const match = peeled ?? direct

  assert.ok(match, `Could not resolve ${tag} from ${url}`)

  return match.split(/\s+/)[0]
}

const temporaryRoot = await mkdtemp(join(tmpdir(), 'lumen-swift-candidate-'))
const candidateDirectory = join(temporaryRoot, 'lumen')
const consumerDirectory = join(temporaryRoot, 'consumer')

try {
  await Promise.all([
    mkdir(join(candidateDirectory, 'packages'), { recursive: true }),
    mkdir(join(consumerDirectory, 'Sources', 'SwiftTaggedConsumer'), { recursive: true })
  ])

  let candidateLabel
  let candidateRevision
  let candidateUrl
  let candidateVersion

  if (releaseUrl && releaseVersion) {
    candidateLabel = `v${releaseVersion}`

    candidateRevision = resolveRemoteRevision(releaseUrl, releaseVersion)

    candidateUrl = releaseUrl

    candidateVersion = releaseVersion
  } else {
    candidateLabel = 'v999.0.0-rc.1'

    candidateVersion = candidateLabel.slice(1)

    await Promise.all([
      cp(
        join(repositoryRoot, 'packages', 'swift'),
        join(candidateDirectory, 'packages', 'swift'),
        {
          filter: source => !source.split('/').includes('.build'),
          recursive: true
        }
      ),
      cp(join(repositoryRoot, 'Package.swift'), join(candidateDirectory, 'Package.swift')),
      cp(join(repositoryRoot, 'LICENSE'), join(candidateDirectory, 'LICENSE')),
      cp(
        join(repositoryRoot, 'THIRD_PARTY_NOTICES.md'),
        join(candidateDirectory, 'THIRD_PARTY_NOTICES.md')
      )
    ])

    run('git', ['init', '--initial-branch=main'], candidateDirectory)

    run('git', ['config', 'user.email', 'release-canary@santi020k.com'], candidateDirectory)

    run('git', ['config', 'user.name', 'Lumen Release Canary'], candidateDirectory)

    run('git', ['add', '--all'], candidateDirectory)

    run('git', ['commit', '--message', 'test: create disposable Swift candidate'], candidateDirectory)

    run('git', ['tag', candidateLabel], candidateDirectory)

    // SwiftPM performs a local clone for file URLs. Pack the disposable
    // repository first so concurrent object discovery cannot race with Git's
    // loose-object directory creation on current macOS runners.
    run('git', ['repack', '-a', '-d'], candidateDirectory)

    candidateRevision = run('git', ['rev-parse', 'HEAD'], candidateDirectory).trim()

    candidateUrl = pathToFileURL(candidateDirectory).href
  }

  await writeFile(
    join(consumerDirectory, 'Package.swift'),
    `// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftTaggedConsumer",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
        .tvOS(.v16),
        .watchOS(.v9)
    ],
    dependencies: [
        .package(url: ${JSON.stringify(candidateUrl)}, exact: "${candidateVersion}")
    ],
    targets: [
        .executableTarget(
            name: "SwiftTaggedConsumer",
            dependencies: [
                .product(name: "LumenUI", package: "lumen")
            ]
        )
    ]
)
`
  )

  await writeFile(
    join(consumerDirectory, 'Sources', 'SwiftTaggedConsumer', 'SwiftTaggedConsumer.swift'),
    `import LumenUI
import SwiftUI

@main
struct SwiftTaggedConsumer: App {
    var body: some Scene {
        WindowGroup {
            LumenSurface {
                LumenText("Tagged Lumen consumer", variant: .title)
            }
            .lumenTheme(.light)
        }
    }
}
`
  )

  run('swift', ['package', 'resolve'], consumerDirectory)

  const resolved = JSON.parse(
    await readFile(join(consumerDirectory, 'Package.resolved'), 'utf8')
  )

  assert.equal(resolved.pins.length, 1, 'Expected one resolved Swift package')

  assert.equal(resolved.pins[0].identity, 'lumen')

  assert.equal(resolved.pins[0].state.version, candidateVersion)

  assert.equal(resolved.pins[0].state.revision, candidateRevision)

  const checkouts = await readdir(join(consumerDirectory, '.build', 'checkouts'))

  assert.deepEqual(checkouts, ['lumen'])

  const checkoutDirectory = join(consumerDirectory, '.build', 'checkouts', 'lumen')

  await Promise.all([
    access(join(checkoutDirectory, 'LICENSE')),
    access(join(checkoutDirectory, 'THIRD_PARTY_NOTICES.md')),
    access(join(checkoutDirectory, 'packages', 'swift', 'LICENSE')),
    access(join(checkoutDirectory, 'packages', 'swift', 'THIRD_PARTY_NOTICES.md')),
    access(
      join(
        checkoutDirectory,
        'packages',
        'swift',
        'Sources',
        'LumenUI',
        'Resources',
        'LumenIcons.xcassets',
        'Contents.json'
      )
    )
  ])

  run('swift', ['build'], consumerDirectory)

  const destinations = [
    ['iOS', 'generic/platform=iOS Simulator'],
    ['tvOS', 'generic/platform=tvOS Simulator'],
    ['watchOS', 'generic/platform=watchOS Simulator']
  ]

  for (const [platform, destination] of destinations) {
    run(
      'xcodebuild',
      [
        '-scheme',
        'SwiftTaggedConsumer',
        '-destination',
        destination,
        '-derivedDataPath',
        join(temporaryRoot, `DerivedData-${platform}`),
        'CODE_SIGNING_ALLOWED=NO',
        'build'
      ],
      consumerDirectory
    )
  }

  process.stdout.write(
    `Resolved Swift candidate ${candidateLabel} at ${candidateRevision.slice(0, 12)} and `
      + 'built its clean consumer for macOS, iOS, tvOS, and watchOS with notices and resources.\n'
  )
} finally {
  await rm(temporaryRoot, { force: true, recursive: true })
}

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { appendFile, mkdtemp, readdir,readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const repositoryRoot = resolve(import.meta.dirname, '..')

export const runReleaseCommand = (command, arguments_, options = {}) => {
  const result = spawnSync(command, arguments_, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: options.environment ?? process.env,
    stdio: options.capture ? 'pipe' : 'inherit'
  })

  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stdout)

      process.stderr.write(result.stderr)
    }

    throw new Error(`${command} ${arguments_.join(' ')} failed with status ${result.status}`)
  }

  return result.stdout
}

export const classifyReleasePackages = packageNames => {
  const names = new Set(packageNames)
  const intersects = candidates => candidates.some(name => names.has(name))

  return {
    mcp: intersects([
      '@santi020k/lumen-mcp',
      '@santi020k/lumen-core',
      '@santi020k/lumen-astro',
      '@santi020k/lumen-react',
      '@santi020k/lumen-elements',
      '@santi020k/lumen-tokens'
    ]),
    mcpPackage: names.has('@santi020k/lumen-mcp'),
    native: intersects([
      '@santi020k/lumen-core',
      '@santi020k/lumen-react-native',
      '@santi020k/lumen-tokens'
    ]),
    reactNative: intersects([
      '@santi020k/lumen-core',
      '@santi020k/lumen-react-native',
      '@santi020k/lumen-tokens'
    ]),
    web: intersects([
      '@santi020k/lumen',
      '@santi020k/lumen-core',
      '@santi020k/lumen-astro',
      '@santi020k/lumen-react',
      '@santi020k/lumen-react-hook-form',
      '@santi020k/lumen-elements',
      '@santi020k/lumen-icons-brand'
    ])
  }
}

const readPublicPackages = async () => {
  const packageRoot = resolve(repositoryRoot, 'packages')
  const directories = await readdir(packageRoot, { withFileTypes: true })
  const packages = []

  for (const directory of directories) {
    if (!directory.isDirectory()) continue

    const manifestPath = join(packageRoot, directory.name, 'package.json')
    let manifest

    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    } catch (error) {
      if (error?.code === 'ENOENT') continue

      throw error
    }

    if (manifest.private || typeof manifest.name !== 'string' || typeof manifest.version !== 'string') continue

    packages.push({ name: manifest.name, version: manifest.version })
  }

  return packages.sort((left, right) => left.name.localeCompare(right.name))
}

export const mergeReleasePackageNames = ({ pending = [], unpublished = [] }) => [
  ...new Set([...pending, ...unpublished])
].sort((left, right) => left.localeCompare(right))

const readPendingReleaseNames = async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'lumen-release-scope-'))
  const outputPath = join(temporaryDirectory, 'status.json')

  const result = spawnSync(
    'pnpm',
    ['changeset', 'status', '--output', outputPath],
    { cwd: repositoryRoot, encoding: 'utf8', stdio: 'pipe' }
  )

  if (result.status !== 0) {
    const changesetFiles = (await readdir(resolve(repositoryRoot, '.changeset')))
      .filter(name => name.endsWith('.md'))

    if (changesetFiles.length > 0) {
      process.stderr.write(result.stdout)

      process.stderr.write(result.stderr)

      throw new Error('Unable to resolve the pending Changesets release plan')
    }

    return []
  }

  const status = JSON.parse(await readFile(outputPath, 'utf8'))

  assert.ok(Array.isArray(status.releases), 'Changesets status must contain a releases array')

  return status.releases.map(release => release.name)
}

const readUnpublishedPackageNames = async packages => {
  const unpublished = []

  for (const package_ of packages) {
    const result = spawnSync(
      'npm',
      ['view', package_.name, 'versions', '--json'],
      { cwd: repositoryRoot, encoding: 'utf8', stdio: 'pipe' }
    )

    if (result.status !== 0) {
      if (/E404|404 Not Found/u.test(`${result.stdout}\n${result.stderr}`)) {
        unpublished.push(package_.name)

        continue
      }

      process.stderr.write(result.stdout)

      process.stderr.write(result.stderr)

      throw new Error(`Unable to read published versions for ${package_.name}`)
    }

    const versionsSource = JSON.parse(result.stdout)
    const versions = Array.isArray(versionsSource) ? versionsSource : [versionsSource]

    if (!versions.includes(package_.version)) unpublished.push(package_.name)
  }

  return unpublished
}

export const resolveReleasePackageNames = async () => {
  const packages = await readPublicPackages()

  const [pending, unpublished] = await Promise.all([
    readPendingReleaseNames(),
    readUnpublishedPackageNames(packages)
  ])

  const knownNames = new Set(packages.map(package_ => package_.name))
  const names = mergeReleasePackageNames({ pending, unpublished })

  for (const name of names) assert.ok(knownNames.has(name), `Unknown release package ${name}`)

  return names
}

export const readReleasePackageNamesFromEnvironment = () => {
  const source = process.env.LUMEN_RELEASE_PACKAGES

  assert.ok(source, 'LUMEN_RELEASE_PACKAGES must be set by the release scope step')

  const names = JSON.parse(source)

  assert.ok(Array.isArray(names), 'LUMEN_RELEASE_PACKAGES must be a JSON array')

  assert.ok(names.every(name => typeof name === 'string'), 'Every release package must be a string')

  return [...new Set(names)].sort((left, right) => left.localeCompare(right))
}

const writeGitHubOutput = async names => {
  const outputPath = process.env.GITHUB_OUTPUT

  assert.ok(outputPath, 'GITHUB_OUTPUT is required')

  const classification = classifyReleasePackages(names)

  const entries = {
    'has-packages': names.length > 0,
    mcp: classification.mcp,
    'mcp-package': classification.mcpPackage,
    native: classification.native,
    packages: JSON.stringify(names),
    'react-native': classification.reactNative,
    web: classification.web
  }

  await appendFile(
    outputPath,
    `${Object.entries(entries).map(([name, value]) => `${name}=${value}`).join('\n')}\n`
  )
}

export const buildReleasePackages = names => {
  if (names.length === 0) {
    process.stdout.write('No npm packages require a release build.\n')

    return
  }

  runReleaseCommand('pnpm', [
    'exec',
    'turbo',
    'run',
    'build',
    ...names.map(name => `--filter=${name}`)
  ])
}

export const validateReleasePackages = names => {
  const classification = classifyReleasePackages(names)

  runReleaseCommand('node', ['scripts/check-approved-release-revision.mjs'])

  runReleaseCommand('pnpm', ['run', 'check:graduated-release-revision'])

  if (classification.web) runReleaseCommand('pnpm', ['run', 'check:web-consumer-evidence'])

  if (classification.mcp) {
    runReleaseCommand('pnpm', ['run', 'check:mcp-snapshot'])
  }

  if (classification.mcpPackage) {
    runReleaseCommand('pnpm', ['run', 'check:mcp-package'])
  }

  if (classification.native) {
    runReleaseCommand('pnpm', ['run', 'check:native-consumer-evidence'])

    runReleaseCommand('pnpm', ['run', 'check:native-stability-soak'])
  }
}

const runCli = async () => {
  const command = process.argv[2]

  if (command === '--github-output') {
    const names = await resolveReleasePackageNames()

    await writeGitHubOutput(names)

    process.stdout.write(`Release scope: ${names.join(', ') || 'none'}\n`)

    return
  }

  const names = readReleasePackageNamesFromEnvironment()

  if (command === '--build') {
    buildReleasePackages(names)

    return
  }

  if (command === '--validate-and-build') {
    buildReleasePackages(names)

    validateReleasePackages(names)

    return
  }

  throw new Error('Expected --github-output, --build, or --validate-and-build')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli()
}

import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const files = ['code.js', 'manifest.json', 'ui.html']
const digest = contents => createHash('sha256').update(contents).digest('hex')

const readVersion = async root => {
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

  if (typeof version !== 'string' || version.length > 64 || !/^\d+\.\d+\.\d+(?:-[\da-z.-]+)?$/iu.test(version)) {
    throw new Error('The plugin package version must be safe to use in an artifact filename.')
  }

  return version
}

const readManifest = async root => {
  const sourceManifest = await readFile(join(root, 'manifest.json'))
  const builtManifest = await readFile(join(root, 'dist/manifest.json'))

  if (!sourceManifest.equals(builtManifest)) throw new Error('The manifest changed. Rebuild before packaging.')

  const manifest = JSON.parse(builtManifest.toString('utf8'))

  if (manifest.main !== 'code.js' || manifest.ui !== 'ui.html' || manifest.networkAccess?.allowedDomains?.join() !== 'none') {
    throw new Error('The beta package must contain code.js, ui.html, and no network access.')
  }

  if (manifest.id !== undefined && (typeof manifest.id !== 'string' || !/^\d+$/u.test(manifest.id))) {
    throw new Error('Use the numeric plugin ID assigned by Figma, or omit it for development.')
  }

  return manifest
}

export const packagePlugin = async (root, { revision, dirty }) => {
  if (!/^[a-f0-9]{40}$/u.test(revision) || typeof dirty !== 'boolean') {
    throw new Error('Packaging requires a Git commit and an explicit working-tree status.')
  }

  const version = await readVersion(root)
  const manifest = await readManifest(root)
  const staging = await mkdtemp(join(tmpdir(), 'lumen-figma-package-'))
  const output = join(root, 'dist/artifacts')
  const archiveName = `lumen-figma-${version}-${revision.slice(0, 12)}${dirty ? '-dirty' : ''}.zip`

  try {
    const hashes = {}

    for (const name of files) {
      const contents = await readFile(join(root, 'dist', name))

      if (contents.length === 0) throw new Error(`Cannot package empty ${name}.`)

      hashes[name] = digest(contents)

      await writeFile(join(staging, name), contents)
    }

    const metadata = {
      version,
      revision,
      dirty,
      pluginId: manifest.id ?? null,
      communityStatus: 'Not published by this build. Publish from Figma desktop after host verification.',
      sha256: hashes
    }

    const metadataText = `${JSON.stringify(metadata, null, 2)}\n`

    await writeFile(join(staging, 'release.json'), metadataText)

    const entries = [...files, 'release.json']
    const timestamp = new Date('2000-01-01T00:00:00Z')

    for (const name of entries) {
      await chmod(join(staging, name), 0o644)

      await utimes(join(staging, name), timestamp, timestamp)
    }

    // Fixed order, permissions, timestamps, and no extra attributes keep repeated builds identical.
    await execute('zip', ['-X', '-q', '-9', join(staging, archiveName), ...entries], {
      cwd: staging,
      env: { ...process.env, TZ: 'UTC' }
    })

    const archiveHash = digest(await readFile(join(staging, archiveName)))

    await rm(output, { recursive: true, force: true })

    await mkdir(output, { recursive: true })

    await copyFile(join(staging, archiveName), join(output, archiveName))

    await writeFile(join(output, `${archiveName}.sha256`), `${archiveHash}  ${archiveName}\n`)

    await writeFile(join(output, 'release.json'), metadataText)

    return { archiveName, output, metadata }
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const { stdout: revision } = await execute('git', ['rev-parse', 'HEAD'], { cwd: root })
  const { stdout: status } = await execute('git', ['-c', 'core.fsmonitor=false', 'status', '--porcelain'], { cwd: root })

  if (process.env.CI && status.trim()) throw new Error('CI packaging requires a clean checkout.')

  const result = await packagePlugin(root, { revision: revision.trim(), dirty: Boolean(status.trim()) })

  console.log(`Packaged ${result.archiveName} in ${result.output}.`)

  if (!result.metadata.pluginId) console.log('Development candidate: register the plugin in Figma and commit its assigned ID before publication.')
}

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '../../..')
const [rawDirectory, appPath] = process.argv.slice(2)

assert.ok(rawDirectory && appPath, 'Usage: node prepare-mac-release-screenshots.mjs <raw-directory> <local-app-bundle>')

const sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const runtime = `macOS ${execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim()}`
const executable = await readFile(path.join(appPath, 'Contents/MacOS/Lumen Playground'))
const buildArtifactSha256 = createHash('sha256').update(executable).digest('hex')
const manifestPath = path.join(root, 'docs/assets/releases/v5.0.0/native-captures.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const storePath = 'apps/playground-apple/Store/macOS/Screenshots'
// This reviewed frame excludes the native title bar, sharing indicator, and outer margins.
// Recapture at this window size; never stretch a differently sized application layout.
const crop = { left: 16, top: 104, width: 2448, height: 1530 }

const scenes = [
  ['home', 'home', 'light'],
  ['examples', 'examples', 'light'],
  ['catalog', 'components', 'light'],
  ['catalog', 'components', 'dark'],
  ['settings', 'settings', 'light'],
  ['examples', 'examples', 'dark']
]

const captures = []

for (const [index, [name, destination, appearance]] of scenes.entries()) {
  const filename = `mac-${name}-${appearance}.png`
  const rawPath = path.resolve(rawDirectory, filename)
  const raw = await readFile(rawPath)
  const metadata = await sharp(raw).metadata()

  assert.equal(metadata.width, 2480, `Unexpected raw window width: ${filename}`)

  assert.equal(metadata.height, 1636, `Unexpected raw window height: ${filename}`)

  const output = await sharp(raw).extract(crop).resize(1280, 800).removeAlpha().png().toBuffer()
  const file = `${storePath}/${filename}`

  await writeFile(path.join(root, file), output)

  captures.push({
    file,
    sequence: index + 1,
    destination,
    appearance,
    width: 1280,
    height: 800,
    device: 'Mac desktop, Apple silicon',
    runtime,
    renderer: 'SwiftUI',
    configuration: 'Local Debug, ad hoc signed',
    sourceRevision,
    buildArtifactSha256,
    capturedAt: (await stat(rawPath)).mtime.toISOString(),
    sha256: createHash('sha256').update(output).digest('hex'),
    rawSha256: createHash('sha256').update(raw).digest('hex'),
    rawFormat: metadata.format,
    rawWidth: metadata.width,
    rawHeight: metadata.height,
    crop,
    alt: `Lumen Mac playground ${destination} in ${appearance} appearance, with restored shared icons and native desktop controls.`
  })
}

delete manifest.sourceRevision

manifest.notes = 'Local Debug captures; source revisions and build hashes are recorded per image. Mac captures use the corrected app bundle, crop native window chrome and outer margins, and export opaque 16:10 PNGs. Apple simulator sizes reuse one universal simulator application. Apple hashes identify the executable; Android hashes identify the APK. Compare with the final signed binary before submission.'

manifest.captures = [...manifest.captures.filter(capture => !capture.file.startsWith(`${storePath}/`)), ...captures]

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`Prepared ${captures.length} Mac screenshots from ${sourceRevision}.`)

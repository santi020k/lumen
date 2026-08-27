import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')

const imageSizeRoot = resolve(
  repositoryRoot,
  'node_modules',
  '.pnpm',
  'metro@0.87.0',
  'node_modules',
  'image-size',
  'dist'
)

const runProbe = source => spawnSync(process.execPath, ['--eval', source], {
  cwd: repositoryRoot,
  encoding: 'utf8',
  timeout: 2_000
})

const assertProbeTerminates = result => {
  assert.notEqual(result.error?.code, 'ETIMEDOUT', 'image-size parser did not terminate')

  assert.equal(result.status, 0, result.stderr || result.stdout)
}

test('patched ICNS parsing rejects a zero-length entry without blocking the event loop', () => {
  const imageSizePath = resolve(imageSizeRoot, 'index.js')

  const source = `
    const imageSize = require(${JSON.stringify(imageSizePath)})
    const input = Uint8Array.from([
      0x69, 0x63, 0x6e, 0x73,
      0x00, 0x00, 0x00, 0x10,
      0x69, 0x63, 0x70, 0x34,
      0x00, 0x00, 0x00, 0x00
    ])

    try {
      imageSize(input)
      process.exitCode = 1
    } catch (error) {
      if (!(error instanceof TypeError) || error.message !== 'Invalid ICNS entry length') {
        console.error(error)
        process.exitCode = 1
      }
    }
  `

  assertProbeTerminates(runProbe(source))
})

test('container box parsing advances past zero-sized JXL and HEIF boxes', () => {
  const utilitiesPath = resolve(imageSizeRoot, 'types', 'utils.js')

  const source = `
    const { findBox } = require(${JSON.stringify(utilitiesPath)})
    const input = Uint8Array.from([
      0x00, 0x00, 0x00, 0x00,
      0x6e, 0x6f, 0x6f, 0x70
    ])

    if (findBox(input, 'missing', 0) !== undefined) process.exitCode = 1
  `

  assertProbeTerminates(runProbe(source))
})

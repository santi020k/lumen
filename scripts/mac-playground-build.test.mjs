// cspell:words codesign
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

const script = resolve(import.meta.dirname, '../apps/playground-apple/scripts/build-mac-app.sh')
const localIdentifier = 'com.santi020k.lumen.playground.local'

for (const [name, appIdentifier, resourceIdentifier, succeeds] of [
  ['distinct resource bundle', localIdentifier, 'org.swift.LumenUI.resources', true],
  ['colliding resource bundle', localIdentifier, localIdentifier, false],
  ['incorrect app identity', 'com.santi020k.lumen.playground.apple', 'org.swift.LumenUI.resources', false]
]) {
  test(`local Mac build checks ${name} before signing`, { skip: process.platform !== 'darwin' }, async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-mac-build-test-'))
    const bin = join(root, 'bin')
    const build = join(root, 'build')
    const contents = join(build, 'Build/Products/Debug/Lumen Playground.app/Contents')
    const resource = join(contents, 'Resources/LumenUI_LumenUI.bundle/Contents')
    const log = join(root, 'signing.log')
    const plist = identifier => `<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>${identifier}</string></dict></plist>`

    try {
      await mkdir(bin, { recursive: true })

      await mkdir(resource, { recursive: true })

      await writeFile(join(contents, 'Info.plist'), plist(appIdentifier))

      await writeFile(join(resource, 'Info.plist'), plist(resourceIdentifier))

      await writeFile(join(bin, 'xcodebuild'), '#!/bin/sh\nexit 0\n', { mode: 0o755 })

      await writeFile(join(bin, 'codesign'), '#!/bin/sh\nprintf "%s\\n" "$*" >> "$LUMEN_TEST_SIGNING_LOG"\n', { mode: 0o755 })

      const result = spawnSync('bash', [script], {
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, LUMEN_MAC_BUILD_PATH: build, LUMEN_TEST_SIGNING_LOG: log },
        encoding: 'utf8'
      })

      assert.equal(result.status, succeeds ? 0 : 1, result.stderr)

      if (succeeds) {
        const signing = await readFile(log, 'utf8')

        assert.match(signing, /--force --sign -/u)

        assert.match(signing, /--verify --strict/u)
      } else {
        assert.match(result.stderr, /must have distinct bundle identifiers/u)

        await assert.rejects(readFile(log), { code: 'ENOENT' })
      }
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
}

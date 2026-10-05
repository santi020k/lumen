import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

// cspell:words simctl

const repositoryRoot = resolve(import.meta.dirname, '..')
const scriptPath = join(repositoryRoot, 'apps/playground-apple/scripts/capture-component-screenshots.sh')
const catalogPath = join(repositoryRoot, 'apps/playground-apple/scripts/component-capture-catalog.generated.txt')

test('Apple default captures cover phone components and focused arguments override them', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-apple-capture-catalog-'))
  const bin = join(directory, 'bin')
  const log = join(directory, 'components.log')
  const output = join(directory, 'screenshots')

  try {
    await mkdir(bin)

    await writeFile(join(bin, 'sleep'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 })

    await writeFile(join(bin, 'xcodebuild'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 })

    await writeFile(join(bin, 'xcrun'), `#!/usr/bin/env bash
if [[ "$1 $2" == "simctl launch" ]]; then
  printf '%s\\n' "\${@: -1}" >> "$LUMEN_CAPTURE_TEST_LOG"
fi
`, { mode: 0o755 })

    const capture = async components => {
      await writeFile(log, '')

      const result = spawnSync('bash', [scriptPath, output, ...components], {
        encoding: 'utf8',
        env: {
          ...process.env,
          CI: 'true',
          LUMEN_SIMULATOR_UDID: 'fixture-device',
          LUMEN_CAPTURE_TEST_LOG: log,
          PATH: `${bin}:${process.env.PATH}`
        },
        timeout: 30_000
      })

      assert.equal(result.status, 0, result.stderr)

      return (await readFile(log, 'utf8')).trim().split('\n')
    }

    const catalog = (await readFile(catalogPath, 'utf8')).trim().split('\n')

    assert.deepEqual(await capture([]), catalog)

    const manifest = JSON.parse(await readFile(join(repositoryRoot, 'apps/docs/src/data/native-component-captures.json'), 'utf8'))

    const expectedPhoneSlugs = manifest.captures
      .filter(capture => capture.platform === 'apple' && capture.device === 'iPhone simulator')
      .map(capture => capture.slug).sort()

    const capturedSlugs = catalog.map(name => name.toLowerCase().replaceAll(' ', '-')).sort()

    assert.deepEqual(capturedSlugs, expectedPhoneSlugs)

    for (const addition of ['Tooltip', 'Mentions', 'Tour', 'Data table', 'Timeline', 'Command', 'Calendar', 'Kanban board', 'QR code']) {
      assert.ok(catalog.includes(addition), `Missing v4 component ${addition}`)
    }

    assert.ok(!catalog.includes('Shortcut recorder'))

    assert.ok(!catalog.includes('Symbol picker'))

    assert.deepEqual(await capture(['Timeline', 'QR code']), ['Timeline', 'QR code'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

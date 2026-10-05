import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

const repositoryRoot = resolve(import.meta.dirname, '..')
const scriptPath = join(repositoryRoot, 'apps/playground-android/scripts/capture-component-screenshots.sh')
const catalogPath = join(repositoryRoot, 'apps/playground-android/scripts/component-capture-catalog.generated.txt')

test('Android default captures cover the generated catalog and focused arguments override it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-capture-catalog-'))
  const sdk = join(directory, 'sdk')
  const bin = join(directory, 'bin')
  const log = join(directory, 'components.log')
  const output = join(directory, 'screenshots')

  try {
    await mkdir(join(sdk, 'platform-tools'), { recursive: true })

    await mkdir(bin)

    await writeFile(join(bin, 'sleep'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 })

    await writeFile(join(sdk, 'platform-tools/adb'), `#!/usr/bin/env bash
if [[ "$1" == "devices" ]]; then
    printf 'List of devices attached\\nfixture-device\\tdevice\\n'
elif [[ "$1 $2 $3 $4" == "shell pm list features" ]]; then
    printf 'feature:android.hardware.camera\\n'
elif [[ "$1 $2 $3" == "shell am start" ]]; then
    printf '%s\\n' "\${@: -1}" >> "$LUMEN_CAPTURE_TEST_LOG"
elif [[ "$1" == "exec-out" ]]; then
    printf 'fixture image'
fi
`, { mode: 0o755 })

    const capture = async components => {
      await writeFile(log, '')

      const result = spawnSync('bash', [scriptPath, output, ...components], {
        encoding: 'utf8',
        env: { ...process.env, ANDROID_SDK_ROOT: sdk, LUMEN_CAPTURE_TEST_LOG: log, PATH: `${bin}:${process.env.PATH}` },
        timeout: 30_000
      })

      assert.equal(result.status, 0, result.stderr)

      return (await readFile(log, 'utf8')).trim().split('\n').map(line => {
        const component = JSON.parse(line)

        assert.equal(typeof component, 'string')

        return component
      })
    }

    const catalog = (await readFile(catalogPath, 'utf8')).trim().split('\n')

    assert.deepEqual(await capture([]), catalog)

    for (const addition of ['Mentions', 'Tour', 'Data table', 'Timeline', 'Command', 'Calendar', 'Kanban board', 'QR code']) {
      assert.ok(catalog.includes(addition), `Missing v4 component ${addition}`)
    }

    assert.deepEqual(await capture(['Timeline', 'QR code']), ['Timeline', 'QR code'])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

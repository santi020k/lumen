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
elif [[ "$1 $2 $3" == "shell settings get" ]]; then
    printf '1'
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

test('Android captures disable transient animations and restore settings even after capture failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-capture-motion-'))
  const sdk = join(directory, 'sdk')
  const bin = join(directory, 'bin')
  const keys = ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']
  const values = ['0.5', '1', '10']

  try {
    await mkdir(join(sdk, 'platform-tools'), { recursive: true })

    await mkdir(bin)

    await writeFile(join(bin, 'sleep'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 })

    await writeFile(join(sdk, 'platform-tools/adb'), `#!/usr/bin/env bash
if [[ "$1" == devices ]]; then
  printf 'List of devices attached\\nfixture-device\\tdevice\\n'
elif [[ "$1 $2 $3" == 'shell settings get' ]]; then
  cat "$LUMEN_CAPTURE_MOTION_STATE/$5"
elif [[ "$1 $2 $3" == 'shell settings put' ]]; then
  printf '%s' "$6" > "$LUMEN_CAPTURE_MOTION_STATE/$5"
elif [[ "$1 $2 $3" == 'shell am start' ]]; then
  for key in window_animation_scale transition_animation_scale animator_duration_scale; do
    if [[ "$(cat "$LUMEN_CAPTURE_MOTION_STATE/$key")" != 0 ]]; then
      echo 'Capture launched before animations were disabled' >&2
      exit 12
    fi
  done
elif [[ "$1" == exec-out ]]; then
  if [[ "$LUMEN_CAPTURE_FAIL_SCREENSHOT" == true ]]; then exit 13; fi
  printf 'fixture image'
fi
`, { mode: 0o755 })

    for (const fail of [false, true]) {
      for (const [index, key] of keys.entries()) await writeFile(join(directory, key), values[index])

      const result = spawnSync('bash', [scriptPath, join(directory, 'screenshots'), 'Sheet'], {
        encoding: 'utf8',
        env: { ...process.env, ANDROID_SDK_ROOT: sdk, PATH: `${bin}:${process.env.PATH}`,
          LUMEN_CAPTURE_MOTION_STATE: directory, LUMEN_CAPTURE_FAIL_SCREENSHOT: String(fail) },
        timeout: 30_000
      })

      assert.equal(result.status, fail ? 13 : 0, result.stderr)

      for (const [index, key] of keys.entries()) {
        assert.equal(await readFile(join(directory, key), 'utf8'), values[index])
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

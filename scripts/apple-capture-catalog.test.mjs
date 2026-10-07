// cspell:words xctestrun

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
  const directory = await mkdtemp(join(tmpdir(), 'lumen-apple-capture-catalog-project-'))
  const bin = join(directory, 'bin')
  const log = join(directory, 'components.log')
  const output = join(directory, 'screenshots')

  try {
    await mkdir(bin)

    await writeFile(join(bin, 'sleep'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 })

    await writeFile(join(bin, 'xcodebuild'), '#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "$LUMEN_CAPTURE_TEST_BUILD_LOG"\n', { mode: 0o755 })

    await writeFile(join(bin, 'xcrun'), `#!/usr/bin/env bash
if [[ "$1 $2" == "simctl launch" ]]; then
  printf '%s\\n' "\${@: -1}" >> "$LUMEN_CAPTURE_TEST_LOG"
fi
if [[ "$1 $2 $3" == "xcresulttool export attachments" ]]; then
  directory="\${@: -1}"
  mkdir -p "$directory"
  if [[ "$LUMEN_CAPTURE_TEST_MISSING_ATTACHMENT" == "true" ]]; then
    printf '[]' > "$directory/manifest.json"
  else
    printf '[{"attachments":[{"suggestedHumanReadableName":"tour-light-ready_0_fixture.png","exportedFileName":"tour-attachment.png"},{"suggestedHumanReadableName":"kanban-column-light-ready_0_fixture.png","exportedFileName":"kanban-attachment.png"}]}]' > "$directory/manifest.json"
    printf 'verified tour' > "$directory/tour-attachment.png"
    printf 'verified kanban' > "$directory/kanban-attachment.png"
  fi
fi
`, { mode: 0o755 })

    const buildLog = join(directory, 'build.log')

    const capture = async (components, missingAttachment = false, products = undefined) => {
      await writeFile(log, '')

      await writeFile(buildLog, '')

      const result = spawnSync('bash', [scriptPath, output, ...components], {
        encoding: 'utf8',
        env: {
          ...process.env,
          CI: 'true',
          ...(products ? { LUMEN_CAPTURE_PRODUCTS: products } : {}),
          LUMEN_SIMULATOR_UDID: 'fixture-device',
          LUMEN_CAPTURE_TEST_LOG: log,
          LUMEN_CAPTURE_TEST_BUILD_LOG: buildLog,
          LUMEN_CAPTURE_TEST_MISSING_ATTACHMENT: String(missingAttachment),
          PATH: `${bin}:${process.env.PATH}`
        },
        timeout: 30_000
      })

      if (missingAttachment) {
        assert.notEqual(result.status, 0)

        assert.match(result.stderr, /Expected exactly one verified native interaction screenshot/)

        return []
      }

      assert.equal(result.status, 0, result.stderr)

      return (await readFile(log, 'utf8')).trim().split('\n')
    }

    const catalog = (await readFile(catalogPath, 'utf8')).trim().split('\n')

    assert.deepEqual(await capture([]), catalog)

    assert.match(await readFile(buildLog, 'utf8'), /testTourCaptureMatchesDocumentation/)

    assert.equal(await readFile(join(output, 'tour.png'), 'utf8'), 'verified tour')

    assert.match(await readFile(buildLog, 'utf8'), /testKanbanColumnCaptureMatchesDocumentation/)

    assert.equal(await readFile(join(output, 'kanban-column.png'), 'utf8'), 'verified kanban')

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

    assert.doesNotMatch(await readFile(buildLog, 'utf8'), /testTourCaptureMatchesDocumentation/)

    assert.deepEqual(await capture(['Tour']), ['Tour'])

    await capture(['Tour'], true)

    assert.deepEqual(await capture(['Kanban column']), ['Kanban column'])

    assert.doesNotMatch(await readFile(buildLog, 'utf8'), /testTourCaptureMatchesDocumentation/)

    await capture(['Kanban column'], true)

    const products = join(directory, 'products')

    await mkdir(join(products, 'Debug-iphonesimulator', 'LumenApplePlayground.app'), { recursive: true })

    await mkdir(join(products, 'Debug-iphonesimulator', 'LumenApplePlaygroundUITests-Runner.app'))

    await writeFile(join(products, 'capture.xctestrun'), '')

    const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).stdout.trim()

    await writeFile(join(products, 'lumen-capture-build.json'), JSON.stringify({ revision, toolchain: '' }))

    assert.deepEqual(await capture(['Tour', 'Kanban column'], false, products), ['Tour', 'Kanban column'])

    const sharedBuildLog = await readFile(buildLog, 'utf8')

    assert.match(sharedBuildLog, /test-without-building/)

    assert.doesNotMatch(sharedBuildLog, /(?:^|\s)-(?:project|scheme)(?:\s|$)/u)

    assert.equal(await readFile(join(output, 'tour.png'), 'utf8'), 'verified tour')

    assert.equal(await readFile(join(output, 'kanban-column.png'), 'utf8'), 'verified kanban')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

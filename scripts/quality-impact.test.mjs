import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'

// cspell:words gpgsign

const binary = process.env.QUALITY_BIN || 'quality'
const config = await readFile(resolve(import.meta.dirname, '../quality-impact.json'), 'utf8')
const gitEnvironment = { ...process.env }

for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_CONFIG_COUNT', 'GIT_CONFIG_PARAMETERS']) delete gitEnvironment[key]

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', env: gitEnvironment }).trim()
const selected = plan => plan.selected.map(node => node.id)

const fixture = async callback => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-impact-'))

  const write = async (path, content = 'changed\n') => {
    await mkdir(dirname(join(directory, path)), { recursive: true })

    await writeFile(join(directory, path), content)
  }

  try {
    git(directory, 'init', '--quiet')

    git(directory, 'config', 'user.name', 'Impact fixture')

    git(directory, 'config', 'user.email', 'impact@example.invalid')

    git(directory, 'config', 'commit.gpgsign', 'false')

    await write('quality-impact.json', config)

    await write('packages/react/src/button.ts')

    git(directory, 'add', '.')

    git(directory, 'commit', '--quiet', '-m', 'Policy fixture')

    const base = git(directory, 'rev-parse', 'HEAD')

    const commit = () => {
      git(directory, 'add', '.')

      git(directory, 'commit', '--quiet', '-m', 'Changed fixture')
    }

    const plan = (...args) => JSON.parse(execFileSync(binary, ['--root', directory, 'impact', 'plan', ...(args.includes('--base') ? [] : ['--base', base]), '--format', 'json', ...args], { encoding: 'utf8', env: gitEnvironment }))

    await callback({ directory, write, commit, plan })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('integration tests use the published Quality 2.0.0 contract', () => {
  assert.equal(execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim(), 'quality 2.0.0')
})

test('web changes include consumers and keep unrelated native checks out', async () => {
  await fixture(async ({ write, commit, plan }) => {
    await write('packages/react/src/button.ts', 'new component\n')

    commit()

    const result = plan()

    assert.equal(result.mode, 'affected')

    for (const id of ['repository-checks', 'web', 'docs', 'visual', 'framework-visual', 'mcp', 'mcp-evaluation', 'figma']) assert.ok(selected(result).includes(id), id)

    assert.ok(!selected(result).includes('android'))

    assert.ok(!selected(result).includes('swift'))

    assert.ok(!selected(result).includes('react-native'))
  })
})

test('shared foundations, unknown inputs and missing history retain the complete gate', async () => {
  for (const path of ['packages/core/src/tokens.ts', 'tokens/new.json', '.github/workflows/quality-impact.yml', 'scripts/quality-impact.test.mjs', 'unknown/new.txt']) {
    await fixture(async ({ write, commit, plan }) => {
      await write(path)

      commit()

      const result = plan()

      assert.equal(result.mode, 'full', path)

      assert.equal(selected(result).length, Object.keys(JSON.parse(config).nodes).length, path)

      assert.equal(result.skipped.length, 0)
    })
  }

  await fixture(async ({ plan }) => {
    assert.equal(plan('--base', 'missing-ref').mode, 'full')

    assert.equal(plan('--full').mode, 'full')
  })
})

test('deletions and renames retain old and new ownership while empty changes keep live checks', async () => {
  await fixture(async ({ directory, write, commit, plan }) => {
    assert.deepEqual(selected(plan()), ['repository-checks'])

    await write('packages/mcp/src/placeholder.ts')

    await rename(join(directory, 'packages/react/src/button.ts'), join(directory, 'packages/mcp/src/renamed.ts'))

    commit()

    const result = plan()

    assert.ok(result.changed_paths.includes('packages/react/src/button.ts'))

    assert.ok(result.changed_paths.includes('packages/mcp/src/renamed.ts'))

    assert.ok(selected(result).includes('web'))

    assert.ok(selected(result).includes('mcp'))

    const batches = result.batches.flat()

    assert.ok(batches.indexOf('web') < batches.indexOf('mcp'))

    assert.ok(batches.indexOf('mcp') < batches.indexOf('mcp-evaluation'))
  })
})

test('malformed policy cannot create a green empty plan', async () => {
  await fixture(async ({ directory, write }) => {
    await write('quality-impact.json', '{"schema_version":1,"nodes":{}}')

    const result = spawnSync(binary, ['--root', directory, 'impact', 'plan', '--full', '--format', 'json'], { encoding: 'utf8', env: gitEnvironment })

    assert.notEqual(result.status, 0)

    assert.equal(result.stdout, '')
  })
})

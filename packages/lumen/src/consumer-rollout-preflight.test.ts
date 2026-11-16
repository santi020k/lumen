import type * as ChildProcess from 'node:child_process'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { consumerRolloutSucceeded, runConsumerRollout } from './consumer-rollout.js'

const execution = vi.hoisted(() => ({
  run: vi.fn<(
    executable: string, args: string[], options: { cwd: string, maxBuffer?: number }
  ) => Promise<{ stdout: string, stderr: string }>>()
}))

vi.mock('node:child_process', async original => {
  const actual = await original<typeof ChildProcess>()
  const { promisify } = await import('node:util')
  const execFile = vi.fn(actual.execFile)

  Object.defineProperty(execFile, promisify.custom, { value: execution.run })

  return { ...actual, execFile }
})

const roots: string[] = []
const files = ['package.json', 'app/package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml']
const snapshot = (root: string) => Promise.all(files.map(file => readFile(join(root, file), 'utf8')))
const fixture = async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-rollout-preflight-'))

  roots.push(root)
  await mkdir(join(root, 'app'))
  await writeFile(join(root, 'package.json'), JSON.stringify({
    name: 'consumer',
    packageManager: 'pnpm@12.18.0',
    dependencies: { '@santi020k/lumen-core': '^4.0.0' }
  }))
  await writeFile(join(root, 'app/package.json'), JSON.stringify({
    name: 'app', dependencies: { '@santi020k/lumen-core': 'catalog:' }
  }))
  await writeFile(join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - app\ncatalog:\n  "@santi020k/lumen-core": ^4.0.0\n')
  await writeFile(join(root, 'pnpm-lock.yaml'), 'packages:\n  \'@santi020k/lumen-core@4.0.0\': {}\n')

  return root
}

beforeEach(() => {
  vi.stubGlobal('process', { ...process, platform: 'linux' })
  execution.run.mockReset().mockResolvedValue({ stdout: '', stderr: '' })
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('consumer package-manager preflight', () => {
  test.each(['unavailable', 'failed'])('preserves every declaration and lockfile when Corepack is %s', async failure => {
    const root = await fixture()
    const before = await snapshot(root)
    const message = failure === 'unavailable' ? 'spawn corepack ENOENT' : 'Corepack could not start the pinned pnpm version'

    execution.run.mockImplementation(executable => {
      if (executable === 'corepack') return Promise.reject(new Error(message))

      return Promise.resolve({ stdout: '', stderr: '' })
    })

    const report = await runConsumerRollout({ apply: true, repositories: [root], targetVersion: '4.2.0' })

    expect(consumerRolloutSucceeded(report)).toBe(false)
    expect(report.repositories[0]?.commands).toEqual([
      { command: 'corepack pnpm --version', ok: false, output: message }
    ])
    expect(await snapshot(root)).toEqual(before)
    expect(execution.run.mock.calls.filter(([executable]) => executable === 'corepack'))
      .toEqual([['corepack', ['pnpm', '--version'], { cwd: root, maxBuffer: 10 * 1024 * 1024 }]])
  })

  test('runs preflight against the original files before updating and installing', async () => {
    const root = await fixture()
    const before = await snapshot(root)
    const observations = new Map<string, string[]>()

    execution.run.mockImplementation(async (executable, args) => {
      if (executable === 'corepack' && args.includes('--version')) observations.set('preflight', await snapshot(root))
      if (executable === 'corepack' && args.includes('update')) {
        observations.set('update', await snapshot(root))
        await writeFile(join(root, 'pnpm-lock.yaml'), 'packages:\n  \'@santi020k/lumen-core@4.2.0\': {}\n')
      }

      return { stdout: '', stderr: '' }
    })

    const report = await runConsumerRollout({ apply: true, repositories: [root], targetVersion: '4.2.0' })

    expect(consumerRolloutSucceeded(report)).toBe(true)
    expect(observations.get('preflight')).toEqual(before)
    expect(observations.get('update')?.[0]).toContain('^4.2.0')
    expect(observations.get('update')?.[2]).toContain('^4.2.0')
    expect(report.repositories[0]?.commands.map(command => command.command)).toEqual([
      'corepack pnpm --version',
      'corepack pnpm update --recursive @santi020k/lumen-core@4.2.0',
      'corepack pnpm install'
    ])
  })

  test('inventory does not execute Corepack or modify consumer files', async () => {
    const root = await fixture()
    const before = await snapshot(root)

    const report = await runConsumerRollout({ repositories: [root], targetVersion: '4.2.0' })

    expect(report.repositories[0]?.commands).toEqual([])
    expect(execution.run.mock.calls.some(([executable]) => executable === 'corepack')).toBe(false)
    expect(await snapshot(root)).toEqual(before)
  })

  test('still stops after an update failure following a successful preflight', async () => {
    const root = await fixture()

    execution.run.mockImplementation((executable, args) => {
      if (executable === 'corepack' && args.includes('update')) return Promise.reject(new Error('Update failed'))

      return Promise.resolve({ stdout: '', stderr: '' })
    })

    const report = await runConsumerRollout({ apply: true, repositories: [root], targetVersion: '4.2.0' })

    expect(report.repositories[0]?.commands.map(command => command.ok)).toEqual([true, false])
    expect(execution.run.mock.calls.some(([, args]) => args.includes('install'))).toBe(false)
  })

  test.each(['global', 'local', 'bundled'] as const)('launches a Windows %s Corepack shim through Node without a shell', async layout => {
    const root = await fixture()
    const installRoot = join(root, 'Corepack tools & more')
    const layouts = {
      global: { directory: installRoot, packageRoot: join(installRoot, 'node_modules/corepack') },
      local: { directory: join(installRoot, 'node_modules/.bin'), packageRoot: join(installRoot, 'node_modules/corepack') },
      bundled: { directory: join(installRoot, 'node_modules/corepack/shims'), packageRoot: join(installRoot, 'node_modules/corepack') }
    }
    const { directory, packageRoot } = layouts[layout]
    const script = join(packageRoot, 'dist/corepack.js')

    await mkdir(directory, { recursive: true })
    await mkdir(join(packageRoot, 'dist'), { recursive: true })
    await writeFile(join(directory, 'corepack.cmd'), '@echo off\n')
    await writeFile(join(packageRoot, 'package.json'), '{"name":"corepack","version":"0.36.0"}')
    await writeFile(script, '// Fixture entry; child process is mocked.\n')
    vi.stubGlobal('process', { ...process, platform: 'win32', env: { ...process.env, PATH: `"${relative(root, directory)}"` } })
    execution.run.mockImplementation(executable => {
      if (executable === process.execPath) return Promise.reject(new Error('Fixture preflight failure'))

      return Promise.resolve({ stdout: '', stderr: '' })
    })
    const before = await snapshot(root)

    const report = await runConsumerRollout({ apply: true, repositories: [root], targetVersion: '4.2.0' })

    expect(report.repositories[0]?.commands[0]?.ok).toBe(false)
    expect(execution.run).toHaveBeenCalledWith(
      process.execPath, [await realpath(script), 'pnpm', '--version'], { cwd: root, maxBuffer: 10 * 1024 * 1024 }
    )
    expect(await snapshot(root)).toEqual(before)
  })

  test('rejects an incomplete Windows installation without choosing another Corepack', async () => {
    const root = await fixture()
    const directory = join(root, 'incomplete')
    const otherDirectory = join(root, 'other')

    await mkdir(directory)
    await mkdir(join(otherDirectory, 'node_modules/corepack/dist'), { recursive: true })
    await mkdir(join(root, 'node_modules/corepack/dist'), { recursive: true })
    await writeFile(join(directory, 'corepack.cmd'), '@echo off\n')
    await writeFile(join(otherDirectory, 'corepack.cmd'), '@echo off\n')
    await writeFile(join(otherDirectory, 'node_modules/corepack/dist/corepack.js'), '// Another PATH installation.\n')
    await writeFile(join(root, 'node_modules/corepack/package.json'), '{"name":"corepack","version":"0.36.0"}')
    await writeFile(join(root, 'node_modules/corepack/dist/corepack.js'), '// An ancestor installation.\n')
    vi.stubGlobal('process', { ...process, platform: 'win32', env: { ...process.env, PATH: `${directory};${otherDirectory}` } })
    const before = await snapshot(root)

    const report = await runConsumerRollout({ apply: true, repositories: [root], targetVersion: '4.2.0' })

    expect(report.repositories[0]?.commands).toEqual([
      { command: 'corepack pnpm --version', ok: false, output: 'The Corepack installation is missing its JavaScript entry. Reinstall Corepack before applying a rollout.' }
    ])
    expect(execution.run.mock.calls.every(([executable]) => executable === 'git')).toBe(true)
    expect(await snapshot(root)).toEqual(before)
  })

  test('keeps consumer files untouched when no Windows Corepack launcher is available', async () => {
    const root = await fixture()
    const before = await snapshot(root)

    vi.stubGlobal('process', { ...process, platform: 'win32', env: { ...process.env, PATH: root } })

    const report = await runConsumerRollout({ apply: true, repositories: [root], targetVersion: '4.2.0' })

    expect(report.repositories[0]?.commands).toEqual([
      { command: 'corepack pnpm --version', ok: false, output: 'Corepack was not found on PATH. Install Corepack before applying a rollout.' }
    ])
    expect(execution.run.mock.calls.every(([executable]) => executable === 'git')).toBe(true)
    expect(await snapshot(root)).toEqual(before)
  })
})

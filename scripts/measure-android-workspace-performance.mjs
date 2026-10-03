import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs, promisify } from 'node:util'

import { parseAndroidFrames, parseAndroidLaunch, parseAndroidUptimeUpperBound, readAndroidUiNodes, summarizeSamples } from './lib/android-runtime-metrics.mjs'

const root = resolve(import.meta.dirname, '..')

const { values } = parseArgs({ options: {
  serial: { type: 'string' },
  iterations: { type: 'string', default: '5' },
  swipes: { type: 'string', default: '6' },
  output: { type: 'string', default: '.build/android-workspace-performance' },
  'build-tools': { type: 'string', default: '37.0.0' }
} })

const iterations = Number(values.iterations)
const swipes = Number(values.swipes)
const sdk = process.env.ANDROID_HOME

assert.ok(values.serial, 'Pass --serial explicitly so the benchmark never chooses another device')

assert.ok(sdk, 'ANDROID_HOME must identify the installed Android SDK')

assert.ok(Number.isInteger(iterations) && iterations >= 3 && iterations <= 20, 'Use 3 to 20 cold launches')

assert.ok(Number.isInteger(swipes) && swipes >= 3 && swipes <= 20, 'Use 3 to 20 workspace swipes')

const execute = promisify(execFile)
const run = async (command, args, env = process.env) => (await execute(command, args, { cwd: root, env, maxBuffer: 32 * 1024 * 1024, timeout: 600000 })).stdout
const adbPath = join(sdk, 'platform-tools', 'adb')
const adb = (...args) => run(adbPath, ['-s', values.serial, ...args])
const shell = (...args) => adb('shell', ...args)
const packageName = 'com.santi020k.lumen.playground.compose'
const component = `${packageName}/.MainActivity`
const output = resolve(root, values.output)
const revision = (await run('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'])).trim()
const status = (await run('git', ['-c', 'core.fsmonitor=false', 'status', '--porcelain'])).trim()

assert.equal(status, '', 'Commit source changes before recording exact-candidate runtime evidence')

await mkdir(output, { recursive: true })

// Build the release variant locally with upload signing disabled; use the development certificate.
const buildEnvironment = { ...process.env }

for (const name of ['LUMEN_PLAYGROUND_KEYSTORE_PATH', 'LUMEN_PLAYGROUND_KEYSTORE_PASSWORD', 'LUMEN_PLAYGROUND_KEY_ALIAS', 'LUMEN_PLAYGROUND_KEY_PASSWORD']) delete buildEnvironment[name]

const buildLog = await run(join(root, 'packages/compose/gradlew'), ['-p', 'apps/playground-android', ':app:assembleRelease'], buildEnvironment)

await writeFile(join(output, 'build.log'), buildLog)

assert.equal((await run('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'])).trim(), revision, 'Source revision changed during the build')

assert.equal((await run('git', ['-c', 'core.fsmonitor=false', 'status', '--porcelain'])).trim(), '', 'Source changed during the build')

const unsignedApk = join(root, 'apps/playground-android/app/build/outputs/apk/release/app-release-unsigned.apk')
const signedApk = join(output, 'workspace-release-development-signed.apk')

assert.ok(/^\d+\.\d+\.\d+$/.test(values['build-tools']), 'Expected a stable installed Android build-tools version')

const buildTools = join(sdk, 'build-tools', values['build-tools'])

await run(join(buildTools, 'apksigner'), ['sign', '--ks', join(homedir(), '.android/debug.keystore'), '--ks-key-alias', 'androiddebugkey', '--ks-pass', 'pass:android', '--key-pass', 'pass:android', '--out', signedApk, unsignedApk])

await run(join(buildTools, 'apksigner'), ['verify', signedApk])

const apkSha256 = createHash('sha256').update(await readFile(signedApk)).digest('hex')

await adb('install', '-r', signedApk)

const verifyInstalledArtifact = async () => {
  const installedPath = (await shell('pm', 'path', packageName)).trim().slice('package:'.length)

  assert.ok(installedPath.startsWith('/data/app/') && installedPath.endsWith('/base.apk'), 'Expected one installed playground APK')

  assert.equal((await shell('sha256sum', installedPath)).split(' ')[0], apkSha256, 'Installed APK differs from the measured artifact; another run may have replaced it')
}

await verifyInstalledArtifact()

const launch = async () => {
  await shell('am', 'force-stop', packageName)

  return shell('am', 'start', '-W', '--activity-clear-task', '-n', component, '--es', 'destination', 'examples')
}

const startup = []

for (let iteration = 0; iteration < iterations; iteration += 1) {
  const raw = await launch()

  await writeFile(join(output, `launch-${iteration}.txt`), raw)

  startup.push(parseAndroidLaunch(raw).totalTimeMs)
}

const hierarchy = async () => {
  await shell('uiautomator', 'dump', '/sdcard/lumen-workspace-performance.xml')

  return readAndroidUiNodes(await shell('cat', '/sdcard/lumen-workspace-performance.xml'))
}

const nodes = await hierarchy()
const workspace = nodes.find(node => node.package === packageName && node.text === 'Workspace')

assert.ok(workspace, 'Expected the Workspace example tab')

await shell('input', 'tap', String(Math.round((workspace.left + workspace.right) / 2)), String(Math.round((workspace.top + workspace.bottom) / 2)))

const before = await hierarchy()
const recordNames = entries => entries.filter(node => node.package === packageName && /^Lumen \d+$/.test(node.text)).map(node => node.text)
const beforeRecords = recordNames(before)
const list = before.find(node => node.package === packageName && node.scrollable)

assert.ok(beforeRecords.length > 0 && list, 'Expected the populated, scrollable workspace list')

await writeFile(join(output, 'before.png'), (await execute(adbPath, ['-s', values.serial, 'exec-out', 'screencap', '-p'], { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 })).stdout)

await shell('dumpsys', 'gfxinfo', packageName, 'reset')

const frames = new Map()
const x = String(Math.round((list.left + list.right) / 2))
const fromY = String(Math.round(list.top + (list.bottom - list.top) * 0.85))
const toY = String(Math.round(list.top + (list.bottom - list.top) * 0.3))

for (let swipe = 0; swipe < swipes; swipe += 1) {
  await shell('input', 'swipe', x, fromY, x, toY, '450')

  const raw = await shell('dumpsys', 'gfxinfo', packageName, 'framestats')

  await writeFile(join(output, `frames-${swipe}.txt`), raw)

  // Parse the combined snapshots after all gestures to deduplicate overlapping ring-buffer rows.
  frames.set(swipe, raw)
}

const afterRecords = recordNames(await hierarchy())

assert.ok(afterRecords.length > 0 && JSON.stringify(afterRecords) !== JSON.stringify(beforeRecords), 'The measured gestures did not move the workspace list')

await writeFile(join(output, 'after.png'), (await execute(adbPath, ['-s', values.serial, 'exec-out', 'screencap', '-p'], { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 })).stdout)

const finalFrames = await shell('dumpsys', 'gfxinfo', packageName, 'framestats')

await writeFile(join(output, 'frames-final.txt'), finalFrames)

// /proc/uptime is sampled after gfxinfo; no completed frame can follow this observation.
const observedTimeNs = parseAndroidUptimeUpperBound(await shell('cat', '/proc/uptime'))
const parsed = parseAndroidFrames([...frames.values(), finalFrames].join('\n'), observedTimeNs)
const samples = parsed.frames
const missed = samples.filter(frame => frame.missedDeadline).length

await verifyInstalledArtifact()

const report = {
  schemaVersion: 1,
  revision,
  apkSha256,
  buildKind: 'release-mode-development-signed',
  buildToolsVersion: values['build-tools'],
  measuredAt: new Date().toISOString(),
  device: {
    identitySha256: createHash('sha256').update(values.serial).digest('hex'),
    model: (await shell('getprop', 'ro.product.model')).trim(),
    os: (await shell('getprop', 'ro.build.version.release')).trim(),
    api: (await shell('getprop', 'ro.build.version.sdk')).trim(),
    emulator: (await shell('getprop', 'ro.kernel.qemu')).trim() === '1',
    abi: (await shell('getprop', 'ro.product.cpu.abi')).trim(),
    display: (await shell('wm', 'size')).trim(),
    density: (await shell('wm', 'density')).trim(),
    fontScale: (await shell('settings', 'get', 'system', 'font_scale')).trim(),
    listBounds: { left: list.left, top: list.top, right: list.right, bottom: list.bottom }
  },
  startup: { method: 'am start -W, force-stopped process, cleared synthetic playground task', totalTimeMs: summarizeSamples(startup), samples: startup },
  scrolling: { method: 'gfxinfo FrameCompleted - IntendedVsync, Flags=0, completed samples only', excludedFutureCompletions: parsed.excludedFutureCompletions, quality: parsed.excludedFutureCompletions ? 'partial-invalid-completion-timestamps' : 'completed-timestamps-validated', gestures: swipes, beforeRecords, afterRecords, durationMs: summarizeSamples(samples.map(frame => frame.durationMs)), missedDeadlines: missed, missedDeadlinePercent: 100 * missed / samples.length },
  limitations: ['Local runtime baseline; not a physical-device qualification or stability iteration.', 'Activity-manager launch timing does not prove the full workspace is interactive.', 'gfxinfo includes observed frames around gestures; it is not a complete Perfetto trace.', 'Compare only with the same device, build mode, display and host workload.']
}

await writeFile(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

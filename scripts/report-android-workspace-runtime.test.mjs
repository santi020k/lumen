import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

const script = resolve(import.meta.dirname, 'report-android-workspace-runtime.mjs')
const validFrames = '---PROFILEDATA---\nFlags,IntendedVsync,FrameCompleted,FrameDeadline\n0,1000000000,1010000000,1016666667\n---PROFILEDATA---\n'
const withFutureFrame = validFrames.replace('0,1000000000,1010000000,1016666667\n', '0,1000000000,1010000000,1016666667\n0,1900000000,2100000000,1916666667\n')

const runFixture = async (mutate = async () => {}) => {
  const directory = await mkdtemp(join(tmpdir(), 'lumen-runtime-report-'))

  try {
    await Promise.all([
      ...Array.from({ length: 5 }, (_, index) => writeFile(join(directory, `launch-${index}.txt`), `Status: ok\nLaunchState: COLD\nTotalTime: ${100 + index}\n`)),
      ...Array.from({ length: 6 }, (_, index) => writeFile(join(directory, `frames-${index}.txt`), validFrames)),
      writeFile(join(directory, 'uptime.txt'), '2.00 0.00\n')
    ])

    await mutate(directory)

    return spawnSync(process.execPath, [script, '--input', directory], { encoding: 'utf8' })
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
}

test('reports five cold launches and deduplicates overlapping frame snapshots', async () => {
  const result = await runFixture()

  assert.equal(result.status, 0, result.stderr)

  const report = JSON.parse(result.stdout)

  assert.equal(report.status, 'measured')

  assert.deepEqual(report.startup.samplesMs, [100, 101, 102, 103, 104])

  assert.equal(report.startup.median, 102)

  assert.equal(report.scrolling.count, 1)

  assert.equal(report.scrolling.missedDeadlines, 0)
})

test('marks future completions Partial without counting them as eligible frames', async () => {
  const result = await runFixture(directory => writeFile(join(directory, 'frames-0.txt'), withFutureFrame))

  assert.equal(result.status, 0, result.stderr)

  const report = JSON.parse(result.stdout)

  assert.equal(report.status, 'partial')

  assert.equal(report.scrolling.excludedFutureCompletions, 1)

  assert.equal(report.scrolling.count, 1)
})

test('rejects warm starts and incomplete sample sets', async () => {
  const warm = await runFixture(directory => writeFile(join(directory, 'launch-0.txt'), 'Status: ok\nLaunchState: WARM\nTotalTime: 100\n'))

  assert.equal(warm.status, 1)

  assert.match(warm.stderr, /process-cold/u)

  const missing = await runFixture(directory => rm(join(directory, 'frames-5.txt')))

  assert.equal(missing.status, 1)

  assert.match(missing.stderr, /ENOENT/u)
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { parseAndroidFrames, parseAndroidLaunch, parseAndroidUptimeUpperBound, readAndroidUiNodes, summarizeSamples } from './lib/android-runtime-metrics.mjs'

test('accepts successful process-cold launches and rejects missing, warm, and failed timings', () => {
  assert.deepEqual(parseAndroidLaunch('Status: ok\nLaunchState: COLD\nTotalTime: 321\n'), { totalTimeMs: 321 })

  for (const output of ['Status: error', 'Status: ok\nLaunchState: WARM\nTotalTime: 321', 'Status: ok\nLaunchState: COLD', 'Status: ok\nLaunchState: COLD\nTotalTime: NaN']) {
    assert.throws(() => parseAndroidLaunch(output))
  }
})

test('uses bigint frame differences, deduplicates repeated rows, and excludes flagged or unfinished frames', () => {
  const observedTimeNs = 20000000000000000n
  const header = 'Flags,IntendedVsync,FrameCompleted,FrameDeadline,'
  const row = '0,10000000000000001,10000000020000001,10000000016666668,'
  const frames = parseAndroidFrames(`---PROFILEDATA---\n${header}\n${row}\n${row}\n1,1,999999999,2,\n0,1,9223372036854775807,2,\n---PROFILEDATA---`, observedTimeNs)

  assert.deepEqual(frames, { frames: [{ durationMs: 20, missedDeadline: true }], excludedFutureCompletions: 0 })

  assert.deepEqual(parseAndroidFrames(`${header}\n0,100,1000100,2000100,`, observedTimeNs), { frames: [{ durationMs: 1, missedDeadline: false }], excludedFutureCompletions: 0 })

  assert.throws(() => parseAndroidFrames('Total frames rendered: 0', observedTimeNs))

  assert.throws(() => parseAndroidFrames('Flags,IntendedVsync,FrameCompleted,\n0,100,200,', observedTimeNs))
})

test('summarizes measured samples without mutating them or accepting invalid results', () => {
  const samples = [30, 10, 20]

  assert.deepEqual(summarizeSamples(samples), { count: 3, median: 20, p95: 30, max: 30 })

  assert.deepEqual(samples, [30, 10, 20])

  assert.throws(() => summarizeSamples([]))

  assert.throws(() => summarizeSamples([NaN]))
})

test('reads playground target bounds and rejects truncated or oversized device hierarchies', () => {
  const xml = '<hierarchy><node text="Workspace" package="app" scrollable="false" bounds="[10,20][100,200]"/><node text="" package="app" scrollable="true" bounds="[0,0][0,0]"/></hierarchy>'

  assert.deepEqual(readAndroidUiNodes(xml), [{ text: 'Workspace', package: 'app', scrollable: false, left: 10, top: 20, right: 100, bottom: 200 }])

  assert.throws(() => readAndroidUiNodes('<node text="Workspace"'))

  assert.throws(() => readAndroidUiNodes('x'.repeat(4 * 1024 * 1024 + 1)))

  assert.deepEqual(readAndroidUiNodes(`${'x'.repeat(100000)}${xml}`), readAndroidUiNodes(xml))
})

test('reports impossible future completion timestamps without turning them into slow frames', () => {
  const header = 'Flags,IntendedVsync,FrameCompleted,FrameDeadline,'
  const output = `${header}\n0,100,200,300,\n0,100,1000000000,300,\n0,100,1000000000,300,`
  const result = parseAndroidFrames(output, 1000n)

  assert.deepEqual(result, { frames: [{ durationMs: 0.0001, missedDeadline: false }], excludedFutureCompletions: 1 })

  assert.throws(() => parseAndroidFrames(output))

  assert.throws(() => parseAndroidFrames(`${header}\n0,100,1000000000,300,`, 1000n))
})

test('bounds rounded device uptime using integer nanoseconds and rejects invalid clock samples', () => {
  assert.equal(parseAndroidUptimeUpperBound('123.45 456.78\n'), 123460000000n)

  assert.equal(parseAndroidUptimeUpperBound('10000000.12 1.23'), 10000000130000000n)

  assert.throws(() => parseAndroidUptimeUpperBound('unknown'))

  assert.throws(() => parseAndroidUptimeUpperBound('123.1234567890'))
})

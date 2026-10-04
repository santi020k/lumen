import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { parseAndroidFrames, parseAndroidLaunch, parseAndroidUptimeUpperBound, summarizeSamples } from './lib/android-runtime-metrics.mjs'

const { values } = parseArgs({ options: {
  input: { type: 'string' },
  output: { type: 'string' }
} })

assert.ok(values.input, 'Pass --input with the instrumented workspace sample directory')

const directory = resolve(values.input)

const [launches, snapshots, uptime] = await Promise.all([
  Promise.all(Array.from({ length: 5 }, (_, index) => readFile(join(directory, `launch-${index}.txt`), 'utf8'))),
  Promise.all(Array.from({ length: 6 }, (_, index) => readFile(join(directory, `frames-${index}.txt`), 'utf8'))),
  readFile(join(directory, 'uptime.txt'), 'utf8')
])

const startupSamples = launches.map(sample => parseAndroidLaunch(sample).totalTimeMs)
const { frames, excludedFutureCompletions } = parseAndroidFrames(snapshots.join('\n'), parseAndroidUptimeUpperBound(uptime))
const missedDeadlines = frames.filter(frame => frame.missedDeadline).length

const report = {
  schemaVersion: 1,
  status: excludedFutureCompletions === 0 ? 'measured' : 'partial',
  startup: {
    metric: 'ActivityManager.TotalTime',
    samplesMs: startupSamples,
    ...summarizeSamples(startupSamples)
  },
  scrolling: {
    metric: 'FrameCompleted - IntendedVsync',
    ...summarizeSamples(frames.map(frame => frame.durationMs)),
    missedDeadlines,
    missedDeadlinePercent: missedDeadlines / frames.length * 100,
    excludedFutureCompletions
  },
  qualification: 'Local measurements only; no performance budget or physical-device pass is established.'
}

const serialized = `${JSON.stringify(report, null, 2)}\n`

if (values.output) await writeFile(resolve(values.output), serialized)

process.stdout.write(serialized)

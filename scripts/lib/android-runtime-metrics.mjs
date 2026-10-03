import assert from 'node:assert/strict'

export const parseAndroidLaunch = output => {
  const fields = new Map(output.split('\n').map(line => {
    const separator = line.indexOf(':')

    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
  }))

  assert.equal(fields.get('Status'), 'ok', 'Android did not launch the activity successfully')

  assert.equal(fields.get('LaunchState'), 'COLD', 'Expected a process-cold activity launch')

  const totalTimeMs = Number(fields.get('TotalTime'))

  assert.ok(fields.has('TotalTime') && Number.isSafeInteger(totalTimeMs) && totalTimeMs > 0, 'Missing positive Android launch timing')

  return { totalTimeMs }
}

export const summarizeSamples = samples => {
  assert.ok(samples.length > 0 && samples.every(value => Number.isFinite(value) && value >= 0), 'Expected nonempty finite samples')

  const sorted = [...samples].sort((left, right) => left - right)
  const percentile = fraction => sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)]

  return { count: sorted.length, median: percentile(0.5), p95: percentile(0.95), max: sorted.at(-1) }
}

export const parseAndroidUptimeUpperBound = output => {
  const elapsed = output.trim().split(' ')[0]
  const parts = /^(\d+)\.(\d{1,9})$/.exec(elapsed)

  assert.ok(parts, 'Expected device uptime in seconds with fractional precision')

  const resolutionNs = 10n ** BigInt(9 - parts[2].length)

  // /proc/uptime truncates its fractional output; include one unit of printed precision.
  return BigInt(parts[1]) * 1_000_000_000n + BigInt(parts[2]) * resolutionNs + resolutionNs
}

const parseFrameRow = (columns, line, observedTimeNs) => {
  const values = line.split(',')
  const field = name => values[columns.indexOf(name)]

  if (field('Flags') !== '0') return null

  const intended = field('IntendedVsync')
  const completed = field('FrameCompleted')
  const deadline = field('FrameDeadline')

  assert.ok(intended && completed && /^\d+$/.test(intended) && /^\d+$/.test(completed), 'Invalid Android frame timestamp')

  const start = BigInt(intended)
  const end = BigInt(completed)

  // Android uses Long.MAX_VALUE for a frame whose completion is unavailable.
  if (end === 9223372036854775807n || end <= start) return null

  assert.ok(deadline && /^\d+$/.test(deadline), 'FrameDeadline is required for deadline-based comparison')

  if (end > observedTimeNs) return { key: `${intended}:${completed}`, futureCompletion: true }

  const target = BigInt(deadline)

  assert.ok(target > start, 'Frame deadline must follow its intended vsync')

  return { key: `${intended}:${completed}`, durationMs: Number(end - start) / 1_000_000, missedDeadline: end > target }
}

export const parseAndroidFrames = (output, observedTimeNs) => {
  assert.ok(typeof observedTimeNs === 'bigint' && observedTimeNs > 0n, 'A device observation timestamp is required')

  const frames = new Map()
  const futureCompletions = new Set()
  let columns = []

  for (const line of output.split('\n')) {
    if (line.startsWith('Flags,')) {
      columns = line.split(',')

      continue
    }

    if (line.startsWith('---PROFILEDATA---')) {
      columns = []

      continue
    }

    if (!columns.length || !line.trim()) continue

    const frame = parseFrameRow(columns, line, observedTimeNs)

    if (frame?.futureCompletion) futureCompletions.add(frame.key)
    else if (frame) frames.set(frame.key, { durationMs: frame.durationMs, missedDeadline: frame.missedDeadline })
  }

  assert.ok(frames.size > 0, 'Android did not return completed frame samples')

  return { frames: [...frames.values()], excludedFutureCompletions: futureCompletions.size }
}

// Read only the fixed ASCII fields used by the playground benchmark, not general XML content.
export const readAndroidUiNodes = xml => {
  assert.ok(xml.length <= 4 * 1024 * 1024, 'Android UI hierarchy is unexpectedly large')

  const nodes = []
  let position = 0

  while (position < xml.length) {
    const start = xml.indexOf('<node ', position)

    if (start < 0) break

    const end = xml.indexOf('>', start)

    assert.ok(end >= 0, 'Unterminated Android UI node')

    const tag = xml.slice(start, end)

    const attribute = name => {
      const marker = ` ${name}="`
      const offset = tag.indexOf(marker)

      if (offset < 0) return ''

      const valueStart = offset + marker.length
      const valueEnd = tag.indexOf('"', valueStart)

      assert.ok(valueEnd >= 0, 'Unterminated Android UI attribute')

      return tag.slice(valueStart, valueEnd)
    }

    const coordinates = /^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/.exec(attribute('bounds'))

    if (coordinates) {
      const [left, top, right, bottom] = coordinates.slice(1).map(Number)

      assert.ok([left, top, right, bottom].every(value => Number.isSafeInteger(value) && value <= 50000), 'Invalid Android UI bounds')

      if (right > left && bottom > top) {
        nodes.push({ text: attribute('text'), package: attribute('package'), scrollable: attribute('scrollable') === 'true', left, top, right, bottom })
      }
    }

    position = end + 1
  }

  return nodes
}

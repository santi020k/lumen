import assert from 'node:assert/strict'
import test from 'node:test'

import { synchronizeSwiftVersionSection } from './sync-swift-version.mjs'

test('synchronizes exact, compatible, and tagged Swift package versions inside one section', () => {
  const source = `before
Install LumenUI at 1.2.0, from 1.2.0, or tag v1.2.0.
After installation, keep 0.5.0 unchanged.
after`

  assert.equal(
    synchronizeSwiftVersionSection({
      end: 'After installation',
      source,
      start: 'Install LumenUI',
      version: '1.7.0-rc.0'
    }),
    `before
Install LumenUI at 1.7.0-rc.0, from 1.7.0-rc.0, or tag v1.7.0-rc.0.
After installation, keep 0.5.0 unchanged.
after`
  )
})

test('rejects documentation sections without a version', () => {
  assert.throws(
    () => synchronizeSwiftVersionSection({
      end: 'End',
      source: 'Start without a package version. End',
      start: 'Start',
      version: '2.0.0'
    }),
    /has no version/u
  )
})

test('rejects missing documentation boundaries', () => {
  assert.throws(
    () => synchronizeSwiftVersionSection({
      end: 'End',
      source: 'Unrelated 1.0.0 documentation.',
      start: 'Start',
      version: '2.0.0'
    }),
    /missing its start marker/u
  )
})

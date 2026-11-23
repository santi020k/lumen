import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

import { webConsumerAdapters } from './verify-web-consumers.mjs'

for (const platform of ['react', 'elements']) {
  test(`${platform} verifies the advertised v5 baseline separately from the workspace candidate`, async () => {
    const adapters = await webConsumerAdapters(platform, '5.0.0')
    const workspace = JSON.parse(await readFile(new URL(`../../../packages/${platform}/package.json`, import.meta.url), 'utf8'))

    assert.deepEqual(adapters.map(({ scope, version }) => ({ scope, version })), [
      { scope: 'baseline', version: '5.0.0' },
      { scope: 'workspace', version: workspace.version }
    ])

    assert.notEqual(adapters[0].adapter, adapters[1].adapter)

    for (const { adapter, version } of adapters) {
      const installed = JSON.parse(await readFile(join(adapter, 'package.json'), 'utf8'))

      assert.equal(installed.name, `@santi020k/lumen-${platform}`)

      assert.equal(installed.version, version)
    }
  })

  test(`${platform} retains the published v4 adapter for the 4.4.0 export contract`, async () => {
    const adapters = await webConsumerAdapters(platform, '4.4.0')

    assert.deepEqual(adapters.map(({ scope, version }) => ({ scope, version })), [
      { scope: 'baseline', version: '4.3.0' }
    ])
  })
}

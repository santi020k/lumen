import assert from 'node:assert/strict'
import test from 'node:test'

import { planVersionPackageCommands } from './version-packages.mjs'

const scripts = names => planVersionPackageCommands(names).map(([, arguments_]) => arguments_.join(' '))

test('a core and MCP release regenerates native catalogs and the plugin package after versioning', () => {
  const steps = scripts(['@santi020k/lumen-core', '@santi020k/lumen-mcp'])

  assert.deepEqual(steps, [
    'changeset version',
    'run sync:coordinated-v2-versions',
    'run sync:compose-version',
    'install --lockfile-only',
    'run generate:release-manifest',
    '--filter @santi020k/lumen-mcp run generate',
    'run generate:native-playground-catalogs',
    'run sync:plugin-mcp-version',
    'run generate:plugin-package'
  ])
})

test('the umbrella release keeps its Swift synchronization ahead of generated outputs', () => {
  const steps = scripts(['@santi020k/lumen', '@santi020k/lumen-core', '@santi020k/lumen-mcp'])

  assert.ok(steps.indexOf('run sync:swift-version') < steps.indexOf('run generate:native-playground-catalogs'))

  assert.ok(steps.indexOf('changeset version') < steps.indexOf('run sync:plugin-mcp-version'))

  assert.ok(steps.indexOf('run sync:plugin-mcp-version') < steps.indexOf('run generate:plugin-package'))
})

test('releases without core or MCP leave native catalogs and the plugin package alone', () => {
  for (const names of [['@santi020k/lumen-react-native'], ['@santi020k/lumen-react'], ['@santi020k/lumen-react-hook-form']]) {
    const steps = scripts(names)

    assert.ok(!steps.includes('run generate:native-playground-catalogs'), names.join(','))

    assert.ok(!steps.includes('run sync:plugin-mcp-version'), names.join(','))

    assert.ok(!steps.includes('run generate:plugin-package'), names.join(','))
  }
})

test('a web release that bumps MCP only through its snapshot does not repin the plugin', () => {
  const steps = scripts(['@santi020k/lumen-react'])

  assert.ok(steps.includes('--filter @santi020k/lumen-mcp run generate'))

  assert.ok(!steps.includes('run sync:plugin-mcp-version'))
})

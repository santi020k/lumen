import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * Builds the Hermes bytecode bundle that `harmony/entry/src/main/ets/pages/Index.ets` loads in
 * release mode. React Native 0.86 ships `hermesc` in `hermes-compiler` instead of
 * `react-native/sdks`, where the RNOH CLI looks by default, so pass its directory explicitly.
 */
const require = createRequire(import.meta.url)
const reactNativeDirectory = dirname(require.resolve('react-native/package.json'))
const hermesCompilerDirectory = dirname(require.resolve('hermes-compiler/package.json', { paths: [reactNativeDirectory] }))

const result = spawnSync('react-native', [
  'bundle-harmony',
  '--dev',
  'false',
  '--entry-file',
  'index.ts',
  '--js-engine',
  'hermes',
  '--hermesc-dir',
  join(hermesCompilerDirectory, 'hermesc'),
  ...process.argv.slice(2)
], { shell: process.platform === 'win32', stdio: 'inherit' })

if (result.error) throw result.error

process.exitCode = result.status ?? 1

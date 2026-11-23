// Runs every offline generator in --check mode and reports all drift at once.
// Use it before pushing after touching tokens, icons, registry data, or native catalogs.
// `pnpm run validate` remains the complete release gate.
import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

export const generatedChecks = [
  ['platform tokens', 'scripts/generate-platform-tokens.mjs'],
  ['platform icons', 'scripts/generate-platform-icons.mjs'],
  ['web icons', 'scripts/generate-web-icons.mjs'],
  ['platform graphics', 'scripts/generate-platform-graphics.mjs'],
  ['phone flags', 'scripts/generate-phone-flags.mjs'],
  ['Swift phone metadata', 'scripts/generate-swift-phone-metadata.mjs'],
  ['world map data', 'scripts/generate-world-map-data.mjs'],
  ['critical web CSS', 'scripts/generate-critical-web-css.mjs'],
  ['component CSS', 'scripts/generate-component-css.mjs'],
  ['native playground catalogs', 'scripts/generate-native-playground-catalogs.mjs'],
  ['native CLI registry', 'scripts/sync-native-cli-registry.mjs'],
  ['registry', 'scripts/sync-registry.mjs'],
  ['release manifest', 'scripts/generate-release-manifest.mjs'],
  ['Compose version', 'scripts/sync-compose-version.mjs'],
  ['Swift version', 'scripts/sync-swift-version.mjs'],
  ['plugin package', 'scripts/generate-plugin-package.mjs'],
  ['v4 migration', 'scripts/generate-v4-migration.mjs'],
  ['v5 migration', 'scripts/generate-v5-migration.mjs']
]

const run = ([name, script]) => new Promise(resolve => {
  const started = performance.now()
  const child = spawn(process.execPath, [script, '--check'], { cwd: repositoryRoot })
  let output = ''

  child.stdout.on('data', chunk => { output += chunk })

  child.stderr.on('data', chunk => { output += chunk })

  child.on('close', code => {
    resolve({ code, name, output: output.trim(), seconds: (performance.now() - started) / 1000 })
  })
})

const runAll = async (checks, concurrency) => {
  const results = []
  const queue = [...checks]

  const worker = async () => {
    for (let check = queue.shift(); check; check = queue.shift()) {
      const result = await run(check)

      results.push(result)

      console.log(`${result.code === 0 ? 'ok  ' : 'FAIL'} ${result.name} (${result.seconds.toFixed(1)}s)`)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))

  return results
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const concurrency = Math.max(1, Math.min(4, availableParallelism() - 1))
  const failures = (await runAll(generatedChecks, concurrency)).filter(result => result.code !== 0)

  for (const failure of failures) {
    console.error(`\n--- ${failure.name} ---\n${failure.output}`)
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} generated output check(s) failed. Run the matching generate:* script.`)

    process.exitCode = 1
  } else {
    console.log(`\nAll ${generatedChecks.length} generated outputs are current.`)
  }
}

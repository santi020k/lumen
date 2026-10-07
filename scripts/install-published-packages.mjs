import { spawnSync } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

// cspell:words ETARGET

const installationDiagnostic = result => [result.stdout, result.stderr].filter(Boolean).join('\n')

export const installPublishedPackages = async (specs, {
  run = () => spawnSync('npm', [
    'install', '--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund', '--', ...specs
  ], { encoding: 'utf8' }),
  wait = () => setTimeout(20_000),
  report = message => process.stderr.write(message)
} = {}) => {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const result = run()

    if (result.error) throw result.error

    if (result.status === 0) return

    const diagnostic = installationDiagnostic(result)

    if (!/^npm (?:error|ERR!) code ETARGET$/mu.test(diagnostic) || attempt === 6) {
      throw new Error(`Published package installation failed (exit ${result.status}).\n${diagnostic}`)
    }

    report(`Published version is not visible yet; retrying registry installation (${attempt}/6).\n`)

    await wait()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const specs = process.argv.slice(2)

  if (specs.length === 0) throw new Error('Provide exact published package specifications.')

  await installPublishedPackages(specs)
}

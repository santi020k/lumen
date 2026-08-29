import {
  classifyReleasePackages,
  readReleasePackageNamesFromEnvironment,
  resolveReleasePackageNames,
  runReleaseCommand
} from './release-scope.mjs'

const names = process.env.LUMEN_RELEASE_PACKAGES
  ? readReleasePackageNamesFromEnvironment()
  : await resolveReleasePackageNames()

const classification = classifyReleasePackages(names)
const includesUmbrella = names.includes('@santi020k/lumen')

runReleaseCommand('pnpm', ['changeset', 'version'])

runReleaseCommand('pnpm', ['run', 'sync:coordinated-v2-versions'])

if (classification.native) runReleaseCommand('pnpm', ['run', 'sync:compose-version'])

runReleaseCommand('pnpm', ['install', '--lockfile-only'])

runReleaseCommand('pnpm', ['run', 'generate:release-manifest'])

if (includesUmbrella) runReleaseCommand('pnpm', ['run', 'sync:swift-version'])

if (classification.mcp) {
  runReleaseCommand('pnpm', ['--filter', '@santi020k/lumen-mcp', 'run', 'generate'])
}

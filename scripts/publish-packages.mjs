import {
  buildReleasePackages,
  readReleasePackageNamesFromEnvironment,
  resolveReleasePackageNames,
  runReleaseCommand,
  validateReleasePackages
} from './release-scope.mjs'

const names = process.env.LUMEN_RELEASE_PACKAGES
  ? readReleasePackageNamesFromEnvironment()
  : await resolveReleasePackageNames()

const environment = {
  ...process.env,
  LUMEN_RELEASE_PACKAGES: JSON.stringify(names)
}

if (process.env.LUMEN_RELEASE_PREPARED !== 'true') {
  buildReleasePackages(names)

  validateReleasePackages(names)

  runReleaseCommand('pnpm', ['run', 'check:publish-dry-run'], { environment })
}

runReleaseCommand('pnpm', ['changeset', 'publish'], { environment })

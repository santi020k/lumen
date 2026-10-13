import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  classifyReleasePackages,
  readReleasePackageNamesFromEnvironment,
  resolveReleasePackageNames,
  runReleaseCommand
} from './release-scope.mjs'

/** Commands that prepare a release for the given package names, in order. */
export const planVersionPackageCommands = names => {
  const classification = classifyReleasePackages(names)
  const includesUmbrella = names.includes('@santi020k/lumen')

  const commands = [
    ['pnpm', ['changeset', 'version']],
    ['pnpm', ['run', 'sync:coordinated-v2-versions']]
  ]

  if (classification.native) commands.push(['pnpm', ['run', 'sync:compose-version']])

  commands.push(['pnpm', ['install', '--lockfile-only']], ['pnpm', ['run', 'generate:release-manifest']])

  if (includesUmbrella) commands.push(['pnpm', ['run', 'sync:swift-version']])

  if (classification.mcp) commands.push(['pnpm', ['--filter', '@santi020k/lumen-mcp', 'run', 'generate']])

  // Generated native catalogs show each adapter's release coordinate; the plugin pins MCP.
  if (includesUmbrella || classification.native || names.includes('@santi020k/lumen-core')) commands.push(['pnpm', ['run', 'generate:native-playground-catalogs']])

  if (classification.mcpPackage) {
    commands.push(['pnpm', ['run', 'sync:plugin-mcp-version']], ['pnpm', ['run', 'generate:plugin-package']])
  }

  return commands
}

const run = async () => {
  const names = process.env.LUMEN_RELEASE_PACKAGES
    ? readReleasePackageNamesFromEnvironment()
    : await resolveReleasePackageNames()

  for (const [command, arguments_] of planVersionPackageCommands(names)) runReleaseCommand(command, arguments_)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await run()

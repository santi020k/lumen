import { readFile } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'

import { major, satisfies, valid } from 'semver'

import { loadConsumerRelease } from './consumer-release.js'
import { bundledReleaseTarget, consumerPackageVersion, consumerReleaseVersions } from './consumer-release-versions.js'
import { type ConsumerInventory, inspectLumenConsumer } from './consumer-rollout.js'
import type { LumenDiagnosticFinding } from './integration-diagnostics.js'
import { discoverSourceFiles } from './v2-migration.js'
import { loadLumenV5Contract, type LumenV5Contract } from './v5-contract.js'

interface LumenConsumerUpgradeFinding extends LumenDiagnosticFinding {
  classification: 'compatibility-failure' | 'compatibility-review' | 'adoption-opportunity'
}

export interface LumenConsumerUpgradeAudit {
  nativeTargets?: { composeVersion: string, swiftTag: string }
  contract?: { publication: string, status: string, targetVersion: string }
  findings: LumenConsumerUpgradeFinding[]
  repository: string
  targetVersion: string
}

const review = (
  file: string, rule: string, message: string, remediation: string,
  classification: LumenConsumerUpgradeFinding['classification'] = 'compatibility-review'
): LumenConsumerUpgradeFinding => ({ file, rule, message, remediation, severity: 'advisory', classification })

const resolutionFindings = (
  inventory: ConsumerInventory, targetVersion: string, packageVersions?: Readonly<Record<string, string>>
): LumenConsumerUpgradeFinding[] => {
  const findings: LumenConsumerUpgradeFinding[] = []
  const declared = new Set(inventory.references.filter(item => item.source !== 'lockfile').map(item => item.packageName))

  for (const [name, versions] of Object.entries(inventory.resolvedVersions)) {
    const expectedVersion = consumerPackageVersion(name, targetVersion, packageVersions)

    if (versions.some(version => version !== expectedVersion)) {
      findings.push(review('pnpm-lock.yaml', 'consumer-resolved-version', `${name} resolves ${versions.join(', ')}; target is ${expectedVersion}.`, name === '@santi020k/lumen' && !declared.has(name) ? 'Refresh the transitive umbrella, verify compatible overrides and run a frozen install.' : 'Update through the repository package manager and verify the resulting lockfile with a frozen install.', 'compatibility-failure'))
    }
  }

  return findings
}

const versionFindings = (
  inventory: ConsumerInventory, targetVersion: string, packageVersions?: Readonly<Record<string, string>>
): LumenConsumerUpgradeFinding[] => {
  const findings: LumenConsumerUpgradeFinding[] = []

  for (const reference of inventory.references) {
    if (reference.source === 'lockfile' || reference.version.startsWith('workspace:') || reference.version.startsWith('catalog:')) continue

    const expectedVersion = consumerPackageVersion(reference.packageName, targetVersion, packageVersions)

    if (!satisfies(expectedVersion, reference.version)) {
      const version = major(targetVersion)
      const migration = [3, 4, 5].includes(version) ? `lumen migrate v${version} --dependencies` : 'the package-manager upgrade'

      findings.push(review(reference.file, 'consumer-package-version', `${reference.packageName} ${reference.version} does not include target ${expectedVersion}.`, `Preview ${migration}, align the adapter and companion packages, then validate the consumer.`, 'compatibility-failure'))
    }
  }

  findings.push(...resolutionFindings(inventory, targetVersion, packageVersions))

  for (const warning of inventory.warnings.filter(item => item.includes('has no verified resolution'))) {
    findings.push(review('pnpm-lock.yaml', 'consumer-resolution-unverified', warning, 'Generate the lockfile with pnpm and rerun the audit.', 'compatibility-review'))
  }

  for (const finding of inventory.integration.findings.filter(item => item.rule === 'framework-critical-style-coverage')) {
    findings.push({ ...finding, classification: 'compatibility-review' })
  }

  return findings
}

const sourceFindings = (file: string, source: string): LumenConsumerUpgradeFinding[] => {
  const findings: LumenConsumerUpgradeFinding[] = []

  if (file.endsWith('.patch') && (file.includes('lumen') || source.includes('@santi020k/lumen'))) {
    findings.push(review(file, 'consumer-package-patch', 'A local Lumen package patch needs migration review.', 'Compare each patch with the target implementation. Chart padding/axis fixes may already be upstream; remove only after equivalent behavior and mobile/desktop visuals pass.'))
  }

  if ((file.endsWith('.yaml') || file.endsWith('.json')) && source.includes('patchedDependencies') && source.includes('@santi020k/lumen')) {
    findings.push(review(file, 'consumer-patch-configuration', 'Lumen dependencies and package patch configuration coexist in this file.', 'Inspect the exact patched dependency keys and patch paths before upgrading; this signal alone does not establish that every Lumen dependency is patched.'))
  }

  if (file.endsWith('.css') && source.includes('.ui-')) {
    findings.push(review(file, 'consumer-css-review', 'CSS references Lumen component classes.', 'Check selectors against the public styling contract. Keep supported customization; review chart axes, hidden states, button children, record layouts and overlay offsets against target behavior.'))
  }

  return findings
}

const contractFindings = (
  file: string, source: string, contract: LumenV5Contract
): LumenConsumerUpgradeFinding[] => contract.changes.flatMap(change => {
  if (!change.extensions.includes(extname(file))) return []

  const signals = change.signals.filter(signal => source.includes(signal))

  if (!signals.length) return []

  return [review(file, change.id, `Source review signals: ${signals.join(', ')}. These matches can include comments or examples.`, change.migration, change.kind === 'adoption' ? 'adoption-opportunity' : 'compatibility-review')]
})

const migrationHistoryFindings = (inventory: ConsumerInventory): LumenConsumerUpgradeFinding[] => {
  const reviews: LumenConsumerUpgradeFinding[] = []
  const webAdapters = new Set(['@santi020k/lumen-astro', '@santi020k/lumen-react', '@santi020k/lumen-elements'])

  const installedMajors = inventory.references
    .filter(reference => reference.source === 'lockfile' && webAdapters.has(reference.packageName) && valid(reference.version))
    .map(reference => major(reference.version))

  const fromMajor = Math.min(...installedMajors)

  for (const nextMajor of [2, 3, 4, 5]) {
    if (fromMajor >= nextMajor) continue

    reviews.push(review('pnpm-lock.yaml', 'migration-history-review', `Review the v${nextMajor - 1} to v${nextMajor} contract when upgrading this consumer.`, `https://github.com/santi020k/lumen/blob/main/docs/migrating-v${nextMajor - 1}-to-v${nextMajor}.md`, 'compatibility-review'))
  }

  return reviews
}

export const inspectConsumerSource = async (
  root: string, contract?: LumenV5Contract
): Promise<LumenConsumerUpgradeFinding[]> => {
  const findings: LumenConsumerUpgradeFinding[] = []

  const files = await discoverSourceFiles(root, new Set([
    '.css',
    '.patch',
    '.yaml',
    '.json',
    ...(contract ? contract.changes.flatMap(change => change.extensions) : [])
  ]))

  for (const path of files) {
    const file = relative(root, path)
    const source = await readFile(path, 'utf8')

    findings.push(...sourceFindings(file, source))

    if (contract) findings.push(...contractFindings(file, source, contract))
  }

  return findings
}

/** Advisory inventory only: patches and product CSS are never deleted or rewritten. */
export const inspectLumenConsumerUpgrade = async (
  repository: string, targetVersion?: string, manifestPath?: string
): Promise<LumenConsumerUpgradeAudit> => {
  const release = await loadConsumerRelease(targetVersion, manifestPath)

  targetVersion ??= release?.version ?? await bundledReleaseTarget()

  if (!valid(targetVersion)) throw new Error('Consumer audit requires an exact semantic target version.')

  const root = resolve(repository)
  const inventory = await inspectLumenConsumer(root, targetVersion, release)
  const versions = inventory.packageTargets ?? await consumerReleaseVersions(targetVersion)
  const findings = versionFindings(inventory, targetVersion, versions)
  const contract = major(targetVersion) === 5 ? await loadLumenV5Contract() : undefined

  if (contract) findings.push(...migrationHistoryFindings(inventory))

  findings.push(...await inspectConsumerSource(root, contract))

  return { findings,
    ...(release ? { nativeTargets: { composeVersion: release.composeVersion, swiftTag: release.swiftTag } } : {}),
    repository: root,
    targetVersion,
    ...(contract ?
      { contract: {
        publication: contract.publication, status: contract.status, targetVersion: contract.targetVersion
      } } :
      {}) }
}

export const formatLumenConsumerUpgradeAudit = (report: LumenConsumerUpgradeAudit): string => [
  `Consumer upgrade review for ${report.targetVersion}: ${report.repository}`,
  ...(report.nativeTargets ? [`Native targets: Swift ${report.nativeTargets.swiftTag}, Compose ${report.nativeTargets.composeVersion}`] : []),
  ...(report.contract ? [`Contract ${report.contract.targetVersion}: ${report.contract.status}, ${report.contract.publication}. This is not evidence of registry availability.`] : []),
  ...report.findings.map(item => `${item.file} [${item.classification}: ${item.rule}] ${item.message}\n  ${item.remediation}`),
  report.findings.length ? 'These are review signals, not permission to remove consumer code.' : 'No package-version, patch or CSS review signals found.'
].join('\n')

import { readFile } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'

import { major, satisfies, valid } from 'semver'

import { type ConsumerInventory, inspectLumenConsumer } from './consumer-rollout.js'
import type { LumenDiagnosticFinding } from './integration-diagnostics.js'
import { discoverSourceFiles } from './v2-migration.js'
import { loadLumenV5Contract, type LumenV5Contract } from './v5-contract.js'

export interface LumenConsumerUpgradeFinding extends LumenDiagnosticFinding {
  classification: 'compatibility-failure' | 'compatibility-review' | 'adoption-opportunity'
}

export interface LumenConsumerUpgradeAudit {
  contract?: { publication: string, status: string, targetVersion: string }
  findings: LumenConsumerUpgradeFinding[]
  repository: string
  targetVersion: string
}

const review = (
  file: string, rule: string, message: string, remediation: string,
  classification: LumenConsumerUpgradeFinding['classification'] = 'compatibility-review'
): LumenConsumerUpgradeFinding => ({ file, rule, message, remediation, severity: 'advisory', classification })

const versionFindings = (inventory: ConsumerInventory, targetVersion: string): LumenConsumerUpgradeFinding[] => {
  const findings: LumenConsumerUpgradeFinding[] = []

  for (const reference of inventory.references) {
    if (reference.version.startsWith('workspace:') || reference.version.startsWith('catalog:')) continue

    if (!satisfies(targetVersion, reference.version)) {
      const version = major(targetVersion)
      const migration = [3, 4, 5].includes(version) ? `lumen migrate v${version} --dependencies` : 'the package-manager upgrade'

      findings.push(review(reference.file, 'consumer-package-version', `${reference.packageName} ${reference.version} does not include target ${targetVersion}.`, `Preview ${migration}, align the adapter and companion packages, then validate the consumer.`, 'compatibility-failure'))
    }
  }

  for (const [name, versions] of Object.entries(inventory.resolvedVersions)) {
    if (versions.some(version => version !== targetVersion)) {
      findings.push(review('pnpm-lock.yaml', 'consumer-resolved-version', `${name} resolves ${versions.join(', ')}; target is ${targetVersion}.`, 'Update through the repository package manager and inspect the resulting lockfile; a compatible manifest range does not prove installation.', 'compatibility-failure'))
    }
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

/** Advisory inventory only: patches and product CSS are never deleted or rewritten. */
export const inspectLumenConsumerUpgrade = async (
  repository: string, targetVersion = '4.0.0'
): Promise<LumenConsumerUpgradeAudit> => {
  if (!valid(targetVersion)) throw new Error('Consumer audit requires an exact semantic target version.')

  const root = resolve(repository)
  const inventory = await inspectLumenConsumer(root)
  const findings = versionFindings(inventory, targetVersion)
  const contract = major(targetVersion) === 5 ? await loadLumenV5Contract() : undefined

  const files = await discoverSourceFiles(root, new Set([
    '.css',
    '.patch',
    '.yaml',
    '.json',
    ...(contract ? ['.astro', '.html', '.htm', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.yml', '.sh'] : [])
  ]))

  for (const path of files) {
    const file = relative(root, path)
    const source = await readFile(path, 'utf8')

    findings.push(...sourceFindings(file, source))

    if (contract) findings.push(...contractFindings(file, source, contract))
  }

  return { findings,
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
  ...(report.contract ? [`Contract ${report.contract.targetVersion}: ${report.contract.status}, ${report.contract.publication}. This is not evidence of registry availability.`] : []),
  ...report.findings.map(item => `${item.file} [${item.classification}: ${item.rule}] ${item.message}\n  ${item.remediation}`),
  report.findings.length ? 'These are review signals, not permission to remove consumer code.' : 'No package-version, patch or CSS review signals found.'
].join('\n')

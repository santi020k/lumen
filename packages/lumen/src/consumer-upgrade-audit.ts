import { readFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

import { satisfies, valid } from 'semver'

import { type ConsumerInventory, inspectLumenConsumer } from './consumer-rollout.js'
import type { LumenDiagnosticFinding } from './integration-diagnostics.js'
import { discoverSourceFiles } from './v2-migration.js'

export interface LumenConsumerUpgradeAudit {
  findings: LumenDiagnosticFinding[]
  repository: string
  targetVersion: string
}

const review = (file: string, rule: string, message: string, remediation: string): LumenDiagnosticFinding => ({ file, rule, message, remediation, severity: 'advisory' })

const versionFindings = (inventory: ConsumerInventory, targetVersion: string): LumenDiagnosticFinding[] => {
  const findings: LumenDiagnosticFinding[] = []

  for (const reference of inventory.references) {
    if (reference.version.startsWith('workspace:') || reference.version.startsWith('catalog:')) continue

    if (!satisfies(targetVersion, reference.version)) {
      findings.push(review(reference.file, 'consumer-package-version', `${reference.packageName} ${reference.version} does not include target ${targetVersion}.`, 'Preview lumen migrate v4 --dependencies, align the adapter and companion packages, then validate the consumer.'))
    }
  }

  for (const [name, versions] of Object.entries(inventory.resolvedVersions)) {
    if (versions.some(version => version !== targetVersion)) {
      findings.push(review('pnpm-lock.yaml', 'consumer-resolved-version', `${name} resolves ${versions.join(', ')}; target is ${targetVersion}.`, 'Update through the repository package manager and inspect the resulting lockfile; a compatible manifest range does not prove installation.'))
    }
  }

  return findings
}

const sourceFindings = (file: string, source: string): LumenDiagnosticFinding[] => {
  const findings: LumenDiagnosticFinding[] = []

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

/** Advisory inventory only: patches and product CSS are never deleted or rewritten. */
export const inspectLumenConsumerUpgrade = async (
  repository: string, targetVersion = '4.0.0'
): Promise<LumenConsumerUpgradeAudit> => {
  if (!valid(targetVersion)) throw new Error('Consumer audit requires an exact semantic target version.')

  const root = resolve(repository)
  const inventory = await inspectLumenConsumer(root)
  const findings = versionFindings(inventory, targetVersion)
  const files = await discoverSourceFiles(root, new Set(['.css', '.patch', '.yaml', '.json']))

  for (const path of files) findings.push(...sourceFindings(relative(root, path), await readFile(path, 'utf8')))

  return { findings, repository: root, targetVersion }
}

export const formatLumenConsumerUpgradeAudit = (report: LumenConsumerUpgradeAudit): string => [
  `Consumer upgrade review for ${report.targetVersion}: ${report.repository}`,
  ...report.findings.map(item => `${item.file} [${item.rule}] ${item.message}\n  ${item.remediation}`),
  report.findings.length ? 'These are review signals, not permission to remove consumer code.' : 'No package-version, patch or CSS review signals found.'
].join('\n')

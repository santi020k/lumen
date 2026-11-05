import { readFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'

import { satisfies, valid } from 'semver'

import { type ConsumerRelease, loadConsumerRelease } from './consumer-release.js'
import { type ConsumerInventory, inspectLumenConsumer } from './consumer-rollout.js'
import type { LumenDiagnosticFinding } from './integration-diagnostics.js'
import { discoverSourceFiles } from './v2-migration.js'

export interface LumenConsumerUpgradeAudit {
  findings: LumenDiagnosticFinding[]
  repository: string
  nativeTargets?: { composeVersion: string, swiftTag: string }
  targetVersion: string
}

const review = (file: string, rule: string, message: string, remediation: string): LumenDiagnosticFinding => ({ file, rule, message, remediation, severity: 'advisory' })

const declarationFindings = (inventory: ConsumerInventory, targetVersion: string): LumenDiagnosticFinding[] => (
  inventory.references.flatMap(({ file, packageName, source, version }) => {
    if (source === 'lockfile' || /^(?:workspace:|catalog:)/u.test(version)) return []

    const target = inventory.packageTargets?.[packageName] ?? targetVersion

    return satisfies(target, version) ?
      [] :
      [review(
        file, 'consumer-package-version', `${packageName} ${version} does not include target ${target}.`, 'Preview lumen rollout for the selected release, then validate the consumer.'
      )]
  })
)

const resolutionFindings = (inventory: ConsumerInventory, targetVersion: string): LumenDiagnosticFinding[] => {
  const missing = inventory.warnings.filter(item => item.includes('has no verified resolution')).map(message => review(
    'pnpm-lock.yaml', 'consumer-resolution-unverified', message, 'Generate the lockfile with pnpm and rerun the audit.'
  ))

  const declarations = new Set(inventory.references.filter(item => item.source !== 'lockfile').map(item => item.packageName))

  const mismatches = Object.entries(inventory.resolvedVersions).flatMap(([name, versions]) => {
    const target = inventory.packageTargets?.[name] ?? targetVersion

    if (versions.every(version => version === target)) return []

    const remediation = name === '@santi020k/lumen' && !declarations.has(name) ?
      `Refresh the transitive umbrella even if adapter versions stay unchanged. If compatible ranges keep the older resolution, use a pnpm override for ${name}@${target}, reinstall, and verify with a frozen install and this audit.` :
      'Update through the repository package manager and verify the resulting lockfile with a frozen install and this audit.'

    return [review('pnpm-lock.yaml', 'consumer-resolved-version', `${name} resolves ${versions.join(', ')}; target is ${target}.`, remediation)]
  })

  return [...missing, ...mismatches]
}

const versionFindings = async (
  root: string,
  targetVersion: string,
  release: ConsumerRelease | undefined
): Promise<LumenDiagnosticFinding[]> => {
  const inventory = await inspectLumenConsumer(root, targetVersion, release)

  return [
    ...declarationFindings(inventory, targetVersion),
    ...resolutionFindings(inventory, targetVersion),
    ...inventory.integration.findings.filter(item => item.rule === 'framework-critical-style-coverage')
  ]
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

export const inspectConsumerSource = async (root: string): Promise<LumenDiagnosticFinding[]> => {
  const findings: LumenDiagnosticFinding[] = []
  const files = await discoverSourceFiles(root, new Set(['.css', '.patch', '.yaml', '.json']))

  for (const path of files) findings.push(...sourceFindings(relative(root, path), await readFile(path, 'utf8')))

  return findings
}

/** Advisory inventory only: patches and product CSS are never deleted or rewritten. */
export const inspectLumenConsumerUpgrade = async (
  repository: string, requestedVersion?: string, manifestPath?: string
): Promise<LumenConsumerUpgradeAudit> => {
  if (requestedVersion !== undefined && !valid(requestedVersion)) throw new Error('Consumer audit requires an exact semantic target version.')

  const root = resolve(repository)
  const release = await loadConsumerRelease(requestedVersion, manifestPath)
  const targetVersion = release?.version ?? requestedVersion ?? '4.0.0'
  const findings = await versionFindings(root, targetVersion, release)

  findings.push(...await inspectConsumerSource(root))

  return {
    findings,
    repository: root,
    targetVersion,
    ...(release ? { nativeTargets: { composeVersion: release.composeVersion, swiftTag: release.swiftTag } } : {})
  }
}

export const formatLumenConsumerUpgradeAudit = (report: LumenConsumerUpgradeAudit): string => [
  `Consumer upgrade review for ${report.targetVersion}: ${report.repository}`,
  ...(report.nativeTargets ? [`Native targets: Swift ${report.nativeTargets.swiftTag}, Compose ${report.nativeTargets.composeVersion}`] : []),
  ...report.findings.map(item => `${item.file} [${item.rule}] ${item.message}\n  ${item.remediation}`),
  report.findings.length ? 'These are review signals, not permission to remove consumer code.' : 'No package-version, patch or CSS review signals found.'
].join('\n')

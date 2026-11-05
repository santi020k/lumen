import type { LumenData } from './data.js'
import { loadLumenData } from './data.js'
import type { LumenToolResult } from './tools.js'

export const getMigration = (
  args: { packageName?: string | undefined, targetVersion?: '4.0.0' | '5.0.0' | undefined } = {},
  data: LumenData = loadLumenData()
): LumenToolResult<{
  changes: (LumenData['migration']['changes'][number] & { classification: 'compatibility-review' | 'adoption-opportunity' })[]
  contractSource: string
  publication?: string
  status: string
  targetVersion: string
}> => {
  const commandVersion = args.targetVersion === '5.0.0' ? 'v5' : 'v4'
  const contract = args.targetVersion === '5.0.0' ? data.migrationV5 : data.migration
  const contractSource = args.targetVersion === '5.0.0' ? 'registry/lumen-5-contract.json' : 'registry/lumen-4-contract.json'

  const changes = contract.changes
    .filter(change => !args.packageName || change.packages.includes(args.packageName))
    .map(({ currentContract, docs, id, kind, migration, packages, replacement }) => ({
      classification: kind === 'adoption' ? 'adoption-opportunity' as const : 'compatibility-review' as const,
      currentContract,
      docs,
      id,
      migration,
      packages,
      replacement
    }))

  return {
    data: { changes,
      contractSource,
      status: contract.status,
      targetVersion: contract.targetVersion,
      ...(contract.publication ? { publication: contract.publication } : {}) },
    text: [
      `Lumen ${contract.targetVersion} migration (${contract.status}).`,
      `Preview lumen migrate ${commandVersion} --dry-run --json in the consumer. Review application-specific behavior and dependency versions before applying changes.`,
      ...(contract.publication ? [`Publication: ${contract.publication}. Bundled contract evidence does not establish registry availability or consumer compatibility.`] : []),
      ...changes.map(change => `## ${change.id} (${change.classification})\n${change.currentContract}\nReplacement: ${change.replacement}\nMigration: ${change.migration}\nReferences: ${change.docs.join(', ')}`)
    ].join('\n\n')
  }
}

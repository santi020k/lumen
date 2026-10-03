import type { LumenData } from './data.js'
import { loadLumenData } from './data.js'
import type { LumenToolResult } from './tools.js'

export const getMigration = (
  args: { packageName?: string | undefined } = {},
  data: LumenData = loadLumenData()
): LumenToolResult<{
  changes: LumenData['migration']['changes']
  status: string
  targetVersion: string
}> => {
  const changes = data.migration.changes
    .filter(change => !args.packageName || change.packages.includes(args.packageName))
    .map(({ currentContract, docs, id, migration, packages, replacement }) => ({
      currentContract, docs, id, migration, packages, replacement
    }))

  return {
    data: { changes, status: data.migration.status, targetVersion: data.migration.targetVersion },
    text: [
      `Lumen ${data.migration.targetVersion} migration (${data.migration.status}).`,
      'Preview lumen migrate v4 --dry-run --json in the consumer. Review application-specific behavior and dependency versions before applying changes.',
      ...changes.map(change => `## ${change.id}\n${change.currentContract}\nReplacement: ${change.replacement}\nMigration: ${change.migration}\nReferences: ${change.docs.join(', ')}`)
    ].join('\n\n')
  }
}

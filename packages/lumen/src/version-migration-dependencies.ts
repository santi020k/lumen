import { runConsumerRollout } from './consumer-rollout.js'

export interface LumenMigrationDependencyOptions {
  allowDirty?: boolean
  apply?: boolean
  dependencies?: boolean
}

/** Dependency mutations precede source edits so rollout's dirty-worktree guard stays authoritative. */
export const applyLumenVersionMigrationDependencies = (
  root: string,
  targetVersion: string,
  options: LumenMigrationDependencyOptions
) => runConsumerRollout({
  allowDirty: options.allowDirty === true,
  apply: options.apply === true,
  repositories: [root],
  targetVersion,
  // Verify after source migration, through the consumer's normal completion gate.
  verify: false
})

import { createHash } from 'node:crypto'

const withoutApproval = contract => {
  const migration = structuredClone(contract)

  migration.status = 'draft'

  delete migration.approval

  return migration
}

export const createCatalogHash = payload => createHash('sha256')
  .update(JSON.stringify({
    ...payload,
    migration: withoutApproval(payload.migration),
    ...(payload.migrationV5 === undefined ? {} : { migrationV5: withoutApproval(payload.migrationV5) })
  }))
  .digest('hex')

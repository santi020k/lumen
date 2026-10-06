import { createHash } from 'node:crypto'

export const createCatalogHash = payload => {
  const migration = structuredClone(payload.migration)

  migration.status = 'draft'

  delete migration.approval

  return createHash('sha256')
    .update(JSON.stringify({ ...payload, migration }))
    .digest('hex')
}

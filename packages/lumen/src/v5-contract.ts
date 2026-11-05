import { readFile } from 'node:fs/promises'

interface LumenV5ContractChange {
  extensions: string[]
  id: string
  kind: 'adoption' | 'breaking'
  migration: string
  packages: string[]
  signals: string[]
}

export interface LumenV5Contract {
  changes: LumenV5ContractChange[]
  publication: string
  status: string
  targetVersion: '5.0.0'
}

const record = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
)

const stringList = (value: unknown): string[] => {
  if (!Array.isArray(value) || !value.every((item: unknown) => typeof item === 'string')) {
    throw new Error('Invalid v5 migration contract list.')
  }

  return value
}

/** Bundled authoritative contract; never downloads a contract or executes consumer code. */
export const loadLumenV5Contract = async (): Promise<LumenV5Contract> => {
  const value: unknown = JSON.parse(await readFile(new URL('../v5-migration.json', import.meta.url), 'utf8'))

  if (!record(value) || value.targetVersion !== '5.0.0' || typeof value.status !== 'string' ||
    typeof value.publication !== 'string' || !Array.isArray(value.changes)) {
    throw new Error('Invalid v5 migration contract.')
  }

  const changes = value.changes.map((entry: unknown): LumenV5ContractChange => {
    if (!record(entry) || typeof entry.id !== 'string' || typeof entry.migration !== 'string' ||
      (entry.kind !== 'breaking' && entry.kind !== 'adoption')) throw new Error('Invalid v5 migration rule.')

    return { extensions: stringList(entry.extensions),
      id: entry.id,
      kind: entry.kind,
      migration: entry.migration,
      packages: stringList(entry.packages),
      signals: stringList(entry.signals) }
  })

  return { changes, publication: value.publication, status: value.status, targetVersion: value.targetVersion }
}

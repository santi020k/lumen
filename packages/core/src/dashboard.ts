export interface LumenChangeSummaryItem {
  id: string
  label: string
  before: string
  after: string
  /** The application decides equality and whether the proposal is meaningful. */
  changed: boolean
}

export interface LumenActiveFilter {
  id: string
  label: string
  value: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const isChange = (value: unknown): value is LumenChangeSummaryItem => isRecord(value) && typeof value.id === 'string' && value.id.length > 0 &&
  typeof value.label === 'string' && typeof value.before === 'string' &&
  typeof value.after === 'string' && typeof value.changed === 'boolean'

const isFilter = (value: unknown): value is LumenActiveFilter => isRecord(value) && typeof value.id === 'string' && value.id.length > 0 &&
  typeof value.label === 'string' && typeof value.value === 'string'

const readItems = <T extends { id: string }>(value: unknown, guard: (item: unknown) => item is T): T[] => {
  if (!Array.isArray(value)) throw new TypeError('Dashboard items must be an array')

  const ids = new Set<string>()
  const result: T[] = []

  for (const item of value) {
    if (!guard(item) || ids.has(item.id)) throw new TypeError('Dashboard items require valid, unique IDs')

    ids.add(item.id)

    result.push({ ...item })
  }

  return result
}

export const readLumenChangeSummaryItems = (value: unknown): LumenChangeSummaryItem[] => readItems(value, isChange)
export const readLumenActiveFilters = (value: unknown): LumenActiveFilter[] => readItems(value, isFilter)

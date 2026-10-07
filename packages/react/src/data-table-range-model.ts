export interface DataTableViewRange {
  id: string
  from: string
  to: string
}

export const isDataTableRange = (value: unknown): value is DataTableViewRange => (
  typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string' &&
  'from' in value && typeof value.from === 'string' && 'to' in value && typeof value.to === 'string'
)

const comparable = (value: unknown, kind: 'number' | 'date'): number | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined

  if (String(value).trim() === '') return undefined

  if (kind === 'number') {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : undefined
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return undefined

  const parsed = Date.parse(value)

  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value ? parsed : undefined
}

const matchesBound = (value: number, bound: string, kind: 'number' | 'date', lower: boolean): boolean => {
  if (bound === '') return true

  const parsed = comparable(bound, kind)

  if (parsed === undefined) return false

  return lower ? value >= parsed : value <= parsed
}

export const matchesDataTableRange = (value: unknown, range: unknown, kind: 'number' | 'date'): boolean => {
  if (!isDataTableRange(range)) return false

  const current = comparable(value, kind)

  return current !== undefined && matchesBound(current, range.from, kind, true) &&
    matchesBound(current, range.to, kind, false)
}

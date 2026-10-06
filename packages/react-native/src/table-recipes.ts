export type LumenTableSortValue = boolean | number | string | null
export interface LumenTableCell { text: string, sortValue?: LumenTableSortValue }
export interface LumenTableColumn { key: string, label: string, sortable?: boolean }
export interface LumenTableRow {
  id: string
  label: string
  cells: Readonly<Record<string, LumenTableCell>>
  disabled?: boolean
}
export interface LumenTableSort { key: string, direction: 'ascending' | 'descending' }
export type LumenTableSortMode = 'client' | 'manual'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const validSortValue = (value: unknown): boolean => value === undefined || value === null ||
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

const validCell = (value: unknown): value is LumenTableCell => isRecord(value) && typeof value.text === 'string' && validSortValue(value.sortValue)

const validColumn = (value: unknown): value is LumenTableColumn => {
  if (!isRecord(value) || typeof value.key !== 'string' || typeof value.label !== 'string') return false

  return value.sortable === undefined || typeof value.sortable === 'boolean'
}

const optionalBoolean = (value: unknown): boolean => value === undefined || typeof value === 'boolean'

const validRow = (value: unknown): value is LumenTableRow => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string' || !isRecord(value.cells)) return false

  if (!optionalBoolean(value.disabled)) return false

  return Object.values(value.cells).every(validCell)
}

const uniqueIdentity = (value: string, seen: ReadonlySet<string>): boolean => value.length > 0 && !seen.has(value)

export const validateLumenTable = (columns: readonly LumenTableColumn[], rows: readonly LumenTableRow[]): boolean => {
  if (!Array.isArray(columns) || !Array.isArray(rows)) return false

  const columnKeys = new Set<string>()
  const rowIds = new Set<string>()

  for (const column of columns as readonly unknown[]) {
    if (!validColumn(column) || !uniqueIdentity(column.key, columnKeys)) return false

    columnKeys.add(column.key)
  }

  for (const row of rows as readonly unknown[]) {
    if (!validRow(row) || !uniqueIdentity(row.id, rowIds)) return false

    rowIds.add(row.id)
  }

  return true
}

export const nextLumenTableSort = (sort: LumenTableSort | null, key: string): LumenTableSort | null => {
  if (sort?.key !== key) return { key, direction: 'ascending' }

  return sort.direction === 'ascending' ? { key, direction: 'descending' } : null
}

export const getLumenTableCell = (row: LumenTableRow, key: string): LumenTableCell | undefined => {
  if (!Object.hasOwn(row.cells, key)) return undefined

  return row.cells[key]
}

const sortValue = (row: LumenTableRow, key: string): LumenTableSortValue => {
  const cell = getLumenTableCell(row, key)

  if (!cell) return null

  const value = cell.sortValue === undefined ? cell.text : cell.sortValue

  return typeof value === 'number' && !Number.isFinite(value) ? null : value
}

const valueRank = (value: Exclude<LumenTableSortValue, null>): number => {
  if (typeof value === 'number') return 0

  return typeof value === 'boolean' ? 1 : 2
}

const compareValues = (a: Exclude<LumenTableSortValue, null>, b: Exclude<LumenTableSortValue, null>,
  collator: Intl.Collator): number => {
  const rank = valueRank(a) - valueRank(b)

  if (rank !== 0) return rank

  if (typeof a === 'number' && typeof b === 'number') {
    if (a === b) return 0

    return a < b ? -1 : 1
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)

  return collator.compare(String(a), String(b))
}

const tableCollator = (locale?: string): Intl.Collator => {
  try {
    return new Intl.Collator(locale, { sensitivity: 'base' })
  } catch (error) {
    if (!(error instanceof RangeError)) throw error

    return new Intl.Collator(undefined, { sensitivity: 'base' })
  }
}

export const sortLumenTableRows = (rows: readonly LumenTableRow[], columns: readonly LumenTableColumn[],
  sort: LumenTableSort | null, mode: LumenTableSortMode, locale?: string): readonly LumenTableRow[] => {
  if (mode === 'manual' || !sort || !columns.some(column => column.key === sort.key && column.sortable)) return rows

  const collator = tableCollator(locale)

  return rows.map((row, index) => ({ row, index })).sort((left, right) => {
    const a = sortValue(left.row, sort.key)
    const b = sortValue(right.row, sort.key)

    if (a === null) return b === null ? left.index - right.index : 1

    if (b === null) return -1

    const compared = compareValues(a, b, collator)

    if (compared === 0) return left.index - right.index

    return sort.direction === 'ascending' ? compared : -compared
  }).map(({ row }) => row)
}

export const toggleLumenTableRow = (selection: ReadonlySet<string>, row: LumenTableRow): Set<string> => {
  const next = new Set(selection)

  if (row.disabled) return next

  if (next.has(row.id)) next.delete(row.id)
  else next.add(row.id)

  return next
}

export const toggleLumenTableVisibleRows = (selection: ReadonlySet<string>,
  rows: readonly LumenTableRow[]): Set<string> => {
  const next = new Set(selection)
  const available = rows.filter(row => !row.disabled)
  const allSelected = available.every(row => selection.has(row.id))

  for (const row of available) {
    if (allSelected) next.delete(row.id)
    else next.add(row.id)
  }

  return next
}

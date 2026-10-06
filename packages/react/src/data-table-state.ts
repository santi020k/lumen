import { isDataTableRange } from './data-table-range-model.js'
import type { DataTableViewState } from './data-table-view.js'

export const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const assertPagination = (pagination: unknown) => {
  if (!isRecord(pagination) || !Number.isSafeInteger(pagination.pageSize) ||
    typeof pagination.pageSize !== 'number' || pagination.pageSize <= 0 ||
    !Number.isSafeInteger(pagination.pageIndex) || typeof pagination.pageIndex !== 'number' || pagination.pageIndex < 0)
    throw new RangeError('DataTableView requires a positive integer page size and a nonnegative integer page index.')
}

const isFilter = (filter: unknown): boolean => (
  isRecord(filter) && typeof filter.id === 'string' && typeof filter.value === 'string'
)

const isSort = (sort: unknown): boolean => (
  isRecord(sort) && typeof sort.id === 'string' && typeof sort.desc === 'boolean'
)

const isDensity = (density: unknown): boolean => density === 'comfortable' || density === 'compact'

const everyItem = (
  value: unknown, validate: (item: unknown) => boolean
): boolean => Array.isArray(value) && Array.from(value).every(validate)

const validPreferences = (state: Record<string, unknown>): boolean => typeof state.search === 'string' && isRecord(state.visibility) &&
  Object.values(state.visibility).every(value => typeof value === 'boolean') &&
  everyItem(state.filters, isFilter) && everyItem(state.sorting, isSort) && isDensity(state.density)

export const assertViewState: (state: unknown) => asserts state is DataTableViewState = state => {
  if (!isRecord(state) || !validPreferences(state) ||
    (state.ranges !== undefined && !everyItem(state.ranges, isDataTableRange)))
    throw new TypeError('DataTableView requires valid search, filters, visibility, sorting and density state.')

  assertPagination(state.pagination)
}

/** Validate an untrusted saved state and copy only view preferences, never records or selection. */
export const parseDataTableViewState = (value: unknown): DataTableViewState => {
  assertViewState(value)

  return {
    search: value.search,
    filters: value.filters.map(filter => ({ id: filter.id, value: filter.value })),
    visibility: { ...value.visibility },
    pagination: { pageIndex: value.pagination.pageIndex, pageSize: value.pagination.pageSize },
    sorting: value.sorting.map(sort => ({ id: sort.id, desc: sort.desc })),
    density: value.density,
    ...(value.ranges === undefined ?
      {} :
      {
        ranges: value.ranges.map(range => ({ id: range.id, from: range.from, to: range.to }))
      })
  }
}

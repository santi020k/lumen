export type LumenSortDirection = 'asc' | 'desc'

export interface LumenDataViewState {
  filters: Record<string, string>
  page: number
  pageSize: number
  pinnedColumns: string[]
  query: string
  selectedIds: string[]
  sort?: {
    direction: LumenSortDirection
    key: string
  }
}

export type LumenDataRecord = Record<string, number | string | undefined>

export interface LumenKeyValueReader {
  getItem: (key: string) => null | string
}

export interface LumenKeyValueWriter {
  setItem: (key: string, value: string) => void
}

export interface LumenKeyValueStorage extends LumenKeyValueReader, LumenKeyValueWriter {}

export interface LumenDataViewServerRequest {
  query: string
  state: LumenDataViewState
  url: string
}

export const createDataViewState = (state: Partial<LumenDataViewState> = {}): LumenDataViewState => ({
  filters: state.filters ?? {},
  page: state.page ?? 1,
  pageSize: state.pageSize ?? 25,
  pinnedColumns: state.pinnedColumns ?? [],
  query: state.query ?? '',
  selectedIds: state.selectedIds ?? [],
  ...(state.sort ? { sort: state.sort } : {})
})

export const serializeDataViewState = (state: LumenDataViewState): string => {
  const params = new URLSearchParams()

  params.set('page', String(state.page))

  params.set('pageSize', String(state.pageSize))

  if (state.query) params.set('q', state.query)

  if (state.sort) params.set('sort', `${state.sort.key}:${state.sort.direction}`)

  for (const [key, value] of Object.entries(state.filters)) {
    if (value) params.set(`filter.${key}`, value)
  }

  if (state.pinnedColumns.length) params.set('pinned', state.pinnedColumns.join(','))

  if (state.selectedIds.length) params.set('selected', state.selectedIds.join(','))

  return params.toString()
}

const parseDataViewFilters = (params: URLSearchParams): Record<string, string> => {
  const filters: Record<string, string> = {}

  for (const [key, filterValue] of params.entries()) {
    if (key.startsWith('filter.')) {
      filters[key.slice('filter.'.length)] = filterValue
    }
  }

  return filters
}

const parseDataViewSort = (sort: null | string): LumenDataViewState['sort'] => {
  if (!sort) return undefined

  return {
    direction: sort.endsWith(':desc') ? 'desc' : 'asc',
    key: sort.split(':')[0] ?? ''
  }
}

export const parseDataViewState = (value: string): LumenDataViewState => {
  const params = new URLSearchParams(value)
  const sort = params.get('sort')
  const parsedSort = parseDataViewSort(sort)

  return createDataViewState({
    filters: parseDataViewFilters(params),
    page: Number(params.get('page') ?? 1),
    pageSize: Number(params.get('pageSize') ?? 25),
    pinnedColumns: params.get('pinned')?.split(',').filter(Boolean) ?? [],
    query: params.get('q') ?? '',
    selectedIds: params.get('selected')?.split(',').filter(Boolean) ?? [],
    ...(parsedSort ? { sort: parsedSort } : {})
  })
}

export const getVirtualRange = (
  scrollOffset: number,
  viewportSize: number,
  itemSize: number,
  itemCount: number,
  overscan = 4
) => {
  const startIndex = Math.max(0, Math.floor(scrollOffset / itemSize) - overscan)
  const visibleCount = Math.ceil(viewportSize / itemSize) + overscan * 2
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount)

  return {
    endIndex,
    startIndex
  }
}

const recordMatchesQuery = (record: LumenDataRecord, query: string): boolean => {
  if (!query) return true

  return Object.values(record)
    .some(value => String(value ?? '').toLowerCase().includes(query))
}

const recordMatchesFilters = (record: LumenDataRecord, filters: LumenDataViewState['filters']): boolean =>
  Object.entries(filters)
    .every(([key, value]) => !value || String(record[key] ?? '') === value)

export const filterDataRecords = <T extends LumenDataRecord>(
  records: readonly T[],
  state: Pick<LumenDataViewState, 'filters' | 'query'>
): T[] => {
  const query = state.query.trim().toLowerCase()

  return records.filter(record => recordMatchesQuery(record, query) && recordMatchesFilters(record, state.filters))
}

export const sortDataRecords = <T extends LumenDataRecord>(
  records: readonly T[],
  sort: LumenDataViewState['sort']
): T[] => {
  if (!sort) return [...records]

  const direction = sort.direction === 'desc' ? -1 : 1

  return [...records].sort((a, b) => {
    const valueA = a[sort.key]
    const valueB = b[sort.key]

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return (valueA - valueB) * direction
    }

    return String(valueA ?? '').localeCompare(String(valueB ?? '')) * direction
  })
}

export const paginateDataRecords = <T>(
  records: readonly T[],
  page: number,
  pageSize: number
) => {
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize

  return {
    items: records.slice(start, start + pageSize),
    page: safePage,
    pageCount: Math.max(1, Math.ceil(records.length / pageSize)),
    total: records.length
  }
}

export const applyDataViewState = <T extends LumenDataRecord>(
  records: readonly T[],
  state: LumenDataViewState
) => paginateDataRecords(
  sortDataRecords(filterDataRecords(records, state), state.sort),
  state.page,
  state.pageSize
)

export const createDataViewStorageKey = (name: string): string =>
  `lumen:data-view:${name.trim().toLowerCase().replaceAll(/\s+/g, '-')}`

export const saveDataViewState = (
  storage: LumenKeyValueWriter,
  key: string,
  state: LumenDataViewState
): void => {
  storage.setItem(key, serializeDataViewState(state))
}

export const loadDataViewState = (
  storage: LumenKeyValueReader,
  key: string
): LumenDataViewState | undefined => {
  const value = storage.getItem(key)

  return value ? parseDataViewState(value) : undefined
}

export const pinDataViewColumn = (
  state: LumenDataViewState,
  column: string
): LumenDataViewState => createDataViewState({
  ...state,
  pinnedColumns: [column, ...state.pinnedColumns.filter(pinned => pinned !== column)]
})

export const unpinDataViewColumn = (
  state: LumenDataViewState,
  column: string
): LumenDataViewState => createDataViewState({
  ...state,
  pinnedColumns: state.pinnedColumns.filter(pinned => pinned !== column)
})

export const toggleDataViewSelection = (
  state: LumenDataViewState,
  id: string,
  selected?: boolean
): LumenDataViewState => {
  const isSelected = state.selectedIds.includes(id)
  const nextSelected = selected ?? !isSelected

  return createDataViewState({
    ...state,
    selectedIds: nextSelected
      ? [...new Set([...state.selectedIds, id])]
      : state.selectedIds.filter(selectedId => selectedId !== id)
  })
}

export const createDataViewSearchParams = (
  state: LumenDataViewState
): URLSearchParams =>
  new URLSearchParams(serializeDataViewState(state))

export const createDataViewRequestUrl = (
  endpoint: string,
  state: LumenDataViewState
): string => {
  const query = serializeDataViewState(state)

  if (!query) return endpoint

  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}`
}

export const createDataViewServerRequest = (
  endpoint: string,
  state: LumenDataViewState
): LumenDataViewServerRequest => {
  const query = serializeDataViewState(state)

  return {
    query,
    state,
    url: createDataViewRequestUrl(endpoint, state)
  }
}

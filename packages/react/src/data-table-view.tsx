'use client'

import type { ReactNode } from 'react'
import { useId, useMemo, useState } from 'react'

import type { ColumnDef, ReactTable } from '@tanstack/react-table'
import {
  columnFilteringFeature, columnVisibilityFeature, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, globalFilteringFeature,
  rowPaginationFeature, rowSortingFeature, tableFeatures, useTable
} from '@tanstack/react-table'

import { Button, Checkbox, Field, Input, Label, NativeSelect } from './components.js'

const createFeatures = () => tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel()
})

type ViewFeatures = ReturnType<typeof createFeatures>

export interface DataTableViewColumn<T> {
  key: string
  label: string
  value?: (row: T) => string | number | null
  canHide?: boolean
  sortable?: boolean
  filterOptions?: readonly { value: string, label: string }[]
}

/** Serializable view state; record objects remain outside this state. */
export interface DataTableViewState {
  search: string
  filters: { id: string, value: string }[]
  visibility: Record<string, boolean>
  pagination: { pageIndex: number, pageSize: number }
  sorting: { id: string, desc: boolean }[]
  density: 'comfortable' | 'compact'
}

export interface DataTableViewResult<T> {
  rows: readonly T[]
  isColumnVisible: (key: string) => boolean
  visibleColumnCount: number
  filteredCount: number
  state: DataTableViewState
  toggleSort: (key: string, multiple?: boolean) => void
}

export interface DataTableViewLabels {
  search: string
  columns: string
  all: string
  density: string
  comfortable: string
  compact: string
  pageSize: string
  previous: string
  next: string
  empty: string
  /** Receives one-based page and at least one page, including empty results. */
  page: (page: number, pages: number, matchingRows: number) => string
}

const english: DataTableViewLabels = {
  search: 'Search records',
  columns: 'Columns',
  all: 'All',
  density: 'Density',
  comfortable: 'Comfortable',
  compact: 'Compact',
  pageSize: 'Rows per page',
  previous: 'Previous page',
  next: 'Next page',
  empty: 'No matching records',
  page: (page, pages, count) => `Page ${page} of ${pages} · ${count} records`
}

export interface DataTableViewProps<T> {
  rows: readonly T[]
  columns: readonly DataTableViewColumn<T>[]
  getRowId: (row: T) => string
  children: (view: DataTableViewResult<T>) => ReactNode
  labels?: Partial<DataTableViewLabels>
  label: string
  state?: DataTableViewState
  defaultState?: Partial<DataTableViewState>
  onStateChange?: (state: DataTableViewState) => void
  /** Server mode never filters, sorts or slices the supplied page. */
  mode?: 'client' | 'server'
  rowCount?: number
  /** Keep existing application/server ordering while filtering and paging locally. */
  manualSorting?: boolean
  disabled?: boolean
  toolbar?: ReactNode
  searchable?: boolean
}

const defaultView = (initial: Partial<DataTableViewState> = {}): DataTableViewState => ({
  search: '',
  filters: [],
  visibility: {},
  pagination: { pageIndex: 0, pageSize: 25 },
  sorting: [],
  density: 'comfortable',
  ...initial
})

const textValue = (value: unknown): string => (
  typeof value === 'string' || typeof value === 'number' ? String(value) : ''
)

const assertPagination = (pagination: DataTableViewState['pagination']) => {
  if (!Number.isSafeInteger(pagination.pageSize) || pagination.pageSize <= 0 ||
    !Number.isSafeInteger(pagination.pageIndex) || pagination.pageIndex < 0)
    throw new RangeError('DataTableView requires a positive integer page size and a nonnegative integer page index.')
}

const stableRows = <T extends { id: string },>(rows: readonly T[], getRowId: (row: T) => string): T[] => {
  const data = Array.from(rows)

  if (!data.every((row: unknown) => (
    typeof row === 'object' && row !== null && 'id' in row && typeof row.id === 'string'
  )))
    throw new TypeError('DataTableView requires dense records with string IDs.')

  const ids = data.map(getRowId)

  if (ids.some(id => typeof id !== 'string' || id.length === 0) || new Set(ids).size !== ids.length)
    throw new TypeError('DataTableView requires unique, nonempty row IDs.')

  return data
}

const useViewState = (
  controlled: DataTableViewState | undefined,
  initial: Partial<DataTableViewState> | undefined,
  onChange: DataTableViewProps<{ id: string }>['onStateChange']
) => {
  const [local, setLocal] = useState(() => defaultView(initial))
  const state = controlled ?? local

  const update = (patch: Partial<DataTableViewState>) => {
    const next = { ...state, ...patch }

    if (controlled === undefined) setLocal(next)

    onChange?.(next)
  }

  return { state, update }
}

const matchingCount = <T extends { id: string },>(
  table: ReactTable<ViewFeatures, T>, mode: DataTableViewProps<T>['mode'],
  total: number | undefined
): number => {
  if (mode !== 'server') return table.getFilteredRowModel().rows.length

  if (total === undefined || !Number.isSafeInteger(total) || total < 0)
    throw new RangeError('Server DataTableView requires a nonnegative integer matching rowCount.')

  return total
}

/** Composable TanStack controller: applications retain their semantic table and domain cells. */
const useViewModel = <T extends { id: string },>({
  rows, columns, getRowId, state: controlled,
  defaultState, onStateChange, mode = 'client', rowCount, manualSorting = false
}: DataTableViewProps<T>) => {
  const { state, update } = useViewState(controlled, defaultState, onStateChange)
  const features = useMemo(createFeatures, [])

  const definitions = useMemo<ColumnDef<ViewFeatures, T>[]>(() => columns.map(column => ({
    id: column.key,
    accessorFn: row => column.value?.(row) ?? '',
    enableHiding: column.canHide !== false,
    enableSorting: column.sortable === true,
    enableGlobalFilter: Boolean(column.value),
    filterFn: (row, key, value: unknown) => textValue(row.getValue(key)) === textValue(value),
    sortFn: (left, right, key) => {
      const a: unknown = left.getValue(key)
      const b: unknown = right.getValue(key)

      if (typeof a === 'number' && typeof b === 'number') return a - b

      return textValue(a).localeCompare(textValue(b), undefined, { numeric: true, sensitivity: 'base' })
    }
  })), [columns])

  assertPagination(state.pagination)

  const data = useMemo(() => stableRows(rows, getRowId), [rows, getRowId])

  const table = useTable({
    features,
    data,
    columns: definitions,
    getRowId,
    state: {
      globalFilter: state.search,
      columnFilters: state.filters,
      columnVisibility: state.visibility,
      pagination: state.pagination,
      sorting: state.sorting
    },
    globalFilterFn: (row, key, value: unknown) => (
      textValue(row.getValue(key)).toLocaleLowerCase().includes(textValue(value).toLocaleLowerCase())
    ),
    manualFiltering: mode === 'server',
    manualPagination: mode === 'server',
    manualSorting: mode === 'server' || manualSorting,
    ...(rowCount === undefined ? {} : { rowCount }),
    autoResetPageIndex: false
  })

  const count = matchingCount(table, mode, rowCount)
  const pages = Math.max(1, Math.ceil(count / state.pagination.pageSize))
  const pageIndex = Math.min(state.pagination.pageIndex, pages - 1)

  // Clamp the rendered client page after deletion/filter refresh without dispatching during render.
  const visibleRows = mode === 'server' ?
    data :
    table.getSortedRowModel().rows
      .slice(pageIndex * state.pagination.pageSize, (pageIndex + 1) * state.pagination.pageSize)
      .map(row => row.original)

  const visible = (key: string) => columns.some(column => column.key === key && (
    column.canHide === false || state.visibility[key] !== false
  ))

  const matching = (key: string) => state.filters.find(filter => filter.id === key)?.value ?? ''

  const changeQuery = (patch: Partial<DataTableViewState>) => {
    update({ ...patch, pagination: { ...(patch.pagination ?? state.pagination), pageIndex: 0 } })
  }

  return { state, update, visibleRows, count, pages, pageIndex, visible, matching, changeQuery }
}

export const DataTableView = <T extends { id: string },>(props: DataTableViewProps<T>) => {
  const { children, columns, label, labels, toolbar, disabled = false, searchable = true } = props
  const { state, update, visibleRows, count, pages, pageIndex, visible, matching, changeQuery } = useViewModel(props)
  const id = useId()
  const text = { ...english, ...labels }

  return (
    <section role="group" className="ui-data-table-view" data-density={state.density} aria-label={label}>
      <div className="ui-data-table-view__toolbar">
        {searchable && (
          <Field controlId={`${id}-search`}>
            <Label htmlFor={`${id}-search`}>{text.search}</Label>
            <Input
              id={`${id}-search`}
              type="search"
              value={state.search}
              disabled={disabled}
              onChange={event => {
                changeQuery({ search: event.currentTarget.value })
              }}
            />
          </Field>
        )}
        {columns.filter(column => column.filterOptions).map(column => (
          <Field key={column.key} controlId={`${id}-${column.key}`}>
            <Label htmlFor={`${id}-${column.key}`}>{column.label}</Label>
            <NativeSelect
              id={`${id}-${column.key}`}
              value={matching(column.key)}
              disabled={disabled}
              onChange={event => {
                const value = event.currentTarget.value
                const filters = state.filters.filter(filter => filter.id !== column.key)

                changeQuery({ filters: value ? [...filters, { id: column.key, value }] : filters })
              }}
            >
              <option value="">{text.all}</option>
              {column.filterOptions?.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
          </Field>
        ))}
        <Field controlId={`${id}-density`}>
          <Label htmlFor={`${id}-density`}>{text.density}</Label>
          <NativeSelect
            id={`${id}-density`}
            value={state.density}
            disabled={disabled}
            onChange={event => {
              update({ density: event.currentTarget.value === 'compact' ? 'compact' : 'comfortable' })
            }}
          >
            <option value="comfortable">{text.comfortable}</option>
            <option value="compact">{text.compact}</option>
          </NativeSelect>
        </Field>
        {toolbar}
      </div>
      <fieldset className="ui-data-table-view__columns" disabled={disabled}>
        <legend>{text.columns}</legend>
        {columns.filter(column => column.canHide !== false).map(column => (
          <Label key={column.key}>
            <Checkbox
              checked={visible(column.key)}
              disabled={visible(column.key) && columns.filter(item => visible(item.key)).length <= 1}
              onChange={event => {
                update({ visibility: { ...state.visibility, [column.key]: event.currentTarget.checked } })
              }}
            />
            {column.label}
          </Label>
        ))}
      </fieldset>
      {children({
        rows: visibleRows,
        isColumnVisible: visible,
        visibleColumnCount: columns.filter(column => visible(column.key)).length,
        filteredCount: count,
        state,
        toggleSort: (key, multiple = false) => {
          if (!columns.some(column => column.key === key && column.sortable)) return

          const active = state.sorting.find(sort => sort.id === key)
          const sorting = multiple ? state.sorting.filter(sort => sort.id !== key) : []

          changeQuery({ sorting: [...sorting, { id: key, desc: active ? !active.desc : false }] })
        }
      })}
      {count === 0 && <p role="status">{text.empty}</p>}
      <div className="ui-data-table-view__pagination">
        <Field controlId={`${id}-size`}>
          <Label htmlFor={`${id}-size`}>{text.pageSize}</Label>
          <NativeSelect
            id={`${id}-size`}
            value={state.pagination.pageSize}
            disabled={disabled}
            onChange={event => {
              changeQuery({ pagination: { pageIndex: 0, pageSize: Number(event.currentTarget.value) } })
            }}
          >
            {[...new Set([10, 25, 50, 100, state.pagination.pageSize])].sort((a, b) => a - b).map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </NativeSelect>
        </Field>
        <span role="status" aria-live="polite">{text.page(pageIndex + 1, pages, count)}</span>
        <Button
          variant="outline"
          disabled={disabled || pageIndex === 0}
          onClick={() => {
            update({ pagination: { ...state.pagination, pageIndex: pageIndex - 1 } })
          }}
        >
          {text.previous}
        </Button>
        <Button
          variant="outline"
          disabled={disabled || pageIndex >= pages - 1}
          onClick={() => {
            update({ pagination: { ...state.pagination, pageIndex: pageIndex + 1 } })
          }}
        >
          {text.next}
        </Button>
      </div>
    </section>
  )
}

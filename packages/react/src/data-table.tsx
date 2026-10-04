'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { useId, useMemo, useState } from 'react'

import { composeClassName } from '@santi020k/lumen-core'

import { Button, Field, Icon, Label, type LumenGlassProp, NativeSelect } from './components.js'

export type DataTableCell =
  | boolean |
  null |
  number |
  string |
  undefined |
  {
    label?: boolean | null | number | string
    sortValue?: boolean | null | number | string
    value?: boolean | null | number | string
  }

export interface DataTableColumn {
  header?: string
  key: string
  label?: string
  sort?: 'number' | 'string'
  sortable?: boolean
  /** Rich display content does not change the underlying sortable value. */
  render?: (cell: DataTableCell, row: DataTableRow) => ReactNode
  wide?: boolean
}

export type DataTableRow = Record<string, DataTableCell> & {
  id?: number | string
  rowValue?: number | string
  value?: number | string
}

const emptyDataTableColumns: DataTableColumn[] = []
const emptyDataTableRows: DataTableRow[] = []
const dataTableClassName = (glass: LumenGlassProp, layout: DataTableProps['layout'], className?: string): string => composeClassName('ui-data-table', glass && 'ui-data-table--glass', glass === 'subtle' && 'ui-glass-subtle', glass === 'strong' && 'ui-glass-strong', layout === 'records' && 'ui-table-wrap--records', className)

const isDataTableCellObject = (
  cell: DataTableCell
): cell is Exclude<
  DataTableCell,
  boolean | null | number | string | undefined
> => typeof cell === 'object' && cell !== null

const formatDataTableCell = (cell: DataTableCell): string => {
  const value = isDataTableCellObject(cell) ? (cell.label ?? cell.value) : cell

  return value === undefined || value === null ? '' : String(value)
}

const getDataTableSortValue = (cell: DataTableCell): string | undefined => {
  if (
    !isDataTableCellObject(cell) ||
    cell.sortValue === undefined ||
    cell.sortValue === null
  )
    return undefined

  return String(cell.sortValue)
}

const compareDataTableCells = (
  left: DataTableCell,
  right: DataTableCell,
  sortType: DataTableColumn['sort']
): number => {
  const leftValue = getDataTableSortValue(left) ?? formatDataTableCell(left)
  const rightValue = getDataTableSortValue(right) ?? formatDataTableCell(right)

  if (sortType === 'number') {
    return Number(leftValue.replaceAll(',', '')) -
      Number(rightValue.replaceAll(',', ''))
  }

  return leftValue.localeCompare(rightValue, undefined, {
    numeric: true,
    sensitivity: 'base'
  })
}

const getDataTableRowValue = (
  row: DataTableRow,
  index: number
): string => String(row.rowValue ?? row.id ?? row.value ?? index)

export interface DataTableSort {
  direction: 'ascending' | 'descending'
  key: string
}

const resolveDataTableSort = (
  controlled: DataTableSort | null | undefined,
  fallback: DataTableSort | null
): DataTableSort | null => controlled === undefined ? fallback : controlled

export interface DataTableProps extends ComponentPropsWithoutRef<'div'> {
  columns?: DataTableColumn[]
  defaultSort?: DataTableSort | null
  glass?: LumenGlassProp
  name?: string
  onSortChange?: (sort: DataTableSort | null) => void
  rows?: DataTableRow[]
  sort?: DataTableSort | null
  sortMode?: 'client' | 'manual'
  selectable?: boolean
  layout?: 'records' | 'scroll'
  renderDetails?: (row: DataTableRow) => ReactNode
  expandedRowIds?: readonly string[]
  defaultExpandedRowIds?: readonly string[]
  onExpandedRowIdsChange?: (ids: string[]) => void
  expandLabel?: string
  collapseLabel?: string
  detailsLabel?: string
}

const emptyExpandedRowIds: readonly string[] = []

const useDataTableExpansion = ({
  defaultExpandedRowIds, expandedRowIds, onExpandedRowIdsChange
}: { defaultExpandedRowIds: DataTableProps['defaultExpandedRowIds']
  expandedRowIds: DataTableProps['expandedRowIds']
  onExpandedRowIdsChange: DataTableProps['onExpandedRowIdsChange'] }) => {
  const [uncontrolled, setUncontrolled] = useState(defaultExpandedRowIds ?? emptyExpandedRowIds)
  const expanded = expandedRowIds ?? uncontrolled

  const toggleDetails = (id: string) => {
    const next = expanded.includes(id) ? expanded.filter(value => value !== id) : [...expanded, id]

    if (expandedRowIds === undefined) setUncontrolled(next)

    onExpandedRowIdsChange?.(next)
  }

  return { expanded, toggleDetails }
}

interface DataTableRecordContext {
  layout: DataTableProps['layout']
  renderDetails: DataTableProps['renderDetails']
  expandLabel: DataTableProps['expandLabel']
  collapseLabel: DataTableProps['collapseLabel']
  detailsLabel: DataTableProps['detailsLabel']
  row: DataTableRow
  index: number
  columns: DataTableColumn[]
  expanded: readonly string[]
  detailsId: string
  toggleDetails: (id: string) => void
}

const dataTableColumnLabel = (column: DataTableColumn): string => column.header ?? column.label ?? column.key

const renderDataTableDisclosure = (context: DataTableRecordContext, column: DataTableColumn,
  rowId: string, open: boolean, id: string) => {
  const { row, toggleDetails, expandLabel, collapseLabel } = context
  const label = open ? collapseLabel ?? 'Collapse record' : expandLabel ?? 'Expand record'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${label}: ${formatDataTableCell(row[column.key]) || rowId}`}
      aria-expanded={open}
      aria-controls={open ? id : undefined}
      onClick={() => {
        toggleDetails(rowId)
      }}
    >
      <Icon name={open ? 'chevron-down' : 'chevron-right'} />
    </Button>
  )
}

const renderDataTableCell = (
  context: DataTableRecordContext, column: DataTableColumn,
  columnIndex: number, rowId: string, open: boolean, id: string
) => {
  const { row, layout, renderDetails } = context
  const disclosure = columnIndex === 0 && Boolean(renderDetails)

  return (
    <td
      className={column.wide ? 'ui-table__cell--wide' : undefined}
      data-sort-value={getDataTableSortValue(row[column.key])}
      key={column.key}
      role="cell"
    >
      {layout === 'records' && <span className="ui-table__label" aria-hidden="true">{dataTableColumnLabel(column)}</span>}
      <div className="ui-table__value">
        {disclosure && renderDataTableDisclosure(context, column, rowId, open, id)}
        {column.render ? column.render(row[column.key], row) : formatDataTableCell(row[column.key])}
      </div>
    </td>
  )
}

const renderDataTableRecord = (context: DataTableRecordContext) => {
  const { row, index, columns, expanded, detailsId, renderDetails } = context
  const rowId = getDataTableRowValue(row, index)
  const open = expanded.includes(rowId)
  const id = `${detailsId}-${encodeURIComponent(rowId)}`

  const record = (
    <tr data-ui-datatable-row data-value={rowId} key={rowId} role="row">
      {columns.map((column, columnIndex) => renderDataTableCell(context, column, columnIndex, rowId, open, id))}
    </tr>
  )

  if (!open || !renderDetails) return [record]

  const detail = (
    <tr key={`${rowId}-details`} role="row" data-ui-datatable-detail>
      <td colSpan={columns.length} role="cell" className="ui-table__cell--wide">
        <section id={id} aria-label={`${context.detailsLabel ?? 'Record details'}: ${rowId}`}>{renderDetails(row)}</section>
      </td>
    </tr>
  )

  return [record, detail]
}

const dataTableAttributes = (name: string | undefined, sortMode: 'client' | 'manual',
  selectable: boolean, glass: LumenGlassProp) => ({
  'data-ui-datatable': true,
  'data-ui-datatable-name': name,
  'data-ui-datatable-sort-mode': sortMode,
  'data-ui-datatable-selectable': selectable ? 'true' : undefined,
  'data-ui-glass-track': glass ? true : undefined
})

export const DataTable = ({
  children,
  className,
  columns = emptyDataTableColumns,
  defaultSort = null,
  defaultExpandedRowIds,
  expandedRowIds,
  expandLabel,
  collapseLabel,
  detailsLabel,
  glass = false,
  layout,
  name,
  onExpandedRowIdsChange,
  onSortChange,
  renderDetails,
  rows = emptyDataTableRows,
  sort: controlledSort,
  sortMode = 'client',
  selectable = false,
  ...props
}: DataTableProps) => {
  const [uncontrolledSort, setUncontrolledSort] = useState<DataTableSort | null>(defaultSort)
  const sort = resolveDataTableSort(controlledSort, uncontrolledSort)

  const { expanded, toggleDetails } = useDataTableExpansion({
    defaultExpandedRowIds, expandedRowIds, onExpandedRowIdsChange
  })

  const detailsId = useId()

  const sortedRows = useMemo(() => {
    if (sortMode === 'manual' || !sort) return rows

    const column = columns.find(candidate => candidate.key === sort.key)

    if (!column) return rows

    const direction = sort.direction === 'ascending' ? 1 : -1

    return [...rows].sort((left, right) => compareDataTableCells(
      left[column.key], right[column.key], column.sort
    ) * direction)
  }, [columns, rows, sort, sortMode])

  const toggleSort = (column: DataTableColumn): void => {
    const next: DataTableSort = {
      direction: sort?.key === column.key && sort.direction === 'ascending' ? 'descending' : 'ascending',
      key: column.key
    }

    if (controlledSort === undefined) setUncontrolledSort(next)

    onSortChange?.(next)
  }

  return (
    <div
      className={dataTableClassName(glass, layout, className)}
      {...dataTableAttributes(name, sortMode, selectable, glass)}
      {...props}
    >
      {columns.length > 0 ?
        (
          <table role="table">
            <thead role="rowgroup">
              <tr role="row">
                {columns.map(column => {
                  const direction = sort?.key === column.key ?
                    sort.direction :
                    undefined

                  const label = column.header ?? column.label ?? column.key

                  return (
                    <th
                      aria-sort={direction ?? (column.sortable ? 'none' : undefined)}
                      data-ui-datatable-sort-bound="true"
                      data-ui-datatable-sort-type={column.sort}
                      data-ui-datatable-sortable={
                        column.sortable ? 'true' : undefined
                      }
                      key={column.key}
                      role="columnheader"
                      scope="col"
                    >
                      {column.sortable ?
                        (
                          <button
                            className="ui-data-table__sort"
                            data-ui-datatable-sort
                            onClick={() => {
                              toggleSort(column)
                            }}
                            type="button"
                          >
                            {label}
                          </button>
                        ) :
                        label}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {sortedRows.flatMap((row, index) => renderDataTableRecord({
                row,
                index,
                columns,
                layout,
                renderDetails,
                expanded,
                detailsId,
                toggleDetails,
                expandLabel,
                collapseLabel,
                detailsLabel
              }))}
            </tbody>
          </table>
        ) :
        children}
    </div>
  )
}

export interface DataTableSortControlsProps extends ComponentPropsWithoutRef<'div'> {
  columns: readonly DataTableColumn[]
  sort: DataTableSort | null
  onSortChange: (sort: DataTableSort | null) => void
  disabled?: boolean
  label?: string
  directionLabel?: string
  ascendingLabel?: string
  descendingLabel?: string
  placeholder?: string
}

const resolveDataTableSortLabels = (labels: { label: DataTableSortControlsProps['label']
  directionLabel: DataTableSortControlsProps['directionLabel']
  ascendingLabel: DataTableSortControlsProps['ascendingLabel']
  descendingLabel: DataTableSortControlsProps['descendingLabel']
  placeholder: DataTableSortControlsProps['placeholder'] }) => ({
  label: labels.label ?? 'Sort by',
  directionLabel: labels.directionLabel ?? 'Sort direction',
  ascendingLabel: labels.ascendingLabel ?? 'Ascending',
  descendingLabel: labels.descendingLabel ?? 'Descending',
  placeholder: labels.placeholder ?? 'Default order'
})

/** A named mobile/toolbar path to the same controlled server sort as table headers. */
export const DataTableSortControls = ({
  columns, sort, onSortChange, disabled = false, label, directionLabel,
  ascendingLabel, descendingLabel, placeholder, className, ...props
}: DataTableSortControlsProps) => {
  const text = resolveDataTableSortLabels({ label, directionLabel, ascendingLabel, descendingLabel, placeholder })
  const id = useId()
  const sortable = columns.filter(column => column.sortable)
  const selected = sortable.find(column => column.key === sort?.key)
  const descending = sort?.direction === 'descending'
  const directionText = descending ? text.descendingLabel : text.ascendingLabel

  return (
    <div {...props} className={composeClassName('ui-data-table__sort-controls', className)}>
      <Field controlId={id}>
        <Label htmlFor={id}>{text.label}</Label>
        <NativeSelect
          id={id}
          disabled={disabled}
          value={selected?.key ?? ''}
          onChange={event => {
            const column = sortable.find(item => item.key === event.currentTarget.value)

            onSortChange(column ? { key: column.key, direction: 'ascending' } : null)
          }}
        >
          <option value="">{text.placeholder}</option>
          {sortable.map(column => (
            <option value={column.key} key={column.key}>{column.header ?? column.label ?? column.key}</option>
          ))}
        </NativeSelect>
      </Field>
      <Button
        variant="outline"
        disabled={disabled || !selected}
        aria-label={`${text.directionLabel}: ${directionText}`}
        aria-pressed={descending}
        onClick={() => {
          if (selected) onSortChange({ key: selected.key, direction: sort?.direction === 'ascending' ? 'descending' : 'ascending' })
        }}
      >
        <Icon name={descending ? 'arrow-down' : 'arrow-up'} />
        {directionText}
      </Button>
    </div>
  )
}

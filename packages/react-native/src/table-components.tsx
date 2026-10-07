import type { ReactElement, ReactNode } from 'react'
import { ScrollView, View, type ViewProps } from 'react-native'

import { LumenButton, LumenText } from './primitives.js'
import { LumenCheckbox } from './selection-components.js'
import {
  getLumenTableCell,   type LumenTableColumn, type LumenTableRow, type LumenTableSort, type LumenTableSortMode,
  nextLumenTableSort, sortLumenTableRows, toggleLumenTableRow, toggleLumenTableVisibleRows, validateLumenTable
} from './table-recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenTableProps extends Omit<ViewProps, 'children'> {
  label: string
  columns: readonly LumenTableColumn[]
  rows: readonly LumenTableRow[]
  layout?: 'records' | 'scroll' | undefined
  emptyLabel?: string | undefined
  invalidLabel?: string | undefined
  missingLabel?: string | undefined
}
export interface LumenDataTableProps extends LumenTableProps {
  sort?: LumenTableSort | null | undefined
  sortMode?: LumenTableSortMode | undefined
  onSortChange?: ((sort: LumenTableSort | null) => void) | undefined
  selectedIds?: ReadonlySet<string> | undefined
  onSelectionChange?: ((selection: Set<string>) => void) | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  loading?: boolean | undefined
  loadingLabel?: string | undefined
  error?: string | null | undefined
  onRetry?: (() => void) | undefined
  retryLabel?: string | undefined
  selectAllLabel?: string | undefined
  deselectAllLabel?: string | undefined
  locale?: string | undefined
  formatSort?: ((sort: LumenTableSort | null) => string) | undefined
}

interface TableContentProps extends LumenTableProps {
  header?: ((column: LumenTableColumn) => ReactNode) | undefined
  selection?: ((row: LumenTableRow) => ReactNode) | undefined
}

const emptySelection: ReadonlySet<string> = new Set()

const isTableSelectionValid = (selection: unknown): boolean => selection === undefined ||
  (selection instanceof Set && Array.from(selection).every((id: unknown) => typeof id === 'string'))

const formatTableSort = (sort: LumenTableSort | null): string => sort?.direction ?? ''

const TableContent = ({ columns, rows, layout = 'records', missingLabel = '', header, selection }: TableContentProps): ReactElement => {
  const theme = useLumenTheme()
  const scroll = layout === 'scroll'

  const content = (
    <View style={{ gap: theme.spacing.md }}>
      {scroll ?
        (
          <View style={{ flexDirection: 'row', paddingHorizontal: theme.spacing.sm }}>
            {columns.map(column => (
              <View key={column.key} style={{ width: 180, padding: theme.spacing.sm }}>
                {header ? header(column) : <LumenText>{column.label}</LumenText>}
              </View>
            ))}
          </View>
        ) :
        null}
      {rows.map(row => (
        <View
          key={row.id}
          accessibilityLabel={row.label}
          style={{ borderColor: theme.colors.line,
            borderWidth: 1,
            borderRadius: theme.radii.md,
            padding: theme.spacing.sm }}
        >
          {selection?.(row)}
          <View style={{ flexDirection: scroll ? 'row' : 'column', gap: scroll ? 0 : theme.spacing.sm }}>
            {columns.map(column => (
              <View key={column.key} style={{ width: scroll ? 180 : undefined, padding: theme.spacing.sm }}>
                {!scroll ? <LumenText>{column.label}</LumenText> : null}
                <View accessible accessibilityLabel={`${column.label}, ${getLumenTableCell(row, column.key)?.text ?? missingLabel}`}>
                  <LumenText>{getLumenTableCell(row, column.key)?.text ?? missingLabel}</LumenText>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  )

  return scroll ? <ScrollView horizontal>{content}</ScrollView> : content
}

const TableBody = ({ label, columns, rows, layout, emptyLabel = 'No records', invalidLabel = 'Invalid table data',
  missingLabel }: LumenTableProps): ReactElement => {
  if (!validateLumenTable(columns, rows)) return <LumenText>{invalidLabel}</LumenText>

  if (rows.length === 0 || columns.length === 0) return <LumenText>{emptyLabel}</LumenText>

  return <TableContent label={label} columns={columns} rows={rows} layout={layout} missingLabel={missingLabel} />
}

export const LumenTable = ({ label, columns, rows, layout, emptyLabel, invalidLabel, missingLabel,
  style, ...props }: LumenTableProps): ReactElement => (
  <View {...props} accessibilityLabel={label} style={style}>
    <LumenText>{label}</LumenText>
    <TableBody
      label={label}
      columns={columns}
      rows={rows}
      layout={layout}
      emptyLabel={emptyLabel}
      invalidLabel={invalidLabel}
      missingLabel={missingLabel}
    />
  </View>
)

const tableOptions = ({ label, columns, rows, layout = 'records', sort = null, sortMode = 'manual',
  onSortChange, disabled = false, readOnly = false, missingLabel, locale,
  formatSort = formatTableSort }: LumenDataTableProps) => ({
  label,
  columns,
  rows,
  layout,
  sort,
  sortMode,
  onSortChange,
  missingLabel,
  locale,
  formatSort,
  locked: disabled || readOnly
})

const selectionOptions = ({ selectedIds = emptySelection, onSelectionChange,
  selectAllLabel = 'Select visible', deselectAllLabel = 'Deselect visible' }: LumenDataTableProps) => ({
  selectedIds, onSelectionChange, selectAllLabel, deselectAllLabel
})

const TableInteractive = (props: LumenDataTableProps): ReactElement => {
  const theme = useLumenTheme()

  const { label, columns, rows, layout, sort, sortMode, onSortChange,
    missingLabel, locale, formatSort, locked } = tableOptions(props)

  const { selectedIds, onSelectionChange, selectAllLabel, deselectAllLabel } = selectionOptions(props)
  const visibleRows = sortLumenTableRows(rows, columns, sort, sortMode, locale)
  const available = rows.filter(row => !row.disabled)
  const allSelected = available.length > 0 && available.every(row => selectedIds.has(row.id))

  const header = (column: LumenTableColumn): ReactNode => column.sortable && onSortChange ?
    (
      <LumenButton
        accessibilityLabel={column.label + (sort?.key === column.key ? `, ${formatSort(sort)}` : '')}
        disabled={locked}
        onPress={() => {
          if (!locked) onSortChange(nextLumenTableSort(sort, column.key))
        }}
      >
        {column.label}
        {sort?.key === column.key ? `, ${formatSort(sort)}` : ''}
      </LumenButton>
    ) :
    <LumenText>{column.label}</LumenText>

  const selection = onSelectionChange ?
    (row: LumenTableRow): ReactNode => (
      <LumenCheckbox
        accessibilityLabel={row.label}
        label={row.label}
        checked={selectedIds.has(row.id)}
        disabled={locked || Boolean(row.disabled)}
        onCheckedChange={() => {
          if (!locked && !row.disabled) onSelectionChange(toggleLumenTableRow(selectedIds, row))
        }}
      />
    ) :
    undefined

  return (
    <>
      {layout === 'records' && onSortChange ?
        (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {columns.filter(column => column.sortable).map(column => <View key={column.key}>{header(column)}</View>)}
          </View>
        ) :
        null}
      {onSelectionChange ?
        (
          <LumenButton
            accessibilityLabel={allSelected ? deselectAllLabel : selectAllLabel}
            disabled={locked || available.length === 0}
            onPress={() => {
              if (!locked) onSelectionChange(toggleLumenTableVisibleRows(selectedIds, rows))
            }}
          >
            {allSelected ? deselectAllLabel : selectAllLabel}
          </LumenButton>
        ) :
        null}
      <TableContent
        label={label}
        columns={columns}
        rows={visibleRows}
        layout={layout}
        missingLabel={missingLabel}
        header={header}
        selection={selection}
      />
    </>
  )
}

const TableLoading = ({ label }: { label?: string | undefined }): ReactElement => <LumenText accessibilityRole="progressbar">{label ?? 'Loading'}</LumenText>

const TableError = ({ message, onRetry, disabled, retryLabel }: {
  message: string
  onRetry?: (() => void) | undefined
  disabled?: boolean | undefined
  retryLabel?: string | undefined
}): ReactElement => (
  <View>
    <LumenText accessibilityRole="alert">{message}</LumenText>
    {onRetry ? <LumenButton accessibilityLabel={retryLabel ?? 'Retry'} disabled={Boolean(disabled)} onPress={onRetry}>{retryLabel ?? 'Retry'}</LumenButton> : null}
  </View>
)

const DataTableBody = (props: LumenDataTableProps): ReactElement => {
  if (props.loading) return <TableLoading label={props.loadingLabel} />

  if (props.error != null) return (
    <TableError
      message={props.error}
      onRetry={props.onRetry}
      disabled={props.disabled}
      retryLabel={props.retryLabel}
    />
  )

  if (!validateLumenTable(props.columns, props.rows) || !isTableSelectionValid(props.selectedIds)) return (
    <LumenText accessibilityRole="alert">
      {props.invalidLabel ?? 'Invalid table data'}
    </LumenText>
  )

  if (props.rows.length === 0 || props.columns.length === 0) return <LumenText>{props.emptyLabel ?? 'No records'}</LumenText>

  return <TableInteractive {...props} />
}

export const LumenDataTable = ({ label, columns, rows, layout, sort, sortMode, onSortChange, selectedIds,
  onSelectionChange, disabled, readOnly, loading, loadingLabel, error, onRetry, retryLabel, emptyLabel,
  invalidLabel, missingLabel, selectAllLabel, deselectAllLabel, locale, formatSort, style,
  ...props }: LumenDataTableProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View {...props} accessibilityLabel={label} style={[{ gap: theme.spacing.md }, style]}>
      <LumenText>{label}</LumenText>
      <DataTableBody
        label={label}
        columns={columns}
        rows={rows}
        layout={layout}
        sort={sort}
        sortMode={sortMode}
        onSortChange={onSortChange}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        loadingLabel={loadingLabel}
        error={error}
        onRetry={onRetry}
        retryLabel={retryLabel}
        emptyLabel={emptyLabel}
        invalidLabel={invalidLabel}
        missingLabel={missingLabel}
        selectAllLabel={selectAllLabel}
        deselectAllLabel={deselectAllLabel}
        locale={locale}
        formatSort={formatSort}
      />
    </View>
  )
}

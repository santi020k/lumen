import type { ReactElement, ReactNode } from 'react'
import { FlatList, View, type ViewProps } from 'react-native'

import { LumenButton, LumenText } from './primitives.js'
import { getLumenTableCell, type LumenTableCell } from './table-recipes.js'
import { useLumenTheme } from './theme-context.js'
import { type LumenTreeGridColumn, LumenTreeGridModel, type LumenTreeGridRecord,
  type LumenTreeGridRow } from './tree-grid-recipes.js'

export interface LumenTreeGridProps extends Pick<ViewProps, 'style' | 'testID' | 'nativeID'> {
  label: string
  columns: readonly LumenTreeGridColumn[]
  records: readonly LumenTreeGridRecord[]
  expandedIds: ReadonlySet<string>
  onExpandedChange: (ids: Set<string>) => void
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  loading?: boolean | undefined
  error?: string | null | undefined
  loadingLabel?: string | undefined
  emptyLabel?: string | undefined
  invalidLabel?: string | undefined
  missingCellLabel?: string | undefined
  formatDisclosure?: ((label: string, expanded: boolean) => string) | undefined
  formatLevel?: ((depth: number) => string) | undefined
  renderCell?: ((record: LumenTreeGridRecord, column: LumenTreeGridColumn,
    cell: LumenTableCell | undefined, context: { disabled: boolean, readOnly: boolean }) => ReactNode) | undefined
}

const GridRecord = ({ row, model, props }: { row: LumenTreeGridRow
  model: LumenTreeGridModel
  props: LumenTreeGridProps }): ReactElement => {
  const theme = useLumenTheme()
  const expanded = props.expandedIds.has(row.tree.node.id)
  const disabled = Boolean(props.disabled) || row.tree.disabled

  const disclosure = props.formatDisclosure?.(row.tree.node.label, expanded) ??
    `${expanded ? 'Collapse' : 'Expand'} ${row.tree.node.label}`

  return (
    <View
      accessibilityLabel={row.tree.node.label}
      style={{ gap: theme.spacing.sm,
        padding: theme.spacing.md,
        marginStart: Math.min(row.tree.depth, 4) * theme.spacing.sm,
        borderColor: theme.colors.line,
        borderWidth: 1,
        borderRadius: theme.radii.md }}
    >
      <LumenText>{row.tree.node.label}</LumenText>
      <LumenText>{props.formatLevel?.(row.tree.depth) ?? `Level ${row.tree.depth + 1}`}</LumenText>
      {row.tree.hasChildren ?
        (
          <LumenButton
            intent="secondary"
            disabled={disabled}
            accessibilityLabel={disclosure}
            accessibilityState={{ expanded, disabled }}
            onPress={() => {
              if (!disabled) props.onExpandedChange(model.togglingExpansion(row.tree.node.id, props.expandedIds))
            }}
          >
            {disclosure}
          </LumenButton>
        ) :
        null}
      {props.columns.map(column => {
        const cell = getLumenTableCell({ ...row.record.node, cells: row.record.cells }, column.key)

        return (
          <View key={column.key} style={{ gap: theme.spacing.xs }}>
            <LumenText>{column.label}</LumenText>
            {props.renderCell ?
              props.renderCell(row.record, column, cell, { disabled, readOnly: Boolean(props.readOnly) }) :
              <LumenText>{cell?.text ?? props.missingCellLabel ?? '—'}</LumenText>}
          </View>
        )
      })}
    </View>
  )
}

const GridContent = (props: LumenTreeGridProps): ReactElement => {
  const model = new LumenTreeGridModel(props.columns, props.records)

  if (props.loading) return <LumenText accessibilityRole="progressbar">{props.loadingLabel ?? 'Loading'}</LumenText>

  if (props.error != null) return <LumenText accessibilityRole="alert">{props.error}</LumenText>

  if (!model.valid || props.label.trim().length === 0) {
    return <LumenText accessibilityRole="alert">{props.invalidLabel ?? 'Invalid tree grid data'}</LumenText>
  }

  if (props.records.length === 0) return <LumenText>{props.emptyLabel ?? 'No records'}</LumenText>

  return (
    <FlatList
      data={model.visibleRows(props.expandedIds)}
      keyExtractor={row => row.tree.node.id}
      style={{ maxHeight: 480 }}
      renderItem={({ item }) => <GridRecord row={item} model={model} props={props} />}
    />
  )
}

/** Native record layout preserves each column label at narrow phone widths. */
export const LumenTreeGrid = (props: LumenTreeGridProps): ReactElement => (
  <View style={props.style} testID={props.testID} nativeID={props.nativeID} accessibilityLabel={props.label}>
    <LumenText>{props.label}</LumenText>
    <GridContent {...props} />
  </View>
)

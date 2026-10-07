import type { ReactElement } from 'react'
import { View, type ViewProps } from 'react-native'

import { LumenButton, LumenText } from './primitives.js'
import { LumenCheckbox } from './selection-components.js'
import { useLumenTheme } from './theme-context.js'
import { isLumenTreeIdSet, LumenTreeModel, type LumenTreeNode, type LumenTreeRow } from './tree-recipes.js'

export interface LumenTreeProps extends Omit<ViewProps, 'children'> {
  label: string
  nodes: readonly LumenTreeNode[]
  expandedIds: ReadonlySet<string>
  onExpandedChange: (expandedIds: Set<string>) => void
  selectedIds?: ReadonlySet<string> | undefined
  onSelectionChange?: ((selectedIds: Set<string>) => void) | undefined
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  loading?: boolean | undefined
  error?: string | null | undefined
  loadingLabel?: string | undefined
  emptyLabel?: string | undefined
  invalidLabel?: string | undefined
  formatDisclosure?: ((label: string, expanded: boolean) => string) | undefined
  formatLevel?: ((depth: number) => string) | undefined
}

const emptyTreeSelection: ReadonlySet<string> = new Set()

const validTreeContent = function (model: LumenTreeModel, selection: unknown): boolean {
  return model.valid && (selection === undefined || isLumenTreeIdSet(selection))
}

const formatTreeDisclosure = (label: string, expanded: boolean): string => `${expanded ? 'Collapse' : 'Expand'} ${label}`
const formatTreeLevel = (depth: number): string => `Level ${depth + 1}`

const TreeSelection = ({ row, model, props, selectedIds, disabled }: {
  row: LumenTreeRow
  model: LumenTreeModel
  props: LumenTreeProps
  selectedIds: ReadonlySet<string>
  disabled: boolean
}): ReactElement => {
  if (!props.onSelectionChange || row.node.selectable === false) return <LumenText>{row.node.label}</LumenText>

  return (
    <LumenCheckbox
      accessibilityLabel={row.node.label}
      label={row.node.label}
      checked={Set.prototype.has.call(selectedIds, row.node.id)}
      disabled={disabled || Boolean(props.readOnly)}
      onCheckedChange={() => {
        if (!disabled && !props.readOnly) props.onSelectionChange?.(model.togglingSelection(row.node.id, selectedIds))
      }}
    />
  )
}

const TreeRow = ({ row, model, props }: {
  row: LumenTreeRow
  model: LumenTreeModel
  props: LumenTreeProps
}): ReactElement => {
  const theme = useLumenTheme()
  const selectedIds = props.selectedIds ?? emptyTreeSelection
  const disabled = Boolean(props.disabled) || row.disabled
  const expanded = Set.prototype.has.call(props.expandedIds, row.node.id)
  const formatDisclosure = props.formatDisclosure ?? formatTreeDisclosure
  const formatLevel = props.formatLevel ?? formatTreeLevel

  return (
    <View style={{ marginStart: Math.min(row.depth, 8) * theme.spacing.md, gap: theme.spacing.xs }}>
      {row.hasChildren ?
        (
          <LumenButton
            accessibilityLabel={formatDisclosure(row.node.label, expanded)}
            accessibilityState={{ expanded }}
            disabled={disabled}
            onPress={() => {
              if (!disabled) props.onExpandedChange(model.togglingExpansion(row.node.id, props.expandedIds))
            }}
          >
            {formatDisclosure(row.node.label, expanded)}
          </LumenButton>
        ) :
        null}
      <TreeSelection row={row} model={model} props={props} selectedIds={selectedIds} disabled={disabled} />
      <LumenText>{formatLevel(row.depth)}</LumenText>
    </View>
  )
}

const TreeContent = (props: LumenTreeProps): ReactElement => {
  const theme = useLumenTheme()
  const model = new LumenTreeModel(props.nodes)

  if (props.loading) return <LumenText accessibilityRole="progressbar">{props.loadingLabel ?? 'Loading'}</LumenText>

  if (props.error) return <LumenText accessibilityRole="alert">{props.error}</LumenText>

  if (!validTreeContent(model, props.selectedIds)) {
    return <LumenText accessibilityRole="alert">{props.invalidLabel ?? 'Invalid tree data'}</LumenText>
  }

  if (props.nodes.length === 0) return <LumenText>{props.emptyLabel ?? 'No items'}</LumenText>

  const rows = model.visibleRows(props.expandedIds)

  if (rows.length === 0) return <LumenText accessibilityRole="alert">{props.invalidLabel ?? 'Invalid tree data'}</LumenText>

  return (
    <View style={{ gap: theme.spacing.md }}>
      {rows.map(row => (
        <TreeRow key={row.node.id} row={row} model={model} props={props} />
      ))}
    </View>
  )
}

export const LumenTree = ({ label, nodes, expandedIds, onExpandedChange, selectedIds, onSelectionChange,
  disabled, readOnly, loading, error, loadingLabel, emptyLabel, invalidLabel, formatDisclosure, formatLevel,
  style, ...props }: LumenTreeProps): ReactElement => (
  <View {...props} accessibilityLabel={label} style={style}>
    <LumenText>{label}</LumenText>
    <TreeContent
      label={label}
      nodes={nodes}
      expandedIds={expandedIds}
      onExpandedChange={onExpandedChange}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      disabled={disabled}
      readOnly={readOnly}
      loading={loading}
      error={error}
      loadingLabel={loadingLabel}
      emptyLabel={emptyLabel}
      invalidLabel={invalidLabel}
      formatDisclosure={formatDisclosure}
      formatLevel={formatLevel}
    />
  </View>
)

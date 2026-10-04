import type { ReactElement } from 'react'
import { ScrollView, View, type ViewProps } from 'react-native'

import { LumenButton, LumenText } from './primitives.js'
import { LumenCheckbox } from './selection-components.js'
import { useLumenTheme } from './theme-context.js'
import { type LumenTransferItem, lumenTransferLists, type LumenTransferSide, type LumenTransferValue, moveLumenTransferItems, toggleLumenTransferItem } from './transfer-recipes.js'

export interface LumenTransferProps extends Pick<ViewProps, 'style' | 'testID'> {
  label: string
  items: readonly LumenTransferItem[]
  value: LumenTransferValue
  onValueChange: (value: LumenTransferValue) => void
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  error?: string | null
  sourceTitle?: string
  targetTitle?: string
  moveToTargetLabel?: string
  moveToSourceLabel?: string
  emptyLabel?: string
  loadingLabel?: string
  invalidLabel?: string
  formatCount?: (count: number) => string
}

const transferStatus = (props: LumenTransferProps, invalid: boolean): string | null => {
  if (props.error != null) return props.error

  if (props.loading) return props.loadingLabel ?? 'Loading'

  if (invalid) return props.invalidLabel ?? 'Invalid transfer'

  return null
}

interface TransferPanelProps {
  title: string
  items: readonly LumenTransferItem[]
  value: LumenTransferValue
  locked: boolean
  emptyLabel: string
  formatCount: (count: number) => string
  onCheck: (item: LumenTransferItem, checked: boolean) => void
}

const TransferPanel = (props: TransferPanelProps): ReactElement => {
  const { title, items, value, locked, emptyLabel, formatCount, onCheck } = props
  const theme = useLumenTheme()
  const checks = new Set(value.checkedIds)

  return (
    <View
      accessibilityLabel={title}
      style={{ borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.sm }}
    >
      <LumenText accessibilityRole="header">{title}</LumenText>
      <LumenText>{formatCount(items.length)}</LumenText>
      {items.length === 0 ?
        <LumenText>{emptyLabel}</LumenText> :
        (
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
            {items.map(item => (
              <LumenCheckbox
                key={item.id}
                label={item.label || item.id}
                description={item.detail ?? ''}
                accessibilityLabel={[item.label || item.id, item.detail].filter(Boolean).join(', ')}
                checked={checks.has(item.id)}
                disabled={locked || item.disabled === true}
                style={{ minHeight: 44 }}
                onCheckedChange={checked => {
                  if (!locked && !item.disabled) onCheck(item, checked)
                }}
              />
            ))}
          </ScrollView>
        )}
    </View>
  )
}

export const LumenTransfer = (input: LumenTransferProps): ReactElement => {
  const props = {
    sourceTitle: 'Available',
    targetTitle: 'Selected',
    moveToTargetLabel: 'Move to selected',
    moveToSourceLabel: 'Move to available',
    emptyLabel: 'No items',
    formatCount: String,
    ...input
  }

  const theme = useLumenTheme()
  const lists = lumenTransferLists(props.items, props.value)
  const status = transferStatus(props, lists === null)
  const locked = props.disabled === true || props.readOnly === true || status !== null

  const move = (to: LumenTransferSide): void => {
    if (locked) return

    const next = moveLumenTransferItems(props.items, props.value, to)

    if (next) props.onValueChange(next)
  }

  const check = (item: LumenTransferItem, checked: boolean): void => {
    if (locked) return

    const next = toggleLumenTransferItem(props.items, props.value, item.id, checked)

    if (next) props.onValueChange(next)
  }

  const panels = [
    { title: props.sourceTitle, items: lists?.source ?? [], id: 'source' },
    { title: props.targetTitle, items: lists?.target ?? [], id: 'target' }
  ]

  const actions: { to: LumenTransferSide, label: string }[] = [
    { to: 'target', label: props.moveToTargetLabel }, { to: 'source', label: props.moveToSourceLabel }
  ]

  return (
    <View style={props.style} testID={props.testID} accessibilityLabel={props.label}>
      <LumenText accessibilityRole="header">{props.label}</LumenText>
      {status !== null ?
        <LumenText accessibilityLiveRegion="polite">{status}</LumenText> :
        (
          <View style={{ gap: theme.spacing.sm }}>
            {panels.map(panel => (
              <TransferPanel
                key={panel.id}
                {...panel}
                value={props.value}
                locked={locked}
                emptyLabel={props.emptyLabel}
                formatCount={props.formatCount}
                onCheck={check}
              />
            ))}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {actions.map(action => (
                <LumenButton
                  key={action.to}
                  intent="secondary"
                  accessibilityLabel={action.label}
                  disabled={locked || moveLumenTransferItems(props.items, props.value, action.to) === null}
                  style={{ minWidth: 44, minHeight: 44 }}
                  onPress={() => {
                    move(action.to)
                  }}
                >
                  <LumenText>{action.label}</LumenText>
                </LumenButton>
              ))}
            </View>
          </View>
        )}
    </View>
  )
}

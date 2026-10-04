import { type ReactElement, useState } from 'react'
import { FlatList, View, type ViewProps } from 'react-native'

import { LumenButton, LumenText } from './primitives.js'
import { useLumenTheme } from './theme-context.js'
import type { LumenTreeNode, LumenTreeRow } from './tree-recipes.js'
import { LumenTreeSelectModel } from './tree-select-recipes.js'

export interface LumenTreeSelectProps extends Pick<ViewProps, 'style' | 'testID' | 'nativeID' | 'accessibilityHint'> {
  label: string
  nodes: readonly LumenTreeNode[]
  value: string | null
  onValueChange: (value: string) => void
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  loading?: boolean | undefined
  error?: string | null | undefined
  placeholder?: string | undefined
  unknownSelectionLabel?: string | undefined
  loadingLabel?: string | undefined
  emptyLabel?: string | undefined
  invalidLabel?: string | undefined
  expandedLabel?: string | undefined
  collapsedLabel?: string | undefined
  formatOption?: ((label: string, path: readonly string[], level: number) => string) | undefined
}

const defaultOption = (_label: string, path: readonly string[], level: number): string => `${path.join(' / ')}, level ${level}`

const statusLabel = (props: LumenTreeSelectProps, model: LumenTreeSelectModel): string | null => {
  if (props.loading) return props.loadingLabel ?? 'Loading'

  if (props.error !== undefined && props.error !== null) return props.error

  if (!model.valid) return props.invalidLabel ?? 'Invalid options'

  return null
}

const TreeSelectOption = ({ props, model, row, close }: {
  props: LumenTreeSelectProps
  model: LumenTreeSelectModel
  row: LumenTreeRow
  close: () => void
}): ReactElement => {
  const theme = useLumenTheme()
  const blocked = (props.disabled ?? false) || (props.readOnly ?? false) || !model.canSelect(row.node.id)
  const path = model.tree.path(row.node.id).map(node => node.label)
  const name = (props.formatOption ?? defaultOption)(row.node.label, path, row.depth + 1)

  return (
    <View style={{ marginStart: Math.min(row.depth, 8) * theme.spacing.sm }}>
      <LumenButton
        disabled={blocked}
        accessibilityLabel={name}
        accessibilityState={{ selected: props.value === row.node.id, disabled: blocked }}
        onPress={() => {
          if (blocked) return

          const next = model.selecting(row.node.id, props.value)

          if (next !== null && next !== props.value) props.onValueChange(next)

          close()
        }}
      >
        {row.node.label}
      </LumenButton>
    </View>
  )
}

export const LumenTreeSelect = (props: LumenTreeSelectProps): ReactElement => {
  const theme = useLumenTheme()
  const [open, setOpen] = useState(false)
  const model = new LumenTreeSelectModel(props.nodes)
  const status = statusLabel(props, model)
  const selection = model.selectionLabel(props.value, props.placeholder ?? 'Select…', props.unknownSelectionLabel ?? 'Unavailable selection')

  return (
    <View
      testID={props.testID}
      nativeID={props.nativeID}
      accessibilityLabel={props.label}
      accessibilityHint={props.accessibilityHint}
      style={[{ gap: theme.spacing.sm }, props.style]}
    >
      <LumenText>{props.label}</LumenText>
      {status !== null ? <LumenText accessibilityLiveRegion="polite">{selection}</LumenText> : null}
      {status !== null ?
        <LumenText accessibilityLiveRegion="polite">{status}</LumenText> :
        (
          <>
            <LumenButton
              disabled={props.disabled}
              accessibilityLabel={`${props.label}: ${selection}`}
              accessibilityState={{ expanded: open }}
              accessibilityValue={{ text: open ? props.expandedLabel ?? 'Expanded' : props.collapsedLabel ?? 'Collapsed' }}
              onPress={() => {
                if (!props.disabled) setOpen(current => !current)
              }}
            >
              {selection}
            </LumenButton>
            {open ?
              (
                <FlatList
                  nestedScrollEnabled
                  style={{ maxHeight: 320 }}
                  accessibilityLabel={props.label}
                  data={model.rows}
                  keyExtractor={row => row.node.id}
                  ListEmptyComponent={<LumenText>{props.emptyLabel ?? 'No options'}</LumenText>}
                  renderItem={({ item }) => (
                    <TreeSelectOption
                      props={props}
                      model={model}
                      row={item}
                      close={() => {
                        setOpen(false)
                      }}
                    />
                  )}
                />
              ) :
              null}
          </>
        )}
    </View>
  )
}

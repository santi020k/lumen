import { type ReactElement, useState } from 'react'
import { View, type ViewProps } from 'react-native'

import { LumenCascaderModel } from './cascader-recipes.js'
import { LumenButton, LumenText } from './primitives.js'
import { useLumenTheme } from './theme-context.js'
import type { LumenTreeNode } from './tree-recipes.js'

export interface LumenCascaderProps extends Omit<ViewProps, 'children'> {
  label: string
  nodes: readonly LumenTreeNode[]
  selectedPath: readonly string[]
  onSelectionChange: (path: readonly string[]) => void
  disabled?: boolean | undefined
  readOnly?: boolean | undefined
  loading?: boolean | undefined
  error?: string | null | undefined
  loadingLabel?: string | undefined
  emptyLabel?: string | undefined
  invalidLabel?: string | undefined
  unknownSelectionLabel?: string | undefined
  placeholder?: string | undefined
  backLabel?: string | undefined
  formatDisclosure?: ((label: string) => string) | undefined
}

const defaultDisclosure = (name: string): string => `Open ${name}`

const selectionLabel = (props: LumenCascaderProps, model: LumenCascaderModel): string => {
  if (!model.isPathValid(props.selectedPath)) return props.unknownSelectionLabel ?? 'Unavailable selection'

  if (props.selectedPath.length === 0) return props.placeholder ?? 'Select…'

  return props.selectedPath.map(id => model.tree.node(id)?.label ?? id).join(' / ')
}

const CascaderOption = ({ node, model, props, browse }: {
  node: LumenTreeNode
  model: LumenCascaderModel
  props: LumenCascaderProps
  browse: (id: string) => void
}): ReactElement => {
  const branch = model.tree.childrenOf(node.id).length > 0
  const leafBlocked = Boolean(props.readOnly) || !model.canSelect(node.id)
  const blocked = Boolean(props.disabled) || model.tree.isDisabled(node.id) || (!branch && leafBlocked)
  const disclosure = props.formatDisclosure ?? defaultDisclosure

  return (
    <LumenButton
      disabled={blocked}
      accessibilityLabel={branch ? disclosure(node.label) : node.label}
      accessibilityState={{
        selected: !branch && model.isPathValid(props.selectedPath) && props.selectedPath.at(-1) === node.id,
        disabled: blocked
      }}
      onPress={() => {
        if (blocked) return

        if (branch) browse(node.id)
        else props.onSelectionChange(model.selecting(node.id, props.selectedPath))
      }}
    >
      {branch ? `${node.label} ›` : node.label}
    </LumenButton>
  )
}

const browsingParent = (id: string | null, model: LumenCascaderModel): LumenTreeNode | undefined => {
  if (!id || model.tree.isDisabled(id)) return undefined

  return model.tree.node(id)
}

const CascaderOptions = ({ model, props }: { model: LumenCascaderModel, props: LumenCascaderProps }): ReactElement => {
  const theme = useLumenTheme()
  const [browsingId, setBrowsingId] = useState<string | null>(null)
  const parent = browsingParent(browsingId, model)
  const options = model.tree.childrenOf(parent?.id ?? null)
  const backLabel = props.backLabel ?? 'Back'

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {parent ?
        (
          <LumenButton
            disabled={props.disabled}
            accessibilityLabel={backLabel}
            onPress={() => {
              if (!props.disabled) setBrowsingId(parent.parentId ?? null)
            }}
          >
            {backLabel}
          </LumenButton>
        ) :
        null}
      {parent ? <LumenText>{model.tree.path(parent.id).map(node => node.label).join(' / ')}</LumenText> : null}
      {options.length === 0 ? <LumenText>{props.emptyLabel ?? 'No options'}</LumenText> : null}
      {options.map(node => (
        <CascaderOption key={node.id} node={node} model={model} props={props} browse={setBrowsingId} />
      ))}
    </View>
  )
}

const CascaderContent = (props: LumenCascaderProps): ReactElement => {
  const model = new LumenCascaderModel(props.nodes)

  if (props.loading) return <LumenText accessibilityRole="progressbar">{props.loadingLabel ?? 'Loading'}</LumenText>

  if (props.error) return <LumenText accessibilityRole="alert">{props.error}</LumenText>

  if (!model.tree.valid) return <LumenText accessibilityRole="alert">{props.invalidLabel ?? 'Invalid options'}</LumenText>

  return <CascaderOptions model={model} props={props} />
}

export const LumenCascader = ({ label, nodes, selectedPath, onSelectionChange, disabled, readOnly, loading,
  error, loadingLabel, emptyLabel, invalidLabel, unknownSelectionLabel, placeholder, backLabel,
  formatDisclosure, style, ...viewProps }: LumenCascaderProps): ReactElement => {
  const theme = useLumenTheme()

  const props: LumenCascaderProps = { label,
    nodes,
    selectedPath,
    onSelectionChange,
    disabled,
    readOnly,
    loading,
    error,
    loadingLabel,
    emptyLabel,
    invalidLabel,
    unknownSelectionLabel,
    placeholder,
    backLabel,
    formatDisclosure }

  const model = new LumenCascaderModel(nodes)

  return (
    <View {...viewProps} accessibilityLabel={label} style={[{ gap: theme.spacing.sm }, style]}>
      <LumenText>{label}</LumenText>
      <LumenText accessibilityLiveRegion="polite">{selectionLabel(props, model)}</LumenText>
      <CascaderContent {...props} />
    </View>
  )
}

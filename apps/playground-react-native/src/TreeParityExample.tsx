import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenCheckbox, LumenText, LumenTree, type LumenTreeNode } from '@santi020k/lumen-react-native'

const nodes: readonly LumenTreeNode[] = [
  { id: 'work', label: 'Workspace' },
  { id: 'reports', label: 'Reports', parentId: 'work' },
  { id: 'quarter', label: 'Quarterly report', parentId: 'reports' },
  { id: 'archive', label: 'Locked archive', disabled: true },
  { id: 'past', label: 'Past report', parentId: 'archive' }
]

export const TreeParityExample = (): ReactElement => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['work']))
  const [selected, setSelected] = useState<Set<string>>(() => new Set(['missing-record']))
  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  return (
    <View>
      <LumenCheckbox label="Disable tree" checked={disabled} onCheckedChange={setDisabled} />
      <LumenCheckbox label="Read-only selection" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenTree
        label="Project files"
        nodes={nodes}
        expandedIds={expanded}
        onExpandedChange={setExpanded}
        selectedIds={selected}
        onSelectionChange={setSelected}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        error={error ? 'Files unavailable' : null}
        formatDisclosure={(name: string, open: boolean) => `${open ? 'Collapse' : 'Expand'} ${name}`}
        formatLevel={(depth: number) => `Level ${depth + 1}`}
      />
      <LumenText>{`Expanded: ${[...expanded].join(', ')}`}</LumenText>
      <LumenText>{`Selected: ${[...selected].join(', ')}`}</LumenText>
    </View>
  )
}

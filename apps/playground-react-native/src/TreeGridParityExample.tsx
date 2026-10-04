import { type ReactElement, useState } from 'react'

import { LumenButton, LumenCheckbox, LumenText, LumenTreeGrid, type LumenTreeGridRecord } from '@santi020k/lumen-react-native'

const records: readonly LumenTreeGridRecord[] = [
  { node: { id: 'packages', label: 'Packages' }, cells: { status: { text: 'Synthetic group' } } },
  { node: { id: 'astro', label: 'Astro', parentId: 'packages' }, cells: { status: { text: 'Ready' } } },
  { node: { id: 'react', label: 'React', parentId: 'packages' }, cells: { status: { text: 'Review pending' } } },
  { node: { id: 'locked', label: 'Archived group', disabled: true }, cells: { status: { text: 'Locked' } } },
  { node: { id: 'archived', label: 'Archived child', parentId: 'locked' }, cells: {} }
]

export const TreeGridParityExample = (): ReactElement => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['packages', 'unknown-host-id']))
  const [readOnly, setReadOnly] = useState(false)
  const [inspected, setInspected] = useState('None')

  return (
    <>
      <LumenCheckbox label="Read only cells" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenTreeGrid
        label="Synthetic project status"
        columns={[{ key: 'status', label: 'Status' }]}
        records={records}
        expandedIds={expanded}
        onExpandedChange={setExpanded}
        readOnly={readOnly}
        renderCell={(record, column, cell, context) => (
          <LumenButton
            intent="secondary"
            disabled={context.disabled || context.readOnly}
            accessibilityLabel={`${record.node.label}, ${column.label}: ${cell?.text ?? 'Unavailable'}`}
            onPress={() => {
              setInspected(record.node.label)
            }}
          >
            {cell?.text ?? 'Unavailable'}
          </LumenButton>
        )}
      />
      <LumenText>{`Inspected: ${inspected}. Host expansion IDs: ${expanded.size}`}</LumenText>
    </>
  )
}

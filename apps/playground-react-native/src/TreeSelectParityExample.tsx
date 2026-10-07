import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenCheckbox, LumenText, type LumenTreeNode, LumenTreeSelect } from '@santi020k/lumen-react-native'

const treeSelectNodes: readonly LumenTreeNode[] = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'design', label: 'Design', parentId: 'workspace' },
  { id: 'mobile', label: 'Mobile', parentId: 'design' },
  { id: 'archive', label: 'Locked archive', disabled: true },
  { id: 'past', label: 'Past project', parentId: 'archive' }
]

export const TreeSelectParityExample = (): ReactElement => {
  const [value, setValue] = useState<string | null>('retained-record')
  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [empty, setEmpty] = useState(false)

  return (
    <View>
      <LumenCheckbox label="Disable picker" checked={disabled} onCheckedChange={setDisabled} />
      <LumenCheckbox label="Read-only picker" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenCheckbox label="Empty options" checked={empty} onCheckedChange={setEmpty} />
      <LumenTreeSelect
        label="Project"
        nodes={empty ? [] : treeSelectNodes}
        value={value}
        onValueChange={setValue}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        error={error ? 'Projects unavailable' : null}
      />
      <LumenText>{`Controlled ID: ${value ?? 'none'}`}</LumenText>
      <LumenButton onPress={() => {
        setValue('retained-record')
      }}
      >
        Restore unknown ID
      </LumenButton>
      <LumenButton onPress={() => {
        setValue(null)
      }}
      >
        Clear selection
      </LumenButton>
    </View>
  )
}

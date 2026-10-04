import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenCheckbox, LumenText, LumenTransfer, type LumenTransferValue } from '@santi020k/lumen-react-native'

const items = [
  { id: 'design', label: 'Design', detail: 'Interface library' },
  { id: 'docs', label: 'Documentation' },
  { id: 'release', label: 'Release', detail: 'Managed by the host', disabled: true }
]

export const TransferParityExample = (): ReactElement => {
  const [value, setValue] = useState<LumenTransferValue>({ selectedIds: ['release', 'external-id'], checkedIds: [] })
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [empty, setEmpty] = useState(false)

  return (
    <View>
      <LumenCheckbox label="Read only" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenCheckbox label="Empty" checked={empty} onCheckedChange={setEmpty} />
      <LumenTransfer label="Project transfer" items={empty ? [] : items} value={value} onValueChange={setValue} readOnly={readOnly} loading={loading} error={error ? 'Transfer unavailable' : null} formatCount={count => `${count} items`} />
      <LumenText>{`Target IDs: ${value.selectedIds.join(', ')}`}</LumenText>
      <LumenText>{`Checked IDs: ${value.checkedIds.join(', ') || 'None'}`}</LumenText>
    </View>
  )
}

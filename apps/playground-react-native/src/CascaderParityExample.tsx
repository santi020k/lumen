import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenCascader, LumenCheckbox, LumenText } from '@santi020k/lumen-react-native'

const nodes = [{ id: 'americas', label: 'Americas' },
  { id: 'colombia', label: 'Colombia', parentId: 'americas' },
  { id: 'bogota', label: 'Bogotá', parentId: 'colombia' },
  { id: 'locked', label: 'Unavailable region', disabled: true }]

export const CascaderParityExample = (): ReactElement => {
  const [path, setPath] = useState<readonly string[]>(['missing'])
  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  return (
    <View>
      <LumenCheckbox label="Disable cascader" checked={disabled} onCheckedChange={setDisabled} />
      <LumenCheckbox label="Read-only selection" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenCascader
        label="Destination"
        nodes={nodes}
        selectedPath={path}
        onSelectionChange={setPath}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        error={error ? 'Destinations unavailable' : null}
      />
      <LumenText>{`Selected path: ${path.join(' / ')}`}</LumenText>
    </View>
  )
}

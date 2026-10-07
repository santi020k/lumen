import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenCheckbox, LumenText, LumenTooltip } from '@santi020k/lumen-react-native'

export const TooltipParityExample = (): ReactElement => {
  const [visible, setVisible] = useState(false)
  const [disabled, setDisabled] = useState(false)

  return (
    <View>
      <LumenCheckbox label="Disable help" checked={disabled} onCheckedChange={setDisabled} />
      <LumenTooltip
        label="Project privacy help"
        text="This playground uses synthetic project information."
        visible={visible}
        onVisibleChange={setVisible}
        disabled={disabled}
        dismissLabel="Close explanation"
      />
      <LumenText>{`Host visibility: ${visible ? 'shown' : 'hidden'}`}</LumenText>
      <LumenButton
        disabled={disabled}
        onPress={() => {
          setVisible(true)
        }}
      >
        Show help explicitly
      </LumenButton>
      <LumenButton onPress={() => {
        setVisible(false)
      }}
      >
        Dismiss help explicitly
      </LumenButton>
    </View>
  )
}

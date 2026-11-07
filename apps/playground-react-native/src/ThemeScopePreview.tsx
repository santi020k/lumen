import { type ComponentRef, useRef, useState } from 'react'
import type { TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { LumenButton, LumenCard, LumenSegmentedControl, LumenSheet, LumenText, LumenTextField, LumenThemeScope, useLumenTheme } from '@santi020k/lumen-react-native'

import { harborTheme } from './playground-theme'

const HarborPreview = () => {
  const theme = useLumenTheme()
  const insets = useSafeAreaInsets()
  const [visible, setVisible] = useState(false)
  const [draft, setDraft] = useState('')
  const triggerRef = useRef<ComponentRef<typeof View>>(null)
  const fieldRef = useRef<ComponentRef<typeof TextInput>>(null)

  return (
    <LumenCard style={{ gap: theme.spacing.md }}>
      <LumenText accessibilityRole="header" variant="title">Harbor preview</LumenText>
      <LumenText tone="muted" variant="caption">{`Harbor is using ${theme.scheme} mode.`}</LumenText>
      <LumenButton
        ref={triggerRef}
        onPress={() => {
          setVisible(true)
        }}
      >
        Edit preview note
      </LumenButton>
      <LumenSheet
        actions={(
          <LumenButton onPress={() => {
            setVisible(false)
          }}
          >
            Done
          </LumenButton>
        )}
        avoidKeyboard
        initialFocusRef={fieldRef}
        onDismiss={() => {
          setVisible(false)
        }}
        returnFocusRef={triggerRef}
        safeAreaInsets={insets}
        title="Preview note"
        visible={visible}
      >
        <LumenTextField accessibilityLabel="Harbor note" onChangeText={setDraft} ref={fieldRef} value={draft} />
      </LumenSheet>
    </LumenCard>
  )
}

export const ThemeScopePreview = () => {
  const [scheme, setScheme] = useState<'inherit' | 'light'>('inherit')

  return (
    <LumenCard>
      <LumenSegmentedControl
        label="Harbor appearance"
        onValueChange={value => {
          if (value === 'inherit' || value === 'light') setScheme(value)
        }}
        options={[{ label: 'Follow playground', value: 'inherit' }, { label: 'Always light', value: 'light' }]}
        value={scheme}
      />
      <LumenThemeScope definition={harborTheme} {...scheme === 'light' && { scheme }}>
        <HarborPreview />
      </LumenThemeScope>
    </LumenCard>
  )
}

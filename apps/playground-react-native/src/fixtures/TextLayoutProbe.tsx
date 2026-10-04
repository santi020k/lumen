import { type ReactElement, useCallback, useState } from 'react'
import { ScrollView, Text, type TextProps, useWindowDimensions, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

import { LumenProvider, LumenText, LumenTextField } from '@santi020k/lumen-react-native/foundations'

// Diagnostic-only platform baseline; the public playground entrypoint does not import this fixture.
const paragraph = 'Native text must reflow when the text size changes while this screen remains mounted. Every word should remain readable, including the last sentence of this paragraph.'

interface LineSample {
  count: number
  widest: number
}

const sampleLines = (lines: readonly { width: number }[]): LineSample => ({
  count: lines.length,
  widest: Math.round(Math.max(0, ...lines.map(line => line.width)))
})

const ProbeContent = (): ReactElement => {
  const { fontScale } = useWindowDimensions()
  const [draft, setDraft] = useState('Draft survives scaling')
  const [nativeLines, setNativeLines] = useState<LineSample>({ count: 0, widest: 0 })
  const [lumenLines, setLumenLines] = useState<LineSample>({ count: 0, widest: 0 })

  const onNativeTextLayout = useCallback<NonNullable<TextProps['onTextLayout']>>(event => {
    const next = sampleLines(event.nativeEvent.lines)

    setNativeLines(previous => previous.count === next.count && previous.widest === next.widest ? previous : next)
  }, [])

  const onLumenTextLayout = useCallback<NonNullable<TextProps['onTextLayout']>>(event => {
    const next = sampleLines(event.nativeEvent.lines)

    setLumenLines(previous => previous.count === next.count && previous.widest === next.widest ? previous : next)
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={{ color: 'black', fontSize: 20 }}>{`Text layout probe · scale ${fontScale.toFixed(3)}`}</Text>
        <View style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: 'black', fontSize: 18 }}>Plain React Native</Text>
          <Text onTextLayout={onNativeTextLayout} style={{ color: 'black', fontSize: 16 }}>{paragraph}</Text>
          <Text style={{ color: 'black', fontSize: 14 }}>{`Native lines: ${nativeLines.count} · widest: ${nativeLines.widest}`}</Text>
        </View>
        <View style={{ gap: 12 }}>
          <LumenText accessibilityRole="header" variant="title">Lumen foundations</LumenText>
          <LumenText onTextLayout={onLumenTextLayout}>{paragraph}</LumenText>
          <Text style={{ color: 'black', fontSize: 14 }}>{`Lumen lines: ${lumenLines.count} · widest: ${lumenLines.widest}`}</Text>
        </View>
        <LumenTextField accessibilityLabel="Preserved draft" value={draft} onChangeText={setDraft} />
      </ScrollView>
    </SafeAreaView>
  )
}

export default function TextLayoutProbe(): ReactElement {
  return (
    <SafeAreaProvider>
      <LumenProvider scheme="light">
        <ProbeContent />
      </LumenProvider>
    </SafeAreaProvider>
  )
}

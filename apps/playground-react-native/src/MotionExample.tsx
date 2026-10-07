import { type ReactElement, useEffect, useState } from 'react'
import { Animated, LayoutAnimation, Platform, View } from 'react-native'

import {
  LumenButton, LumenCard, LumenDisclosure, LumenSheet, LumenSpinner,
  LumenStatusBar, LumenText, LumenToggle, useLumenTheme
} from '@santi020k/lumen-react-native'

export const MotionExample = ({ reducedMotion }: { reducedMotion: boolean }): ReactElement => {
  const theme = useLumenTheme()
  const [reduceDemo, setReduceDemo] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [opacity] = useState(() => new Animated.Value(1))
  const reduced = reducedMotion || reduceDemo

  useEffect(() => {
    if (!saving) return

    const timer = setTimeout(() => {
      setSaving(false)

      setSaved(true)
    }, 700)

    return () => {
      clearTimeout(timer)
    }
  }, [saving])

  useEffect(() => {
    opacity.stopAnimation()

    if (!saved || reduced) {
      opacity.setValue(1)

      return
    }

    opacity.setValue(0)

    const animation = Animated.timing(opacity, {
      duration: theme.durations.standard, toValue: 1, useNativeDriver: Platform.OS !== 'web'
    })

    animation.start()

    return () => {
      animation.stop()
    }
  }, [opacity, reduced, saved, theme.durations.standard])

  return (
    <LumenCard>
      <View style={{ gap: theme.spacing.lg }}>
        <LumenText variant="title">Motion playground</LumenText>
        <LumenText tone="soft">Brief, optional transitions. This save is simulated; no data is sent.</LumenText>
        <LumenToggle label="Reduce demo effects" value={reduceDemo} onValueChange={setReduceDemo} />
        <LumenText>{reduced ? 'Demo effects are immediate.' : 'Demo effects follow the system preference.'}</LumenText>
        <LumenDisclosure
          title="Expandable details"
          expanded={expanded}
          onExpandedChange={value => {
            if (!reduced) LayoutAnimation.configureNext({
              duration: theme.durations.standard,
              update: { type: LayoutAnimation.Types.easeInEaseOut }
            })

            setExpanded(value)
          }}
        >
          <LumenText>Content stays readable while its surrounding layout changes.</LumenText>
        </LumenDisclosure>
        {saving && <LumenSpinner accessibilityLabel="Saving demonstration" />}
        <Animated.View style={{ opacity }} accessibilityLiveRegion="polite">
          <LumenStatusBar message={saved ? 'Demonstration saved.' : 'Ready to preview.'} tone={saved ? 'success' : 'neutral'} />
        </Animated.View>
        <LumenButton
          disabled={saving}
          onPress={() => {
            setSaved(false)

            setSaving(true)
          }}
        >
          Simulate save
        </LumenButton>
        <LumenButton
          intent="secondary"
          onPress={() => {
            setSheet(true)
          }}
        >
          Open sheet
        </LumenButton>
        <LumenText tone="soft">Native sheet motion follows the operating system.</LumenText>
        <LumenSheet
          title="Native sheet motion"
          visible={sheet}
          onDismiss={() => {
            setSheet(false)
          }}
          actions={(
            <LumenButton onPress={() => {
              setSheet(false)
            }}
            >
              Close sheet
            </LumenButton>
          )}
        >
          <LumenText>Open, close, and reopen. The application owns state; the platform owns presentation.</LumenText>
        </LumenSheet>
      </View>
    </LumenCard>
  )
}

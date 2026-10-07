import { type ReactElement, type ReactNode, useEffect } from 'react'
import { BackHandler, View, type ViewProps } from 'react-native'

import { LumenButton, LumenText } from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenTooltipProps extends Pick<ViewProps, 'style' | 'testID' | 'nativeID'> {
  label: string
  text: string
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  disabled?: boolean | undefined
  dismissLabel?: string | undefined
  children?: ReactNode | undefined
}

const hasTooltipContent = (label: string, text: string): boolean => label.trim().length > 0 && text.trim().length > 0

/** Controlled contextual help. The description never replaces the anchor's name. */
export const LumenTooltip = (props: LumenTooltipProps): ReactElement => {
  const theme = useLumenTheme()
  const { onVisibleChange } = props
  const labelPresent = props.label.trim().length > 0
  const valid = hasTooltipContent(props.label, props.text)
  const disabled = (props.disabled ?? false) || !valid
  const visible = props.visible && !disabled

  useEffect(() => {
    if (!visible) return

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onVisibleChange(false)

      return true
    })

    return () => {
      subscription.remove()
    }
  }, [visible, onVisibleChange])

  if (!labelPresent) return <View testID={props.testID} nativeID={props.nativeID} style={props.style} />

  const show = (): void => {
    if (!disabled && !visible) onVisibleChange(true)
  }

  const dismiss = (): void => {
    if (visible) onVisibleChange(false)
  }

  return (
    <View testID={props.testID} nativeID={props.nativeID} style={[{ gap: theme.spacing.xs }, props.style]}>
      <LumenButton
        intent="secondary"
        disabled={disabled}
        accessibilityLabel={props.label}
        accessibilityHint={valid ? props.text : undefined}
        accessibilityState={{ expanded: visible, disabled }}
        accessibilityActions={visible ? [{ name: 'dismiss', label: props.dismissLabel ?? 'Dismiss help' }] : []}
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'dismiss') dismiss()
        }}
        onAccessibilityEscape={dismiss}
        onFocus={show}
        onBlur={dismiss}
        onHoverIn={show}
        onHoverOut={dismiss}
        onLongPress={show}
        onPress={() => {
          if (disabled) return

          if (visible) dismiss()
          else show()
        }}
      >
        {props.children ?? props.label}
      </LumenButton>
      {visible ?
        (
          <View
            pointerEvents="none"
            style={{
              backgroundColor: theme.colors.ink,
              borderRadius: theme.radii.sm,
              padding: theme.spacing.sm,
              maxWidth: '100%'
            }}
          >
            <LumenText accessibilityLiveRegion="polite" style={{ color: theme.colors.canvas }}>
              {props.text}
            </LumenText>
          </View>
        ) :
        null}
    </View>
  )
}

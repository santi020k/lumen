import {
  type ComponentRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useRef
} from 'react'
import {
  type HostInstance,
  Pressable,
  type PressableProps,
  ScrollView,
  Text,
  type TextStyle,
  View,
  type ViewProps
} from 'react-native'

import { resolveLumenButtonOpacity } from './recipes.js'
import { resolveLumenSelectionState } from './selection-recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenSelectionOption {
  description?: string
  disabled?: boolean
  label: string
  value: string
}

export interface LumenCheckboxProps extends Omit<PressableProps, 'children' | 'disabled' | 'onPress'> {
  checked: boolean
  description?: string
  disabled?: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
  ref?: Ref<HostInstance>
}

export const LumenCheckbox = ({
  checked,
  description,
  disabled = false,
  label,
  onCheckedChange,
  ref,
  style,
  ...props
}: LumenCheckboxProps): ReactElement => {
  const theme = useLumenTheme()
  const state = resolveLumenSelectionState(checked, disabled)

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => {
        onCheckedChange(!checked)
      }}
      style={pressState => [
        {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: theme.spacing.md,
          minHeight: 44,
          opacity: state.opacity,
          paddingVertical: theme.spacing.sm
        },
        typeof style === 'function' ? style(pressState) : style
      ]}
    >
      {({ pressed }) => (
        <>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              alignItems: 'center',
              backgroundColor: checked ? theme.colors.brandSolid : theme.colors.surface,
              borderColor: checked ? theme.colors.brandSolid : theme.colors.line,
              borderRadius: theme.radii.sm,
              borderWidth: 1,
              height: 22,
              justifyContent: 'center',
              marginTop: 1,
              opacity: resolveLumenButtonOpacity(disabled, pressed),
              width: 22
            }}
          >
            {checked ?
              <Text style={{ color: theme.colors.onBrand, fontSize: 14, fontWeight: '700' }}>✓</Text> :
              null}
          </View>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.ink,
                fontSize: theme.fontSizes.sm,
                fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
              }}
            >
              {label}
            </Text>
            {description ?
              <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>{description}</Text> :
              null}
          </View>
        </>
      )}
    </Pressable>
  )
}

export interface LumenRadioGroupProps extends Omit<ViewProps, 'children'> {
  label: string
  onValueChange: (value: string) => void
  options: readonly LumenSelectionOption[]
  ref?: Ref<HostInstance>
  value: string
}

export const LumenRadioGroup = ({
  label,
  onValueChange,
  options,
  ref,
  style,
  value,
  ...props
}: LumenRadioGroupProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View
      ref={ref}
      {...props}
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityRole="radiogroup"
      style={[{ gap: theme.spacing.sm }, style]}
    >
      <Text
        style={{
          color: theme.colors.ink,
          fontSize: theme.fontSizes.sm,
          fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
        }}
      >
        {label}
      </Text>
      {options.map(option => {
        const selected = value === option.value
        const state = resolveLumenSelectionState(selected, option.disabled ?? false)

        return (
          <Pressable
            aria-checked={selected}
            aria-disabled={state.disabled}
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: state.disabled }}
            disabled={state.disabled}
            onPress={() => {
              onValueChange(option.value)
            }}
            style={({ pressed }) => ({
              alignItems: 'flex-start',
              flexDirection: 'row',
              gap: theme.spacing.md,
              minHeight: 44,
              opacity: state.opacity * resolveLumenButtonOpacity(state.disabled, pressed),
              paddingVertical: theme.spacing.sm
            })}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                alignItems: 'center',
                borderColor: selected ? theme.colors.brandSolid : theme.colors.line,
                borderRadius: 11,
                borderWidth: 2,
                height: 22,
                justifyContent: 'center',
                marginTop: 1,
                width: 22
              }}
            >
              {selected ?
                <View style={{ backgroundColor: theme.colors.brandSolid, borderRadius: 5, height: 10, width: 10 }} /> :
                null}
            </View>
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <Text style={{ color: theme.colors.ink, fontSize: theme.fontSizes.sm }}>{option.label}</Text>
              {option.description ?
                (
                  <Text style={{ color: theme.colors.inkMuted, fontSize: theme.fontSizes.xs }}>
                    {option.description}
                  </Text>
                ) :
                null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

export interface LumenSegmentedControlProps extends Omit<ViewProps, 'children'> {
  label: string
  onValueChange: (value: string) => void
  options: readonly LumenSelectionOption[]
  ref?: Ref<HostInstance>
  showLabel?: boolean
  value: string
}

export const LumenSegmentedControl = ({
  label,
  onValueChange,
  options,
  ref,
  showLabel = true,
  style,
  value,
  ...props
}: LumenSegmentedControlProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <View ref={ref} {...props} style={[{ gap: theme.spacing.sm }, style]}>
      {showLabel ?
        (
          <Text
            style={{
              color: theme.colors.ink,
              fontSize: theme.fontSizes.sm,
              fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
            }}
          >
            {label}
          </Text>
        ) :
        null}
      <View
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        style={{
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.line,
          borderRadius: theme.radii.sm,
          borderWidth: 1,
          flexDirection: 'row',
          padding: 2
        }}
      >
        {options.map(option => {
          const selected = value === option.value
          const state = resolveLumenSelectionState(selected, option.disabled ?? false)

          return (
            <Pressable
              aria-checked={selected}
              aria-disabled={state.disabled}
              key={option.value}
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: state.disabled }}
              disabled={state.disabled}
              onPress={() => {
                onValueChange(option.value)
              }}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: selected ? theme.colors.surface : 'transparent',
                borderRadius: theme.radii.sm,
                flex: 1,
                justifyContent: 'center',
                minHeight: 40,
                opacity: state.opacity * resolveLumenButtonOpacity(state.disabled, pressed),
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.sm
              })}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: selected ? theme.colors.brand : theme.colors.inkSoft,
                  fontSize: theme.fontSizes.xs,
                  fontWeight: String(
                    selected ? theme.fontWeights.bold : theme.fontWeights.semibold
                  ) as TextStyle['fontWeight']
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export interface LumenTabsProps extends Omit<ViewProps, 'children'> {
  children: ReactNode
  label: string
  onValueChange: (value: string) => void
  options: readonly LumenSelectionOption[]
  ref?: Ref<HostInstance>
  value: string
}

export const LumenTabs = ({
  children,
  label,
  onValueChange,
  options,
  ref,
  style,
  value,
  ...props
}: LumenTabsProps): ReactElement => {
  const theme = useLumenTheme()
  const selectedOption = options.find(option => option.value === value)
  const selectedIndex = options.findIndex(option => option.value === value)
  const tabsId = useId().replaceAll(':', '')
  const pendingFocusValueRef = useRef<string | undefined>(undefined)
  const tabInstancesRef = useRef<(HostInstance | null)[]>([])
  const tabLayoutsRef = useRef(new Map<number, { width: number, x: number }>())
  const tabListRef = useRef<ComponentRef<typeof ScrollView>>(null)
  const viewportWidthRef = useRef(0)

  const scrollTabIntoView = (index: number, animated: boolean): void => {
    const layout = tabLayoutsRef.current.get(index)

    if (!layout) return

    const centeredOffset = layout.x - Math.max(0, (viewportWidthRef.current - layout.width) / 2)

    tabListRef.current?.scrollTo({ animated, x: Math.max(0, centeredOffset) })
  }

  useEffect(() => {
    if (selectedIndex < 0) return

    scrollTabIntoView(selectedIndex, true)

    if (pendingFocusValueRef.current === value) {
      tabInstancesRef.current[selectedIndex]?.focus()

      pendingFocusValueRef.current = undefined
    }
  }, [selectedIndex, value])

  const selectTab = (optionIndex: number): boolean => {
    const option = options[optionIndex]

    if (!option || option.disabled) return false

    if (option.value === value) {
      tabInstancesRef.current[optionIndex]?.focus()

      return true
    }

    pendingFocusValueRef.current = option.value

    onValueChange(option.value)

    return true
  }

  const moveSelection = (currentIndex: number, direction: -1 | 1): void => {
    for (let offset = 1; offset < options.length; offset += 1) {
      const nextIndex = (currentIndex + direction * offset + options.length) % options.length

      if (selectTab(nextIndex)) return
    }
  }

  return (
    <View ref={ref} {...props} style={[{ gap: theme.spacing.md }, style]}>
      <ScrollView
        accessibilityLabel={label}
        accessibilityRole="tablist"
        contentContainerStyle={{ gap: theme.spacing.xs }}
        horizontal
        onLayout={event => {
          viewportWidthRef.current = event.nativeEvent.layout.width

          if (selectedIndex >= 0) scrollTabIntoView(selectedIndex, false)
        }}
        ref={tabListRef}
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomColor: theme.colors.line, borderBottomWidth: 1 }}
      >
        {options.map((option, optionIndex) => {
          const selected = option.value === value
          const state = resolveLumenSelectionState(selected, option.disabled ?? false)
          const tabId = `${tabsId}-tab-${optionIndex}`

          return (
            <Pressable
              aria-disabled={state.disabled}
              aria-selected={selected}
              accessibilityRole="tab"
              accessibilityState={{ disabled: state.disabled, selected }}
              disabled={state.disabled}
              key={option.value}
              nativeID={tabId}
              onKeyDown={event => {
                const key = event.nativeEvent.key || event.nativeEvent.code

                if (key === 'ArrowLeft') {
                  event.preventDefault()

                  moveSelection(optionIndex, -1)
                } else if (key === 'ArrowRight') {
                  event.preventDefault()

                  moveSelection(optionIndex, 1)
                }
              }}
              onLayout={event => {
                tabLayoutsRef.current.set(optionIndex, event.nativeEvent.layout)

                if (selected) scrollTabIntoView(optionIndex, false)
              }}
              onPress={() => {
                onValueChange(option.value)
              }}
              ref={instance => {
                tabInstancesRef.current[optionIndex] = instance
              }}
              style={({ pressed }) => ({
                borderBottomColor: selected ? theme.colors.brandSolid : 'transparent',
                borderBottomWidth: 2,
                minHeight: 44,
                opacity: state.opacity * resolveLumenButtonOpacity(state.disabled, pressed),
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm
              })}
            >
              <Text
                style={{
                  color: selected ? theme.colors.brand : theme.colors.inkSoft,
                  fontSize: theme.fontSizes.sm,
                  fontWeight: String(
                    selected ? theme.fontWeights.bold : theme.fontWeights.semibold
                  ) as TextStyle['fontWeight']
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
      <View
        aria-labelledby={selectedIndex >= 0 ? `${tabsId}-tab-${selectedIndex}` : undefined}
        accessibilityLabel={`${selectedOption?.label ?? value} tab panel`}
        accessibilityLiveRegion="polite"
        role="tabpanel"
      >
        {children}
      </View>
    </View>
  )
}

import {
  type ComponentRef,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState
} from 'react'
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  type ShareContent,
  type ShareOptions,
  Text,
  type TextStyle,
  useWindowDimensions,
  View,
  type ViewStyle
} from 'react-native'

import {
  type LumenMenuPosition,
  resolveLumenMenuPosition
} from './overlay-recipes.js'
import { LumenButton } from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenSafeAreaInsets {
  bottom?: number
  left?: number
  right?: number
  top?: number
}

const safeInset = (value: number | undefined): number => Number.isFinite(value) ? Math.max(0, value ?? 0) : 0
const emptySafeAreaInsets: LumenSafeAreaInsets = Object.freeze({})

export interface LumenAlertDialogProps {
  cancelLabel?: string
  confirmDisabled?: boolean
  confirmLabel: string
  confirmLoading?: boolean
  destructive?: boolean
  description?: string
  onConfirm: () => void
  onDismiss: () => void
  /** Pass insets from the application's safe-area integration when needed. */
  safeAreaInsets?: LumenSafeAreaInsets
  title: string
  visible: boolean
}

/** A controlled native confirmation dialog with explicit cancel and confirm actions. */
export const LumenAlertDialog = ({
  cancelLabel = 'Cancel',
  confirmDisabled = false,
  confirmLabel,
  confirmLoading = false,
  destructive = false,
  description,
  onConfirm,
  onDismiss,
  safeAreaInsets = emptySafeAreaInsets,
  title,
  visible
}: LumenAlertDialogProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <Modal
      animationType="fade"
      onRequestClose={onDismiss}
      transparent
      visible={visible}
    >
      <View
        accessibilityViewIsModal
        style={{
          alignItems: 'center',
          backgroundColor: '#00000080',
          flex: 1,
          justifyContent: 'center',
          paddingBottom: theme.spacing.xl + safeInset(safeAreaInsets.bottom),
          paddingLeft: theme.spacing.xl + safeInset(safeAreaInsets.left),
          paddingRight: theme.spacing.xl + safeInset(safeAreaInsets.right),
          paddingTop: theme.spacing.xl + safeInset(safeAreaInsets.top)
        }}
      >
        <ScrollView
          accessibilityRole="alert"
          contentContainerStyle={{
            gap: theme.spacing.lg,
            padding: theme.spacing.xl
          }}
          keyboardShouldPersistTaps="handled"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.line,
            borderRadius: theme.radii.lg,
            borderWidth: 1,
            maxHeight: '100%',
            maxWidth: 440,
            width: '100%'
          }}
        >
          <View style={{ gap: theme.spacing.sm }}>
            <Text
              style={{
                color: theme.colors.ink,
                fontSize: theme.fontSizes.lg,
                fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
              }}
            >
              {title}
            </Text>
            {description ?
              (
                <Text style={{ color: theme.colors.inkSoft, fontSize: theme.fontSizes.sm }}>
                  {description}
                </Text>
              ) :
              null}
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              justifyContent: 'flex-end'
            }}
          >
            <LumenButton intent="quiet" onPress={onDismiss}>
              {cancelLabel}
            </LumenButton>
            <LumenButton
              disabled={confirmDisabled}
              intent={destructive ? 'danger' : 'primary'}
              loading={confirmLoading}
              onPress={onConfirm}
            >
              {confirmLabel}
            </LumenButton>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

export interface LumenSheetProps {
  /** Names sheets without a title; defaults to the visible title. */
  accessibilityLabel?: string
  actions?: ReactNode
  /** Opt in when the sheet contains editable fields. */
  avoidKeyboard?: boolean
  children: ReactNode
  description?: string
  /** Controls backdrop taps and the platform back/dismiss action. */
  dismissible?: boolean
  keyboardVerticalOffset?: number
  onDismiss: () => void
  /** Adaptive presentation centers a bounded dialog on windows at least 768 points wide. */
  presentation?: 'adaptive' | 'sheet'
  /** Pass insets from the application's existing safe-area provider. */
  safeAreaInsets?: LumenSafeAreaInsets
  /** Scrolls the body while keeping the heading and actions outside the scroll region. */
  scrollable?: boolean
  title?: string
  visible: boolean
}

const getSheetContainerStyle = (centered: boolean, spacing: number, insets: LumenSheetProps['safeAreaInsets'] = {}): ViewStyle => {
  const margin = centered ? spacing : 0

  return {
    alignItems: centered ? 'center' : 'stretch',
    flex: 1,
    justifyContent: centered ? 'center' : 'flex-end',
    paddingLeft: safeInset(insets.left) + margin,
    paddingRight: safeInset(insets.right) + margin,
    paddingTop: safeInset(insets.top),
    paddingBottom: centered ? safeInset(insets.bottom) : 0
  }
}

const SheetHeading = ({ title, description }: Pick<LumenSheetProps, 'title' | 'description'>) => {
  const theme = useLumenTheme()

  if (!title && !description) return null

  return (
    <View style={{ gap: theme.spacing.sm, flexShrink: 0 }}>
      {title ?
        (
          <Text accessibilityRole="header" style={{ color: theme.colors.ink, fontSize: theme.fontSizes.lg, fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight'] }}>
            {title}
          </Text>
        ) :
        null}
      {description ? <Text style={{ color: theme.colors.inkSoft }}>{description}</Text> : null}
    </View>
  )
}

const SheetBody = ({ children, scrollable }: Pick<LumenSheetProps, 'children' | 'scrollable'>) => scrollable ?
  (
    <ScrollView
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      style={{ flexShrink: 1, minHeight: 0 }}
    >
      {children}
    </ScrollView>
  ) :
  children

const SheetPanel = ({ actions, children, centered, safeAreaInsets, ...heading }: Pick<LumenSheetProps, 'actions' | 'children' | 'title' | 'description'> & { centered: boolean, safeAreaInsets: LumenSheetProps['safeAreaInsets'] }) => {
  const theme = useLumenTheme()
  const bottomRadius = centered ? theme.radii.lg : 0

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.line,
      borderTopLeftRadius: theme.radii.lg,
      borderTopRightRadius: theme.radii.lg,
      borderBottomLeftRadius: bottomRadius,
      borderBottomRightRadius: bottomRadius,
      borderWidth: 1,
      gap: theme.spacing.lg,
      maxHeight: '90%',
      maxWidth: centered ? 560 : undefined,
      minHeight: 0,
      padding: theme.spacing.xl,
      paddingBottom: centered ? theme.spacing.xl : Math.max(theme.spacing.xl, safeInset(safeAreaInsets?.bottom)),
      width: '100%'
    }}
    >
      <SheetHeading {...heading} />
      {children}
      {actions ? <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>{actions}</View> : null}
    </View>
  )
}

const useSheetReducedMotion = (visible: boolean): boolean => {
  const [reduced, setReduced] = useState(true)

  useEffect(() => {
    if (!visible) return

    let active = true
    let changed = false

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      changed = true

      setReduced(value)
    })

    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active && !changed) setReduced(value)

      return undefined
    }).catch(() => { /* Keep the conservative no-animation fallback. */ })

    return () => {
      active = false

      subscription.remove()
    }
  }, [visible])

  return reduced
}

const getSheetAnimation = (centered: boolean, reducedMotion: boolean) => {
  if (reducedMotion) return 'none'

  return centered ? 'fade' : 'slide'
}

/** A controlled sheet with optional keyboard avoidance and an independently scrolling body. */
export const LumenSheet = (props: LumenSheetProps): ReactElement => {
  const theme = useLumenTheme()
  const { width } = useWindowDimensions()
  const reducedMotion = useSheetReducedMotion(props.visible)
  const { actions, children, onDismiss, safeAreaInsets, visible, ...options } = props
  const { avoidKeyboard = false, dismissible = true, keyboardVerticalOffset = 0, presentation = 'sheet', scrollable = true, ...heading } = options
  const centered = presentation === 'adaptive' && width >= 768

  const dismiss = () => {
    if (dismissible) onDismiss()
  }

  return (
    <Modal
      accessibilityLabel={props.accessibilityLabel ?? props.title}
      animationType={getSheetAnimation(centered, reducedMotion)}
      onRequestClose={dismiss}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        accessibilityViewIsModal
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={avoidKeyboard}
        keyboardVerticalOffset={safeInset(keyboardVerticalOffset)}
        style={getSheetContainerStyle(centered, theme.spacing.xl, safeAreaInsets)}
      >
        <Pressable
          accessibilityElementsHidden
          accessible={false}
          aria-hidden
          tabIndex={-1}
          disabled={!dismissible}
          importantForAccessibility="no-hide-descendants"
          onPress={dismiss}
          style={{ backgroundColor: '#00000066', position: 'absolute', inset: 0 }}
        />
        <SheetPanel {...heading} actions={actions} centered={centered} safeAreaInsets={safeAreaInsets}>
          <SheetBody scrollable={scrollable}>{children}</SheetBody>
        </SheetPanel>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export interface LumenMenuItem {
  destructive?: boolean
  disabled?: boolean
  label: string
  onPress: () => void
}

export interface LumenMenuProps {
  accessibilityLabel: string
  items: readonly LumenMenuItem[]
  /** Pass insets from the application's safe-area integration when needed. */
  safeAreaInsets?: LumenSafeAreaInsets
  trigger: ReactNode
}

const menuWidth = 240

/** An anchored action menu with native modal focus containment and labeled item states. */
export const LumenMenu = ({
  accessibilityLabel,
  items,
  safeAreaInsets = emptySafeAreaInsets,
  trigger
}: LumenMenuProps): ReactElement => {
  const theme = useLumenTheme()
  const triggerRef = useRef<ComponentRef<typeof Pressable>>(null)
  const { height: windowHeight, width: windowWidth } = useWindowDimensions()

  const [position, setPosition] = useState<LumenMenuPosition>({
    left: theme.spacing.lg,
    top: theme.spacing.lg
  })

  const [visible, setVisible] = useState(false)

  const open = (): void => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setPosition(resolveLumenMenuPosition({
        anchorHeight: height,
        anchorWidth: width,
        anchorX: x,
        anchorY: y,
        bottomInset: safeInset(safeAreaInsets.bottom),
        itemCount: items.length,
        leftInset: safeInset(safeAreaInsets.left),
        margin: theme.spacing.lg,
        menuWidth,
        rightInset: safeInset(safeAreaInsets.right),
        topInset: safeInset(safeAreaInsets.top),
        windowHeight,
        windowWidth
      }))

      setVisible(true)
    })
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ expanded: visible }}
        onPress={open}
      >
        {trigger}
      </Pressable>
      <Modal
        animationType="fade"
        onRequestClose={() => {
          setVisible(false)
        }}
        transparent
        visible={visible}
      >
        <Pressable
          accessibilityViewIsModal
          onPress={() => {
            setVisible(false)
          }}
          style={{ flex: 1 }}
        >
          <View
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="menu"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              borderRadius: theme.radii.md,
              borderWidth: 1,
              left: position.left,
              padding: theme.spacing.sm,
              position: 'absolute',
              top: position.top,
              width: menuWidth
            }}
          >
            {items.map(item => (
              <Pressable
                key={item.label}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: item.disabled }}
                disabled={item.disabled}
                onPress={() => {
                  setVisible(false)

                  item.onPress()
                }}
                style={({ pressed }): ViewStyle => ({
                  backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
                  borderRadius: theme.radii.sm,
                  minHeight: 44,
                  opacity: item.disabled ? 0.52 : 1,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md
                })}
              >
                <Text
                  style={{
                    color: item.destructive ? theme.colors.danger : theme.colors.ink,
                    fontSize: theme.fontSizes.sm
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

export interface LumenShareButtonProps {
  content: ShareContent
  disabled?: boolean
  label?: string
  onError?: (error: unknown) => void
  onShared?: () => void
  options?: ShareOptions
}

/** A Lumen button that opens the operating system's share sheet. */
export const LumenShareButton = ({
  content,
  disabled = false,
  label = 'Share',
  onError,
  onShared,
  options
}: LumenShareButtonProps): ReactElement => {
  const share = async (): Promise<void> => {
    try {
      const result = await Share.share(content, options)

      if (result.action === Share.sharedAction) onShared?.()
    } catch (error) {
      onError?.(error)
    }
  }

  return (
    <LumenButton
      disabled={disabled}
      intent="secondary"
      onPress={() => {
        void share()
      }}
    >
      {label}
    </LumenButton>
  )
}

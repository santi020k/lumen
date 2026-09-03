import {
  type ComponentRef,
  type ReactElement,
  type ReactNode,
  useRef,
  useState
} from 'react'
import {
  Modal,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  type LumenMenuPosition,
  resolveLumenMenuPosition
} from './overlay-recipes.js'
import { LumenButton } from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenAlertDialogProps {
  cancelLabel?: string
  confirmDisabled?: boolean
  confirmLabel: string
  confirmLoading?: boolean
  destructive?: boolean
  description?: string
  onConfirm: () => void
  onDismiss: () => void
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
  title,
  visible
}: LumenAlertDialogProps): ReactElement => {
  const theme = useLumenTheme()
  const insets = useSafeAreaInsets()

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
          paddingBottom: theme.spacing.xl + insets.bottom,
          paddingLeft: theme.spacing.xl + insets.left,
          paddingRight: theme.spacing.xl + insets.right,
          paddingTop: theme.spacing.xl + insets.top
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
  actions?: ReactNode
  children: ReactNode
  description?: string
  onDismiss: () => void
  scrollable?: boolean
  title?: string
  visible: boolean
}

/** A controlled bottom sheet that preserves native modal focus and dismissal behavior. */
export const LumenSheet = ({
  actions,
  children,
  description,
  onDismiss,
  scrollable = true,
  title,
  visible
}: LumenSheetProps): ReactElement => {
  const theme = useLumenTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal
      animationType="slide"
      onRequestClose={onDismiss}
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onPress={onDismiss}
          style={{ backgroundColor: '#00000066', flex: 1 }}
        />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.line,
            borderTopLeftRadius: theme.radii.lg,
            borderTopRightRadius: theme.radii.lg,
            borderWidth: 1,
            gap: theme.spacing.lg,
            maxHeight: '90%',
            paddingBottom: theme.spacing.xl + insets.bottom,
            paddingLeft: theme.spacing.xl + insets.left,
            paddingRight: theme.spacing.xl + insets.right,
            paddingTop: theme.spacing.xl
          }}
        >
          {title || description ?
            (
              <View style={{ gap: theme.spacing.sm }}>
                {title ?
                  (
                    <Text
                      accessibilityRole="header"
                      style={{
                        color: theme.colors.ink,
                        fontSize: theme.fontSizes.lg,
                        fontWeight: String(theme.fontWeights.semibold) as TextStyle['fontWeight']
                      }}
                    >
                      {title}
                    </Text>
                  ) :
                  null}
                {description ?
                  <Text style={{ color: theme.colors.inkSoft }}>{description}</Text> :
                  null}
              </View>
            ) :
            null}
          {scrollable ?
            (
              <ScrollView
                contentContainerStyle={{ gap: theme.spacing.lg }}
                keyboardShouldPersistTaps="handled"
                style={{ flexGrow: 0, flexShrink: 1 }}
              >
                {children}
              </ScrollView>
            ) :
            <View style={{ flexShrink: 1 }}>{children}</View>}
          {actions ? <View style={{ alignItems: 'flex-end' }}>{actions}</View> : null}
        </View>
      </View>
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
  trigger: ReactNode
}

const menuWidth = 240

/** An anchored action menu with native modal focus containment and labeled item states. */
export const LumenMenu = ({
  accessibilityLabel,
  items,
  trigger
}: LumenMenuProps): ReactElement => {
  const theme = useLumenTheme()
  const insets = useSafeAreaInsets()
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
        bottomInset: insets.bottom,
        itemCount: items.length,
        leftInset: insets.left,
        margin: theme.spacing.lg,
        menuWidth,
        rightInset: insets.right,
        topInset: insets.top,
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

import type { ReactElement } from 'react'
import { StatusBar as NativeStatusBar, type StatusBarStyle as NativeStatusBarStyle } from 'react-native'

/**
 * Expo modules do not run on HarmonyOS. Metro resolves the shared playground's
 * `expo-status-bar` import to this React Native status bar instead.
 */
export type StatusBarStyle = 'auto' | 'dark' | 'inverted' | 'light'

export interface StatusBarProps {
  style?: StatusBarStyle
}

const barStyleByStyle: Record<StatusBarStyle, NativeStatusBarStyle> = {
  auto: 'default',
  dark: 'dark-content',
  inverted: 'default',
  light: 'light-content'
}

export const StatusBar = ({ style = 'auto' }: StatusBarProps): ReactElement => (
  <NativeStatusBar barStyle={barStyleByStyle[style]} />
)

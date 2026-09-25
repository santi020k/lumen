import type { ComponentRef, Ref } from 'react'
import type {
  ActivityIndicator,
  Image,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native'

export type LumenActivityIndicatorRef = Ref<ComponentRef<typeof ActivityIndicator>>
export type LumenImageRef = Ref<ComponentRef<typeof Image>>
export type LumenSwitchRef = Ref<ComponentRef<typeof Switch>>
export type LumenTextInputRef = Ref<ComponentRef<typeof TextInput>>
export type LumenTextRef = Ref<ComponentRef<typeof Text>>
export type LumenViewRef = Ref<ComponentRef<typeof View>>

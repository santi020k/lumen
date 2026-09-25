import type { NativeSyntheticEvent as LumenNativeSyntheticEvent } from 'react-native'

import 'react-native'

declare module 'react-native' {
  interface PressableProps {
    onKeyDown?: (event: LumenNativeSyntheticEvent<{
      code?: string
      key?: string
    }>) => void
  }
}

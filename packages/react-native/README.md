# @santi020k/lumen-react-native

React Native foundations and primitives for Lumen UI. The package exposes canonical light and dark
themes together with native Text, Surface, Button, TextField, Badge, Divider, and Spinner
implementations.

```ts
import {
  LumenButton,
  LumenProvider,
  LumenSurface,
  LumenText
} from '@santi020k/lumen-react-native'

export function App() {
  return (
    <LumenProvider scheme="system">
      <LumenSurface>
        <LumenText variant="title">Welcome</LumenText>
        <LumenButton onPress={() => {}}>Continue</LumenButton>
      </LumenSurface>
    </LumenProvider>
  )
}
```

The package intentionally uses native numeric dimensions and hexadecimal colors instead of CSS
values. Components use native accessibility roles, states, touch targets, and refs without depending
on the DOM or the Lumen web runtime.

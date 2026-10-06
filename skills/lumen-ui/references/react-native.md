# React Native and Expo Setup

Install the package in the existing application:

```bash
pnpm add @santi020k/lumen-react-native
```

Mount one provider near the application root:

```tsx
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

React and React Native are application-provided peers. Do not import web styles or mount the Astro
runtime. Keep navigation and state in the host app. Verify public component props against the
installed package before generating code. Icons accept an application-provided native graphic
component with the documented `color`, `size`, and `strokeWidth` contract.

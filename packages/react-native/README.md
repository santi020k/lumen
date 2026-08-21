# @santi020k/lumen-react-native

React Native foundations and primitives for Lumen UI. The package exposes canonical light and dark
themes together with native Text, Icon, IconButton, Surface, Button, TextField, Badge, Divider,
Spinner, Card, Alert, Progress, and Avatar implementations.

```ts
import {
  LumenButton,
  LumenIconButton,
  LumenProvider,
  LumenSurface,
  LumenText
} from '@santi020k/lumen-react-native'
import { Search } from 'lucide-react-native'

export function App() {
  return (
    <LumenProvider scheme="system">
      <LumenSurface>
        <LumenText variant="title">Welcome</LumenText>
        <LumenButton onPress={() => {}}>Continue</LumenButton>
        <LumenIconButton icon={Search} label="Search" onPress={() => {}} />
      </LumenSurface>
    </LumenProvider>
  )
}
```

The package intentionally uses native numeric dimensions and hexadecimal colors instead of CSS
values. Components use native accessibility roles, states, touch targets, and refs without depending
on the DOM or the Lumen web runtime. `LumenIcon` accepts any graphic component with `color`, `size`,
and `strokeWidth` props; Lucide React Native components work directly. Standalone icons are
decorative unless given a label, while every `LumenIconButton` requires an accessible label.

See the [native component reference](../../docs/native-components.md) for the complete API matrix,
state contracts, image-source mapping, and accessibility requirements.

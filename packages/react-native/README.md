# @santi020k/lumen-react-native

> **Beta:** This package is ready for testing and early production adoption. Its public API may
> evolve as it is validated in real applications; review release notes when upgrading.

React Native foundations and primitives for Lumen UI. The package exposes canonical light and dark
themes together with native Text, Icon, IconButton, Surface, Button, ButtonGroup, TextField,
Textarea, FieldGroup, Badge, Chip, Divider, Spinner, Card, Alert, Toast, Progress, Avatar, Toggle,
SettingsRow, SearchField, Checkbox, RadioGroup, SegmentedControl, Skeleton, and Disclosure implementations.
The structured tier also includes EmptyState, ListRow, Banner, Stat, SectionHeader, and StatusBar
for common product layouts without giving up native composition.

Install the package in an existing Expo or React Native application:

```bash
pnpm add @santi020k/lumen-react-native
# or: npm install @santi020k/lumen-react-native
```

React 19.2 and React Native 0.86.2 or newer are application-provided peer dependencies. Mount one
`LumenProvider` near the application root; no stylesheet or web runtime is required:

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

Start the application with its normal Expo or React Native command:

```bash
npx expo start
# or: npx react-native start
```

The package intentionally uses native numeric dimensions and hexadecimal colors instead of CSS
values. Components use native accessibility roles, states, touch targets, and refs without depending
on the DOM or the Lumen web runtime. `LumenIcon` accepts any graphic component with `color`, `size`,
and `strokeWidth` props; Lucide React Native components work directly. Standalone icons are
decorative unless given a label, while every `LumenIconButton` requires an accessible label.

See the [native component reference](../../docs/native-components.md) for the complete API matrix,
state contracts, image-source mapping, and accessibility requirements.
See the [native compatibility matrix](../../docs/native-compatibility.md) for React and React Native
baselines, and use the [native device validation matrix](../../docs/native-device-validation.md) for
VoiceOver and TalkBack evidence.

# Framework Contracts

Read only the section for the app's target.

## Astro

Install and load styles once:

```bash
pnpm add @santi020k/lumen-astro
```

```astro
---
import { Button, Card, Field, Input, Label } from '@santi020k/lumen-astro'
import UIPrimitives from '@santi020k/lumen-astro/runtime'
import '@santi020k/lumen-astro/styles.css'
---

<UIPrimitives />

<Card>
  <Field>
    <Label for="email">Email</Label>
    <Input id="email" name="email" type="email" required />
  </Field>
  <Button type="submit">Continue</Button>
</Card>
```

Mount `UIPrimitives` once in the root layout when the app uses enhanced interactions. Do not place
it beside every primitive. Use public `data-ui-*` attributes documented by the selected component
for triggers and relationships. `CodeTabs` receives its persistence and synchronized keyboard
behavior from this single runtime instance.

## React

Install and load styles once from the app entry or global stylesheet:

```bash
pnpm add @santi020k/lumen-react
```

```tsx
import '@santi020k/lumen-react/styles.css'
import { Button, Card, Field, Input, Label } from '@santi020k/lumen-react'

export function SignInForm() {
  return (
    <Card>
      <Field>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </Field>
      <Button type="submit">Continue</Button>
    </Card>
  )
}
```

Use Lumen's behavior hooks for interactive contracts instead of mounting Astro's progressive
enhancement runtime. Available hooks include behavior for dialogs, popovers, dropdown menus, tabs,
selects, tooltips, toasts, calendars, forms, data views, editors, schedules, resizable panes, and
other behavior-heavy primitives. `CodeTabs` owns its React state, copy controls, persistence, and
cross-instance synchronization. Inspect the current package exports before selecting a hook.

## Web Components

Install, load styles, and register once:

```bash
pnpm add @santi020k/lumen-elements
```

```html
<script type="module">
  import '@santi020k/lumen-elements/styles.css'
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <lumen-label id="email-label">Email</lumen-label>
  <lumen-input aria-labelledby="email-label" id="email" name="email" type="email" required></lumen-input>
  <lumen-button type="submit">Continue</lumen-button>
</lumen-card>
```

In a bundled app, prefer importing `@santi020k/lumen-elements/styles.css` from the global CSS or
entry module instead of writing a literal package path in HTML. Registered elements provide the
matching behavior layer; do not add a parallel interaction library for the same primitive.

### Elements labels and dialogs

`lumen-input` owns an internal native control. Name that control using `aria-labelledby` pointing
at a visible label, or `aria-label` on the host. A native label's `for` pointing only at the custom
host does not name the internal input. Use the public `lumen-label` for visible label styling.
Do not type a custom host as `HTMLInputElement` or `HTMLButtonElement`; use its exported element
class and runtime narrowing when accessing element-specific methods.

Use `lumen-dialog` as the behavior owner. Its public methods are `show(trigger?)` and `close()`,
not `showModal()` on the custom host. A native `dialog` child is its documented modal contract:

```html
<lumen-button data-ui-dialog-trigger="profile-dialog">Edit profile</lumen-button>
<lumen-dialog id="profile-dialog">
  <dialog aria-labelledby="profile-title">
    <h2 id="profile-title">Profile settings</h2>
    <lumen-field>
      <lumen-label id="profile-name-label">Display name</lumen-label>
      <lumen-input aria-labelledby="profile-name-label" value="Ada"></lumen-input>
    </lumen-field>
    <lumen-button data-ui-dialog-close type="button">Cancel</lumen-button>
  </dialog>
</lumen-dialog>
```

Register `Button`, `Dialog`, `Field`, `Input`, and `Label` through `defineLumenElements` before use.
The dialog behavior focuses its first focusable control, handles Escape, traps focus, and returns
focus to its trigger. Keep draft state in the form control or application; closing does not reset it.
Do not replace this behavior with a parallel native-dialog controller.

## React Native and Expo

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

## SwiftUI

Add `https://github.com/santi020k/lumen` with Swift Package Manager, use the `main` branch, and
link the `LumenUI` product to the application target. Then import and theme near the root:

```swift
import LumenUI

struct AppRoot: View {
    var body: some View {
        LumenSurface {
            LumenText("Welcome", variant: .title)
            LumenButton("Continue", action: continueFlow)
        }
        .lumenTheme(.light)
    }
}
```

Preserve SwiftUI navigation, bindings, environment values, Dynamic Type, VoiceOver, and SF Symbols.
Do not reproduce DOM props or CSS concepts. Confirm whether a component is shared across Apple
platforms or limited to macOS before using it.

## Jetpack Compose

Until a remote Maven release is available, include `packages/compose` from a Lumen checkout or Git
submodule and add `implementation(project(":lumen-compose"))` to the app module. Wrap content in
the native theme:

```kotlin
import com.santi020k.lumen.LumenTheme

LumenTheme {
    LumenSurface {
        LumenText("Welcome", variant = LumenTextVariant.Title)
        LumenButton(onClick = ::continueFlow) {
            Text("Continue")
        }
    }
}
```

Preserve Compose state, navigation, focus, Material 3 conventions, TalkBack semantics, and native
`ImageVector` icons. Do not translate web markup or CSS APIs into Compose.

## Shared Rules

- Use direct named imports from the selected framework package.
- Install `@santi020k/lumen` separately only for the framework-neutral registry or CLI.
- Keep Tailwind optional. When present, import Lumen alongside Tailwind in the shared CSS entry.
- Use native attributes such as `required`, `type`, `min`, `max`, `pattern`, `aria-*`, and `data-*`
  where the component contract permits them.
- Keep state in the host framework or app. Lumen supplies primitives and behavior contracts, not
  product-specific data architecture.

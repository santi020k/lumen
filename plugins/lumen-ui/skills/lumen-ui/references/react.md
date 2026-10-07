# React Setup

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

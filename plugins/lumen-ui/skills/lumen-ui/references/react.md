# React Setup

This example targets Lumen 5. Install the runtime adapter, then load the shared foundation once
and the styles for each rendered component. V4 consumers retain their existing full stylesheet.

```bash
pnpm add @santi020k/lumen-react
# Optional CLI for editable recipes and diagnostics
pnpm add -D @santi020k/lumen
```

```tsx
import '@santi020k/lumen-react/styles/foundation.css'
import '@santi020k/lumen-react/styles/components/button.css'
import { Button } from '@santi020k/lumen-react/components/button'

export function SaveAction() {
  return <Button type="submit">Save</Button>
}
```

Use only exported component entries; some components still need a root import. Include CSS for
conditional content and compound children. Full styles.css remains supported as an alternative.
Root imports or catalog fallbacks do not prove selective JavaScript delivery; measure the consumer.

Use Lumen's behavior hooks for interactive contracts instead of mounting Astro's progressive
enhancement runtime. Available hooks include behavior for dialogs, popovers, dropdown menus, tabs,
selects, tooltips, toasts, calendars, forms, data views, editors, schedules, resizable panes, and
other behavior-heavy primitives. `CodeTabs` owns its React state, copy controls, persistence, and
cross-instance synchronization. Inspect the current package exports before selecting a hook.

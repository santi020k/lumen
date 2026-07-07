# @santi020k/lumen-react

React primitives for Lumen UI.

This package provides React components for the shared Lumen primitive catalog using the standalone
Lumen stylesheet.

## Install

```bash
pnpm add @santi020k/lumen-react @santi020k/lumen-astro
```

Load the shared stylesheet once from your app entry or global CSS.

```tsx
import '@santi020k/lumen-astro/styles.css'
```

## Usage

```tsx
import { Button, Card, Input } from '@santi020k/lumen-react'

export function SubscribeForm() {
  return (
    <Card>
      <label htmlFor="email">Email</label>
      <Input id="email" type="email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </Card>
  )
}
```

Use `Icon` for Lucide icons by name across framework adapters.

```tsx
import { Button, Icon } from '@santi020k/lumen-react'

export function SettingsButton() {
  return (
    <Button variant="secondary">
      <Icon name="wand-sparkles" decorative />
      Generate
    </Button>
  )
}
```

React is Lumen's visual adapter layer plus headless behavior hooks. The components emit the same
`ui-*` classes and `data-ui-*` attributes as Astro, while hooks such as `useDialog`, `usePopover`,
`useDropdownMenu`, `useContextMenu`, `useTabs`, `useSelect`, `useFormValidation`, `useCalendar`,
`useInputOTP`, `useDateRangePicker`, `useRichTextEditor`, `useSchedule`, `useThemeBuilder`,
`useResizable`, `useToast`, and
`useTooltip` track the Astro runtime's ARIA, keyboard, Escape, dismissal, context menu, form
validation, calendar grids, OTP segmentation, date range syncing, rich text command, schedule
drag/drop, theme export, resizable pane sizing, and toast controller semantics for React
applications.
`DataTable` can render structured `columns` and `rows` with the same selectable/sortable data
attributes, and `VirtualList` exposes the shared range sizing attributes for app-level adapters.

## Glass surfaces

Load `@santi020k/lumen-astro/styles.css` once in your app, then use the shared glass API from React.

```tsx
<Card glass>Glass card</Card>
<Dialog glass>Glass dialog</Dialog>
<Popover glass>Glass popover</Popover>
```

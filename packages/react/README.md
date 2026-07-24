# @santi020k/lumen-react

React primitives for Lumen UI.

This package provides React components for the shared Lumen primitive catalog using the standalone
Lumen stylesheet.

## Install

```bash
pnpm add @santi020k/lumen-react
```

Load the shared stylesheet once from your app entry or global CSS.

```tsx
import '@santi020k/lumen-react/styles.css'
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

## Optimized images

The React `Image` uses a lazy native `img` by default. In Next.js, pass `next/image` through `as` so
Next keeps control of image sizing, format negotiation, caching, placeholders, and preloading while
Lumen supplies its presentation class.

```tsx
import NextImage from 'next/image'
import { Image as LumenImage } from '@santi020k/lumen-react'

<LumenImage
  alt="Team collaborating around a table"
  as={NextImage}
  height={800}
  sizes="(max-width: 768px) 100vw, 50vw"
  src="/team.jpg"
  width={1200}
/>
```

Keep the default lazy loading for images below the fold. For the single likely LCP image, follow
your framework's preload or fetch-priority guidance. `invertOnDark` is available for monochrome
artwork authored for light surfaces; leave it off for photos and colorful illustrations.

`AnimatedLogo` accepts your own inline SVG rather than imposing brand artwork. Put the accessible
name on the SVG itself.

```tsx
import { AnimatedLogo } from '@santi020k/lumen-react'

<AnimatedLogo style={{ height: '3rem' }}>
  <svg aria-label="Acme" role="img" viewBox="0 0 120 32">
    {/* Your logo artwork */}
  </svg>
</AnimatedLogo>
```

For a choreographed logo, set `animation="sequence"` and mark individual SVG layers with
`data-ui-logo-pop`, `data-ui-logo-draw`, or `data-ui-logo-reveal`. Timing can be adjusted per layer
with `--ui-logo-delay`.

React is Lumen's visual adapter layer plus headless behavior hooks. The components emit the same
`ui-*` classes and `data-ui-*` attributes as Astro, while hooks such as `useDialog`, `usePopover`,
`useDropdownMenu`, `useContextMenu`, `useTabs`, `useSelect`, `useFormValidation`, `useCalendar`,
`useInputOTP`, `useDateRangePicker`, `useRichTextEditor`, `useSchedule`, `useThemeBuilder`,
`useResizable`, `useToast`, and
`useTooltip` track the Astro runtime's ARIA, keyboard, Escape, dismissal, context menu, form
validation, calendar grids, OTP segmentation, date range syncing, rich text command, schedule
drag/drop, theme export, resizable pane sizing, and toast controller semantics for React
applications.
`useRichTextEditor` also provides `getEditableProps`, value-bearing commands, common formatting
shortcuts, active toolbar state, and `{ html, text }` change details.
`DataTable` can render structured `columns` and `rows` with the same selectable/sortable data
attributes, and `VirtualList` exposes the shared range sizing attributes for app-level adapters.

## Glass surfaces

Load `@santi020k/lumen-react/styles.css` once in your app, then use the shared glass API from React.

```tsx
<Card glass>Glass card</Card>
<Dialog glass>Glass dialog</Dialog>
<Popover glass>Glass popover</Popover>
<DatePicker glass="subtle" />
<Select glass="strong" options={['Astro', 'React']} />
```

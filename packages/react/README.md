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

React components emit the same `ui-*` classes and `data-ui-*` attributes as the Astro primitives.
Astro remains the reference package for the bundled progressive-enhancement runtime; wire equivalent
client behavior in your React app for behavior-heavy primitives such as dialogs, menus, tabs, and
toasts.

## Glass surfaces

Load `@santi020k/lumen-astro/styles.css` once in your app, then use the shared glass API from React.

```tsx
<Card glass>Glass card</Card>
<Dialog glass>Glass dialog</Dialog>
<Popover glass>Glass popover</Popover>
```

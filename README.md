# Lumen

Lumen is a multi-framework primitive UI system from Santiago Molina.

The Astro package is the primary implementation: install it, import one standalone CSS file, and
mount one optional progressive-enhancement runtime for interactive primitives. Consumers do not need
Tailwind configuration for Lumen components to render.

The monorepo layers framework adapters around a shared core:

- `@santi020k/lumen` - umbrella package and package map
- `@santi020k/lumen-core` - tokens, component metadata, class composition, and shared behavior helpers
- `@santi020k/lumen-astro` - Astro components, CSS, and progressive-enhancement runtime
- `@santi020k/lumen-react` - React components
- `@santi020k/lumen-elements` - standards-based Web Components
- `apps/docs` - Astro documentation and demo site

## Quick Start

```bash
pnpm add @santi020k/lumen-astro
```

```astro
---
import { Button, Card, Input } from '@santi020k/lumen-astro'
import '@santi020k/lumen-astro/styles.css'
---

<Card>
  <label for="email">Email</label>
  <Input id="email" type="email" placeholder="you@example.com" />
  <Button>Subscribe</Button>
</Card>
```

## Development

```bash
pnpm install
pnpm run dev
pnpm run validate
```

## Package Strategy

The `@santi020k/` scope keeps the project aligned with the existing package family while the API stabilizes. If Lumen grows beyond personal projects, the package graph can later move to a dedicated `@lumen-ui/*` scope without changing the internal architecture.

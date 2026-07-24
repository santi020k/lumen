# Lumen

Lumen is a multi-framework primitive UI system from Santiago Molina. Install the package for your
framework; it includes the shared Lumen foundation and standalone stylesheet. Consumers do not
need Tailwind configuration for Lumen components to render.

The monorepo layers framework adapters around a shared core:

- `@santi020k/lumen` - shared stylesheet, CLI, registry metadata, and package map
- `@santi020k/lumen-core` - tokens, component metadata, class composition, and shared behavior helpers
- `@santi020k/lumen-astro` - Astro components and progressive-enhancement runtime
- `@santi020k/lumen-react` - React components
- `@santi020k/lumen-elements` - standards-based Web Components
- `@santi020k/lumen-mcp` - Model Context Protocol server for AI agents
- `apps/docs` - Astro documentation and demo site

## Quick Start

Choose one package for your framework:

```bash
# Astro
pnpm add @santi020k/lumen-astro

# React
pnpm add @santi020k/lumen-react

# Web Components
pnpm add @santi020k/lumen-elements
```

Import the stylesheet from the same framework package once in your global CSS file, root layout,
or app entry. For example:

```css
@import "@santi020k/lumen-react/styles.css";
```

With Tailwind, keep it in the same shared CSS entry:

```css
@import "@santi020k/lumen-react/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen-react/styles.css";
```

The layer-order prelude lets Tailwind base styles run before Lumen components and keeps Tailwind
utilities—including responsive `hidden` and display utilities—above Lumen component defaults.

For interactive Astro primitives, mount `UIPrimitives` once in your root layout:

```astro
---
import { Button, Card, Input } from '@santi020k/lumen-astro'
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

## Migration

If you are replacing an older internal design system or duplicated UI primitives, refer to the [Migration Guide](docs/migrating-to-lumen.md) for instructions on adopting Lumen incrementally and mapping existing tokens.

## Agent and Registry Surfaces

Install the portable Lumen Agent Skill in Codex, Claude Code, Cursor, Windsurf, and other compatible
AI coding tools:

```bash
npx skills add santi020k/lumen --skill lumen-ui
```

The canonical skill lives in [skills/lumen-ui](skills/lumen-ui). It teaches agents how to select,
compose, theme, and verify Lumen primitives while preserving the app's framework and architecture.
Pair it with [`@santi020k/lumen-mcp`](packages/mcp/README.md) when the agent should search the live
catalog and retrieve current component source, props, tokens, and rules.

Lumen also includes [llms.txt](llms.txt), [docs/ai-usage.md](docs/ai-usage.md), and
[registry/lumen.registry.json](registry/lumen.registry.json) so app generators can discover the
component catalog, setup rules, recipes, and installable file groups. The current roadmap lives in
[docs/feature-roadmap.md](docs/feature-roadmap.md).

Figma handoff guidance lives in [docs/figma.md](docs/figma.md), including theme token exports for
Figma variables and the Code Connect path for the
[published Lumen UI Library](https://www.figma.com/community/file/1662337342676541513).
[Image performance guidance](docs/image-performance.md) explains how to retain Astro, Next.js,
other framework, CMS, and CDN optimizers while applying Lumen presentation.

The umbrella package also exposes `@santi020k/lumen/registry` and a small `lumen` command for
listing recipes, showing recipe contents, printing install commands, loading alternate registry
manifests, and adding starter recipe files with conflict-safe defaults. Use `--merge` to merge
incoming recipe files with existing files, `--fail-on-conflict` for CI, or `--registry-token` /
`LUMEN_REGISTRY_TOKEN` for private remote registries.

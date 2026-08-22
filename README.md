<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="./apps/docs/public/logo.svg" alt="Lumen UI" width="239" height="60">
  </a>
</p>

<h1 align="center">Lumen UI</h1>

<p align="center">
  A cross-platform UI system with 150+ web primitives and shared native foundations.
</p>

<p align="center">
  <a href="https://lumen.santi020k.com">Documentation</a>
  ·
  <a href="https://lumen.santi020k.com/docs/components">Components</a>
  ·
  <a href="https://www.figma.com/community/file/1662337342676541513">Figma library</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/actions"><img alt="GitHub Actions" src="https://img.shields.io/github/actions/workflow/status/santi020k/lumen/ci.yml?branch=main&style=flat-square"></a>
  <a href="https://www.npmjs.com/package/@santi020k/lumen-astro"><img alt="npm version" src="https://img.shields.io/npm/v/@santi020k/lumen-astro?style=flat-square&label=npm"></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square"></a>
</p>

Lumen gives applications a consistent visual language without tying them to one rendering model.
Its packages share tokens, component contracts, styles, and interaction patterns while keeping each
framework and platform's native authoring experience.

- **Framework native:** Astro components, React primitives, and standards-based custom elements.
- **Native foundations:** generated React Native, SwiftUI, and Jetpack Compose tokens preserve the
  same semantic roles without introducing DOM or CSS assumptions.
- **Accessible by default:** semantic markup, keyboard paths, focus management, and reduced-motion
  support are built into the primitives.
- **Standalone CSS:** no Tailwind configuration is required. Tailwind users get an explicit layer
  integration.
- **Progressively enhanced:** Astro interactions use a small client runtime instead of requiring an
  application framework.
- **Ready for design and AI workflows:** published Figma resources, a portable agent skill, an MCP
  server, `llms.txt`, and a machine-readable registry ship alongside the component system.
- **Product-ready templates:** five responsive dashboard and application families are available as
  live previews and installable Astro, React, and Elements recipes.

## Dashboards and templates

Explore the [template gallery](https://lumen.santi020k.com/templates) for complete analytics,
SaaS admin, commerce, project workspace, and authentication/onboarding experiences. Each family
uses public Lumen primitives and semantic tokens, includes responsive and accessibility coverage,
and ships through the CLI for all three framework targets:

```bash
lumen add analytics-dashboard
lumen add commerce-dashboard --target react
lumen add auth-onboarding --target elements
```

## Web quick start

Install the package for your framework:

```bash
# Astro
pnpm add @santi020k/lumen-astro

# React
pnpm add @santi020k/lumen-react

# Web Components
pnpm add @santi020k/lumen-elements
```

### Astro

Import the stylesheet and mount `UIPrimitives` once in your root layout. The runtime enhances all
interactive Lumen markup on the page.

```astro
---
import '@santi020k/lumen-astro/styles.css'
import { UIPrimitives } from '@santi020k/lumen-astro'
---

<html lang="en">
  <body>
    <slot />
    <UIPrimitives />
  </body>
</html>
```

```astro
---
import { Button, Card, Input } from '@santi020k/lumen-astro'
---

<Card>
  <label for="email">Email</label>
  <Input id="email" name="email" type="email" placeholder="you@example.com" />
  <Button>Subscribe</Button>
</Card>
```

### React

Load the stylesheet once from your app entry or global CSS:

```tsx
import '@santi020k/lumen-react/styles.css'
import { Button, Card, Input } from '@santi020k/lumen-react'

export function SubscribeForm() {
  return (
    <Card>
      <label htmlFor="email">Email</label>
      <Input id="email" name="email" type="email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </Card>
  )
}
```

### Web Components

Import the styles and register the elements once:

```html
<style>
  @import "@santi020k/lumen-elements/styles.css";
</style>

<script type="module">
  import { defineLumenElements } from '@santi020k/lumen-elements/define'

  defineLumenElements()
</script>

<lumen-card>
  <label for="email">Email</label>
  <lumen-input id="email" name="email" type="email" placeholder="you@example.com"></lumen-input>
  <lumen-button>Subscribe</lumen-button>
</lumen-card>
```

See the [Web documentation](https://lumen.santi020k.com/docs/web) for installation, theming,
component examples, and API details.

For native applications, choose the [React Native](https://lumen.santi020k.com/docs/react-native),
[Apple / SwiftUI](https://lumen.santi020k.com/docs/apple), or
[Android / Compose](https://lumen.santi020k.com/docs/android) guide. The
[shared foundations](https://lumen.santi020k.com/docs/foundations) explain the cross-platform token
and component contract; repository contributors can also use the
[cross-platform architecture](./docs/cross-platform.md) and
[native component reference](./docs/native-components.md).

> **Native platform status: Beta.** The shared token foundation is stable, while the React Native,
> SwiftUI, and Compose component APIs are being validated through real applications and may evolve.
> Review release notes when upgrading and share platform-specific feedback.

## Native playgrounds

The repository includes three searchable, interactive galleries built from the real native
packages:

- [`apps/playground-react-native`](./apps/playground-react-native) runs through Expo on the web,
  iOS, and Android and includes EAS profiles for TestFlight, Android App Bundles, and APKs.
- [`apps/playground-apple`](./apps/playground-apple) builds as an iOS Xcode app for devices and
  TestFlight, or as a macOS Swift Package executable for local exploration.
- [`apps/playground-android`](./apps/playground-android) builds a native Compose application and a
  directly installable debug APK.

See the [playground workflow](./docs/playgrounds.md) for run, capture, and distribution commands.

## Tailwind CSS

Keep the layer prelude, Tailwind import, and Lumen stylesheet in the same shared CSS entry. Replace
`lumen-astro` with the package for your framework.

```css
@import "@santi020k/lumen-astro/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles.css";
```

This order places Tailwind base styles before Lumen components and Tailwind utilities above Lumen
component defaults.

## Packages

| Package | Purpose |
| --- | --- |
| [`@santi020k/lumen-astro`](./packages/astro) | Reference implementation, Astro components, and progressive-enhancement runtime |
| [`@santi020k/lumen-react`](./packages/react) | React components and behavior hooks |
| [`@santi020k/lumen-react-hook-form`](./packages/react-hook-form) | Optional React Hook Form adapters for composite controls |
| [`@santi020k/lumen-elements`](./packages/elements) | Standards-based Web Components |
| [`@santi020k/lumen-core`](./packages/core) | Shared tokens, metadata, class helpers, and behavior contracts |
| [`@santi020k/lumen-tokens`](./packages/tokens) | Canonical platform-neutral design token source |
| [`@santi020k/lumen-react-native`](./packages/react-native) | React Native foundations and native primitives |
| [`LumenUI`](./packages/swift) | Swift Package for SwiftUI foundations and native primitives |
| [`lumen-compose`](./packages/compose) | Android library for Jetpack Compose foundations and native primitives |
| [`@santi020k/lumen-icons-brand`](./packages/icons-brand) | Optional namespaced brand icons for the shared `Icon` API |
| [`@santi020k/lumen`](./packages/lumen) | Umbrella package, CLI, registry metadata, and public package map |
| [`@santi020k/lumen-mcp`](./packages/mcp) | MCP server for component discovery and source retrieval |

## AI and design workflows

Install the portable Lumen skill in Codex, Claude Code, Cursor, Windsurf, and other compatible
coding agents:

```bash
npx skills add santi020k/lumen --skill lumen-ui
```

The skill teaches agents how to select, compose, theme, and verify Lumen primitives. Pair it with
[`@santi020k/lumen-mcp`](./packages/mcp) when an agent needs to search the live catalog or retrieve
current source, props, tokens, and usage rules.

Additional machine-readable surfaces include:

- [`llms.txt`](./llms.txt) for a concise project map.
- [`docs/ai-usage.md`](./docs/ai-usage.md) for downstream generation examples.
- [`docs/styling-contract.md`](./docs/styling-contract.md) for stable parts and component variables.
- [`docs/import-and-icon-performance.md`](./docs/import-and-icon-performance.md) for repeatable import and icon evidence.
- [`docs/consumer-regression-fixtures.md`](./docs/consumer-regression-fixtures.md) for production-shaped local coverage.
- [`docs/project-adoption.md`](./docs/project-adoption.md) for the sibling-project audit and staged
  web and native migration strategy.
- [`registry/lumen.registry.json`](./registry/lumen.registry.json) for recipes and installable file
  groups.
- [`docs/figma.md`](./docs/figma.md) for Figma variables and Code Connect workflows.
- [`docs/cross-platform.md`](./docs/cross-platform.md) for the native architecture, support tiers,
  and component-parity policy.

## Contributing

Lumen is a pnpm workspace. Astro is the reference implementation; shared contracts belong in
`packages/core`, while framework-specific behavior stays in its adapter package.

```bash
pnpm install
pnpm run dev
pnpm run validate
```

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request. User-visible package
changes require a changeset.

## License

Lumen is available under the [MIT License](./LICENSE).

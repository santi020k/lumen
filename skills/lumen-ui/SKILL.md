---
name: lumen-ui
description: Build, restyle, review, or migrate product interfaces with Lumen UI for Astro, React, Web Components, React Native, SwiftUI, or Jetpack Compose. Use when a request mentions Lumen UI, Lumen packages or tokens, or asks an AI agent to create an accessible interface that should use Lumen instead of inventing primitives.
---

# Lumen UI

Build interfaces from Lumen's real component contracts, semantic tokens, and framework adapters.
Treat Astro as the reference surface, while following the user's existing stack.

## Workflow

1. Inspect the app before editing. Identify the framework, package manager, global style entry,
   existing Lumen packages, theme overrides, and local component conventions.
2. Choose the matching target:
   - Astro: `@santi020k/lumen-astro`
   - React: `@santi020k/lumen-react`
   - Web Components or framework-neutral HTML: `@santi020k/lumen-elements`
   - React Native or Expo: `@santi020k/lumen-react-native`
   - SwiftUI or Apple platforms: `LumenUI`
   - Jetpack Compose or Android: `lumen-compose`
3. Retrieve current contracts before guessing:
   - For Astro, React, and Elements, prefer connected Lumen MCP tools: read snapshot metadata and diagnostics, read agent rules,
     search with the target framework, then read the selected component's usage contract and tokens.
     Retain the catalog manifest when the client supports caching so a later catalog diff identifies
     only the contracts that changed.
   - For native targets, prefer `lumen_list_native_components` and `lumen_get_native_component`,
     then verify installed adapter source/types when the local package version may differ.
   - Otherwise inspect installed package types/source or use the Lumen CLI and online docs.
   - Never invent a component, prop, variant, event, or import path from memory.
4. Plan the interface as product structure and states, then map each part to the smallest suitable
   Lumen primitive. Read [references/component-selection.md](references/component-selection.md)
   when choosing components or composing a full screen.
5. Read [references/frameworks.md](references/frameworks.md) for setup and runtime rules for the
   selected target.
6. Implement with Lumen components and platform-native semantics. Import a stylesheet once only for
   web targets. Preserve the app's state, navigation, data, and domain logic.
7. Customize through Lumen tokens and public props. Read
   [references/design-system.md](references/design-system.md) when theming, polishing, or reviewing
   visual quality.
8. Verify the edited surface with the narrowest relevant typecheck, test, lint, and visual or
   browser check available in the project.

## Non-negotiable Rules

- Prefer existing Lumen primitives over hand-built replacements.
- Prefer Astro only for a new project with no requested framework; do not migrate an existing app
  merely because Astro is the reference implementation.
- Load the matching package stylesheet once at the app boundary for web targets; native adapters do
  not use CSS.
- Mount `UIPrimitives` once in an Astro root layout when interactive primitives are present.
- Use React behavior hooks for behavior-heavy React primitives; do not mount the Astro runtime.
- Register Lumen custom elements once before using `lumen-*` elements.
- Use `CodeTabs` for related commands, languages, or configuration examples instead of building a
  parallel tab controller.
- Use accessible names, native semantics, visible focus, keyboard paths, and meaningful empty,
  loading, error, success, disabled, and destructive states.
- Use Lucide names through web Lumen `Icon`; React Native accepts application-provided native icon
  components, SwiftUI uses SF Symbols, and Compose accepts `ImageVector`. Do not substitute emoji
  for interface icons.
- Use only the public semantic color vocabulary. Do not hardcode a second palette into component
  markup.
- Keep glass surfaces selective and legible. Decorative styling must not obscure behavior.
- Do not replace working app architecture or add dependencies unrelated to the requested interface.

## Discovery Without MCP

If Lumen is installed, inspect its exported types and package README. For the catalog, otherwise use:

```bash
pnpm exec lumen list
pnpm exec lumen show Button
```

Use the project's package-manager equivalent of `lumen show <name>` before relying on an unfamiliar
web component. Component names also accept kebab-case aliases such as `data-table`. For a native
component, use the MCP native list/get tools or inspect the matching adapter and documentation. If the CLI is
not installed, use the public documentation or GitHub source below.

Current public documentation:

- `https://lumen.santi020k.com/docs`
- `https://lumen.santi020k.com/docs/components`
- `https://github.com/santi020k/lumen/blob/main/docs/ai-usage.md`

## Completion Check

Before handing off, confirm that the chosen components and props exist, imports match the target,
required providers or themes occur once, semantic tokens replace ad hoc colors, and the primary
interaction works with the target's keyboard, focus, touch, pointer, and assistive-technology paths.

---
name: lumen-ui
description: Build or restyle product interfaces with Lumen UI for Astro, React, Web Components, React Native, SwiftUI, or Jetpack Compose. Use for implementation requests using Lumen packages, components, or tokens, including accessible interfaces composed from Lumen primitives. Use lumen-review for requested audits and lumen-migrate for version upgrades.
---

# Lumen UI

Build interfaces from Lumen's real component contracts, semantic tokens, and framework adapters.
Treat Astro as the reference surface, while following the user's existing stack.

## Workflow

1. Inspect the app before editing. Identify the framework, package manager, global style entry,
   resolved installed Lumen versions, theme overrides, and local component conventions.
2. Choose the matching target:
   - Astro: `@santi020k/lumen-astro`
   - React: `@santi020k/lumen-react`
   - Web Components or framework-neutral HTML: `@santi020k/lumen-elements`
   - React Native or Expo: `@santi020k/lumen-react-native`
   - SwiftUI or Apple platforms: `LumenUI`
   - Jetpack Compose or Android: `lumen-compose`
3. Retrieve current contracts before guessing:
   - Start discovery with `limit: 5` and the requested `framework` or native `platform`. Add
     `kind: "component"` or `kind: "native-component"` when choosing primitives; use
     `kind: "recipe"` for a complete composition. Widen the search only when those results do not
     cover the requirement. Read `detail: "usage"` for the selected contracts; request source only
     to resolve a specific missing detail. Reuse retrieved contracts within the same matching
     catalog version instead of listing the full catalog for every component.
   - For Astro, React, and Elements, when Lumen MCP is connected, read snapshot metadata and diagnostics, read agent rules,
     compare resolved installed versions with `lumen_check_compatibility`, search with the target framework, then read the selected component's usage contract and tokens.
     Retain the catalog manifest when the client supports caching so a later catalog diff identifies
     only the contracts that changed.
   - For native targets, prefer `lumen_list_native_components` and `lumen_get_native_component`,
     then verify installed adapter source/types when the local package version may differ.
   - Otherwise inspect installed package types/source or use the Lumen CLI and online docs.
   - On a version mismatch, use a matching published MCP version or installed public types and package documentation. Do not apply a newer catalog as the installed API or silently upgrade the app.
   - For a requested upgrade, use the `lumen-migrate` workflow; for a requested audit, use `lumen-review`. Ordinary UI changes retain their requested scope.
   - Never invent a component, prop, variant, event, or import path from memory.
4. Plan the interface as product structure and states, then map each part to the smallest suitable
   Lumen primitive. Read [references/component-selection.md](references/component-selection.md)
   when choosing components or composing a full screen.
   For charts or analytics, read [references/data-visualization.md](references/data-visualization.md)
   to choose the encoding and verify its data and accessibility contract.
5. Read only the matching setup and runtime reference:
   [Astro](references/astro.md), [React](references/react.md),
   [Elements](references/elements.md), [React Native / Expo](references/react-native.md),
   [SwiftUI](references/swiftui.md), or [Compose](references/compose.md).
   Keep Tailwind optional, use public named imports, and retain state in the host application.
6. Implement with Lumen components and platform-native semantics. Import a stylesheet once only for
   web targets. Preserve the app's state, navigation, data, and domain logic.
7. Customize through Lumen tokens and public props. Read
   [references/design-system.md](references/design-system.md) when theming, polishing, or reviewing
   visual quality.
8. Verify the edited surface with the project's relevant typecheck, tests, zero-warning lint,
   and build. Read [references/verification.md](references/verification.md) for interaction
   and rendered checks; apply only the checks relevant to the changed behavior.

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

# @santi020k/lumen-core

## 2.0.0

### Major Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Finalize the Lumen 2 breaking contracts: import the Astro runtime from its dedicated subpath,
  replace the deprecated Sonner viewport name with ToastViewport, reserve native `size` for numeric
  form-control sizing, and move React Native date fields to the optional `datetime` subpath. The v2
  migrator automates the supported source changes, while the Swift surface enums gain the reviewed
  larger semantic roles.

## 1.8.0

### Patch Changes

- [#51](https://github.com/santi020k/lumen/pull/51) [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082) Thanks [@santi020k](https://github.com/santi020k)! - Fix `normalizeLumenCode` (used by `tokenizeLumenCode`, `renderLumenCodeHtml`, and the `Code`
  component's highlighting fallback) so it no longer throws `RangeError: Maximum call stack size
  exceeded` on very large code blocks. It computed the shared indentation with
  `Math.min(...indentation)`, which spreads one argument per line and overflows the call stack past
  roughly 100,000 lines; it now finds the minimum with a linear scan and also trims leading/trailing
  blank lines by index instead of repeated `Array#shift`/`pop`, avoiding quadratic behavior on inputs
  with many blank lines.

- [#51](https://github.com/santi020k/lumen/pull/51) [`3fb570d`](https://github.com/santi020k/lumen/commit/3fb570d7226780ce6d0d5ff09d2d22121bf1e7f0) Thanks [@santi020k](https://github.com/santi020k)! - Harden data-view state parsing and pagination against non-finite, non-positive, fractional, and
  unsafe numeric values by normalizing them to the documented defaults. Preserve structured sort
  keys containing colons across URL parsing and serialization instead of truncating the key at its
  first separator.

- [#51](https://github.com/santi020k/lumen/pull/51) [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082) Thanks [@santi020k](https://github.com/santi020k)! - Fix `getLumenRichTextShortcut` so the `Ctrl/Cmd+Shift+7` (ordered list) and `Ctrl/Cmd+Shift+8`
  (unordered list) shortcuts work in real browsers. The lookup matched the layout-dependent shifted
  character reported in `KeyboardEvent.key` (for example `&`/`*` on a US layout), which never equals
  the digit the code checked for, so the shortcuts silently did nothing. Matching now uses the
  layout-independent physical key (`KeyboardEvent.code`) for these two shortcuts.

- [#51](https://github.com/santi020k/lumen/pull/51) [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082) Thanks [@santi020k](https://github.com/santi020k)! - Fix `resizeScheduleEvent` so the explicit `min`/`max` resize bound is never exceeded, even when the
  event's fixed edge already sits outside that bound. The unconditional `>=1 minute` duration floor
  previously took priority over the caller's bound (for example resizing an event's `end` could
  return a value past `max` when the event's own `start` was already at or after `max`), silently
  letting the result escape a caller-configured drag range. The explicit bound now always wins; the
  duration floor is applied only when compatible with it.

- [#51](https://github.com/santi020k/lumen/pull/51) [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082) Thanks [@santi020k](https://github.com/santi020k)! - Fix `resizeScheduleEvent` so a `min` resize bound is enforced when no `max` bound is also given.
  Previously, resizing an event's start earlier than a configured `min` (a common case, since start
  edges are usually resized without a `max`) silently produced a time before `min` instead of
  clamping to it.

## 1.7.0

### Minor Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add a shared ErrorState contract and accessible recovery surface for unavailable regions and pages,
  with error and offline contexts, compact and page layouts, explicit live-region policy, safe support
  references, application-owned actions, and an error-handling decision guide.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Expand shared surface radii for app-owned mobile cards and media, and improve SwiftUI product
  adaptation with palette overrides, optional tint ownership, configurable card geometry, and
  status icons that do not communicate state through color alone.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Export typed Tabs change-event contracts, keep selected tabs visible in horizontally overflowing
  lists, expose the Lumen CLI through every web adapter, and detect duplicate stylesheet entrypoints
  across an application boundary.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add a canonical generated illustration catalog, shared graphics tokens, and cross-platform image
  presentation contracts with native React Native, SwiftUI, and Jetpack Compose implementations.
  Web images also gain shared contain or cover fitting and semantic corner-radius options.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Expand Lumen data visualization with generated cross-platform chart tokens, numeric and time
  scales, validation, summaries, downsampling and live-window helpers, conformance fixtures, and
  accessible scatter, bubble, heatmap, range, and combo renderers. Add native chart families for
  React Native, SwiftUI, and Compose, plus semantic summaries and fallback data across adapters.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add cross-platform phone input contracts for web, React Native, SwiftUI, and Jetpack Compose with
  localized country metadata, supplementary flags, calling codes, as-you-type formatting,
  metadata-backed validation, and E.164 output.

### Patch Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Fix `normalizeLumenCode` (used by `tokenizeLumenCode`, `renderLumenCodeHtml`, and the `Code`
  component's highlighting fallback) so it no longer throws `RangeError: Maximum call stack size
  exceeded` on very large code blocks. It computed the shared indentation with
  `Math.min(...indentation)`, which spreads one argument per line and overflows the call stack past
  roughly 100,000 lines; it now finds the minimum with a linear scan and also trims leading/trailing
  blank lines by index instead of repeated `Array#shift`/`pop`, avoiding quadratic behavior on inputs
  with many blank lines.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Make the authored Lumen light palette the canonical default across web, React Native, SwiftUI, and
  Compose, keep semantic theme overrides intact, and allow built-in web themes on nested boundaries.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Harden data-view state parsing and pagination against non-finite, non-positive, fractional, and
  unsafe numeric values by normalizing them to the documented defaults. Preserve structured sort
  keys containing colons across URL parsing and serialization instead of truncating the key at its
  first separator.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Fix `getLumenRichTextShortcut` so the `Ctrl/Cmd+Shift+7` (ordered list) and `Ctrl/Cmd+Shift+8`
  (unordered list) shortcuts work in real browsers. The lookup matched the layout-dependent shifted
  character reported in `KeyboardEvent.key` (for example `&`/`*` on a US layout), which never equals
  the digit the code checked for, so the shortcuts silently did nothing. Matching now uses the
  layout-independent physical key (`KeyboardEvent.code`) for these two shortcuts.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Fix `resizeScheduleEvent` so the explicit `min`/`max` resize bound is never exceeded, even when the
  event's fixed edge already sits outside that bound. The unconditional `>=1 minute` duration floor
  previously took priority over the caller's bound (for example resizing an event's `end` could
  return a value past `max` when the event's own `start` was already at or after `max`), silently
  letting the result escape a caller-configured drag range. The explicit bound now always wins; the
  duration floor is applied only when compatible with it.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Fix `resizeScheduleEvent` so a `min` resize bound is enforced when no `max` bound is also given.
  Previously, resizing an event's start earlier than a configured `min` (a common case, since start
  edges are usually resized without a `max`) silently produced a time before `min` instead of
  clamping to it.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add the canonical `ToastViewport` contract across web adapters, retain `Sonner` as a deprecated
  1.x compatibility alias, and teach the Lumen 2 migrator to rename imports and custom elements
  without losing viewport configuration or children.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Deliver native date selections through the platform picker's supported event contract, keep
  invalid controlled dates from reaching formatters, and ignore invalid optional date bounds. Keep
  restricted phone inputs within their
  configured country allow-list across native adapters, including externally supplied values, and
  exclude invalid scatter coordinates, non-finite numeric categories, and negative bubble sizes from
  rendered charts and disclosures. Keep pie disclosures aligned with positive rendered slices and
  exclude incomplete ranges from Compose chart domains.
  Preserve typed range categories in React fallback keys, and generate Swift-safe illustration case
  identifiers from kebab-case catalog names.
  Allow SwiftUI consumers to derive a product palette by overriding only selected semantic colors.

## 1.7.0-rc.0

### Minor Changes

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add a canonical generated illustration catalog, shared graphics tokens, and cross-platform image
  presentation contracts with native React Native, SwiftUI, and Jetpack Compose implementations.
  Web images also gain shared contain or cover fitting and semantic corner-radius options.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Expand Lumen data visualization with generated cross-platform chart tokens, numeric and time
  scales, validation, summaries, downsampling and live-window helpers, conformance fixtures, and
  accessible scatter, bubble, heatmap, range, and combo renderers. Add native chart families for
  React Native, SwiftUI, and Compose, plus semantic summaries and fallback data across adapters.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add cross-platform phone input contracts for web, React Native, SwiftUI, and Jetpack Compose with
  localized country metadata, supplementary flags, calling codes, as-you-type formatting,
  metadata-backed validation, and E.164 output.

### Patch Changes

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Deliver native date selections through the platform picker's supported event contract, keep
  invalid controlled dates from reaching formatters, and ignore invalid optional date bounds. Keep
  restricted phone inputs within their
  configured country allow-list across native adapters, including externally supplied values, and
  exclude invalid scatter coordinates, non-finite numeric categories, and negative bubble sizes from
  rendered charts and disclosures. Keep pie disclosures aligned with positive rendered slices and
  exclude incomplete ranges from Compose chart domains.
  Preserve typed range categories in React fallback keys, and generate Swift-safe illustration case
  identifiers from kebab-case catalog names.
  Allow SwiftUI consumers to derive a product palette by overriding only selected semantic colors.

## 1.4.0

### Minor Changes

- [#30](https://github.com/santi020k/lumen/pull/30) [`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce) Thanks [@santi020k](https://github.com/santi020k)! - Add token-aware `Graphic`, `Backdrop`, and `Illustration` primitives across Astro, React, Elements,
  React Native, SwiftUI, and Compose. Shared decorative presets frame application artwork, add ambient
  patterns behind content, and provide semantic empty, success, error, and offline scenes without
  bundling platform-specific bitmap assets.

## 1.3.0

### Minor Changes

- [#28](https://github.com/santi020k/lumen/pull/28) [`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled and uncontrolled language-toggle behavior across the shared core, Astro, React, and
  Elements adapters, including persistence, document-language synchronization, accessible labels,
  events, and a React hook. Add discoverable dropdown-menu trigger, content, item, separator,
  disabled, and status contracts across Astro and React.

## 1.2.0

### Minor Changes

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled Kanban board and column primitives with keyboard, pointer, and touch move requests,
  plus a compact Empty state for dense collection layouts.

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Add a cross-framework ContextNavigation primitive for pairing a stable product, platform, or
  workspace context with an independently named, horizontally scrollable navigation group.

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Add canonical cross-platform design tokens, synchronized light and dark semantic palettes, and
  native foundation packages for React Native, SwiftUI, and Jetpack Compose. Ship the first shared
  native primitive slice with theme, text, icon, icon button, surface, button, text field, badge,
  divider, spinner, card, alert, progress, and avatar contracts while preserving each platform's
  native accessibility and interaction model. Adapt SwiftUI control density automatically for
  touch-first iOS and pointer-first macOS applications while keeping one shared component API. Add
  Apple-native settings, selection, empty state, row, banner, metric, section, and status primitives,
  plus macOS shortcut recording and SF Symbols selection based on recurring Lumen application needs.

### Patch Changes

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Improve package discovery with framework-specific documentation homepages and npm search keywords.

## 1.1.0

### Minor Changes

- [`e5a6b36`](https://github.com/santi020k/lumen/commit/e5a6b366ed28a5513c375afb3f36ac26117b749f) Thanks [@santi020k](https://github.com/santi020k)! - Make `lumen doctor` workspace-aware, ignore generated build trees, parse real adapter imports,
  recognize controlled Astro toggles, and deduplicate diagnostics. Preserve native form-control
  `size` across adapters while adding explicit Astro `visualSize` and Elements `visual-size` styling
  contracts with pre-1.0 alias compatibility.

## 1.0.0

### Major Changes

- [#13](https://github.com/santi020k/lumen/pull/13) [`da44247`](https://github.com/santi020k/lumen/commit/da44247c127a77744bdd84ace78b85a9ba586839) Thanks [@santi020k](https://github.com/santi020k)! - Release Lumen 1.0 with stable public component, token, styling, framework, registry, and MCP
  contracts. Remove the deprecated `surface="glass"` overlay alias and
  `ui:datatable-selection-change` event; use the `glass` prop or attribute and
  `ui:data-table-selection-change` instead.

### Minor Changes

- [#13](https://github.com/santi020k/lumen/pull/13) [`6e84499`](https://github.com/santi020k/lumen/commit/6e84499b05e1e3cda0087e686db88663de351c48) Thanks [@santi020k](https://github.com/santi020k)! - Add compound Card and Stat parts, stable styling contracts, wrapper-safe React composition,
  framework behavior metadata, chart formatting and presentation controls, sibling-derived registry
  recipes, and integration diagnostics with canonical setup generation.

- [#13](https://github.com/santi020k/lumen/pull/13) [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914) Thanks [@santi020k](https://github.com/santi020k)! - Add arbitrary-text CopyButton behavior, hydrated Progress updates, richer accessible Anchor
  scroll-spy navigation, and semantic Item hosts across framework adapters.

- [#13](https://github.com/santi020k/lumen/pull/13) [`32448b0`](https://github.com/santi020k/lumen/commit/32448b02030177788ebcdbb4ee91eb55f3bbfbff) Thanks [@santi020k](https://github.com/santi020k)! - Add native-first form contracts and the Form, FieldError, ErrorSummary, PasswordField,
  CheckboxGroup, ListBox, Container, Stack, Grid, and VisuallyHidden components across Astro, React,
  and Elements.

  Ship an optional React Hook Form adapter package, Astro Actions error normalization, form-associated
  custom element behavior, accessible validation and error-summary focus, documented serialization,
  and generated registry and MCP metadata.

### Patch Changes

- [#13](https://github.com/santi020k/lumen/pull/13) [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914) Thanks [@santi020k](https://github.com/santi020k)! - Harden theme CSS exports and palette generation against incomplete string replacement and slow trailing-percentage matching.

## 0.4.0

### Minor Changes

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Add a document-aware `ScrollProgress` primitive across Astro, React, and Web Components. Extend
  `Anchor` with heading depth metadata and add `neutral`, `brand`, and `outline` variants to `Pill`.

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Add shared chart contracts, geometry helpers, visualization tokens, and accessible `Sparkline`,
  `BarChart`, `LineChart`, and `PieChart` components across Astro, React, and Web Components. The new
  pie renderer defaults to a donut, supports part-to-whole legends and center content, and includes
  a revealable semantic data table. Expand `Chart` with standard heading, description, value, and
  caption composition while preserving custom plot children.

- [#9](https://github.com/santi020k/lumen/pull/9) [`0b68131`](https://github.com/santi020k/lumen/commit/0b681319874b1ad2f6fe68f68df15dc14c6c0922) Thanks [@santi020k](https://github.com/santi020k)! - Add opt-in, namespaced icon-pack registration and the optional Lumen brand icon package with the
  complete Font Awesome Free brand catalog plus a convenient `brand:x` alias.

### Patch Changes

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Use the canonical Santi020k Montserrat family stack across Lumen interface text, including generated
  Watermark tiles, while keeping font loading and the `--ui-font` override under application control.

## 0.3.0

### Minor Changes

- [#7](https://github.com/santi020k/lumen/pull/7) [`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f) Thanks [@santi020k](https://github.com/santi020k)! - Add `CodeTabs` to the shared catalog with accessible, synchronized, copyable code examples across
  Astro, React, custom elements, and MCP discovery.

## 0.2.0

### Patch Changes

- [`e6c1737`](https://github.com/santi020k/lumen/commit/e6c17377f79fc2dc27b88166531175917184fd3b) Thanks [@santi020k](https://github.com/santi020k)! - Make Code blocks easier to use without a separate syntax-highlighting integration.

  Code strings now receive lightweight semantic-token highlighting for JavaScript, TypeScript, JSON,
  YAML, Bash, Astro and HTML, Markdown, Lua, and SQL language families. The palette continues to
  derive from the active Lumen theme tokens, and block layouts now stay within flex and grid
  containers while preserving the existing opt-in wrapping behavior.

- [`d7a8a84`](https://github.com/santi020k/lumen/commit/d7a8a8408c03c0c3005e7f0f515e815b59c51c17) Thanks [@santi020k](https://github.com/santi020k)! - Stabilize the existing catalog without adding components: complete the typed API reference, add
  cross-framework class and behavior contract checks, enforce coverage and bundle-size budgets, load
  motion controllers only when matching Astro primitives are present, and adopt
  `ui:data-table-selection-change` while keeping the previous DataTable event as a compatibility
  alias until Lumen 1.0.

## 0.1.0

### Minor Changes

- [`b30a72a`](https://github.com/santi020k/lumen/commit/b30a72aec1742b0ce39214fbf299099011d1a510) - Add `AnimatedNumber` and `RevealGroup`, and extend `ScrollReveal` with shared duration, delay,
  threshold, and repeat controls across Astro, React, Elements, metadata, runtime behavior, and
  standalone styles. Overlay entrances now use the canonical Lumen motion tokens.
  Astro `ButtonLink` controls now share the same subtle CSS hover lift as `Button`, while directional
  arrow motion remains as a navigation cue.

- [`26053f4`](https://github.com/santi020k/lumen/commit/26053f437784f4f771a7af8ddee8426c5bfc8cc5) Thanks [@santi020k](https://github.com/santi020k)! - Add competitor-informed product primitives, AI discovery docs, shared behavior helpers, and registry
  installation tooling.

  The shared catalog now includes scheduling, advanced data collection, theme builder, rich text
  editor, and advanced form field surfaces. Astro, React, and Web Components expose matching class and
  data contracts, and the docs app includes examples for each new primitive.

  The core package now includes reusable schedule, data-view, and theme helpers for state
  serialization, persistence, virtual ranges, scheduling conflicts and resize math, server request
  adapters, and contrast-safe theme tuning. The umbrella package exposes a `lumen` CLI that can add
  recipes, merge conflicts deterministically, and load token-authenticated private registries.

- [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654) - Expand rich text editors with value-bearing commands, keyboard shortcuts, active toolbar states,
  HTML and text change events, accessible editable props, and richer toolbar/content styling.

- [`d802296`](https://github.com/santi020k/lumen/commit/d80229694b15c0c23e8846ed68780fce5222f2dd) Thanks [@santi020k](https://github.com/santi020k)! - Add Figma-oriented theme token exports for variable automation and design-token import workflows.

- [`b6f7d70`](https://github.com/santi020k/lumen/commit/b6f7d7091f099e964371fd75844eb645e858e866) Thanks [@santi020k](https://github.com/santi020k)! - Add a Lucide-backed Icon primitive with shared full-catalog icon names across Astro, React, and Web Components. Credit the upstream Lucide and Feather creators and ship their license notices with the core package.

- [`255e9fd`](https://github.com/santi020k/lumen/commit/255e9fd43b1d367418d3b3112bc973f510143356) - Add sixteen components to close the gap with enterprise UI libraries (Ant Design, MUI, Mantine, Chakra, React Aria): Stepper, FileUpload, Tour, Anchor, Segmented, Toolbar, Descriptions, Popconfirm, Transfer, Cascader, TreeSelect, Mentions, QRCode, Watermark, Affix, and SpeedDial. Each ships as a thin, token-driven wrapper across Astro (reference), React, and Web Components, with shared CSS and progressive-enhancement runtime for the interactive primitives (FileUpload drag-and-drop, Anchor scroll-spy, Tour step navigation, Transfer list movement, Mentions autocomplete, Cascader and TreeSelect value selection). Toolbar reuses the existing roving-focus runtime and Popconfirm/Cascader/TreeSelect reuse the popover disclosure runtime.

- [`5aab08e`](https://github.com/santi020k/lumen/commit/5aab08e1e765444d16f5e41956dca486128e812f) Thanks [@santi020k](https://github.com/santi020k)! - Add shared ThemeBuilder controller helpers, React `useThemeBuilder`, and Web Components ThemeBuilder behavior for token previews and exports.

### Patch Changes

- [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579) Thanks [@santi020k](https://github.com/santi020k)! - Add shared Astro prop helpers for class/className merging and glass alias resolution, and standardize Astro overlays on the glass prop while keeping surface="glass" as a deprecated compatibility alias.

- [`f5c36ab`](https://github.com/santi020k/lumen/commit/f5c36ab1b22daf6f532869c576be97fa22474a43) Thanks [@santi020k](https://github.com/santi020k)! - Improve dark theme readability for docs and primitives.

  Dark glass surfaces now use dark aliases instead of inheriting light glass fills, selected and status controls use higher-contrast foreground pairs, generated dark themes produce more readable muted text, and the ThemeBuilder runtime initializes independently from generic component bindings.

- [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570) Thanks [@santi020k](https://github.com/santi020k)! - Add glass surface tokens, boolean glass props and attributes, and documentation for supported glass surfaces. Expand glass support across layout, data display, feedback, navigation, and editor-style container primitives with matching Astro, React, and Elements examples.

- [`5ae75c5`](https://github.com/santi020k/lumen/commit/5ae75c5f60b4fb4382bba9c0634bef8c0721fa96) Thanks [@santi020k](https://github.com/santi020k)! - Polish Code block layout so headers avoid control overlap, inline code uses the component palette, framed examples preserve multiline formatting without inheriting global pre borders, and the Astro/React Code components can render a normalized `code` string with lightweight theme-aware token colors.

- [`e5dcf54`](https://github.com/santi020k/lumen/commit/e5dcf54cb2635406a66ca65cfa53d99423d6235a) - Restore the cyan and teal Lumen Light palette across standalone CSS, exported core tokens, and the
  Figma theme contract.

- [`24990c5`](https://github.com/santi020k/lumen/commit/24990c52f458b4a157d22e197e520fc6eec72ce8) Thanks [@santi020k](https://github.com/santi020k)! - Include glass surface variables in generated ThemeBuilder tokens, CSS exports, scoped previews, Figma color variables, and design-token JSON.

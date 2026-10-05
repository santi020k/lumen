# @santi020k/lumen-elements

## 4.0.0

### Patch Changes

- Reject invalid supplied histogram labels and waterfall tones instead of discarding malformed chart fields.

- Preserve iframe calendar focus, newest-only toast dismissal, explicit table record identities, legacy read-only phone country submission, and valid decoded annotation axes.

- Validate decoded chart annotations, restore chart legend inspection state on teardown, refresh external image-comparison reset values, restore iframe dialog focus, and preserve uncontrolled filter disclosure state.

- Honor comparison chart value labels and escaped accessible summaries in Web Components. Reset iOS and web time-picker drafts when controlled values or bounds change, preserving current Android bounds and callback handling.

- Keep sparkline endpoints circular and line strokes uniform when a chart stretches to fit a wide or shallow container.

### Major Changes

- Finalize web form visual sizing with visualSize/visual-size on Select, PhoneInput and Segmented, preserving native numeric size. Add conservative literal migration previews and a complete machine-readable v4 breaking inventory. Fix controlled Segmented ownership, Select accessibility/callback/reset behavior, Elements scalar reconnection and reset defaults, and multiple-select submission. Add selective React component and Elements VirtualList imports with measured bundle and packed-consumer checks. Existing root imports remain supported.

- Refine v4 reading rhythm and responsive page gutters, allow interactive Card content to overflow,
  and wrap long actions in wrapping Stacks. Move media clipping into AspectRatio when upgrading.
  Container gutters now grow from 16px to 32px; override --ui-container-gutter to preserve fixed
  product gutters. Prose and Typography trim their outer child margins and separate headings from
  preceding paragraphs. Add four installable content-flow recipes for all web adapters and return
  complete framework examples through MCP recipe discovery.

  Elements Stack now honors align, justify, and wrap attributes, including boolean-presence wrap,
  so installed compositions wrap long actions consistently across the web adapters.
  Include CLI starter templates in the published umbrella package and verify all twelve new
  compositions install from a packed consumer, rather than only from the repository checkout.

- Prepare the v4 content-flow contract: canonical gap sizes, semantic related/group/section gaps,
  Card density and parent-owned part spacing, wrapping footer actions, and generated spacing tokens
  available through CSS and MCP. Explicit md/lg/xl layout gaps now mean 12/16/24px; migrate old
  16/24/32px layouts to group/xl/2xl. Default Stack/Grid spacing remains 16px. Comfortable Card
  insets become 24px, and direct child margins no longer stack with layout gaps.

- Keep editable Combobox focus in the input with active-descendant navigation, composition-safe
  shortcuts and live option updates. Report React selection through onChange for controlled forms.
  Dismiss only the innermost active popup on Escape and preserve canceled events and text editing.

  Migration: use aria-activedescendant and aria-selected instead of focusing option buttons. Enter
  commits only an active option in an open list; otherwise native form behavior remains available.

- Preserve VirtualList scroll height with fixed-height row windows and inert spacers across web
  adapters. Refresh changing rows and resized containers, retain keyboard focus, and restore row
  state on cleanup. Range endpoints are inclusive; empty lists report endIndex -1.

  Add cancelable rich-text command requests and a React commandHandler option so external engines
  can execute commands once without a browser fallback. Existing command events report completion.

### Minor Changes

- Add CalendarHeatmap, FunnelChart, and BoxPlot across web and native adapters with shared validation,
  semantic chart colors, localized formatting, responsive layouts, and accessible exact data.
  Calendar heatmaps use explicit Gregorian date-only ranges; funnels preserve supplied stage order;
  box plots accept precomputed quartiles, whiskers, and outliers without performing application statistics.

- Add canonical Default, Studio and Glass appearance presets, scoped web styling and ThemeBuilder radius, spacing and border customization. Native adapters expose preset palettes and explicit surface material with opaque fallbacks. Swift and Compose consumers must rebuild for the updated theme and surface signatures; see the appearance presets guide.

- Add attachment list and browser-owned image preview composition with localized fallback states,
  retry identity, safe state events, and independent application-owned file actions.

- Add BulletChart across Astro, React, Web Components, React Native, SwiftUI, and Compose.
  Compare actual values with targets and labeled qualitative ranges using an honest zero-inclusive
  domain. Preserve missing measurements, localized exact data, responsive typography, and native
  accessibility. Existing chart APIs remain compatible.

- Add dashboard filter and change-summary composition, richer responsive React DataTable records and
  shared sorting controls, top-layer React overlays with collision placement and focus handoff, and
  ScatterChart logarithmic X scales, independent formatting, explicit domains, and labeled references.
  Document host-owned freshness, import review, activity inbox, and persistent Kanban recipes.
  Keep controlled filter disclosure under host ownership and advance manual table sorting from the
  authored header state without changing server row order.

- Add DialogHeader, DialogTitle, DialogBody, DialogFooter, and DialogClose across the web adapters. Compound dialogs keep their header and actions visible while long task content scrolls. Close actions honor cancelled clicks and disabled controls.

  FileUpload accepts localized selected-file count labels and clears selected-file feedback after an accepted native form reset.

- Add opt-in datum actions to all seven Elements data charts. Share validated pointer and native
  button payloads, localize action labels, retain focus across data updates, and clean up controllers
  on disconnect. Astro's runtime leaves Elements-owned chart hosts to their adapter.

- Add DescriptionItem, DescriptionTerm, and DescriptionDetail for rich description values across the web adapters. Astro and React preserve native definition-list markup; Web Components provide explicit group, term, and definition roles. Long values wrap within their grid column.

- Add Histogram and WaterfallChart to the web catalog with explicit data contracts, shared geometry,
  validation, accessible summaries, and source tables. Add continuous numeric and time axes,
  reference annotations, optional keyboard and pointer inspection, interactive legends, and cursor
  synchronization to LineChart. React supports controlled cursor selection.

  Heatmaps now label axes, display a sequential or diverging color legend, and mark missing cells
  distinctly from measured zero. Duplicate coordinates use the first observation consistently.
  Existing category line spacing remains the default. Native component coverage is unchanged.

- Add ImageComparison for Astro, React, and Web Components with aligned media clipping, a labelled native range control, localized accessible values, and controlled React state. Preserve media framing across reveal changes and support writing direction without pointer-only interaction.

- Add LollipopChart and DumbbellChart across Astro, React, Elements, React Native, SwiftUI, and Compose.
  The charts preserve missing values, share a zero-inclusive domain, and provide readable exact data.
  Refine BulletChart with a slimmer track, quieter range bands, and a capped target marker.

### Patch Changes

- Show category labels and value scales in combo and range charts, with visible line markers in combo charts.

- Keep success Alert and Toast text readable on their tinted surfaces by using the semantic
  ink color. Success borders and backgrounds retain their status color across web adapters.

- Prevent combobox option clicks from submitting forms, preserve application-hidden options during
  filtering, and restore filter-owned visibility on cleanup. Support mounted virtual lists in
  same-origin iframe documents. Respect disabled fieldset ancestors and current form ownership for
  combobox resets. Bind Web Component comboboxes when children arrive or are replaced after connection.

  Compose consecutive functional updates through uncontrolled React hook setters without losing earlier updates or duplicating change notifications.

- Keep disclosure keyboard navigation on available controls: skip hidden and inert regions,
CSS-invisible controls, and native disabled controls while preserving enabled legend actions
and controls restored by removing inert.
- Keep Mentions suggestion buttons out of the form's Tab sequence while retaining keyboard and
pointer selection. Rebind static Astro toast markup after client navigation without duplicating
Escape dismissal or the document toast API.

- Reduce published web artifact sizes within the existing v4 budgets. React compacts its component build
  without renaming identifiers, Web Components use native private methods for internal behavior, and
  the shared stylesheet retains the same rules with concise section comments. Public APIs stay unchanged.

- Reject malformed Astro action errors and inherited icon names, preserve plain markup prose without syntax highlighting, and normalize form-error records whose field is named `fields`, exclude blank numeric chart coordinates, preserve literal slash-star text during markup migrations, and detect existing recipe conflicts before writing files.

  Validate externally associated native form controls on submission in Astro and Web Components.

  Keep timed toasts paused while hovered or focused, without subtracting elapsed time twice.

  Preserve localized password-toggle labels, accessible avatar fallback names and tree levels,
  correct listbox ownership, tolerate non-finite animation precision, and apply the final batched
  scroll-reveal visibility state.

  Restrict schedule drops to their actively dragged event, clear interrupted resizing state, and
  generate unique Astro runtime IDs without depending on `crypto.randomUUID`.

  Reject inherited search-alias dictionary properties instead of crashing MCP search.

- Keep anchor navigation working with malformed fragments and short pages. Preserve native dialog autofocus, dismiss only genuine backdrop presses, and restore anonymous triggers without requiring a secure-context UUID API. Clear phone validation references when their error element is removed. Keep React and Elements tab keyboard navigation within its own tab group and skip disabled tabs across all web adapters.

- Refine web chart presentation with responsive plots, fading area fills, quieter grids, compact
  legends, clearer typography, and a floating inspection panel that stays inside the chart. Improve
  heatmap legend alignment and preserve all row labels at narrow sizes. The default line aspect ratio
  is wider and pie charts are more compact; existing data contracts and imports remain unchanged.

- Repair chart data disclosures with full-width controls, bounded keyboard scrolling, and sticky
  headers across the web adapters. Add WaterfallChart and Histogram to React Native, SwiftUI, and
  Compose, with matching invalid-input behavior, exact values, and native expandable data lists.

- Preserve accessible scatter datum actions alongside reference overlays and independent axis
  formatters. Keep pointer targets usable at domain boundaries while clipping visual marks and
  references to the plot. Retain keyboard-accessible chart data tables across the web adapters.

- Close shared Combobox options and clear stale active-option state after an accepted native form reset. Refilter against the restored input value, preserve canceled resets, and cancel deferred work when the controller is destroyed.

- Updated dependencies [`dcbb1c0`, `c71c50a`, `7163f95`, `ef5187d`, `788125f`, `55a1032`, `551f903`, `1150318`, `19964b1`, `20aa235`, `85f332c`, `0ea4a4e`, `3cc6c23`, `bd11bc0`, `4ba4561`, `7a17060`, `79d9b0a`, `11c8574`, `edf9cbe`, `a5d6fe4`, `07a4a31`, `4dbb3b0`, `059aae9`, `bd11bc0`, `aba0839`]:
  - @santi020k/lumen-core@4.0.0
  - @santi020k/lumen@4.0.0

- Updated dependencies []:
  - @santi020k/lumen-core@4.0.0
  - @santi020k/lumen@4.0.0

- Prepare the coordinated Lumen 4 family from twenty real consumer audits.

  - Make chart axes readable, preserve complete detail labels, center single observations, use
    deterministic duplicate handling, and expose formatted native axes and compact plot layouts.
  - Add controlled date-range drafting with strict calendar bounds, localized labels, and safe
    disabled/read-only behavior. Keep form labels and keyboard focus attached to the active control.
  - Keep server-paginated tables in supplied order with controlled manual sorting, and make dialog
    dismissal and opener restoration explicit for pending and nested workflows.
  - Preserve native hidden semantics, loading-button dimensions, and disabled slotted activation.
  - Give code-copy actions localized success and failure feedback, preserve normal navigation Tab
    order, and improve readable prose and code-theme defaults.
  - Add ImageComparison with a fixed image frame, native range control, RTL support, and matching
    Astro, React, and Web Component contracts.
  - Improve native slider announcements, long text layout, and contextual symbol selection.
  - Refresh usage examples, migration guidance, machine-readable contracts, and the public consumer
    showcase. Token, icon, and form-integration packages join the coordinated major family.

  Migration: use unique stable chart X values, rebuild native consumers for updated initializer
  contracts, and review custom button selectors against the content wrapper. Loading actions now
  prevent repeated activation. See `docs/migrating-to-lumen.md` for the full v4 migration. No
  application data migration is performed, and this candidate is not publication authorization.

- Fit line, bar, scatter, range, and combo chart geometry to the available container width. Keep every plotted value visible on phones with readable axis text and a compact plot height, and resize when the container changes.

  Fit web bar charts to narrow cards across Astro, React, and Web Components, reserving more room for horizontal category labels and spacing value-axis labels to avoid overlap.

- Validate malformed decoded waterfall and histogram rows before accumulation or sorting, and fail closed with empty geometry. Reset Elements calendars to their latest configured value and focus form-owned external controls from error summaries. Align image-comparison crops and dividers with native range direction in LTR and RTL. Preserve decorative and custom accessibility descriptions for Compose flag text fallbacks.
- Updated dependencies []:
  - @santi020k/lumen-core@4.0.0
  - @santi020k/lumen@4.0.0

- Validate decoded BulletChart range containers and avoid formatting invalid measurements. Fall back safely for malformed decimal locale tags. Resume React toast timeouts after keyboard focus leaves while preserving overlapping hover pauses. Remove only enhancer-owned Code copy controls and focus attributes when configuration changes, and cancel stale clipboard feedback.
- Updated dependencies []:
  - @santi020k/lumen-core@4.0.0

- Reject malformed Astro Bullet range containers, exclude missing heatmap observations from drilldown formatters and targets, keep generated code-region names current after label updates and reconnects, and safely format native image comparison percentages with malformed locales.

- Preserve regex literals during source migration with the existing TypeScript compiler parser as a runtime dependency; leave parser-exhausting input unchanged for manual review and recognize manifests on platform-native paths. Reject malformed serialized heatmap datasets atomically and guard native time display against malformed locales while preserving hour-format preferences.
- Updated dependencies []:
  - @santi020k/lumen@4.0.0

### Migration, Direction and Data Collections

- Add v3 and v4 source migration previews with optional coordinated pnpm dependency upgrades. Preserve
  explicit v3 layout gaps, report product and native review boundaries, and prevent repeated v4 applies
  from rewriting spacing twice.

  Correct inherited RTL horizontal navigation in tabs, calendars and pane resizing. Add an opt-in
  VirtualList data renderer that mounts only the visible window and focused neighbors, with stable
  keys and a shared DOM controller for Astro and Elements.

- Updated dependencies []:
  - @santi020k/lumen@4.0.0
  - @santi020k/lumen-core@4.0.0

### Appearance Presets

- Add Default, Studio and Glass appearance presets with semantic palette and surface customization.
  Glass remains explicit per surface with opaque native fallbacks. See the appearance presets guide;
  Swift and Compose consumers must rebuild for the updated initializer signatures.

### Phone Input Improvements

- Polish international phone inputs with shared offline flag artwork, compact country selectors,
  continuous borders, consistent spacing, visible validation, and complete disabled/read-only states.
  Expose input attributes and refs directly, and add reusable country flags and read-only phone views.

  In v4, Astro and React PhoneInput `id` labels the actual number input. Web Components expose
  `input-id` and render the visual phone frame inside the host. Remove consumer flag overlays and
  DOM attribute patches; use the public props and stable phone parts instead.

## 3.0.1

### Patch Changes

- [#88](https://github.com/santi020k/lumen/pull/88) [`b4af91a`](https://github.com/santi020k/lumen/commit/b4af91a087644fcb430a0e0895eafd4a60a1c251) Thanks [@santi020k](https://github.com/santi020k)! - Prevent line-chart value labels from being clipped by sizing the SVG plot padding from the formatted axis values across Astro, React, and Web Components. Chart data disclosures now use a clear, touch-friendly open and close control instead of the browser's cramped default marker.
- Updated dependencies [[`b4af91a`](https://github.com/santi020k/lumen/commit/b4af91a087644fcb430a0e0895eafd4a60a1c251)]:
  - @santi020k/lumen@3.0.1
  - @santi020k/lumen-core@3.0.1

## 3.0.0

### Major Changes

- Coordinate Lumen 3 across web and native packages. Swift consumers with exhaustive
  `LumenIconName` switches must handle the synchronized icon cases or add an `@unknown default`
  branch; existing component calls and existing icon cases remain available.

### Minor Changes

- Add tree-shakeable interface icon definitions and a registry-free React icon entrypoint while preserving named icons. Add opt-in responsive record layouts to Table across web adapters. Extend native sheets with keyboard avoidance, safe-area inputs, scrolling bodies, adaptive presentation, and controlled dismissal. Document consumer recipes for editor layouts, whole-unit amount entry, and asynchronous recovery.

  Name sheet dialogs and remove decorative backdrop and web switch targets from keyboard traversal. Preserve the toggle's single labeled action and improve its supporting-text contrast.

  Improve supporting-text and warning-badge contrast in the shared web styles and mobile record labels.

  Keep icon rendering resilient to optional Lucide metadata and preserve native ref and keyboard
  contracts with the React Native version required by Expo SDK 57.

### Patch Changes

- Updated dependencies [`484880b`]:
  - @santi020k/lumen-core@3.0.0
  - @santi020k/lumen@3.0.0

## 2.1.0

### Minor Changes

- Complete the v2 consumer-improvement contracts: localizable chart support copy, semantic native
  chart references and datum tones, richer SwiftUI form composition, adaptive native layouts,
  success actions, contextual React Native fields, complete CopyButton and reveal semantics,
  component-aware diagnostics, explicit shared-library integration boundaries, packed Astro runtime
  coverage, rendered migration checks, and adoption-ready registry output.

### Patch Changes

- Keep inactive CopyButton feedback hidden and rerender charts when localized label attributes
  change.

- Updated dependencies [`da315f0`, `da315f0`, `42b9f27`]:
  - @santi020k/lumen@2.1.0
  - @santi020k/lumen-core@2.1.0

## 2.0.0

### Major Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Finalize the Lumen 2 breaking contracts: import the Astro runtime from its dedicated subpath,
  replace the deprecated Sonner viewport name with ToastViewport, reserve native `size` for numeric
  form-control sizing, and move React Native date fields to the optional `datetime` subpath. The v2
  migrator automates the supported source changes, while the Swift surface enums gain the reviewed
  larger semantic roles.

### Patch Changes

- Updated dependencies [[`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105)]:
  - @santi020k/lumen@2.0.0
  - @santi020k/lumen-core@2.0.0

## 1.8.0

### Minor Changes

- [#51](https://github.com/santi020k/lumen/pull/51) [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082) Thanks [@santi020k](https://github.com/santi020k)! - Bring Combobox keyboard behavior into parity across web adapters. Registered Elements comboboxes now filter, traverse, commit, dismiss, and restore input focus, while React combobox options support the same roving Arrow, Home, End, Escape, Enter, and Space interactions.

- [#51](https://github.com/santi020k/lumen/pull/51) [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082) Thanks [@santi020k](https://github.com/santi020k)! - Expand pay-only-for-use web delivery with selector-loaded Astro phone and overlay controllers, a grouped
  granular Elements foundations entrypoint, and server-safe React Card, layout, typography, and
  accessibility primitives that are shared with the full client catalog. Add accessible in-memory
  string and numeric sorting to structured React DataTable columns. Publish a generated critical-web
  stylesheet for the essential forms, feedback, navigation, overlay, and data-table surface.
  Keep non-native custom-element dialogs above surrounding content so their controls remain operable on
  mobile layouts.

### Patch Changes

- Updated dependencies [[`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082), [`3fb570d`](https://github.com/santi020k/lumen/commit/3fb570d7226780ce6d0d5ff09d2d22121bf1e7f0), [`09fa666`](https://github.com/santi020k/lumen/commit/09fa666828dbae116b254445de1a33eaee7b54e8), [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082), [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082), [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082), [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082)]:
  - @santi020k/lumen-core@1.8.0
  - @santi020k/lumen@1.8.0

## 1.7.0

### Minor Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Allow `defineLumenElements` to register an explicit typed component set while preserving the
  complete-catalog default and custom-registry compatibility.

  Add implementation-level Badge, Button, and Card entrypoints for applications that need a small
  granular custom-element bundle.

  Add a server-safe React entrypoint for stateless Badge, Input, Label, Progress, Skeleton, Spinner,
  and Textarea primitives while retaining the full client catalog at the package root.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Bring Combobox keyboard behavior into parity across web adapters. Registered Elements comboboxes now filter, traverse, commit, dismiss, and restore input focus, while React combobox options support the same roving Arrow, Home, End, Escape, Enter, and Space interactions.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add a shared ErrorState contract and accessible recovery surface for unavailable regions and pages,
  with error and offline contexts, compact and page layouts, explicit live-region policy, safe support
  references, application-owned actions, and an error-handling decision guide.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Export typed Tabs change-event contracts, keep selected tabs visible in horizontally overflowing
  lists, expose the Lumen CLI through every web adapter, and detect duplicate stylesheet entrypoints
  across an application boundary.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Expand pay-only-for-use web delivery with selector-loaded Astro phone and overlay controllers, a grouped
  granular Elements foundations entrypoint, and server-safe React Card, layout, typography, and
  accessibility primitives that are shared with the full client catalog. Add accessible in-memory
  string and numeric sorting to structured React DataTable columns. Publish a generated critical-web
  stylesheet for the essential forms, feedback, navigation, overlay, and data-table surface.
  Keep non-native custom-element dialogs above surrounding content so their controls remain operable on
  mobile layouts.

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

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add the canonical `ToastViewport` contract across web adapters, retain `Sonner` as a deprecated
  1.x compatibility alias, and teach the Lumen 2 migrator to rename imports and custom elements
  without losing viewport configuration or children.

- [#40](https://github.com/santi020k/lumen/pull/40) [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb) Thanks [@santi020k](https://github.com/santi020k)! - Export constructors for every canonical custom element and make `defineLumenElements` idempotent
  per supplied registry so scoped or secondary registries receive the complete component catalog.
- Updated dependencies [[`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb), [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92)]:
  - @santi020k/lumen-core@1.7.0
  - @santi020k/lumen@1.7.0

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

- [#40](https://github.com/santi020k/lumen/pull/40) [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb) Thanks [@santi020k](https://github.com/santi020k)! - Export constructors for every canonical custom element and make `defineLumenElements` idempotent
  per supplied registry so scoped or secondary registries receive the complete component catalog.
- Updated dependencies [[`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb), [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92)]:
  - @santi020k/lumen@1.7.0-rc.0
  - @santi020k/lumen-core@1.7.0-rc.0

## 1.6.0

### Patch Changes

- [#36](https://github.com/santi020k/lumen/pull/36) [`1c4de1b`](https://github.com/santi020k/lumen/commit/1c4de1bbf7d2414896b04c69f2b6810f10b4a0dd) Thanks [@santi020k](https://github.com/santi020k)! - Keep Kanban pointer interactions scoped to their owning board, initialize dynamically added drag handles, and clear React drag state when a pointer is cancelled.
- Updated dependencies [[`1c4de1b`](https://github.com/santi020k/lumen/commit/1c4de1bbf7d2414896b04c69f2b6810f10b4a0dd)]:
  - @santi020k/lumen@1.6.0

## 1.4.0

### Minor Changes

- [#30](https://github.com/santi020k/lumen/pull/30) [`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce) Thanks [@santi020k](https://github.com/santi020k)! - Add token-aware `Graphic`, `Backdrop`, and `Illustration` primitives across Astro, React, Elements,
  React Native, SwiftUI, and Compose. Shared decorative presets frame application artwork, add ambient
  patterns behind content, and provide semantic empty, success, error, and offline scenes without
  bundling platform-specific bitmap assets.

### Patch Changes

- Updated dependencies [[`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce), [`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce)]:
  - @santi020k/lumen@1.4.0
  - @santi020k/lumen-core@1.4.0

## 1.3.0

### Minor Changes

- [#28](https://github.com/santi020k/lumen/pull/28) [`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled and uncontrolled language-toggle behavior across the shared core, Astro, React, and
  Elements adapters, including persistence, document-language synchronization, accessible labels,
  events, and a React hook. Add discoverable dropdown-menu trigger, content, item, separator,
  disabled, and status contracts across Astro and React.

### Patch Changes

- Updated dependencies [[`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75), [`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75), [`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75)]:
  - @santi020k/lumen@1.3.0
  - @santi020k/lumen-core@1.3.0

## 1.2.0

### Minor Changes

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled Kanban board and column primitives with keyboard, pointer, and touch move requests,
  plus a compact Empty state for dense collection layouts.

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Add a cross-framework ContextNavigation primitive for pairing a stable product, platform, or
  workspace context with an independently named, horizontally scrollable navigation group.

### Patch Changes

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Improve package discovery with framework-specific documentation homepages and npm search keywords.

- Updated dependencies [[`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684), [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684), [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684), [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684), [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684)]:
  - @santi020k/lumen@1.2.0
  - @santi020k/lumen-core@1.2.0

## 1.1.0

### Minor Changes

- [`e5a6b36`](https://github.com/santi020k/lumen/commit/e5a6b366ed28a5513c375afb3f36ac26117b749f) Thanks [@santi020k](https://github.com/santi020k)! - Make `lumen doctor` workspace-aware, ignore generated build trees, parse real adapter imports,
  recognize controlled Astro toggles, and deduplicate diagnostics. Preserve native form-control
  `size` across adapters while adding explicit Astro `visualSize` and Elements `visual-size` styling
  contracts with pre-1.0 alias compatibility.

### Patch Changes

- Updated dependencies [[`e5a6b36`](https://github.com/santi020k/lumen/commit/e5a6b366ed28a5513c375afb3f36ac26117b749f)]:
  - @santi020k/lumen@1.1.0
  - @santi020k/lumen-core@1.1.0

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

- Updated dependencies [[`6e84499`](https://github.com/santi020k/lumen/commit/6e84499b05e1e3cda0087e686db88663de351c48), [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914), [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914), [`32448b0`](https://github.com/santi020k/lumen/commit/32448b02030177788ebcdbb4ee91eb55f3bbfbff), [`988c097`](https://github.com/santi020k/lumen/commit/988c097967ddfc904e4bf308dadbf9eed153d793), [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914), [`da44247`](https://github.com/santi020k/lumen/commit/da44247c127a77744bdd84ace78b85a9ba586839)]:
  - @santi020k/lumen@1.0.0
  - @santi020k/lumen-core@1.0.0

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

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Add a polymorphic `as` prop to `Stat` so standalone metrics can use an `article` or `section`
  root while preserving `div` as the default. Add `default`, `accent`, and `glass` visual variants
  across Astro, React, and Web Components.

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Restore the `Particles` primitive as a density-controlled field of softly glowing,
  slowly drifting particles across Astro, React, and Web Components. Keep the
  decorative field static-free when reduced motion is requested.

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Use the canonical Santi020k Montserrat family stack across Lumen interface text, including generated
  Watermark tiles, while keeping font loading and the `--ui-font` override under application control.
- Updated dependencies [[`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79), [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79), [`0b68131`](https://github.com/santi020k/lumen/commit/0b681319874b1ad2f6fe68f68df15dc14c6c0922), [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79), [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79), [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79)]:
  - @santi020k/lumen@0.4.0
  - @santi020k/lumen-core@0.4.0

## 0.3.0

### Minor Changes

- [#7](https://github.com/santi020k/lumen/pull/7) [`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f) Thanks [@santi020k](https://github.com/santi020k)! - Add `CodeTabs` to the shared catalog with accessible, synchronized, copyable code examples across
  Astro, React, custom elements, and MCP discovery.

- [#7](https://github.com/santi020k/lumen/pull/7) [`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f) Thanks [@santi020k](https://github.com/santi020k)! - Add a coordinated pnpm consumer rollout command, full-screen dialog layouts across every framework,
  and circular focus treatment for the theme toggle.

### Patch Changes

- [#7](https://github.com/santi020k/lumen/pull/7) [`069b6aa`](https://github.com/santi020k/lumen/commit/069b6aaf1e391aec9830ecaa98a6b9bf8c7420b7) Thanks [@santi020k](https://github.com/santi020k)! - Refine Accordion and Collapsible surfaces with clearer open states, roomier disclosure targets, and more polished hover and focus feedback.

- Updated dependencies [[`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f), [`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f), [`069b6aa`](https://github.com/santi020k/lumen/commit/069b6aaf1e391aec9830ecaa98a6b9bf8c7420b7)]:
  - @santi020k/lumen@0.3.0
  - @santi020k/lumen-core@0.3.0

## 0.2.0

### Minor Changes

- [`485fbc7`](https://github.com/santi020k/lumen/commit/485fbc744d58aa8b364592540d4d14ed6441838a) Thanks [@santi020k](https://github.com/santi020k)! - Add standalone Web Component behavior for FileUpload, Tour, Anchor, Transfer, Mentions, Cascader,
  and TreeSelect. Registered elements now handle file drag-and-drop, tour navigation and openers,
  section scroll spy, collection transfer events, mention filtering and insertion, disclosure state,
  hierarchical keyboard navigation, hidden input synchronization, and selection events without the
  Astro runtime.

- [`81bf725`](https://github.com/santi020k/lumen/commit/81bf7256a1091b0e05cdbf919b5b42691ab861d8) Thanks [@santi020k](https://github.com/santi020k)! - Add wrapped block-code output across framework adapters, refine native accordion disclosure styling,
  and teach the registry and MCP catalog that Astro motion primitives require styles and
  `UIPrimitives`.

- [`485ef4b`](https://github.com/santi020k/lumen/commit/485ef4bc2d56969ba7292ff009c31877cbc3c627) Thanks [@santi020k](https://github.com/santi020k)! - Add a flush Accordion variant for compact FAQ and content-led disclosure lists.

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
- Updated dependencies [[`e6c1737`](https://github.com/santi020k/lumen/commit/e6c17377f79fc2dc27b88166531175917184fd3b), [`81bf725`](https://github.com/santi020k/lumen/commit/81bf7256a1091b0e05cdbf919b5b42691ab861d8), [`241e1b6`](https://github.com/santi020k/lumen/commit/241e1b6e1d0de6e12e4e0b54a3714d69aba49063), [`485ef4b`](https://github.com/santi020k/lumen/commit/485ef4bc2d56969ba7292ff009c31877cbc3c627), [`d7a8a84`](https://github.com/santi020k/lumen/commit/d7a8a8408c03c0c3005e7f0f515e815b59c51c17)]:
  - @santi020k/lumen@0.2.0
  - @santi020k/lumen-core@0.2.0

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

- [`d9b8f71`](https://github.com/santi020k/lumen/commit/d9b8f71158b07fce909224a58451f371766ddf4b) Thanks [@santi020k](https://github.com/santi020k)! - Add React and Elements Calendar parity with generated date grids, hidden input values, month navigation, date selection, min/max clamping, and keyboard focus.

- [`d9b8f71`](https://github.com/santi020k/lumen/commit/d9b8f71158b07fce909224a58451f371766ddf4b) Thanks [@santi020k](https://github.com/santi020k)! - Add React and Elements context menu parity with the Astro right-click and keyboard runtime contract.

- [`bb6a229`](https://github.com/santi020k/lumen/commit/bb6a229f43c2684ae92c84d5216ae803eb6b3118) Thanks [@santi020k](https://github.com/santi020k)! - Add data-display parity by wiring Web Components DataTable and VirtualList behavior and by expanding React DataTable and VirtualList data contracts.

- [`d9b8f71`](https://github.com/santi020k/lumen/commit/d9b8f71158b07fce909224a58451f371766ddf4b) Thanks [@santi020k](https://github.com/santi020k)! - Add React and Elements date range picker parity with the Astro native date input synchronization contract.

- [`3318945`](https://github.com/santi020k/lumen/commit/3318945432b8a2b6d7948cebf2bc9db99cbe6e98) Thanks [@santi020k](https://github.com/santi020k)! - Add Web Components behavior parity for Dialog, Popover, DropdownMenu, Tabs, Select, Toast, and Tooltip, including keyboard interaction, dismissal, focus handling, native select form participation, and the shared toast controller events.

- [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654) - Expand rich text editors with value-bearing commands, keyboard shortcuts, active toolbar states,
  HTML and text change events, accessible editable props, and richer toolbar/content styling.

- [`8d22caf`](https://github.com/santi020k/lumen/commit/8d22caf1521ddaa663a9f392c5a87cf69cb3d436) Thanks [@santi020k](https://github.com/santi020k)! - Add React and Elements form validation parity with the Astro `data-ui-form` runtime contract.

- [`d9b8f71`](https://github.com/santi020k/lumen/commit/d9b8f71158b07fce909224a58451f371766ddf4b) Thanks [@santi020k](https://github.com/santi020k)! - Add React and Elements InputOTP parity with segmented native-input behavior, sanitization, paste handling, and caret navigation.

- [`b6f7d70`](https://github.com/santi020k/lumen/commit/b6f7d7091f099e964371fd75844eb645e858e866) Thanks [@santi020k](https://github.com/santi020k)! - Add a Lucide-backed Icon primitive with shared full-catalog icon names across Astro, React, and Web Components. Credit the upstream Lucide and Feather creators and ship their license notices with the core package.

- [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7) - Preserve framework-native image optimization, lazy-load native images by default, and add opt-in
  dark-theme inversion for monochrome artwork.

- [`255e9fd`](https://github.com/santi020k/lumen/commit/255e9fd43b1d367418d3b3112bc973f510143356) - Add sixteen components to close the gap with enterprise UI libraries (Ant Design, MUI, Mantine, Chakra, React Aria): Stepper, FileUpload, Tour, Anchor, Segmented, Toolbar, Descriptions, Popconfirm, Transfer, Cascader, TreeSelect, Mentions, QRCode, Watermark, Affix, and SpeedDial. Each ships as a thin, token-driven wrapper across Astro (reference), React, and Web Components, with shared CSS and progressive-enhancement runtime for the interactive primitives (FileUpload drag-and-drop, Anchor scroll-spy, Tour step navigation, Transfer list movement, Mentions autocomplete, Cascader and TreeSelect value selection). Toolbar reuses the existing roving-focus runtime and Popconfirm/Cascader/TreeSelect reuse the popover disclosure runtime.

- [`d9b8f71`](https://github.com/santi020k/lumen/commit/d9b8f71158b07fce909224a58451f371766ddf4b) Thanks [@santi020k](https://github.com/santi020k)! - Add React and Elements Resizable parity with pane sizing, generated separator handles, keyboard resizing, pointer resizing, and reset behavior.

- [`b2f179c`](https://github.com/santi020k/lumen/commit/b2f179cc634cb498a9ee3483b602fdbf29055acc) Thanks [@santi020k](https://github.com/santi020k)! - Add React and Elements rich text command parity with the Astro `data-ui-editor-command` runtime contract.

- [`d9b8f71`](https://github.com/santi020k/lumen/commit/d9b8f71158b07fce909224a58451f371766ddf4b) Thanks [@santi020k](https://github.com/santi020k)! - Add React and Elements schedule drag/drop parity with the Astro `ui:schedule-change` runtime contract.

- [`5aab08e`](https://github.com/santi020k/lumen/commit/5aab08e1e765444d16f5e41956dca486128e812f) Thanks [@santi020k](https://github.com/santi020k)! - Add shared ThemeBuilder controller helpers, React `useThemeBuilder`, and Web Components ThemeBuilder behavior for token previews and exports.

### Patch Changes

- [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8) - Complete glass surface support for DatePicker and Select across framework adapters, intensity
  variants, fallback styles, documentation, and examples.

- [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570) Thanks [@santi020k](https://github.com/santi020k)! - Add glass surface tokens, boolean glass props and attributes, and documentation for supported glass surfaces. Expand glass support across layout, data display, feedback, navigation, and editor-style container primitives with matching Astro, React, and Elements examples.

- [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654) - Replace the browser-native DatePicker surface with Lumen's accessible Calendar popover, including localized display values, keyboard navigation, form-backed values, and matching Astro, React, and Elements behavior.

- [`ffe0107`](https://github.com/santi020k/lumen/commit/ffe0107d26ae36c4e5434f538fdc056e467f2eb9) - Present DateRangePicker as a cohesive responsive pair of custom Calendar-backed fields, expose range state for styling, and synchronize composed React DatePicker children automatically.

- [`971c892`](https://github.com/santi020k/lumen/commit/971c8927b143e84241a83c5e9068314b01a88fde) - Expose the shared stylesheet through every framework package so consumers only install and import
  from their selected adapter. Keep `@santi020k/lumen/styles.css` available for umbrella-package
  consumers.

- [`24990c5`](https://github.com/santi020k/lumen/commit/24990c52f458b4a157d22e197e520fc6eec72ce8) Thanks [@santi020k](https://github.com/santi020k)! - Include glass surface variables in generated ThemeBuilder tokens, CSS exports, scoped previews, Figma color variables, and design-token JSON.

- Updated dependencies [[`b30a72a`](https://github.com/santi020k/lumen/commit/b30a72aec1742b0ce39214fbf299099011d1a510), [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f), [`aed151a`](https://github.com/santi020k/lumen/commit/aed151a6ef9f2bf9558dadac328f8f439e73b8c3), [`26053f4`](https://github.com/santi020k/lumen/commit/26053f437784f4f771a7af8ddee8426c5bfc8cc5), [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579), [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8), [`f5c36ab`](https://github.com/santi020k/lumen/commit/f5c36ab1b22daf6f532869c576be97fa22474a43), [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654), [`d802296`](https://github.com/santi020k/lumen/commit/d80229694b15c0c23e8846ed68780fce5222f2dd), [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f), [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402), [`7c6ad35`](https://github.com/santi020k/lumen/commit/7c6ad35e4d55c8a080bee93e58e5260a4258653a), [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402), [`0b6f99e`](https://github.com/santi020k/lumen/commit/0b6f99edf2c3858683ac2370eead964cc618a965), [`64b69c1`](https://github.com/santi020k/lumen/commit/64b69c1ffee89fa43bee7b446ba045a0ffd5f01e), [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654), [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570), [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654), [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f), [`b6f7d70`](https://github.com/santi020k/lumen/commit/b6f7d7091f099e964371fd75844eb645e858e866), [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7), [`255e9fd`](https://github.com/santi020k/lumen/commit/255e9fd43b1d367418d3b3112bc973f510143356), [`5ae75c5`](https://github.com/santi020k/lumen/commit/5ae75c5f60b4fb4382bba9c0634bef8c0721fa96), [`ae13d36`](https://github.com/santi020k/lumen/commit/ae13d363b21dc677dc9a8c16120ae7a07f269390), [`ffe0107`](https://github.com/santi020k/lumen/commit/ffe0107d26ae36c4e5434f538fdc056e467f2eb9), [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579), [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402), [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8), [`160fd16`](https://github.com/santi020k/lumen/commit/160fd16ca51104c3d2b217f333b548f6dbc5f37c), [`ffe0107`](https://github.com/santi020k/lumen/commit/ffe0107d26ae36c4e5434f538fdc056e467f2eb9), [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7), [`e5dcf54`](https://github.com/santi020k/lumen/commit/e5dcf54cb2635406a66ca65cfa53d99423d6235a), [`971c892`](https://github.com/santi020k/lumen/commit/971c8927b143e84241a83c5e9068314b01a88fde), [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7), [`5aab08e`](https://github.com/santi020k/lumen/commit/5aab08e1e765444d16f5e41956dca486128e812f), [`24990c5`](https://github.com/santi020k/lumen/commit/24990c52f458b4a157d22e197e520fc6eec72ce8)]:
  - @santi020k/lumen@0.1.0
  - @santi020k/lumen-core@0.1.0

# @santi020k/lumen-react-native

## 4.0.0

- Reject malformed decoded Agenda event collections, fields and timing, and Carousel slide collections, IDs and labels before rendering or navigation.

- Reject malformed decoded event collections, rows, and date bounds before displaying calendar indicators.

- Reject malformed decoded calendar days before reading fields or rendering calendar grids.

- Honor comparison chart value labels and escaped accessible summaries in Web Components. Reset iOS and web time-picker drafts when controlled values or bounds change, preserving current Android bounds and callback handling.

- Add controlled MultiSelect to React Native and SwiftUI alongside Compose, retaining selections
  outside filtered results, blocking disabled/read-only edits, and exposing loading/retry and localized
  action labels. Forward application safe-area insets into the React Native sheet. Add a complete,
  checked web-to-native catalog audit for the remaining v4 gaps.

### Minor Changes

- Add controlled civil-date Calendar and Agenda plus native KanbanBoard and standalone
  KanbanColumn, with stable identity, localized accessible actions and state guards.

- Add controlled native ColorPicker with bounded hex/rgba parsing, channel editing,
  optional alpha and palettes, retained invalid drafts and localized accessibility.

- Add controlled grouped Command search and hierarchical TreeGrid records with
  localized native controls, retained host state and guarded custom cell actions.

- Add Stepper, Timeline and Breadcrumb contracts across native adapters, with localized
  progress, accessible host content and controlled navigation callbacks.

- Add offline native QRCode encoding and controlled Cascader branch/leaf selection
  across React Native, SwiftUI and Compose, with localized recovery and accessibility.

- Add controlled whole-star Rating with localized option labels, bounded input,
  and disabled/read-only protection. SwiftUI and Compose expose the corresponding native control.

- Add controlled native Schedule day/week grids with all-day bands, collision-safe
  overlap lanes, localized state guards and accessible host rescheduling requests.

- Add native Table and DataTable with controlled manual/client sorting, stable row
  selection, accessible record/table layouts and explicit status/retry states.
  Corresponding SwiftUI and Compose contracts share the same ownership boundaries.

- Add controlled native Carousel paging and Tooltip help with localized accessible
  controls and safe status/disabled guards. Compose tooltip popups now consume Back
  for dismissal instead of closing the host activity.

- Add controlled Tour guidance anchored to measured native targets and Mentions text
  input with atomic text/selection updates, guarded literal suggestion insertion and
  documented native composition boundaries.

- Add controlled native Tree components and graph models for React Native, SwiftUI
  and Compose, with explicit invalid/status states and inherited disabled branches.

- Add controlled native TreeSelect and Transfer with stable identities, retained unknown
  values, disabled ancestry/membership guards and localized accessible selection.

- Add controlled native range filters with independently named and formatted endpoints, domain
  stepping, crossing protection, and disabled/read-only behavior. SwiftUI now exposes the same
  semantic range contract; Compose retains native two-thumb rendering.

- Add CalendarHeatmap, FunnelChart, and BoxPlot across web and native adapters with shared validation,
  semantic chart colors, localized formatting, responsive layouts, and accessible exact data.
  Calendar heatmaps use explicit Gregorian date-only ranges; funnels preserve supplied stage order;
  box plots accept precomputed quartiles, whiskers, and outliers without performing application statistics.

- Add canonical Default, Studio and Glass appearance presets, scoped web styling and ThemeBuilder radius, spacing and border customization. Native adapters expose preset palettes and explicit surface material with opaque fallbacks. Swift and Compose consumers must rebuild for the updated theme and surface signatures; see the appearance presets guide.

- Add BulletChart across Astro, React, Web Components, React Native, SwiftUI, and Compose.
  Compare actual values with targets and labeled qualitative ranges using an honest zero-inclusive
  domain. Preserve missing measurements, localized exact data, responsive typography, and native
  accessibility. Existing chart APIs remain compatible.

- Close advanced-input and media gaps across React Native, SwiftUI and Compose with number, time,
  autocomplete, password, numeric OTP and image comparison controls. Preserve controlled state,
  localized drafts, native secure entry and autofill hints, explicit cancellation and accessible
  adjustment. Add exact bounded decimal, numeric OTP and same-day time helpers for web and native
  consumers, plus bilingual native playground examples and a form-submission error recipe.

- Add canonical per-icon graphic imports through `icons/<name>` for use with the lightweight
  `graphics` entrypoint. Preserve dynamic named root lookups and generate both layouts from the
  shared artwork. Brand paths use `icons/brand-<name>`.

- Repair chart data disclosures with full-width controls, bounded keyboard scrolling, and sticky
  headers across the web adapters. Add WaterfallChart and Histogram to React Native, SwiftUI, and
  Compose, with matching invalid-input behavior, exact values, and native expandable data lists.

- Bring labeled sequential and diverging heatmaps to React Native, SwiftUI, and Compose with
  numeric legends, explicit missing-value markers, responsive axes, and consistent exact-value
  disclosures. Keep duplicate coordinates deterministic and numeric scaling finite at extreme values.

  Swift and Compose consumers should rebuild for the defaulted heatmap options added in v4.

- Improve native sheet scrolling, dismissal protection, keyboard integration, and accessibility text
  layouts. React Native sheets accept explicit initial and return focus targets. Required-field and
  tab-panel descriptions are caller-localizable in React Native and Compose. SwiftUI rows and section
  headers stack at accessibility text sizes. SwiftUI and Compose consumers must rebuild for the
  updated sheet signatures; application-owned lazy or virtualized sheet content should disable the
  additional scrolling wrapper.

  Add the optional React Native foundations entrypoint, which shares root implementations and avoids eager full-catalog imports.

  Native horizontal button groups wrap or stack when space is limited and switch to vertical layouts at accessibility text sizes.

  Add an optional React Native graphics entrypoint for statically imported, app-owned SVG components. It shares root icon behavior while avoiding the full named catalog; root name and custom icon APIs remain available.

- Add LollipopChart and DumbbellChart across Astro, React, Elements, React Native, SwiftUI, and Compose.
  The charts preserve missing values, share a zero-inclusive domain, and provide readable exact data.
  Refine BulletChart with a slimmer track, quieter range bands, and a capped target marker.

### Patch Changes

- Keep inactive carousel pages out of web focus and accessibility paths, hide decorative breadcrumb separators, and provide explicit final Timeline item connectors. Swift color parsing rejects non-ASCII hexadecimal graphemes; Swift and Compose rich-text replacement reject malformed span offsets before arithmetic. The React Native RichTextEditor remains deferred with no additional native dependency.

- Give native Checkbox an explicit accessible name while preserving host overrides.
  Native parity integration also fixes React Native Calendar container sizing and
  Compose Button default text/icon content color inheritance.

  Expose checked and disabled state for native web checkbox and palette/carousel radio
  controls. Default nested React Native and SwiftUI text and icons inherit their button foreground while
  explicit tones and colors remain supported. Announce localized DataTable sort direction
  and hide stale controls for an empty error message.

  Swift quiet buttons now accept taps across their full padded shape, including sparse compound command labels.

- Prevent a shared Combobox observer loop when an open field becomes disabled or read-only. Keep Android TimeField bounds, error labels, and callbacks current while its native dialog is open. Preserve localized negative Swift NumberField drafts and repeated stepping in Arabic and Persian locales.

- Vertically center Picker option labels within their touch targets to match the selected-value trigger.

- Respect Android accessibility time-to-action settings when automatically dismissing native toasts.
  Never shorten the requested duration; retain it if the native timeout recommendation fails or is
  invalid. Ignore stale recommendations after updates, dismissal, eviction, clearing or unmount,
  while preserving persistent toasts and iOS/web durations.

- Announce Toast and ErrorState title/description updates on iOS using native accessibility APIs.
  Polite announcements queue behind speech; assertive errors interrupt it, and off disables error
  announcements. Avoid repeated speech for unchanged copy while retaining Android/web live regions
  and independently operable actions.

- Allow navigation destination labels to wrap at accessibility text sizes instead of truncating their visible names.

- Expose Slider tracks as accessible adjustable controls on native platforms so screen readers can
  reach their value and increment/decrement actions.

- Align Slider touch and drag values with native right-to-left layouts. Position the thumb from the
  logical leading edge while preserving numeric screen-reader increment and decrement actions.

- Updated dependencies [`dcbb1c0`, `c71c50a`, `7163f95`, `ef5187d`, `788125f`, `55a1032`, `551f903`, `85f332c`, `0ea4a4e`, `bd11bc0`, `7a17060`, `79d9b0a`, `edf9cbe`, `059aae9`, `bd11bc0`, `aba0839`]:
  - @santi020k/lumen-core@4.0.0

- Polish shared Select keyboard activation, accessible popup names, and focus-leave dismissal.
  Use enhanced Lumen selectors for documentation theme and scope controls, retaining progressive
  enhancement and resilient preference handling.

  Refresh compatible dependencies and remove unused MDX support, the duplicate root Next
  declaration, the monolithic MCP SDK, and obsolete dependency overrides. Migrate MCP to the
  split v2 SDK with unchanged stdio, HTTP, and Worker wire contracts. Programmatic consumers
  must use v2 SDK transports and types with the returned server object; see the v4 migration guide.

  Regenerate the shared Lucide catalog with four additional icon names and updated nut artwork.
  Swift exhaustive icon switches must handle the new cases or provide an unknown default.

  Batch React ImageComparison form resets into one scheduled update and cancel pending work
  during cleanup, preserving controlled values and canceled resets.

- Updated dependencies []:
  - @santi020k/lumen-core@4.0.0

- Fit line, bar, scatter, range, and combo chart geometry to the available container width. Keep every plotted value visible on phones with readable axis text and a compact plot height, and resize when the container changes.

  Fit web bar charts to narrow cards across Astro, React, and Web Components, reserving more room for horizontal category labels and spacing value-axis labels to avoid overlap.

- Validate decoded heatmap cells through the shared normalizeLumenHeatmapData helper before geometry or native category formatting. Fail closed for malformed rows while preserving unavailable measurements. Execute React rich-text toolbar and keyboard commands in the editor root's owning document, including same-origin iframe portals.
- Updated dependencies []:
  - @santi020k/lumen-core@4.0.0

- Avoid calling application BulletChart formatters when measurements or configuration are invalid; render the invalid-data fallback consistently across web and native adapters.

- Reject malformed Astro Bullet range containers, exclude missing heatmap observations from drilldown formatters and targets, keep generated code-region names current after label updates and reconnects, and safely format native image comparison percentages with malformed locales.

- Preserve regex literals during source migration with the existing TypeScript compiler parser as a runtime dependency; leave parser-exhausting input unchanged for manual review and recognize manifests on platform-native paths. Reject malformed serialized heatmap datasets atomically and guard native time display against malformed locales while preserving hour-format preferences.

### Native Advanced Inputs

- Add React Native and SwiftUI number, time, autocomplete, password, numeric OTP and image comparison
  controls alongside Compose. Add exact decimal, numeric OTP and same-day time helpers in Core,
  bilingual playground examples and an application-owned form-error summary recipe.

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

### Major Changes

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

- [#73](https://github.com/santi020k/lumen/pull/73) [`95300bd`](https://github.com/santi020k/lumen/commit/95300bd00a5b4e6d1507015f3052c033b975beb2) Thanks [@santi020k](https://github.com/santi020k)! - Keep adaptive Compose content and React Native overlay actions clear of Android system navigation,
  and make React Native alert and sheet content reachable in constrained viewports.
- Updated dependencies [`484880b`]:
  - @santi020k/lumen-core@3.0.0

## 2.1.0

### Minor Changes

- Complete the v2 consumer-improvement contracts: localizable chart support copy, semantic native
  chart references and datum tones, richer SwiftUI form composition, adaptive native layouts,
  success actions, contextual React Native fields, complete CopyButton and reveal semantics,
  component-aware diagnostics, explicit shared-library integration boundaries, packed Astro runtime
  coverage, rendered migration checks, and adoption-ready registry output.

### Patch Changes

- Improve native control semantics and accessibility: preserve semantic SwiftUI button roles,
  expose loading icon buttons and spinner tints, keep disabled quiet Compose buttons transparent,
  allow status messages to reflow, make the full React Native toggle row interactive, preserve its
  supporting guidance, and give native selection rows and search actions density-aware targets.
  Keep compact chip removal independently operable with an explicit WCAG-sized target, and ensure
  React Native toast and banner dismissal controls meet native touch-target guidance. Align native
  live feedback for toast and field-group validation updates, and keep Compose required labels to one
  unambiguous accessibility description.

- Keep long native tab lists horizontally reachable, expose complete web tab semantics, and support
  Arrow-key navigation while skipping disabled tabs.
- Updated dependencies [`da315f0`]:
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
  - @santi020k/lumen-core@2.0.0

## 1.1.0

### Minor Changes

- [#51](https://github.com/santi020k/lumen/pull/51) [`a57df97`](https://github.com/santi020k/lumen/commit/a57df97fc15c317ba90851cb7fc5f989d1a19c09) Thanks [@santi020k](https://github.com/santi020k)! - Publish the second ordinary React Native stability iteration from the frozen supported API
  baseline. This release carries the reviewed v2 contract corrections through a real consumer
  upgrade without changing the supported surface.

### Patch Changes

- Updated dependencies [[`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082), [`3fb570d`](https://github.com/santi020k/lumen/commit/3fb570d7226780ce6d0d5ff09d2d22121bf1e7f0), [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082), [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082), [`888187c`](https://github.com/santi020k/lumen/commit/888187c7f5f244f0bf14610a0fdb2e876dfe7082)]:
  - @santi020k/lumen-core@1.8.0

## 1.0.0

### Minor Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add dependency-free controlled Picker, adjustable Slider, and accessible Gauge components so the
  shared phone control contract is available across React Native, SwiftUI, and Compose.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add a shared ErrorState contract and accessible recovery surface for unavailable regions and pages,
  with error and offline contexts, compact and page layouts, explicit live-region policy, safe support
  references, application-owned actions, and an error-handling decision guide.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Expand shared surface radii for app-owned mobile cards and media, and improve SwiftUI product
  adaptation with palette overrides, optional tint ownership, configurable card geometry, and
  status icons that do not communicate state through color alone.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Align React Native and Compose cards with the shared native surface scale, and give status bars
  tone-specific icons with product-level overrides so status is not communicated by color alone.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add native hook controllers for disclosure and dialog visibility, tabs, selection, language,
  themes, and toast queues. The hooks preserve reusable React state semantics while returning props
  adapted to React Native Lumen components without DOM or browser-runtime dependencies.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add a canonical generated illustration catalog, shared graphics tokens, and cross-platform image
  presentation contracts with native React Native, SwiftUI, and Jetpack Compose implementations.
  Web images also gain shared contain or cover fitting and semantic corner-radius options.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Freeze the supported React Native component surface for the first ordinary pre-2 stability
  iteration alongside the SwiftUI and Jetpack Compose adapters. Newly added experimental APIs remain
  explicitly outside the frozen contract.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled native date and date-range fields across React Native, SwiftUI, and Jetpack Compose,
  with system picker behavior, bounds, coordinated range values, and validation context.

- [#40](https://github.com/santi020k/lumen/pull/40) [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb) Thanks [@santi020k](https://github.com/santi020k)! - Add a controlled, accessible `LumenTabs` primitive to the React Native, SwiftUI, and Jetpack
  Compose adapters, with native gallery examples and shared documentation.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Expand Lumen data visualization with generated cross-platform chart tokens, numeric and time
  scales, validation, summaries, downsampling and live-window helpers, conformance fixtures, and
  accessible scatter, bubble, heatmap, range, and combo renderers. Add native chart families for
  React Native, SwiftUI, and Compose, plus semantic summaries and fallback data across adapters.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add cross-platform phone input contracts for web, React Native, SwiftUI, and Jetpack Compose with
  localized country metadata, supplementary flags, calling codes, as-you-type formatting,
  metadata-backed validation, and E.164 output.

### Patch Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Make the authored Lumen light palette the canonical default across web, React Native, SwiftUI, and
  Compose, keep semantic theme overrides intact, and allow built-in web themes on nested boundaries.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Allow application-defined semantic color values in the public React Native theme contract so
  consumer themes can be passed to `LumenProvider` without unsafe casts.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Expose meaningful required-field labels and exact validation context across native grouped,
  multiline, and date-range controls without replacing consumer-supplied accessibility guidance.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Expose disabled accessibility state consistently from React Native text fields, textareas, search
  fields, chip removal actions, and phone inputs, including country selectors with an empty allow-list.
  Preserve caller-supplied accessibility state and prevent buttons from being assigned a non-button
  accessibility role. Run rendered TSX component behavior tests in the standard React Native package
  suite so these semantics remain covered in CI. Announce validation context from React Native date,
  phone, and multiline controls without dropping consumer accessibility props, and keep SwiftUI
  textarea values distinct from their validation hints.
  Dismiss React Native date, generic, and phone-country pickers when their controls become disabled,
  keep them closed after re-enabling until the next user action, and disable generic pickers with no
  available options.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Graduate the React Native phone contract and the Compose phone and Wear compositions into the
  supported Lumen 2 surface. Remove obsolete Kotlin opt-in annotations, publish accurate React Native
  peer-install guidance, document the separate Wear OS artifact, and replace the incompatible public
  Expo Go launch link with supported browser and local-native playground paths. Restart the two-release
  stability soak from the newly frozen stable baselines.

  Declare visionOS 1 support for the SwiftUI application product, include visionOS in API-baseline
  and clean-consumer verification, and keep the WidgetKit product on its accurate iOS, iPadOS,
  macOS, and watchOS contract until its visionOS 26 rendering dependency can be adopted deliberately.

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
- Updated dependencies [[`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92)]:
  - @santi020k/lumen-core@1.7.0

## 1.0.0-rc.0

### Major Changes

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Promote the React Native adapter to its first release-candidate contract alongside the SwiftUI
  and Jetpack Compose candidates. This release freezes the supported native component surface for
  consumer soak testing while newly added experimental APIs remain explicitly non-stable.

### Minor Changes

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add a canonical generated illustration catalog, shared graphics tokens, and cross-platform image
  presentation contracts with native React Native, SwiftUI, and Jetpack Compose implementations.
  Web images also gain shared contain or cover fitting and semantic corner-radius options.

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled native date and date-range fields across React Native, SwiftUI, and Jetpack Compose,
  with system picker behavior, bounds, coordinated range values, and validation context.

- [#40](https://github.com/santi020k/lumen/pull/40) [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb) Thanks [@santi020k](https://github.com/santi020k)! - Add a controlled, accessible `LumenTabs` primitive to the React Native, SwiftUI, and Jetpack
  Compose adapters, with native gallery examples and shared documentation.

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
- Updated dependencies [[`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92)]:
  - @santi020k/lumen-core@1.7.0-rc.0

## 0.5.0

### Minor Changes

- [#36](https://github.com/santi020k/lumen/pull/36) [`1c4de1b`](https://github.com/santi020k/lumen/commit/1c4de1bbf7d2414896b04c69f2b6810f10b4a0dd) Thanks [@santi020k](https://github.com/santi020k)! - Add the complete generated cross-platform Lumen icon catalog with 1,777 Lucide-backed interface
  icons and 573 namespaced Font Awesome Free brand icons. Expose semantic names through React Native,
  SwiftUI, and Compose icon and icon-button APIs while preserving custom graphic components, SF
  Symbols, and `ImageVector` values as native escape hatches. Generated packages retain the Lucide,
  Feather, and Font Awesome attribution and license notices. Public platform guides and native
  component references link to the searchable interface and brand catalogs and document each
  platform's generated name syntax and discovery collection.

## 0.4.0

### Minor Changes

- [#33](https://github.com/santi020k/lumen/pull/33) [`dbd8430`](https://github.com/santi020k/lumen/commit/dbd8430aca1f935f4ac1dcb201bda2f4e7f52663) Thanks [@santi020k](https://github.com/santi020k)! - Add a token-aware SwiftUI `LumenLink`, rich and locally controlled SwiftUI disclosure labels,
  availability-safe native tab-bar minimization, adaptive tab accessories, and developed native
  composition guidance for settings, dense rows, asynchronous states, metrics, navigation, and
  adaptive actions. Add threshold-based nested-scroll navigation behavior for Compose and a dependency-
  free visibility controller with an animated collapsible navigation bar for React Native while
  retaining platform-owned navigation, scrolling, and lifecycle behavior.

  Add cross-adapter destination re-selection and accessible dot, text, and capped count badges;
  compact Compose and React Native navigation accessories; Material adaptive bar/rail navigation for
  Android; and Compose floating actions that can hide or follow scroll-responsive navigation.

## 0.3.0

### Minor Changes

- [#30](https://github.com/santi020k/lumen/pull/30) [`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce) Thanks [@santi020k](https://github.com/santi020k)! - Add token-aware `Graphic`, `Backdrop`, and `Illustration` primitives across Astro, React, Elements,
  React Native, SwiftUI, and Compose. Shared decorative presets frame application artwork, add ambient
  patterns behind content, and provide semantic empty, success, error, and offline scenes without
  bundling platform-specific bitmap assets.

- [#30](https://github.com/santi020k/lumen/pull/30) [`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce) Thanks [@santi020k](https://github.com/santi020k)! - Add a controlled native navigation bar with selected and disabled destination semantics. SwiftUI
  and Compose gain matching native APIs while applications retain ownership of routing and history.

- [#30](https://github.com/santi020k/lumen/pull/30) [`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled alert-dialog, sheet, and anchored-menu contracts across React Native, SwiftUI, and
  Compose. Add token-aware share buttons that delegate destination selection to each operating
  system while keeping application content and presentation state host-owned.

## 0.2.0

### Minor Changes

- [#28](https://github.com/santi020k/lumen/pull/28) [`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75) Thanks [@santi020k](https://github.com/santi020k)! - Add intentionally platform-specific native controls without requiring artificial adapter parity.
  React Native gains a semantic pull-to-refresh control, SwiftUI gains a bounded date field with
  validation context, and Compose gains a Material floating action button with Lumen intents and sizes.

## 0.1.0

### Minor Changes

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Add shared Toggle, SettingsRow, SearchField, Checkbox, RadioGroup, SegmentedControl, Textarea,
  FieldGroup, Chip, ButtonGroup, Toast, Skeleton, Disclosure, EmptyState, ListRow, Banner, Stat,
  SectionHeader, and StatusBar components with semantic tones, flexible native content slots, and
  explicit accessibility behavior.

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

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Support React Native 0.86 so applications can use the package with the current stable Expo SDK.
  Correct destructive banner colors to use the shared danger tone.

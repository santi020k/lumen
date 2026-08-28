# @santi020k/lumen

## 1.7.0

### Minor Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add a shared ErrorState contract and accessible recovery surface for unavailable regions and pages,
  with error and offline contexts, compact and page layouts, explicit live-region policy, safe support
  references, application-owned actions, and an error-handling decision guide.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Expand shared surface radii for app-owned mobile cards and media, and improve SwiftUI product
  adaptation with palette overrides, optional tint ownership, configurable card geometry, and
  status icons that do not communicate state through color alone.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Extend `lumen doctor-native` with a registry-derived, non-authoritative adoption inventory and an
  Android JDK, SDK, platform-package, and conditional NDK preflight. Emit both readable and JSON
  reports, and fail only when a required local toolchain dependency is unavailable.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add `LumenTextContent` to preserve SwiftUI localization keys, localization resources, and verbatim
  runtime strings across common text, field, validation, accessibility, and action boundaries. Add a
  live English and Spanish playground example driven by application-owned locale state.

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

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add the focused `LumenWidgetUI` Swift Package product with generated semantic tokens and
  WidgetKit-safe text, icon, badge, and compact-stat treatments for full-color, accented, vibrant,
  increased-contrast, and large-text rendering.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add a dry-run-first `lumen migrate v2` workflow that safely previews and applies the accepted Astro
  runtime-import and visual-size migrations, reports ambiguous cases for manual review, and remains
  idempotent across repeated runs.

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

### Patch Changes

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Attach Compose date and phone validation errors directly to their actionable controls so TalkBack
  announces invalid context when users focus the date button or editable phone field. Dismiss open
  date, picker, and phone-country overlays when their controls become disabled, and keep empty pickers
  unavailable so disabled state cannot leak later selection callbacks.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Make the authored Lumen light palette the canonical default across web, React Native, SwiftUI, and
  Compose, keep semantic theme overrides intact, and allow built-in web themes on nested boundaries.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Keep the Lumen v2 source migrator out of generated, cached, and vendored dependency trees, including
  SwiftPM and Xcode build checkouts, CocoaPods, framework build output, and common web-tool caches.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Align native text-field validation semantics so an error message implies an invalid Compose field,
  while SwiftUI preserves the entered accessibility value and announces validation separately.

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

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Harden external registry loading and installation with bounded manifest reads, strict manifest
  metadata, relative inline-file paths, duplicate-path rejection, and symbolic-link escape protection.
  Keep self-hosted and Worker MCP transports behind safe JSON error boundaries, expose catalog
  readiness, and fail closed when abuse protection is unavailable. Freeze the MCP, React Hook Form,
  and brand-icon public exports in the reviewed web API baseline alongside the rendering packages.

- [#43](https://github.com/santi020k/lumen/pull/43) [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105) Thanks [@santi020k](https://github.com/santi020k)! - Add the canonical `ToastViewport` contract across web adapters, retain `Sonner` as a deprecated
  1.x compatibility alias, and teach the Lumen 2 migrator to rename imports and custom elements
  without losing viewport configuration or children.

- [#40](https://github.com/santi020k/lumen/pull/40) [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb) Thanks [@santi020k](https://github.com/santi020k)! - Correct the SwiftUI tvOS availability contract so the package builds from its declared tvOS 16
  baseline, with platform-native exclusions documented for textarea, share, and menu controls.

- [#40](https://github.com/santi020k/lumen/pull/40) [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb) Thanks [@santi020k](https://github.com/santi020k)! - Freeze the consumer-validated Wear OS theme, tone, action, progress, and status contracts as
  Supported. Mark the metric and list-row evaluation APIs with an explicit opt-in, and remove
  implementation-only sizing and progress helpers from the public Wear ABI before native stability.

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

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add cross-platform phone input contracts for web, React Native, SwiftUI, and Jetpack Compose with
  localized country metadata, supplementary flags, calling codes, as-you-type formatting,
  metadata-backed validation, and E.164 output.
- Updated dependencies [[`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`b318703`](https://github.com/santi020k/lumen/commit/b318703196b134d08c9c58c04ed5c743c8b6c105), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92)]:
  - @santi020k/lumen-core@1.7.0

## 1.7.0-rc.0

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

### Patch Changes

- [#40](https://github.com/santi020k/lumen/pull/40) [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb) Thanks [@santi020k](https://github.com/santi020k)! - Correct the SwiftUI tvOS availability contract so the package builds from its declared tvOS 16
  baseline, with platform-native exclusions documented for textarea, share, and menu controls.

- [#40](https://github.com/santi020k/lumen/pull/40) [`909483d`](https://github.com/santi020k/lumen/commit/909483df12f71eca7df403d6ccd4147f7f272beb) Thanks [@santi020k](https://github.com/santi020k)! - Freeze the consumer-validated Wear OS theme, tone, action, progress, and status contracts as
  Supported. Mark the metric and list-row evaluation APIs with an explicit opt-in, and remove
  implementation-only sizing and progress helpers from the public Wear ABI before native stability.

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

- [#41](https://github.com/santi020k/lumen/pull/41) [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92) Thanks [@santi020k](https://github.com/santi020k)! - Add cross-platform phone input contracts for web, React Native, SwiftUI, and Jetpack Compose with
  localized country metadata, supplementary flags, calling codes, as-you-type formatting,
  metadata-backed validation, and E.164 output.
- Updated dependencies [[`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92), [`9b1542a`](https://github.com/santi020k/lumen/commit/9b1542a850392c8dd7d2d8dc63aba19fcdc09c92)]:
  - @santi020k/lumen-core@1.7.0-rc.0

## 1.6.0

### Minor Changes

- [#36](https://github.com/santi020k/lumen/pull/36) [`1c4de1b`](https://github.com/santi020k/lumen/commit/1c4de1bbf7d2414896b04c69f2b6810f10b4a0dd) Thanks [@santi020k](https://github.com/santi020k)! - Add the complete generated cross-platform Lumen icon catalog with 1,777 Lucide-backed interface
  icons and 573 namespaced Font Awesome Free brand icons. Expose semantic names through React Native,
  SwiftUI, and Compose icon and icon-button APIs while preserving custom graphic components, SF
  Symbols, and `ImageVector` values as native escape hatches. Generated packages retain the Lucide,
  Feather, and Font Awesome attribution and license notices. Public platform guides and native
  component references link to the searchable interface and brand catalogs and document each
  platform's generated name syntax and discovery collection.

## 1.5.0

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

- [#33](https://github.com/santi020k/lumen/pull/33) [`dbd8430`](https://github.com/santi020k/lumen/commit/dbd8430aca1f935f4ac1dcb201bda2f4e7f52663) Thanks [@santi020k](https://github.com/santi020k)! - Publish a cross-platform release manifest, expose it through the MCP server, and add
  `lumen doctor-native` for read-only Swift and Compose version, resolver-pin, and theme-placement
  diagnostics. Extend the web doctor with advisory suggestions for likely hand-built dropdown, theme,
  dialog-focus, and keyboard-menu behavior while preserving application-specific compositions.

- [#33](https://github.com/santi020k/lumen/pull/33) [`dbd8430`](https://github.com/santi020k/lumen/commit/dbd8430aca1f935f4ac1dcb201bda2f4e7f52663) Thanks [@santi020k](https://github.com/santi020k)! - Add focused watchOS and Wear OS component contracts for round essential actions, circular progress,
  compact statuses, at-a-glance metrics, and wearable list rows. Publish Wear OS through the separate
  `lumen-compose-wear` artifact, make the Swift package genuinely compile for its declared watchOS
  platform, and keep watch lifecycle and domain behavior application-owned.

## 1.4.0

### Minor Changes

- [#30](https://github.com/santi020k/lumen/pull/30) [`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce) Thanks [@santi020k](https://github.com/santi020k)! - Add token-aware `Graphic`, `Backdrop`, and `Illustration` primitives across Astro, React, Elements,
  React Native, SwiftUI, and Compose. Shared decorative presets frame application artwork, add ambient
  patterns behind content, and provide semantic empty, success, error, and offline scenes without
  bundling platform-specific bitmap assets.

- [#30](https://github.com/santi020k/lumen/pull/30) [`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled alert-dialog, sheet, and anchored-menu contracts across React Native, SwiftUI, and
  Compose. Add token-aware share buttons that delegate destination selection to each operating
  system while keeping application content and presentation state host-owned.

### Patch Changes

- Updated dependencies [[`6299eae`](https://github.com/santi020k/lumen/commit/6299eaefd2f09d50c10105eb81dc1e21e9e644ce)]:
  - @santi020k/lumen-core@1.4.0

## 1.3.0

### Minor Changes

- [#28](https://github.com/santi020k/lumen/pull/28) [`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75) Thanks [@santi020k](https://github.com/santi020k)! - Add controlled and uncontrolled language-toggle behavior across the shared core, Astro, React, and
  Elements adapters, including persistence, document-language synchronization, accessible labels,
  events, and a React hook. Add discoverable dropdown-menu trigger, content, item, separator,
  disabled, and status contracts across Astro and React.

- [#28](https://github.com/santi020k/lumen/pull/28) [`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75) Thanks [@santi020k](https://github.com/santi020k)! - Add intentionally platform-specific native controls without requiring artificial adapter parity.
  React Native gains a semantic pull-to-refresh control, SwiftUI gains a bounded date field with
  validation context, and Compose gains a Material floating action button with Lumen intents and sizes.

- [#28](https://github.com/santi020k/lumen/pull/28) [`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75) Thanks [@santi020k](https://github.com/santi020k)! - Let SwiftUI and Compose applications integrate product-owned themes through public native APIs.
  Swift palettes now have a public initializer and can be injected without forcing the preferred
  system appearance. Compose can map an existing Material 3 color scheme into Lumen semantic roles,
  preserve explicit product colors, and reuse product typography and shapes through one provider.
  Move consumable Compose plugin versions to the standalone settings boundary, enforce Android lint
  warnings as errors, refresh the native toolchain baseline, and document release-pinned installation.

### Patch Changes

- Updated dependencies [[`f2bd75a`](https://github.com/santi020k/lumen/commit/f2bd75a4fcae423d1096bdffc33591025c13eb75)]:
  - @santi020k/lumen-core@1.3.0

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

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Expose native element refs through the React Avatar and Separator component contracts so shared UI
  packages can replace compatibility wrappers without giving up focus or measurement access. Include
  React Native and the complete Lumen package family in rollout inventories and verification routing,
  and preserve the first repository when an inventory is run without an optional target version.

- [#25](https://github.com/santi020k/lumen/pull/25) [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684) Thanks [@santi020k](https://github.com/santi020k)! - Improve package discovery with framework-specific documentation homepages and npm search keywords.

- Updated dependencies [[`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684), [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684), [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684), [`2c480eb`](https://github.com/santi020k/lumen/commit/2c480eb61ff3e14d526fd1f528f9c0a7d1591684)]:
  - @santi020k/lumen-core@1.2.0

## 1.1.0

### Minor Changes

- [`e5a6b36`](https://github.com/santi020k/lumen/commit/e5a6b366ed28a5513c375afb3f36ac26117b749f) Thanks [@santi020k](https://github.com/santi020k)! - Make `lumen doctor` workspace-aware, ignore generated build trees, parse real adapter imports,
  recognize controlled Astro toggles, and deduplicate diagnostics. Preserve native form-control
  `size` across adapters while adding explicit Astro `visualSize` and Elements `visual-size` styling
  contracts with pre-1.0 alias compatibility.

### Patch Changes

- Updated dependencies [[`e5a6b36`](https://github.com/santi020k/lumen/commit/e5a6b366ed28a5513c375afb3f36ac26117b749f)]:
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

- [#13](https://github.com/santi020k/lumen/pull/13) [`988c097`](https://github.com/santi020k/lumen/commit/988c097967ddfc904e4bf308dadbf9eed153d793) Thanks [@santi020k](https://github.com/santi020k)! - Add five installable, multi-framework product template recipes for analytics, SaaS administration,
  commerce, project workspaces, and authentication/onboarding.

### Patch Changes

- [#13](https://github.com/santi020k/lumen/pull/13) [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914) Thanks [@santi020k](https://github.com/santi020k)! - Parse token declarations in linear time to prevent crafted CSS from slowing down token audits.

- Updated dependencies [[`6e84499`](https://github.com/santi020k/lumen/commit/6e84499b05e1e3cda0087e686db88663de351c48), [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914), [`46c2aca`](https://github.com/santi020k/lumen/commit/46c2aca5bac0579f8265b77a4991a7c640903914), [`32448b0`](https://github.com/santi020k/lumen/commit/32448b02030177788ebcdbb4ee91eb55f3bbfbff), [`da44247`](https://github.com/santi020k/lumen/commit/da44247c127a77744bdd84ace78b85a9ba586839)]:
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

### Patch Changes

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Add a polymorphic `as` prop to `Stat` so standalone metrics can use an `article` or `section`
  root while preserving `div` as the default. Add `default`, `accent`, and `glass` visual variants
  across Astro, React, and Web Components.

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Restore the `Particles` primitive as a density-controlled field of softly glowing,
  slowly drifting particles across Astro, React, and Web Components. Keep the
  decorative field static-free when reduced motion is requested.

- [#9](https://github.com/santi020k/lumen/pull/9) [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79) Thanks [@santi020k](https://github.com/santi020k)! - Use the canonical Santi020k Montserrat family stack across Lumen interface text, including generated
  Watermark tiles, while keeping font loading and the `--ui-font` override under application control.
- Updated dependencies [[`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79), [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79), [`0b68131`](https://github.com/santi020k/lumen/commit/0b681319874b1ad2f6fe68f68df15dc14c6c0922), [`43197cc`](https://github.com/santi020k/lumen/commit/43197cc6d3c8fd831cb28f247b1212329ab67d79)]:
  - @santi020k/lumen-core@0.4.0

## 0.3.0

### Minor Changes

- [#7](https://github.com/santi020k/lumen/pull/7) [`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f) Thanks [@santi020k](https://github.com/santi020k)! - Add `CodeTabs` to the shared catalog with accessible, synchronized, copyable code examples across
  Astro, React, custom elements, and MCP discovery.

- [#7](https://github.com/santi020k/lumen/pull/7) [`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f) Thanks [@santi020k](https://github.com/santi020k)! - Add a coordinated pnpm consumer rollout command, full-screen dialog layouts across every framework,
  and circular focus treatment for the theme toggle.

### Patch Changes

- [#7](https://github.com/santi020k/lumen/pull/7) [`069b6aa`](https://github.com/santi020k/lumen/commit/069b6aaf1e391aec9830ecaa98a6b9bf8c7420b7) Thanks [@santi020k](https://github.com/santi020k)! - Refine Accordion and Collapsible surfaces with clearer open states, roomier disclosure targets, and more polished hover and focus feedback.

- Updated dependencies [[`325ad43`](https://github.com/santi020k/lumen/commit/325ad438380de27f4cba8eda6878a2aad7a2b33f)]:
  - @santi020k/lumen-core@0.3.0

## 0.2.0

### Minor Changes

- [`81bf725`](https://github.com/santi020k/lumen/commit/81bf7256a1091b0e05cdbf919b5b42691ab861d8) Thanks [@santi020k](https://github.com/santi020k)! - Add wrapped block-code output across framework adapters, refine native accordion disclosure styling,
  and teach the registry and MCP catalog that Astro motion primitives require styles and
  `UIPrimitives`.

- [`241e1b6`](https://github.com/santi020k/lumen/commit/241e1b6e1d0de6e12e4e0b54a3714d69aba49063) Thanks [@santi020k](https://github.com/santi020k)! - Add migration-friendly link, pill, toggle, navigation menu, and sidebar contracts. Links now support
  safe new-tab handling and inherited presentation, pills can render as links, Astro toggles expose a
  cancelable controlled-state intent, navigation surfaces can opt out of Lumen presentation, and
  Astro tabs can generate relationships, persist selection, synchronize groups, and emit changes.
  The Astro theme toggle now switches and persists configured themes with the same circular reveal
  used by the other framework adapters while respecting reduced-motion and touch preferences.
  Astro component class props now preserve the nullable native attribute type for strict passthrough.
  Cards and button links can also opt out of presentation while preserving their public semantic
  contract and stable class hook.
  The umbrella CLI can audit existing stylesheets for semantic-token name collisions with incompatible
  complete CSS color values before migration.
  Astro also warns about unsupported named Lucide icons during development and documents the custom
  SVG slot for brand marks.
  Framework packages also expose a Tailwind layer-order prelude so utilities reliably override Lumen
  component display, spacing, radius, width, and responsive visibility defaults.

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
- Updated dependencies [[`e6c1737`](https://github.com/santi020k/lumen/commit/e6c17377f79fc2dc27b88166531175917184fd3b), [`d7a8a84`](https://github.com/santi020k/lumen/commit/d7a8a8408c03c0c3005e7f0f515e815b59c51c17)]:
  - @santi020k/lumen-core@0.2.0

## 0.1.0

### Minor Changes

- [`b30a72a`](https://github.com/santi020k/lumen/commit/b30a72aec1742b0ce39214fbf299099011d1a510) - Add `AnimatedNumber` and `RevealGroup`, and extend `ScrollReveal` with shared duration, delay,
  threshold, and repeat controls across Astro, React, Elements, metadata, runtime behavior, and
  standalone styles. Overlay entrances now use the canonical Lumen motion tokens.
  Astro `ButtonLink` controls now share the same subtle CSS hover lift as `Button`, while directional
  arrow motion remains as a navigation cue.

- [`aed151a`](https://github.com/santi020k/lumen/commit/aed151a6ef9f2bf9558dadac328f8f439e73b8c3) - Generalize AnimatedLogo into an accessible wrapper for arbitrary inline SVG logos, with shared reveal and opt-in sequenced animation styles plus reduced-motion support.

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

- [`64b69c1`](https://github.com/santi020k/lumen/commit/64b69c1ffee89fa43bee7b446ba045a0ffd5f01e) Thanks [@santi020k](https://github.com/santi020k)! - Add framework targets to `lumen add` so component wrappers and bundled recipe starters can be generated for Astro, React, and custom elements.

- [`b6f7d70`](https://github.com/santi020k/lumen/commit/b6f7d7091f099e964371fd75844eb645e858e866) Thanks [@santi020k](https://github.com/santi020k)! - Add a Lucide-backed Icon primitive with shared full-catalog icon names across Astro, React, and Web Components. Credit the upstream Lucide and Feather creators and ship their license notices with the core package.

- [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7) - Preserve framework-native image optimization, lazy-load native images by default, and add opt-in
  dark-theme inversion for monochrome artwork.

- [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8) - Improve SpeedDial with rendered action icons, polished directional motion, an initial-open option,
  and complete click, dismissal, and keyboard menu behavior.

- [`971c892`](https://github.com/santi020k/lumen/commit/971c8927b143e84241a83c5e9068314b01a88fde) - Expose the shared stylesheet through every framework package so consumers only install and import
  from their selected adapter. Keep `@santi020k/lumen/styles.css` available for umbrella-package
  consumers.

- [`5aab08e`](https://github.com/santi020k/lumen/commit/5aab08e1e765444d16f5e41956dca486128e812f) Thanks [@santi020k](https://github.com/santi020k)! - Add shared ThemeBuilder controller helpers, React `useThemeBuilder`, and Web Components ThemeBuilder behavior for token previews and exports.

### Patch Changes

- [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f) - Align image and fallback avatars consistently when they appear together in an inline group.

- [`0b0c038`](https://github.com/santi020k/lumen/commit/0b0c03827675cbe9763a15e1e885a4648ea273e8) - Complete glass surface support for DatePicker and Select across framework adapters, intensity
  variants, fallback styles, documentation, and examples.

- [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f) - Restore the AnimatedPortrait badge surfaces and replace square border-image artifacts with responsive elliptical portrait orbits.

- [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402) - Use a mode-aware foreground for destructive buttons and floating badges so solid danger surfaces
  retain accessible text and icon contrast in light and dark themes.

- [`7c6ad35`](https://github.com/santi020k/lumen/commit/7c6ad35e4d55c8a080bee93e58e5260a4258653a) - Restore visible native Meter tracks and values across browser engines by using the shared color tokens.

- [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402) - Repeat Watermark labels across protected content at the configured gap and rotation instead of rendering a single centered label.

- [`0b6f99e`](https://github.com/santi020k/lumen/commit/0b6f99edf2c3858683ac2370eead964cc618a965) - Restore the full-size Agenda, Schedule, and RichTextEditor layouts after their roots accidentally inherited ThemeToggle button dimensions.

- [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654) - Replace the FileUpload placeholder with a clear upload icon and improve its focus, drag, disabled,
  selected-file, and responsive visual states.

- [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570) Thanks [@santi020k](https://github.com/santi020k)! - Add glass surface tokens, boolean glass props and attributes, and documentation for supported glass surfaces. Expand glass support across layout, data display, feedback, navigation, and editor-style container primitives with matching Astro, React, and Elements examples.

- [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654) - Replace the browser-native DatePicker surface with Lumen's accessible Calendar popover, including localized display values, keyboard navigation, form-backed values, and matching Astro, React, and Elements behavior.

- [`a32b14d`](https://github.com/santi020k/lumen/commit/a32b14ddaac5cd8fcc939ae26008c84479e1ad0f) - Keep icon adornments at their intended size inside input groups.

- [`5ae75c5`](https://github.com/santi020k/lumen/commit/5ae75c5f60b4fb4382bba9c0634bef8c0721fa96) Thanks [@santi020k](https://github.com/santi020k)! - Polish Code block layout so headers avoid control overlap, inline code uses the component palette, framed examples preserve multiline formatting without inheriting global pre borders, and the Astro/React Code components can render a normalized `code` string with lightweight theme-aware token colors.

- [`ae13d36`](https://github.com/santi020k/lumen/commit/ae13d363b21dc677dc9a8c16120ae7a07f269390) - Improve dark-theme segmented-control contrast and make radio-group arrow navigation update the selected value while emitting native input and change events.

- [`ffe0107`](https://github.com/santi020k/lumen/commit/ffe0107d26ae36c4e5434f538fdc056e467f2eb9) - Present DateRangePicker as a cohesive responsive pair of custom Calendar-backed fields, expose range state for styling, and synchronize composed React DatePicker children automatically.

- [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579) Thanks [@santi020k](https://github.com/santi020k)! - Add per-component registry entries and support installing local Astro wrappers with `lumen add <component>`.

- [`0fd7938`](https://github.com/santi020k/lumen/commit/0fd793833f470373da6e74a5cd22496953ebe402) - Improve breadcrumb hierarchy with automatic chevron separators and distinct link, focus, hover, and current-page states.

- [`160fd16`](https://github.com/santi020k/lumen/commit/160fd16ca51104c3d2b217f333b548f6dbc5f37c) - Improve Stepper hierarchy, completed progress, and responsive layout.

- [`ffe0107`](https://github.com/santi020k/lumen/commit/ffe0107d26ae36c4e5434f538fdc056e467f2eb9) - Refine Transfer with a balanced compact layout, clearer selection and focus states, a centered empty state, and responsive stacked controls.

- [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7) - Refine Tree presentation with compact navigator rows, visible nesting guides, aligned hierarchy, and clearer hover, focus, and selection states.

- [`e5dcf54`](https://github.com/santi020k/lumen/commit/e5dcf54cb2635406a66ca65cfa53d99423d6235a) - Restore the cyan and teal Lumen Light palette across standalone CSS, exported core tokens, and the
  Figma theme contract.

- [`4760e13`](https://github.com/santi020k/lumen/commit/4760e13631d7c5f84540eaf5013c22325481a2b7) - Restore the Pill shell and count affix styling in the shared standalone stylesheet.

- [`24990c5`](https://github.com/santi020k/lumen/commit/24990c52f458b4a157d22e197e520fc6eec72ce8) Thanks [@santi020k](https://github.com/santi020k)! - Include glass surface variables in generated ThemeBuilder tokens, CSS exports, scoped previews, Figma color variables, and design-token JSON.

- Updated dependencies [[`b30a72a`](https://github.com/santi020k/lumen/commit/b30a72aec1742b0ce39214fbf299099011d1a510), [`26053f4`](https://github.com/santi020k/lumen/commit/26053f437784f4f771a7af8ddee8426c5bfc8cc5), [`bf6ea87`](https://github.com/santi020k/lumen/commit/bf6ea8786fdb307bf7b3fc2313e5a2850bfdf579), [`f5c36ab`](https://github.com/santi020k/lumen/commit/f5c36ab1b22daf6f532869c576be97fa22474a43), [`c417a07`](https://github.com/santi020k/lumen/commit/c417a0728fe0aebebcf3a8f3b636c03f89ef3654), [`d802296`](https://github.com/santi020k/lumen/commit/d80229694b15c0c23e8846ed68780fce5222f2dd), [`1df25dc`](https://github.com/santi020k/lumen/commit/1df25dce01ef07b91a0e54c76abead493e7a5570), [`b6f7d70`](https://github.com/santi020k/lumen/commit/b6f7d7091f099e964371fd75844eb645e858e866), [`255e9fd`](https://github.com/santi020k/lumen/commit/255e9fd43b1d367418d3b3112bc973f510143356), [`5ae75c5`](https://github.com/santi020k/lumen/commit/5ae75c5f60b4fb4382bba9c0634bef8c0721fa96), [`e5dcf54`](https://github.com/santi020k/lumen/commit/e5dcf54cb2635406a66ca65cfa53d99423d6235a), [`5aab08e`](https://github.com/santi020k/lumen/commit/5aab08e1e765444d16f5e41956dca486128e812f), [`24990c5`](https://github.com/santi020k/lumen/commit/24990c52f458b4a157d22e197e520fc6eec72ce8)]:
  - @santi020k/lumen-core@0.1.0

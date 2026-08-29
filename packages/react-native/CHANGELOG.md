# @santi020k/lumen-react-native

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

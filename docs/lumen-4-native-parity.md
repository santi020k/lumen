# Lumen 4 native parity

This pass reduces a concrete web/native and native/native gap: interval filters are now available
through `LumenRangeSlider` in React Native, SwiftUI, and Compose. Astro remains the design reference;
native adapters retain platform controls and application-owned state.

## Delivered behavior

- React Native and SwiftUI add independently named lower and upper sliders; Compose retains Material
  two-thumb rendering. All adapters accept localized endpoint names and formatted values.
- Endpoints stay bounded and cannot cross during adjustment. Normalization does not write to host
  state, and changing one endpoint preserves the other.
- Disabled and read-only controls prevent adjustment. Compose also guards the optional completion
  callback while editing is blocked.
- React Native slider values and disabled state use both native accessibility props and modern ARIA
  attributes, preserving semantics in the Expo web preview.
- The shared native registry, API baselines, documentation pages, MCP snapshot and phone playground
  catalogs include the new contract. English and Spanish examples exercise editable and read-only
  states. Release notes are folded into the already prepared, unpublished 4.0.0 changelogs.

See the [range-filter contract](native-components.md#native-range-filters) for syntax and step
conventions. React Native uses a numeric increment, SwiftUI supports continuous or stepped native
sliders, and Compose counts intermediate stops. The host still owns units, filtering and persistence.

## Local verification

React Native's 192 behavioral and model tests pass, including RTL touch handling, bounded intervals,
controlled intent, disabled/read-only rejection and localized accessible values. Swift's 84 tests
pass, including interval normalization, the domain step grid, crossing protection and public usage.
Compose library and Wear unit tests and lint pass with the declared JDK 21 and local Android SDK.

A dedicated iPhone 17 Pro simulator on iOS 27 passes the Release-mode range UI test: native steps,
independent endpoint updates, localized names and read-only values. Its inspected screenshot and the
React Native screenshot are synchronized through the existing documentation capture generator.
The React Native Expo web preview passes touch and semantic checks at 390 and 1280 pixels, with no
horizontal overflow; an enlarged-text phone capture was also inspected. This is simulator and
preview evidence, not a new Android or React Native device run.

Swift API extraction builds all five Apple targets. The range control is exposed on iOS, macOS and
visionOS, matching the existing editable slider; tvOS and watchOS inventories remain unchanged.

## Remaining useful gaps

`LumenMultiSelect` is currently Compose-only. Extending its existing controlled selection contract
with application-owned search, retained unavailable selections, loading and retry is the next clear
cross-adapter form gap. Android app bars, swipe actions and adaptive list/detail scaffolds remain
platform-specific; other adapters should use their native navigation and gesture conventions.

This pass does not claim that the complete web catalog has been ported. Native support continues
to require implementation, public contracts, behavioral tests and documented usage per adapter.

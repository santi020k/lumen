# @santi020k/lumen-react-native

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

# Cross-platform architecture

Lumen shares a design language across the web, React Native, SwiftUI, and Jetpack Compose without
forcing one platform's rendering or interaction model onto another.

## Source of truth

`tokens/lumen.tokens.json` is the canonical platform-neutral foundation. It uses Design Tokens
Community Group token types for semantic light and dark colors, spacing, radii, typography, motion,
and elevation. CSS-specific HSL values live in a namespaced extension so the existing web output
retains exact values while native adapters consume hexadecimal colors and native dimensions.

Run the generator after changing the source:

```bash
pnpm run generate:platform-tokens
pnpm run check:platform-tokens
```

The generator produces and verifies:

| Target | Generated surface |
| --- | --- |
| Core and web tooling | TypeScript CSS and platform-neutral values |
| React Native | TypeScript hexadecimal colors and numeric dimensions |
| SwiftUI | Swift `Color`, `CGFloat`, duration, cubic Bezier, and elevation values |
| Jetpack Compose | Compose `Color`, `Dp`, `Sp`, duration, cubic Bezier, and elevation values |
| Token consumers | Published `@santi020k/lumen-tokens` JSON |

The check also compares the semantic light and dark colors with `packages/lumen/styles.css`, so a
web/native color drift fails validation.

## Shared contracts, native implementations

The contract shared by a component includes its semantic purpose, variants, sizes, state names,
content rules, accessibility expectations, and token roles. Rendering, focus systems, gestures,
navigation, and platform conventions stay in the adapter.

For example, a Lumen Button can share `primary`, `secondary`, `quiet`, and `danger` intents while
using a native `Pressable`, SwiftUI `Button`, or Compose `Button` implementation. Touch targets,
VoiceOver or TalkBack semantics, dynamic type, and disabled behavior must be verified per platform.

Native adapters must not depend on the DOM, CSS class names, the Astro runtime, or WebViews.

## Support tiers

| Tier | Promise | Examples |
| --- | --- | --- |
| Universal foundations | Kept synchronized across every adapter | Colors, spacing, radius, typography, motion, elevation |
| Universal primitives | Native implementation planned for every adapter | Theme, Text, Icon, Button, IconButton, Surface, TextField, Badge, Divider, Spinner |
| Shared where appropriate | Added when the interaction maps cleanly | Cards, alerts, toast feedback, chips, field composition, progress, avatars, disclosure controls |
| Apple-native | Shared across iOS and macOS without forcing parity onto other adapters | Settings rows, native selection, empty states, shortcut recording, SF Symbols selection |
| Platform-specific | Uses platform conventions and does not promise API parity | Navigation, tab bars, sheets, date pickers, gestures, system menus |

The web catalog remains the reference for design intent, not a requirement that all 150 components
be ported. A native component is considered supported only after its public contract, accessibility
behavior, tests, and usage documentation exist in that adapter.

See [Native component reference](native-components.md) for installation, the support matrix,
platform mappings, accessibility requirements, and contribution checks.

## Native beta policy

The shared token foundation is stable. The React Native, SwiftUI, and Jetpack Compose component
adapters are **Beta**: they are available for testing and early production adoption, but their
public APIs may evolve as Lumen gathers evidence from real applications. Breaking changes must be
documented in release notes with a practical migration path.

A native adapter graduates from Beta after it has:

- at least one active consumer application;
- accessibility and interaction testing on representative physical devices;
- a documented platform and toolchain compatibility matrix;
- component contracts that remain stable across multiple releases; and
- a documented deprecation policy for future API changes.

Individual features that do not yet meet the adapter's Beta support bar should be labeled
**Experimental** and must not be presented as part of the supported component surface.

## Current status

- The canonical token source and drift check are active.
- Motion duration, easing, and elevation values are generated for every native adapter.
- React Native, SwiftUI, and Compose expose the complete shared native component tier with native
  rendering, state, and accessibility behavior.
- Theme, Text, Icon, IconButton, Surface, Button, TextField, Badge, Divider, and Spinner are
  implemented in all three native adapters. Icon glyph sources stay platform-native while their
  size, color, intent, and accessibility contracts remain aligned.
- ButtonGroup, Textarea, FieldGroup, Toggle, SettingsRow, SearchField, Checkbox, RadioGroup,
  SegmentedControl, Chip, Card, Alert, Toast, Progress, Skeleton, Disclosure, Avatar, EmptyState,
  ListRow, Banner, Stat, SectionHeader, and StatusBar are also implemented in all three native
  adapters with shared semantic contracts.
- Picker, Slider, and Gauge are available in SwiftUI and Compose, where stable dependency-free
  native controls exist. The Apple tier additionally includes ShortcutRecorder and SymbolPicker on macOS.
- Native navigation, window scenes, sheets, popovers, and system menus remain application-owned.
- The executable checks and manual hardware matrix live in
  [Native device validation](native-device-validation.md). A platform remains Beta until the matrix
  contains representative physical-device evidence.
- Declared minimum versions and verified toolchains live in the
  [native compatibility matrix](native-compatibility.md).

## Release discipline

Token changes are user-visible changes to every adapter. Update the source once, regenerate all
outputs, review the platform diffs, add a changeset for affected published packages, and run the
repository validation commands. Platform packages may release independently when an implementation
changes without altering the shared contract.

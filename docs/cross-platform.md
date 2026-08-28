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

`icons/lumen.icons.json` is the canonical cross-platform icon manifest. It includes every canonical
Lucide interface icon used by the web `Icon` API and every Font Awesome Free brand icon already
provided by `@santi020k/lumen-icons-brand`. Brand names stay namespaced as `brand:*`. Run the icon
generator after changing the manifest or upgrading either source package:

```bash
pnpm run generate:platform-icons
pnpm run check:platform-icons
```

The generator creates the React Native name-to-component map, the Swift `LumenIconName` enum and SVG
asset catalog, and the Compose `LumenIconName` value catalog and VectorDrawable resources. It also
copies `icons/THIRD_PARTY_NOTICES.md` into every native distribution. Generated sources, resources,
and notices are committed; validation rejects missing, changed, or stale outputs. Native adapters
retain their custom component, SF Symbol, and `ImageVector` forms as platform escape hatches.

Lumen's original code remains MIT-licensed. Generated Lucide artwork retains its ISC or
Feather-derived MIT terms, while Font Awesome Free brand artwork retains CC BY 4.0 attribution.
Brand marks can also be protected trademarks; inclusion in the catalog does not grant permission to
use a represented company's mark.

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
| Platform-specific | Uses platform conventions and does not promise API parity | Pull-to-refresh controls, floating actions, gestures |

The web catalog remains the reference for design intent, not a requirement that all 150 components
be ported. A native component is considered supported only after its public contract, accessibility
behavior, tests, and usage documentation exist in that adapter.

See [Native component reference](native-components.md) for installation, the support matrix,
platform mappings, accessibility requirements, and contribution checks.

## Native support policy

The shared token foundation and the React Native, SwiftUI, Jetpack Compose, and Wear OS component
contracts are **Supported for Lumen 2**. Package, migration, build, security, published-artifact,
and two-release stability checks gate the initial publication. External-consumer and
physical-device evidence remains visible as post-release qualification work. Breaking changes
require release notes and a practical migration path.

A native adapter enters version 2 after it has:

- a frozen, reviewed public API and migration path;
- clean package, build, compatibility, and published-artifact validation;
- a documented platform and toolchain compatibility matrix;
- component contracts that remain stable across multiple releases; and
- a documented deprecation policy for future API changes.

Active-consumer upgrades and representative physical-device accessibility checks remain required
qualification evidence, but the maintainer explicitly deferred their completion until after the
initial 2.0.0 publication. Pending entries must not be described as completed.

The measurable graduation gates, release sequence, and stable compatibility policy are tracked in
[Lumen 2 readiness](lumen-2-readiness.md).

Future features that do not yet meet the supported contract bar should be labeled
**Experimental** and must not be presented as part of the supported component surface.

## Current status

- The canonical token source and drift check are active.
- Motion duration, easing, and elevation values are generated for every native adapter.
- React Native, SwiftUI, and Compose expose the complete shared native component tier with native
  rendering, state, and accessibility behavior.
- Theme, Text, Icon, IconButton, Surface, Button, TextField, Badge, Divider, and Spinner are
  implemented in all three native adapters. The shared icon catalog renders the same Lumen-managed
  geometry across platforms while native icon escape hatches remain available.
- ButtonGroup, Textarea, FieldGroup, Toggle, SettingsRow, SearchField, DateField, DateRangeField,
  Picker, Slider, Checkbox, RadioGroup, SegmentedControl, Tabs, Chip, Card, Alert, Toast, Progress,
  Skeleton, Graphic, Backdrop, Illustration, Image, Sparkline, LineChart, BarChart, PieChart,
  ScatterChart, Heatmap, RangeChart, ComboChart, Disclosure, Avatar, EmptyState, ListRow, Banner,
  Stat, SectionHeader, StatusBar, Gauge, AlertDialog, Sheet, Menu, ShareButton, and NavigationBar are
  also implemented in all three native adapters with shared semantic contracts.
- Supported PhoneInput contracts are available in React Native, SwiftUI on iOS and macOS, and
  Compose with shared country, national-number, validity, and E.164 semantics. They remain
  intentionally absent on wearable and television surfaces.
- Picker, Slider, Gauge, DateField, and DateRangeField share controlled contracts across React
  Native, SwiftUI, and Compose. The Apple and Android adapters use platform-native controls; React
  Native provides dependency-free accessible semantics. The platform tier includes RefreshControl,
  CollapsibleNavigationBar, and NavigationAccessory for React Native; FloatingActionButton,
  NavigationBarAccessory, and AdaptiveNavigationScaffold for Compose; and ShortcutRecorder,
  SymbolPicker, TabAccessory, and TabBarMinimization for Apple platforms.
- NavigationBar provides controlled peer-destination selection. Navigation stacks, history, deep
  links, window scenes, sheets, popovers, and system menus remain application-owned.
- The executable checks and manual hardware matrix live in
  [Native device validation](native-device-validation.md). Pending entries are tracked
  transparently after the initial publication.
- Declared minimum versions and verified toolchains live in the
  [native compatibility matrix](native-compatibility.md).

## Release discipline

Token and shared icon changes are user-visible changes to every adapter. Update the relevant source
once, regenerate all outputs, review the platform diffs, add a changeset for affected published
packages, and run the repository validation commands. Platform packages may release independently
when an implementation changes without altering the shared contract.

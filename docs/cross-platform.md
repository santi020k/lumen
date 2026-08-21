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
| SwiftUI | Swift `Color`, `CGFloat`, and duration values |
| Jetpack Compose | Compose `Color`, `Dp`, `Sp`, and duration values |
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
| Shared where appropriate | Added when the interaction maps cleanly | Cards, alerts, progress, avatars, disclosure controls |
| Platform-specific | Uses platform conventions and does not promise API parity | Navigation, tab bars, sheets, date pickers, gestures, system menus |

The web catalog remains the reference for design intent, not a requirement that all 150 components
be ported. A native component is considered supported only after its public contract, accessibility
behavior, tests, and usage documentation exist in that adapter.

## Current status

- The canonical token source and drift check are active.
- React Native exposes complete foundations, theme context, and the first native primitives.
- SwiftUI exposes generated foundations, `LumenTheme`, an environment modifier, and matching
  native primitives.
- Compose exposes generated foundations, a Material 3-backed `LumenTheme`, and matching native
  primitives.
- Text, Surface, Button, TextField, Badge, Divider, and Spinner are implemented in all three native
  adapters. Icon and IconButton are the next universal additions.

## Release discipline

Token changes are user-visible changes to every adapter. Update the source once, regenerate all
outputs, review the platform diffs, add a changeset for affected published packages, and run the
repository validation commands. Platform packages may release independently when an implementation
changes without altering the shared contract.

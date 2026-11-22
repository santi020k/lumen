<p align="center">
  <a href="https://lumen.santi020k.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/santi020k/lumen/main/docs/assets/readme/package-dark.svg">
      <img src="https://raw.githubusercontent.com/santi020k/lumen/main/docs/assets/readme/package-light.svg" alt="Lumen UI — Web. Native. Thoughtfully connected." width="1200" height="184">
    </picture>
  </a>
</p>

<h1 align="center">Lumen UI · ArkUI</h1>

<p align="center">HarmonyOS-native components · Semantic themes · Shared foundations</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/tree/main/packages/arkui"><img src="https://img.shields.io/badge/platform-ArkUI-0369a0?style=flat-square" alt="ArkUI package"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://github.com/santi020k/lumen/blob/main/docs/harmonyos.md">Documentation</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/arkui">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-arkui`

**On this page:** [Status](#status) · [Install](#install) · [Usage](#usage) ·
[Components](#components) · [Maintainer checks](#maintainer-checks)

This HarmonyOS library is the pilot of Lumen's native ArkTS and ArkUI adapter. It carries the
foundations generated from Lumen's canonical design tokens and six primitives that follow the same
semantic roles as the React Native, SwiftUI, and Jetpack Compose adapters.

## Status

**Pilot, not published.** The package isn't on ohpm, has no stability guarantee, and its API can
change in any release.

| Part | State |
| --- | --- |
| Tokens, theme values, and style resolvers (`.ts`) | Covered by unit tests in `tests/` |
| ArkUI components (`.ets`) | Written against the API 12 documentation; **not yet compiled** with DevEco Studio or run on a device |

Treat the first DevEco Studio build as the acceptance test for the `.ets` sources. Everything a
component decides, such as colors, sizes, and error state, lives in the tested `.ts` resolvers.
For a HarmonyOS application that needs the complete Lumen catalog today, use the
[React Native preview](../../docs/harmonyos.md).

## Install

The minimum is HarmonyOS NEXT 5.0 (API 12). Until the package is published, add the source module
to a DevEco Studio project from a checkout of this repository. In the consuming module's
`oh-package.json5`:

```json5
{
  dependencies: {
    "@santi020k/lumen-arkui": "file:../path/to/lumen/packages/arkui",
  },
}
```

Then run `ohpm install`.

## Usage

Render one `LumenTheme` at the application root. It publishes the palette to every Lumen component
in the application through `AppStorage`. Without it, components use the light palette.

```ts
import {
  LumenButton,
  LumenCard,
  LumenText,
  LumenTextField,
  LumenTextTone,
  LumenTextVariant,
  LumenTheme
} from '@santi020k/lumen-arkui'

@Entry
@Component
struct SignIn {
  @State email: string = ''
  @State error: string = ''

  build() {
    LumenTheme() {
      Column({ space: 16 }) {
        LumenText({ text: 'Sign in', variant: LumenTextVariant.Title })
        LumenCard({ fillsWidth: true }) {
          LumenTextField({
            value: this.email,
            label: 'Email',
            errorMessage: this.error,
            inputType: InputType.Email,
            onValueChange: (value: string) => {
              this.email = value
            }
          })
        }
        LumenButton({
          label: 'Continue',
          onPress: () => {
            this.error = this.email.length > 0 ? '' : 'Enter your email address'
          }
        })
        LumenText({ text: 'We never share your address.', tone: LumenTextTone.Muted })
      }
      .padding(24)
    }
  }
}
```

`LumenTheme` follows the system color mode. Pass
`colorScheme: LumenColorSchemePreference.Dark` or `.Light` to force one, and `lightColors` or
`darkColors` to replace a palette; both are read once, when the theme appears. The palette is
application-wide, so a second `LumenTheme` replaces the first instead of scoping a subtree.

ArkUI ignores universal attributes such as `.width()` on a component that takes a trailing closure.
`LumenTheme` fills its parent unless `fillsParent` is `false`. `LumenSurface` and `LumenCard` hug
their content unless `fillsWidth` is `true`.

Token groups are exported for custom components: `LumenColors`, `LumenSpacing`, `LumenRadius`,
`LumenTypography`, `LumenMotion`, `LumenElevation`, `LumenChartColors`, `LumenChartMetrics`, and
`LumenGraphics`. Lengths are `vp`, and font sizes are `fp`, so text follows the system font scale.

## Components

| Component | Contract |
| --- | --- |
| `LumenTheme` | Light and dark semantic foundations; follows the system color mode |
| `LumenText` | Body, caption, label, and title roles with semantic tones |
| `LumenSurface` | Canvas, surface, muted, and strong backgrounds with token padding and radius |
| `LumenButton` | Primary, secondary, quiet, success, and danger intents in three sizes; loading and disabled states |
| `LumenTextField` | Labeled single-line entry with error and disabled states |
| `LumenCard` | Neutral or semantic bordered container; `onPress` renders a native button |

Some property names differ from the other adapters because a custom component can't redeclare
ArkUI's universal attributes: `controlSize` instead of `size`, `inset` instead of `padding`,
`isDisabled` instead of `enabled`, and `onPress` instead of `onClick`.

Accessibility: `LumenTextField` exposes its label and `errorMessage` as the input's accessibility
description, so the entered value is still read. A loading `LumenButton` exposes `loadingLabel`
as its description and ignores activation. An interactive `LumenCard` is a native button.

## Maintainer checks

`src/main/ets/tokens/Tokens.generated.ts` is generated. After changing
`tokens/lumen.tokens.json`, run:

```bash
pnpm run generate:platform-tokens
pnpm --filter @santi020k/lumen-arkui run typecheck
pnpm --filter @santi020k/lumen-arkui run lint
pnpm --filter @santi020k/lumen-arkui run test
pnpm run check:native-contracts
```

The HAR compiles everything under `src/main`, so tests live in `tests/`. `.ohpmignore` lists the
tests and the workspace-only `package.json` and `tsconfig.json` for exclusion from a built HAR; a
`file:` dependency uses the directory as it is.

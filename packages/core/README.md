<p align="center">
  <a href="https://lumen.santi020k.com">
    <img src="https://raw.githubusercontent.com/santi020k/lumen/main/apps/docs/public/logo.svg" alt="Lumen UI" width="233" height="60">
  </a>
</p>

<h1 align="center">Lumen UI · Core</h1>

<p align="center">Shared contracts · Metadata · Framework-neutral helpers</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@santi020k/lumen-core"><img src="https://img.shields.io/npm/v/@santi020k/lumen-core?style=flat-square&color=0369a0" alt="npm version"></a>
  <a href="https://github.com/santi020k/lumen/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-13967e?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://lumen.santi020k.com/docs/foundations">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@santi020k/lumen-core">npm</a>
  ·
  <a href="https://github.com/santi020k/lumen/tree/main/packages/core">Source</a>
  ·
  <a href="https://github.com/santi020k/lumen/issues">Issues</a>
</p>

**Package:** `@santi020k/lumen-core`

**On this page:** [Install](#install) · [Language Helpers](#language-helpers) · [Chart Helpers](#chart-helpers) · [Phone Helpers](#phone-helpers) · [Icon Credits](#icon-credits) · [Resources](#resources)

---

Shared metadata, token constants, and tiny utilities used by the Lumen package family.

Most consumers should install a framework package such as `@santi020k/lumen-astro`, `@santi020k/lumen-react`, or `@santi020k/lumen-elements`.

The package exports `lumenColors` and `lumenGlass` for consumers that need to mirror Lumen theme
tokens outside the shared stylesheet.

It also publishes shared web behavior contracts such as `LumenTabsChangeDetail` and
`LumenTabsChangeEvent`. Import them from the root or `@santi020k/lumen-core/tabs` when application
code listens for `ui:tabs-change`.

Cross-platform foundations originate in `tokens/lumen.tokens.json` and are published as
`@santi020k/lumen-tokens`. Core also exports generated hexadecimal light/dark palettes and native
numeric spacing, radius, typography, duration, easing, and elevation values. The legacy
`lumenColors` export retains CSS-ready HSL values.

## Install

Install core directly when building framework-neutral tooling or a custom adapter:

```bash
pnpm add @santi020k/lumen-core
```

Core provides data and helpers; it does not register elements, render components, or load CSS.
Use documented subpath exports such as `/charts`, `/phone`, and `/icon-data` for focused imports.

## Appearance presets

Use `createThemePreset('studio', { scheme: 'dark', overrides: { 'ui-radius': '0.75rem' } })` for a named starting point. Default, Studio and Glass share the [appearance contract](../../docs/appearance-presets.md).

## Language Helpers

The root entry exports the shared locale contract used by the Astro, React, and Elements language
controls. `normalizeLumenLocales` trims labels and values, removes duplicate or invalid values, and
falls back to `lumenDefaultLocales`. `getLumenLocalePair` resolves the current locale and the next
cyclic option, while `formatLumenLanguageLabel` fills the `{current}` and `{next}` placeholders in
an accessible-label template.

```ts
import {
  formatLumenLanguageLabel,
  getLumenLocalePair,
  type LumenLocaleOption,
  normalizeLumenLocales
} from '@santi020k/lumen-core'

const locales: readonly LumenLocaleOption[] = normalizeLumenLocales([
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' }
])

const { current, next } = getLumenLocalePair(locales, 'en')
const label = formatLumenLanguageLabel(
  'Change language from {current} to {next}',
  current,
  next
)
```

## Date Helpers

Calendar adapters share `parseLumenDate`, `isLumenDateBoundsValid`, and
`isLumenDateRangeValid` from the core root entry. They accept complete Gregorian
`YYYY-MM-DD` dates in years 0001–9999, reject overflow dates, and require ordered,
inclusive bounds. `resolveLumenDateLocale` normalizes an explicit locale or the
browser locale, falling back to English for invalid locale tags.
`resolveLumenDateLabels` supplies English and Spanish navigation, picker, and
invalid-range defaults through the `LumenDateLabels` contract. Components allow
label overrides for other languages; pass an explicit locale during SSR.

## Chart Helpers

`@santi020k/lumen-core/charts` exports the shared `LumenChartSeries` contract plus deterministic
domain, tick, scaling, line/area, grouped/stacked bar, and pie/donut geometry helpers. They render
no DOM and perform no statistical analysis; framework packages use them to keep chart output
aligned.

```ts
import {
  createLumenLineGeometry,
  getLumenChartAxisPadding,
  type LumenChartSeries
} from '@santi020k/lumen-core/charts'

const series: LumenChartSeries = {
  id: 'views',
  label: 'Views',
  data: [{ x: 'Mon', y: 42 }, { x: 'Tue', y: 68 }]
}

const valueLabels = ['$0', '$68,000']
const paddingLeft = getLumenChartAxisPadding(valueLabels)

createLumenLineGeometry(series.data, {
  paddingBottom: 24,
  paddingLeft,
  paddingRight: 16,
  paddingTop: 16
})
```

Use `getLumenChartAxisPadding` when formatted value-axis labels need more than the default inset.
It estimates proportional and wide Unicode glyphs during server rendering, honors an optional
minimum, and caps the result at 240 so labels cannot consume the complete plot. The line geometry
helper accepts `paddingTop`, `paddingRight`, `paddingBottom`, and `paddingLeft` to reserve each edge
independently; unspecified edges fall back to `padding`.

## Phone Helpers

`@santi020k/lumen-core/phone` provides localized country metadata, supplementary flag labels,
as-you-type formatting, validation, pasted international-number detection, and E.164 output for the
web and React Native adapters.

```ts
import { getLumenPhoneCountry, resolveLumenPhoneNumber } from '@santi020k/lumen-core/phone'

const colombia = getLumenPhoneCountry('CO', { locale: 'en-US' })
if (!colombia) throw new Error('Missing Colombia metadata')

const phone = resolveLumenPhoneNumber(colombia, '6015550123')
```

It also exports the Lucide-backed icon map (`lumenIcons`, `lumenIconNames`) and helpers such as
`renderLumenIconSvg` so framework adapters can render icons by name.

## Icon Credits

Icons are provided by [Lucide](https://lucide.dev/) and its open-source contributors. Lucide is
licensed under the ISC License, with Feather-derived icons covered by the MIT License. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the complete notices.

## Theme Builder Helpers

Use the ThemeBuilder helpers when an adapter or app needs the same token generation and export
contract as the Astro runtime.

```ts
import {
  createThemeBuilderTokens,
  exportThemeBuilderValue
} from '@santi020k/lumen-core'

const theme = createThemeBuilderTokens({
  accentHue: 140,
  hue: 260,
  scheme: 'dark'
})

exportThemeBuilderValue(theme.tokens, theme.scheme, 'css')
```

## Figma and Design Tokens

Use the Figma helpers when a design workflow needs the same semantic colors as Lumen's CSS tokens.

```ts
import {
  createThemePalette,
  exportThemeDesignTokens,
  exportThemeFigmaVariables
} from '@santi020k/lumen-core'

const theme = createThemePalette('221 83% 53%', '168 76% 36%')

exportThemeFigmaVariables(theme, {
  collectionName: 'Acme theme',
  modeName: 'Light'
})

exportThemeDesignTokens(theme)
```

`exportThemeFigmaVariables` returns Figma variable-friendly color values (`r`, `g`, `b`, `a`) and
hierarchical names such as `color/surface/muted`. `exportThemeDesignTokens` returns standard design
token JSON that importers can map into Figma variables or other design tools.

## Static interface icon data

Import individual definitions from `@santi020k/lumen-core/icon-data` when icon names are known at
build time. This entrypoint has no runtime registry and allows unused definitions to be removed:

```ts
import { Search, X } from '@santi020k/lumen-core/icon-data'
```

React consumers can import both the renderer and definitions from
`@santi020k/lumen-react/icons`. Existing `getLumenIcon`, runtime names, and registered icon packs
remain supported through the original API. The interface selection in `icons/lumen.icons.json`
controls the generated exports; run `pnpm run generate:platform-icons` after catalog changes.
See [consumer UI recipes](../../docs/consumer-ui-recipes.md#static-react-icons).

## Resources

| Guide | What you will find |
| --- | --- |
| [Cross-platform architecture](https://github.com/santi020k/lumen/blob/main/docs/cross-platform.md) | Reference for cross-platform architecture. |
| [Data visualization](https://github.com/santi020k/lumen/blob/main/docs/data-visualization.md) | Reference for data visualization. |
| [Figma token export](https://github.com/santi020k/lumen/blob/main/docs/figma.md) | Reference for figma token export. |
| [Contributing](https://github.com/santi020k/lumen/blob/main/CONTRIBUTING.md) | Setup, checks, and contribution workflow. |
| [Release history](https://github.com/santi020k/lumen/releases) | Published releases and version notes. |

Part of [Lumen UI](https://lumen.santi020k.com), created by [Santiago Molina](https://santi020k.com).
Licensed under [MIT](https://github.com/santi020k/lumen/blob/main/LICENSE); third-party artwork retains its own notices.

## Combobox DOM controller

`createLumenComboboxController(root)` enhances a client-side root containing an
`input[role="combobox"]` and a `[role="listbox"]` with `[role="option"]` children.
It preserves editing focus, observes option changes and supports delegated selection. It returns
`close()` and `destroy()`; call `destroy()` when the owner disconnects. Astro and Elements manage
that lifecycle automatically. React uses its state-driven component with the same keyboard contract.

## Virtual collections and direction

`createLumenVirtualCollectionController(root, { items, getKey, renderItem, itemSize, overscan })`
owns an empty data-mode VirtualList root. It mounts only visible rows and focused neighbors, retains
stable keyed wrappers, and returns `update(items)` and `destroy()`. Declare data mode before the
Astro or Elements runtime initializes. See [data rendering](../../docs/virtual-list-data.md) for
setup, state ownership and lifecycle examples.

`getLumenVirtualWindow` calculates a fixed-height window with optional disjoint focus retention.
`observeLumenVirtualWindow` observes scroll, resize and focus; its handle provides `update()` and
`destroy()`. Applications using these lower-level helpers own row rendering and cleanup.

`getLumenDirectionalKey(element, key)` resolves the element's current inherited CSS direction and
swaps horizontal arrows in RTL. Other keys are unchanged. Web adapters use it for visual keyboard
navigation; native range inputs retain browser-owned behavior.

## Exact localized input drafts

`parseLumenDecimalDraft(value, locale)` distinguishes empty, incomplete, invalid and valid decimal
input. `isLumenDecimalInBounds(value, { locale, min, max, step })` validates complete values;
`stepLumenDecimalDraft(value, direction, options)` performs exact steps and inclusive clamping without
floating-point conversion. Bounds and steps use ASCII decimal strings; drafts use localized decimal
separators and Unicode decimal digits. Grouping, exponents, whitespace and inputs exceeding 128
characters are rejected. Empty drafts stay distinct from zero; unfinished drafts cannot step.
Applications own units, currency policy, required validation and submission serialization.

`normalizeLumenNumericOTP(proposal, length)` normalizes Unicode decimal digits, whitespace and hyphens
into ASCII, rejects unrelated text and excess digits, and bounds input to 128 characters. Length must
be 1–12. `LumenTimeSelection`, `isLumenTimeSelection` and `isLumenTimeInBounds` describe wall-clock
hours/minutes with inclusive same-day bounds, leaving dates and time zones to the application.

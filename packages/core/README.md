# @santi020k/lumen-core

Shared metadata, token constants, and tiny utilities used by the Lumen package family.

Most consumers should install a framework package such as `@santi020k/lumen-astro`, `@santi020k/lumen-react`, or `@santi020k/lumen-elements`.

The package exports `lumenColors` and `lumenGlass` for consumers that need to mirror Lumen theme
tokens outside the shared stylesheet.

Cross-platform foundations originate in `tokens/lumen.tokens.json` and are published as
`@santi020k/lumen-tokens`. Core also exports generated hexadecimal light/dark palettes and native
numeric spacing, radius, typography, duration, easing, and elevation values. The legacy
`lumenColors` export retains CSS-ready HSL values.

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

## Chart Helpers

`@santi020k/lumen-core/charts` exports the shared `LumenChartSeries` contract plus deterministic
domain, tick, scaling, line/area, grouped/stacked bar, and pie/donut geometry helpers. They render
no DOM and perform no statistical analysis; framework packages use them to keep chart output
aligned.

```ts
import {
  createLumenLineGeometry,
  type LumenChartSeries
} from '@santi020k/lumen-core/charts'

const series: LumenChartSeries = {
  id: 'views',
  label: 'Views',
  data: [{ x: 'Mon', y: 42 }, { x: 'Tue', y: 68 }]
}

createLumenLineGeometry(series.data)
```

## Phone Helpers

`@santi020k/lumen-core/phone` provides localized country metadata, supplementary flag labels,
as-you-type formatting, validation, pasted international-number detection, and E.164 output for the
web and React Native adapters.

```ts
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

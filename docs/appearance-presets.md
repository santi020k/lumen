# Appearance presets

Choose a starting appearance once, then customize semantic tokens and compose the same public
components. Presets change presentation; they preserve component behavior and application data.

| Preset | Appearance | Recommended surface material |
| --- | --- | --- |
| `default` | Existing Lumen colors, typography and radii | Solid |
| `studio` | PostLens-inspired neutral surfaces, monochrome actions, smaller radii and restrained elevation | Solid |
| `glass` | Existing semantic colors with more generous radii and glass effect tokens | Glass on selected supporting surfaces |

Status colors retain their semantic roles. Light and dark schemes remain independent from the
preset. A preset does not reproduce PostLens's editor layout or bring photo workflows into Lumen.

## Web

Load the adapter stylesheet once. The preset CSS adds about 1.3 KiB compressed to the shared stylesheet. Set the preset on the application root or a scoped section;
set `data-lumen-scheme` explicitly when the section owns its scheme. Without an explicit scheme,
the preset follows an ancestor's `data-theme="dark"` or `data-theme="lumen-dark"`.

```astro
---
import { Button, Card } from '@santi020k/lumen-astro'
import '@santi020k/lumen-astro/styles.css'
---

<section data-lumen-preset="studio" data-lumen-scheme="light">
  <Card>
    <h2>Photo workspace</h2>
    <Button>Export</Button>
  </Card>
  <Card glass="subtle">Supporting controls</Card>
</section>
```

The same attributes work on a React container and around registered Web Components. `glass`,
`glass="subtle"` and `glass="strong"` retain their existing component contracts. Dense content and
destructive or status surfaces should remain opaque when transparency would weaken readability.

Override tokens in application CSS, which takes precedence over Lumen's cascade layers:

```css
[data-lumen-preset="studio"] {
  --brand: 260 70% 40%;
  --brand-solid: 260 70% 40%;
  --on-brand: 0 0% 100%;
  --ui-radius: 0.75rem;
  --ui-border-width: 1px;
  --ui-space-lg: 1.25rem;
  --ui-font: system-ui, sans-serif;
}
```

Keep foreground/background pairs readable when changing action colors. `--ui-border-width`
controls structural line borders; keyboard focus indicators remain independent. Radius and
spacing tokens customize components that consume those roles, rather than scaling text or touch
targets indiscriminately. A nested preset resets its own palette and surface appearance.

For generated configuration, use the public Core helpers:

```ts
import { createThemePreset, exportThemeCss } from '@santi020k/lumen-core'

const tokens = createThemePreset('studio', {
  scheme: 'dark',
  overrides: { 'ui-radius': '0.75rem', 'ui-shadow-md': 'none' }
})
const css = exportThemeCss(tokens, '[data-product-theme]')
```

ThemeBuilder accepts preset buttons with `data-ui-theme-preset="default|studio|glass|custom"`.
`custom` restores hue-generated colors. Use Manual mode for explicit action colors on a preset.
Number inputs with `data-ui-theme-radius-scale`, `data-ui-theme-spacing-scale` and
`data-ui-theme-border-width` adjust appearance and export the resulting tokens. Invalid numeric
values fall back to the preset's unscaled dimensions. The existing CSS and JSON exports include
appearance tokens; Figma export continues to export colors. The live
[theme playground](https://lumen.santi020k.com/docs/theme-playground) shows these controls.

React's `useThemeBuilder` accepts controlled `preset`, `radiusScale`, `spacingScale` and
`borderWidth` options. `defaultPreset`, `onPresetChange`, `setPreset` and `getPresetProps` support
local or application-owned preset selection. Passing `undefined` to `setPreset` restores the
existing generated mode. Existing calls without a preset keep generated color behavior.

## SwiftUI

```swift
let theme = LumenTheme(preset: .studio, scheme: .light)

LumenSurface {
    LumenText("Photo workspace", variant: .title)
    LumenCard(material: .glass) { LumenText("Supporting controls") }
}
.lumenTheme(theme, enforceColorScheme: false)
```

`LumenAppearance` provides radius and spacing multipliers, border width, elevation metadata and
the recommended material. `LumenSurface` and `LumenCard` consume surface dimensions;
`LumenTextStyles` customizes body, caption, label and title fonts while allowing Dynamic Type.
Custom palettes can still use `colors.overriding(...)`; pass the preset's appearance when creating
the customized `LumenTheme`. Glass is explicitly selected per Surface or default Card and uses
SwiftUI's standard material where available; watchOS before 10 retains solid surfaces. Reduce Transparency and increased contrast select the solid palette
fallback. Status cards retain their solid semantic fill.

## React Native

```tsx
const theme = createLumenTheme('light', {
  preset: 'studio',
  colors: { brand: '#663399', brandSolid: '#663399', onBrand: '#FFFFFF' },
  radii: { md: 12 },
  spacing: { lg: 20 },
  fontSizes: { md: 18 },
  appearance: { borderWidth: 1 }
})

<LumenProvider theme={theme}>{children}</LumenProvider>
```

For the unmodified preset, use `<LumenProvider preset="studio" scheme="system">`.
Explicit `theme` takes precedence. Numeric theme scales now accept application values without
literal-type casts. The material is a recommendation; the adapter retains an opaque fallback
without adding a blur dependency. Applications that already own a native blur surface can compose
Lumen controls inside it.

## Compose

```kotlin
LumenTheme(preset = LumenThemePreset.Studio) {
    LumenCard { LumenText("Photo workspace") }
}
```

Use `LumenThemeValues.preset(LumenThemePreset.Studio, isDark = false)` and `.copy(...)` for
application-owned colors or `LumenAppearance` values. Surface and Card consume radius and spacing
multipliers; Card uses the appearance border width. Existing Material typography and shapes remain
application-owned. A supplied `values` or Material color scheme retains precedence over preset
colors. Compose uses a solid material fallback; it does not blur its own content to imitate a
backdrop. Applications may compose their existing backdrop implementation around Lumen content.

## Qualification

Use the same representative controls to check every preset in light and dark, at phone and
desktop widths, with keyboard focus and state feedback. Glass needs a legible fallback when blur
is unavailable or transparency is reduced. Web and native materials intentionally use their
platform conventions; shared names do not promise identical pixels or Apple Liquid Glass effects.

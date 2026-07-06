# @santi020k/lumen-core

Shared metadata, token constants, and tiny utilities used by the Lumen package family.

Most consumers should install a framework package such as `@santi020k/lumen-astro`, `@santi020k/lumen-react`, or `@santi020k/lumen-elements`.

The package exports `lumenColors` and `lumenGlass` for consumers that need to mirror Lumen theme
tokens outside the shared stylesheet.

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

# Figma Integration

Lumen can meet Figma at two levels: semantic theme tokens for design variables, and Code Connect for
published component libraries.

For the reverse direction — implementing Figma designs with Lumen components — see
[figma-design-to-code.md](figma-design-to-code.md) and the machine-readable mapping in
[`registry/figma-design-map.json`](../registry/figma-design-map.json).

## Theme Tokens

Use `@santi020k/lumen-core/figma` to export the shared semantic colors in formats that Figma-oriented
tools can consume.

```ts
import {
  exportThemeDesignTokens,
  exportThemeFigmaVariables
} from '@santi020k/lumen-core/figma'
import { createThemePalette } from '@santi020k/lumen-core'

const theme = createThemePalette('221 83% 53%', '168 76% 36%')

const figmaVariables = exportThemeFigmaVariables(theme, {
  collectionName: 'Lumen',
  modeName: 'Light'
})

const designTokens = exportThemeDesignTokens(theme)
```

`exportThemeFigmaVariables` returns color values in the shape used by Figma variable automation:

```json
{
  "collectionName": "Lumen",
  "modes": [
    {
      "name": "Light",
      "variables": [
        {
          "name": "color/brand",
          "type": "COLOR",
          "value": { "r": 0.141, "g": 0.388, "b": 0.922, "a": 1 },
          "cssValue": "hsl(221 83% 53%)"
        }
      ]
    }
  ]
}
```

`exportThemeDesignTokens` returns standard color tokens with hex values. That is a practical
interchange format for token importers and design-system sync scripts.

## Component Mapping

Figma Code Connect is the right next layer once Lumen has a published Figma component library. It
connects design components in Dev Mode to real code snippets from this repo.

Add a `figma.config.json` at the repo root after the Figma library exists:

```json
{
  "codeConnect": {
    "include": ["figma/**/*.figma.ts"],
    "exclude": ["**/dist/**", "**/node_modules/**"],
    "parser": "html",
    "label": "Lumen Astro"
  }
}
```

Then create one `.figma.ts` template per published component, using the component's Figma URL and
node ID. The first useful mappings should cover `Button`, `Input`, `Field`, `Card`, `Tabs`, and
`Dialog`, because those appear in many generated app flows.

Official references:

- [Figma Code Connect](https://developers.figma.com/docs/code-connect/)
- [Figma Code Connect config](https://developers.figma.com/docs/code-connect/api/config-file/)
- [Figma variables](https://developers.figma.com/docs/rest-api/variables/)

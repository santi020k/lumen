# Figma Integration

Lumen can meet Figma at two levels: semantic theme tokens for design variables, and Code Connect for
published component libraries.

For the reverse direction — implementing Figma designs with Lumen components — see
[figma-design-to-code.md](figma-design-to-code.md) and the machine-readable mapping in
[`registry/figma-design-map.json`](../registry/figma-design-map.json).

## Figma Library File

The Lumen Figma library lives at
[Lumen UI Library](https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9) (file key
`luQW2pTQ3jGGxSFPAAsfa9`). The release library contains 121 public component assets and 52 local
variables across three collections:

- `Color`: 45 semantic and supporting variables in `Light`, `Dark`, `santi020k Light`, and
  `santi020k Dark` modes.
- `Radius`: four values (`sm`, `md`, `lg`, and `full`).
- `Effects`: three semantic shadow variables in `Light` and `Dark` modes.

The file also provides 38 text styles, 8 effect styles, and dedicated Cover, Getting Started,
Foundations, Icons, component-category, and Utilities pages. Inter is the primary interface and
documentation family; Cascadia Mono is reserved for the small amount of code-style text.

Variables carry Web code syntax (`var(--token)`) and values matching
`packages/astro/styles/lumen.css`. The `Light` and `Dark` modes are the Lumen palettes; the
`santi020k Light` and `santi020k Dark` modes mirror the parent website project. Component fills,
strokes, radii, and effects bind to those variables so switching modes does not require detached
color overrides.

The component catalog includes editable text, boolean, instance-swap, and variant properties where
the code API has a meaningful match. `Button`, for example, provides 24 `Variant` x `Size`
combinations plus editable label, icon, loading, and disabled properties. Variant names mirror code
props, so `Variant=Destructive, Size=Sm` corresponds to
`<Button variant="destructive" size="sm" />`. Interactive primitives also include representative
prototype transitions for toggles, disclosures, tabs, selection controls, menus, theme controls,
and reveal behavior.

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

Figma Code Connect connects published design components in Dev Mode to real Astro snippets from
this repo. The root [`figma.config.json`](../figma.config.json) and initial templates in
[`figma/`](../figma) cover `Button`, `Input`, `Field`, `Card`, `Tabs`, and `Dialog`.

The project uses the HTML parser with the `Lumen Astro` label:

```json
{
  "codeConnect": {
    "include": ["figma/**/*.figma.ts"],
    "exclude": ["**/dist/**", "**/node_modules/**"],
    "parser": "html",
    "label": "Lumen Astro",
    "language": "html"
  }
}
```

Validate the templates without publishing:

```bash
pnpm dlx @figma/code-connect connect parse --config figma.config.json
```

Publishing the mappings requires the Figma components to be published as a team library and the
account to have a Dev or Full seat on an Organization or Enterprise plan. Once those prerequisites
are available, run the official Code Connect publish command and verify each mapping from an
instance in Dev Mode.

Official references:

- [Figma Code Connect](https://developers.figma.com/docs/code-connect/)
- [Figma Code Connect config](https://developers.figma.com/docs/code-connect/api/config-file/)
- [Figma variables](https://developers.figma.com/docs/rest-api/variables/)

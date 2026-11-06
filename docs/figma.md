# Figma Integration

Lumen connects Figma and code through semantic theme tokens, Code Connect mappings, and an offline
plugin for inspecting a selection and preparing a web or native handoff.

For the reverse direction — implementing Figma designs with Lumen components — see
[figma-design-to-code.md](figma-design-to-code.md) and the machine-readable mapping in
[`registry/figma-design-map.json`](../registry/figma-design-map.json).

AI agents maintaining the library itself should follow the reusable
[Figma AI working guide](figma-ai-working-guide.md).

## Figma plugin

Lumen for Figma 1.1.0 exports an Astro component, React TSX component or Web Components HTML fragment with its app setup and structured handoff. Select Lumen **5.0.0** for selective styles and optional appearances or **4.4.0** for full adapter CSS. The 4.4.0 release uses Astro 4.4.0 and the published React and Elements 4.3.0 adapters. The plugin matches 21 components by library key, including controls, editorial content, timelines and reveal groups. Review detached instances, custom layers, responsive behavior and application actions before integration.

React Native
and Android Compose use the 4.1.0 adapters. Choose iPhone or Mac for the v5.0.0 Swift package.
Native exports support nine keyed components, text and nested layouts. Unmapped components and
custom layers stay in the handoff with review findings.

Select one frame or instance, choose the version installed in the receiving project, then choose **Inspect selection**. Review the findings and the selected text before sharing an export. The plugin runs offline. See [setup, component coverage and version compatibility](../apps/figma-plugin/README.md).

GitHub Actions prepares the versioned ZIP, revision and checksum for desktop verification. Community submission and installation verification follow the [publication checklist](../apps/figma-plugin/README.md#figma-community-publication). The Community link below opens the design library.

## Design files

| File | Open it to |
| --- | --- |
| [Lumen UI Library](https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9) | Find the canonical components, styles, variables and [light/dark theme specimens](https://www.figma.com/design/luQW2pTQ3jGGxSFPAAsfa9?node-id=600-3). |
| [Lumen Templates](https://www.figma.com/design/DX5clPFAvKTjrSe4wyfMe3) | Adapt an editable desktop or mobile layout from the [template gallery](https://lumen.santi020k.com/templates). |
| [Lumen Playgrounds](https://www.figma.com/design/G0NjJ4eAci1013PaLmseXI) | Compare web and native screens with the [running playgrounds](playgrounds.md). |

The v5 UI Library is published to the Figma team and enabled in both companion files.
These links follow the files’ existing Figma access permissions. The
[Community listing](https://www.figma.com/community/file/1662337342676541513) distributes the public
library. Working-file edits, team-library updates and Community releases are separate steps.

Set **Theme** on a frame to Lumen, Studio, Paper, Field, santi020k or Glass. Set **Color** to
Light or Dark. Child instances inherit both choices. Set either control on a nested frame for a
local appearance. The existing santi020k Light and Dark **Color** modes retain their pinned colors
for older designs. For a new branded frame, choose santi020k under **Theme** to get its colors,
type and corner treatments together.

The variables expose web CSS names in Dev Mode. The [appearance guide](appearance-presets.md)
documents the matching runtime choices and component-level glass treatment. Paper reading headings
use Tinos in Figma as a substitute for the web serif fallback. The
[base and website token contract](../registry/figma-theme-tokens.json) covers four named palettes.
Check Studio, Paper, Field, Glass and component-specific roles against the resolved release CSS.

The component catalog includes editable text, boolean, instance-swap, and variant properties where
the code API has a meaningful match. `Button`, for example, provides 24 `Variant` x `Size`
combinations plus editable label, icon, loading, and disabled properties. Variant names mirror code
props, so `Variant=Destructive, Size=Sm` corresponds to
`<Button variant="destructive" size="sm" />`. Interactive primitives also include representative
prototype transitions for toggles, disclosures, tabs, selection controls, menus, theme controls,
and reveal behavior.

Chart components share categorical series, sequential and diverging scales, axis, grid,
reference, selection and tooltip roles. Use the semantic variables when adapting a chart.

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
account to have an eligible Dev or Full seat under the current [Code Connect requirements](https://developers.figma.com/docs/code-connect/quickstart-guide/). Once those prerequisites
are available, run the official Code Connect publish command and verify each mapping from an
instance in Dev Mode.

Official references:

- [Figma Code Connect](https://developers.figma.com/docs/code-connect/)
- [Figma Code Connect config](https://developers.figma.com/docs/code-connect/api/config-file/)
- [Figma variables](https://developers.figma.com/docs/rest-api/variables/)

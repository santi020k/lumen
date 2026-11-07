# Create and share a Lumen web theme

A Lumen web theme can be one CSS file. Give it an ID, import it once, and put the ID on the page or section you want to style. The examples use the Lumen 5 web adapters for Astro, React, and Web Components. You can keep the file private or give a versioned copy to another project.

## Try Harbor in your project

Choose **Harbor** in the docs header to preview the example across the site. Use the adjacent light/dark toggle to see both palettes.

1. Save the [Harbor example stylesheet](../apps/docs/public/examples/themes/harbor.css) as `src/styles/harbor.css`.
2. Keep your adapter's usual component and foundation styles. Import Harbor from your layout or application entry. Astro components already load the foundation. Selective React and Elements setups import the foundation once and the styles for each component they use.
3. Set `data-lumen-preset="example-harbor"` on a container. For a site-wide theme, put it on `<html>`. For a preview, put it on the section containing the preview.

In an Astro page under `src/pages`, the following example renders two independently themed sections in the same document. Harbor follows the page scheme. Studio stays dark.

```astro
---
import { Card } from '@santi020k/lumen-astro'
import '@santi020k/lumen-astro/styles/themes/studio.css'
import '../styles/harbor.css'
---

<html lang="en" data-theme="light">
  <body>
    <main>
      <section data-lumen-preset="example-harbor">
        <Card><h2>Harbor workspace</h2></Card>
      </section>
      <section data-lumen-preset="studio" data-lumen-scheme="dark">
        <Card><h2>Studio workspace</h2></Card>
      </section>
    </main>
  </body>
</html>
```

Use the same attributes in JSX around a Lumen React `Card`, or on an HTML section around a registered `<lumen-card>`. Both adapters can import Harbor from the application entry. A theme used on only one route can be imported from that route.

## Make it yours

Copy Harbor, replace `example-harbor` throughout with an owner-prefixed ID such as `river-press`, and rename the file. The private variables at the top hold the light and dark palettes. The last rule maps them to Lumen roles only within your preset. For instance, changing `--river-press-action` recolors primary buttons and links together. Colors are HSL channels such as `181 78% 23%`, which components wrap in `hsl()`.

Set colors in pairs. Try `ink` on `canvas` and `surface`, `on-brand` on `brand-solid`, and `on-danger` on `danger`. Check muted text on its actual background. Set the font and radius on the same boundary. Add spacing, shadows, glass or chart colors when the theme owns those decisions. Roles you omit can inherit from an outer theme. Use the documented component variables when a change belongs to one component. [Styling contract](styling-contract.md)

Prefer to choose your colors visually? In the [theme playground](https://lumen.santi020k.com/docs/theme-playground), pick a preset or choose **Manual**, preview real controls, then export **CSS** once in Light and once in Dark. For sections with a fixed scheme, keep each exported block intact and change only its opening selector:

```css
/* Replace the light export's :root with this selector. */
[data-lumen-preset="river-press"][data-lumen-scheme="light"] {
  /* Keep the exported color-scheme and token declarations here. */
}

/* Do the same for the dark export. */
[data-lumen-preset="river-press"][data-lumen-scheme="dark"] {
  /* Keep the dark declarations here. */
}
```

With this two-block version, set both attributes on each theme boundary. For a theme that follows the surrounding scheme automatically, copy the exported colors into Harbor's light and dark palettes instead. Include the exported appearance values you want to own. The playground also exports design-token JSON and Figma colors for design handoff. CSS is the artifact the website loads.

## Use several themes and switch between them

| What the visitor needs | What the application sets |
| --- | --- |
| One theme throughout the site | Put the preset ID and the current `data-theme="light"` or `"dark"` on `<html>`. |
| A route or section with its own identity | Put its preset ID on the route layout or section. Harbor resolves the nearest light or dark scheme when it enters that boundary. |
| A light preview inside a dark page | Set both `data-lumen-preset="example-harbor"` and `data-lumen-scheme="light"` on the preview. Its siblings keep their own appearance. |
| A visitor-selectable theme | Import the offered stylesheets. Use a labeled Lumen `Select` to change the preset ID on the intended boundary. The light/dark toggle controls the scheme independently. |

For example, a picker offering Harbor and Studio can call this handler with its selected value:

```js
function applyPreset(scope, value) {
  scope.dataset.lumenPreset = value === 'studio' ? 'studio' : 'example-harbor'
}
```

This also restores Harbor if a saved preset ID has been retired. Render the initial choice on the server when available. For browser-only preferences, apply the saved choice before paint, fall back to the system light/dark preference, and handle unavailable storage. Reuse the app's existing theme preference and controlled toggle. [Theme bootstrap example](ai-usage.md#theme-bootstrap-and-generated-command-output)

A dialog or menu rendered through a portal inherits CSS from its DOM parent. Mount its portal inside the intended theme boundary, or give the portal container the same preset and resolved scheme. Check it while open. The same rule applies when a light preview is nested several levels inside a dark page.

## Verify a theme before sharing

- Put real buttons, links, fields, errors and muted text in both schemes. Test them on a narrow and a wide viewport, with keyboard focus, browser zoom and forced colors. Check charts or glass over representative backgrounds if your theme styles them.
- Put two different themes next to each other, then nest a light scope inside a dark scope. Switch the outer scheme and verify the pinned scope and its siblings. Open an overlay from the nested scope. Try the default page with the community CSS loaded and its preset unselected.
- With `@santi020k/lumen-core` in your project's test dependencies, inspect the resolved mappings on the real DOM. Run this in a browser test or bundled development module after the styles load:

```js
import { inspectLumenTheme } from '@santi020k/lumen-core'

const scope = document.querySelector('[data-lumen-preset="example-harbor"]')
if (!scope) throw new Error('Missing Harbor preview')
const audit = inspectLumenTheme(scope)
if (!audit.healthy) throw new Error(JSON.stringify(audit.findings))
```

Repeat for every scheme and nested boundary. The audit checks 17 semantic colors and seven normal-text contrast pairs. Keyboard focus, hover, disabled states, charts and overlay placement still need rendered checks.

## Share it when you choose

**One project.** Keep the stylesheet in the application repository. A private theme needs no account, public registration or publishing step.

**A second project or a public download.** Give the stylesheet a version and share a tagged repository or release with the CSS, a README, a license you choose and a light/dark preview. Include the preset ID, an import example, the Lumen adapter versions you tested, and which roles inherit. A consumer can copy that version into their project and review the CSS diff before upgrading.

**An installable package.** When consumers want package-manager updates, the same file can be the entire package payload. Replace the example name with a scope you own. The example assumes you chose MIT. Include the matching LICENSE file, or change the identifier and file to your chosen license.

```json
{
  "name": "@your-scope/lumen-theme-harbor",
  "version": "1.0.0",
  "license": "MIT",
  "publishConfig": { "access": "public" },
  "files": ["harbor.css"],
  "exports": { "./harbor.css": "./harbor.css" },
  "sideEffects": ["./harbor.css"],
  "keywords": ["lumen-theme"]
}
```

Run `pnpm pack` in the theme directory and install the resulting tarball in a clean consumer project. Verify this import with a production build. To release publicly, use an npm scope you control and have your authenticated release workflow run `pnpm publish --access public` from the theme directory. Check that the registry lists the intended version and CSS file. Consumers can then install that version and import its CSS.

```sh
pnpm add @your-scope/lumen-theme-harbor@1.0.0
```

```js
import '@your-scope/lumen-theme-harbor/harbor.css'
```

Keep the import path and preset ID stable across compatible updates. Record visual changes in the changelog. Treat a removed scheme, renamed ID or incompatible token requirement as a breaking change. Keep the previous release available so a consumer can pin it while updating.

For community discovery, link a public demo or repository through the [Built with Lumen showcase form](https://github.com/santi020k/lumen/issues/new?template=showcase.yml) if you want Lumen to feature the project and its preview. The author owns the theme, its distribution and its support. Showcase submission is optional and separate from publication.

This workflow targets websites. For SwiftUI, Compose or React Native, use the adapter's theme API and qualify it separately before listing native support. [Native appearance examples](appearance-presets.md#swiftui)

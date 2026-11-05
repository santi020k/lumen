# Interactive editorial recipes

The existing Astro recipes also support React and Elements in Lumen 5. Install the CLI
separately with `pnpm add -D @santi020k/lumen`, then install the selected runtime adapter.
Use `--target react` or `--target elements` with each recipe command below.

Import `@santi020k/lumen-react/styles/foundation.css` or
`@santi020k/lumen-elements/styles/foundation.css` once in the application. Each copied recipe
imports its selective component CSS and local CSS. The TypeScript entry requires a bundler
with CSS import support. React applications also install the adapter's React peer dependencies.

React recipes use named exports. `ArticleReading` accepts the Astro props plus `children`.
`SiteSearchDialog` accepts `id`, `fallbackHref`, translated `labels`, optional `shortcut`, and
a stable `search(query, signal)` provider returning `SiteSearchResult[]` synchronously or as a
promise. `ImageViewer` accepts `id`, `href`, `title`, an `image` React node, optional `caption`,
`ratio`, `locale`, and translated labels. Use these recipes within a React client boundary.
Server rendering retains reading content and direct destination links, and modal controls
activate after hydration.

Elements installs an HTML fragment and TypeScript entry per recipe. Adapt the IDs, content,
labels, media, and fallback destinations before inserting the fragment. Import the entry once
to register its required primitives and recipe element. After mounting search, call
`setSiteSearchProvider('site-search', search)` from the copied `site-search-dialog.ts` entry.
The provider receives an AbortSignal for each request. Provider replacement cancels an older
request and refreshes the query when the dialog is open.

Both adapters cancel searches after dismissal, replacement, or unmount, and discard stale
results from providers that ignore cancellation. The application owns requests, response
validation, ranking, routing, content, and persistence. HTTP(S) result destinations retain native
modified-link activation. Image attempts defer loading until opening, release stale listeners
after retry or disconnection, and offer recovery after load failure. Reading progress measures
the article and follows content reflow. Elements listeners and observers reconnect on remount.
Native fragments, disclosures, and direct destination links remain available without JavaScript.

Install the recipes you need in an Astro app:

```sh
pnpm add -D @santi020k/lumen
pnpm add @santi020k/lumen-astro
pnpm exec lumen add article-reading --target astro
pnpm exec lumen add site-search-dialog --target astro
pnpm exec lumen add image-viewer --target astro
```

The Astro recipes were introduced in Lumen 4.4.0; the portable adapters arrive in Lumen 5.
To try a prepared release, use the built local CLI with `node packages/lumen/bin/lumen.mjs add <recipe> --target astro --cwd /path/to/your/project`.

The installer copies editable source into `src/lumen/`. Astro components import their required
styles automatically. Mount `UIPrimitives` once in your app layout. Each
instance needs unique IDs in the document. Supply translated labels where needed.

## Article reading

Pass `articleId` and a list of `chapters`, each with the exact heading `id`, a `label`, and
an optional heading `depth` from 2 to 6. Put the article title and body in the default slot:

```astro
---
import ArticleReading from '../lumen/article-reading.astro'

const chapters = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'configuration', label: 'Configuration' }
]
---

<ArticleReading articleId="guide" chapters={chapters}>
  <h1>Integration guide</h1>
  <h2 id="getting-started">Getting started</h2>
  <p>Install the adapter and add it to your layout.</p>
  <h2 id="configuration">Configuration</h2>
  <p>Set your defaults in the application layout.</p>
</ArticleReading>
```

The desktop rail and mobile disclosure share the same heading data and preserve native fragment
links. The runtime closes the mobile disclosure when a chapter is activated and moves focus to
its heading. The skip link targets the article itself, and the progress indicator stays visible
while the article is in view. Set `--article-reading-sticky-offset` to clear a sticky site header, and use
`--article-reading-heading-offset` if your headings need more room beyond the document's
`scroll-padding-block-start`.

## Site search dialog

Give `SiteSearchDialog` a unique `id` and a `fallbackHref` for the full search or browse page.
Then register the client provider. The function accepts a query and an abort signal, and returns
results with a `title`, `href`, and optional `description`. An empty array shows the empty
state. A thrown error or rejected promise offers a retry.

```astro
---
import SiteSearchDialog from '../lumen/site-search-dialog.astro'
---

<SiteSearchDialog id="site-search" fallbackHref="/search/" />

<script>
  import { setSiteSearchProvider } from '../lumen/site-search-provider'

  const entries = [{ href: '/guide/', title: 'Integration guide' }]

  const register = () => {
    setSiteSearchProvider('site-search', query =>
      entries.filter(entry => entry.title.toLowerCase().includes(query.toLowerCase()))
    )
  }

  register()
  document.addEventListener('astro:page-load', register)
</script>
```

Forward the abort signal to network requests. Keep indexing, ranking, data validation, and route
state in your app. The dialog renders HTTP and HTTPS destinations as native links, including
relative paths resolved against the page. Arrow keys move focus through results, Enter in the field
opens the first result, and Escape closes the dialog. Set `shortcut={false}` for additional
instances or if the app already owns the Control/Command+K shortcut. For translated result counts,
keep the `{count}` placeholder in `labels.results`.

## Image viewer

Pass a unique `id`, an accessible `title`, and the direct `href` of the original image.
Supply an optimized Lumen `Image` or Astro `Picture` in the default slot. The slot needs to
render one `img` with suitable alternative text. An optional `caption` slot appears beneath
the viewport. Set `ratio` to the width divided by height of the preview when known.

```astro
---
import { Image } from '@santi020k/lumen-astro'

import preview from '../assets/preview.webp'
import ImageViewer from '../lumen/image-viewer.astro'
---

<ImageViewer id="integration-diagram" title="Integration diagram" href={preview.src}>
  <Image src={preview} alt="Three services connect through a shared API." fit="contain" />
  <p slot="caption">The shared API connects the three services.</p>
</ImageViewer>
```

The image mounts when the viewer opens. Readers can zoom or pan through `MediaViewport`, retry
a failed load, or open the original file. The direct link remains available before enhancement.
Pass `viewportLabels` and `locale` to translate and format the viewport controls.

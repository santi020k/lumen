# Interactive editorial recipes

Install the recipes you need in an Astro app:

```sh
pnpm add @santi020k/lumen @santi020k/lumen-astro
pnpm exec lumen add article-reading --target astro
pnpm exec lumen add site-search-dialog --target astro
pnpm exec lumen add image-viewer --target astro
```

These recipes arrive in Lumen 4.4.0. To try them before publication, use the built local CLI
with `node packages/lumen/bin/lumen.mjs add <recipe> --target astro --cwd /path/to/your/project`.

The installer copies editable source into `src/lumen/`. Import
`@santi020k/lumen-astro/styles.css` and mount `UIPrimitives` once in your app layout. Each
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

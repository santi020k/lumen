# Editorial recipes

The `editorial` family brings five reusable compositions from Santiago Molina's website 4.1.0
into Lumen. It belongs in the existing recipe installer: consumers own editable source, while
Lumen continues to own the primitives and tokens. No separate cards or personal-brand package
is required.

## Install in an Astro project

```bash
pnpm add @santi020k/lumen-astro
pnpm exec lumen add editorial --target astro
```

This family is introduced in Lumen 4.4.0. Until that release is published, use a locally built
checkout of the CLI. From that checkout, copy the bundle into another project with:

```bash
node packages/lumen/bin/lumen.mjs add editorial --target astro --cwd /path/to/your-project
```

The target project needs `@santi020k/lumen-astro` installed. React and Web Components targets
are not available for this family.

The installer writes five independent components, an example page, and `EDITORIAL.md` into
`src/lumen/`. It preserves existing files by default. Review local edits before using `--force`.
Import `@santi020k/lumen-astro/styles.css` once in the root layout. Individual recipes render
without client JavaScript; the example's theme toggle needs Lumen's standard Astro runtime.

See the [installed component guide](../packages/lumen/templates/astro/editorial/src/lumen/EDITORIAL.md)
for the complete props and slots contract. The showcase imports those same files directly;
there is no second implementation to synchronize.

## Choose a composition

| Website source | Reusable recipe | Application owns |
| --- | --- | --- |
| `CoverSpread` | `editorial-cover-spread.astro` | Title, heading level/ID, metadata, optimized media and alt text |
| `ContentNotesHeader` | `editorial-introduction.astro` | Label, optional category, descriptive copy |
| `ShippedSystemCard` | `editorial-card.astro` | Heading level/ID, category, description, destination and action label |
| `ProjectReplacementNotice` | `editorial-replacement-notice.astro` | Earlier/current names, destination, explanation and action label |
| `PolicyContactCard` | `editorial-contact-panel.astro` | Heading level/ID, label, body and optional note |

The recipes contain no collection queries, personal copy, client assets, fixed component IDs,
website routes, or private styles. Choose unique heading IDs for every instance and meaningful
heading levels for the surrounding page. Pass localized strings through props and slots. Validate
untrusted destinations at the application's data boundary. External links can opt into Lumen's
safe new-tab handling with `newTab`.

Use Astro `Image` or `Picture` in the cover's `media` slot. Images, media loading policy, content
claims, and backend actions remain application responsibilities. The example page's decorative
art uses CSS and Lumen icons. Its content and navigation are illustrative.

The original compositions were generalized for Lumen's MIT distribution. Personal writing,
photographs, and third-party/client assets from the website are excluded.

## Preview and validation

Run the [standalone showcase](../apps/templates/README.md) and open `/templates/editorial`.
The documentation gallery uses the same catalog and source. Check phone and desktop widths,
light and dark themes, long labels, repeated instances, text zoom, and keyboard focus when
adapting a recipe. Keep the recipes' visible focus outlines and responsive wrapping.

The CLI installer tests cover all copied files, unsupported targets, and preservation of edits.
The template catalog and MCP tests keep supported targets aligned. Browser tests in
`tests/editorial/editorial.spec.ts` cover the rendered compositions.

Run `pnpm run test:editorial` to install the bundle through the built CLI into an isolated Astro
consumer, then check responsive layouts, repeated instances, safe links, focus, and no-JavaScript
rendering in Chromium and WebKit. The fixture imports no website or template stylesheet.

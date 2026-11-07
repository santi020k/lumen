# Selective installation in Lumen 5

Upgrading an existing application? Complete the required contract review in the
[v4-to-v5 migration guide](migrating-v4-to-v5.md) first. Selective delivery is optional; full CSS
and existing root exports remain supported. Verify publication before installing a registry version.

Install the CLI separately from the runtime adapter, then copy an editable wrapper:

    pnpm add -D @santi020k/lumen
    pnpm exec lumen add Button --target astro
    pnpm exec lumen add Button --target react
    pnpm exec lumen add Button --target elements

Astro wrappers import the public component file directly. Lumen 5 Astro components import their
foundation and component styles automatically. Mount UIPrimitives once in an application layout
when interactive components are used; static components need no runtime. For Markdown or manually
authored Lumen markup outside that component tree, explicitly import the foundation and every
required component stylesheet, and mount the runtime for interactive Astro behavior.

Generated filenames and Elements tag names use canonical acronym hyphenation: QRCode becomes
qr-code. Existing copied wrappers remain consumer-owned. Review
imports when replacing an older acronym wrapper; the installer preserves the old file rather than
renaming or deleting it.

React and Elements wrappers import the adapter foundation and selected component CSS. Bundlers
can deduplicate these shared imports. Elements wrappers register only the selected constructor,
preserving an existing registration on repeated evaluation. Compound child elements each need
their own registration. Install their wrappers or follow the compound component's documented setup.

The installer uses a verified public selective export when one exists. Other React and Elements
components retain a catalog import with an explicit “Catalog fallback” source comment. Such wrappers
register only their chosen element but still traverse the catalog dependency graph. They do not
promise selective JavaScript delivery. Recipes keep their documented composition and setup files.

The component CSS entries include their declared dependencies. Full styles.css remains a convenience
alternative to individually selected CSS. Do not combine full CSS with selective imports to claim
smaller route delivery; measure the emitted and requested assets in the actual application.

Select Paper, Field, Studio, santi020k or glass using the [optional appearance imports](appearance-presets.md#web).
The base includes Lumen light and dark.

## Source diagnostics

The source-only doctor accepts Astro automatic styles and React/Elements selective CSS only with
Lumen 5 version evidence. It first reads the nearest installed adapter manifest, then falls back to
a direct dependency range wholly within major 5. Unknown tags, workspace wildcards, mixed-major
ranges, and future majors do not imply the Lumen 5 contract. An installed older adapter takes
precedence over a requested major-5 range.

The doctor reads value imports from each source file, including aliases. It ignores type-only imports
and import examples in comments. It recognizes default Astro component imports and named selective
React/Elements imports.
It checks for the foundation and the component CSS associated with those source imports. Shared
workspace component CSS contributes to the application using that package. Existing full stylesheet
checks and legacy guidance remain available. Source imports describe setup intent; use the
[opt-in rendered audit](rendered-audit.md) to inspect actual local route requests and layout.

    pnpm exec lumen init --framework astro
    pnpm exec lumen init --framework react --tailwind
    pnpm exec lumen doctor --json

Setup prints the Lumen 5 foundation guidance. It does not install dependencies or register a complete
Elements catalog. Keep dry runs and conflict policies when adopting generated wrappers in an existing
project; rerunning add preserves edited files. Use `--merge --dry-run` to preview local-to-incoming
diffs. With `--merge`, missing files are added, identical files are skipped and edited files stay
untouched. A conflict returns exit code 1 so you can review the diff and apply selected edits.
Only `--force` replaces the local copy.

Doctor recognizes shared Core and umbrella CSS exports, Elements registration helpers and HTML script entries. It checks explicit built-in preset and glass usage for optional appearance CSS. These source checks cannot prove route coverage or dynamic theme choices.

## Consumer form measurement

The packed subscribe-form benchmark also renders Field, FieldError and Checkbox in its React fixture.
On November 6, 2026, the local v5 candidate traversed 2,364 modules with catalog imports and 35 with
selective imports. Both requested two assets. Requested gzip totals were 66,564 and 66,564 bytes,
respectively. This fixture demonstrates a smaller build graph with equivalent browser transfer size.
Run `pnpm run measure:subscribe-form` to reproduce with freshly packed packages. Application routes,
bundler versions and shared chunks can produce different results.

### React

Load the foundation once and import the style and component entry for each control.

```tsx
import '@santi020k/lumen-react/styles/foundation.css'
import '@santi020k/lumen-react/styles/components/button.css'
import '@santi020k/lumen-react/styles/components/card.css'
import '@santi020k/lumen-react/styles/components/input.css'
import '@santi020k/lumen-react/styles/components/label.css'
import { Button } from '@santi020k/lumen-react/components/button'
import { Card } from '@santi020k/lumen-react/components/card'
import { Input } from '@santi020k/lumen-react/components/input'
import { Label } from '@santi020k/lumen-react/components/label'

export function SubscribeForm() {
  return (
    <Card>
      <Label htmlFor="email">Email</Label>
      <Input id="email" name="email" type="email" placeholder="you@example.com" />
      <Button>Subscribe</Button>
    </Card>
  )
}
```

### Web Components

Import styles from a bundler entry and register the four elements used in the form.

```html
<script type="module">
  import '@santi020k/lumen-elements/styles/foundation.css'
  import '@santi020k/lumen-elements/styles/components/button.css'
  import '@santi020k/lumen-elements/styles/components/card.css'
  import '@santi020k/lumen-elements/styles/components/input.css'
  import '@santi020k/lumen-elements/styles/components/label.css'
  import { defineLumenButton } from '@santi020k/lumen-elements/components/button'
  import { defineLumenCard } from '@santi020k/lumen-elements/components/card'
  import { defineLumenInput } from '@santi020k/lumen-elements/components/input'
  import { defineLumenLabel } from '@santi020k/lumen-elements/components/label'

  defineLumenButton()
  defineLumenCard()
  defineLumenInput()
  defineLumenLabel()
</script>

<lumen-card>
  <lumen-label id="email-label">Email</lumen-label>
  <lumen-input aria-labelledby="email-label" id="email" name="email" type="email" placeholder="you@example.com"></lumen-input>
  <lumen-button>Subscribe</lumen-button>
</lumen-card>
```

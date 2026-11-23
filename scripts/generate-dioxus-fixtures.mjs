// Renders lumen-react components to static markup for the lumen-dioxus parity tests.
// The Rust tests in packages/dioxus/tests/parity.rs render the same cases with Dioxus and
// compare normalized markup, so both adapters keep emitting the classes Lumen's CSS expects.
//
// Requires built packages: pnpm --filter @santi020k/lumen-core --filter @santi020k/lumen-react build
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const check = process.argv.includes('--check')
const outputPath = join(root, 'packages/dioxus/tests/fixtures/react-markup.json')
const reactPackage = join(root, 'packages/react/package.json')
const requireFromReact = createRequire(reactPackage)
const { createElement: h } = requireFromReact('react')
const { renderToStaticMarkup } = requireFromReact('react-dom/server')
const L = await import(pathToFileURL(join(root, 'packages/react/dist/index.js')).href)

const cases = {
  'alert-default': h(L.Alert, null, 'A new version is available.'),
  'alert-destructive-glass': h(L.Alert, { glass: 'subtle', variant: 'destructive' }, 'Build failed.'),
  'avatar-fallback': h(L.Avatar, { fallback: 'SL' }),
  'avatar-image': h(L.Avatar, { alt: 'Santiago', src: 'https://example.com/a.png' }),
  'badge-default': h(L.Badge, null, 'New'),
  'badge-success-class': h(L.Badge, { className: 'extra', variant: 'success' }, 'Paid'),
  'button-default': h(L.Button, null, 'Save'),
  'button-destructive-lg': h(L.Button, { size: 'lg', variant: 'destructive' }, 'Delete'),
  'button-disabled': h(L.Button, { disabled: true }, 'Disabled'),
  'button-ghost-sm': h(L.Button, { size: 'sm', variant: 'ghost' }, 'Ghost'),
  'button-icon': h(L.Button, { 'aria-label': 'Close', size: 'icon', variant: 'outline' }, 'x'),
  'button-link': h(L.Button, { variant: 'link' }, 'Learn more'),
  'button-loading': h(L.Button, { loading: true }, 'Saving'),
  'button-secondary-submit': h(L.Button, { className: 'extra', type: 'submit', variant: 'secondary' }, 'Send'),
  'card-full': h(
    L.Card,
    null,
    h(L.CardHeader, null, h(L.CardTitle, null, 'Title'), h(L.CardDescription, null, 'Description')),
    h(L.CardContent, null, 'Body'),
    h(L.CardFooter, null, 'Footer')
  ),
  'card-glass-variant': h(L.Card, { variant: 'glass' }, 'Glass'),
  'card-muted-compact': h(L.Card, { density: 'compact', variant: 'muted' }, 'Muted'),
  'card-strong-glass-class': h(L.Card, { className: 'extra', glass: 'strong' }, 'Strong'),
  'field-error-empty': h(L.FieldError, null),
  'field-error-message': h(L.FieldError, { message: 'Use at least 3 characters.' }),
  'field-plain': h(L.Field, null, h(L.Label, { htmlFor: 'email' }, 'Email')),
  'field-invalid': h(L.Field, { controlId: 'name', describedBy: 'name-hint', invalid: true }, 'x'),
  'input-default': h(L.Input, { id: 'email' }),
  'input-sm-email': h(L.Input, { placeholder: 'you@example.com', type: 'email', visualSize: 'sm' }),
  'label-for': h(L.Label, { htmlFor: 'email' }, 'Email'),
  'progress-62': h(L.Progress, { 'aria-label': 'Upload', value: 62 }),
  'progress-clamped': h(L.Progress, { max: 50, value: 80 }),
  'progress-invalid': h(L.Progress, { max: -1, value: Number.NaN }),
  'separator-horizontal': h(L.Separator),
  'separator-vertical': h(L.Separator, { orientation: 'vertical' }),
  'spinner-hidden': h(L.Spinner),
  'spinner-named': h(L.Spinner, { 'aria-label': 'Loading' }),
  tabs: h(
    L.Tabs,
    { defaultValue: 'activity' },
    h(
      L.TabsList,
      { 'aria-label': 'Sections' },
      h(L.TabsTrigger, { value: 'overview' }, 'Overview'),
      h(L.TabsTrigger, { value: 'activity' }, 'Activity'),
      h(L.TabsTrigger, { disabled: true, value: 'settings' }, 'Settings')
    ),
    h(L.TabsPanel, { value: 'overview' }, 'One'),
    h(L.TabsPanel, { value: 'activity' }, 'Two'),
    h(L.TabsPanel, { value: 'settings' }, 'Three')
  ),
  'textarea-default': h(L.Textarea, { id: 'bio' }),
  'textarea-rows': h(L.Textarea, { rows: 3 })
}

// React 19 hoists an image preload hint ahead of the markup; it is not part of the component.
const preloadPrefix = '<link rel="preload"'

const withoutPreloadHint = html => {
  if (!html.startsWith(preloadPrefix)) return html

  const end = html.indexOf('/>')

  return end < 0 ? html : html.slice(end + 2)
}

const markup = Object.fromEntries(
  Object.entries(cases)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, element]) => [name, withoutPreloadHint(renderToStaticMarkup(element))])
)

const json = `${JSON.stringify(markup, null, 2)}\n`

if (check) {
  const current = await readFile(outputPath, 'utf8').catch(() => '')

  if (current !== json) {
    console.error('packages/dioxus/tests/fixtures/react-markup.json is stale. Run `pnpm run generate:dioxus-fixtures`.')

    process.exitCode = 1
  }
} else {
  await writeFile(outputPath, json)

  console.log(`Wrote ${Object.keys(markup).length} lumen-react markup fixtures.`)
}

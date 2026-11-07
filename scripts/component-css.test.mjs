import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

import { normalizeCssFamily, partitionComponentCss, selectorFamilies } from './lib/component-css.mjs'
import { readCssNodes, splitCssSelectors } from './lib/css-source.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('CSS scanning preserves nested and quoted delimiters', () => {
  const css = '/* heading */ @layer demo { .ui-button::before { content: "};{,"; } } .ui-card { color:red; }'
  const nodes = readCssNodes(css)

  assert.equal(nodes.length, 2)

  assert.equal(nodes[0].header, '@layer demo')

  assert.match(nodes[0].body, /content: "};{,"/)

  assert.equal(nodes[1].header, '.ui-card')

  assert.deepEqual(splitCssSelectors('.ui-button:is(:hover, :focus), [data-label="x,y"] .ui-card'), [
    '.ui-button:is(:hover, :focus)', '[data-label="x,y"] .ui-card'
  ])

  assert.throws(() => readCssNodes('.ui-button { content: "unterminated'), /Unterminated CSS string/)

  assert.throws(() => readCssNodes('.ui-button { color:red;'), /Unterminated CSS block/)

  assert.equal(readCssNodes(`/*${'x'.repeat(100_000)}*/ .ui-button { color:red; }`).length, 1)
})

test('selectors follow the affected component rather than pulling in ancestor features', () => {
  assert.deepEqual(selectorFamilies('.ui-card__footer .ui-button__content'), ['button'])

  assert.deepEqual(selectorFamilies(':is(.ui-line-chart, .ui-bar-chart) .ui-chart__plot > svg'), ['chart'])

  assert.deepEqual(selectorFamilies('.ui-prose :where(code:not(.ui-code, .ui-code code))'), ['prose'])

  assert.deepEqual(selectorFamilies('.ui-card:has(.ui-button)'), ['card'])

  assert.deepEqual(selectorFamilies('[data-ui-list-box-option][aria-selected="true"]'), ['list-box'])

  assert.equal(normalizeCssFamily('code-tabs__tab--active'), 'tabs')
})

test('splitting grouped selectors keeps each component cascade in canonical order', () => {
  const result = partitionComponentCss([
    '@layer lumen.tokens { :root { --brand: blue; } } @layer lumen.components { .ui-button, .ui-calendar { color:red; } .ui-button { color:blue; } }'
  ])

  assert.match(result.foundation, /--brand: blue/)

  assert.doesNotMatch(result.parts.get('button'), /ui-calendar/)

  assert.doesNotMatch(result.parts.get('calendar'), /color:blue/)

  const button = result.parts.get('button')

  assert(button.indexOf('color:red') < button.indexOf('color:blue'))
})

test('appearance scopes keep their lower boundary without absorbing neutral scopes', () => {
  const start = '[data-theme="santi020k-light"]'

  const { appearances, foundation, parts } = partitionComponentCss([
    `@layer lumen.components { @scope (${start}) to ([data-theme]) { .ui-card { color: purple; } }
    @scope (.demo) to (${start}) { .ui-card { color: black; } } }`
  ])

  assert.match(appearances['themes/santi020k'].join(''), /to \(\[data-theme\]\)/u)

  assert.match(parts.get('card'), /color: black/u)

  assert.doesNotMatch(foundation + parts.get('card'), /color: purple/u)
})

test('optional glass variables keep URL delimiters and media conditions', () => {
  const { appearances, foundation } = partitionComponentCss([
    '@layer lumen.tokens { @media print { :root { --glass-bg: url(data:image/svg+xml;base64,abc); --brand: blue } } }'
  ])

  const glass = appearances['effects/glass'].join('\n')

  assert.match(glass, /@media print/)

  assert.match(glass, /url\(data:image\/svg\+xml;base64,abc\)/)

  assert.doesNotMatch(glass, /--brand/)

  assert.match(foundation, /--brand: blue/)

  assert.doesNotMatch(foundation, /--glass-bg/)
})

test('selective entries contain their declared parts without repeating the shared foundation', async () => {
  const manifest = JSON.parse(await read('packages/core/styles/manifest.json'))

  for (const component of ['Button', 'Card', 'CodeTabs', 'Calendar', 'Select', 'Dialog']) {
    const entry = manifest[component]
    const css = await read(`packages/core/${entry.stylesheet}`)

    assert.doesNotMatch(css, /foundation\.css/, 'Import shared foundations once, outside component entries.')

    for (const part of entry.parts) assert(css.includes(`../parts/${part}.css`))
  }

  const button = await read('packages/core/styles/parts/button.css')

  assert.doesNotMatch(button, /\.ui-world-map|\.ui-phone-input|\.ui-schedule/)

  const calendar = await read('packages/core/styles/parts/calendar.css')

  assert.match(calendar, /prefers-reduced-motion|ui-calendar/)
})

test('all web packages resolve the public appearance styles', async () => {
  for (const adapter of ['core', 'astro', 'react', 'elements', 'lumen']) {
    const manifest = new URL(`../packages/${adapter}/package.json`, import.meta.url)
    const { name } = JSON.parse(await readFile(manifest, 'utf8'))
    const resolve = createRequire(manifest).resolve

    for (const entry of ['themes/studio', 'effects/glass', 'themes/santi020k', 'themes/paper', 'themes/field']) {
      const path = resolve(`${name}/styles/${entry}.css`)
      const css = await readFile(path, 'utf8')

      if (adapter === 'core' || (adapter === 'lumen' && ['themes/field', 'themes/paper'].includes(entry))) assert.match(css, /@layer lumen\.(?:tokens|glass) \{/u)
      else assert(css.includes(`@import "@santi020k/lumen-core/styles/${entry}.css"`))
    }
  }
})

test('Astro mounts the foundation separately so shared CSS is deduplicated across component chunks', async () => {
  for (const component of ['Button', 'Card', 'Calendar', 'CodeTabs']) {
    const source = await read(`packages/astro/components/${component}.astro`)

    assert(source.includes("import '../styles/foundation.css'"))

    assert.match(source, /import '\.\.\/styles\/components\/[a-z-]+\.css'/)
  }
})

test('generated SVGs include icon defaults without overriding component state across chunks', async () => {
  const metadata = JSON.parse(await read('registry/web-css.json'))

  for (const name of ['Code', 'SpeedDial', 'Table']) {
    assert(metadata.components[name].dependencies.includes('Icon'), `${name} renders shared SVG markup.`)
  }

  const icon = await read('packages/core/styles/parts/icon.css')

  assert.match(icon, /:where\(\.ui-icon\)\s*\{/)

  assert.match(icon, /:where\(\.ui-icon__svg\)\s*\{/)

  const code = await read('packages/core/styles/components/code.css')

  assert(code.indexOf('parts/icon.css') < code.indexOf('parts/code.css'))
})

test('every independent CSS chunk establishes the complete public order before Tailwind can create base', async () => {
  const canonical = readCssNodes(await read('packages/lumen/layers.css'))[0].header

  assert.equal(canonical, '@layer theme, base, lumen.tokens, lumen.base, components, lumen.components, lumen.glass, utilities')

  const roots = [
    'packages/core/styles', 'packages/astro/styles/parts', 'packages/astro/styles/runtime',
    ...['lumen', 'astro', 'react', 'elements'].map(adapter => `packages/${adapter}/styles/components`)
  ]

  for (const root of roots) {
    for (const entry of await readdir(new URL(`../${root}`, import.meta.url), { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.css')) continue

      const path = pathToFileURL(`${entry.parentPath}/${entry.name}`)
      const first = readCssNodes(await readFile(path, 'utf8'))[0]

      assert.equal(first?.header, canonical, `${root}/${entry.name} may load before a consumer's Tailwind stylesheet.`)
    }
  }

  for (const path of ['packages/lumen/styles.css', 'packages/lumen/styles/world-map.css', 'packages/lumen/styles/motion.css',
    ...['lumen', 'astro', 'react', 'elements'].map(adapter => `packages/${adapter}/styles/foundation.css`)]) {
    assert.equal(readCssNodes(await read(path))[0]?.header, canonical, path)
  }
})

test('map animation keyframes travel with the map instead of the foundation', () => {
  const result = partitionComponentCss(['.ui-world-map { animation: ui-map-enter 1s; } @keyframes ui-map-enter { from { opacity: 0; } }'])

  assert.doesNotMatch(result.foundation, /ui-map-enter/u)

  assert.match(result.parts.get('world-map'), /@keyframes ui-map-enter/u)
})

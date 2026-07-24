import { readFile } from 'node:fs/promises'

const componentSource = await readFile(
  new URL('../packages/core/src/components.ts', import.meta.url),
  'utf8'
)

const componentNames = [...componentSource.matchAll(/^ {2}'([^']+)',?$/gm)]
  .map(match => match[1])

const [elementsSource, reactComponentsSource, reactHooksSource] = await Promise.all([
  readFile(new URL('../packages/elements/src/define.ts', import.meta.url), 'utf8'),
  readFile(new URL('../packages/react/src/components.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../packages/react/src/hooks.tsx', import.meta.url), 'utf8')
])

const reactSource = `${reactComponentsSource}\n${reactHooksSource}`

const exceptions = {
  NativeSelect: 'ui-select'
}

const slug = (name) =>
  name
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace('qrcode', 'qr-code')

const failures = []

for (const name of componentNames) {
  const astroSource = await readFile(
    new URL(`../packages/astro/components/${name}.astro`, import.meta.url),
    'utf8'
  )

  const rootClass = exceptions[name] ?? `ui-${slug(name)}`

  for (const [framework, source] of [
    ['Astro', astroSource],
    ['React', reactSource],
    ['Elements', elementsSource]
  ]) {
    if (!source.includes(rootClass)) {
      failures.push(`${framework} ${name} is missing the shared ${rootClass} class contract`)
    }
  }
}

const sharedBehaviorAttributes = [
  'data-ui-alert-dialog',
  'data-ui-anchor',
  'data-ui-calendar',
  'data-ui-carousel',
  'data-ui-cascader',
  'data-ui-combobox',
  'data-ui-command',
  'data-ui-context-menu',
  'data-ui-date-picker',
  'data-ui-date-range-picker',
  'data-ui-dialog',
  'data-ui-drawer',
  'data-ui-dropdown-menu',
  'data-ui-field',
  'data-ui-file-upload',
  'data-ui-hover-card',
  'data-ui-input-otp',
  'data-ui-menubar',
  'data-ui-mentions',
  'data-ui-navigation-menu',
  'data-ui-popover',
  'data-ui-popconfirm',
  'data-ui-radio-group',
  'data-ui-resizable',
  'data-ui-rich-text-editor',
  'data-ui-schedule',
  'data-ui-select',
  'data-ui-sheet',
  'data-ui-speed-dial',
  'data-ui-tabs',
  'data-ui-theme-builder',
  'data-ui-toast',
  'data-ui-toggle',
  'data-ui-toggle-group',
  'data-ui-toolbar',
  'data-ui-tour',
  'data-ui-transfer',
  'data-ui-tree',
  'data-ui-tree-select',
  'data-ui-virtual-list'
]

const allAstroSource = (
  await Promise.all(componentNames.map(name =>
    readFile(new URL(`../packages/astro/components/${name}.astro`, import.meta.url), 'utf8')
  ))
).join('\n')

for (const attribute of sharedBehaviorAttributes) {
  for (const [framework, source] of [
    ['Astro', allAstroSource],
    ['React', reactSource],
    ['Elements', elementsSource]
  ]) {
    if (!source.includes(attribute)) {
      failures.push(`${framework} is missing the shared ${attribute} behavior contract`)
    }
  }
}

if (failures.length) {
  throw new Error(`Framework contract parity failed:\n${failures.join('\n')}`)
}

process.stdout.write(
  `Checked ${componentNames.length} component class contracts and ${sharedBehaviorAttributes.length} behavior contracts across Astro, React, and Elements.\n`
)

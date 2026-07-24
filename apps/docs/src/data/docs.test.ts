import {
  existsSync,
  readdirSync,
  readFileSync
} from 'node:fs'
import {
  dirname,
  extname,
  join
} from 'node:path'
import { fileURLToPath } from 'node:url'

import { lumenComponentNames } from '@santi020k/lumen-core'

import { describe, expect, test } from 'vitest'

import { buildSnippets } from '../lib/snippets'

import {
  componentCollections,
  componentDocs,
  figmaLibraryUrl,
  frameworkGuides,
  frameworkSetups,
  getFigmaComponentUrl,
  glassComponentNames,
  glassSurfaceExamples,
  globalStyleSetups,
  themeSetups
} from './docs'

const staleAttributePatterns = [
  'data-dialog-trigger',
  'data-popover-trigger',
  'data-popover-content',
  'data-menu-trigger',
  'data-collapsible-trigger',
  'data-collapsible-content',
  'data-command-item'
]

const dataDirectory = dirname(fileURLToPath(import.meta.url))
const examplesDirectory = join(dataDirectory, '..', 'examples')
const publicDirectory = join(dataDirectory, '..', '..', 'public')

const exampleFileNames = readdirSync(examplesDirectory)
  .filter(fileName => fileName.endsWith('.astro'))
  .map(fileName => fileName.replace('.astro', ''))

const sortByName = (names: readonly string[]) => [...names].sort((a, b) => a.localeCompare(b))
const documentedComponentNames = lumenComponentNames.filter(name => name !== 'Sonner')

describe('component docs snippets', () => {
  test('document every user-facing component exactly once', () => {
    expect(componentDocs.map(component => component.name)).toEqual(documentedComponentNames)
  })

  test('include a live example file for every documented component', () => {
    expect(sortByName(exampleFileNames)).toEqual(sortByName(documentedComponentNames))
  })

  test('distinguish commonly confused component families', () => {
    const overlappingComponents = [
      'Alert',
      'Badge',
      'Callout',
      'Combobox',
      'Dialog',
      'Eyebrow',
      'FloatingBadge',
      'Item',
      'Meter',
      'NativeSelect',
      'Note',
      'Pill',
      'Popover',
      'Progress',
      'Schedule',
      'Select',
      'Sheet',
      'Switch',
      'Toast',
      'Toggle',
      'Tooltip'
    ]

    for (const name of overlappingComponents) {
      const component = componentDocs.find(entry => entry.name === name)

      expect(component?.guidance?.when, `${name} needs "use it when" guidance`).toBeTruthy()
      expect(component?.guidance?.distinction, `${name} needs comparison guidance`).toBeTruthy()
    }
  })

  test('group similar components into valid comparison collections', () => {
    const documentedNames = new Set(componentDocs.map(component => component.name))

    for (const collection of componentCollections) {
      expect(collection.names.length, `${collection.title} should compare multiple components`)
        .toBeGreaterThan(1)

      for (const name of collection.names) {
        expect(documentedNames.has(name), `${collection.title} references unknown component ${name}`)
          .toBe(true)
      }
    }
  })

  test('link documented Figma components to their exact design nodes', () => {
    const linkedComponents = componentDocs.filter(component => component.figmaNodeId)

    expect(linkedComponents.length).toBeGreaterThan(90)
    expect(getFigmaComponentUrl()).toBe(figmaLibraryUrl)

    for (const component of linkedComponents) {
      const nodeId = component.figmaNodeId

      expect(nodeId).toBeDefined()

      if (!nodeId) throw new Error(`${component.name} is missing its Figma node ID`)

      expect(getFigmaComponentUrl(component.figmaNodeId))
        .toBe(`${figmaLibraryUrl}?node-id=${nodeId.replace(':', '-')}`)
    }
  })

  test('only link to existing public assets from examples', () => {
    const localAssetPattern = /\b(?:href|src)="([^"]+)"/g

    for (const fileName of readdirSync(examplesDirectory).filter(file => file.endsWith('.astro'))) {
      const source = readFileSync(join(examplesDirectory, fileName), 'utf8')

      for (const match of source.matchAll(localAssetPattern)) {
        const target = match[1]

        if (!target?.startsWith('/')) continue

        const assetPath = target.replace(/[?#].*$/, '')

        if (!extname(assetPath)) continue

        expect(existsSync(join(publicDirectory, assetPath))).toBe(true)
      }
    }
  })

  test('keeps native media and navigation examples usable', () => {
    const imageExample = readFileSync(join(examplesDirectory, 'Image.astro'), 'utf8')
    const linkExample = readFileSync(join(examplesDirectory, 'Link.astro'), 'utf8')
    const skipLinkExample = readFileSync(join(examplesDirectory, 'SkipLink.astro'), 'utf8')
    const formattedDateExample = readFileSync(join(examplesDirectory, 'FormattedDate.astro'), 'utf8')

    expect(imageExample).toContain('src="/logo.svg"')
    expect(imageExample).toContain('alt="Lumen UI logo"')
    expect(imageExample).toContain('invertOnDark')
    expect(imageExample).toContain('layout="fixed"')
    expect(linkExample).toContain('href="/docs"')
    expect(skipLinkExample).toContain('href="#skip-link-demo-target"')
    expect(skipLinkExample).toContain('id="skip-link-demo-target"')
    expect(skipLinkExample).toContain('tabindex="-1"')
    expect(componentDocs.find(component => component.name === 'SkipLink')?.guidance?.when)
      .toContain('first focusable element')
    expect(componentDocs.find(component => component.name === 'SkipLink')?.guidance?.distinction)
      .toContain('main content target')
    expect(formattedDateExample).toContain('datetime="2026-07-23"')
  })

  test('keeps Toast as the single documented notification entry point', () => {
    const toastExample = readFileSync(join(examplesDirectory, 'Toast.astro'), 'utf8')

    expect(componentDocs.some(component => component.name === 'Sonner')).toBe(false)
    expect(toastExample).toContain('LumenToast?.create(detail)')
    expect(toastExample).not.toContain('Sonner')
    expect(toastExample).not.toContain("new CustomEvent('ui:toast'")
  })

  test('use the public data-ui runtime attribute contract', () => {
    const examples = componentDocs.map(component => component.example).join('\n')

    for (const attribute of staleAttributePatterns) {
      expect(examples).not.toContain(attribute)
    }
  })

  test('include API reference rows for every component', () => {
    for (const component of componentDocs) {
      expect(component.apiReference.length).toBeGreaterThan(0)
      expect(component.apiReference.map(row => row.attribute)).toContain('class, className')
      expect(component.apiReference.map(row => row.attribute)).toContain('...native attributes')
    }

    const buttonAttributes = componentDocs
      .find(component => component.name === 'Button')
      ?.apiReference
      .map(row => row.attribute)

    expect(buttonAttributes).toContain('variant')
    expect(buttonAttributes).toContain('size')
  })

  test('document installation and usage for each framework target', () => {
    expect(frameworkSetups.map(setup => setup.id)).toEqual(['astro', 'react', 'elements'])

    for (const setup of frameworkSetups) {
      expect(setup.installCommands.map(command => command.label)).toEqual(['pnpm', 'npm', 'yarn'])
      expect(setup.usage).toContain(setup.packageName)
    }

    expect(frameworkSetups.find(setup => setup.id === 'react')?.installCommands[0]?.command)
      .toBe('pnpm add @santi020k/lumen-react')
    expect(frameworkSetups.find(setup => setup.id === 'elements')?.installCommands[0]?.command)
      .toBe('pnpm add @santi020k/lumen-elements')
    expect(frameworkSetups.find(setup => setup.id === 'astro')?.installCommands[0]?.command)
      .toBe('pnpm add @santi020k/lumen-astro')
    expect(frameworkSetups.find(setup => setup.id === 'astro')?.note)
      .toContain('Mount UIPrimitives once in your root layout')
  })

  test('document framework-specific behavior and wrapper guidance', () => {
    expect(frameworkGuides.map(guide => guide.id)).toEqual(['astro', 'react', 'elements'])

    const guideText = frameworkGuides
      .map(guide => `${guide.title}\n${guide.packageName}\n${guide.body.join('\n')}\n${guide.code}`)
      .join('\n')

    expect(guideText).toContain('UIPrimitives')
    expect(guideText).toContain('lumen add recipe-name --target astro')
    expect(guideText).toContain('useDialog')
    expect(guideText).toContain('useContextMenu')
    expect(guideText).toContain('useFormValidation')
    expect(guideText).toContain('useCalendar')
    expect(guideText).toContain('useInputOTP')
    expect(guideText).toContain('useDateRangePicker')
    expect(guideText).toContain('useRichTextEditor')
    expect(guideText).toContain('useSchedule')
    expect(guideText).toContain('useResizable')
    expect(guideText).toContain('lumen add Component --target react')
    expect(guideText).toContain('lumen add recipe-name --target react')
    expect(guideText).toContain('defineLumenElements')
    expect(guideText).toContain('form validation')
    expect(guideText).toContain('calendar grids')
    expect(guideText).toContain('OTP segmentation')
    expect(guideText).toContain('date range syncing')
    expect(guideText).toContain('context menu triggers')
    expect(guideText).toContain('rich text commands')
    expect(guideText).toContain('schedule drag/drop')
    expect(guideText).toContain('resizable pane sizing')
    expect(guideText).toContain('lumen add Component --target elements')
    expect(guideText).toContain('lumen add recipe-name --target elements')
  })

  test('keep component snippets focused on component usage instead of runtime mounting', () => {
    const snippets = buildSnippets('Dialog', `---
import { Button, Dialog } from '@santi020k/lumen-astro'
---

<Button data-ui-dialog-trigger="settings">Open settings</Button>
<Dialog id="settings">
  <Button data-ui-dialog-close>Close</Button>
</Dialog>
`)

    const astroSnippet = snippets.find(snippet => snippet.label === 'Astro')?.code ?? ''

    expect(astroSnippet).toContain("import { Button, Dialog } from '@santi020k/lumen-astro'")
    expect(astroSnippet).not.toContain('UIPrimitives')
  })

  test('documents the stylesheet as a one-time global setup', () => {
    expect(globalStyleSetups.map(setup => setup.label)).toEqual(['Astro + Tailwind', 'Astro layout', 'App entry'])
    const styleSetupCode = globalStyleSetups.map(setup => setup.code).join('\n')

    expect(styleSetupCode).toContain('@santi020k/lumen-astro/styles.css')
    expect(styleSetupCode).toContain('@santi020k/lumen-react/styles.css')
  })

  test('documents built-in and example theme setup', () => {
    const themeExamples = themeSetups.map(setup => `${setup.description}\n${setup.code}`).join('\n')

    expect(themeSetups.map(setup => setup.label)).toEqual(['Default themes', 'Runtime switch', 'Custom theme'])
    expect(themeExamples).toContain('data-theme')
    expect(themeExamples).toContain('light')
    expect(themeExamples).toContain('dark')
    expect(themeExamples).toContain('santi020k-light')
    expect(themeExamples).toContain('santi020k-dark')
  })

  test('documents glass support without making it a theme', () => {
    const glassDocs = componentDocs.filter(component => component.glass)
    const glassExampleCode = glassSurfaceExamples.map(example => example.code).join('\n')

    expect(glassDocs.map(component => component.name)).toEqual([...glassComponentNames])
    expect(glassComponentNames.length).toBeGreaterThanOrEqual(30)
    expect(glassDocs.every(component => component.apiReference.some(row => row.attribute === 'glass'))).toBe(true)
    expect(glassComponentNames).toContain('DatePicker')
    expect(glassComponentNames).toContain('Select')
    expect(glassExampleCode).toContain('<Card glass>')
    expect(glassExampleCode).toContain('<Popover glass>')
    expect(glassExampleCode).toContain('<lumen-card glass>')
    expect(glassExampleCode).not.toContain('data-theme')
  })
})

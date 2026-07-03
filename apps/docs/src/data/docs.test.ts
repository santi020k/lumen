import { describe, expect, test } from 'vitest'

import {
  componentDocs,
  frameworkSetups,
  globalStyleSetups
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

describe('component docs snippets', () => {
  test('use the public data-ui runtime attribute contract', () => {
    const examples = componentDocs.map(component => component.example).join('\n')

    for (const attribute of staleAttributePatterns) {
      expect(examples).not.toContain(attribute)
    }
  })

  test('document installation and usage for each framework target', () => {
    expect(frameworkSetups.map(setup => setup.id)).toEqual(['astro', 'react', 'elements'])

    for (const setup of frameworkSetups) {
      expect(setup.installCommands.map(command => command.label)).toEqual(['pnpm', 'npm', 'yarn'])
      expect(setup.usage).toContain(setup.packageName)
    }

    expect(frameworkSetups.find(setup => setup.id === 'react')?.installCommands[0]?.command)
      .toBe('pnpm add @santi020k/lumen-react @santi020k/lumen-astro')
    expect(frameworkSetups.find(setup => setup.id === 'elements')?.installCommands[0]?.command)
      .toBe('pnpm add @santi020k/lumen-elements @santi020k/lumen-astro')
  })

  test('documents the stylesheet as a one-time global setup', () => {
    expect(globalStyleSetups.map(setup => setup.label)).toEqual(['Tailwind CSS', 'Astro layout', 'App entry'])
    expect(globalStyleSetups.map(setup => setup.code).join('\n')).toContain('@santi020k/lumen-astro/styles.css')
  })
})

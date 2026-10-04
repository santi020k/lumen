import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { componentDocs, reactHooksReference } from './docs'
import { reactHookGroups, reactHookGuides } from './react-hooks'

describe('focused React hook documentation', () => {
  test('keeps every documented hook and its full API and example on one unique route', () => {
    expect(reactHookGuides.map(hook => hook.name)).toEqual(reactHooksReference.map(hook => hook.name))
    expect(new Set(reactHookGuides.map(hook => hook.href)).size).toBe(reactHooksReference.length)

    for (const source of reactHooksReference) {
      const guide = reactHookGuides.find(hook => hook.name === source.name)

      expect(guide).toMatchObject(source)
      expect(guide?.href).toMatch(/^\/docs\/frameworks\/react\/hooks\/use-[a-z-]+$/u)
    }
  })

  test('places every hook in exactly one browse group', () => {
    const groupedNames = reactHookGroups.flatMap(group => [...group.names])

    expect(groupedNames.toSorted()).toEqual(reactHooksReference.map(hook => hook.name).toSorted())
  })

  test('links every hook to a documented component with a real visual example', () => {
    for (const guide of reactHookGuides) {
      expect(componentDocs.some(component => component.name === guide.componentName)).toBe(true)
      expect(existsSync(fileURLToPath(new URL(`../examples/${guide.componentName}.astro`, import.meta.url)))).toBe(true)
    }
  })
})

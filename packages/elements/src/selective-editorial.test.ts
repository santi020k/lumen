import { expect, test } from 'vitest'

import { defineLumenElements, lumenElementDefinitions } from './define.js'
import {
  defineLumenAnchor,
  defineLumenDialog,
  defineLumenDialogParts,
  defineLumenScrollProgress,
  defineLumenSearchField,
  LumenAnchorElement,
  LumenDialogBodyElement,
  LumenDialogElement,
  LumenScrollProgressElement,
  LumenSearchFieldElement
} from './editorial-behaviors.js'

test('selective and full registration use the same editorial constructors in either order', () => {
  const definitions = new Map<string, CustomElementConstructor>()
  const registry = {
    define: (name: string, constructor: CustomElementConstructor) => {
      definitions.set(name, constructor)
    },
    get: (name: string) => definitions.get(name)
  }
  defineLumenDialog(registry)
  defineLumenDialogParts(registry)
  defineLumenAnchor(registry)
  defineLumenScrollProgress(registry)
  defineLumenSearchField(registry)
  defineLumenElements(registry)
  expect(definitions.get('lumen-dialog')).toBe(LumenDialogElement)
  expect(definitions.get('lumen-dialog-body')).toBe(LumenDialogBodyElement)
  expect(definitions.get('lumen-anchor')).toBe(LumenAnchorElement)
  expect(definitions.get('lumen-scroll-progress')).toBe(LumenScrollProgressElement)
  expect(definitions.get('lumen-search-field')).toBe(LumenSearchFieldElement)
  expect(lumenElementDefinitions.find(([name]) => name === 'lumen-dialog')?.[1]).toBe(LumenDialogElement)
})

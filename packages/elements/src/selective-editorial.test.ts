import { expect, test } from 'vitest'

import { defineLumenAnchor, LumenAnchorElement } from './entries/anchor.js'
import { defineLumenDialog, defineLumenDialogParts, LumenDialogBodyElement, LumenDialogElement } from './entries/dialog.js'
import { defineLumenInput, LumenInputElement } from './entries/input.js'
import { defineLumenScrollProgress, LumenScrollProgressElement } from './entries/scroll-progress.js'
import { defineLumenSearchField, LumenSearchFieldElement } from './entries/search-field.js'
import { defineLumenElements, lumenElementDefinitions } from './define.js'

test.each(['selective-first', 'full-first'])('selective and full registration share constructors with %s', order => {
  const definitions = new Map<string, CustomElementConstructor>()
  const registry = {
    define: (name: string, constructor: CustomElementConstructor) => {
      if (definitions.has(name)) throw new Error('Duplicate element registration')

      definitions.set(name, constructor)
    },
    get: (name: string) => definitions.get(name)
  }
  if (order === 'full-first') defineLumenElements(registry)

  defineLumenDialog(registry)
  defineLumenDialogParts(registry)
  defineLumenAnchor(registry)
  defineLumenScrollProgress(registry)
  defineLumenInput(registry)
  defineLumenSearchField(registry)
  defineLumenElements(registry)
  expect(definitions.get('lumen-dialog')).toBe(LumenDialogElement)
  expect(definitions.get('lumen-dialog-body')).toBe(LumenDialogBodyElement)
  expect(definitions.get('lumen-anchor')).toBe(LumenAnchorElement)
  expect(definitions.get('lumen-scroll-progress')).toBe(LumenScrollProgressElement)
  expect(definitions.get('lumen-input')).toBe(LumenInputElement)
  expect(definitions.get('lumen-search-field')).toBe(LumenSearchFieldElement)
  expect(lumenElementDefinitions.find(([name]) => name === 'lumen-dialog')?.[1]).toBe(LumenDialogElement)
})

import { expect, test } from 'vitest'

import { importedComponents } from './component-imports.js'
import { hasComponentCss } from './style-coverage.js'

test('recognizes selective aliases and ignores types, comments and arbitrary subpaths', () => {
  expect(importedComponents(`---
import Dialog from '@santi020k/lumen-astro/components/Dialog.astro'
import type Card from '@santi020k/lumen-astro/components/Card.astro'
// import Button from '@santi020k/lumen-astro/components/Button.astro'
---
<Dialog />`, 'astro')).toEqual(['Dialog'])
  expect(importedComponents(`
import { Button as Local, type ButtonProps } from '@santi020k/lumen-react/components/button'
import { Dialog } from '@santi020k/lumen-react/components/missing'
`, 'react')).toEqual(['Button'])
  expect(importedComponents('import { LumenButtonElement } from \'@santi020k/lumen-elements/components/button\'', 'elements')).toEqual(['Button'])
})

test('uses canonical CSS dependency and shared-part coverage', () => {
  expect(hasComponentCss('Spinner', new Set(['@santi020k/lumen-react/styles/components/button.css']), 'react')).toBe(true)
  expect(hasComponentCss('Input', new Set(['@santi020k/lumen-core/styles/components/search-field.css']), 'react')).toBe(true)
  expect(hasComponentCss('DialogBody', new Set(['@santi020k/lumen-react/styles/components/dialog.css']), 'react')).toBe(false)
})

test('does not infer component setup from adversarially nested or long commented source', () => {
  expect(importedComponents('/*' + 'import Card'.repeat(50000) + '*/', 'astro')).toEqual([])
  expect(importedComponents('('.repeat(20000) + '0' + ')'.repeat(20000), 'astro')).toEqual([])
})

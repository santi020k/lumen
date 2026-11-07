import { expect, test } from 'vitest'

import { readComponentImports } from './component-imports.js'
import { hasComponentCss } from './style-coverage.js'

test('recognizes selective aliases and ignores types, comments and arbitrary subpaths', () => {
  expect(readComponentImports(`---
import Dialog from '@santi020k/lumen-astro/components/Dialog.astro'
import type Card from '@santi020k/lumen-astro/components/Card.astro'
// import Button from '@santi020k/lumen-astro/components/Button.astro'
---
<Dialog />`).astro.components).toEqual(['Dialog'])
  expect(readComponentImports(`
import { Button as Local, type ButtonProps } from '@santi020k/lumen-react/components/button'
import { Dialog } from '@santi020k/lumen-react/components/missing'
`).react.components).toEqual(['Button'])
  expect(readComponentImports('import { LumenButtonElement } from \'@santi020k/lumen-elements/components/button\'').elements.components).toEqual(['Button'])
})

test('uses canonical CSS dependency and shared-part coverage', () => {
  expect(hasComponentCss('Spinner', new Set(['@santi020k/lumen-react/styles/components/button.css']), 'react')).toBe(true)
  expect(hasComponentCss('Input', new Set(['@santi020k/lumen-core/styles/components/search-field.css']), 'react')).toBe(true)
  expect(hasComponentCss('DialogBody', new Set(['@santi020k/lumen-react/styles/components/dialog.css']), 'react')).toBe(false)
})

test('does not infer component setup from adversarially nested or long commented source', () => {
  expect(readComponentImports('/*' + 'import Card'.repeat(50000) + '*/').astro.components).toEqual([])
  expect(readComponentImports('('.repeat(20000) + '0' + ')'.repeat(20000)).astro.components).toEqual([])
})

test.each(['\uFEFF', '\n', ' \r\n'])('isolates Astro imports after leading whitespace %j', prefix => {
  const imports = readComponentImports(prefix + '---\r\nimport { Dialog } from \'@santi020k/lumen-astro\'\r\n---\r\n' +
    '<!-- import { Card } from \'@santi020k/lumen-astro\' -->')

  expect(imports.astro).toEqual({ components: ['Dialog'], rootNames: ['Dialog'] })
})

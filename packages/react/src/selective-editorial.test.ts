import { expect, test } from 'vitest'

import { Dialog } from './dialog.js'
import { Button, SearchField } from './editorial-controls.js'
import * as catalog from './index.js'
import { Anchor, ScrollProgress } from './reading-navigation.js'

test('selective editorial components preserve the full entry identities', () => {
  expect(catalog.Button).toBe(Button)
  expect(catalog.SearchField).toBe(SearchField)
  expect(catalog.Dialog).toBe(Dialog)
  expect(catalog.Anchor).toBe(Anchor)
  expect(catalog.ScrollProgress).toBe(ScrollProgress)
})

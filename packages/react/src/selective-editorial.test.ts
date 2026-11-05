import { expect, test } from 'vitest'

import { Anchor } from './entries/anchor.js'
import { Button } from './entries/button.js'
import { Dialog } from './entries/dialog.js'
import { ScrollProgress } from './entries/scroll-progress.js'
import { SearchField } from './entries/search-field.js'
import * as catalog from './index.js'

test('selective editorial components preserve the full entry identities', () => {
  expect(catalog.Button).toBe(Button)
  expect(catalog.SearchField).toBe(SearchField)
  expect(catalog.Dialog).toBe(Dialog)
  expect(catalog.Anchor).toBe(Anchor)
  expect(catalog.ScrollProgress).toBe(ScrollProgress)
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { JSDOM } from 'jsdom'

import { compositionMatchingSelector } from './composition-selectors.mjs'

test('pseudo-element-only selectors retain their implicit universal element', () => {
  const dom = new JSDOM('<dialog class="ui-dialog"></dialog>')

  try {
    for (const selector of ['::backdrop', '*::backdrop', '::before', '::after']) {
      assert.notEqual(dom.window.document.querySelector(compositionMatchingSelector(selector)), null)
    }
  } finally {
    dom.window.close()
  }
})

test('removing pseudo-elements preserves the actual element selector', () => {
  assert.equal(compositionMatchingSelector('.ui-dialog::backdrop'), '.ui-dialog')

  assert.equal(compositionMatchingSelector('.ui-dialog[open]::backdrop'), '.ui-dialog[open]')

  assert.equal(compositionMatchingSelector('.missing::before'), '.missing')
})

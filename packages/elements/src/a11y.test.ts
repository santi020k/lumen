/**
 * Axe-core smoke tests over representative Lumen element markup.
 * Runs in jsdom; color-contrast is excluded because it requires a real
 * rendering engine (covered by the Playwright visual suite instead).
 */
import axe from 'axe-core'
import { beforeAll, describe, expect, test } from 'vitest'

import { defineLumenElements } from './define.js'

const runAxe = async (html: string) => {
  document.body.innerHTML = html

  const results = await axe.run(document.body, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false }
    }
  })

  return results.violations
}

beforeAll(() => {
  defineLumenElements()
})

describe('lumen elements accessibility', () => {
  test('button markup has no axe violations', async () => {
    const violations = await runAxe(`
      <lumen-button role="button" tabindex="0">Save changes</lumen-button>
      <lumen-button role="button" tabindex="0" loading="true" aria-busy="true">Saving</lumen-button>
    `)

    expect(violations).toEqual([])
  })

  test('form field markup has no axe violations', async () => {
    const violations = await runAxe(`
      <lumen-field>
        <label class="ui-label" for="a11y-email">Email</label>
        <input class="ui-input" id="a11y-email" type="email" aria-invalid="true" aria-describedby="a11y-email-error" />
        <p class="ui-field__error" data-ui-field-error id="a11y-email-error">Enter a valid email address.</p>
      </lumen-field>
    `)

    expect(violations).toEqual([])
  })

  test('tabs markup has no axe violations', async () => {
    const violations = await runAxe(`
      <lumen-tabs data-ui-tabs>
        <div role="tablist" aria-label="Sections">
          <button role="tab" id="a11y-tab-1" aria-selected="true" aria-controls="a11y-panel-1">Preview</button>
          <button role="tab" id="a11y-tab-2" aria-selected="false" aria-controls="a11y-panel-2" tabindex="-1">Code</button>
        </div>
        <section role="tabpanel" id="a11y-panel-1" aria-labelledby="a11y-tab-1">Panel</section>
        <section role="tabpanel" id="a11y-panel-2" aria-labelledby="a11y-tab-2" hidden>Panel</section>
      </lumen-tabs>
    `)

    expect(violations).toEqual([])
  })

  test('menu markup has no axe violations', async () => {
    const violations = await runAxe(`
      <lumen-dropdown-menu>
        <button aria-haspopup="menu" aria-expanded="false" data-ui-trigger>Actions</button>
        <div role="menu" hidden>
          <button role="menuitem">Rename</button>
          <button role="menuitem">Duplicate</button>
        </div>
      </lumen-dropdown-menu>
    `)

    expect(violations).toEqual([])
  })

  test('glass toast markup keeps status semantics', async () => {
    const violations = await runAxe(`
      <lumen-toast role="status" glass="strong">
        <strong>Build complete</strong>
        <p>Deployed in 42s.</p>
      </lumen-toast>
    `)

    expect(violations).toEqual([])
  })
})

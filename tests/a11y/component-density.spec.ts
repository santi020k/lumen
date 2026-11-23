import { readFile } from 'node:fs/promises'

import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

// Deliberate CSS contract fixtures: no runtime or docs-app styles can mask the library rules.
const canonicalCss = readFile(new URL('../../packages/lumen/styles.css', import.meta.url), 'utf8')

const mount = async (page: Page, markup: string) => {
  const css = (await canonicalCss).split('\n').filter(line => !line.startsWith('@import ')).join('\n')
  await page.setContent(`<html lang="en"><head><style>${css}</style></head><body>${markup}</body></html>`)
}

const controls = (id: string, density?: string) => `
  <section id="${id}" ${density ? `data-ui-density="${density}"` : ''}>
    <label class="ui-field">Name <input class="ui-input" value="Santiago"></label>
    <button class="ui-button ui-button--default ui-button--default-size">Save</button>
    <div class="ui-card"><p>Account details</p></div>
    <div class="ui-table-wrap"><table><tbody><tr><td>Active</td></tr></tbody></table></div>
    <ul class="ui-menu"><li><button type="button">Rename</button></li></ul>
  </section>`

test('density coordinates controls, fields, cards, tables and menus without changing the default', async ({ page }) => {
  await page.setViewportSize({ height: 1000, width: 1280 })
  await mount(page, controls('default') + controls('compact', 'compact') + controls('comfortable', 'comfortable') + controls('spacious', 'spacious'))

  await expect(page.locator('#default .ui-input')).toHaveCSS('height', '44px')
  await expect(page.locator('#default .ui-button')).toHaveCSS('min-height', '40px')

  for (const [density, height, padding, cellPadding, menuPadding] of [
    ['compact', '36px', '16px', '8px', '6px'],
    ['comfortable', '44px', '24px', '12px', '8.8px'],
    ['spacious', '52px', '32px', '16px', '12px']
  ] as const) {
    const scope = page.locator(`#${density}`)
    await expect(scope.locator('.ui-input')).toHaveCSS('height', height)
    await expect(scope.locator('.ui-button')).toHaveCSS('min-height', height)
    await expect(scope.locator('.ui-card')).toHaveCSS('padding-top', padding)
    await expect(scope.locator('td')).toHaveCSS('padding-top', cellPadding)
    await expect(scope.locator('.ui-menu button')).toHaveCSS('padding-top', menuPadding)
  }
  await expect(page.locator('#compact .ui-field')).toHaveCSS('gap', '6px')
  await expect(page.locator('#spacious .ui-field')).toHaveCSS('gap', '12px')
})

test('nested density resets and explicit component sizes retain their priority', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 })
  await mount(page, `<section data-ui-density="compact">
    <div data-ui-density="spacious">
      <input class="ui-input" aria-label="Spacious">
      <input class="ui-input ui-input--sm" aria-label="Small">
      <div class="ui-card ui-card--compact">Compact card</div>
      <div data-ui-density="comfortable"><input class="ui-input" aria-label="Comfortable"></div>
    </div>
  </section>`)
  await expect(page.getByRole('textbox', { name: 'Spacious', exact: true })).toHaveCSS('height', '52px')
  await expect(page.getByRole('textbox', { name: 'Small', exact: true })).toHaveCSS('height', '36px')
  await expect(page.getByRole('textbox', { name: 'Comfortable', exact: true })).toHaveCSS('height', '44px')
  await expect(page.locator('.ui-card')).toHaveCSS('padding-top', '16px')
})

for (const context of ['narrow', 'touch'] as const) {
  test(`compact density preserves target sizes and input text on ${context} screens`, async ({ browser }) => {
    const browserContext = await browser.newContext({
      hasTouch: context === 'touch',
      viewport: { height: 900, width: context === 'narrow' ? 390 : 1280 }
    })
    const page = await browserContext.newPage()
    try {
      await mount(page, `<section data-ui-density="compact">
        <input class="ui-input ui-input--sm" aria-label="Name">
        <button class="ui-button ui-button--sm">Save</button>
        <button class="ui-button ui-button--icon" aria-label="More">+</button>
        <ul class="ui-menu"><li><button>Rename</button></li></ul>
        <div class="ui-select__list"><button role="option" aria-selected="false">Option</button></div>
      </section>`)
      for (const selector of ['.ui-input', '.ui-button', '.ui-menu button', '[role="option"]']) {
        for (const control of await page.locator(selector).all()) {
          expect(await control.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        }
      }
      await expect(page.locator('.ui-input')).toHaveCSS('font-size', '16px')
      await expect(page.locator('.ui-button--icon')).toHaveCSS('width', '44px')
    } finally {
      await browserContext.close()
    }
  })
}

for (const theme of ['light', 'dark']) {
  test(`readonly, invalid and keyboard focus stay distinct in ${theme}`, async ({ page }) => {
    await mount(page, `<section data-theme="${theme}">
      <input class="ui-input" aria-label="Editable" value="Editable">
      <input class="ui-input" aria-label="Readonly" readonly value="Copy this reference">
      <input class="ui-input" aria-label="Disabled" disabled value="Unavailable">
      <div class="ui-input-group"><span>https://</span><input class="ui-input" aria-label="Invalid" aria-invalid="true" value="bad address"></div>
      <ul class="ui-menu"><li><button>Rename</button></li></ul>
      <div class="ui-select__list"><button role="option" aria-selected="true">Selected</button><button role="option" aria-selected="false">Another option</button></div>
    </section>`)
    const readonly = page.getByRole('textbox', { name: 'Readonly', exact: true })
    await expect(readonly).toHaveCSS('border-top-style', 'dashed')
    await readonly.focus()
    await expect(readonly).toBeFocused()
    await expect(readonly).toHaveCSS('outline-style', 'solid')
    await expect(readonly).toHaveValue('Copy this reference')

    const disabled = page.getByRole('textbox', { name: 'Disabled', exact: true })
    const disabledBorder = await disabled.evaluate(element => getComputedStyle(element).borderColor)
    await disabled.hover({ force: true })
    await expect(disabled).toHaveCSS('border-color', disabledBorder)

    const invalid = page.getByRole('textbox', { name: 'Invalid', exact: true })
    const invalidBorder = await invalid.evaluate(element => getComputedStyle(element).borderColor)
    await invalid.hover()
    await expect(invalid).toHaveCSS('border-color', invalidBorder)
    await invalid.focus()
    await expect(page.locator('.ui-input-group')).toHaveCSS('outline-style', 'solid')
    const invalidOutline = await invalid.evaluate(element => getComputedStyle(element).outlineColor)
    await expect(page.locator('.ui-input-group')).toHaveCSS('outline-color', invalidOutline)

    await page.getByRole('button', { name: 'Rename' }).focus()
    await expect(page.getByRole('button', { name: 'Rename' })).toHaveCSS('outline-width', '2px')
    const option = page.getByRole('option', { name: 'Another option' })
    await option.focus()
    await expect(option).toHaveCSS('outline-width', '2px')
    await expect(page.getByRole('option', { name: 'Selected', exact: true })).toHaveCSS('outline-style', 'none')
  })
}

test('native constraint feedback appears after validation, with visible focus in forced colors', async ({ page }) => {
  await mount(page, '<form><input class="ui-input" aria-label="Required name" required><button class="ui-button">Submit</button></form>')
  const input = page.getByRole('textbox', { name: 'Required name' })
  const initialBorder = await input.evaluate(element => getComputedStyle(element).borderColor)
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(input).toBeFocused()
  await expect(input).not.toHaveCSS('border-color', initialBorder)
  await page.emulateMedia({ forcedColors: 'active' })
  await expect(input).toHaveCSS('outline-style', 'solid')
  await expect(input).toHaveCSS('outline-width', '2px')
})

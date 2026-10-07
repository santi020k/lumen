import { expect, test } from '@playwright/test'

test('RTL tabs follow visual arrows and live inherited direction changes', async ({ page }) => {
  await page.goto('/docs/components/tabs')
  const preview = page.locator('.component-doc-preview')
  const first = preview.getByRole('tab', { name: 'Astro', exact: true })
  const second = preview.getByRole('tab', { name: 'React', exact: true })

  await preview.evaluate(element => { element.setAttribute('dir', 'rtl'); })
  await first.focus()
  await first.press('ArrowLeft')
  await expect(second).toBeFocused()
  await second.press('ArrowRight')
  await expect(first).toBeFocused()
  await preview.evaluate(element => { element.setAttribute('dir', 'ltr'); })
  await first.press('ArrowRight')
  await expect(second).toBeFocused()
})

test('RTL calendar day navigation follows visual columns', async ({ page }) => {
  await page.goto('/docs/components/calendar')
  const calendar = page.locator('.component-doc-preview [data-ui-calendar]').first()

  await calendar.evaluate(element => { element.setAttribute('dir', 'rtl'); })
  const fifteenth = calendar.locator('[data-ui-calendar-day]:not([aria-disabled="true"])').filter({ hasText: /^15$/ })

  await fifteenth.focus()
  await fifteenth.press('ArrowLeft')
  await expect(calendar.locator('[data-ui-calendar-day]:focus')).toHaveText('16')
  await page.keyboard.press('ArrowRight')
  await expect(fifteenth).toBeFocused()
})

test('RTL pane resizing mirrors horizontal deltas', async ({ page }) => {
  await page.goto('/docs/components/resizable')
  const root = page.locator('.component-doc-preview [data-ui-resizable]')
  const handle = root.locator('[data-ui-resizable-handle]').first()

  await root.evaluate(element => { element.setAttribute('dir', 'rtl'); })
  const initial = Number(await handle.getAttribute('aria-valuenow'))

  await handle.focus()
  await handle.press('ArrowLeft')
  await expect.poll(async () => Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(initial)
  await handle.press('ArrowRight')
  await expect(handle).toHaveAttribute('aria-valuenow', String(initial))
  const bounds = await handle.boundingBox()

  if (!bounds) throw new Error('Expected a visible resize handle')

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x - 30, bounds.y + bounds.height / 2)
  await page.mouse.up()
  await expect.poll(async () => Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(initial)
})

test('native RTL sliders retain browser-owned keyboard behavior', async ({ page }) => {
  await page.goto('/docs/components/slider')
  const slider = page.locator('.component-doc-preview input[type="range"]').first()

  await slider.evaluate(element => { element.setAttribute('dir', 'rtl'); })
  const initial = Number(await slider.inputValue())

  await slider.focus()
  await slider.press('ArrowLeft')
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(initial)
  await slider.press('ArrowRight')
  await expect(slider).toHaveValue(String(initial))
})

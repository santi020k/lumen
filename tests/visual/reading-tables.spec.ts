import { expect, test } from '@playwright/test'

for (const direction of ['ltr', 'rtl']) {
  for (const adapter of ['astro', 'react', 'elements']) {
    test(`${adapter} preserves row identifiers while scrolling ${direction}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 1000 })
      await page.goto('/internal/reading-tables')
      await page.evaluate(value => { document.documentElement.dir = value }, direction)
      const viewport = page.locator(`#${adapter}-table`)
      await expect(viewport).toHaveClass(/ui-table-wrap--sticky-column/)
      const label = viewport.locator('tbody th').first()
      await expect(label).toHaveCSS('position', 'sticky')
      const before = await label.boundingBox()
      await viewport.focus()
      await page.keyboard.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
      await expect.poll(async () => Math.abs(await viewport.evaluate(element => element.scrollLeft))).toBeGreaterThan(0)
      const after = await label.boundingBox()
      expect(Math.abs((before?.x ?? 0) - (after?.x ?? 0))).toBeLessThan(2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.emulateMedia({ media: 'print' })
      await expect(label).toHaveCSS('position', 'static')
    })
  }
}

test('reference tables expose a named scroll hint only when needed', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto('/internal/reading-tables')
  const viewport = page.getByRole('region', { name: 'Reference table', exact: true })
  await expect(viewport).toHaveAttribute('tabindex', '0')
  await expect(viewport).toHaveClass(/ui-table-wrap--sticky-column/)
  const cue = viewport.locator('..').locator('[data-scroll-cue-message]')
  await expect(cue).toBeVisible()
  await expect(viewport).toHaveAttribute('aria-describedby', /ui-scroll-cue-/)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(cue).toBeHidden()
  await page.emulateMedia({ media: 'print' })
  await expect(viewport.locator('table')).toHaveCSS('min-width', '0px')
})

test('sticky row identifiers release at enlarged text sizes and in record layouts', async ({ page }) => {
  await page.setViewportSize({ width: 240, height: 1000 })
  await page.goto('/internal/reading-tables')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  for (const adapter of ['astro', 'react', 'elements']) {
    await expect(page.locator(`#${adapter}-table tbody th`).first()).toHaveCSS('position', 'static')
  }
  await expect(page.locator('#records-table tbody td').first()).toHaveCSS('position', 'static')
})

test('Elements updates its sticky column attribute without replacing table content', async ({ page }) => {
  await page.goto('/internal/reading-tables')
  const table = page.locator('#elements-table')
  await expect(table).toHaveClass(/ui-table-wrap--sticky-column/)
  await table.evaluate(element => { element.setAttribute('sticky-first-column', 'false') })
  await expect(table).not.toHaveClass(/ui-table-wrap--sticky-column/)
  await expect(table.locator('tbody tr')).toHaveCount(3)
  await table.evaluate(element => { element.setAttribute('sticky-first-column', 'true') })
  await expect(table).toHaveClass(/ui-table-wrap--sticky-column/)
})

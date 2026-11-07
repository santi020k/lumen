import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`Anchor destination focus at ${width}px in ${theme}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/internal/anchor-activation')
      await expect(page.locator('#astro-example [data-ui-anchor]')).toHaveAttribute('data-ui-bound', 'true')
      await expect(page.locator('lumen-anchor')).toHaveAttribute('data-ui-anchor', '')
      await expect(page.locator('#react-anchor nav')).toHaveAttribute('data-ui-owner', 'react')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      for (const adapter of ['astro', 'react', 'elements']) {
        const link = page.locator(`a[href="#${adapter}-usage"]`)
        const destination = page.locator(`#${adapter}-usage`)
        await link.focus()
        await link.press('Enter')
        await expect(destination).toBeFocused()
        await expect(page).toHaveURL(new RegExp(`#${adapter}-usage$`))
        await expect(destination).toHaveAttribute('tabindex', '-1')
        await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
        await expect(page.locator(`#${adapter}-action`)).toBeFocused()
        await expect(destination).not.toHaveAttribute('tabindex')
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
  }
}

test('Anchor respects canceled navigation and passive scrolling never takes focus', async ({ page }) => {
  await page.goto('/internal/anchor-activation')
  await expect(page.locator('#astro-example [data-ui-anchor]')).toHaveAttribute('data-ui-bound', 'true')
  await expect(page.locator('lumen-anchor')).toHaveAttribute('data-ui-anchor', '')
  await page.evaluate(() => {
    document.body.addEventListener('click', event => { event.preventDefault(); })
  })
  for (const adapter of ['astro', 'react', 'elements']) {
    const link = page.locator(`a[href="#${adapter}-usage"]`)
    await link.focus()
    await link.press('Enter')
    await expect(link).toBeFocused()
    await expect(page.locator(`#${adapter}-usage`)).not.toHaveAttribute('tabindex')
    await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); })
    await expect(link).toBeFocused()
  }
})

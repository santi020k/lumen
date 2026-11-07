import { expect, type Page, test } from '@playwright/test'

const expectAlignedNavigation = async (page: Page, width: number): Promise<void> => {
  await expect.poll(async () => page.locator('[data-docs-page-bar]').evaluate((element, desktop) => {
    const header = document.querySelector('.docs-site-header')

    if (!header) throw new Error('Missing documentation header')

    const top = element.getBoundingClientRect().top
    const headerGap = top - header.getBoundingClientRect().bottom

    if (!desktop) return Math.abs(headerGap)

    const sidebar = document.querySelector('[data-docs-sidebar]')

    if (!sidebar) throw new Error('Missing documentation sidebar')

    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)

    return Math.max(Math.abs(headerGap - rem), Math.abs(top - sidebar.getBoundingClientRect().top))
  }, width >= 1024)).toBeLessThan(1)
}

for (const theme of ['lumen-light', 'lumen-dark']) {
  for (const width of [390, 768, 1023, 1024, 1440]) {
    test(`sticky documentation navigation aligns at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(value => { localStorage.setItem('lumen-theme', value) }, theme)
      await page.goto('/docs/web/tailwind')
      await expect(page.locator('[data-docs-page-navigation]')).toBeVisible()

      for (const top of [300, 1000, 600]) {
        await page.evaluate(value => { window.scrollTo({ top: value, behavior: 'instant' }); }, top)
        await expectAlignedNavigation(page, width)
      }
    })
  }

  test(`sticky documentation bars follow header resizing in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => { localStorage.setItem('lumen-theme', value) }, theme)
    await page.goto('/docs/web/tailwind')

    for (const fontSize of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value }, fontSize)

      for (const width of [390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.evaluate(() => { window.scrollTo({ top: 1000, behavior: 'instant' }); })
        await expectAlignedNavigation(page, width)
      }
    }
  })
}

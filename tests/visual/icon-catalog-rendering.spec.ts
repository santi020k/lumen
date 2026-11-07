import { expect, test } from '@playwright/test'

for (const path of ['/docs/icons', '/docs/brand-icons']) {
  test(`filtered SVG geometry remains usable on ${path}`, async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: (value: string) => {
          document.documentElement.dataset.iconCopied = value

          return Promise.resolve()
        }
      } })
    })
    await page.goto(path)
    const catalog = page.locator('[data-icon-catalog]').first()
    const search = catalog.locator('[data-icon-search]')

    await expect(search).toBeEnabled()
    await search.fill('a')
    await expect(catalog.locator('[data-icon-status]')).toContainText('matching')
    const button = catalog.locator('[data-icon-grid] button').first()
    const name = await button.getAttribute('data-icon-name')

    expect(name).not.toBeNull()
    expect(await button.locator('svg').evaluate(svg => svg.namespaceURI === 'http://www.w3.org/2000/svg' && svg.ownerDocument === document)).toBe(true)
    await button.click()
    await expect(page.locator('html')).toHaveAttribute('data-icon-copied', name ?? '')
  })
}

import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`Lu mascot at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      const section = page.locator('.home-lu')
      await section.scrollIntoViewIfNeeded()
      await expect(section.locator('[data-lu-mascot]')).toHaveAttribute('data-lu-ready', 'true')
      await expect(section).toHaveScreenshot(`lu-${width}-${theme}.png`)
    })
  }
}

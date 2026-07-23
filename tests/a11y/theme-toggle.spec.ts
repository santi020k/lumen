import { expect, test } from '@playwright/test'

test('component preview changes and persists the site-wide theme', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('lumen-theme')) {
      window.localStorage.setItem('lumen-theme', 'santi020k-dark')
    }
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/components/theme-toggle')

  const previewToggle = page.locator('[data-ui-theme-toggle]')

  await expect(previewToggle).toHaveCount(1)
  await expect(previewToggle).toHaveJSProperty('tagName', 'BUTTON')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-dark')
  await expect(previewToggle.locator('.ui-theme-toggle__moon')).toHaveCSS('opacity', '1')

  await previewToggle.click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
  await expect(previewToggle).toHaveAttribute('aria-label', 'Switch to dark mode')
  await expect(previewToggle.locator('.ui-theme-toggle__sun')).toHaveCSS('opacity', '1')

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
})

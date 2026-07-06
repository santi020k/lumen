import { expect, test } from '@playwright/test'

/**
 * Screenshots each component docs page in light and dark themes.
 * Cascade regressions (like glass variants being overridden) show up here
 * even when unit tests pass.
 */
const componentSlugs = [
  'alert',
  'badge',
  'button',
  'card',
  'checkbox',
  'command',
  'data-table',
  'dialog',
  'dropdown-menu',
  'field',
  'input',
  'menubar',
  'popover',
  'select',
  'sidebar',
  'switch',
  'table',
  'tabs',
  'toast',
  'tooltip'
]

for (const theme of ['light', 'dark'] as const) {
  for (const slug of componentSlugs) {
    test(`${slug} page renders consistently (${theme})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })

      await page.goto(`/docs/components/${slug}`)

      await page.evaluate(themeName => {
        document.documentElement.dataset.theme = themeName
      }, theme)

      await expect(page.locator('main')).toBeVisible()
      await expect(page.getByText('An error occurred.', { exact: true })).toHaveCount(0)

      await expect(page).toHaveScreenshot(`${slug}-${theme}.png`, {
        fullPage: true
      })
    })
  }
}

import { expect, test } from '@playwright/test'

for (const preset of ['default', 'studio', 'glass']) {
  for (const scheme of ['light', 'dark']) {
    test(`success feedback remains readable across web adapters in ${preset} ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/internal/success-feedback')
      await page.locator('html').evaluate((element, appearance) => {
        element.dataset.lumenPreset = appearance.preset
        element.dataset.lumenScheme = appearance.scheme
      }, { preset, scheme })
      await expect(page.locator('lumen-alert')).toHaveClass(/ui-alert/u)
      await expect(page.locator('.ui-alert--success, .ui-toast--success')).toHaveCount(6)
      await page.addScriptTag({ path: 'packages/elements/node_modules/axe-core/axe.min.js' })
      const violations: unknown = await page.evaluate('axe.run(document, { runOnly: ["color-contrast"] }).then(result => result.violations)')

      expect(violations).toEqual([])
    })
  }
}

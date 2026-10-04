import { test } from '@playwright/test'

import { verifyAstroChartActivation } from './chart-activation.js'

for (const width of [320, 1440]) {
  test(`Astro datum activation works at ${width}px with hidden tables`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await verifyAstroChartActivation(page)
    await page.locator('[data-chart-example="bar"]').screenshot({ path: testInfo.outputPath('bar-actions.png') })
  })
}

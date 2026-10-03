import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`chart interaction, exact tables and missing values agree across web adapters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/docs/web/data-visualization')
    for (const adapter of ['astro', 'react', 'elements']) {
      const scope = page.locator(`[data-chart-demo="${adapter}"]`)
      const chart = scope.locator('.ui-line-chart')
      const plot = chart.locator('[data-ui-chart-interaction-plot]')
      await expect(chart.locator('[data-ui-chart-toggle="requests"]')).toBeEnabled()
      await plot.focus()
      await page.keyboard.press('End')
      await expect(chart.locator('[data-ui-chart-inspection]')).toContainText('12:00')
      const plotBounds = await plot.boundingBox()
      const cursorBounds = await chart.locator('[data-ui-chart-crosshair]').boundingBox()
      if (!plotBounds || !cursorBounds) throw new Error('Expected chart and cursor bounds')
      expect(cursorBounds.x).toBeGreaterThanOrEqual(plotBounds.x)
      expect(cursorBounds.x).toBeLessThanOrEqual(plotBounds.x + plotBounds.width)
      await page.keyboard.press('Home')
      await expect(chart.locator('[data-ui-chart-point]:visible')).toContainText('09:00')
      await page.keyboard.press('ArrowRight')
      await expect(chart.locator('[data-ui-chart-point]:visible')).toContainText('09:01')
      await page.keyboard.press('Escape')
      await expect(chart.locator('[data-ui-chart-inspection]')).toBeHidden()
      const toggle = chart.locator('[data-ui-chart-toggle="requests"]')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      await expect(chart.locator('[data-ui-chart-series="requests"]')).toBeHidden()
      await chart.getByText('View chart data', { exact: true }).click()
      await expect(chart.locator('table')).toContainText('Requests')
      await expect(chart.locator('table')).toContainText('Not available')
      await toggle.click()
      await expect(chart.locator('[data-ui-chart-series="requests"]')).toBeVisible()
      await expect(scope.locator('.ui-heatmap__missing')).toHaveCount(1)
      await expect(scope.locator('.ui-heatmap__legend')).toContainText('Not available')
      await expect(scope.locator('.ui-histogram .ui-bar-chart__marks rect')).toHaveCount(4)
      await expect(scope.locator('.ui-waterfall-chart .ui-bar-chart__marks rect')).toHaveCount(4)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  })
}

test('cursor synchronization uses the same X identity across the three adapters', async ({ page }) => {
  await page.goto('/docs/web/data-visualization')
  await expect(page.locator('[data-chart-demo="react"] [data-ui-chart-toggle]').first()).toBeEnabled()
  await page.locator('[data-chart-demo="astro"] [data-ui-chart-interaction-plot]').focus()
  await page.keyboard.press('End')
  for (const adapter of ['astro', 'react', 'elements']) {
    await expect(page.locator(`[data-chart-demo="${adapter}"] [data-ui-chart-point]:visible`)).toContainText('12:00')
  }
})

test('leaving a previously hovered chart does not clear the active keyboard cursor', async ({ page }) => {
  await page.goto('/docs/web/data-visualization')
  const active = page.locator('[data-chart-demo="astro"] .ui-line-chart')
  const passive = page.locator('[data-chart-demo="react"] .ui-chart__content')
  await expect(passive).toHaveAttribute('data-ui-chart-enhanced', 'true')
  await passive.locator('[data-ui-chart-interaction-plot]').hover({ position: { x: 150, y: 200 } })
  await active.locator('[data-ui-chart-interaction-plot]').evaluate(plot => { plot.focus({ preventScroll: true }); })
  await page.keyboard.press('End')
  await passive.dispatchEvent('pointerleave')
  await expect(active.locator('[data-ui-chart-point]:visible')).toContainText('12:00')
})

test.describe('touch inspection', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 900 } })

  test('tap pins an observation and Escape clears it in every adapter', async ({ page }) => {
    await page.goto('/docs/web/data-visualization')
    for (const adapter of ['astro', 'react', 'elements']) {
      const chart = page.locator(`[data-chart-demo="${adapter}"] .ui-line-chart`)
      await expect(chart.locator('[data-ui-chart-toggle]').first()).toBeEnabled()
      const plot = chart.locator('[data-ui-chart-interaction-plot]')
      await plot.tap({ position: { x: 130, y: 130 } })
      await expect(chart.locator('[data-ui-chart-inspection]')).toBeVisible()
      await chart.dispatchEvent('pointerleave')
      await expect(chart.locator('[data-ui-chart-inspection]')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(chart.locator('[data-ui-chart-inspection]')).toBeHidden()
    }
  })
})

import { expect, test } from '@playwright/test'

for (const width of [390, 1280]) {
  for (const theme of ['light', 'dark'] as const) {
    for (const framework of ['astro', 'react', 'elements'] as const) {
      test(`extended ${framework} charts retain exact keyboard data at ${width}px ${theme}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto('/docs/web/data-visualization')
        await page.evaluate(value => { document.documentElement.setAttribute('data-theme', value) }, theme)
        if (framework !== 'astro') {
          await page.getByRole('tablist', { name: 'Chart framework' }).getByRole('tab', { name: framework === 'react' ? 'React' : 'Web Components', exact: true }).click()
        }
        const panel = page.locator(`[data-chart-demo="${framework}"]`)
        for (const className of ['ui-calendar-heatmap', 'ui-funnel-chart', 'ui-box-plot']) {
          const chart = panel.locator(`.${className}`).first()
          await expect(chart).toBeVisible()
          const disclosure = chart.locator('details.ui-chart__data')
          await disclosure.locator('summary').focus()
          await disclosure.locator('summary').press('Enter')
          await expect(disclosure).toHaveAttribute('open', '')
          await expect(disclosure.locator('tbody tr').first()).toBeVisible()
          if (className === 'ui-calendar-heatmap') {
            await expect(disclosure.locator('tbody tr')).toHaveCount(28)
            await expect(disclosure).toContainText('Not available')
          }
          if (className === 'ui-box-plot') {
            await expect(disclosure).toContainText('First quartile')
            await expect(disclosure).toContainText('73')
          }
          await disclosure.locator('summary').press('Enter')
          // Keep the chart below the stacked mobile documentation navigation.
          await chart.evaluate(element => { window.scrollBy(0, element.getBoundingClientRect().top - 260) })
          await chart.screenshot({ path: testInfo.outputPath(`${className}-${width}-${theme}.png`) })
        }
        const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth }))
        expect(dimensions.content).toBeLessThanOrEqual(dimensions.width)
      })
    }
  }
}

import { expect, test } from '@playwright/test'

const examples = [
  { slug: 'scatter-chart', rows: 22 },
  { slug: 'heatmap', rows: 56 },
  { slug: 'combo-chart', rows: 8 },
  { slug: 'range-chart', rows: 7 },
  { slug: 'histogram', rows: 10 },
  { slug: 'waterfall-chart', rows: 7 }
]

for (const width of [390, 1440]) {
  for (const { slug, rows } of examples) {
    test(`${slug} keeps its full plot and keyboard data accessible at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`/docs/components/${slug}`)
      const chart = page.locator('.ui-chart')
      const plot = chart.locator('.ui-chart__plot')

      await expect(chart.locator('.ui-chart__heading p')).not.toBeEmpty()
      await expect(chart.locator('figcaption')).toContainText('Illustrative')
      await expect(chart.locator('svg .ui-chart__axis-labels text').first()).toBeVisible()
      expect(await plot.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)

      const disclosure = chart.locator('.ui-chart__data summary')
      await disclosure.focus()
      await page.keyboard.press('Enter')
      await expect(chart.locator('.ui-chart__data')).toHaveAttribute('open', '')
      await expect(chart.locator('tbody tr')).toHaveCount(rows)
      await page.keyboard.press('Enter')
      await expect(chart.locator('.ui-chart__data')).not.toHaveAttribute('open')
    })
  }

  test(`scatter bubbles remain complete at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/docs/components/scatter-chart')
    const chart = page.locator('.ui-scatter-chart')

    await expect(chart.locator('.ui-chart__legend li')).toHaveCount(3)
    const bubbles = await chart.locator('.ui-scatter-chart__marks circle').evaluateAll(elements => elements.map(element => ({
      x: Number(element.getAttribute('cx')),
      y: Number(element.getAttribute('cy')),
      radius: Number(element.getAttribute('r'))
    })))

    expect(bubbles).toHaveLength(22)
    for (const bubble of bubbles) {
      expect(bubble.x - bubble.radius).toBeGreaterThanOrEqual(44)
      expect(bubble.x + bubble.radius).toBeLessThanOrEqual(596)
      expect(bubble.y - bubble.radius).toBeGreaterThanOrEqual(44)
      expect(bubble.y + bubble.radius).toBeLessThanOrEqual(276)
    }
  })
}

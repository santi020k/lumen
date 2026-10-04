import { expect, type Page } from '@playwright/test'

export const verifyAstroChartActivation = async (page: Page): Promise<void> => {
  await page.goto('/internal/chart-activation')
  const result = page.locator('[data-activation-result]')
  let count = 0
  for (const name of ['bar', 'line', 'pie', 'scatter', 'combo', 'heatmap', 'range']) {
    const chart = page.locator(`[data-chart-example="${name}"]`)
    await expect(chart).toHaveAttribute('data-ui-chart-activation-bound', 'true')
    await expect(chart.locator('.ui-chart__data')).toHaveCount(0)
    await chart.locator('[data-ui-chart-actions] summary').click()
    const button = chart.getByRole('button', { name: /^Abrir detalles:/ }).first()
    const expected = await button.getAttribute('data-ui-chart-datum')
    await button.focus()
    await button.press('Enter')
    count += 1
    await expect(result).toHaveAttribute('data-count', String(count))
    await expect(result).toHaveText(expected ?? '')
    await button.press('Space')
    count += 1
    await expect(result).toHaveAttribute('data-count', String(count))
    const mark = chart.locator('svg [data-ui-chart-datum*="positive"]').last()
    const markPayload = await mark.getAttribute('data-ui-chart-datum')
    if (name === 'pie') {
      const box = await mark.boundingBox()
      if (!box) throw new Error('Pie slice has no visible bounds')
      // The center of a donut is intentionally empty; click its painted band.
      await mark.click({ position: { x: box.width * 0.85, y: box.height * 0.5 } })
    } else if (name === 'line') {
      const box = await mark.boundingBox()
      if (!box) throw new Error('Line datum has no visible bounds')
      // At the upper domain edge, the plot clips the upper half of the hit area.
      await mark.click({ position: { x: box.width * 0.5, y: box.height * 0.75 } })
    } else await mark.click()
    count += 1
    await expect(result).toHaveAttribute('data-count', String(count))
    await expect(result).toHaveText(markPayload ?? '')
    await expect(chart.locator('[data-ui-chart-datum*="missing"]')).toHaveCount(0)
    const hitFills = await chart.locator('.ui-chart__datum-hit').evaluateAll(elements =>
      elements.map(element => getComputedStyle(element).fill))
    for (const fill of hitFills) expect(fill).toBe('rgba(0, 0, 0, 0)')
  }
  const combo = page.locator('[data-chart-example="combo"]')
  await combo.getByRole('button', { name: 'Abrir detalles: 2026-10-02 · Forecast: 10' }).click()
  const payload: unknown = JSON.parse(await result.textContent() ?? 'null')
  expect(payload).toEqual({ datumId: 'forecast-positive', kind: 'series', seriesId: 'forecast', x: '2026-10-02', y: 10 })
  await expect(page.locator('[data-chart-example="static"] [data-ui-chart-datum]')).toHaveCount(0)
  await expect(page.locator('[data-chart-example="empty"] [data-ui-chart-actions]')).toHaveCount(0)
  const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }))
  expect(widths.content).toBeLessThanOrEqual(widths.viewport)
}

import { expect, test } from '@playwright/test'

import { verifyAstroChartActivation } from './chart-activation.js'

for (const width of [320, 1440]) {
  test(`Astro datum activation works at ${width}px with hidden tables`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await verifyAstroChartActivation(page)
    await page.locator('[data-chart-example="bar"]').screenshot({ path: testInfo.outputPath('bar-actions.png') })
  })

  test(`React datum activation works at ${width}px alongside Astro`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/internal/chart-activation')
    const result = page.locator('[data-react-activation-result]')
    let count = 0
    for (const name of ['bar', 'line', 'pie', 'scatter', 'combo', 'heatmap', 'range']) {
      const chart = page.locator(`[data-react-chart-example="${name}"]`)
      await expect(chart).toHaveAttribute('data-ui-chart-adapter', 'react')
      await expect(chart).not.toHaveAttribute('data-ui-chart-activation-bound', 'true')
      await expect(chart.locator('.ui-chart__data')).toHaveCount(0)
      await chart.locator('[data-ui-chart-actions] summary').focus()
      await chart.locator('[data-ui-chart-actions] summary').press('Enter')
      const button = chart.getByRole('button', { name: /^Abrir detalles:/ }).first()
      const expected = await button.getAttribute('data-ui-chart-datum')
      await button.focus()
      for (const key of ['Enter', 'Space']) {
        await button.press(key)
        count += 1
        await expect(result).toHaveAttribute('data-count', String(count))
        await expect(result).toHaveText(expected ?? '')
      }
      const mark = chart.locator('svg [data-ui-chart-datum*="positive"]').last()
      const payload = await mark.getAttribute('data-ui-chart-datum')
      if (name === 'pie') {
        const box = await mark.boundingBox()
        if (!box) throw new Error('Pie slice has no visible bounds')
        await mark.click({ position: { x: box.width * 0.85, y: box.height * 0.5 } })
      } else await mark.click()
      count += 1
      await expect(result).toHaveAttribute('data-count', String(count))
      await expect(result).toHaveText(payload ?? '')
      await expect(chart.locator('[data-ui-chart-datum*="missing"]')).toHaveCount(0)
    }
    const bar = page.locator('[data-react-chart-example="bar"]')
    await page.getByRole('button', { name: 'Actualizar valores' }).click()
    const positive = bar.getByRole('button', { name: /Oct 2/ })
    await positive.click()
    count += 1
    await expect(result).toHaveAttribute('data-count', String(count))
    await expect(result).toContainText('"y":40')
    await page.getByRole('button', { name: 'Alternar acciones' }).click()
    await positive.click()
    await expect(result).toHaveAttribute('data-count', String(count))
    await page.getByRole('button', { name: 'Alternar acciones' }).click()
    await positive.click()
    count += 1
    await expect(result).toHaveAttribute('data-count', String(count))
    await expect(page.locator('[data-activation-result]')).toHaveAttribute('data-count', '0')
    await bar.screenshot({ path: testInfo.outputPath('react-bar-actions.png') })
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }))
    expect(widths.content).toBeLessThanOrEqual(widths.viewport)
  })
}

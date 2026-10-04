import { expect, test } from '@playwright/test'

import { verifyAstroChartActivation } from './chart-activation.js'

for (const width of [320, 1440]) {
  test(`Elements datum activation works at ${width}px alongside Astro`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/internal/chart-activation')
    const result = page.locator('[data-elements-activation-result]')
    let count = 0
    for (const name of ['bar', 'line', 'pie', 'scatter', 'combo', 'heatmap', 'range']) {
      const chart = page.locator(`[data-elements-chart-example="${name}"]`)
      await expect(chart).toHaveAttribute('data-ui-chart-adapter', 'elements')
      await expect(chart).not.toHaveAttribute('data-ui-chart-activation-bound', 'true')
      await expect(chart.locator('.ui-chart__data')).toHaveCount(0)
      const summary = chart.locator('[data-ui-chart-actions] summary')
      await summary.focus()
      await summary.press('Enter')
      const button = chart.getByRole('button', { name: /^Abrir detalles:/ }).first()
      const expected = await button.getAttribute('data-ui-chart-datum')
      await button.focus()
      for (const key of ['Enter', 'Space']) {
        await button.press(key)
        count += 1
        await expect(result).toHaveAttribute('data-count', String(count))
        await expect(result).toHaveText(expected ?? '')
      }
      const mark = chart.locator(name === 'range' ? 'svg rect[data-ui-chart-datum*="positive"]' : 'svg [data-ui-chart-datum*="positive"]').last()
      const payload = await mark.getAttribute('data-ui-chart-datum')
      if (name === 'pie') {
        const box = await mark.boundingBox()
        if (!box) throw new Error('Pie slice has no visible bounds')
        await mark.click({ position: { x: box.width * 0.85, y: box.height * 0.5 } })
      } else if (name === 'line') {
        const box = await mark.boundingBox()
        if (!box) throw new Error('Line datum has no visible bounds')
        // At the upper domain edge, the plot clips the upper half of the hit area.
        await mark.click({ position: { x: box.width * 0.5, y: box.height * 0.75 } })
      } else await mark.click()
      count += 1
      await expect(result).toHaveAttribute('data-count', String(count))
      await expect(result).toHaveText(payload ?? '')
      await expect(chart.locator('[data-ui-chart-datum*="missing"]')).toHaveCount(0)
    }
    const bar = page.locator('[data-elements-chart-example="bar"]')
    await page.getByRole('button', { name: 'Actualizar datos Elements' }).click()
    await bar.getByRole('button', { name: /Oct 2/ }).click()
    count += 1
    await expect(result).toHaveAttribute('data-count', String(count))
    await expect(result).toContainText('"y":40')
    await expect(page.locator('[data-activation-result]')).toHaveAttribute('data-count', '0')
    await bar.screenshot({ path: testInfo.outputPath('elements-bar-actions.png') })
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }))
    expect(widths.content).toBeLessThanOrEqual(widths.viewport)
  })

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
      } else if (name === 'line') {
        const box = await mark.boundingBox()
        if (!box) throw new Error('Line datum has no visible bounds')
        // At the upper domain edge, the plot clips the upper half of the hit area.
        await mark.click({ position: { x: box.width * 0.5, y: box.height * 0.75 } })
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

for (const width of [390, 1280]) {
  test(`bar chart plots fit their cards across web adapters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/internal/chart-activation')
    const charts = page.locator('.ui-bar-chart')
    await expect(charts).toHaveCount(4)
    for (const chart of await charts.all()) {
      const plot = chart.locator('.ui-chart__plot')
      expect(await plot.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      const plotBounds = await plot.boundingBox()
      if (!plotBounds) throw new Error('Missing chart plot')
      for (const label of await plot.locator('text').all()) {
        const bounds = await label.boundingBox()
        if (!bounds) throw new Error('Missing axis label')
        expect(bounds.x).toBeGreaterThanOrEqual(plotBounds.x - 1)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(plotBounds.x + plotBounds.width + 1)
      }
    }
  })
}

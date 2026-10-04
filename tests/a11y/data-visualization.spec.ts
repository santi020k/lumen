import { createRequire } from 'node:module'

import { expect, type Locator, type Page, test } from '@playwright/test'

const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')
const adapters = [{ id: 'astro', name: 'Astro' }, { id: 'react', name: 'React' }, { id: 'elements', name: 'Web Components' }]

const expectScrollableDataPanel = async (page: Page, chart: Locator, chartWidth: number): Promise<void> => {
  const disclosure = chart.locator('.ui-chart__data')
  const tableRegion = disclosure.getByRole('group')
  const disclosureBounds = await disclosure.boundingBox()
  const regionBounds = await tableRegion.boundingBox()
  if (!disclosureBounds || !regionBounds) throw new Error('Expected full-width data disclosure')
  expect(disclosureBounds.width).toBeGreaterThan(chartWidth * 0.75)
  expect(regionBounds.width).toBeGreaterThan(disclosureBounds.width - 2)
  expect(regionBounds.height).toBeLessThanOrEqual(322)
  await tableRegion.focus()
  await page.keyboard.press('End')
  await expect.poll(() => tableRegion.evaluate(region => region.scrollTop)).toBeGreaterThan(0)
  // Sticky column labels must remain visible while the last source row is reachable.
  const stickyHeaderTop = (await tableRegion.locator('thead th').first().boundingBox())?.y
  expect(stickyHeaderTop).toBeCloseTo(((await tableRegion.boundingBox())?.y ?? 0) + 1, 0)
  await expect(tableRegion.locator('tbody tr').last()).toBeInViewport()
}

const expectComparisonCharts = async (page: Page, scope: Locator): Promise<void> => {
  for (const kind of ['lollipop', 'dumbbell']) {
    const comparison = scope.locator(`.ui-${kind}-chart`)
    await expect(comparison.locator('.ui-comparison-chart__dot')).toHaveCount(4)
    await expect(comparison.locator('.ui-comparison-chart__reference')).toHaveCount(kind === 'dumbbell' ? 4 : 0)
    await comparison.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(comparison.locator('tbody tr')).toHaveCount(4)
    await expect(comparison.locator('tbody')).toContainText('Support')
    await expect(comparison.locator('tbody')).toContainText('74')
    await comparison.locator('summary').press('Enter')
  }
}

for (const width of [390, 1440]) {
  test(`chart interaction, exact tables and missing values agree across web adapters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/docs/web/data-visualization/gallery')
    for (const { id: adapter, name } of adapters) {
      await page.getByRole('tablist', { name: 'Chart framework' }).getByRole('tab', { name, exact: true }).click()
      const scope = page.locator(`[data-chart-demo="${adapter}"]`)
      const chart = scope.locator('.ui-line-chart')
      const plot = chart.locator('[data-ui-chart-interaction-plot]')
      await expect(chart.locator('[data-ui-chart-toggle="requests"]')).toBeEnabled()
      await plot.focus()
      await page.keyboard.press('End')
      await expect(chart.locator('[data-ui-chart-inspection]')).toContainText('12:00')
      const chartBounds = await chart.boundingBox()
      const inspectionBounds = await chart.locator('[data-ui-chart-inspection]').boundingBox()
      if (!chartBounds || !inspectionBounds) throw new Error('Expected chart and inspection bounds')
      expect(inspectionBounds.x).toBeGreaterThanOrEqual(chartBounds.x)
      expect(inspectionBounds.x + inspectionBounds.width).toBeLessThanOrEqual(chartBounds.x + chartBounds.width)
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
      await plot.focus()
      await page.keyboard.press('End')
      await expect(chart.locator('[data-ui-chart-point]:visible [data-ui-chart-series-value="requests"]')).toBeHidden()
      expect((await chart.boundingBox())?.height).toBe(chartBounds.height)
      await page.keyboard.press('Escape')
      await chart.getByText('View chart data', { exact: true }).click()
      await expect(chart.locator('table')).toContainText('Requests')
      await expect(chart.locator('table')).toContainText('Not available')
      await expectScrollableDataPanel(page, chart, chartBounds.width)
      await toggle.click()
      await expect(chart.locator('[data-ui-chart-series="requests"]')).toBeVisible()
      const bullet = scope.locator('.ui-bullet-chart')
      await expect(bullet.locator('.ui-bullet-chart__values')).toContainText('86')
      await expect(bullet.locator('.ui-bullet-chart__values')).toContainText('95')
      await bullet.locator('summary').focus()
      await page.keyboard.press('Enter')
      await expect(bullet.locator('table')).toBeVisible()
      await expect(bullet.locator('tbody tr')).toHaveCount(5)
      await expect(bullet.locator('tbody tr').last()).toContainText('Excellent')
      await page.keyboard.press('Space')
      await expect(bullet.locator('table')).toBeHidden()
      const bulletBounds = await bullet.boundingBox()
      const targetBounds = await bullet.locator('.ui-bullet-chart__target').boundingBox()
      if (!bulletBounds || !targetBounds) throw new Error('Expected a visible target chart')
      expect(targetBounds.x + targetBounds.width).toBeLessThan(bulletBounds.x + bulletBounds.width)
      await expectComparisonCharts(page, scope)
      await expect(scope.locator('.ui-heatmap__missing')).toHaveCount(1)
      await expect(scope.locator('.ui-heatmap__legend')).toContainText('Not available')
      await expect(scope.locator('.ui-histogram .ui-bar-chart__marks rect')).toHaveCount(12)
      await expect(scope.locator('.ui-waterfall-chart .ui-bar-chart__marks rect')).toHaveCount(6)
      await expect(scope.locator('.ui-pie-chart__slices path')).toHaveCount(4)
      await expect(scope.locator('.ui-heatmap__row-label:visible')).toHaveCount(7)
      const clippedLabels = await scope.locator('.ui-chart__grid text:visible').evaluateAll(labels => labels.filter(label => {
        const plot = label.closest('.ui-chart__plot')?.getBoundingClientRect()
        return plot && label.getBoundingClientRect().left < plot.left - 1
      }).map(label => label.textContent))
      expect(clippedLabels).toEqual([])
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  })
}

test('cursor synchronization uses the same X identity across the three adapters', async ({ page }) => {
  await page.goto('/docs/web/data-visualization/gallery')
  await expect(page.locator('[data-chart-demo="react"] [data-ui-chart-toggle]').first()).toBeEnabled()
  await page.locator('[data-chart-demo="astro"] [data-ui-chart-interaction-plot]').focus()
  await page.keyboard.press('End')
  for (const adapter of ['astro', 'react', 'elements']) {
    await expect(page.locator(`[data-chart-demo="${adapter}"] [data-ui-chart-point]:not([hidden])`)).toContainText('12:00')
  }
})

test('leaving a previously hovered chart does not clear the active keyboard cursor', async ({ page }) => {
  await page.goto('/docs/web/data-visualization/gallery')
  const active = page.locator('[data-chart-demo="react"] .ui-line-chart')
  const passive = page.locator('[data-chart-demo="astro"] .ui-line-chart')
  await expect(passive).toHaveAttribute('data-ui-chart-enhanced', 'true')
  await passive.locator('[data-ui-chart-interaction-plot]').hover({ position: { x: 150, y: 60 } })
  await page.getByRole('tablist', { name: 'Chart framework' }).getByRole('tab', { name: 'React', exact: true }).click()
  await active.locator('[data-ui-chart-interaction-plot]').evaluate(plot => { plot.focus({ preventScroll: true }); })
  await page.keyboard.press('End')
  await passive.dispatchEvent('pointerleave')
  await expect(active.locator('[data-ui-chart-point]:visible')).toContainText('12:00')
})

test('a pinned inspection stays inside the card after resizing and switching frameworks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/docs/web/data-visualization/gallery')
  await page.locator('[data-chart-demo="astro"] [data-ui-chart-interaction-plot]').press('End')
  await page.setViewportSize({ width: 390, height: 900 })
  for (const { id, name } of adapters) {
    await page.getByRole('tablist', { name: 'Chart framework' }).getByRole('tab', { name, exact: true }).click()
    const chart = page.locator(`[data-chart-demo="${id}"] .ui-line-chart`)
    await expect(chart.locator('[data-ui-chart-inspection]')).toContainText('12:00')
    await expect.poll(async () => {
      const bounds = await chart.boundingBox()
      const panel = await chart.locator('[data-ui-chart-inspection]').boundingBox()
      return Boolean(bounds && panel && panel.x >= bounds.x && panel.x + panel.width <= bounds.x + bounds.width)
    }).toBe(true)
  }
})

for (const theme of ['lumen-light', 'lumen-dark']) {
  test(`chart gallery passes accessibility checks in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => { localStorage.setItem('lumen-theme', value); }, theme)
    await page.goto('/docs/web/data-visualization/gallery')
    await page.addScriptTag({ path: axePath })
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const { id, name } of adapters) {
        await page.getByRole('tablist', { name: 'Chart framework' }).getByRole('tab', { name, exact: true }).click()
        // Audit the open scroll region and its table as well as the plots.
        await page.locator(`[data-chart-demo="${id}"] .ui-line-chart .ui-chart__data > summary`).click()
        const bullet = page.locator(`[data-chart-demo="${id}"] .ui-bullet-chart`)
        await bullet.locator('summary').click()
        if (id === 'astro') {
          await page.mouse.wheel(0, -180)
          await bullet.screenshot({ path: test.info().outputPath(`bullet-${width}-${theme}.png`) })
        }
        const report: unknown = await page.evaluate('axe.run(".viz-gallery")')
        expect(report).toMatchObject({ violations: [] })
        await bullet.locator('summary').click()
        await page.locator(`[data-chart-demo="${id}"] .ui-line-chart .ui-chart__data > summary`).click()
      }

    }
  })
}

test.describe('touch inspection', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 900 } })

  test('tap pins an observation and Escape clears it in every adapter', async ({ page }) => {
    await page.goto('/docs/web/data-visualization/gallery')
    for (const { id: adapter, name } of adapters) {
      await page.getByRole('tablist', { name: 'Chart framework' }).getByRole('tab', { name, exact: true }).click()
      const chart = page.locator(`[data-chart-demo="${adapter}"] .ui-line-chart`)
      await expect(chart.locator('[data-ui-chart-toggle]').first()).toBeEnabled()
      const plot = chart.locator('[data-ui-chart-interaction-plot]')
      await plot.tap({ position: { x: 130, y: 60 } })
      await expect(chart.locator('[data-ui-chart-inspection]')).toBeVisible()
      await chart.dispatchEvent('pointerleave')
      await expect(chart.locator('[data-ui-chart-inspection]')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(chart.locator('[data-ui-chart-inspection]')).toBeHidden()
    }
  })
})

import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`Sparkline endpoints stay circular and aligned at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/internal/sparkline-layout')
    for (const adapter of ['astro', 'react', 'elements']) {
      const chart = page.locator(`#${adapter}-trend`)
      await expect(chart).toHaveAccessibleName('Revenue trend')
      for (const size of [{ width: 120, height: 40 }, { width: 280, height: 28 }, { width: 500, height: 40 }]) {
        await chart.evaluate((element, dimensions) => {
          element.style.width = `${dimensions.width}px`
          element.style.height = `${dimensions.height}px`
        }, size)
        await expect(chart.locator('.ui-sparkline__line')).toHaveCSS('vector-effect', 'non-scaling-stroke')
        const bounds = await chart.boundingBox()
        const marker = await chart.locator('.ui-sparkline__endpoint').boundingBox()
        if (!bounds || !marker) throw new Error('Sparkline has no visible bounds')
        expect(marker.width).toBe(7)
        expect(marker.height).toBe(7)
        expect(marker.x + marker.width / 2).toBeCloseTo(bounds.x + bounds.width * 0.975, 1)
        expect(marker.y + marker.height / 2).toBeCloseTo(bounds.y + bounds.height * 0.075, 1)
      }
    }
  })
}

for (const width of [390, 1440]) {
  test(`Homepage revenue card keeps a round endpoint at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const card = page.locator('.home-workbench__stat').first()
    const marker = await card.locator('.ui-sparkline__endpoint').boundingBox()
    if (!marker) throw new Error('Revenue endpoint has no visible bounds')
    expect(marker.width).toBe(marker.height)
    await card.screenshot({ path: `/tmp/sparkline-after-${width}.png` })
  })
}

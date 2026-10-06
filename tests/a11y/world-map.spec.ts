import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')

for (const width of [360, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`world map supports country selection at ${width}px in ${theme}`, async ({ page }) => {
      const errors: string[] = []

      page.on('pageerror', error => errors.push(error.message))
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/docs/components/world-map')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      const map = page.locator('[data-ui-world-map]').first()
      const chooser = map.getByRole('combobox', { name: 'Choose a country' })

      await expect(chooser).toBeEnabled()
      await chooser.selectOption('JP')
      await expect(map.locator('.ui-world-map__inspection')).toHaveText('Japan')
      await expect(map.locator('[data-ui-world-map-country="JP"]')).toHaveClass(/--selected/)
      await chooser.focus()
      await expect(chooser).toBeFocused()
      await page.keyboard.press('Escape')
      await chooser.selectOption('')
      await expect(map.locator('.ui-world-map__inspection')).toBeHidden()
      await chooser.selectOption('CO')
      await expect(map.getByRole('list', { name: 'Highlighted countries' })).toContainText('Colombia')
      await expect(map.getByRole('list', { name: 'Map markers' })).toContainText('Bogotá')
      expect(await map.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      await page.addScriptTag({ path: axePath })
      const results: unknown = await page.evaluate('axe.run("[data-ui-world-map]")')

      expect(results).toMatchObject({ violations: [] })
      expect(errors).toEqual([])
      await map.screenshot({ path: `/tmp/lumen-world-map-${width}-${theme}.png` })
    })
  }
}

test('hover labels work through country geometry and clicks emit the country event', async ({ page }) => {
  await page.goto('/docs/components/world-map')
  const map = page.locator('[data-ui-world-map]').first()

  await expect(map.getByRole('combobox')).toBeEnabled()
  await map.evaluate(element => {
    element.addEventListener('ui:world-map-select', event => {
      if (event instanceof CustomEvent) element.setAttribute('data-last-selection', JSON.stringify(event.detail))
    })
  })
  await map.locator('svg').scrollIntoViewIfNeeded()
  const plot = await map.locator('svg').boundingBox()

  if (!plot) throw new Error('Expected map bounds')

  // A point within mainland Colombia, away from the Bogotá marker.
  const x = plot.x + ((-72 + 180) / 360) * plot.width
  const y = plot.y + ((84 - 4) / 144) * plot.height

  await page.mouse.move(x, y)
  await expect(map.locator('.ui-world-map__inspection')).toHaveText('Colombia')
  await page.mouse.click(x, y)
  await expect(map).toHaveAttribute('data-last-selection', JSON.stringify({ countryId: 'CO', highlighted: true, label: 'Colombia' }))
})

test('reduced motion disables country and marker animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/components/world-map')
  const map = page.locator('[data-ui-world-map]').first()

  await expect(map.locator('.ui-world-map__countries')).toHaveCSS('animation-name', 'none')
  await expect(map.locator('.ui-world-map__marker').first()).toHaveCSS('animation-name', 'none')
})

test('static maps keep country and marker descriptions without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, ...(baseURL ? { baseURL } : {}) })
  const page = await context.newPage()

  try {
    await page.goto('/docs/components/world-map')
    const map = page.locator('[data-ui-world-map]').first()

    await expect(map.getByRole('img', { name: 'World map showing sample destinations' })).toBeVisible()
    await expect(map.getByRole('combobox')).toBeDisabled()
    await expect(map.getByRole('list', { name: 'Highlighted countries' })).toContainText('Colombia')
    await expect(map.getByRole('list', { name: 'Map markers' })).toContainText('Tokyo')
  } finally {
    await context.close()
  }
})

test('multiple map instances isolate patterns, localized labels and selections', async ({ page }) => {
  await page.goto('/docs/components/world-map')
  const maps = page.locator('[data-ui-world-map]')

  await expect(maps).toHaveCount(2)
  await expect(maps.nth(1)).toHaveAttribute('data-variant', 'solid')
  await maps.nth(1).getByRole('combobox', { name: 'Explore a country' }).selectOption('JP')
  await expect(maps.nth(1).locator('.ui-world-map__inspection')).toHaveText('日本')
  await expect(maps.first().getByRole('combobox')).toHaveValue('')
  const ids = await page.locator('pattern').evaluateAll(patterns => patterns.map(pattern => pattern.id))

  expect(new Set(ids).size).toBe(ids.length)
  const path = maps.nth(1).locator('[data-ui-world-map-country="CO"]')

  await expect(path).toHaveCSS('fill', 'rgb(23, 130, 104)')
})

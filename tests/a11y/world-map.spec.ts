import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

test('RTL map zoom preserves viewport and pointer anchors and fits highlighted geometry', async ({ page }) => {
  await page.goto('/docs/components/world-map')
  const map = page.locator('[data-ui-world-map]').first()
  const viewport = map.locator('[data-ui-world-map-viewport]')
  await map.evaluate(element => { element.setAttribute('dir', 'rtl') })
  await map.getByRole('button', { name: 'Zoom in', exact: true }).click()
  const read = () => viewport.evaluate(element => ({
    raw: element.scrollLeft,
    left: element.scrollWidth - element.clientWidth + element.scrollLeft,
    width: element.clientWidth,
    zoom: Number(getComputedStyle(element).getPropertyValue('--ui-world-map-zoom'))
  }))
  const center = await read()
  expect(center.raw).toBeLessThan(0)
  expect(Math.abs(center.left - center.width / 4)).toBeLessThan(2)
  await viewport.scrollIntoViewIfNeeded()
  const bounds = await viewport.boundingBox()
  if (!bounds) throw new Error('Missing RTL viewport')
  const x = bounds.width / 3
  await page.mouse.move(bounds.x + x, bounds.y + bounds.height / 3)
  const before = await read()
  await page.keyboard.down('Control')
  try { await page.mouse.wheel(0, -100) } finally { await page.keyboard.up('Control') }
  await expect.poll(async () => (await read()).zoom).toBeGreaterThan(before.zoom)
  const after = await read()
  expect(Math.abs(after.left - ((before.left + x) * after.zoom / before.zoom - x))).toBeLessThan(2)
  await map.locator('.ui-world-map__country--highlighted').evaluateAll(paths => {
    for (const path of paths) if (path.getAttribute('data-ui-world-map-country') !== 'CO') path.classList.remove('ui-world-map__country--highlighted')
  })
  await map.getByRole('button', { name: 'Fit highlighted countries', exact: true }).click()
  const country = await map.locator('[data-ui-world-map-country="CO"]').boundingBox()
  const fitted = await viewport.boundingBox()
  if (!country || !fitted) throw new Error('Missing fitted geometry')
  expect(Math.abs(country.x + country.width / 2 - fitted.x - fitted.width / 2)).toBeLessThan(2)
})

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

  const accent = await path.evaluate(element => {
    const probe = document.createElement('span')
    probe.style.color = 'hsl(var(--accent))'
    element.closest('figure')?.append(probe)
    const color = getComputedStyle(probe).color
    probe.remove()
    return color
  })

  await expect(path).toHaveCSS('fill', accent)
})


test('zoom preserves the viewport center, respects limits and resets without affecting selection', async ({ page }) => {
  await page.goto('/docs/components/world-map')
  const map = page.locator('[data-ui-world-map]').first()
  const viewport = map.locator('[data-ui-world-map-viewport]')
  const plot = map.locator('svg')
  const zoomIn = map.getByRole('button', { name: 'Zoom in', exact: true })
  const zoomOut = map.getByRole('button', { name: 'Zoom out', exact: true })
  const reset = map.getByRole('button', { name: 'Reset zoom', exact: true })

  await expect(zoomIn).toBeEnabled()
  await expect(zoomOut).toBeDisabled()
  const initial = await plot.boundingBox()
  if (!initial) throw new Error('Expected map bounds')
  await zoomIn.focus()
  await page.keyboard.press('Enter')
  await expect(map.locator('output')).toHaveText('150%')
  const enlarged = await plot.boundingBox()
  expect(enlarged?.width).toBeCloseTo(initial.width * 1.5, 1)
  const offset = await viewport.evaluate(element => ({ x: element.scrollLeft, width: element.clientWidth }))
  expect(Math.abs(offset.x - offset.width / 4)).toBeLessThanOrEqual(1)
  await map.getByRole('combobox').selectOption('JP')
  await expect(map.locator('output')).toHaveText('150%')
  for (let index = 0; index < 13; index++) await zoomIn.click()
  await expect(zoomIn).toBeDisabled()
  await expect(map.locator('output')).toHaveText('800%')
  await viewport.focus()
  await page.keyboard.press('ArrowRight')
  await reset.click()
  await expect(map.locator('output')).toHaveText('100%')
  await expect(zoomOut).toBeDisabled()
  await expect(map.getByRole('combobox')).toHaveValue('JP')
  const after = await plot.boundingBox()
  expect(after?.width).toBeCloseTo(initial.width, 1)
})

test('each usage has an independent code panel and Lumen token styling', async ({ page }) => {
  await page.goto('/docs/components/world-map')
  const dotted = page.locator('[data-framework-example="code-world-map"]')
  const solid = page.locator('[data-framework-example="code-world-map-solid"]')
  await expect(dotted.locator('[data-ui-world-map]')).toHaveCount(1)
  await expect(solid.locator('[data-ui-world-map]')).toHaveCount(1)
  await expect(solid).toContainText('hsl(var(--accent))')
  await expect(solid).toContainText('variant="solid"')
})

for (const index of [0, 1]) {
  test(`map style ${index} pans by dragging and keeps a clean foreground selection`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/docs/components/world-map')
    const map = page.locator('[data-ui-world-map]').nth(index)
    const viewport = map.locator('[data-ui-world-map-viewport]')
    await map.getByRole('combobox').selectOption('IR')
    for (let step = 0; step < 6; step++) await map.getByRole('button', { name: 'Zoom in', exact: true }).click()
    await viewport.evaluate(element => { element.scrollLeft = 2150; element.scrollTop = 300 })
    await map.screenshot({ path: `/tmp/lumen-map-pan-after-${index}.png` })
    const outline = map.locator('.ui-world-map__selection')
    const country = map.locator('.ui-world-map__country--selected')
    await expect(outline).toHaveAttribute('d', await country.getAttribute('d') ?? '')
    const styles = await outline.evaluate(element => {
      const style = getComputedStyle(element)
      return { join: style.strokeLinejoin, fill: style.fill, effect: style.vectorEffect, last: element === element.parentElement?.lastElementChild }
    })
    expect(styles).toEqual({ join: 'round', fill: 'none', effect: 'non-scaling-stroke', last: true })
    const bounds = await viewport.boundingBox()
    if (!bounds) throw new Error('Expected viewport bounds')
    const before = await viewport.evaluate(element => ({ x: element.scrollLeft, y: element.scrollTop }))
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width / 2 - 100, bounds.y + bounds.height / 2 - 50, { steps: 8 })
    await page.mouse.up()
    const after = await viewport.evaluate(element => ({ x: element.scrollLeft, y: element.scrollTop }))
    expect(after.x).toBeCloseTo(before.x + 100, 0)
    expect(after.y).toBeCloseTo(before.y + 50, 0)
    await expect(map.getByRole('combobox')).toHaveValue('IR')
    await expect(viewport).not.toHaveAttribute('data-panning')
  })
}

test('modified wheel keeps the cursor anchor while ordinary scrolling remains native', async ({ page }) => {
  await page.goto('/docs/components/world-map')
  const map = page.locator('[data-ui-world-map]').first()
  for (let i = 0; i < 2; i++) await map.getByRole('button', { name: 'Zoom in', exact: true }).click()
  const viewport = map.locator('[data-ui-world-map-viewport]')
  await viewport.scrollIntoViewIfNeeded()
  const bounds = await viewport.boundingBox()
  if (!bounds) throw new Error('Expected viewport')
  const x = bounds.width / 3
  const y = bounds.height / 3
  await page.mouse.move(bounds.x + x, bounds.y + y)
  const initialTop = await viewport.evaluate(element => element.scrollTop)
  await page.mouse.wheel(0, 40)
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(initialTop)
  await expect(map.locator('output')).toHaveText('200%')
  const before = await viewport.evaluate(element => ({ left: element.scrollLeft, top: element.scrollTop }))
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -100)
  await page.keyboard.up('Control')
  await expect(map.locator('output')).not.toHaveText('200%')
  const after = await viewport.evaluate(element => ({ left: element.scrollLeft, top: element.scrollTop, zoom: Number(element.style.getPropertyValue('--ui-world-map-zoom')) }))
  expect((after.left + x) / after.zoom).toBeCloseTo((before.left + x) / 2, 0)
  expect((after.top + y) / after.zoom).toBeCloseTo((before.top + y) / 2, 0)
})

test('regional guide fits its highlights on load, can reset and fit again', async ({ page }) => {
  await page.goto('/docs/web/world-map/destinations')
  const map = page.locator('[data-ui-world-map]')
  await expect(map.locator('output')).not.toHaveText('100%')
  await map.getByRole('button', { name: 'Reset zoom', exact: true }).click()
  await expect(map.locator('output')).toHaveText('100%')
  await map.getByRole('button', { name: 'Fit highlighted countries', exact: true }).click()
  await expect(map.locator('output')).not.toHaveText('100%')
  await expect(map.locator('.ui-world-map__country--highlighted')).toHaveCount(5)
  await expect(page.getByRole('tab', { name: 'React', exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fit a regional view.', exact: true })).toBeVisible()
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.locator('body').evaluate(element => element.clientWidth))
  await page.addScriptTag({ path: axePath })
  const results: unknown = await page.evaluate('axe.run("main")')
  expect(results).toMatchObject({ violations: [] })
  await map.screenshot({ path: '/tmp/lumen-world-map-regional.png' })
})

test('package directory exposes all public npm packages with grouped usage links', async ({ page }) => {
  await page.goto('/docs/packages')
  for (const name of ['Framework adapters', 'Shared foundations', 'Optional integrations']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: / on npm$/ })).toHaveCount(10)
  await page.getByRole('link', { name: 'Destination examples', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/web\/world-map\/destinations/)
})

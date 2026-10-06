import { expect, test } from '@playwright/test'

test('white, black and custom finishes preserve the screen artwork and dimensions', async ({ page }) => {
  await page.goto('/docs/components/device-frame')
  const frames = page.locator('[data-device-gallery] .ui-device-frame')
  const screens = frames.locator('.ui-device-frame__screen')
  const original = await screens.evaluateAll(elements => elements.map(element => ({
    image: element.querySelector('img')?.getAttribute('src'),
    width: element.clientWidth,
    height: element.clientHeight,
    background: getComputedStyle(element).backgroundColor
  })))

  await page.getByRole('button', { name: 'Black', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Black', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const frame of await frames.all()) await expect(frame).toHaveCSS('--ui-device-color', 'black')
  await page.getByLabel('Custom color', { exact: true }).fill('#89a7b8')
  await expect(page.getByRole('button', { name: 'Custom', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const frame of await frames.all()) await expect(frame).toHaveCSS('--ui-device-color', '#89a7b8')
  expect(await screens.evaluateAll(elements => elements.map(element => ({
    image: element.querySelector('img')?.getAttribute('src'),
    width: element.clientWidth,
    height: element.clientHeight,
    background: getComputedStyle(element).backgroundColor
  })))).toEqual(original)
  await page.getByRole('button', { name: 'White', exact: true }).click()
  for (const frame of await frames.all()) await expect(frame).toHaveCSS('--ui-device-color', 'white')
})

for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`device frames preserve screen proportions and iframe viewport at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      const errors: string[] = []

      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('pageerror', error => errors.push(error.message))
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/docs/components/device-frame')
      await expect.poll(async () => ({ scale: await page.locator('[data-device-gallery] .ui-device-frame__screen').first().evaluate(element => element.style.getPropertyValue('--ui-device-frame-scale')), errors })).toMatchObject({ scale: expect.stringMatching(/.+/), errors: [] })
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      const frames = page.locator('[data-device-gallery] .ui-device-frame')

      await expect(frames).toHaveCount(6)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      for (const name of ['MacBook Pro', 'MacBook Air', 'iMac', 'iPhone', 'Google Pixel', 'iPad Pro']) {
        await page.getByRole('button', { name, exact: true }).click()
        const slide = page.locator(`[data-device-slide][data-device-name="${name}"]`)

        await expect(slide).toHaveAttribute('aria-hidden', 'false')
        const stage = await slide.locator('.device-gallery-stage').boundingBox()
        const frame = await slide.locator('.ui-device-frame').boundingBox()

        if (!stage || !frame) throw new Error('Expected device and stage geometry')
        expect(frame.x).toBeGreaterThanOrEqual(stage.x - 1)
        expect(frame.y).toBeGreaterThanOrEqual(stage.y - 1)
        expect(frame.x + frame.width).toBeLessThanOrEqual(stage.x + stage.width + 1)
        expect(frame.y + frame.height).toBeLessThanOrEqual(stage.y + stage.height + 1)
      }
      const dimensions = await page.locator('[data-device-gallery] .ui-device-frame__screen').evaluateAll(screens => screens.map(screen => {
        const bounds = screen.getBoundingClientRect()
        const aspectRatio = getComputedStyle(screen).aspectRatio.split('/').map(Number)

        return { width: bounds.width, height: bounds.height, ratio: Number(aspectRatio[0]) / Number(aspectRatio[1]), overflow: screen.scrollWidth - screen.clientWidth }
      }))

      for (const size of dimensions) {
        expect(size.width / size.height).toBeCloseTo(size.ratio, 2)
        expect(size.overflow).toBeLessThanOrEqual(1)
      }
      await page.getByRole('button', { name: 'MacBook Pro', exact: true }).click()
      const iframe = page.locator('.ui-device-frame iframe').first()

      await iframe.scrollIntoViewIfNeeded()
      await expect(iframe).toHaveAttribute('title', 'MacBook Pro Lumen workspace')
      await expect(iframe).toHaveCSS('width', '1280px')
      await expect(iframe).toHaveCSS('height', '800px')
      const content = page.frames().find(frame => frame.url().includes('/device-frame-demo'))

      if (!content) throw new Error('Expected loaded demo iframe')
      expect(await content.evaluate(() => window.innerWidth)).toBe(1280)
      await expect(content.getByRole('heading', { name: /A thoughtful start/ })).toBeVisible()
      await expect.poll(() => frames.locator('img').evaluateAll(images => images.every(
        image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
      ))).toBe(true)
      await expect(frames.locator('.ui-device-frame__camera[aria-hidden="true"], .ui-device-frame__base[aria-hidden="true"]')).toHaveCount(12)
      await page.getByRole('button', { name: 'Google Pixel', exact: true }).click()
      await page.getByRole('link', { name: 'Explore components', exact: true }).focus()
      await expect(page.getByRole('link', { name: 'Explore components', exact: true })).toBeFocused()
      expect(errors).toEqual([])
      await page.locator('[data-device-slide][data-device-name="Google Pixel"] .device-gallery-stage').screenshot({ path: testInfo.outputPath('pixel-frame.png') })
      await page.getByRole('button', { name: 'MacBook Pro', exact: true }).click()
      await frames.first().screenshot({ path: testInfo.outputPath('laptop-frame.png') })
    })
  }
}

test('device iframe stays fixed when the available width changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/docs/components/device-frame')
  const screen = page.locator('[data-device-gallery] .ui-device-frame__screen').first()

  await expect.poll(() => screen.evaluate(element => element.style.getPropertyValue('--ui-device-frame-scale'))).not.toBe('')
  const initial = await screen.evaluate(element => Number(element.style.getPropertyValue('--ui-device-frame-scale')))

  await page.setViewportSize({ width: 375, height: 1000 })
  await expect.poll(() => screen.evaluate(element => Number(element.style.getPropertyValue('--ui-device-frame-scale')))).toBeLessThan(initial)
  await expect(screen.locator('iframe')).toHaveCSS('width', '1280px')
  await page.evaluate(() => { document.documentElement.dir = 'rtl' })
  const bounds = await screen.locator('iframe').boundingBox()
  const screenBounds = await screen.boundingBox()

  if (!bounds || !screenBounds) throw new Error('Expected screen and iframe bounds')
  expect(bounds.x).toBeCloseTo(screenBounds.x, 0)
})

test('Astro screen cleans up on removal and initializes when reconnected', async ({ page }) => {
  await page.goto('/docs/components/device-frame')
  const screen = page.locator('[data-device-gallery] .ui-device-frame__screen').first()

  await expect.poll(() => screen.evaluate(element => element.style.getPropertyValue('--ui-device-frame-scale'))).not.toBe('')
  const result = await screen.evaluate(element => {
    const parent = element.parentElement
    const iframe = element.querySelector('iframe')

    if (!parent) throw new Error('Expected screen shell')
    element.remove()
    const detachedScale = element.style.getPropertyValue('--ui-device-frame-scale')

    parent.append(element)

    return { detachedScale, sameIframe: iframe === element.querySelector('iframe'), connectedScale: element.style.getPropertyValue('--ui-device-frame-scale') }
  })

  expect(result.detachedScale).toBe('')
  expect(result.sameIframe).toBe(true)
  expect(result.connectedScale).not.toBe('')
})

test('hardware details leave live content and its first controls unobstructed', async ({ page }) => {
  await page.goto('/docs/components/device-frame')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [device, label] of [['macbook-pro', 'MacBook Pro'], ['macbook-air', 'MacBook Air'], ['imac', 'iMac'], ['pixel', 'Google Pixel'], ['ipad-pro', 'iPad Pro']] as const) {
    await page.getByRole('button', { name: label, exact: true }).click()
    const frame = page.locator(`[data-device-gallery] .ui-device-frame[data-device="${device}"]`)

    await frame.scrollIntoViewIfNeeded()
    const camera = await frame.locator('.ui-device-frame__camera').boundingBox()
    const screen = await frame.locator('.ui-device-frame__screen').boundingBox()

    if (!camera || !screen) throw new Error(`Expected visible ${device} hardware`)
    expect(camera.y + camera.height).toBeLessThanOrEqual(screen.y + 1)
  }
  await page.getByRole('button', { name: 'Google Pixel', exact: true }).click()
  await page.getByRole('link', { name: 'Explore components', exact: true }).focus()
  await expect(page.getByRole('link', { name: 'Explore components', exact: true })).toBeFocused()
})


test('device gallery selects one accessible slide and supports keyboard and button navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/components/device-frame')
  const viewport = page.locator('.device-gallery-viewport')

  const airSelector = page.getByRole('button', { name: 'MacBook Air', exact: true })

  await airSelector.scrollIntoViewIfNeeded()
  const scrollPosition = await page.evaluate(() => window.scrollY)

  await airSelector.click()
  await expect(airSelector).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollPosition)
  await page.getByRole('button', { name: 'MacBook Pro', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Previous device', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Next device', exact: true }).click()
  await expect(page.getByRole('button', { name: 'MacBook Air', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await viewport.focus()
  await page.keyboard.press('End')
  await expect(page.getByRole('button', { name: 'iPad Pro', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Next device', exact: true })).toBeDisabled()
  await expect(page.locator('[data-device-slide]:not([inert])')).toHaveCount(1)
  const tablet = page.locator('.ui-device-frame[data-device="ipad-pro"]')

  await expect(tablet.locator('.ui-device-frame__base')).toBeHidden()
  await expect(tablet.locator('.ui-device-frame__screen')).toHaveCSS('aspect-ratio', '1194 / 834')
  await viewport.focus()
  await page.keyboard.press('Home')
  await expect(page.getByRole('button', { name: 'MacBook Pro', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Google Pixel', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Explore components', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose what goes on screen', exact: true })).toBeVisible()
})


test('device gallery remains interactive after navigating away and returning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/components/device-frame')
  await page.getByRole('link', { name: 'Image options', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/components\/image$/)
  await page.locator('a[href="/docs/components/device-frame"]').first().click()
  await expect(page).toHaveURL(/\/docs\/components\/device-frame$/)
  await page.getByRole('button', { name: 'Next device', exact: true }).click()
  await expect(page.getByRole('button', { name: 'MacBook Air', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Black', exact: true }).click()
  await expect(page.locator('[data-device-slide]:not([inert]) .ui-device-frame')).toHaveCSS('--ui-device-color', 'black')
  await expect(page.getByText('scroll={false}', { exact: true })).toBeVisible()
})

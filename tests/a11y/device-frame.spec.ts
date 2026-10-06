import { expect, test } from '@playwright/test'

test('white, black and custom finishes preserve the screen artwork and dimensions', async ({ page }) => {
  await page.goto('/docs/components/device-frame')
  const frames = page.locator('.device-demo-composition .ui-device-frame')
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
      await expect.poll(async () => ({ scale: await page.locator('.device-demo-examples .ui-device-frame__screen').first().evaluate(element => element.style.getPropertyValue('--ui-device-frame-scale')), errors })).toMatchObject({ scale: expect.stringMatching(/.+/), errors: [] })
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      const frames = page.locator('.device-demo-examples .ui-device-frame')

      await expect(frames).toHaveCount(5)
      for (const screen of await page.locator('.device-demo-examples .ui-device-frame__screen').all()) {
        await screen.scrollIntoViewIfNeeded()
        await expect.poll(() => screen.evaluate(element => ({ scale: element.style.getPropertyValue('--ui-device-frame-scale'), width: element.clientWidth }))).toMatchObject({ scale: expect.stringMatching(/.+/) })
      }
      const dimensions = await page.locator('.device-demo-examples .ui-device-frame__screen').evaluateAll(screens => screens.map(screen => {
        const bounds = screen.getBoundingClientRect()
        const aspectRatio = getComputedStyle(screen).aspectRatio.split('/').map(Number)

        return { width: bounds.width, height: bounds.height, ratio: Number(aspectRatio[0]) / Number(aspectRatio[1]), overflow: screen.scrollWidth - screen.clientWidth }
      }))

      for (const size of dimensions) {
        expect(size.width / size.height).toBeCloseTo(size.ratio, 2)
        expect(size.overflow).toBeLessThanOrEqual(1)
      }
      const composition = page.getByRole('img', { name: 'Matte white iMac, MacBook Pro, and iPhone arranged together' })
      const stageBounds = await composition.boundingBox()

      if (!stageBounds) throw new Error('Expected visible device composition')
      for (const frame of await composition.locator('.ui-device-frame').all()) {
        const bounds = await frame.boundingBox()

        if (!bounds) throw new Error('Expected visible composed device')
        expect(bounds.x).toBeGreaterThanOrEqual(stageBounds.x)
        expect(bounds.y).toBeGreaterThanOrEqual(stageBounds.y)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(stageBounds.x + stageBounds.width + 1)
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(stageBounds.y + stageBounds.height + 1)
      }
      const iframe = page.locator('.ui-device-frame iframe').first()

      await iframe.scrollIntoViewIfNeeded()
      await expect(iframe).toHaveAttribute('title', 'Responsive Lumen demonstration')
      await expect(iframe).toHaveCSS('width', '1280px')
      await expect(iframe).toHaveCSS('height', '800px')
      const content = page.frames().find(frame => frame.url().includes('/device-frame-demo'))

      if (!content) throw new Error('Expected loaded demo iframe')
      expect(await content.evaluate(() => window.innerWidth)).toBe(1280)
      await expect(content.getByRole('heading', { name: /A little space/ })).toBeVisible()
      await expect.poll(() => frames.locator('img').evaluateAll(images => images.every(
        image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
      ))).toBe(true)
      await expect(frames.locator('.ui-device-frame__camera[aria-hidden="true"], .ui-device-frame__base[aria-hidden="true"]')).toHaveCount(10)
      await page.getByRole('button', { name: 'Start a project', exact: true }).focus()
      await expect(page.getByRole('button', { name: 'Start a project', exact: true })).toBeFocused()
      expect(errors).toEqual([])
      await frames.nth(1).scrollIntoViewIfNeeded()
      await page.locator('.device-frame-demo-grid').first().screenshot({ path: testInfo.outputPath('device-frames.png') })
      await frames.first().screenshot({ path: testInfo.outputPath('laptop-frame.png') })
    })
  }
}

test('device iframe stays fixed when the available width changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/docs/components/device-frame')
  const screen = page.locator('.device-demo-examples .ui-device-frame__screen').first()

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
  const screen = page.locator('.device-demo-examples .ui-device-frame__screen').first()

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
  for (const device of ['macbook-pro', 'imac', 'pixel']) {
    const frame = page.locator(`.device-demo-examples .ui-device-frame[data-device="${device}"]`)

    await frame.scrollIntoViewIfNeeded()
    const camera = await frame.locator('.ui-device-frame__camera').boundingBox()
    const screen = await frame.locator('.ui-device-frame__screen').boundingBox()

    if (!camera || !screen) throw new Error(`Expected visible ${device} hardware`)
    expect(camera.y + camera.height).toBeLessThanOrEqual(screen.y + 1)
  }
  await page.getByRole('button', { name: 'Start a project', exact: true }).focus()
  await expect(page.getByRole('button', { name: 'Start a project', exact: true })).toBeFocused()
})

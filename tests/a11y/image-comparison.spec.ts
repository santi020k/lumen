import { expect, test } from '@playwright/test'

for (const direction of ['ltr', 'rtl']) {
  test(`image comparison divider and crop match range direction in ${direction}`, async ({ page }) => {
    await page.goto('/docs/components/image-comparison')
    const comparison = page.locator('.ui-image-comparison')
    await comparison.evaluate((element, dir) => {
      element.setAttribute('dir', dir)
    }, direction)
    const range = comparison.getByRole('slider')
    await expect(range).toBeEnabled()
    for (const value of [0, 25, 75, 100]) {
      await range.fill(String(value))
      const frame = comparison.locator('.ui-image-comparison__frame')
      const bounds = await frame.evaluate(element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const leftBorder = Number.parseFloat(style.borderLeftWidth)
        const rightBorder = Number.parseFloat(style.borderRightWidth)

        return { x: rect.x + leftBorder, width: rect.width - leftBorder - rightBorder }
      })
      const divider = await comparison.locator('.ui-image-comparison__divider').boundingBox()
      if (!divider) throw new Error('Expected comparison geometry')
      const ratio = direction === 'ltr' ? value / 100 : 1 - value / 100
      const dividerEdge = direction === 'ltr' ? divider.x : divider.x + divider.width
      expect(dividerEdge).toBeCloseTo(bounds.x + bounds.width * ratio, 1)
      await expect(comparison.locator('.ui-image-comparison__after')).toHaveCSS('clip-path',
        direction === 'ltr' ? `inset(0px ${100 - value}% 0px 0px)` : `inset(0px 0px 0px ${100 - value}%)`)
      await expect(range).toHaveAttribute('aria-valuetext', `${value}% Color adjusted`)
    }
  })
}

for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`image comparison preserves framing at ${width}px in ${theme}`, async ({ page }) => {
      const runtimeErrors: string[] = []

      page.on('pageerror', error => runtimeErrors.push(error.message))
      page.on('console', message => {
        if (message.type() === 'error') runtimeErrors.push(message.text())
      })
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/docs/components/image-comparison')
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)
      const comparison = page.locator('.ui-image-comparison')
      const range = comparison.getByRole('slider', { name: 'Compare the landscape treatment' })

      await expect.poll(async () => ({ disabled: await range.isDisabled(), runtimeErrors })).toEqual({ disabled: false, runtimeErrors: [] })
      await expect(comparison.locator('img')).toHaveCount(2)
      await expect.poll(() => comparison.locator('img').evaluateAll(images => images.every(
        image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
      ))).toBe(true)
      const initial = await comparison.locator('img').first().boundingBox()

      if (!initial) throw new Error('Expected visible comparison media')

      for (const key of ['Home', 'ArrowRight', 'End', 'ArrowLeft']) {
        await range.press(key)
        const frames = await comparison.locator('img').evaluateAll(images => images.map(image => {
          const { x, y, width: imageWidth, height } = image.getBoundingClientRect()

          return { x, y, width: imageWidth, height }
        }))

        expect(frames[0]).toEqual(frames[1])
        expect(frames[0]?.width).toBe(initial.width)
        expect(frames[0]?.height).toBe(initial.height)
        if (key === 'Home') await expect(range).toHaveValue('0')
        if (key === 'End') await expect(range).toHaveValue('100')
      }
      await expect(range).toHaveValue('99')
      expect(await comparison.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    })
  }
}

test('image comparison follows native RTL range keys with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/components/image-comparison')
  const comparison = page.locator('.ui-image-comparison')
  const range = comparison.getByRole('slider')

  await comparison.evaluate(element => {
    element.setAttribute('dir', 'rtl')
  })
  await range.press('Home')
  await expect(range).toHaveValue('0')
  await range.press('ArrowLeft')
  await expect(range).toHaveValue('1')
  await range.press('End')
  await expect(range).toHaveValue('100')
  await range.press('ArrowRight')
  await expect(range).toHaveValue('99')
})

test('image comparison keeps a labelled static fallback without JavaScript', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('Expected a configured documentation base URL')

  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()

  try {
    await page.goto('/docs/components/image-comparison')
    const comparison = page.locator('.ui-image-comparison')

    await expect(comparison.getByRole('slider', { name: 'Compare the landscape treatment' })).toBeDisabled()
    await expect(comparison.locator('.ui-image-comparison__before')).toBeVisible()
    await expect(comparison.locator('.ui-image-comparison__after')).toBeVisible()
  } finally {
    await context.close()
  }
})

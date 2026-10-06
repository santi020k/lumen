import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`theme controls and playback work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })

    const errors: string[] = []

    page.on('pageerror', error => {
      errors.push(error.message)
    })

    await page.goto('/')

    await expect(page.getByRole('status')).toHaveText('Paused · Lumen Light')

    const dark = page.getByRole('button', { name: 'Dark', exact: true })

    await dark.focus()

    await page.keyboard.press('Enter')

    await expect(dark).toHaveAttribute('aria-pressed', 'true')

    await expect(page.getByRole('status')).toHaveText('Paused · Lumen Dark')

    await expect(page.frameLocator('#composition').locator('.scene').nth(1)).toHaveCSS('opacity', '1')

    await page.getByRole('button', { name: 'Studio', exact: true }).click()

    await expect(page.getByRole('status')).toHaveText('Paused · Studio')

    await page.getByRole('button', { name: 'Landscape', exact: true }).click()

    await expect(page.locator('#composition')).toHaveAttribute('src', '/landscape/')

    await expect(page.frameLocator('#composition').locator('.scene').nth(2)).toHaveCSS('opacity', '1')

    await page.getByRole('button', { name: 'Play animation' }).click()

    await expect(page.getByRole('status')).toHaveText('Playing · Lumen Light')

    await page.getByRole('button', { name: 'Pause', exact: true }).click()

    await expect(page.getByRole('status')).toHaveText('Paused · Lumen Light')

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    expect(errors).toEqual([])
  })
}

test('reduced motion presents still themes and disables playback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Play animation' })).toBeDisabled()

  await expect(page.locator('#motion-preference')).toBeVisible()

  await page.getByRole('button', { name: 'Studio', exact: true }).click()

  await expect(page.getByRole('status')).toHaveText('Paused · Studio')
})

test('both compositions fit their canvases and can seek backwards deterministically', async ({ page }) => {
  for (const format of ['portrait', 'landscape']) {
    await page.setViewportSize(format === 'portrait' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 })

    await page.goto(`/${format}/`)

    await page.evaluate(() => document.fonts.ready)

    const seek = async (time: number) => {
      await page.evaluate(value => {
        const timeline = window.__timelines?.['theme-pilot']

        if (!timeline) throw new Error('Composition timeline was not registered')

        timeline.pause().seek(value)
      }, time)
    }

    await seek(1)

    const light = await page.screenshot()

    await seek(9)

    expect(await page.screenshot()).not.toEqual(light)

    await seek(1)

    expect(await page.screenshot()).toEqual(light)

    const overflow = await page.locator('.scene').evaluateAll(scenes => scenes.some(scene => scene.scrollHeight > scene.clientHeight))

    expect(overflow).toBe(false)

    expect(await page.locator('.scene').first().locator('.composition-footer').evaluate(footer => footer.getBoundingClientRect().bottom <= window.innerHeight - 60)).toBe(true)
  }
})

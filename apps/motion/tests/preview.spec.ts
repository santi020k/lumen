import { expect, type Locator, test } from '@playwright/test'

const expectDesktopCardsToFit = async (screen: Locator, context: string) => {
  const footerBounds = await screen.locator('.desktop-workspace-footer').boundingBox()

  if (!footerBounds) throw new Error('Desktop footer must be measurable')

  for (const card of await screen.locator('.desktop-detail > [data-slot="card"]').all()) {
    const bounds = await card.boundingBox()

    if (!bounds) throw new Error('Desktop cards must be measurable')

    expect(bounds.y + bounds.height, `${context}: card clears the footer`).toBeLessThanOrEqual(footerBounds.y - 6)

    expect(await card.evaluate(element => element.scrollHeight <= element.clientHeight), `${context}: card content fits`).toBe(true)
  }
}

const expectDesktopStill = async (screen: Locator) => {
  await expect(screen.locator('.completion-trend')).toHaveCSS('clip-path', 'inset(0px 0% 0px 0px)')

  for (const indicator of await screen.locator('[data-slot="progress-indicator"]').all()) {
    expect(await indicator.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).a)).toBe(1)
  }

  await expect(screen.getByRole('button', { name: 'New project' })).toBeDisabled()
}

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

    await expectDesktopStill(page.frameLocator('#composition').locator('.scene').nth(1).locator('.desktop-workspace'))

    await page.getByRole('button', { name: 'Glass', exact: true }).click()

    await expect(page.getByRole('status')).toHaveText('Paused · Glass')

    await page.getByRole('button', { name: 'Studio', exact: true }).click()

    await expect(page.getByRole('status')).toHaveText('Paused · Studio')

    await expectDesktopStill(page.frameLocator('#composition').locator('.scene').nth(3).locator('.desktop-workspace'))

    await page.getByRole('button', { name: 'Landscape', exact: true }).click()

    await expect(page.locator('#composition')).toHaveAttribute('src', '/landscape/')

    await expect(page.frameLocator('#composition').locator('.scene').nth(3)).toHaveCSS('opacity', '1')

    await page.getByRole('button', { name: 'Square', exact: true }).click()

    await expect(page.locator('#composition')).toHaveAttribute('src', '/square/')

    await expect(page.frameLocator('#composition').locator('.scene').nth(3)).toHaveCSS('opacity', '1')

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

  await expectDesktopStill(page.frameLocator('#composition').locator('.scene').nth(3).locator('.desktop-workspace'))
})

test('all compositions fit their canvases and can seek backwards deterministically', async ({ page }) => {
  for (const format of ['portrait', 'square', 'landscape']) {
    await page.setViewportSize({ width: format === 'landscape' ? 1920 : 1080, height: format === 'portrait' ? 1920 : 1080 })

    await page.goto(`/${format}/`)

    await page.evaluate(() => document.fonts.ready)

    const seek = async (time: number) => {
      await page.evaluate(value => {
        const timeline = window.__timelines?.['theme-pilot']

        if (!timeline) throw new Error('Composition timeline was not registered')

        timeline.pause().seek(value)
      }, time)
    }

    await seek(2)

    const light = await page.screenshot()

    await seek(9)

    expect(await page.screenshot()).not.toEqual(light)

    await seek(2)

    expect(await page.screenshot()).toEqual(light)

    const overflow = await page.locator('.scene').evaluateAll(scenes => scenes.some(scene => scene.scrollHeight > scene.clientHeight))

    expect(overflow, `${format} scenes stay inside their canvas`).toBe(false)

    const lightScene = page.locator('.scene').first()

    await expect(lightScene.locator('.desktop-device')).toHaveAttribute('data-device', 'macbook-pro')

    const proFrame = lightScene.locator('.desktop-device')

    const proGeometry = await proFrame.evaluate(frame => {
      const base = frame.querySelector<HTMLElement>('.ui-device-frame__base')
      const camera = frame.querySelector<HTMLElement>('.ui-device-frame__camera')

      if (!base || !camera) throw new Error('MacBook Pro hardware must be present')

      return { frontEdge: base.offsetHeight / frame.clientWidth, notch: camera.offsetWidth / frame.clientWidth }
    })

    expect(proGeometry.frontEdge, 'Pro front edge survives export stylesheet filtering').toBeGreaterThan(0.03)

    expect(proGeometry.notch, 'Pro camera notch survives export stylesheet filtering').toBeGreaterThan(0.1)

    for (const time of [2, 3.8, 6.6, 9]) {
      await seek(time)

      const index = [2.6, 5, 8].filter(start => time >= start).length
      const screen = page.locator('.scene').nth(index).locator('.desktop-workspace')

      expect(await screen.evaluate(element => element.scrollHeight <= element.clientHeight), `${format} workspace fits at ${time}s`).toBe(true)

      await expectDesktopCardsToFit(screen, `${format} at ${time}s`)

      await expectDesktopStill(screen)

      await expect(screen.getByRole('progressbar', { name: 'Design foundations: complete' })).toHaveAttribute('aria-valuenow', '100')

      await expect(screen.getByRole('progressbar', { name: 'Product workspace: 68 percent complete' })).toHaveAttribute('aria-valuenow', '68')

      await expect(screen.getByRole('img', { name: /Sample cumulative completed projects/ })).toBeVisible()

      for (let other = 0; other < 4; other++) {
        if (other !== index) await expect(page.locator('.scene').nth(other)).toHaveCSS('visibility', 'hidden')
      }
    }

    await seek(6.6)

    const glassScene = page.locator('.scene').nth(2)

    await expect(glassScene).toHaveCSS('opacity', '1')

    await expect(glassScene.locator('.desktop-workspace')).toHaveClass(/ui-card--glass/)

    await expect(glassScene.locator('.desktop-workspace')).toHaveCSS('backdrop-filter', /blur/)

    await seek(11.2)

    const studioScene = page.locator('.scene').nth(3)
    const phone = studioScene.locator('.phone-screen')
    const device = studioScene.locator('.phone-device')

    await expect(device).toHaveCSS('opacity', '1')

    await expect(phone.getByRole('button', { name: 'Open workspace' })).toBeDisabled()

    await expect(device).toHaveAttribute('data-device', 'iphone')

    expect(await phone.evaluate(screen => screen.clientWidth)).toBe(390)

    expect(await phone.evaluate(screen => screen.clientHeight)).toBe(844)

    expect(await phone.evaluate(screen => screen.scrollHeight <= screen.clientHeight)).toBe(true)

    const contentBounds = await phone.boundingBox()
    const screenBounds = await device.locator('[data-ui-device-screen]').boundingBox()

    if (!contentBounds || !screenBounds) throw new Error('Phone content and screen must be measurable')

    expect(contentBounds.x).toBeGreaterThanOrEqual(screenBounds.x - 1)

    expect(contentBounds.x + contentBounds.width).toBeLessThanOrEqual(screenBounds.x + screenBounds.width + 1)

    const projects = phone.locator('.project')
    const firstY = await projects.nth(0).evaluate(element => element.getBoundingClientRect().y)
    const secondY = await projects.nth(1).evaluate(element => element.getBoundingClientRect().y)

    expect(secondY).toBeGreaterThan(firstY)

    const centerY = await device.evaluate(element => {
      const box = element.getBoundingClientRect()

      return box.y + box.height / 2
    })

    const stageCenterY = await studioScene.locator('.composition-stage').evaluate(element => {
      const box = element.getBoundingClientRect()

      return box.y + box.height / 2
    })

    expect(Math.abs(centerY - stageCenterY)).toBeLessThan(2)

    await seek(11.2)

    expect(await page.locator('.scene').nth(3).locator('.composition-footer').evaluate(footer => footer.getBoundingClientRect().bottom <= window.innerHeight - 30)).toBe(true)

    await seek(14.5)

    await expect(page.locator('.end-card')).toHaveCSS('opacity', '1')

    await expect(studioScene).toHaveCSS('opacity', '0')

    await seek(0)

    await expect(lightScene.locator('.desktop-device')).toHaveCSS('opacity', '0')

    await seek(2)

    expect(await page.locator('.scene').first().locator('.composition-footer').evaluate(footer => footer.getBoundingClientRect().bottom <= window.innerHeight - 60)).toBe(true)
  }
})

test('standalone brand endings match the film and stop at their declared duration', async ({ page }) => {
  for (const format of ['portrait', 'square', 'landscape']) {
    await page.setViewportSize({ width: format === 'landscape' ? 1920 : 1080, height: format === 'portrait' ? 1920 : 1080 })

    await page.goto(`/${format}/`)

    await page.evaluate(() => document.fonts.ready)

    await page.evaluate(() => {
      window.__timelines?.['theme-pilot']?.pause().seek(14.5)
    })

    const ending = await page.screenshot()

    await page.goto(`/outro/${format}/`)

    await page.evaluate(() => document.fonts.ready)

    await page.evaluate(() => {
      window.__timelines?.['brand-outro']?.pause().seek(3)
    })

    expect(await page.screenshot()).toEqual(ending)

    expect(await page.evaluate(() => window.__timelines?.['brand-outro']?.duration())).toBe(3.5)

    await page.evaluate(() => {
      window.postMessage({ type: 'lumen-motion-seek', time: 100 }, window.location.origin)
    })

    await expect.poll(() => page.evaluate(() => window.__timelines?.['brand-outro']?.time())).toBe(3.5)
  }
})

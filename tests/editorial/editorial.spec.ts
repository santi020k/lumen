import { expect, test } from '@playwright/test'

for (const width of [320, 390, 1440]) {
  for (const theme of ['lumen-light', 'lumen-dark']) {
    test(`installed editorial recipes fit ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/')
      await page.locator('html').evaluate((html, value) => { html.dataset.theme = value }, theme)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('article', { name: 'Repeated card 1' })).toBeVisible()
      await expect(page.getByRole('region', { name: 'A conversation 2' })).toBeVisible()
      await expect(page.getByRole('img', { name: 'Contained illustration' })).toBeVisible()
      const structure = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map(element => element.id)
        const missingLabels = [...document.querySelectorAll('[aria-labelledby]')].flatMap(element => (element.getAttribute('aria-labelledby') ?? '').split(' ').filter(id => !document.getElementById(id)))
        return { uniqueIds: new Set(ids).size === ids.length, missingLabels, overflow: document.documentElement.scrollWidth > window.innerWidth }
      })
      expect(structure).toEqual({ uniqueIds: true, missingLabels: [], overflow: false })
      for (const link of await page.locator('a[target="_blank"]').all()) {
        await expect(link).toHaveAttribute('rel', /noopener/)
        await expect(link).toHaveAttribute('rel', /noreferrer/)
      }
      const contrasts = await page.evaluate(() => {
        const luminance = (color: string): number => {
          const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(value => {
            const channel = Number(value) / 255
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          })
          const [red, green, blue] = channels
          if (red === undefined || green === undefined || blue === undefined) throw new Error(`Unsupported computed color: ${color}`)
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue
        }
        return [...document.querySelectorAll('.editorial-card__category, .editorial-card__copy, .editorial-card__action, .editorial-contact__label, .editorial-replacement__label, .editorial-introduction__label')].map(element => {
          let background: Element | null = element
          while (background && getComputedStyle(background).backgroundColor === 'rgba(0, 0, 0, 0)') background = background.parentElement
          if (!background) throw new Error('Expected an opaque consumer background')
          const foregroundLight = luminance(getComputedStyle(element).color)
          const backgroundLight = luminance(getComputedStyle(background).backgroundColor)
          return (Math.max(foregroundLight, backgroundLight) + 0.05) / (Math.min(foregroundLight, backgroundLight) + 0.05)
        })
      })
      expect(contrasts.length).toBeGreaterThan(0)
      expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5)
      if (theme === 'lumen-light') {
        const backgrounds = await page.locator('.editorial-card').evaluateAll(cards => cards.map(card => getComputedStyle(card).backgroundColor))
        expect(backgrounds[0]).not.toBe(backgrounds[2])
      }
      const action = page.getByRole('link', { name: 'Read the external guide' }).first()
      await action.focus()
      await expect(action).toBeFocused()
      expect(await action.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
      await page.screenshot({ path: testInfo.outputPath(`editorial-${width}-${theme}.png`), fullPage: true })
      await page.locator('html').evaluate(html => { html.style.fontSize = '200%' })
      await page.locator('#card-1').evaluate(element => { element.textContent = 'MultidisciplinaryResearchAndDocumentation'.repeat(4) })
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
    })
  }
}

test('static recipes remain usable without client JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Read the external guide' })).toHaveCount(2)
  await expect(page.getByRole('heading', { name: 'Text without media' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Reader testimonials' }).locator('blockquote')).toHaveCount(3)
  await expect(page.getByRole('region', { name: 'Project timeline' }).getByRole('link', { name: 'First field notes' })).toHaveAttribute('href', '#consumer-title')
  await expect(page.locator('footer').getByRole('navigation', { name: 'Project links' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Watch example film' })).toHaveAttribute('href', '/film.mp4')
  await page.getByText('Read the transcript', { exact: true }).click()
  await expect(page.getByText('A short illustration of the workflow.')).toBeVisible()
  await context.close()
})

test('video waits for a request and recovers from a failed source on reopen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  let requests = 0
  await page.route('**/film.mp4', async route => {
    requests += 1
    await route.abort()
  })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Watch example film' })
  const dialog = page.getByRole('dialog', { name: 'Example film' })
  await expect(trigger).toBeVisible()
  expect(requests).toBe(0)
  await page.locator('html').evaluate(html => { html.style.fontSize = '200%' })
  await trigger.press('Enter')
  await expect(dialog).toBeVisible()
  const dialogFits = await dialog.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    return bounds.left >= 0 && bounds.right <= window.innerWidth && element.scrollWidth <= element.clientWidth
  })
  expect(dialogFits).toBe(true)
  await expect(dialog.getByRole('status')).toHaveText('The video could not load.')
  await expect(dialog.getByRole('link', { name: 'Open the video file' })).toHaveAttribute('href', '/film.mp4')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  const requestsAfterFailure = requests
  await trigger.press('Enter')
  await expect.poll(() => requests).toBeGreaterThan(requestsAfterFailure)
  await dialog.getByRole('button', { name: 'Close film' }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('closing the video dialog pauses playback', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Watch example film' })
  const dialog = page.getByRole('dialog', { name: 'Example film' })
  const video = page.locator('#sample-video video')
  await trigger.click()
  await expect(video).toBeVisible()
  await video.evaluate(async element => {
    if (!(element instanceof HTMLVideoElement)) throw new TypeError('Expected a video element')

    element.muted = true
    await element.play()
  })
  await expect(video).toHaveJSProperty('paused', false)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(video).toHaveJSProperty('paused', true)
  await expect(trigger).toBeFocused()
})

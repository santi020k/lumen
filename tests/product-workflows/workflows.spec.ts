import { expect, test } from '@playwright/test'

test('video defers media and captions, retries, and moves a single transcript into its dialog', async ({ page }) => {
  const requests: string[] = []
  let filmAttempts = 0
  await page.route('**/film.mp4', route => {
    requests.push(route.request().url())
    filmAttempts += 1
    return filmAttempts === 1 ? route.abort() : route.continue()
  })
  page.on('request', request => {
    if (request.url().endsWith('/captions.vtt')) requests.push(request.url())
  })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Watch film' })
  await expect(trigger).toBeVisible()
  expect(requests).toEqual([])
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Product film' })
  await expect(dialog.getByRole('status')).toHaveText('Film unavailable.')
  await expect(dialog.getByRole('link', { name: 'Open film file' })).toHaveAttribute('href', '/film.mp4')
  await dialog.getByRole('button', { name: 'Retry video' }).click()
  await expect.poll(async () => dialog.locator('video').evaluate(video => {
    if (!(video instanceof HTMLVideoElement)) throw new TypeError('Expected video')
    return video.readyState
  })).toBeGreaterThan(0)
  await expect(dialog.getByRole('status')).toHaveText('')
  await dialog.locator('summary').click()
  await expect(dialog.getByText('A complete transcript of the product film.')).toBeVisible()
  await expect(page.locator('#film-transcript')).toHaveCount(1)
  await expect(dialog.locator('video track')).toHaveAttribute('src', '/captions.vtt')
  await dialog.locator('video').evaluate(video => {
    if (!(video instanceof HTMLVideoElement)) throw new TypeError('Expected video')
    const track = video.textTracks[0]
    if (track) track.mode = 'showing'
  })
  await expect.poll(() => requests.some(url => url.endsWith('/captions.vtt'))).toBe(true)
  await dialog.getByRole('button', { name: 'Close film' }).click()
  await expect(page.locator('#workflow-film video')).toHaveJSProperty('paused', true)
  await expect(trigger).toBeFocused()
})

test('Astro navigation pauses and removes the previous video instance', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Watch film' }).click()
  await page.locator('video').evaluate(video => {
    if (!(video instanceof HTMLVideoElement)) throw new TypeError('Expected video')
    const pause = video.pause.bind(video)
    Object.defineProperty(video, 'pause', { value: () => {
      sessionStorage.setItem('fixture:video-paused', 'true')
      pause()
    } })
  })
  await page.evaluate(() => { document.dispatchEvent(new Event('fixture:navigate')) })
  await expect(page.getByRole('heading', { name: 'Another page' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('fixture:video-paused'))).toBe('true')
  await expect(page.locator('lumen-editorial-video')).toHaveCount(0)
})

test('a folded highlighted example copies the complete source and recovers from clipboard denial', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: (value: string) => {
        if (document.documentElement.dataset.copyDenied === 'true') return Promise.reject(new Error('Denied'))
        document.documentElement.dataset.copied = value
        return Promise.resolve()
      }
    } })
  })
  await page.goto('/')
  const example = page.locator('section[aria-labelledby="long-source-title"]')
  const copy = example.locator('[data-ui-copy-button]')
  await expect(copy).toBeVisible()
  await expect(page.locator('#long-source')).not.toHaveAttribute('open')
  await copy.click()
  const complete = await page.locator('html').getAttribute('data-copied')
  expect(complete?.split('\n')).toHaveLength(60)
  expect(complete).toContain('export const item59')
  await page.locator('html').evaluate(root => { root.dataset.copyDenied = 'true' })
  await copy.click()
  const recovery = page.getByRole('textbox', { name: 'Complete source for manual copying' })
  await expect(recovery).toHaveValue(complete ?? '')
  await page.locator('#long-source > summary').click()
  await expect(page.locator('#long-source-source pre span').first()).toBeVisible()
  await expect(example).toHaveCount(1)
})

test('share cancellation, errors, and successful completion preserve the fallback and focus', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: () => {
      const mode = document.documentElement.dataset.shareMode
      if (mode === 'success') return Promise.resolve()
      if (mode === 'failure') return Promise.reject(new Error('Unavailable'))
      return Promise.reject(new DOMException('Canceled', 'AbortError'))
    } })
  })
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Share this page', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Share this page' })
  const native = dialog.getByRole('button', { name: 'Share using this device' })
  await native.click()
  await expect(dialog.getByRole('status')).toHaveText('Sharing canceled.')
  await expect(native).toBeFocused()
  await expect(dialog.getByRole('link', { name: 'Email the guide' })).toHaveAttribute('rel', 'noopener noreferrer')
  await page.locator('html').evaluate(root => { root.dataset.shareMode = 'failure' })
  await native.click()
  await expect(dialog.getByRole('status')).toContainText('Choose a destination or copy the link.')
  await page.locator('html').evaluate(root => { root.dataset.shareMode = 'success' })
  await native.click()
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('navigation ignores a pending native share result', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: () => new Promise<void>(resolve => {
      document.addEventListener('test:share-finish', () => { resolve() }, { once: true })
    }) })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Share this page', exact: true }).click()
  const native = page.getByRole('button', { name: 'Share using this device' })
  await native.click()
  await expect(native).toBeDisabled()
  await page.evaluate(() => { document.dispatchEvent(new Event('fixture:navigate')) })
  await expect(page.getByRole('heading', { name: 'Another page' })).toBeVisible()
  await page.evaluate(() => { document.dispatchEvent(new Event('test:share-finish')) })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goBack()
  await expect(page.locator('#long-source')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Share this page', exact: true })).toBeVisible()
})

test('unsupported native share and denied clipboard retain the manual URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: () => Promise.reject(new Error('Denied'))
    } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Share this page', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Share this page' })
  await expect(dialog.getByRole('button', { name: 'Share using this device' })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Copy link' }).click()
  await expect(dialog.getByRole('textbox', { name: 'Link for manual copying' })).toHaveValue('https://example.com/guide/')
})

test('without scripts the source, destinations, file, and transcript remain usable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 568 } })
  try {
    const page = await context.newPage()
    await page.goto('/')
    await page.locator('#long-source > summary').click()
    await expect(page.locator('#long-source-source pre')).toContainText('export const item59')
    await page.locator('lumen-recipe-share summary').click()
    await expect(page.getByRole('textbox', { name: 'Link to share' })).toHaveValue('https://example.com/guide/')
    await expect(page.getByRole('link', { name: 'Email the guide' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Watch film' })).toHaveAttribute('href', '/film.mp4')
    await page.locator('[data-video-transcript] summary').click()
    await expect(page.getByText('A complete transcript of the product film.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy complete example' })).toHaveCount(0)
  } finally {
    await context.close()
  }
})

for (const width of [320, 1280]) {
  test('workflows fit enlarged text, RTL, and reduced motion at ' + String(width), async ({ page }) => {
    await page.setViewportSize({ width, height: 720 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.locator('html').evaluate(root => {
      root.style.fontSize = '200%'
      root.dir = 'rtl'
      root.dataset.theme = 'lumen-dark'
    })
    await page.locator('#long-source > summary').click()
    expect(await page.locator('html').evaluate(root => root.scrollWidth)).toBeLessThanOrEqual(width)
    await page.getByRole('button', { name: 'Share this page', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Share this page' })
    await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeInViewport()
    await expect(dialog.getByRole('textbox', { name: 'Link to share' })).toBeInViewport()
    expect(await dialog.evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(width)
  })
}

test('workflow interactions request their own feature modules', async ({ page }, testInfo) => {
  const scripts: string[] = []
  page.on('request', request => {
    if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname)
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Share this page', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Share this page' })).toBeVisible()
  await testInfo.attach('requested-script-paths', {
    body: JSON.stringify(scripts, null, 2),
    contentType: 'application/json'
  })
  expect(scripts.filter(path => /phone-input|world-map|kanban|rich-text|schedule/.test(path))).toEqual([])
})

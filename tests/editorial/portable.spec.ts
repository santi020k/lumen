import { expect, test } from '@playwright/test'

for (const target of ['react', 'elements']) {
  test(`${target} search rejects stale responses and cancels across dismissal and remount`, async ({ page }) => {
    let releaseSlow: (() => Promise<void>) | undefined
    const releasePending = async () => {
      if (!releaseSlow) throw new Error('Missing delayed response')
      await releaseSlow()
    }
    await page.route('**/api/search?*', async route => {
      const query = new URL(route.request().url()).searchParams.get('q') ?? ''
      const body = JSON.stringify([{ href: `#${query}`, title: `${query} result` }])
      if (query === 'slow') {
        await new Promise<void>(resolve => {
          releaseSlow = async () => { await route.fulfill({ body, contentType: 'application/json' }); resolve() }
        })
      } else await route.fulfill({ body, contentType: 'application/json' })
    })
    await page.goto(`/${target}.html`)
    const open = page.getByRole('button', { name: 'Search', exact: true })
    await open.click()
    const dialog = page.getByRole('dialog', { name: 'Search this site' })
    const field = dialog.getByRole('searchbox')
    await field.fill('slow')
    await expect.poll(() => Boolean(releaseSlow)).toBe(true)
    await field.fill('fresh')
    await expect(dialog.getByRole('link', { name: 'fresh result' })).toBeVisible()
    await releasePending()
    releaseSlow = undefined
    await expect(dialog.getByRole('link', { name: 'slow result' })).toHaveCount(0)
    await field.focus()
    await field.press('ArrowDown')
    await expect(dialog.getByRole('link', { name: 'fresh result' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(open).toBeFocused()
    await expect.poll(async () => Number(await page.locator('[data-aborts]').textContent())).toBeGreaterThan(0)
    await open.click()
    await field.fill('slow')
    await expect(dialog.getByRole('status')).toHaveText('Searching…')
    await expect.poll(() => Boolean(releaseSlow)).toBe(true)
    await page.evaluate(() => { document.querySelector<HTMLButtonElement>('[data-remount]')?.click() })
    await expect(dialog).toBeHidden()
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('link', { name: 'slow result' })).toHaveCount(0)
    await releasePending()
    await expect(page.getByRole('dialog').getByRole('link', { name: 'slow result' })).toHaveCount(0)
  })

  test(`${target} search offers failure recovery, empty states, and safe destinations`, async ({ page }) => {
    let fail = true
    await page.route('**/api/search?*', async route => {
      const query = new URL(route.request().url()).searchParams.get('q') ?? ''
      if (query === 'failure' && fail) await route.fulfill({ status: 503 })
      else await route.fulfill({ json: query === 'empty' ? [] : [
        { href: 'javascript:alert(1)', title: 'Unsafe result' },
        { href: '#first-chapter', title: 'Safe result' }
      ] })
    })
    await page.goto(`/${target}.html`)
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('searchbox').fill('failure')
    await expect(dialog.getByRole('status')).toHaveText('Search could not be loaded.')
    fail = false
    await dialog.getByRole('button', { name: 'Retry search' }).click()
    await expect(dialog.getByRole('link', { name: 'Safe result' })).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Unsafe result' })).toHaveCount(0)
    await dialog.getByRole('searchbox').fill('empty')
    await expect(dialog.getByRole('status')).toHaveText('No results found.')
  })

  test(`${target} viewer defers media and retries failures`, async ({ page }, testInfo) => {
    let requests = 0
    let fail = true
    await page.route('**/preview.svg', async route => {
      requests += 1
      if (fail) await route.abort()
      else await route.continue()
    })
    await page.goto(`/${target}.html`)
    await expect(page.getByRole('button', { name: 'View larger image' })).toBeVisible()
    expect(requests).toBe(0)
    await page.getByRole('button', { name: 'View larger image' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('status').first()).toHaveText('The image could not be loaded.')
    const failedImage = await dialog.locator('img').elementHandle()
    fail = false
    await dialog.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(dialog.getByRole('img')).toBeVisible()
    expect(await dialog.getByRole('img').evaluate(image => {
      const stage = image.closest('[data-ui-media-viewport-stage]')
      if (!stage) throw new Error('Missing image viewport')
      const bounds = image.getBoundingClientRect()
      const viewport = stage.getBoundingClientRect()
      return bounds.top >= viewport.top - 1 && bounds.bottom <= viewport.bottom + 1
    })).toBe(true)
    await failedImage.evaluate(image => image.dispatchEvent(new Event('error')))
    await expect(dialog.getByRole('status').first()).toHaveText('')
    await expect(dialog.getByRole('link', { name: 'Open original image' })).toHaveAttribute('href', '/preview.svg')
    await dialog.screenshot({ path: testInfo.outputPath(`${target}-viewer-desktop.png`), animations: 'disabled' })
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'View larger image' })).toBeFocused()
  })

  for (const width of [320, 1440]) {
    test(`${target} reading fits ${width}px with enlarged text and follows its content`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 700 })
      await page.goto(`/${target}.html`)
      const skip = page.getByRole('link', { name: 'Skip to article text' })
      await skip.focus()
      await expect(skip).toBeInViewport()
      await skip.press('Enter')
      await expect(page.locator('article.article-text')).toBeFocused()
      await page.locator('.article-reading').scrollIntoViewIfNeeded()
      if (width === 320) {
        const summary = page.locator('.chapter-disclosure summary')
        const chapter = page.locator('.chapter-disclosure').getByRole('link', { name: 'Second chapter' })

        await summary.press('Enter')
        await expect(summary).not.toHaveCSS('border-block-end-color', 'rgba(0, 0, 0, 0)')
        await expect.poll(() => chapter.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        await chapter.press('Enter')
      } else await page.locator('.chapter-rail').getByRole('link', { name: 'Second chapter' }).click()
      await expect(page.locator('#second-chapter')).toBeInViewport()
      const progress = page.getByRole('progressbar')
      await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
      await page.screenshot({ path: testInfo.outputPath(`${target}-${width}.png`) })
      await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; element.dir = 'rtl'; element.dataset.theme = 'lumen-dark' })
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      await page.getByRole('button', { name: 'Search', exact: true }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveJSProperty('open', true)
      expect(await dialog.evaluate(element => {
        const rect = element.getBoundingClientRect()
        return rect.left >= 0 && rect.right <= innerWidth && element.scrollWidth <= element.clientWidth
      })).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`${target}-${width}-dark-rtl.png`), animations: 'disabled' })
      await dialog.getByRole('button', { name: 'Close', exact: true }).click()
      await expect(dialog).toBeHidden()
    })
  }

  test(`${target} modal meets automated accessibility checks on a phone`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto(`/${target}.html?theme=dark`)
    await page.route('**/api/search?*', route => route.fulfill({ json: [{ href: '#first-chapter', title: 'Matching chapter' }] }))
    const darkInk = await page.locator('body').evaluate(element => {
      const probe = document.createElement('span')
      probe.style.color = 'hsl(var(--ink))'
      element.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    })
    await expect(page.locator('body')).toHaveCSS('color', darkInk)
    await page.addScriptTag({ path: 'packages/elements/node_modules/axe-core/axe.min.js' })
    const closed: unknown = await page.evaluate('axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')
    expect(closed).toEqual([])
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.getByRole('searchbox').fill('chapter')
    await expect(page.getByRole('link', { name: 'Matching chapter' })).toBeVisible()
    const expectedInk = await page.locator('body').evaluate(element => getComputedStyle(element).color)
    await expect(page.getByRole('dialog').getByRole('heading')).toHaveCSS('color', expectedInk)
    const expectedBrand = await page.locator('body').evaluate(element => {
      const probe = document.createElement('span')
      probe.style.color = 'hsl(var(--brand))'
      element.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    })
    if (target === 'react') await expect(page.getByRole('link', { name: 'Matching chapter' })).toHaveCSS('color', expectedBrand)
    const opened: unknown = await page.evaluate('axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')
    expect(opened).toEqual([])
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
    await page.getByRole('button', { name: 'View larger image' }).click()
    await expect(page.getByRole('dialog').getByRole('img')).toBeVisible()
    const viewer: unknown = await page.evaluate('axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')
    expect(viewer).toEqual([])
    await page.getByRole('dialog').screenshot({ path: testInfo.outputPath(`${target}-viewer-mobile.png`), animations: 'disabled' })
  })

  test(`${target} retains native reading and recovery destinations without JavaScript`, async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error('Missing configured base URL')
    const context = await browser.newContext({ javaScriptEnabled: false })
    try {
      const page = await context.newPage()
      await page.goto(`${baseURL}/${target}.html`)
      await expect(page.getByRole('link', { name: 'Search', exact: true })).toHaveAttribute('href', '/search/')
      await expect(page.getByRole('link', { name: 'View larger image' })).toHaveAttribute('href', '/preview.svg')
      await expect(page.getByRole('link', { name: 'Skip to article text' })).toBeAttached()
      await expect(page.locator('#first-chapter')).toBeVisible()
    } finally { await context.close() }
  })
}

test('Elements reconnects an existing search instance without duplicate request listeners', async ({ page }) => {
  let requests = 0
  await page.route('**/api/search?*', async route => {
    requests += 1
    await route.fulfill({ json: [{ href: '#first-chapter', title: 'Matching chapter' }] })
  })
  await page.goto('/elements.html')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await page.getByRole('searchbox').fill('one')
  await expect(page.getByRole('link', { name: 'Matching chapter' })).toBeVisible()
  expect(requests).toBe(1)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.evaluate(() => {
    const recipe = document.querySelector('lumen-recipe-elements-site-search')
    const parent = recipe?.parentElement
    if (!recipe || !parent) throw new Error('Missing search instance')
    recipe.remove()
    parent.prepend(recipe)
  })
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Matching chapter' })).toBeVisible()
  expect(requests).toBe(2)
  await page.getByRole('searchbox').fill('two')
  await expect(page.getByRole('link', { name: 'Matching chapter' })).toBeVisible()
  await expect.poll(() => requests).toBe(3)
})

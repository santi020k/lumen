import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark', 'santi020k-light', 'santi020k-dark']) {
    test(`editorial prose retains semantics at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/internal/editorial-prose')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      for (const adapter of ['astro', 'react', 'elements']) {
        const prose = page.locator(`#${adapter}-prose`)
        await expect(prose).toHaveClass(/ui-prose--editorial/)
        await expect(prose).toHaveAttribute('data-slot', 'prose')
        await expect(prose.getByRole('heading', { level: 2 })).toHaveText('Read what matters first')
        await expect(prose.locator('h2 em')).toHaveText('what matters')
        await expect(prose.locator('blockquote')).toHaveAttribute('cite', /build-an-editorial-article/)
        await expect(prose.locator('blockquote cite')).toHaveText('Example editorial notes')
        await expect(prose.getByRole('img', { name: 'Illustrated mountains reflected in a lake', exact: true })).toHaveAccessibleName('Illustrated mountains reflected in a lake')
        const figure = prose.locator(`#${adapter}-figure`)
        const image = figure.locator('img')
        await image.evaluate(async element => {
          if (element instanceof HTMLImageElement) await element.decode()
        })
        const caption = figure.locator('figcaption')
        const imageBox = await image.boundingBox()
        const captionBox = await caption.boundingBox()
        if (!imageBox || !captionBox) throw new Error('Expected visible figure and caption')
        expect(Math.abs(captionBox.y - imageBox.y - imageBox.height)).toBeLessThan(2)
        const code = prose.locator(`#${adapter}-code`)
        await expect(code).toHaveCSS('margin-block-start', '0px')
        await expect(code.locator('figcaption')).toHaveClass('ui-code__header')
        if (width === 1440) {
          const text = await prose.locator('section > p').first().boundingBox()
          const media = await figure.boundingBox()
          if (!text || !media) throw new Error('Expected reading measure')
          expect(text.width).toBeLessThan(media.width)
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }
}

for (const direction of ['ltr', 'rtl']) {
  test(`editorial prose reflows with enlarged text in ${direction}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.goto('/internal/editorial-prose')
    await page.evaluate(value => {
      document.documentElement.dir = value
      document.documentElement.style.fontSize = '200%'
    }, direction)
    for (const adapter of ['astro', 'react', 'elements']) {
      const prose = page.locator(`#${adapter}-prose`)
      await expect(prose.locator('blockquote')).toHaveCSS('border-inline-start-width', '2px')
      await expect(prose.locator('figcaption').first()).toBeVisible()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

test('Elements appearance changes preserve the authored tree and default prose', async ({ page }) => {
  await page.goto('/internal/editorial-prose')
  const prose = page.locator('#elements-prose')
  await expect(prose).toHaveClass(/ui-prose--editorial/)
  const heading = prose.locator('h2')
  await prose.evaluate(element => { element.setAttribute('appearance', 'default') })
  await expect(prose).not.toHaveClass(/ui-prose--editorial/)
  await expect(prose.locator('blockquote')).toHaveCSS('border-inline-start-width', '3px')
  await expect(heading).toHaveAttribute('id', 'elements-heading')
  await prose.evaluate(element => { element.setAttribute('appearance', 'editorial') })
  await expect(prose).toHaveClass(/ui-prose--editorial/)
  await expect(prose.locator('blockquote cite')).toHaveCount(1)
  await expect(page.locator('#default-prose')).not.toHaveClass(/ui-prose--editorial/)
})

test('native fragment links and print grouping survive editorial presentation', async ({ page }) => {
  await page.goto('/internal/editorial-prose')
  const prose = page.locator('#astro-prose')
  await prose.getByRole('link', { name: 'Read the context' }).click()
  await expect(page).toHaveURL(/#astro-details$/)
  await expect(prose.locator('#astro-details')).toHaveText('The original context')
  await page.emulateMedia({ media: 'print' })
  await expect(prose.locator('blockquote')).toHaveCSS('break-inside', 'avoid')
  await expect(prose.locator('#astro-figure')).toHaveCSS('break-inside', 'avoid')
})

test('the editorial article remains readable and printable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } })
  const page = await context.newPage()
  await page.goto('/guides/build-an-editorial-article')
  const prose = page.locator('.ui-prose--editorial')
  await expect(prose.locator('#content')).toBeVisible()
  await expect(prose.locator('#content > figure:not([data-slot]) > figcaption')).toContainText('keeps its caption and image together')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.chapter-disclosure')).toBeHidden()
  await expect(page.locator('.chapter-rail')).toBeHidden()
  await expect(prose).toBeVisible()
  await context.close()
})

test('the live article recipe omits navigation and progress in print', async ({ page }) => {
  await page.goto('/guides/build-an-editorial-article')
  const article = page.locator('#editorial-story')
  const progress = article.locator('.article-progress')
  await expect(progress).toHaveAttribute('data-ui-bound', 'true')
  await page.emulateMedia({ media: 'print' })
  await expect(progress).toBeHidden()
  await expect(page.locator('.chapter-rail')).toBeHidden()
  await expect(page.locator('.chapter-disclosure')).toBeHidden()
  await expect(page.locator('.article-reading')).toHaveCSS('display', 'block')
  await expect(article.locator('#content > figure:not([data-slot]) > figcaption')).toBeVisible()
})

for (const appearance of ['default', 'editorial']) {
  test(`public Image radius props survive ${appearance} prose and framed media`, async ({ page }) => {
    await page.goto('/internal/editorial-prose')
    for (const adapter of ['astro', 'react', 'elements', 'default']) {
      const prose = page.locator(`#${adapter === 'default' ? 'default' : adapter}-prose`)
      // Exercise both presentation classes without changing the authored media or their props.
      await prose.evaluate((element, value) => {
        element.classList.toggle('ui-prose--editorial', value === 'editorial')
      }, appearance)
      for (const radius of ['none', 'sm', 'md', 'lg', 'full']) {
        const reference = page.locator(`#reference-radius-${radius}`)
        const image = page.locator(`#${adapter}-radius-${radius}`)
        const expected = await reference.evaluate(element => getComputedStyle(element).borderRadius)
        await expect(image).toHaveCSS('border-radius', expected)
      }
    }
    await page.goto('/guides/build-an-editorial-article')
    const figure = page.locator('#content > figure:not([data-slot])')
    const image = figure.getByRole('img')
    for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
      await expect(image).toHaveCSS(`border-${corner}-radius`, '0px')
    }
    await expect(image).toHaveCSS('border-width', '0px')
    await expect(figure).toHaveCSS('overflow', 'hidden')
  })
}

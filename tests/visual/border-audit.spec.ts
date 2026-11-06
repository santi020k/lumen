import { readFile } from 'node:fs/promises'

import { expect, type Locator, type Page, test } from '@playwright/test'

const imageStyles = await readFile(new URL('../../packages/core/styles/parts/image.css', import.meta.url), 'utf8')

const componentIn = (page: Page, context: string, component: string): Locator =>
  component === 'map' ? page.locator(`#context-${context} [data-slot=world-map]`) : page.locator(`#${context}-${component}`)

const expectSameBorders = async (reference: Locator, nested: Locator): Promise<void> => {
  for (const property of ['border-width', 'border-radius', 'padding', 'overflow', 'margin']) {
    const expected = await reference.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)
    await expect(nested).toHaveCSS(property, expected)
  }
  for (const part of ['figcaption', 'img']) {
    const expected = reference.locator(part).first()
    const actual = nested.locator(part).first()
    if (await expected.count() === 0) continue
    for (const property of ['border-width', 'border-radius', 'padding']) {
      const value = await expected.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)
      await expect(actual).toHaveCSS(property, value)
    }
  }
}

const expectKeyboardFocus = async (page: Page, browserName: string, link: Locator): Promise<void> => {
  await link.focus()
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab')
  await expect(link).toBeFocused()
  await expect(link).toHaveCSS('outline-width', '2px')
}

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark', 'santi020k-light', 'santi020k-dark']) {
    test(`media frames own their corners at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/internal/border-audit')
      await expect(page.getByRole('heading', { level: 1, name: 'Border composition audit' })).toBeVisible()
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      await expect(page.locator('#elements-reading')).toHaveAttribute('data-slot', 'prose')
      await expect(page.locator('#elements-aspect')).toHaveClass(/ui-aspect-ratio/)
      // Consumers can load Image after composite styles through selective imports.
      await page.addStyleTag({ content: imageStyles })
      for (const adapter of ['astro', 'react', 'elements']) {
        for (const frame of ['aspect', 'cover', 'device', 'comparison', 'thumbnail', 'viewport']) {
          const root = page.locator(`#${adapter}-${frame}`)
          await expect(root).toBeVisible()
          const images = root.locator('img, .ui-image')
          expect(await images.count()).toBeGreaterThan(0)
          for (const image of await images.all()) await expect(image).toHaveCSS('border-radius', '0px')
        }
      }
      await expect(page.locator('#elements-reading')).toHaveCSS('display', 'block')
      await expect(page.locator('#elements-aspect')).toHaveCSS('display', 'block')
      await expect(page.locator('#elements-cover')).toHaveCSS('display', 'block')
      await expect(page.locator('#card-overflow')).toHaveCSS('overflow', 'visible')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }
}

for (const appearance of ['default', 'editorial']) {
  test(`component borders and focus survive ${appearance} prose`, async ({ browserName, page }) => {
    await page.goto('/internal/border-audit')
      await expect(page.getByRole('heading', { level: 1, name: 'Border composition audit' })).toBeVisible()
    for (const component of ['attachment', 'comparison', 'viewport', 'qr', 'chart', 'map', 'tabs', 'avatar', 'flag']) {
      await expectSameBorders(componentIn(page, 'standalone', component), componentIn(page, appearance, component))
    }
    for (const kind of ['link', 'text-link']) {
      const radius = await page.locator(`#standalone-${kind}`).evaluate(element => getComputedStyle(element).borderRadius)
      for (const context of ['standalone', appearance]) {
        const link = page.locator(`#${context}-${kind}`)
        await expectKeyboardFocus(page, browserName, link)
        await expect(link).toHaveCSS('border-radius', radius)
      }
    }
    await expectKeyboardFocus(page, browserName, page.locator('#card-focus'))
    await expectKeyboardFocus(page, browserName, page.locator(`#${appearance}-native-link`))

  })
}

for (const direction of ['ltr', 'rtl']) {
  test(`framed media reflows at 200% text size in ${direction}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.goto('/internal/border-audit')
    await expect(page.getByRole('heading', { level: 1, name: 'Border composition audit' })).toBeVisible()
    await page.evaluate(value => {
      document.documentElement.dir = value
      document.documentElement.style.fontSize = '200%'
    }, direction)
    for (const adapter of ['astro', 'react', 'elements']) {
      await expect(page.locator(`#${adapter}-aspect`)).toBeVisible()
      await expect(page.locator(`#${adapter}-aspect-image`)).toHaveCSS('border-radius', '0px')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

test('frame fit remains authoritative after later Image styles', async ({ page }) => {
  await page.goto('/internal/border-audit')
  await expect(page.getByRole('heading', { level: 1, name: 'Border composition audit' })).toBeVisible()
  await page.addStyleTag({ content: imageStyles })
  const images = page.locator('#comparison-contain img')
  await expect(images).toHaveCount(2)
  for (const image of await images.all()) {
    await expect(image).toHaveCSS('object-fit', 'contain')
    await expect(image).toHaveCSS('border-radius', '0px')
  }
})

test('grouped controls retain one outer border and visible focus', async ({ page }) => {
  await page.goto('/internal/border-audit')
  await expect(page.getByRole('heading', { level: 1, name: 'Border composition audit' })).toBeVisible()
  const inputStyles = await readFile(new URL('../../packages/core/styles/parts/input.css', import.meta.url), 'utf8')
  await page.addStyleTag({ content: inputStyles })
  const input = page.locator('#input-edge')
  await expect(input).toHaveCSS('border-width', '0px')
  await expect(input).toHaveCSS('border-radius', '0px')
  await expect(page.locator('#input-frame')).toHaveCSS('border-width', '1px')
  await input.focus()
  await expect(input).toBeFocused()
  const ring = await page.locator('#input-frame').evaluate(element => getComputedStyle(element).boxShadow)
  expect(ring).not.toBe('none')
  expect(ring).not.toContain('inset')
  await expect(page.locator('#audit-tabs [role=tablist]')).toHaveCSS('border-width', '1px')
  for (const tab of await page.locator('#audit-tabs [role=tab]').all()) await expect(tab).toHaveCSS('border-width', '0px')
  await expect(page.locator('#audit-table')).toHaveCSS('border-width', '1px')
  await expect(page.locator('#audit-table table')).toHaveCSS('border-width', '0px')
  for (const context of ['standalone', 'default', 'editorial']) {
    await expect(page.locator(`#${context}-tabs figure`)).toHaveCSS('border-width', '0px')
    await expect(page.locator(`#${context}-tabs figure`)).toHaveCSS('border-radius', '0px')
  }
})

test('standalone Image wrappers preserve the requested radius and fit', async ({ page }) => {
  await page.goto('/internal/border-audit')
  await expect(page.locator('#elements-standalone')).toHaveClass(/ui-image--radius-full/)
  const radius = await page.locator('#astro-standalone').evaluate(element => getComputedStyle(element).borderRadius)
  await expect(page.locator('#react-standalone')).toHaveCSS('border-radius', radius)
  const nativeImage = page.locator('#elements-standalone img')
  await expect(nativeImage).toHaveCSS('border-radius', radius)
  await expect(nativeImage).toHaveCSS('object-fit', 'contain')
})

test('picture media fills its aspect frame while preserving contain fit', async ({ page }) => {
  await page.goto('/internal/border-audit')
  await expect(page.getByRole('heading', { level: 1, name: 'Border composition audit' })).toBeVisible()
  await page.addStyleTag({ content: imageStyles })
  const frame = page.locator('#aspect-contain')
  const image = page.locator('#aspect-contain-image')
  await expect(image).toHaveCSS('object-fit', 'contain')
  await expect(image).toHaveCSS('border-radius', '0px')
  const frameBox = await frame.boundingBox()
  const imageBox = await image.boundingBox()
  if (!frameBox || !imageBox) throw new Error('Expected measurable picture media')
  expect(Math.abs(frameBox.width - imageBox.width)).toBeLessThan(1)
  expect(Math.abs(frameBox.height - imageBox.height)).toBeLessThan(1)
})

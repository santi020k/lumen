import { expect, test } from '@playwright/test'

test('the first keyboard stop skips the docs navigation', async ({ page, browserName }) => {
  await page.goto('/docs')
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')

  const shortcut = page.getByRole('link', { name: 'Skip to main content', exact: true })

  await expect(shortcut).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#docs-main-content')).toBeFocused()
  await expect(page).toHaveURL(/#docs-main-content$/u)
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  expect(await page.locator('#docs-main-content').evaluate(element =>
    element !== document.activeElement && element.contains(document.activeElement))).toBe(true)
})

test('the article shortcut stays visible with enlarged RTL text and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/guides/build-an-editorial-article')
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.style.fontSize = '200%'
  })

  const shortcut = page.locator('a.ui-skip-link[href="#editorial-story"]')

  await expect(shortcut).toHaveAccessibleName('Skip to article text')

  await shortcut.evaluate(element => {
    element.textContent = 'Skip to InternationalizationAndAccessibilityConfiguration'
  })
  await shortcut.focus()
  await expect(shortcut).toHaveCSS('transition-property', 'none')

  const box = await shortcut.boundingBox()

  if (!box) throw new Error('Expected the focused shortcut to have a box')

  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeCloseTo(296)
  expect(box.y).toBeGreaterThanOrEqual(0)

  expect(await shortcut.evaluate(element => {
    const bounds = element.getBoundingClientRect()

    return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
  })).toBe(true)

  await shortcut.press('Enter')
  await expect(page.locator('#editorial-story')).toBeFocused()
})

for (const width of [320, 1440]) {
  for (const direction of ['ltr', 'rtl']) {
    test(`selective SkipLink styles reflow at ${width}px in ${direction}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/internal/skip-link')
      await expect(page.locator('lumen-skip-link')).toHaveClass('ui-skip-link')
      await page.evaluate(({ direction, narrow }) => {
        document.documentElement.dir = direction
        if (narrow) document.documentElement.style.fontSize = '200%'
      }, { direction, narrow: width === 320 })

      for (const adapter of ['astro', 'react', 'elements']) {
        const root = page.locator(`#${adapter}-shortcut`)
        const link = adapter === 'elements' ? root.locator('a') : root

        await link.focus()
        await expect(link).toBeFocused()
        await expect(root).toHaveCSS('transition-property', 'none')
        expect(await root.evaluate(element => {
          const box = element.getBoundingClientRect()
          const offset = Number.parseFloat(getComputedStyle(element).insetInlineStart)
          const gap = document.documentElement.dir === 'rtl' ? innerWidth - box.right : box.left

          return box.top >= 0 && box.left >= 0 && box.right <= innerWidth &&
            Math.abs(gap - offset) < 1 && element.scrollWidth <= element.clientWidth
        })).toBe(true)
        await link.press('Enter')
        await expect(page.locator('#content')).toBeFocused()
      }
    })
  }
}

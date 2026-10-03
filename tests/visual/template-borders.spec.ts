import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark', 'santi020k-light', 'santi020k-dark']) {
    test(`template preview shares framed edges (${width}, ${theme})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/templates')
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)

      const previews = page.locator('.template-gallery-card__preview')
      await expect(previews).toHaveCount(5)

      for (const preview of await previews.all()) {
        await preview.scrollIntoViewIfNeeded()
        for (const frame of await preview.locator(
          '.template-gallery-card__desktop-preview, .template-gallery-card__mobile-preview'
        ).all()) {
          const image = frame.locator('img:visible')
          await expect(image).toHaveCount(1)
          await image.evaluate(element => {
            if (!(element instanceof HTMLImageElement)) throw new Error('Expected a preview image')
            return element.decode()
          })
          await expect(image).toHaveCSS('border-top-left-radius', '0px')
          await expect(image).toHaveCSS('border-top-right-radius', '0px')
          await expect(image).toHaveCSS('border-bottom-left-radius', '0px')
          await expect(image).toHaveCSS('border-bottom-right-radius', '0px')
          await expect(image).toHaveCSS('border-top-width', '0px')
          await expect(frame).toHaveCSS('overflow', 'hidden')
          const radius = await frame.evaluate(element =>
            Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
          )
          expect(radius).toBeGreaterThan(0)

          const header = frame.locator('.template-gallery-card__viewport-label')
          await expect(header).toHaveCSS('border-bottom-width', '1px')
          const headerBox = await header.boundingBox()
          const imageBox = await image.boundingBox()
          if (!headerBox || !imageBox) throw new Error('Preview header and image must have layout boxes')
          expect(Math.abs(imageBox.y - headerBox.y - headerBox.height)).toBeLessThan(1)
          expect(Math.abs(imageBox.x - headerBox.x)).toBeLessThan(1)
          expect(Math.abs(imageBox.width - headerBox.width)).toBeLessThan(1)
        }
        await preview.focus()
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab')
        await expect(preview).toBeFocused()
        await expect(preview).toHaveCSS('outline-width', '2px')
      }
    })
  }
}

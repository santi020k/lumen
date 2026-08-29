import { expect, test } from '@playwright/test'

test.describe('fixed accessibility primitives under host CSS', () => {
  for (const width of [390, 1280]) {
    test(`SkipLink preserves computed positioning at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ height: 800, width })
      await page.goto('/docs/components/skip-link')

      const preview = page.locator('.component-doc-preview')
      const skipLink = preview.locator('[data-slot="skip-link"]')

      await preview.evaluate(element => {
        element.insertAdjacentHTML('beforeend', [
          '<div class="ui-tvp" data-ui-toast-viewport data-placement="bottom-right">',
          '<div class="ui-toast">Saved</div></div>',
          '<dialog class="ui-dialog" open><p>Dialog content</p></dialog>'
        ].join(''))
      })

      await page.addStyleTag({ content: `
        .component-doc-preview > :not([data-slot="skip-link"]):not([data-ui-toast-viewport]):not(dialog) {
          position: relative;
        }
      ` })

      await expect(skipLink).toHaveCSS('position', 'fixed')
      await expect(skipLink).toHaveCSS('transform', /matrix\(1, 0, 0, 1, 0, -/u)
      await expect(preview.locator('[data-ui-toast-viewport]')).toHaveCSS('position', 'fixed')
      await expect(preview.locator('dialog')).toHaveCSS('position', 'fixed')
      await expect(preview.locator('dialog')).toHaveCSS(
        'transform', /matrix\(1, 0, 0, 1, -/u
      )

      await skipLink.focus()

      await expect(skipLink).toBeFocused()
      await expect(skipLink).toHaveCSS(
        'transform', /^(?:none|matrix\(1, 0, 0, 1, 0, 0\))$/u
      )
      await skipLink.press('Enter')
      await expect(page.locator('#skip-link-demo-target')).toBeFocused()
    })
  }
})

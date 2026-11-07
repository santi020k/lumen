import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`CopyButton manual recovery at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
      })
      await page.goto('/internal/copy-button-recovery')
      await expect(page.locator('#astro-example [data-ui-copy-button]')).toHaveAttribute('data-ui-copy-button-bound', 'true')
      await expect(page.locator('lumen-copy-button')).toHaveAttribute('role', 'button')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      for (const adapter of ['astro', 'react', 'elements']) {
        const root = page.locator(`#${adapter}-example`)
        const button = root.getByRole('button')
        await button.focus()
        await button.press('Enter')
        const field = root.getByRole('textbox', { name: 'Select the complete link' })
        await expect(field).toBeVisible()
        await expect(field).toHaveValue('https://lumen.santi020k.com/¡Hola!\nComplete link')
        await expect(field).toHaveAttribute('readonly', '')
        await expect(button).toBeFocused()
        await field.focus()
        expect(await field.evaluate(element => element instanceof HTMLTextAreaElement && element.selectionEnd === element.value.length)).toBe(true)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.emulateMedia({ media: 'print' })
      await expect(page.getByRole('textbox')).toHaveCount(0)
      await page.emulateMedia({ media: 'screen' })
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } })
      })
      for (const adapter of ['astro', 'react', 'elements']) {
        const root = page.locator(`#${adapter}-example`)
        await root.getByRole('button').click()
        await expect(root.locator('textarea')).toHaveCount(0)
      }
    })
  }
}

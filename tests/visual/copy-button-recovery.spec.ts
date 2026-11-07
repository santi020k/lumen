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

for (const width of [390, 1440]) {
  test(`the docs example offers the complete message at ${width}px without stretching actions`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    })
    await page.goto('/docs/components/copy-button')
    const button = page.locator('[data-copy-target="#share-message"]')
    await expect(button).toHaveAttribute('data-ui-copy-button-bound', 'true')
    const otherButton = page.locator('[data-copy-recovery-label="Select and copy the link"]')
    const actionHeight = await otherButton.evaluate(element => element.getBoundingClientRect().height)
    await button.focus()
    await button.press('Enter')
    const field = page.getByRole('textbox', { name: 'Select and copy the complete message' })
    await expect(field).toBeVisible()
    await expect(field).toHaveValue('Join the Lumen workspace at https://lumen.santi020k.com')
    await expect(button).toBeFocused()
    expect(await otherButton.evaluate(element => element.getBoundingClientRect().height)).toBe(actionHeight)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.emulateMedia({ media: 'print' })
    await expect(field).toBeHidden()
  })
}

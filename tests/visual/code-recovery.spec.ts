import { expect, test } from '@playwright/test'

for (const width of [320, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`manual code recovery stays usable at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
          writeText: () => {
            document.documentElement.dataset.copyAttempts = String(Number(document.documentElement.dataset.copyAttempts ?? 0) + 1)

            return Promise.reject(new Error('Clipboard denied for verification'))
          }
        } })
      })
      await page.goto('/internal/code-recovery')
      await page.evaluate(({ value, narrow }) => {
        document.documentElement.dataset.theme = value

        if (narrow) {
          document.documentElement.dir = 'rtl'

          document.documentElement.style.fontSize = '200%'
        }
      }, { value: theme, narrow: width === 320 })
      for (const adapter of ['astro', 'react', 'elements']) {
        const root = page.locator(`#${adapter}-code`)

        if (adapter === 'elements') await expect(root.locator('lumen-code').first()).toHaveCSS('display', 'block')

        const active = root.locator('[role="tabpanel"]:not([hidden])')
        const copy = active.locator('[data-ui-code-copy]')
        const attempts = await page.evaluate(() => Number(document.documentElement.dataset.copyAttempts ?? 0))

        await copy.focus()
        await copy.press('Enter')
        const recovery = root.getByRole('textbox', { name: 'Select the complete source' })
        await expect(recovery).toBeVisible()
        await expect(recovery).toHaveValue('pnpm add @santi020k/lumen-astro\n# Complete source: ¡Hola!')
        await expect(recovery).toHaveAttribute('readonly', '')
        await expect(copy).toBeFocused()
        expect(await page.evaluate(() => Number(document.documentElement.dataset.copyAttempts))).toBe(attempts + 1)
        await recovery.focus()
        expect(await recovery.evaluate(field => field instanceof HTMLTextAreaElement && field.selectionEnd === field.value.length)).toBe(true)
        expect(await recovery.evaluate(field => field.getBoundingClientRect().right <= innerWidth)).toBe(true)
        await root.getByRole('tab', { name: 'npm', exact: true }).click()
        await expect(root.locator('textarea')).toHaveCount(0)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } })
      })
      for (const adapter of ['astro', 'react', 'elements']) {
        const root = page.locator(`#${adapter}-code`)
        await root.locator('[role="tabpanel"]:not([hidden]) [data-ui-code-copy]').click()
        await expect(root.locator('[role="tabpanel"]:not([hidden]) [data-ui-code-copy]')).toHaveAttribute('data-state', 'copied')
        await expect(root.locator('textarea')).toHaveCount(0)
      }
    })
  }
}

test('docs expose a complete recovery value and omit recovery when printing', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  })
  await page.goto('/docs/components/code')
  const example = page.locator('[data-ui-code]').filter({ has: page.locator('[data-ui-code-copy]') }).first()
  await example.locator('[data-ui-code-copy]').click()
  const recovery = example.getByRole('textbox', { name: 'Select and copy the complete example' })
  await expect(recovery).toBeVisible()
  // The displayed example omits shared indentation; recovery retains the supplied source.
  await expect(recovery).toHaveValue('\n  const theme = "lumen";\n  const accent = "hsl(var(--accent))";\n')
  await page.emulateMedia({ media: 'print' })
  await expect(recovery).toBeHidden()
})

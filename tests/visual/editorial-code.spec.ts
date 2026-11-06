import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark', 'santi020k-light', 'santi020k-dark']) {
    test(`editorial code at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: (value: string) => {
            document.body.dataset.copiedSource = value
            return Promise.resolve()
          } }
        })
      })
      await page.goto('/internal/editorial-code')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      const code = page.locator('.docs-code-block').first()
      const summary = code.locator('summary')
      const preview = code.locator('.docs-code-block__preview')
      await expect(preview).toBeVisible()
      await expect(page.locator('.docs-code-block').nth(1).locator('details')).toHaveCount(0)
      await expect(page.locator('.docs-code-block').nth(2).locator('details')).toHaveCount(0)
      await expect(code.locator('details')).not.toHaveAttribute('open')
      const button = code.locator('[data-ui-code-copy]')
      await expect(button).toHaveAttribute('data-ui-copy-button-bound', 'true')
      const box = await button.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(44)
      expect(box?.height).toBeGreaterThanOrEqual(44)
      await button.click()
      await expect(button).toHaveAccessibleName('Copied')
      await expect(button).toContainText('Copied')
      const source = await button.getAttribute('data-copy-value')
      if (!source) throw new Error('Expected original source')
      await expect(page.locator('body')).toHaveAttribute('data-copied-source', source)
      expect(source.split('\n')).toHaveLength(30)
      await summary.focus()
      await page.keyboard.press('Enter')
      await expect(preview).toBeHidden()
      await expect(code.locator('details')).toHaveAttribute('open')
      const region = code.getByRole('region').first()
      await expect(region).toHaveAttribute('tabindex', '0')
      await expect(code.locator('[data-scroll-cue-message]:visible')).toHaveCount(1)
      await summary.press('Enter')
      await expect(preview).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.emulateMedia({ media: 'print' })
      await expect(preview).toBeHidden()
      await expect(code.locator('details').getByRole('region').first()).toBeVisible()
    })
  }
}

test('long examples remain expandable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/internal/editorial-code')
  const code = page.locator('.docs-code-block').first()
  await code.locator('summary').click()
  await expect(code.locator('details')).toHaveAttribute('open')
  await expect(code.locator('.docs-code-block__preview')).toBeHidden()
  await context.close()
})

test('clipboard failure leaves complete source available for manual copying', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('Permission denied')) }
    })
  })
  await page.goto('/internal/editorial-code')
  const code = page.locator('.docs-code-block').first()
  const button = code.locator('[data-ui-code-copy]')
  await expect(button).toHaveAttribute('data-ui-copy-button-bound', 'true')
  await button.click()
  await expect(button).toHaveAttribute('data-state', 'error')
  await expect(button).toContainText('Select and copy it manually.')
  await code.locator('summary').click()
  await expect(code.getByRole('region')).toContainText('const line30 =')
})

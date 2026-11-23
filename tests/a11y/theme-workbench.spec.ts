import { expect, test } from '@playwright/test'

test('font and elevation update independently and generated comparison follows the chosen hue', async ({ page }) => {
  await page.goto('/docs/theme-playground')
  await expect(page.locator('[data-theme-playground]')).toHaveAttribute('data-ui-theme-builder-bound', 'true')
  const preview = page.locator('#theme-playground-preview')
  const opposite = page.locator('[data-theme-comparison]')
  const output = page.locator('[data-ui-theme-output]')
  await page.locator('#theme-font-family').selectOption('serif', { force: true })
  await expect(preview).toHaveCSS('--ui-font', 'ui-serif, Georgia, serif')
  await expect(output).toHaveValue(/--ui-font: ui-serif, Georgia, serif;/u)
  await page.locator('#theme-elevation').selectOption('flat', { force: true })
  await expect(preview).toHaveCSS('--ui-shadow-md', 'none')
  await expect(opposite).toHaveCSS('--ui-shadow-md', 'none')
  await expect(opposite).toHaveCSS('--brand', /^264 /u)
  await page.locator('#theme-brand-hue-value').fill('180')
  await expect(opposite).toHaveCSS('--brand', /^180 /u)
  await page.locator('[data-ui-theme-scheme="dark"]').click()
  await expect(preview).toHaveCSS('color-scheme', 'dark')
  await expect(opposite).toHaveCSS('color-scheme', 'light')
  await expect(opposite).toHaveCSS('--brand', /^180 /u)
})

for (const preset of ['studio', 'custom']) {
  test(`shared ${preset} workbench reload preserves preview, export and controls`, async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: (value: string) => {
          document.documentElement.dataset.testCopiedLink = value
          return Promise.resolve()
        } }
      })
    })
    await page.goto('/docs/theme-playground')
    const builder = page.locator('[data-theme-playground]')
    await expect(builder).toHaveAttribute('data-ui-theme-builder-bound', 'true')
    await page.locator(`[data-ui-theme-preset="${preset}"]`).click()
    await page.locator('[data-ui-theme-scheme="dark"]').click()
    await page.locator('[data-ui-theme-mode="manual"]').click()
    await page.locator('#theme-primary-hex').fill('#287a5c')
    await page.locator('#theme-secondary-hex').fill('#864ab0')
    await page.locator('#theme-radius-scale').fill('1.6')
    await page.locator('#theme-spacing-scale').fill('1.2')
    await page.locator('#theme-font-family').selectOption('mono', { force: true })
    await page.locator('#theme-elevation').selectOption('flat', { force: true })
    await page.locator('#theme-density').selectOption('compact', { force: true })
    await page.locator('#theme-state').selectOption('readonly', { force: true })
    const output = await page.locator('[data-ui-theme-output]').inputValue()
    const oppositeStyle = await page.locator('[data-theme-comparison]').getAttribute('style')
    await page.locator('[data-theme-share]').click()
    const link = await page.locator('html').getAttribute('data-test-copied-link')
    if (!link) throw new Error('Share action did not produce a link')

    await page.goto(link)
    await expect(builder).toHaveAttribute('data-ui-theme-builder-bound', 'true')
    await expect(page.locator('[data-ui-theme-output]')).toHaveValue(output)
    await expect(page.locator(`[data-ui-theme-preset="${preset}"]`)).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-ui-theme-mode="manual"]')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#theme-font-family')).toHaveValue('mono')
    await expect(page.locator('#theme-density')).toHaveValue('compact')
    await expect(page.locator('#theme-state-field')).toHaveAttribute('readonly', '')
    await expect(page.locator('#theme-playground-preview')).toHaveAttribute('data-ui-density', 'compact')
    await expect(page.locator('[data-theme-comparison]')).toHaveAttribute('style', oppositeStyle ?? '')
  })
}

test('sharing provides an address-bar fallback when clipboard API is absent', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined })
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/docs/theme-playground')
  await expect(page.locator('[data-theme-playground]')).toHaveAttribute('data-ui-theme-builder-bound', 'true')
  await page.locator('[data-theme-share]').click()
  await expect(page.locator('[data-theme-share-status]')).toContainText('address bar')
  expect(new URL(page.url()).hash).toContain('theme-density=comfortable')
  expect(errors).toEqual([])
})

test('workbench controls reconnect after client navigation away and back', async ({ page }) => {
  await page.goto('/docs/theme-playground')
  await expect(page.locator('[data-theme-playground]')).toHaveAttribute('data-ui-theme-builder-bound', 'true')
  await page.locator('a[href="/docs/web/themes"]').first().click()
  await page.waitForURL(/\/docs\/web\/themes$/u)
  await page.goBack()
  await expect(page).toHaveURL(/\/docs\/theme-playground$/u)
  await expect(page.locator('[data-theme-playground]')).toHaveAttribute('data-ui-theme-builder-bound', 'true')
  await page.locator('#theme-density').selectOption('spacious', { force: true })
  await expect(page.locator('#theme-playground-preview')).toHaveAttribute('data-ui-density', 'spacious')
  await page.locator('#theme-state').selectOption('disabled', { force: true })
  await expect(page.locator('#theme-state-field')).toBeDisabled()
  await page.locator('#theme-brand-hue-value').fill('90')
  await expect(page.locator('[data-theme-comparison]')).toHaveCSS('--brand', /^90 /u)
})

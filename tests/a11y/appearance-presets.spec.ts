import { expect, test } from '@playwright/test'

test('appearance presets keep preview, dimensions and exports in sync', async ({ page }) => {
  await page.goto('/docs/theme-playground')
  const builder = page.locator('[data-theme-playground]')
  const preview = page.locator('#theme-playground-preview')
  const output = builder.locator('[data-ui-theme-output]')
  await expect(builder).toHaveAttribute('data-ui-theme-builder-bound', 'true')
  const originalPageBrand = await page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--brand'))
  const studio = builder.locator('[data-ui-theme-preset="studio"]')
  await studio.focus()
  await page.keyboard.press('Enter')
  await expect(studio).toHaveAttribute('aria-pressed', 'true')
  await expect(output).toHaveValue(/--brand: 0 0% 9%;/)
  await builder.locator('[data-ui-theme-radius-scale]').fill('2')
  await builder.locator('[data-ui-theme-spacing-scale]').fill('1.5')
  await builder.locator('[data-ui-theme-border-width]').fill('0')
  await expect(output).toHaveValue(/--ui-radius: 0.75rem;/)
  await expect(output).toHaveValue(/--ui-space-lg: 1.5rem;/)
  await expect(output).toHaveValue(/--ui-border-width: 0px;/)
  await expect(preview).toHaveCSS('--ui-radius', '0.75rem')
  await builder.locator('[data-ui-theme-scheme="dark"]').click()
  await expect(output).toHaveValue(/--canvas: 0 0% 7%;/)
  await builder.locator('[data-ui-theme-preset="glass"]').click()
  await expect(output).toHaveValue(/--glass-blur: 22px;/)
  await builder.locator('[data-ui-theme-preset="custom"]').click()
  await expect(output).toHaveValue(/--brand: 264 /)
  expect(await page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--brand'))).toBe(originalPageBrand)
})

test('scoped CSS presets reset palettes and remain opaque without explicit glass', async ({ page }) => {
  await page.goto('/docs/theme-playground')
  await page.evaluate(() => {
    const parent = document.createElement('section')
    parent.id = 'scoped-preset-test'
    parent.dataset.lumenPreset = 'studio'
    parent.dataset.lumenScheme = 'dark'
    const child = document.createElement('section')
    child.dataset.lumenPreset = 'default'
    child.dataset.lumenScheme = 'light'
    parent.append(child)
    document.body.append(parent)
  })
  const parent = page.locator('#scoped-preset-test')
  await expect(parent).toHaveCSS('--brand', '0 0% 96%')
  await expect(parent).toHaveCSS('--ui-shadow-md', 'none')
  const child = parent.locator('[data-lumen-preset="default"]')
  await expect(child).toHaveCSS('--brand', '201 96% 32%')
  expect(await child.evaluate(element => getComputedStyle(element).getPropertyValue('--ui-shadow-md'))).not.toBe('none')
})

test('Studio preview stays within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/theme-playground')
  await page.locator('[data-ui-theme-preset="studio"]').click()
  const dimensions = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1)
  await expect(page.locator('#studio-reference-title')).toBeVisible()
})

import { expect, test } from '@playwright/test'

test('header theme select supports keyboard selection, dismissal, persistence and navigation', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('lumen-theme')) localStorage.setItem('lumen-theme', 'santi020k-dark')
  })
  await page.goto('/community')
  const theme = page.getByRole('combobox', { name: 'Theme family' })
  const options = page.getByRole('listbox', { name: 'Theme family' })

  await expect(theme).toHaveText('Santi020k')
  await theme.press('ArrowDown')
  await expect(options).toBeVisible()
  await expect(options.getByRole('option', { name: 'Santi020k' })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Home')
  await expect(options.getByRole('option', { name: 'Lumen', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(theme).toBeFocused()
  await expect(theme).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-dark')

  await theme.press('ArrowDown')
  await page.keyboard.press('Home')
  await page.keyboard.press('Enter')
  await expect(theme).toHaveText('Lumen')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lumen-dark')
  await page.locator('.docs-theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lumen-light')
  await page.reload()
  await expect(theme).toHaveText('Lumen')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lumen-light')

  await theme.click()
  await options.getByRole('option', { name: 'Santi020k' }).click()
  await page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Guides', exact: true }).click()
  await expect(page).toHaveURL(/\/guides$/)
  await expect(theme).toHaveText('Santi020k')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
  await theme.click()
  await expect(options.getByRole('option', { name: 'Santi020k' })).toHaveAttribute('aria-selected', 'true')
})

for (const themeName of ['lumen-light', 'lumen-dark', 'santi020k-light', 'santi020k-dark']) {
  for (const width of [320, 390, 1440]) {
    test(`header theme menu remains visible and usable at ${width}px in ${themeName}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(theme => { localStorage.setItem('lumen-theme', theme) }, themeName)
      await page.goto('/community')
      await page.getByRole('combobox', { name: 'Theme family' }).click()
      const options = page.getByRole('listbox', { name: 'Theme family' })
      await expect(options).toBeVisible()
      await expect(options).toHaveCSS('transform', 'none')
      await expect(options).toHaveCSS('opacity', '1')
      const bounds = await options.boundingBox()
      if (!bounds) throw new Error('Expected a visible theme menu')
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
      for (const option of await options.getByRole('option').all()) {
        await expect(option).toBeInViewport()
        const optionBounds = await option.boundingBox()
        expect(optionBounds?.height).toBeGreaterThanOrEqual(44)
      }
      await expect(page.locator('html')).toHaveAttribute('data-theme', themeName)
      await page.screenshot({ path: testInfo.outputPath(`theme-menu-${themeName}-${width}.png`) })
      await page.screenshot({
        path: testInfo.outputPath(`theme-menu-detail-${themeName}-${width}.png`),
        clip: { x: Math.max(0, width - 660), y: 0, width: Math.min(width, 660), height: 220 }
      })
      await options.getByRole('option', { name: 'Lumen', exact: true }).click()
      await expect(options).toBeHidden()
    })
  }
}

test('header offers a native theme selector when JavaScript is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/community')
  const theme = page.getByRole('combobox', { name: 'Theme family' })
  await expect(theme).toHaveJSProperty('tagName', 'SELECT')
  await expect(theme).toBeVisible()
  await theme.selectOption('santi020k')
  await expect(theme).toHaveValue('santi020k')
  await context.close()
})

test('theme controls remain usable when preference storage is denied', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get: () => { throw new DOMException('Storage blocked', 'SecurityError') }
    })
  })
  await page.goto('/community')
  const theme = page.getByRole('combobox', { name: 'Theme family' })
  await theme.click()
  await page.getByRole('option', { name: 'Santi020k' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
  await page.locator('.docs-theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-dark')
  await expect(theme).toHaveText('Santi020k')
  await page.locator('.docs-theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
})

test('a failed preference write does not restore a stale family during toggles or navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem('lumen-theme', 'santi020k-dark')
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError') }
  })
  await page.goto('/community')
  const theme = page.getByRole('combobox', { name: 'Theme family' })
  await expect(theme).toHaveText('Santi020k')
  await theme.click()
  await page.getByRole('option', { name: 'Lumen', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lumen-dark')
  await page.locator('.docs-theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lumen-light')
  await page.locator('.docs-theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lumen-dark')
  await page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Guides', exact: true }).click()
  await expect(page).toHaveURL(/\/guides$/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lumen-dark')
  await expect(theme).toHaveText('Lumen')
})

test('component preview changes and persists the site-wide theme', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('lumen-theme')) {
      window.localStorage.setItem('lumen-theme', 'santi020k-dark')
    }
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/components/theme-toggle')

  const previewToggle = page.locator('.component-doc-preview [data-ui-theme-toggle]')

  await expect(previewToggle).toHaveCount(1)
  await expect(previewToggle).toHaveJSProperty('tagName', 'BUTTON')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-dark')
  await expect(previewToggle.locator('.ui-theme-toggle__moon')).toHaveCSS('opacity', '1')

  await previewToggle.click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
  await expect(previewToggle).toHaveAttribute('aria-label', 'Switch to dark mode')
  await expect(previewToggle.locator('.ui-theme-toggle__sun')).toHaveCSS('opacity', '1')

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'santi020k-light')
})

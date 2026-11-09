import { expect, test } from '@playwright/test'

test('starter keeps appearance across templates and supports keyboard theme selection', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/starters/astro')
  await expect(page.locator('#starter-theme-trigger')).toBeVisible()
  await page.locator('#starter-theme-trigger').focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-lumen-preset', 'example-harbor')
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('navigation', { name: 'Template previews' }).getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-lumen-preset', 'example-harbor')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'lumen-dark')
  await expect(page.locator('#starter-theme-trigger')).toContainText('Harbor')
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toHaveAttribute('aria-pressed', 'true')
})

test('starter cart restores quantities and totals and returns to an empty state', async ({ page }) => {
  await page.goto('/starters/astro/ecommerce')
  await expect(page.getByRole('button', { name: 'Preview checkout' })).toBeDisabled()
  await page.getByRole('button', { name: 'Add to bag' }).first().click()
  await page.getByRole('button', { name: 'Add to bag' }).first().click()
  await expect(page.locator('[data-cart-total]')).toContainText('$178.00')
  await page.reload()
  await expect(page.locator('[data-cart-total]')).toContainText('$178.00')
  await page.getByRole('button', { name: 'Preview checkout' }).click()
  await expect(page.locator('[data-cart-status]')).toContainText('No order has been placed')
  await page.locator('[data-remove-product]').first().click()
  await expect(page.locator('[data-cart-total]')).toContainText('$0.00')
  await expect(page.locator('[data-cart-empty]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Preview checkout' })).toBeDisabled()
})

test('starter cart ignores invalid stored quantities and bounds additions', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lumen-starter-cart', JSON.stringify({ arc: 99, form: -1, column: 100, still: '2' }))
  })
  await page.goto('/starters/astro/ecommerce')
  await expect(page.locator('[data-cart-row]:visible')).toHaveCount(1)
  await expect(page.locator('[data-cart-total]')).toContainText('$8,811.00')
  await page.getByRole('button', { name: 'Add to bag' }).first().click()
  await expect(page.locator('[data-cart-status]')).toContainText('up to 99')
  await expect(page.locator('[data-cart-total]')).toContainText('$8,811.00')
})

test('starter cart recovers from malformed storage', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lumen-starter-cart', 'invalid JSON')
  })
  await page.goto('/starters/astro/ecommerce')
  await expect(page.locator('[data-cart-empty]')).toBeVisible()
  await page.getByRole('button', { name: 'Add to bag' }).first().click()
  await expect(page.locator('[data-cart-total]')).toContainText('$89.00')
})

test('dashboard periods and portfolio categories update the visible content', async ({ page }) => {
  await page.goto('/starters/astro/dashboard')
  await page.locator('#starter-period-trigger').click()
  await page.getByRole('option', { name: 'Last 7 days', exact: true }).click()
  await expect(page.locator('[data-period-panel="7"]')).toBeVisible()
  await expect(page.locator('[data-period-panel="30"]')).toBeHidden()
  await expect(page.locator('[data-period-panel="7"]')).toContainText('$4,820')
  await page.locator('#starter-order-status-trigger').click()
  await page.getByRole('option', { name: 'Shipped', exact: true }).click()
  await expect(page.locator('[data-order-status]:visible')).toHaveCount(1)
  await expect(page.locator('[data-order-status="Shipped"]')).toBeVisible()
  await page.getByRole('navigation', { name: 'Template previews' }).getByRole('link', { name: 'Portfolio' }).click()
  await page.getByRole('button', { name: 'Product', exact: true }).click()
  await expect(page.locator('[data-project-category]:visible')).toHaveCount(2)
  await expect(page.locator('[data-project-status]')).toContainText('Showing 2 product')
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.locator('[data-project-category]:visible')).toHaveCount(4)
})

for (const width of [390, 1440]) {
  test(`all starter templates fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['', '/ecommerce', '/dashboard', '/portfolio']) {
      await page.goto(`/starters/astro${route}`)
      await expect(page.locator('main h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
  })
}

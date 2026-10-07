import { expect, test } from '@playwright/test'

test('Pagination preserves a consumer accessible name', async ({ page }) => {
  await page.goto('/docs/components/pagination')
  const navigation = page.getByRole('navigation', { name: 'Pagination with disabled previous state', exact: true })
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole('button', { name: 'Previous page' })).toBeDisabled()
})

test('an Icon accepts an explicit aria-label without being hidden', async ({ page }) => {
  await page.goto('/docs/components/icon')
  const icon = page.getByRole('img', { name: 'Notifications', exact: true })
  await expect(icon).toBeVisible()
  await expect(icon).not.toHaveAttribute('aria-hidden', 'true')
})

import { expect, test } from '@playwright/test'

test('React host renders and updates real framework primitives', async ({ page }) => {
  await page.goto('/visual/react')

  const host = page.locator('[data-framework="react"]')

  await expect(host.getByRole('heading', { name: 'Real React rendering' })).toBeVisible()
  await expect(host).toHaveScreenshot('react-visual-host.png', { animations: 'disabled' })

  await host.getByRole('button', { name: 'Advance release' }).click()
  await expect(host.getByText('76%')).toBeVisible()

  await host.getByRole('tab', { name: 'Notes' }).click()
  await expect(host.getByText(/Tabs, calendar navigation/)).toBeVisible()
})

test('Elements host registers and updates real custom elements', async ({ page }) => {
  await page.goto('/visual/elements')

  const host = page.locator('[data-framework="elements"]')
  const advance = host.locator('lumen-button[data-ready="true"]')

  await expect(host.getByRole('heading', { name: 'Real Web Component rendering' })).toBeVisible()
  await expect(advance).toBeVisible()
  await expect(host).toHaveScreenshot('elements-visual-host.png', { animations: 'disabled' })

  await advance.click()
  await expect(host.getByText('79%')).toBeVisible()

  await host.getByRole('tab', { name: 'Notes' }).click()
  await expect(host.getByText(/registered Web Component adapter/)).toBeVisible()
})

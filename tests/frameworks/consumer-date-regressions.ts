import { expect, test } from '@playwright/test'

test('React DatePicker opens on a newly loaded value and still permits month navigation', async ({ page }) => {
  await page.goto('/visual/consumer-date')
  await page.getByRole('button', { name: 'Load saved appointment', exact: true }).click()
  await page.getByRole('button', { name: 'Saved appointment', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Choose date', exact: true })
  await expect(dialog.locator('[data-ui-calendar-label]')).toHaveText('March 2024')
  await expect(dialog.locator('[data-date="2024-03-12"]')).toBeFocused()
  await dialog.getByRole('button', { name: 'Next month', exact: true }).click()
  await expect(dialog.locator('[data-ui-calendar-label]')).toHaveText('April 2024')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('React DatePicker clears generated validation feedback after a valid controlled update', async ({ page }) => {
  await page.goto('/visual/consumer-date')
  const trigger = page.getByRole('button', { name: 'Required date', exact: true })
  await page.getByRole('button', { name: 'Check required date', exact: true }).click()
  await expect(trigger).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Fill valid date', exact: true }).click()
  await expect(trigger).not.toHaveAttribute('aria-invalid', 'true')
})

test('React DatePicker mirrors consumer validation feedback without dropping its description', async ({ page }) => {
  await page.goto('/visual/consumer-date')
  const trigger = page.getByRole('button', { name: 'Required date', exact: true })
  await page.getByRole('button', { name: 'Fill valid date', exact: true }).click()
  await page.getByRole('button', { name: 'Set application error', exact: true }).click()
  await expect(trigger).toHaveAttribute('aria-invalid', 'grammar')
  await expect(trigger).toHaveAttribute('aria-describedby', 'date-feedback')
  await expect(trigger).toHaveAttribute('aria-errormessage', 'date-error')
  await page.getByRole('button', { name: 'Clear application error', exact: true }).click()
  await expect(trigger).not.toHaveAttribute('aria-invalid')
})

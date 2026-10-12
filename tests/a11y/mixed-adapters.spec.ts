import { expect, test } from '@playwright/test'

for (const inputMethod of ['fill', 'typing']) test(`Astro enhancement preserves a React island with ${inputMethod} before and after hydration`, async ({ page }) => {
  const errors: string[] = []

  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/internal/mixed-adapters')
  await expect(page.locator('#neighbor-date')).toHaveAttribute('data-ui-date-picker-trigger')

  const island = page.locator('#react-island')
  const trigger = island.getByRole('button', { name: 'Island appointment', exact: true })

  await expect(island.locator('[data-react-status]')).toHaveText('React server rendered')
  await expect(trigger).toHaveAttribute('id', 'island-date')
  await expect(island.locator('[data-ui-date-picker-native]')).toHaveAttribute('id', 'island-date-native')
  await expect(island.locator('#island-calendar [data-date="2026-09-10"]')).toHaveAttribute('aria-selected', 'true')
  await expect(island.locator('[data-ui-input-otp-char]')).toHaveText(['1', '2', '3', '4', '5', '6'])

  await page.getByRole('button', { name: 'Hydrate React island', exact: true }).click()
  await expect(island.locator('[data-react-status]')).toHaveText('React hydrated')
  await island.getByRole('button', { name: 'Load island date', exact: true }).click()
  await trigger.click()

  const dialog = island.getByRole('dialog', { name: 'Choose date', exact: true })

  await expect(dialog.locator('[data-ui-calendar-label]')).toHaveText('March 2024')
  await dialog.locator('[data-date="2024-03-13"]').click()
  await expect(island.locator('[data-island-date]')).toHaveText('2024-03-13')
  await island.locator('#island-calendar [data-date="2026-09-11"]').click()
  await expect(island.locator('[data-island-day]')).toHaveText('2026-09-11')
  expect(errors).toEqual([])
  const code = island.getByRole('textbox', { name: 'Island verification code', exact: true })

  if (inputMethod === 'fill') await code.fill('654321')
  else {
    await code.press('ControlOrMeta+A')
    await code.pressSequentially('654321')
  }
  await expect(island.locator('[data-island-code]')).toHaveText('654321')
  await expect(island.locator('[data-ui-input-otp-char]')).toHaveText(['6', '5', '4', '3', '2', '1'])
  expect(errors).toEqual([])
})

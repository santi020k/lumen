import { expect, test } from '@playwright/test'

for (const order of ['React first', 'Elements first']) {
  test(`mixed adapter DatePicker preserves React ownership with ${order}`, async ({ page }) => {
    await page.goto('/visual/mixed-adapters')

    if (order === 'Elements first') await page.getByRole('button', { name: 'Toggle React picker', exact: true }).click()

    await page.getByRole('button', { name: 'Register Elements', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Elements ready')

    if (order === 'Elements first') await page.getByRole('button', { name: 'Toggle React picker', exact: true }).click()

    const picker = page.locator('[data-mixed-react]')
    const trigger = picker.getByRole('button', { name: 'React appointment', exact: true })

    await expect(trigger).toHaveAttribute('id', 'mixed-date')
    await expect(picker.locator('[data-ui-date-picker-native]')).toHaveAttribute('id', 'mixed-date-native')
    await page.getByRole('button', { name: 'Load saved date', exact: true }).click()
    await trigger.click()

    const dialog = picker.getByRole('dialog', { name: 'Choose date', exact: true })

    await expect(dialog.locator('[data-ui-calendar-label]')).toHaveText('March 2024')
    await dialog.locator('[data-date="2024-03-13"]').click()
    await expect(page.locator('[data-selected-date]')).toHaveText('2024-03-13')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })
}

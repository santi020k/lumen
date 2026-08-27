import { expect, test } from '@playwright/test'

const adapters = [
  { label: 'React', path: '/visual/react' },
  { label: 'Elements', path: '/visual/elements' }
] as const

for (const adapter of adapters) {
  test.describe(`${adapter.label} shared behavior contracts`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(adapter.path)
      await expect(page.locator(`[data-framework="${adapter.label.toLowerCase()}"]`))
        .toBeVisible()

      if (adapter.label === 'Elements') {
        await expect(page.locator('lumen-button[data-ready="true"]')).toBeVisible()
      }
    })

    test('updates progress state through the adapter event boundary', async ({ page }) => {
      const progress = page.getByRole('progressbar', { name: /release readiness/i })
      const initialValue = Number(await progress.getAttribute('aria-valuenow'))

      await page.getByRole('button', { name: /advance/i }).click()

      await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow')))
        .toBeGreaterThan(initialValue)
    })

    test('switches tabs with the shared keyboard contract', async ({ page }) => {
      const packages = page.getByRole('tab', { name: 'Packages' })
      const notes = page.getByRole('tab', { name: 'Notes' })

      await packages.focus()
      await packages.press('ArrowRight')

      await expect(notes).toBeFocused()
      await expect(notes).toHaveAttribute('aria-selected', 'true')
      await expect(page.getByRole('tabpanel', { name: 'Notes' })).toBeVisible()
    })

    test('navigates the calendar through its public next-month control', async ({ page }) => {
      const calendar = page.locator('[data-ui-calendar], lumen-calendar').first()
      const initialMonth = await calendar.getAttribute('data-ui-calendar-month')

      await calendar.getByRole('button', { name: /next month/i }).click()

      await expect.poll(() => calendar.getAttribute('data-ui-calendar-month'))
        .not.toBe(initialMonth)
    })

    test('sorts a data table through its public column control', async ({ page }) => {
      const table = page.locator('[data-ui-datatable], lumen-data-table').first()
      const packageHeader = table.getByRole('columnheader', { name: /package/i })

      await packageHeader.getByRole('button').click()

      await expect(packageHeader).toHaveAttribute('aria-sort', 'ascending')
    })
  })
}

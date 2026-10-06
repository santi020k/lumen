import { expect, test } from '@playwright/test'

const previewTitle = 'Empty state interactive preview'

for (const width of [390, 1440]) {
  test.describe(`native Empty state preview at ${width}px`, () => {
    test.use({ viewport: { height: 900, width } })

    test('fills and resets the sample project example', async ({ page }) => {
      await page.goto('/docs/react-native/components/empty-state')

      const iframe = page.locator(`iframe[title="${previewTitle}"]`)

      await iframe.scrollIntoViewIfNeeded()
      await expect(iframe).toBeVisible()

      const content = page.frameLocator(`iframe[title="${previewTitle}"]`)

      await expect(content.getByText('No projects yet')).toBeVisible()
      await expect(content.getByText('My first project')).toHaveCount(0)

      const createButton = content.getByRole('button', { name: 'Create project' })

      await createButton.focus()
      await createButton.press('Enter')
      await expect(content.getByText('My first project')).toBeVisible()
      await expect(content.getByText('No projects yet')).toHaveCount(0)

      const resetButton = content.getByRole('button', { name: 'Reset example' })

      await page.keyboard.press('Tab')
      await expect(resetButton).toBeFocused()
      await resetButton.press('Enter')
      await expect(content.getByText('No projects yet')).toBeVisible()
      await expect(content.getByText('My first project')).toHaveCount(0)
    })
  })
}

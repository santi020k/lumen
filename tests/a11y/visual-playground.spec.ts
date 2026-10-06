import { expect, test } from '@playwright/test'

for (const width of [390, 1280]) {
  for (const theme of ['light', 'dark']) {
    test(`visual playground keeps styled controls and responsive comparisons at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/docs/visual-playground')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      const reverse = page.getByRole('button', { name: 'Reverse order', exact: true })

      await expect(reverse).toBeVisible()
      const presentation = await reverse.evaluate(element => {
        const style = getComputedStyle(element)

        return {
          height: element.getBoundingClientRect().height,
          padding: Number.parseFloat(style.paddingInlineStart),
          border: Number.parseFloat(style.borderTopWidth)
        }
      })

      // A motion stylesheet loaded before the cascade declaration allowed Tailwind's
      // reset to erase button padding and borders even though the components mounted.
      expect(presentation.height).toBeGreaterThanOrEqual(40)
      expect(presentation.padding).toBeGreaterThan(0)
      expect(presentation.border).toBeGreaterThan(0)
      const duration = page.getByLabel('Duration · milliseconds', { exact: true })

      await expect(duration).toHaveValue('240')
      expect(await duration.evaluate(element => Number.parseFloat(getComputedStyle(element).borderTopWidth)))
        .toBeGreaterThan(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
        .toBeLessThanOrEqual(1)
      const columns = await page.locator('.visual-demo-grid').first().evaluate(element =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length)

      expect(columns).toBe(width < 720 ? 1 : 2)
      await reverse.press('Enter')
      await expect(page.locator('.visual-motion-list').first().getByRole('button').first()).toHaveText('Review')
      await page.getByRole('button', { name: 'Add item', exact: true }).click()
      await expect(page.locator('.visual-motion-list').first().getByRole('button').last()).toHaveText('New task 1')
    })
  }
}

test('visual playground remains usable with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/visual-playground')
  await page.getByRole('button', { name: 'Reverse order', exact: true }).press('Enter')
  const list = page.locator('.visual-motion-list').first()

  await expect(list.getByRole('button').first()).toHaveText('Review')
  expect(await list.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
  await page.getByRole('button', { name: 'Save demonstration', exact: true }).click()
  await expect(page.getByText('Saved for this demonstration.', { exact: true })).toBeVisible()
})

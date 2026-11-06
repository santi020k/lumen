import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['santi020k-light', 'santi020k-dark']) {
    test(`home delivery comparison stays readable (${width}, ${theme})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => { localStorage.setItem('lumen-theme', value); }, theme)
      await page.goto('/')
      const section = page.locator('.home-delivery')
      await section.scrollIntoViewIfNeeded()
      const table = section.getByRole('table')
      await expect(table.getByRole('columnheader')).toHaveCount(4)
      await expect(table.getByRole('rowheader')).toHaveCount(3)
      await expect(table.getByRole('row').nth(1)).toContainText('7,025 B')
      await expect(table.getByRole('row').nth(2)).toContainText('5,448 B')
      await expect(table.getByRole('row').nth(3)).toContainText('9,638 B')
      await expect(table).toHaveAccessibleName(/Astro route asset measurements/)
      await expect(section.getByText('Added on first interaction', { exact: true }).first()).toBeVisible({ visible: width < 768 })
      const fixture = table.getByRole('link', { name: 'Static Card and Button', exact: true })
      await fixture.focus()
      await expect(fixture).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(table.getByRole('link', { name: 'Dialog', exact: true })).toBeFocused()
      expect(await section.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      expect(await table.evaluate(element => element.getBoundingClientRect().width <= window.innerWidth)).toBe(true)
    })
  }
}

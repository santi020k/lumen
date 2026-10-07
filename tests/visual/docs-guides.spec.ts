import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`visual usage guides remain readable (${width}, ${theme})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })

      for (const route of ['/docs/foundations', '/docs/web', '/docs/forms']) {
        await page.goto(route)
        await page.evaluate(value => {
          document.documentElement.dataset.theme = value
        }, theme)

        const overflows = await page.evaluate(() =>
          document.documentElement.scrollWidth > window.innerWidth
        )
        expect(overflows, `${route} should fit the viewport`).toBe(false)

        if (route === '/docs/foundations') {
          await expect(page.getByRole('heading', { name: 'A role, not a fixed color' })).toBeVisible()
          await expect(page.getByLabel('Semantic color roles').getByText('Primary actions')).toBeVisible()
          await page.getByLabel('Workspace name').fill('Example workspace')
          await expect(page.getByLabel('Workspace name')).toHaveValue('Example workspace')
        }

        if (route === '/docs/web') {
          const samples = page.getByLabel('The same components in light and dark themes')
          const light = samples.locator('[data-theme="light"]')
          const dark = samples.locator('[data-theme="dark"]')
          await expect(light.getByLabel('Workspace name')).toHaveValue('Lumen Labs')
          await expect(dark.getByLabel('Workspace name')).toHaveValue('Lumen Labs')
          const lightBackground = await light.evaluate(element => getComputedStyle(element).backgroundColor)
          const darkBackground = await dark.evaluate(element => getComputedStyle(element).backgroundColor)
          expect(lightBackground).not.toBe(darkBackground)
        }

        if (route === '/docs/forms') {
          const summaryLink = page.locator('.validation-examples').getByRole('link', { name: 'This email is already in use.' })
          await summaryLink.scrollIntoViewIfNeeded()
          await summaryLink.focus()
          await page.keyboard.press('Enter')
          await expect(page.locator('#server-mode-email')).toBeFocused()
          await expect(page.locator('#server-mode-email')).toHaveAttribute('aria-describedby', 'server-mode-error')
        }
      }
    })
  }
}

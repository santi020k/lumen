import { expect, test } from '@playwright/test'

for (const theme of ['lumen-light', 'lumen-dark']) {
  test(`home installer keeps commands and copy feedback inside the bar in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('lumen-theme', value)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (command: string) => {
            document.documentElement.dataset.copiedCommand = command

            return Promise.resolve()
          }
        }
      })
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const installer = page.locator('.home-installer')
    const tabs = installer.getByRole('tab')

    await expect(installer).toHaveAttribute('data-ui-bound', 'true')

    for (const width of [320, 390, 720, 721, 768, 832, 833, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await tabs.first().focus()
      await tabs.first().press('Home')

      for (const [index, framework] of ['astro', 'react', 'elements'].entries()) {
        if (index > 0) await page.keyboard.press('ArrowRight')
        await expect(tabs.nth(index)).toBeFocused()
        await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true')

        const panel = installer.getByRole('tabpanel')
        const command = `pnpm add @santi020k/lumen-${framework}`

        await expect(panel.locator('code')).toHaveText(command)
        await page.keyboard.press('Tab')
        await expect(panel.getByRole('button')).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(panel.locator('[data-copy-feedback]')).toHaveText('Copied')
        await expect(page.locator('html')).toHaveAttribute('data-copied-command', command)

        const fits = await installer.evaluate(element => {
          const bounds = element.getBoundingClientRect()
          const content = element.querySelectorAll('[role="tab"], [role="tabpanel"]:not([hidden]) *')

          return bounds.left >= 0 && bounds.right <= window.innerWidth && [...content].every(child => {
            const rect = child.getBoundingClientRect()

            return rect.left >= bounds.left && rect.right <= bounds.right
              && rect.top >= bounds.top && rect.bottom <= bounds.bottom
              && child.scrollWidth <= child.clientWidth + 1
          })
        })

        expect(fits, `${framework} command and Copied feedback fit at ${width}px`).toBe(true)
        await tabs.nth(index).focus()
      }
    }
  })
}

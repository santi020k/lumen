import { expect, test } from '@playwright/test'

const themes = [
  { name: 'paper', light: '354 43% 34%', dark: '8 58% 74%' },
  { name: 'field', light: '148 38% 27%', dark: '132 34% 72%' }
] as const

for (const adapter of ['react', 'elements'] as const) {
  for (const width of [390, 1440]) {
    for (const theme of themes) {
      test(`${adapter} keeps state and keyboard actions through ${theme.name} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`/visual/${adapter}`)

        const host = page.locator(`[data-framework="${adapter}"]`)
        const advance = host.getByRole('button', {
          name: adapter === 'react' ? 'Advance release' : 'Advance Web Component release',
          exact: true
        })
        if (adapter === 'react') {
          await expect(page.locator('html')).toHaveAttribute('data-fixture-ready', 'true')
        } else {
          await expect(advance).toHaveAttribute('data-ready', 'true')
        }

        await advance.click()
        const progress = host.getByRole('progressbar', {
          name: adapter === 'react' ? 'Release readiness' : 'Web Component release readiness',
          exact: true
        })
        const value = adapter === 'react' ? '76' : '79'
        await expect(progress).toHaveAttribute('aria-valuenow', value)

        // A named dark parent must not override a locally pinned reading surface.
        await page.locator('html').evaluate(element => { element.dataset.theme = 'santi020k-dark' })
        await host.evaluate((element, name) => { element.setAttribute('data-lumen-preset', name) }, theme.name)
        await expect(host).toHaveCSS('--brand-solid', theme.dark)
        for (const scheme of ['light', 'dark'] as const) {
          await host.evaluate((element, mode) => { element.setAttribute('data-lumen-scheme', mode) }, scheme)
          await expect(host).toHaveCSS('--brand-solid', theme[scheme])
          await expect(host).toHaveCSS('color-scheme', scheme)
          await expect(progress).toHaveAttribute('aria-valuenow', value)

          const trigger = host.getByRole('button', { name: 'Review release details', exact: true })
          await trigger.focus()
          await trigger.press('Enter')
          const dialog = page.getByRole('dialog', { name: 'Release details', exact: true })
          await expect(dialog).toHaveAttribute('open', '')
          await expect(dialog).toBeVisible()
          await expect(dialog.getByRole('button', { name: 'Close release details', exact: true })).toBeFocused()
          await expect(dialog).toHaveCSS('--brand-solid', theme[scheme])
          await page.keyboard.press('Escape')
          await expect(dialog).toBeHidden()
          await expect(trigger).toBeFocused()
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        }
        await host.evaluate(element => { element.removeAttribute('data-lumen-scheme') })
        await expect(host).toHaveCSS('--brand-solid', theme.dark)
      })
    }
  }
}

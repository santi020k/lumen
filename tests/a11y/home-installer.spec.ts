import { expect, test } from '@playwright/test'

for (const theme of ['lumen-light', 'lumen-dark']) {
  test(`home installer keeps commands and copy feedback inside the code tabs in ${theme}`, async ({ page }) => {
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
        const copyButton = panel.getByRole('button')
        await page.keyboard.press('Tab')
        await expect(copyButton).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(copyButton).toHaveAttribute('data-state', 'copied')
        await expect(copyButton).toHaveAccessibleName('Install command copied')
        await expect(page.locator('html')).toHaveAttribute('data-copied-command', command)

        const fits = await installer.evaluate(element => {
          const bounds = element.getBoundingClientRect()
          const content = element.querySelectorAll('[role="tab"], [role="tabpanel"]:not([hidden]) pre, [role="tabpanel"]:not([hidden]) button')

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

test('homepage reports unavailable clipboard access and supports retry', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Clipboard unavailable')) }
    })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  for (const selector of ['.home-installer', '.home-ai__terminal']) {
    const container = page.locator(selector)
    const button = container.getByRole('button')
    await button.click()
    await expect(button).toHaveAttribute('data-state', 'error')
    await expect(button).toHaveAccessibleName('Could not copy code. Select and copy it manually.')
    await expect(container.locator('code:visible')).not.toBeEmpty()

    await page.evaluate(() => {
      navigator.clipboard.writeText = () => Promise.resolve()
    })
    await button.click()
    await expect(button).toHaveAttribute('data-state', 'copied')

    await page.evaluate(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error('Clipboard unavailable'))
    })
  }
})

test('homepage chart exposes its illustrative data to keyboard users', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.setViewportSize({ width: 390, height: 844 })
  const chart = page.locator('.home-workbench__chart')
  const disclosure = chart.locator('summary')
  await disclosure.focus()
  await page.keyboard.press('Enter')
  await expect(chart.getByRole('table')).toBeVisible()
  await expect(chart.getByRole('row')).toHaveCount(7)
  await expect(chart.getByRole('row').last()).toHaveText('Jul$48.29k')
  await page.keyboard.press('Enter')
  await expect(chart.getByRole('table')).toBeHidden()
})

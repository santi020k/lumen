import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')
const brands = {
  paper: { light: '354 43% 34%', dark: '8 58% 74%' },
  field: { light: '148 38% 27%', dark: '132 34% 72%' }
}

for (const theme of ['paper', 'field'] as const) {
  for (const scheme of ['light', 'dark'] as const) {
    for (const width of [390, 1440]) {
      test(`${theme} article and form in ${scheme} at ${width}px`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
        await page.goto(`/internal/reading-themes/${theme}`)
        await page.evaluate(value => { document.documentElement.dataset.theme = `lumen-${value}` }, scheme)

        const root = page.locator('html')
        const heading = page.getByRole('heading', { name: 'The art of finding your way' })
        const input = page.getByLabel('List name')

        await expect(root).toHaveCSS('--brand-solid', brands[theme][scheme])
        await expect(root).toHaveCSS('color-scheme', scheme)
        await expect(heading).toHaveCSS('font-family', theme === 'paper' ? /Georgia/ : /system-ui/)
        await expect(input).toHaveCSS('font-family', /system-ui/)
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await testInfo.attach('article-and-form', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })

        await page.keyboard.press('Tab')
        const link = page.getByRole('link', { name: 'Save this article to a reading list' })
        await expect(link).toBeFocused()
        await expect(link).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(/#reading-list$/)
        await page.keyboard.press('Tab')
        await expect(input).toBeFocused()
        await expect(input).toHaveCSS('outline-style', 'solid')
        await input.press('Enter')
        await expect(input).toHaveAccessibleDescription('Enter a list name.')
        await expect(input).toHaveAttribute('aria-invalid', 'true')

        await page.addScriptTag({ path: axePath })
        const violations: unknown = await page.evaluate('axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')
        expect(violations).toEqual([])

        await input.fill('Trail notes')
        await input.press('Enter')
        await expect(page.getByRole('status')).toHaveText('Saved to Trail notes.')
        await expect(input).not.toHaveAttribute('aria-invalid')
      })
    }
  }
}

for (const theme of ['paper', 'field'] as const) {
  test(`${theme} follows the nearest scheme and respects a nested default preset`, async ({ page }) => {
    await page.goto(`/internal/reading-themes/${theme}`)
    await page.evaluate(preset => {
      delete document.documentElement.dataset.lumenPreset
      document.documentElement.dataset.theme = 'lumen-dark'
      document.body.dataset.lumenScheme = 'light'
      const article = document.querySelector('article')
      if (!article) throw new Error('Missing article')
      article.dataset.lumenPreset = preset
    }, theme)
    const article = page.getByRole('article')
    await expect(article).toHaveCSS('--brand-solid', brands[theme].light)
    await article.evaluate(el => { el.dataset.lumenScheme = 'dark' })
    await expect(article).toHaveCSS('--brand-solid', brands[theme].dark)
    if (theme === 'paper') {
      await page.locator('.ui-prose').evaluate(el => { el.setAttribute('data-lumen-preset', 'default') })
      await expect(page.getByRole('heading', { level: 1 })).not.toHaveCSS('font-family', /Georgia/)
    }
  })
}

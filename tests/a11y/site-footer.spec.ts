import { expect, test } from '@playwright/test'

for (const width of [390, 768, 1440]) {
  for (const route of ['/', '/docs', '/docs/components/button']) {
    test(`compact footer keeps navigation and keyboard entry points on ${route} at ${width}px`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(route)
      const footer = page.locator('.docs-site-footer')

      await footer.scrollIntoViewIfNeeded()
      await expect(footer.getByRole('heading', { name: 'A shared language. Every platform.' })).toBeVisible()
      await expect(footer.getByRole('navigation', { name: 'Footer' })).toBeVisible()
      for (const group of ['Get started', 'Platforms', 'Resources', 'Community']) {
        await expect(footer.getByRole('heading', { name: group, exact: true })).toBeVisible()
      }
      await expect(footer.locator('.docs-site-footer__launchpad')).toHaveCount(0)
      await expect(footer.getByRole('tablist')).toHaveCount(0)
      const docs = footer.getByRole('link', { name: 'Read the docs' })

      await docs.focus()
      await expect(docs).toBeFocused()
      // Safari uses Option-Tab to traverse links with its default keyboard settings.
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
      const github = footer.getByRole('link', { name: 'View on GitHub' })

      await expect(github).toBeFocused()
      await expect(github).toHaveAttribute('rel', /noopener/u)
      await expect(github).toHaveAttribute('rel', /noreferrer/u)
      await expect(footer.getByRole('link', { name: 'Santi020k' })).toHaveAttribute('href', 'https://santi020k.com')
      await expect(footer.getByRole('link', { name: 'Privacy', exact: true })).toHaveAttribute('href', '/privacy')
      await expect(footer.getByRole('link', { name: 'Terms', exact: true })).toHaveAttribute('href', '/terms')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const height = await footer.evaluate(element => element.getBoundingClientRect().height)

      expect(height).toBeLessThan(width < 640 ? 1400 : 1000)
    })
  }
}

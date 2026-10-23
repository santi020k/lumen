import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')

for (const width of [390, 1440]) {
  for (const theme of ['lumen-light', 'lumen-dark']) {
    test(`Tailwind guide preserves component customization and nested colors at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/docs/web/tailwind')
      await page.evaluate(value => {
        document.documentElement.dataset.theme = value
      }, theme)

      const card = page.locator('[data-tailwind-example]')

      await expect(card).toHaveCSS('padding', width < 640 ? '24px' : '32px')
      await expect(card).toHaveCSS('border-radius', '0px')
      const link = card.getByRole('link', { name: 'Explore components' })
      const dimensions = await card.evaluate(element => {
        const action = element.querySelector('a')
        const style = getComputedStyle(element)

        if (!action) throw new Error('Missing live component link')

        return {
          available: element.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight),
          link: action.getBoundingClientRect().width
        }
      })

      if (width < 640) expect(dimensions.link).toBeCloseTo(dimensions.available, 0)
      else expect(dimensions.link).toBeLessThan(dimensions.available)

      await link.focus()
      await expect(link).toBeFocused()
      expect(await link.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')

      for (const localTheme of ['light', 'dark']) {
        const scope = page.locator(`[data-tailwind-theme="${localTheme}"]`)
        const presentation = await scope.evaluate(element => {
          const style = getComputedStyle(element)
          const probe = document.createElement('span')

          probe.style.color = 'hsl(var(--ink))'
          probe.style.backgroundColor = 'hsl(var(--surface))'
          element.append(probe)
          const expected = getComputedStyle(probe)
          const result = {
            color: style.color,
            expectedColor: expected.color,
            background: style.backgroundColor,
            expectedBackground: expected.backgroundColor
          }

          probe.remove()

          return result
        })

        expect(presentation.color).toBe(presentation.expectedColor)
        expect(presentation.background).toBe(presentation.expectedBackground)
      }

      const tabs = page.getByRole('tablist', { name: 'Tailwind stylesheet by framework' })

      await tabs.getByRole('tab', { name: 'Astro', exact: true }).focus()
      await page.keyboard.press('ArrowRight')
      await expect(tabs.getByRole('tab', { name: 'React', exact: true })).toBeFocused()
      await page.keyboard.press('Enter')
      const setup = page.locator('[data-slot="code-tabs"]').filter({ has: tabs })

      await expect(setup.getByRole('tabpanel', { name: 'React', exact: true })).toContainText('@santi020k/lumen-react/tailwind.css')
      await expect(setup.getByRole('tabpanel', { name: 'Astro', exact: true, includeHidden: true })).not.toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.addScriptTag({ path: axePath })
      const violations: unknown = await page.evaluate('axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')

      expect(violations).toEqual([])
    })
  }
}

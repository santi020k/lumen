import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`disclosure hover preserves header and body spacing (${width}, ${theme})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })

      for (const { route, selector } of [
        { route: '/docs/visual-playground', selector: '.ui-tool-activity' },
        { route: '/docs/components/accordion', selector: '.ui-accordion details' },
        { route: '/docs/components/collapsible', selector: '.ui-collapsible:has(> summary:text-is("Advanced filters"))' }
      ]) {
        await page.goto(route)
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        await page.evaluate(() => document.fonts.ready)
        const disclosure = page.locator(selector).first()
        const summary = disclosure.locator('summary')

        if (await disclosure.getAttribute('open') !== null) await summary.click()
        const closedBox = await summary.boundingBox()

        await summary.focus()
        await summary.press('Enter')
        await expect(disclosure).toHaveAttribute('open', '')
        await expect(summary).toHaveCSS('outline-width', '2px')
        await summary.hover()

        const layout = await disclosure.evaluate(element => {
          const heading = element.querySelector('summary')
          const body = heading?.nextElementSibling
          if (!heading || !body) throw new Error('Expected a disclosure heading and body')
          const headingBox = heading.getBoundingClientRect()
          const bodyBox = body.getBoundingClientRect()
          const containerBox = element.getBoundingClientRect()
          const headingStyle = getComputedStyle(heading)

          return {
            bodyGap: bodyBox.top - headingBox.bottom,
            bodyInset: bodyBox.left - containerBox.left,
            headerHeight: headingBox.height,
            paddingTop: headingStyle.paddingTop,
            paddingBottom: headingStyle.paddingBottom,
            hoverBackground: headingStyle.backgroundColor,
            bodyBackground: getComputedStyle(element).backgroundColor
          }
        })

        expect(layout.bodyGap).toBeGreaterThanOrEqual(16)
        expect(Math.abs(layout.bodyGap - layout.bodyInset)).toBeLessThanOrEqual(1)
        expect(layout.paddingBottom).toBe(layout.paddingTop)
        expect(layout.headerHeight).toBe(closedBox?.height)
        expect(layout.hoverBackground).not.toBe(layout.bodyBackground)

        await summary.press('Space')
        await expect(disclosure).not.toHaveAttribute('open')
        expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
      }
    })
  }
}

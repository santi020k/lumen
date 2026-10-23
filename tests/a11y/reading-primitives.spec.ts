import { createRequire } from 'node:module'

import { expect, type Page, test } from '@playwright/test'

const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')

for (const framework of ['astro', 'react', 'elements']) {
  for (const width of [390, 1440]) {
    for (const textScale of [1, 2]) {
      test(`${framework} reading primitives reflow at ${width}px and ${textScale * 100}% text`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
        await page.goto(`/internal/reading-primitives/${framework}`)
        await page.waitForLoadState('networkidle')
        await page.locator('[href="#intro"]').waitFor()
        await expect(page.locator('[href="#intro"]')).toHaveAttribute('aria-current', 'location')
        await page.evaluate(scale => {
          document.documentElement.style.fontSize = `${scale * 100}%`
        }, textScale)
        await page.waitForFunction(scale => getComputedStyle(document.documentElement).fontSize === `${16 * scale}px` && getComputedStyle(document.querySelector('.ui-pill') ?? document.documentElement).fontSize === `${14 * scale}px`, textScale)
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => { resolve(); }))))

        await page.addScriptTag({ path: axePath })
        for (const theme of ['light', 'dark']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          const violations: unknown = await page.evaluate('axe.run("main", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')
          expect(violations).toEqual([])
        }

        const pills = page.locator('[data-reading-pills] .ui-pill')
        await expect(pills).toHaveCount(3)
        const geometry = await pills.evaluateAll(elements => elements.map(element => {
          const bounds = element.getBoundingClientRect()
          const container = element.parentElement?.getBoundingClientRect() ?? bounds
          const range = document.createRange()
          range.selectNodeContents(element)
          return {
            contentFits: [...range.getClientRects()].every(rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1),
            containerFits: bounds.left >= container.left - 1 && bounds.right <= container.right + 1,
            pageFits: bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth,
            countWrap: getComputedStyle(element.querySelector('.ui-pill__count') ?? element).whiteSpace
          }
        }))
        expect(geometry).toEqual(Array.from({ length: 3 }, () => ({ contentFits: true, containerFits: true, pageFits: true, countWrap: 'nowrap' })))
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)

        for (const padding of ['5em', '20%', 'calc(20% + 10px)', 'max(20%, 120px)']) {
          await page.evaluate(value => {
            document.documentElement.style.scrollPaddingTop = value
          }, padding)
          const link = page.locator('[href="#details"]')
          await link.focus()
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(/#details$/)
          // Force a second update after native scrolling, rather than accepting the click's optimistic state.
          await page.evaluate(() => new Promise<void>(resolve => {
            requestAnimationFrame(() => {
              window.dispatchEvent(new Event('scroll'))
              requestAnimationFrame(() => { resolve(); })
            })
          }))
          await expect(link).toHaveAttribute('aria-current', 'location')
          await expect(page.locator('[aria-current="location"]')).toHaveCount(1)
          expect(await page.locator('#details').evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThan(40)
        }
      })
    }
  }
}

const setPillState = async (page: Page, index: number, state: 'rest' | 'hover' | 'focus', forwardKey: 'Tab' | 'Alt+Tab') => {
  const link = page.locator('a.ui-pill').nth(index)
  await page.mouse.move(0, 0)
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })
  if (state === 'hover') await link.hover()
  if (state === 'focus') {
    await page.locator('#keyboard-start').focus()
    for (let step = 0; step <= index; step += 1) await page.keyboard.press(forwardKey)
    await expect(link).toBeFocused()
    await expect(link).toHaveCSS('outline-width', '2px')
    await expect(link).toHaveCSS('outline-style', 'solid')
  }
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => { resolve() }))
  }))
  return link
}

for (const width of [390, 1440]) {
  for (const textScale of [1, 2]) {
    test(`linked Pill hover and focus remain readable at ${width}px and ${textScale * 100}% text`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.goto('/internal/pill-link-states')
      await page.waitForLoadState('networkidle')
      await page.addScriptTag({ path: axePath })
      await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale * 100}%` }, textScale)
      await page.waitForFunction(scale => getComputedStyle(document.querySelector('.ui-pill') ?? document.documentElement).fontSize === `${14 * scale}px`, textScale)
      const links = page.locator('a.ui-pill')
      await expect(links).toHaveCount(3)

      for (const theme of ['light', 'dark']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (let index = 0; index < 3; index += 1) {
          for (const state of ['rest', 'hover', 'focus'] as const) {
            const link = await setPillState(page, index, state, browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
            const selector = `a.ui-pill:nth-child(${index + 1})`
            const violations: unknown = await page.evaluate(`axe.run(${JSON.stringify(selector)}, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)`)
            expect(violations).toEqual([])
            expect(await link.evaluate(element => {
              const bounds = element.getBoundingClientRect()
              return bounds.left >= 4 && bounds.right + 4 <= document.documentElement.clientWidth
            })).toBe(true)
          }
        }
      }
    })
  }
}

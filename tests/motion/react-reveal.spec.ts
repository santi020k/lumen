import { createRequire } from 'node:module'

import { expect, type Page, test } from '@playwright/test'

const route = '/internal/react-reveal'
const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')
const ids = ['repeat-single', 'repeat-group', 'once-single', 'once-group']
const target = (page: Page, id: string) => page.locator(`[data-reveal-id="${id}"]`)

// Browser delivery timing is nondeterministic. Queue both changes explicitly to
// reproduce the stale-entry regression; separate tests below use native observers.
const installBatchedObserver = async (page: Page) => {
  await page.addInitScript(() => {
    window.IntersectionObserver = class implements IntersectionObserver {
      root = null
      rootMargin = '0px'
      scrollMargin = '0px'
      thresholds = [0.15]
      listeners = new Map<Element, { enter: () => void, exit: () => void }>()
      constructor(private callback: IntersectionObserverCallback) {}
      observe(element: Element) {
        const deliver = (states: boolean[]) => {
          const bounds = element.getBoundingClientRect()
          this.callback(states.map((visible, index) => ({
            target: element,
            time: performance.now() + index,
            isIntersecting: visible,
            intersectionRatio: visible ? 1 : 0,
            boundingClientRect: bounds,
            intersectionRect: bounds,
            rootBounds: null
          })), this)
        }
        const listeners = {
          enter: () => { deliver([false, true]) },
          exit: () => { deliver([true, false]) }
        }
        this.listeners.set(element, listeners)
        element.addEventListener('reveal-enter', listeners.enter)
        element.addEventListener('reveal-exit', listeners.exit)
      }

      unobserve(element: Element) {
        const listeners = this.listeners.get(element)
        if (!listeners) return
        element.removeEventListener('reveal-enter', listeners.enter)
        element.removeEventListener('reveal-exit', listeners.exit)
        this.listeners.delete(element)
      }

      disconnect() {
        for (const element of this.listeners.keys()) this.unobserve(element)
      }

      takeRecords(): IntersectionObserverEntry[] { return [] }
    }
  })
}

const openFixture = async (page: Page, width: number, scale: number) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.goto(route)
  for (const id of ids) {
    await expect(target(page, id)).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
  }
  await page.evaluate(value => {
    document.documentElement.style.fontSize = `${value * 100}%`
  }, scale)
  await page.waitForFunction(value => getComputedStyle(document.documentElement).fontSize === `${16 * value}px`, scale)
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => { resolve() }))
  }))
}

const checkVisible = async (page: Page, id: string) => {
  const root = target(page, id)
  await expect(root).toHaveClass(/is-revealed/)
  const animated = id.endsWith('group') ? root.locator(':scope > *') : root
  for (const item of await animated.all()) {
    await expect(item).toHaveCSS('opacity', '1')
    await expect(item).toHaveCSS('transform', 'none')
  }
}

for (const width of [390, 1440]) {
  for (const scale of [1, 2]) {
    test.describe(`${width}px with ${scale * 100}% text`, () => {
      test('latest observer entry controls both React reveal components', async ({ page }, testInfo) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await installBatchedObserver(page)
        await openFixture(page, width, scale)
        for (const id of ids) {
          await target(page, id).evaluate(element => element.dispatchEvent(new Event('reveal-enter')))
        }
        // Matching before/after captures use the same injected visibility batch.
        await page.locator('section').first().screenshot({
          path: testInfo.outputPath('reveal-batch.png'),
          animations: 'disabled',
          style: 'astro-dev-toolbar { display: none; }'
        })
        for (const id of ids) {
          await checkVisible(page, id)
          await target(page, id).evaluate(element => element.dispatchEvent(new Event('reveal-exit')))
          if (id.startsWith('repeat')) {
            await expect(target(page, id)).not.toHaveClass(/is-revealed/)
            await target(page, id).evaluate(element => element.dispatchEvent(new Event('reveal-enter')))
          }
          await checkVisible(page, id)
        }
      })

      test('native scrolling preserves reflow and keyboard access', async ({ page, browserName }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await openFixture(page, width, scale)
        for (const id of ids) {
          await target(page, id).evaluate(element => { element.scrollIntoView({ block: 'start' }); })
          await checkVisible(page, id)
          const buttons = target(page, id).getByRole('button')
          await buttons.first().focus()
          await expect(buttons.first()).toBeFocused()
          await expect(buttons.first()).toHaveCSS('outline-style', 'solid')
          if (id.endsWith('group')) {
            await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
            await expect(buttons.nth(1)).toBeFocused()
          }
          expect(await target(page, id).evaluate(element => {
            const bounds = element.getBoundingClientRect()
            return bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth &&
              element.scrollWidth <= element.clientWidth
          })).toBe(true)
          await page.locator('#end').scrollIntoViewIfNeeded()
          if (id.startsWith('repeat')) {
            await expect(target(page, id)).not.toHaveClass(/is-revealed/)
          } else {
            await expect(target(page, id)).toHaveClass(/is-revealed/)
          }
          await target(page, id).evaluate(element => { element.scrollIntoView({ block: 'start' }); })
          await checkVisible(page, id)
        }
        const layout = await page.evaluate(() => {
          const width = document.documentElement.clientWidth

          return {
            width,
            scrollWidth: document.documentElement.scrollWidth,
            overflowingElements: [...document.querySelectorAll('*')]
              .filter(element => element.getBoundingClientRect().right > width)
              .map(element => ({
                tag: element.tagName,
                id: element.id,
                className: element.getAttribute('class'),
                right: element.getBoundingClientRect().right
              }))
          }
        })
        expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width)
      })

      for (const theme of ['light', 'dark']) test(`reduced motion keeps all content visible and accessible in ${theme}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await openFixture(page, width, scale)
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)

        const ink = await page.evaluate(() => {
          const probe = document.createElement('span')
          probe.style.color = 'hsl(var(--ink))'
          document.body.append(probe)
          const color = getComputedStyle(probe).color
          probe.remove()
          return color
        })
        await expect(page.locator('body')).toHaveCSS('color', ink)
        for (const id of ids) {
          await checkVisible(page, id)
          const root = target(page, id)
          const animated = id.endsWith('group') ? root.locator(':scope > *') : root
          for (const item of await animated.all()) {
            await expect(item).toHaveCSS('transition-property', 'none')
            await expect(item).toHaveCSS('transform', 'none')
          }
        }
        await page.addScriptTag({ path: axePath })
        const violations: unknown = await page.evaluate('axe.run("main", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')
        expect(violations).toEqual([])
      })
    })
  }
}

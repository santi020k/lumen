import { expect, type Locator, test } from '@playwright/test'

import { documentedComponentCount } from '../../apps/docs/src/data/site-metadata'

const values = [String(documentedComponentCount), '4', '0']

const readVisibleValues = (statistics: Locator) => statistics.evaluateAll(elements => elements.map(element => {
  const copy = element.cloneNode(true)

  if (!(copy instanceof Element)) throw new Error('Expected a statistic element.')

  for (const hiddenCopy of copy.querySelectorAll('.ui-sr-only')) hiddenCopy.remove()

  return copy.textContent.trim()
}))

test('homepage statistics stay accurate before scrolling after enhancement', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 823 })
  await page.goto('/')
  await expect(page.locator('.home-hero__copy')).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
  expect(await page.evaluate(() => scrollY)).toBe(0)
  const statistics = page.locator('.home-proof__stats .ui-stat-value')

  await expect.poll(() => readVisibleValues(statistics)).toEqual(values)
  await page.locator('.home-proof').scrollIntoViewIfNeeded()
  await expect.poll(() => readVisibleValues(statistics)).toEqual(values)
})

test.describe('homepage statistics without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const width of [390, 1440]) {
    test(`retain their server-rendered values at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await expect.poll(() => readVisibleValues(page.locator('.home-proof__stats .ui-stat-value'))).toEqual(values)
    })
  }
})

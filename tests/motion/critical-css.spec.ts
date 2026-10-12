import { expect, type Page, test } from '@playwright/test'

const criticalStyles = 'packages/lumen/styles/critical.css'

// Critical CSS ships without the full sheet's universal reduction, so each looping component reduces itself.
const renderCriticalSkeletons = async (page: Page) => {
  await page.setContent(`
    <div class="ui-skeleton" data-variant="shimmer"></div>
    <div class="ui-skeleton ui-skeleton--pulse" data-variant="pulse"></div>
  `)
  await page.addStyleTag({ path: criticalStyles })

  return page.locator('.ui-skeleton').evaluateAll(elements => elements.map(element => ({
    infinite: element.getAnimations().filter(animation => animation.effect?.getTiming().iterations === Infinity).length,
    variant: element.getAttribute('data-variant')
  })))
}

test('critical-only Skeleton shimmer and pulse loop only when motion is allowed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  expect(await renderCriticalSkeletons(page)).toEqual([
    { infinite: 1, variant: 'shimmer' },
    { infinite: 1, variant: 'pulse' }
  ])

  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await renderCriticalSkeletons(page)).toEqual([
    { infinite: 0, variant: 'shimmer' },
    { infinite: 0, variant: 'pulse' }
  ])
})

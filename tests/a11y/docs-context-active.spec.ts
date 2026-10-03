import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const expectCurrent = async (page: Page, label: string, section = true): Promise<void> => {
  const navigation = page.locator('.docs-context-navigation__links')
  const current = navigation.locator('[aria-current]')

  await expect(current).toHaveCount(1)
  await expect(current).toHaveText(label)
  await expect(current).toHaveAttribute('aria-current', section ? 'location' : 'page')
}

for (const width of [390, 1440]) {
  test(`section clicks and history update the active context at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/docs/foundations')

    const navigation = page.getByRole('navigation', { name: 'Foundations documentation' })

    await expectCurrent(page, 'Overview', false)
    await navigation.getByRole('link', { name: 'Use the tokens' }).click()
    await expect(page).toHaveURL(/#installation$/u)
    await expectCurrent(page, 'Use the tokens')
    await navigation.getByRole('link', { name: 'Coverage' }).click()
    await expect(page).toHaveURL(/#components$/u)
    await expectCurrent(page, 'Coverage')
    await page.screenshot({
      path: testInfo.outputPath(`active-coverage-${width}.png`),
      clip: { x: 0, y: 0, width: Math.min(width, 960), height: 480 }
    })

    await page.goBack()
    await expect(page).toHaveURL(/#installation$/u)
    await expectCurrent(page, 'Use the tokens')
    await page.goForward()
    await expect(page).toHaveURL(/#components$/u)
    await expectCurrent(page, 'Coverage')
    await navigation.getByRole('link', { name: 'Overview' }).click()
    await expect(page).toHaveURL(/\/docs\/foundations$/u)
    await expectCurrent(page, 'Overview', false)
  })
}

test('direct section links survive reload and unknown fragments retain the page context', async ({ page }) => {
  await page.goto('/docs/foundations#components')
  await expectCurrent(page, 'Coverage')
  await page.reload()
  await expectCurrent(page, 'Coverage')
  await page.goto('/docs/foundations#unlisted')
  await expectCurrent(page, 'Overview', false)
})

test('native platform sections activate through client navigation and retain page prefixes', async ({ page }) => {
  await page.goto('/docs/apple/components')
  await expectCurrent(page, 'Components', false)

  const navigation = page.locator('.docs-context-navigation__links')

  await navigation.getByRole('link', { name: 'Install', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/apple#installation$/u)
  await expectCurrent(page, 'Install')
  await navigation.getByRole('link', { name: 'Theme', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/apple#theme$/u)
  await expectCurrent(page, 'Theme')
  await page.goto('/docs/components/button#api')
  await expectCurrent(page, 'Components', false)
})

test('resizing keeps the active section visible in the horizontal navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/docs/foundations#principles')
  await expectCurrent(page, 'Principles')
  await page.setViewportSize({ width: 390, height: 900 })
  await expectCurrent(page, 'Principles')
  await expect.poll(() => page.locator('.docs-context-navigation__links').evaluate(navigation => {
    const active = navigation.querySelector('[aria-current]')

    if (!active) return false

    const parent = navigation.getBoundingClientRect()
    const bounds = active.getBoundingClientRect()

    return bounds.left >= parent.left && bounds.right <= parent.right
  })).toBe(true)
})

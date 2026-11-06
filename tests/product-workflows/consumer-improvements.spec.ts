import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')

for (const width of [390, 1280]) {
  test(`feedback and navigation work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/ideas?*', route => route.fulfill({ status: 200, body: '{}' }))
    await page.route('**/submit', route => route.fulfill({ status: 500, body: '{}' }))
    await page.route('**/vote', route => route.fulfill({ status: 200, body: '{}' }))
    await page.goto('/')
    const board = page.locator('#feedback')
    await expect(board.getByRole('heading', { name: 'Newest idea' })).toBeVisible()
    await board.getByLabel('Idea title').fill('Keep my draft')
    await board.getByLabel('Message', { exact: true }).fill('My message')
    await board.getByRole('button', { name: 'Send idea' }).click()
    await expect(board.getByRole('status')).toHaveText('Unable to complete request')
    await expect(board.getByLabel('Idea title')).toHaveValue('Keep my draft')
    await expect(board.getByRole('status')).toBeFocused()
    await board.getByRole('button', { name: 'Support' }).click()
    await expect(board.getByRole('status')).toHaveText('Saved')
    if (width === 390) {
      await page.getByRole('button', { name: 'Open menu', exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('button', { name: 'Open menu', exact: true })).toBeFocused()
      await page.getByRole('button', { name: 'Open menu', exact: true }).click()
      await page.setViewportSize({ width: 1280, height: 900 })
      await expect(page.getByRole('dialog')).not.toBeVisible()
      await expect(page.getByRole('link', { name: 'Dialog home', exact: true })).toBeFocused()
      await page.setViewportSize({ width: 390, height: 900 })
      await page.locator('.mobile-disclosure summary').click()
      await page.keyboard.press('Escape')
      await expect(page.locator('.mobile-disclosure summary')).toBeFocused()
    }
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width)
    await page.addScriptTag({ path: axePath })
    const violations: unknown = await page.evaluate('axe.run("#feedback", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')
    expect(violations).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`consumer-${width}.png`), fullPage: true })
  })
}

test('new sort results survive a late response and navigation remounts listeners', async ({ page }) => {
  let releaseOlder: (() => void) | undefined
  const older = new Promise<void>(resolve => { releaseOlder = resolve })
  let count = 0
  await page.route('**/ideas?*', async route => {
    count += 1
    if (count === 1) await older
    await route.fulfill({ status: 200, body: '{}' }).catch(() => {})
  })
  await page.goto('/')
  const sort = page.locator('#feedback-sort')
  await expect.poll(() => count).toBe(1)
  await page.locator('#feedback [data-ui-select-trigger]').click()
  await page.getByRole('option', { name: 'Popular', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Popular idea' })).toBeVisible()
  releaseOlder?.()
  await expect(page.getByRole('heading', { name: 'Popular idea' })).toBeVisible()
  await page.getByRole('link', { name: 'Continue to another page' }).click()
  await expect(page.getByRole('heading', { name: 'Another page' })).toBeVisible()
  const previousLoads = count
  await page.goBack()
  await expect.poll(() => count).toBeGreaterThan(previousLoads)
  const restoredSort = await sort.inputValue()
  await expect(page.getByRole('heading', { name: restoredSort === 'popular' ? 'Popular idea' : 'Newest idea' })).toBeVisible()
})

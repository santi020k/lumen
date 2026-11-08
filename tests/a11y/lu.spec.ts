import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`Lu controls work at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      const demo = page.locator('[data-lu-demo]')
      const mascot = demo.locator('[data-lu-mascot]')
      await demo.scrollIntoViewIfNeeded()
      await expect(mascot).toHaveAttribute('data-lu-ready', 'true')
      await expect(demo.getByRole('button', { name: 'Play Lu animation' })).toBeEnabled()
      await demo.getByRole('button', { name: 'Thinking', exact: true }).press('Enter')
      await expect(mascot).toHaveAttribute('data-lu-state', 'thinking')
      await expect.poll(() => mascot.getAttribute('data-lu-frame')).not.toBe('0')
      await demo.getByRole('button', { name: 'Pause Lu animation' }).click()
      const frame = await mascot.getAttribute('data-lu-frame')
      await page.waitForTimeout(300)
      await expect(mascot).toHaveAttribute('data-lu-frame', frame ?? '')
      await demo.getByRole('button', { name: 'Celebrate', exact: true }).click()
      await expect(mascot).toHaveAttribute('data-lu-state', 'celebration')
      await expect(mascot).toHaveAttribute('data-lu-state', 'idle')
      await expect(demo.getByRole('button', { name: 'Idle', exact: true })).toHaveAttribute('aria-pressed', 'true')
      await demo.getByRole('button', { name: 'Pause Lu animation' }).click()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
      await page.locator('.home-lu').screenshot({ path: testInfo.outputPath('lu-section.png') })
      await page.screenshot({ path: testInfo.outputPath('home-after.png'), fullPage: true })

      // The site's client router must destroy the old instance and mount the new one.
      await page.getByRole('link', { name: 'Bring Lu to your project' }).click()
      await expect(page).toHaveURL('/docs/lu')
      const guide = page.locator('[data-lu-demo]')
      await guide.scrollIntoViewIfNeeded()
      await expect(guide.locator('[data-lu-mascot]')).toHaveAttribute('data-lu-ready', 'true')
      await guide.getByRole('button', { name: 'Thinking', exact: true }).click()
      await expect(guide.locator('[data-lu-mascot]')).toHaveAttribute('data-lu-state', 'thinking')
    })
  }
}

test('Lu keeps reduced-motion poses selectable and updates an existing player when the preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/lu')
  const demo = page.locator('[data-lu-demo]')
  const mascot = demo.locator('[data-lu-mascot]')
  await demo.scrollIntoViewIfNeeded()
  await expect(mascot).toHaveAttribute('data-lu-ready', 'true')
  await demo.getByRole('button', { name: 'Thinking', exact: true }).click()
  await expect(demo.getByRole('status')).toContainText('Reduced motion')
  await expect(demo.locator('[data-lu-playback]')).toBeDisabled()
  await page.waitForTimeout(600)
  await expect(mascot).toHaveAttribute('data-lu-frame', '0')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(demo.locator('[data-lu-playback]')).toBeEnabled()
  await expect.poll(() => mascot.getAttribute('data-lu-frame')).not.toBe('0')
})

test('Lu retains its accessible still when the atlas cannot load', async ({ page }) => {
  await page.route('**/*lu-sprites*', route => route.abort())
  await page.goto('/docs/lu')
  const demo = page.locator('[data-lu-demo]')
  await demo.scrollIntoViewIfNeeded()
  await expect(demo.getByRole('status')).toContainText('Refresh')
  await expect(demo.locator('[data-lu-mascot] > img')).toBeVisible()
  await expect(demo.locator('[data-lu-controls]')).toHaveAttribute('inert', '')
})

test.describe('Lu without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('preserves the mascot, description and integration link', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('.home-lu')
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByRole('img', { name: /Lu, Lumen/ })).toBeVisible()
    await expect(section.locator('[data-lu-mascot] > img')).toBeVisible()
    await expect(section.getByRole('link', { name: 'Bring Lu to your project' })).toBeVisible()
    await expect(section.locator('[data-lu-controls]')).toHaveAttribute('inert', '')
  })
})

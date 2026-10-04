import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`visual guides work at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const visit = async (route: string) => {
        await page.goto(route)
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      }
      const checkOverflow = async () => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
      }

      await visit('/docs/frameworks/react')
      const react = page.locator('[data-framework-example="react"]')
      await expect(react.getByText('68% verified', { exact: true })).toBeVisible()
      await react.getByRole('button', { name: 'Advance', exact: true }).click()
      await expect(react.getByText('76% verified', { exact: true })).toBeVisible()
      await react.getByRole('tab', { name: 'Behavior', exact: true }).focus()
      await page.keyboard.press('ArrowRight')
      await expect(react.getByRole('tab', { name: 'Delivery', exact: true })).toHaveAttribute('aria-selected', 'true')
      await checkOverflow()

      await visit('/docs/frameworks/elements')
      const elements = page.locator('[data-framework-example="elements"]')
      await expect(elements.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('tabindex', '0')
      await elements.getByRole('tab', { name: 'Overview', exact: true }).focus()
      await page.keyboard.press('ArrowRight')
      await expect(elements.getByRole('tabpanel', { name: 'Activity', exact: true })).toBeVisible()
      await expect(elements.getByRole('tab', { name: 'Activity', exact: true })).toBeFocused()
      await checkOverflow()

      for (const integration of ['react-hook-form', 'astro-actions', 'elements']) {
        await visit(`/docs/forms/${integration}`)
        const demo = page.locator('[data-form-state-example]')
        const email = demo.getByRole('textbox', { name: 'Demo email' })
        const submit = demo.getByRole('button', { name: 'Try submission', exact: true })
        const status = demo.getByRole('status')
        await submit.click()
        await expect(email).toHaveAttribute('aria-invalid', 'true')
        await expect(email).toBeFocused()
        await expect(demo.getByText('Enter your email address.', { exact: true })).toBeVisible()
        await email.fill('invalid')
        await submit.click()
        await expect(demo.getByText('Enter a valid email address.', { exact: true })).toBeVisible()
        await email.fill('maya@example.com')
        await demo.getByRole('button', { name: 'Simulate request failure' }).click()
        await expect(demo.locator('form')).toHaveAttribute('aria-busy', 'true')
        await expect(submit).toBeDisabled()
        await expect(email).toBeDisabled()
        await expect(status).toContainText('simulated request failed')
        await expect(email).toHaveValue('maya@example.com')
        await submit.click()
        await expect(status).toContainText('Success!')
        await demo.getByRole('button', { name: 'Reset demo' }).click()
        await expect(email).toHaveValue('')
        await expect(email).not.toHaveAttribute('aria-invalid', 'true')
        await expect(status).toContainText('Demo reset')
        await checkOverflow()
      }

      await visit('/docs/foundations')
      await expect(page.getByRole('heading', { name: 'Space, type, and surface' })).toBeVisible()
      await page.getByRole('button', { name: 'Replay motion' }).click()
      await expect(page.locator('[data-motion-status]')).toContainText('Reduced motion is enabled')
      const markerTransforms = await page.locator('[data-motion-marker]').evaluateAll(markers => markers.map(marker => getComputedStyle(marker).transform))
      expect(markerTransforms).toEqual(['none', 'none', 'none'])
      await checkOverflow()

      await visit('/docs/migrations/v3-to-v4')
      const gaps = await page.locator('[data-spacing-sample]').evaluateAll(samples => samples.map(sample => getComputedStyle(sample).gap))
      expect(gaps).toEqual(['24px', '16px', '24px'])
      await page.getByRole('tab', { name: 'After · v4', exact: true }).click()
      await expect(page.getByRole('tabpanel', { name: 'After · v4', exact: true })).toContainText('gap="xl"')
      await checkOverflow()
    })
  }
}

test('motion replay follows the live timing tokens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/docs/foundations')
  await page.getByRole('button', { name: 'Replay motion' }).click()
  const durations = await page.locator('[data-motion-marker]').evaluateAll(markers => markers.map(marker => marker.getAnimations()[0]?.effect?.getTiming().duration))
  expect(durations).toEqual([120, 160, 300])
  await page.locator('[data-motion-marker]').evaluateAll(markers => {
    for (const marker of markers) {
      if (marker instanceof HTMLElement) marker.style.setProperty('--example-duration', '240ms')
    }
  })
  await page.getByRole('button', { name: 'Replay motion' }).click()
  const customDurations = await page.locator('[data-motion-marker]').evaluateAll(markers => markers.map(marker => marker.getAnimations()[0]?.effect?.getTiming().duration))
  expect(customDurations).toEqual([240, 240, 240])
})

test('form simulator stays inert without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } })
  const page = await context.newPage()
  await page.goto('/docs/forms/astro-actions')
  const demo = page.locator('[data-form-state-example]')
  await expect(demo.locator('form')).toHaveAttribute('inert', '')
  await expect(demo.getByRole('status')).toContainText('Enable JavaScript')
  await context.close()
})

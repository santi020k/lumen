import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`runtime guides demonstrate keyboard behavior (${width}, ${theme})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })

      for (const route of ['/docs/web', '/docs/frameworks/astro']) {
        await page.goto(route)
        await page.evaluate(value => {
          document.documentElement.dataset.theme = value
        }, theme)
        const examples = page.locator('[data-runtime-examples]')
        const overview = examples.getByRole('tab', { name: 'Overview', exact: true })
        await overview.focus()
        await page.keyboard.press('ArrowRight')
        await expect(examples.getByRole('tab', { name: 'Activity', exact: true })).toHaveAttribute('aria-selected', 'true')
        await expect(examples.getByRole('tabpanel', { name: 'Activity' })).toHaveText('No new activity today.')

        const trigger = examples.getByRole('button', { name: 'Open workspace help' })
        await trigger.click()
        const dialog = page.getByRole('dialog', { name: 'Workspace help' })
        await expect(dialog).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(dialog).not.toBeVisible()
        await expect(trigger).toBeFocused()
        await trigger.click()
        await Promise.all([
          dialog.evaluate(element => new Promise<void>(resolve => {
            element.addEventListener('close', () => { resolve(); }, { once: true })
          })),
          dialog.getByRole('button', { name: 'Close help' }).click()
        ])
        await expect(trigger).toBeFocused()

        const summary = examples.locator('summary')
        await summary.focus()
        await page.keyboard.press('Enter')
        await expect(examples.locator('details')).toHaveAttribute('open', '')
        await expect(examples.getByText('Native details can open and close without the runtime.', { exact: true })).toBeVisible()

        const disclosureLayout = await examples.locator('details').evaluate(element => {
          const heading = element.querySelector('summary')
          const body = element.querySelector('p')
          if (!heading || !body) throw new Error('Expected a disclosure heading and body')

          const itemBox = element.getBoundingClientRect()
          const bodyBox = body.getBoundingClientRect()
          const headingStyle = getComputedStyle(heading)
          const indicatorStyle = getComputedStyle(heading, '::before')
          return {
            bodyInset: bodyBox.left - itemBox.left,
            headingInset: heading.getBoundingClientRect().left + Number.parseFloat(headingStyle.paddingLeft) - itemBox.left,
            indicatorTransform: indicatorStyle.transform,
            rightInset: itemBox.right - bodyBox.right
          }
        })
        // The page resets paragraph margins; the disclosure still owns its content inset.
        expect(disclosureLayout.bodyInset).toBeGreaterThanOrEqual(16)
        expect(disclosureLayout.rightInset).toBeGreaterThanOrEqual(16)
        expect(Math.abs(disclosureLayout.bodyInset - disclosureLayout.headingInset)).toBeLessThan(1)
        expect(disclosureLayout.indicatorTransform).toBe('none')
        await expect(summary).toHaveCSS('outline-width', '2px')

        await page.keyboard.press('Space')
        await expect(examples.locator('details')).not.toHaveAttribute('open')
        await expect(examples.getByText('Native details can open and close without the runtime.', { exact: true })).not.toBeVisible()

        await examples.getByRole('tab', { name: 'Dialog', exact: true }).click()
        await expect(examples.locator('[role="tabpanel"][data-value="dialog"]')).toContainText('aria-labelledby')
        expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
      }
    })
  }
}

test('native disclosure works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } })
  const page = await context.newPage()
  await page.goto('/docs/frameworks/astro')
  const examples = page.locator('[data-runtime-examples]')
  await examples.locator('summary').click()
  await expect(examples.getByText('Native details can open and close without the runtime.', { exact: true })).toBeVisible()
  await context.close()
})

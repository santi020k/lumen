import { expect, type Page, test } from '@playwright/test'

test('ordinary navigation retains every native Tab stop after runtime reinitialization', async ({ page }) => {
  await page.goto('/docs/components/navigation-menu')
  const links = page.locator('.component-doc-preview [data-ui-navigation-menu] a[href]')
  expect(await links.count()).toBeGreaterThan(1)
  for (const event of ['astro:after-swap', 'astro:page-load']) {
    await page.evaluate(name => { document.dispatchEvent(new Event(name)) }, event)
    await links.first().focus()
    for (let index = 1; index < await links.count(); index += 1) {
      await page.keyboard.press('Tab')
      await expect(links.nth(index)).toBeFocused()
    }
    await page.keyboard.press('Shift+Tab')
    await expect(links.nth(await links.count() - 2)).toBeFocused()
  }
})

const openRuntimeFixture = async (page: Page, markup: string) => {
  await page.goto('/docs/components/code')
  const runtime = await page.locator('script[src*="UIPrimitives"]').getAttribute('src')
  if (!runtime) throw new Error('Expected the built Astro runtime module')
  await page.route('**/__documentation-controls-test__', route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Documentation controls</title></head><body>${markup}<script type="module" src="${runtime}"></script></body></html>`
  }))
  await page.goto('/__documentation-controls-test__')
  await page.waitForFunction(() => 'LumenInitUiPrimitives' in window && typeof window.LumenInitUiPrimitives === 'function')
}

test('controlled theme initialization preserves the host theme despite stale storage', async ({ page }) => {
  await openRuntimeFixture(page, `
    <script>
      document.documentElement.dataset.theme = 'host-light';
      localStorage.setItem('controlled-theme-test', 'host-dark');
    </script>
    <button data-ui-theme-toggle data-ui-controlled data-storage-key="controlled-theme-test" data-light-theme="host-light" data-dark-theme="host-dark">Theme</button>
  `)
  const toggle = page.getByRole('button', { name: 'Theme' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'host-light')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'host-light')
})

test('code copy announces denied access and unwrapped highlighted content is keyboard reachable', async ({ page }) => {
  await openRuntimeFixture(page, '<figure class="ui-code ui-code--block" data-ui-code data-code-label="Example source"><button type="button" data-ui-code-copy data-copy-label="Copy snippet" data-copy-error-label="Select and copy manually.">Copy snippet</button><pre><code>pnpm install</code></pre></figure>')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Denied')) } })
  })
  const copy = page.locator('[data-ui-code-copy]')
  await copy.click()
  await expect(copy).toHaveAttribute('data-state', 'error')
  await expect(copy).toHaveAttribute('aria-label', 'Select and copy manually.')
  await expect(page.locator('[aria-live="polite"]')).toHaveText('Select and copy manually.')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('region', { name: 'Example source' })).toBeFocused()
})

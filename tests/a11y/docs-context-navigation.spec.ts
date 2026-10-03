import { expect, test } from '@playwright/test'

test('shared Select names its list from the visible label and activates with Space', async ({ page }) => {
  await page.goto('/docs/components/select')

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.getByRole('combobox', { name: 'Framework', exact: true })

  await trigger.focus()
  await page.keyboard.press('Space')
  await expect(preview.getByRole('listbox', { name: 'Framework', exact: true })).toBeVisible()
  await expect(preview.getByRole('option', { name: 'Astro', exact: true })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveText('Astro')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(preview.locator('select[name="framework"]')).toHaveValue('astro')
})

for (const startOnOption of [false, true]) {
  test(`shared Select closes when Tab leaves its ${startOnOption ? 'option' : 'trigger'}`, async ({ page }) => {
    await page.goto('/docs/components/select')

    const preview = page.locator('.component-doc-preview')
    const trigger = preview.getByRole('combobox', { name: 'Framework', exact: true })

    if (startOnOption) {
      await trigger.focus()
      await page.keyboard.press('Space')
      await expect(preview.getByRole('option', { name: 'Astro', exact: true })).toBeFocused()
    } else {
      await trigger.click()
      await expect(trigger).toBeFocused()
    }

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(preview.getByRole('combobox', { name: 'Region', exact: true })).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(preview.locator('#ex-select-framework-listbox')).toBeHidden()
  })
}

test('shared Select keeps internal focus movement open and clears search for keyboard selection', async ({ page }) => {
  await page.goto('/docs/components/select')

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.getByRole('combobox', { name: 'Framework', exact: true })

  await trigger.focus()
  await page.keyboard.press('Space')
  await expect(preview.getByRole('option', { name: 'Astro', exact: true })).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.type('Web Components')
  await expect(preview.getByRole('option', { name: 'Web Components', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(preview.getByRole('option', { name: 'React', exact: true })).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Space')
  await expect(trigger).toHaveText('React')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(preview.locator('select[name="framework"]')).toHaveValue('react')
})

test('documentation scope uses the shared keyboard picker and remembers navigation', async ({ page }) => {
  await page.goto('/docs/web')

  const trigger = page.getByRole('combobox', { name: 'Choose documentation scope' })

  await expect(trigger).toHaveJSProperty('tagName', 'BUTTON')
  await expect(trigger).toHaveText('Web')
  await expect(trigger).not.toHaveCSS('background-image', 'none')
  await page.getByText('Documentation scope', { exact: true }).click()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('option', { name: 'Web', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await trigger.click()
  await expect(page.getByRole('listbox', { name: 'Choose documentation scope' })).toBeVisible()
  await page.getByRole('option', { name: 'Apple', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/\/docs\/apple$/u)
  await expect(trigger).toHaveText('Apple')
  expect(await page.evaluate(() => localStorage.getItem('lumen-docs-platform'))).toBe('/docs/apple')

  await trigger.click()
  await page.getByRole('option', { name: 'Project overview', exact: true }).click()
  await expect(page).toHaveURL(/\/docs$/u)
  expect(await page.evaluate(() => localStorage.getItem('lumen-docs-platform'))).toBeNull()
})

test('documentation scope typeahead supports option names containing spaces', async ({ page }) => {
  await page.goto('/docs/web')
  await page.getByRole('combobox', { name: 'Choose documentation scope' }).focus()
  await page.keyboard.type('React Native')
  await expect(page.getByRole('option', { name: 'React Native', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Space')
  await expect(page.getByRole('option', { name: 'Web', exact: true })).toBeFocused()
  await page.keyboard.type('React Native')
  await expect(page.getByRole('option', { name: 'React Native', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/docs\/react-native$/u)
})

test('documentation scope still navigates when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'SecurityError') }
    Storage.prototype.removeItem = () => { throw new DOMException('Storage unavailable', 'SecurityError') }
  })
  await page.goto('/docs/web')
  await expect(page.getByRole('combobox', { name: 'Choose documentation scope' })).toHaveText('Web')
  await page.getByRole('combobox', { name: 'Choose documentation scope' }).click()
  await page.getByRole('option', { name: 'Apple', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/apple$/u)
  await expect(page.getByRole('combobox', { name: 'Choose documentation scope' })).toHaveText('Apple')
  await page.getByRole('combobox', { name: 'Choose documentation scope' }).click()
  await page.getByRole('option', { name: 'Project overview', exact: true }).click()
  await expect(page).toHaveURL(/\/docs$/u)
})

test('documentation scope keeps its native fallback and direct links without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false })

  try {
    const page = await context.newPage()

    await page.goto('/docs/web')

    const native = page.getByRole('combobox', { name: 'Choose documentation scope' })

    await expect(native).toHaveJSProperty('tagName', 'SELECT')
    await expect(native).toBeVisible()
    await expect(native).toHaveValue('/docs/web')
    await expect(native.locator('option')).toHaveCount(6)
    await page.getByRole('navigation', { name: 'Web documentation' }).getByRole('link', { name: 'React', exact: true }).click()
    await expect(page).toHaveURL(/\/docs\/frameworks\/react$/u)
  } finally {
    await context.close()
  }
})

for (const width of [320, 390, 896, 1440]) {
  for (const theme of ['lumen-light', 'lumen-dark', 'santi020k-light', 'santi020k-dark']) {
    test(`documentation scope menu fits ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(value => { localStorage.setItem('lumen-theme', value) }, theme)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/docs/foundations')

      const trigger = page.getByRole('combobox', { name: 'Choose documentation scope' })
      const label = trigger.locator('[data-ui-select-value]')

      await expect(trigger).toHaveJSProperty('tagName', 'BUTTON')
      await expect(trigger).toHaveText('Shared foundations')
      const native = page.locator('#docs-context-platform-select')

      await expect(native).toHaveAttribute('aria-hidden', 'true')
      await expect(native).toHaveAttribute('tabindex', '-1')
      await expect(native).toHaveCSS('opacity', '0')
      await expect(native).toHaveCSS('pointer-events', 'none')
      expect(await label.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      expect((await trigger.boundingBox())?.height).toBeGreaterThanOrEqual(44)
      await trigger.click()

      const list = page.locator('#docs-context-platform-select-listbox')

      await expect(list).toBeVisible()
      await expect(list).toHaveCSS('transform', 'none')
      await expect(list).toHaveCSS('opacity', '1')
      expect(await list.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true)
      await expect(list.getByRole('option')).toHaveCount(6)

      for (const option of await list.getByRole('option').all()) {
        expect((await option.boundingBox())?.height).toBeGreaterThanOrEqual(44)
      }

      const bounds = await list.boundingBox()

      if (!bounds) throw new Error('Expected a visible documentation scope menu')

      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
      expect(bounds.y).toBeGreaterThanOrEqual(0)
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(900)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await page.screenshot({
        path: testInfo.outputPath(`scope-menu-${theme}-${width}.png`),
        clip: { x: 0, y: 0, width: Math.min(width, 960), height: 540 }
      })
    })
  }
}


test('context navigation example demonstrates the styled Select menu', async ({ page }) => {
  await page.goto('/docs/components/context-navigation')

  const preview = page.locator('.component-doc-preview')
  const trigger = preview.getByRole('combobox', { name: 'Documentation for' })

  await expect(trigger).toHaveJSProperty('tagName', 'BUTTON')
  await expect(trigger).toHaveText('Web')
  await trigger.press('Space')
  await expect(preview.getByRole('listbox', { name: 'Documentation for' })).toBeVisible()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(trigger).toHaveText('Android')
  await expect(preview.locator('#context-navigation-example')).toHaveValue('Android')
})


test('documentation scope scrolls within short windows and keeps keyboard options reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 430 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/foundations')

  const trigger = page.getByRole('combobox', { name: 'Choose documentation scope' })
  const list = page.getByRole('listbox', { name: 'Choose documentation scope' })

  await trigger.press('End')
  await expect(list).toHaveCSS('transform', 'none')
  await expect(list.getByRole('option', { name: 'Android', exact: true })).toBeFocused()

  const bounds = await list.boundingBox()

  if (!bounds) throw new Error('Expected a visible scope menu in the short window')

  expect(bounds.y + bounds.height).toBeLessThanOrEqual(430)
  expect(await list.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(list).toBeHidden()
})

import { expect, type Page, test } from '@playwright/test'

const createSignal = (): { promise: Promise<void>; release: () => void } => {
  let release = (): void => undefined
  const promise = new Promise<void>(resolve => {
    release = resolve
  })

  return { promise, release }
}

const openGlobalSearch = async (page: Page) => {
  await page.getByRole('button', { name: 'Search Lumen', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: 'Search Lumen', exact: true })

  await expect(dialog).toBeVisible()

  return { dialog, input: page.locator('#global-docs-search-input') }
}

for (const failure of ['http', 'json', 'shape'] as const) {
  test(`search retries after a ${failure} failure`, async ({ page }) => {
    let shouldFail = true

    await page.route('**/docs-search.json', route => {
      if (!shouldFail) return route.continue()

      if (failure === 'http') return route.fulfill({ status: 503, body: 'Service unavailable' })

      return route.fulfill({
        contentType: 'application/json',
        body: failure === 'json' ? '{not valid json' : '[{"title":"Incomplete"}]'
      })
    })
    await page.goto('/docs')

    const { input } = await openGlobalSearch(page)
    const results = page.locator('#global-docs-search-results')

    await input.fill('button')
    await expect(results.getByRole('alert')).toBeVisible()
    await expect(results).not.toContainText('No results')
    await expect(results.getByRole('option')).toHaveCount(0)

    shouldFail = false

    await input.fill('card')
    await expect(results.getByRole('option').first()).toBeVisible()
    await expect(results.getByRole('alert')).toHaveCount(0)
  })
}

test('keyboard handling prevents the native key action before a pending index resolves', async ({ page }) => {
  const requested = createSignal()
  const releaseResponse = createSignal()

  await page.route('**/docs-search.json', async route => {
    requested.release()

    await releaseResponse.promise
    await route.continue()
  })
  await page.goto('/docs')

  const { input } = await openGlobalSearch(page)

  await input.fill('button')
  await requested.promise

  const prevented = await input.evaluate(element => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' })

    element.dispatchEvent(event)

    return event.defaultPrevented
  })

  expect(prevented).toBe(true)

  releaseResponse.release()

  await expect(page.locator('#global-docs-search-results').getByRole('option').first()).toBeVisible()
})

test('Enter cannot activate stale quick commands while a search is loading', async ({ page }) => {
  const requested = createSignal()
  const releaseResponse = createSignal()

  await page.route('**/docs-search.json', async route => {
    requested.release()

    await releaseResponse.promise
    await route.continue()
  })
  await page.goto('/docs')

  const { input, dialog } = await openGlobalSearch(page)

  await input.fill('button')
  await requested.promise
  await input.press('Enter')
  await expect(page).toHaveURL(/\/docs$/u)
  await expect(dialog).toBeVisible()
  await expect(input).toHaveValue('button')

  releaseResponse.release()

  await expect(page.locator('#global-docs-search-results').getByRole('option').first()).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL(/\/docs\/components\/button$/u)
})

test('the global search hotkey toggles once after each completed client navigation', async ({ page }) => {
  const controllerRequested = createSignal()
  const releaseController = createSignal()

  await page.route('**/dialogs.*.js', async route => {
    controllerRequested.release()

    await releaseController.promise
    await route.continue()
  })

  try {
    await page.goto('/docs', { waitUntil: 'domcontentloaded' })
    await controllerRequested.promise

    for (const label of ['Guides', 'Templates', 'Community', 'Docs']) {
      const destination = page.getByRole('navigation', { name: 'Primary', exact: true })
        .getByRole('link', { name: label, exact: true })

      await destination.click()
      await expect(destination).toHaveAttribute('aria-current', 'page')

      releaseController.release()

      await expect(page.getByRole('button', { name: 'Search Lumen', exact: true }))
        .toHaveAttribute('data-ui-bound', 'true')
      await page.keyboard.press('Control+k')
      await expect(page.getByRole('dialog', { name: 'Search Lumen', exact: true })).toBeVisible()
      await page.keyboard.press('Control+k')
      await expect(page.getByRole('dialog', { name: 'Search Lumen', exact: true })).toBeHidden()
    }
  } finally {
    releaseController.release()
  }
})

for (const dismissal of ['outside click', 'Escape', 'hotkey', 'clear'] as const) {
  test(`a pending response stays dismissed after ${dismissal}`, async ({ page }) => {
    const requested = createSignal()
    const releaseResponse = createSignal()

    await page.route('**/docs-search.json', async route => {
      requested.release()

      await releaseResponse.promise
      await route.continue()
    })
    await page.goto('/docs')

    const { input, dialog } = await openGlobalSearch(page)
    const results = page.locator('#global-docs-search-results')

    await input.fill('button')
    await requested.promise

    if (dismissal === 'outside click') {
      await page.getByRole('heading', { name: 'Search Lumen', exact: true }).click()
      await expect(dialog).toBeVisible()
    } else if (dismissal === 'clear') {
      await dialog.getByRole('button', { name: 'Clear search', exact: true }).click()
      await expect(input).toHaveValue('')
    } else {
      await input.press(dismissal === 'Escape' ? 'Escape' : 'Control+k')
      await expect(dialog).toBeHidden()
    }

    const response = page.waitForResponse('**/docs-search.json')

    releaseResponse.release()

    await (await response).finished()
    await page.evaluate(() => new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => { resolve(); }))
    }))

    if (dismissal === 'clear') {
      await expect(results).toContainText('Browse components')
      await expect(results.getByRole('option', { name: /Button/u })).toHaveCount(0)
    } else {
      await expect(results).toBeHidden()
      await expect(input).toHaveAttribute('aria-expanded', 'false')
    }
  })
}

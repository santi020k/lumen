import { expect, type Page, test } from '@playwright/test'

const dispatchToastEvent = (page: Page, type: string, detail: Record<string, unknown>): Promise<void> => page.evaluate(({ type, detail }) => {
  document.dispatchEvent(new CustomEvent(type, { detail }))
}, { type, detail })

const invokeLumenInitUiPrimitives = (page: Page): Promise<void> => page.evaluate(() => {
  (window as Window & { LumenInitUiPrimitives?: (scope?: ParentNode) => void }).LumenInitUiPrimitives?.()
})

const navigateViaHeader = async (page: Page, label: string, urlPattern: RegExp): Promise<void> => {
  await page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: label, exact: true }).click()

  await expect(page).toHaveURL(urlPattern)
}

test('a single ui:toast event creates exactly one toast after one client-side navigation', async ({ page }) => {
  await page.goto('/docs')
  await navigateViaHeader(page, 'Guides', /\/guides$/)

  await dispatchToastEvent(page, 'ui:toast', {
    description: 'One event should create one toast',
    duration: 0,
    title: 'Lifecycle probe'
  })

  const toasts = page.locator('[data-ui-toast]')

  await expect(toasts).toHaveCount(1)
  await expect(toasts).toContainText('Lifecycle probe')
  await expect(toasts).toContainText('One event should create one toast')
})

test('a single ui:toast event still creates exactly one toast after several client-side page changes', async ({ page }) => {
  await page.goto('/docs')
  await navigateViaHeader(page, 'Guides', /\/guides$/)
  await navigateViaHeader(page, 'Templates', /\/templates$/)
  await navigateViaHeader(page, 'Community', /\/community$/)
  await navigateViaHeader(page, 'Docs', /\/docs$/)

  await dispatchToastEvent(page, 'ui:toast', {
    description: 'One event should create one toast',
    duration: 0,
    title: 'Lifecycle probe'
  })

  await expect(page.locator('[data-ui-toast]')).toHaveCount(1)
})

test('create, update, and dismiss toast events stay idempotent after navigation and repeated LumenInitUiPrimitives calls', async ({ page }) => {
  await page.goto('/docs')
  await navigateViaHeader(page, 'Guides', /\/guides$/)

  // Other code paths may call the global init hook again after navigation; it must stay a no-op
  // for the document-level toast API instead of installing a second set of listeners.
  await invokeLumenInitUiPrimitives(page)
  await invokeLumenInitUiPrimitives(page)

  await dispatchToastEvent(page, 'ui:toast', {
    description: 'Created once',
    duration: 0,
    id: 'nav-lifecycle-toast',
    title: 'Lifecycle probe'
  })

  const toast = page.locator('#nav-lifecycle-toast')

  await expect(page.locator('[data-ui-toast]')).toHaveCount(1)
  await expect(toast).toContainText('Created once')

  await dispatchToastEvent(page, 'ui:toast-update', {
    description: 'Updated in place',
    id: 'nav-lifecycle-toast',
    title: 'Lifecycle probe updated'
  })

  await expect(page.locator('[data-ui-toast]')).toHaveCount(1)
  await expect(toast).toContainText('Lifecycle probe updated')
  await expect(toast).toContainText('Updated in place')

  await dispatchToastEvent(page, 'ui:toast-dismiss', { id: 'nav-lifecycle-toast' })

  await expect(page.locator('[data-ui-toast]')).toHaveCount(0)
})

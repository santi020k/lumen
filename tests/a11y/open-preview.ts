import { expect, type Page } from '@playwright/test'

export const openPreview = async (page: Page, slug: string): Promise<void> => {
  // The v5 Astro runtime loads controllers asynchronously after rendering the preview.
  await page.addInitScript(() => {
    document.addEventListener('ui:ready', () => performance.mark('lumen-preview-ready'), { once: true })
  })
  await page.goto(`/docs/components/${slug}`)
  await page.waitForFunction(() => performance.getEntriesByName('lumen-preview-ready', 'mark').length > 0)
  await expect(page.locator('.component-doc-preview')).toBeVisible()
}

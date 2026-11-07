import { expect, type Page } from '@playwright/test'

export const openEnhancedPage = async (page: Page, path: string): Promise<void> => {
  // The v5 Astro runtime loads controllers asynchronously after rendering the preview.
  await page.addInitScript(() => {
    document.addEventListener('ui:ready', () => performance.mark('lumen-preview-ready'), { once: true })
  })
  await page.goto(path)
  await page.waitForFunction(() => performance.getEntriesByName('lumen-preview-ready', 'mark').length > 0)
}

export const openPreview = async (page: Page, slug: string): Promise<void> => {
  await openEnhancedPage(page, `/docs/components/${slug}`)
  await expect(page.locator('.component-doc-preview')).toBeVisible()
}

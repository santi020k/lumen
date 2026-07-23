import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

const examplesDirectory = join(process.cwd(), 'apps/docs/src/examples')
const componentSlugs = readdirSync(examplesDirectory)
  .filter(fileName => fileName.endsWith('.astro'))
  .map(fileName => fileName
    .replace('.astro', '')
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase())
  .sort((left, right) => left.localeCompare(right))

for (const slug of componentSlugs) {
  test(`${slug} renders its live preview without client errors`, async ({ page }) => {
    const pageErrors: string[] = []

    page.on('pageerror', error => pageErrors.push(error.message))

    await page.goto(`/docs/components/${slug}`)

    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('[aria-labelledby="preview-title"]')).toBeVisible()
    await expect(page.getByText('An error occurred.', { exact: true })).toHaveCount(0)
    expect(pageErrors).toEqual([])
  })
}

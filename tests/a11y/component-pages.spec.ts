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
    const preview = page.locator('.component-doc-preview')

    await expect(preview).toBeVisible()
    await expect(page.getByText('An error occurred.', { exact: true })).toHaveCount(0)

    const invalidGeometry = await preview.evaluate((previewElement) => {
      const roots = [...previewElement.children]
        .filter(element => !['SCRIPT', 'STYLE'].includes(element.tagName))

      return roots.flatMap((root) => {
        const rootRect = root.getBoundingClientRect()
        const visibleDescendants = [...root.querySelectorAll('*')]
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return style.display !== 'none'
              && style.visibility !== 'hidden'
              && rect.width > 0
              && rect.height > 0
          })

        const descendantRects = visibleDescendants.map(element => element.getBoundingClientRect())
        const contentBounds = descendantRects.reduce((bounds, rect) => ({
          bottom: Math.max(bounds.bottom, rect.bottom),
          left: Math.min(bounds.left, rect.left),
          right: Math.max(bounds.right, rect.right),
          top: Math.min(bounds.top, rect.top),
        }), {
          bottom: rootRect.bottom,
          left: rootRect.left,
          right: rootRect.right,
          top: rootRect.top,
        })
        const rootArea = rootRect.width * rootRect.height
        const contentArea = (contentBounds.right - contentBounds.left)
          * (contentBounds.bottom - contentBounds.top)
        const descendantsEscapeRoot = contentArea > rootArea * 4

        const isAccidentallyConstrained = rootRect.width > 1
          && rootRect.height > 1
          && Math.max(rootRect.width, rootRect.height) <= 64
          && descendantsEscapeRoot

        return isAccidentallyConstrained
          ? [{
              className: root.className,
              descendantsEscapeRoot,
              height: rootRect.height,
              width: rootRect.width,
            }]
          : []
      })
    })

    const brokenImages = await preview.locator('img').evaluateAll(images =>
      images
        .filter(image => !image.getAttribute('src') || (image.complete && image.naturalWidth === 0))
        .map(image => image.getAttribute('src')))

    expect(invalidGeometry).toEqual([])
    expect(brokenImages).toEqual([])
    expect(pageErrors).toEqual([])
  })
}

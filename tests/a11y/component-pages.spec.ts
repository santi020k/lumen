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

    const accessibilityContract = await preview.evaluate((previewElement) => {
      const controls = [
        ...previewElement.querySelectorAll<HTMLElement>(
          'button, input:not([type="hidden"]), select, textarea, [role="button"], [role="combobox"], [role="menuitem"], [role="option"], [role="radio"], [role="switch"], [role="tab"]'
        )
      ]

      // Accessible-name fallbacks intentionally mirror the relevant browser naming paths.
      // eslint-disable-next-line complexity
      const getControlName = (control: HTMLElement) => {
        const labelledBy = control.getAttribute('aria-labelledby')
          ?.split(/\s+/)
          .map(id => document.getElementById(id)?.textContent.trim())
          .filter(Boolean)
          .join(' ')
        const labelledByText = labelledBy?.trim()

        if (labelledByText) return labelledByText

        const id = control.id
        const explicitLabel = id
          ? previewElement.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`)?.textContent.trim()
          : undefined

        return (
          control.getAttribute('aria-label')?.trim()
          || explicitLabel
          || control.closest('label')?.textContent.trim()
          || control.textContent.trim()
          || control.getAttribute('title')?.trim()
          || control.getAttribute('placeholder')?.trim()
          || ''
        )
      }

      const unlabeledControls = controls
        .filter(control => !getControlName(control))
        .map(control => ({
          className: control.className,
          role: control.getAttribute('role'),
          tag: control.tagName.toLowerCase()
        }))

      const ids = [...previewElement.querySelectorAll<HTMLElement>('[id]')].map(element => element.id)
      const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
      const missingHashReferences = [...previewElement.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
        .map(anchor => anchor.hash.slice(1))
        .filter(id => id && !document.getElementById(decodeURIComponent(id)))

      const missingAriaReferences = [
        ...previewElement.querySelectorAll<HTMLElement>(
          '[aria-controls], [aria-describedby], [aria-labelledby], [aria-owns]'
        )
      ].flatMap((element) => {
        const attributes = ['aria-controls', 'aria-describedby', 'aria-labelledby', 'aria-owns']

        return attributes.flatMap((attribute) => {
          const value = element.getAttribute(attribute)

          if (!value) return []

          return value
            .split(/\s+/)
            .filter(id => !document.getElementById(id))
            .map(id => ({ attribute, id, tag: element.tagName.toLowerCase() }))
        })
      })

      return {
        duplicateIds,
        missingAriaReferences,
        missingHashReferences,
        unlabeledControls
      }
    })

    expect(invalidGeometry).toEqual([])
    expect(brokenImages).toEqual([])
    expect(accessibilityContract.duplicateIds).toEqual([])
    expect(accessibilityContract.missingAriaReferences).toEqual([])
    expect(accessibilityContract.missingHashReferences).toEqual([])
    expect(accessibilityContract.unlabeledControls).toEqual([])
    expect(pageErrors).toEqual([])
  })
}

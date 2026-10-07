import { expect, test } from '@playwright/test'

import { lumenComponentNames } from '../../packages/core/src/components.js'

const examples = lumenComponentNames

for (const width of [390, 1440]) {
  test.describe(`component docs at ${width}px`, () => {
    test.use({ viewport: { height: 900, width } })

    for (const name of examples) {
      test(`contains the ${name} page within the viewport`, async ({ page }) => {
        const slug = name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

        await page.goto(`/docs/components/${slug}`)
        await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible()

        const dimensions = await page.evaluate(() => ({
          available: window.innerWidth,
          content: document.documentElement.scrollWidth
        }))

        expect(dimensions.content).toBeLessThanOrEqual(dimensions.available + 1)
        await expect(page.getByRole('table', { name: 'API reference', exact: true })).toBeVisible()
        await expect(page.getByRole('group', { name: 'API reference', exact: true }).and(page.locator('[tabindex]')))
          .toHaveAttribute('tabindex', '0')
      })
    }
  })
}

for (const name of ['Card', 'Calendar', 'CoverImage', 'Stat', 'AnimatedNumber']) {
  test(`reflows the ${name} example for phone preview`, async ({ page }) => {
    const slug = name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

    await page.goto(`/docs/components/${slug}`)

    const example = page.locator('[data-framework-example]').first()

    await example.getByRole('button', { name: 'Phone preview width', exact: true }).click()
    await expect(example.getByRole('button', { name: 'Phone preview width', exact: true }))
      .toHaveAttribute('aria-pressed', 'true')

    const grid = example.locator('[data-ui-grid]').first()
    await expect.poll(async () => {
      const columns = await grid.evaluate(element => getComputedStyle(element).gridTemplateColumns)

      return columns.trim().split(/\s+/).length
    }).toBe(1)
  })
}

test('lets keyboard users scroll the API reference on a phone', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 390 })
  await page.goto('/docs/components/input')

  const table = page.getByRole('group', { name: 'API reference', exact: true }).and(page.locator('[tabindex]'))

  await table.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
})

test('documents textarea validation, read-only, and disabled states', async ({ page }) => {
  await page.goto('/docs/components/textarea')

  const preview = page.locator('[data-playground-preview]').first()

  await expect(preview.getByRole('textbox', { name: 'Required summary' })).toHaveAttribute('aria-invalid', 'true')
  await expect(preview.getByText('Add a summary before continuing.')).toBeVisible()
  await expect(preview.getByRole('textbox', { name: 'Published summary' })).toHaveAttribute('readonly', '')
  await expect(preview.getByRole('textbox', { name: 'Archived notes' })).toBeDisabled()
})

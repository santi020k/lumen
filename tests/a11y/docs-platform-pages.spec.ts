import { readdirSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { getNativeComponentsForPlatform } from '../../apps/docs/src/data/native-components.js'

const pagesDirectory = new URL('../../apps/docs/src/pages/docs/', import.meta.url)
const staticRoutes = readdirSync(pagesDirectory, { encoding: 'utf8', recursive: true })
  .filter(name => name.endsWith('.astro') && !name.includes('['))
  .map(name => name.slice(0, -6))
  .map(name => name === 'index' ? '' : name.replace(/\/index$/, ''))
const nativeRoutes = (['android', 'apple', 'react-native'] as const).flatMap(platform => (
  [
    `${platform}/components`,
    ...getNativeComponentsForPlatform(platform).map(component => `${platform}/components/${component.slug}`)
  ]
))

for (const width of [390, 1440]) {
  test.describe(`platform docs at ${width}px`, () => {
    test.use({ viewport: { height: 900, width } })

    for (const route of [...staticRoutes, ...nativeRoutes]) {
      test(`contains /docs/${route} within the viewport`, async ({ page }) => {
        const response = await page.goto(route ? `/docs/${route}` : '/docs')

        expect(response?.ok()).toBe(true)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        const dimensions = await page.evaluate(() => ({
          available: window.innerWidth,
          content: document.documentElement.scrollWidth
        }))

        expect(dimensions.content).toBeLessThanOrEqual(dimensions.available + 1)
      })
    }
  })
}

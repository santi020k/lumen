import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

const examplesDirectory = join(process.cwd(), 'apps/docs/src/examples')
const componentRoutes = readdirSync(examplesDirectory)
  .filter(fileName => fileName.endsWith('.astro'))
  .map(fileName => `/docs/components/${
    fileName
      .replace('.astro', '')
      .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()
  }`)

const routes = [
  '/',
  '/docs',
  '/docs/ai-skill',
  '/docs/components',
  '/docs/frameworks/astro',
  '/docs/frameworks/react',
  '/docs/frameworks/elements',
  '/docs/icons',
  '/docs/figma',
  '/docs/mcp',
  '/docs/theme-playground',
  ...componentRoutes
]

const viewports = [
  { height: 700, label: 'narrow phone', width: 320 },
  { height: 1024, label: 'tablet', width: 768 },
  { height: 1000, label: 'desktop', width: 1440 }
]

for (const route of routes) {
  test(`${route} stays within the viewport`, async ({ page }) => {
    await page.goto(route)

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)

      const layout = await page.evaluate(() => {
        const scrollingElement = document.scrollingElement

        return {
          clientWidth: scrollingElement?.clientWidth ?? 0,
          scrollWidth: scrollingElement?.scrollWidth ?? 0
        }
      })

      expect(
        layout.scrollWidth,
        `${route} overflows horizontally at the ${viewport.label} viewport`
      ).toBeLessThanOrEqual(layout.clientWidth)
    }
  })
}

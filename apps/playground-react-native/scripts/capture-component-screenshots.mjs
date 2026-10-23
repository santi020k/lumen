import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

import { nativeComponentDocs } from '../../docs/src/data/native-components.ts'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../../..')

const outputDirectory = resolve(
  process.argv[2] ?? join(repositoryRoot, 'test-results/react-native-components')
)

const focusedCaptureSlugs = ['time-field', 'autocomplete', 'number-field', 'password-field', 'input-otp', 'image-comparison', 'media-viewport', 'media-thumbnail', 'media-filmstrip']
// Keep parity examples in a reproducible phone layout instead of mixing manual crops
// and desktop catalog captures in the documentation baseline.
const phoneExampleSlugs = ['timeline', 'table', 'stepper', 'breadcrumb', 'mentions', 'rating', 'tour', 'data-table', 'tree-grid', 'command', 'tooltip', 'carousel', 'tree-select', 'transfer', 'color-picker', 'schedule', 'calendar', 'agenda', 'kanban-board', 'kanban-column', 'cascader', 'tree', 'qr-code']
const baseURL = process.env.LUMEN_REACT_NATIVE_URL ?? 'http://127.0.0.1:8081/'
const requested = process.argv.find(argument => argument.startsWith('--components='))?.slice('--components='.length).split(',')
const available = nativeComponentDocs.filter(component => component.implementations['react-native'])

if (requested?.some(slug => !available.some(component => component.slug === slug))) throw new Error('Unknown component capture slug')

const components = available.filter(component => !requested || requested.includes(component.slug))

await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { height: 900, width: 1280 } })

try {
  for (const component of components) {
    const phoneExample = phoneExampleSlugs.includes(component.slug)

    await page.setViewportSize({ height: 900, width: phoneExample ? 390 : 1280 })

    const url = new URL(baseURL)

    url.searchParams.set('component', component.name)

    await page.goto(url.href, { waitUntil: 'load' })

    await page.getByText('Lumen Playground', { exact: true }).waitFor()

    await page.evaluate(async () => {
      await document.fonts.ready
    })

    if (component.slug === 'menu') {
      await page.getByLabel('Component actions').click()
    }

    const focusedExample = page.getByTestId(`component-${component.slug}`)

    if (phoneExample || ['bullet-chart', 'dumbbell-chart', 'lollipop-chart', ...focusedCaptureSlugs].includes(component.slug)) {
      await focusedExample.waitFor({ state: 'visible' })
    }

    if (phoneExample && component.slug !== 'tour') {
      const bounds = await focusedExample.boundingBox()

      if (!bounds) throw new Error(`Missing visible phone example: ${component.slug}`)

      // React Native's scroll container clips content outside the viewport. Give
      // the complete example room so its screenshot cannot contain blank rows
      // or the fixed bottom navigation over its final controls.
      await page.setViewportSize({ height: Math.max(900, Math.ceil(bounds.height) + 200), width: 390 })
    }

    if (await focusedExample.count() === 1) {
      await focusedExample.scrollIntoViewIfNeeded()

      if (component.slug === 'tooltip') {
        await page.getByRole('button', { name: 'Show help explicitly', exact: true }).click()

        await page.getByText('Host visibility: shown', { exact: true }).waitFor()
      }

      if (component.slug === 'tour') {
        await page.getByRole('button', { name: 'Start tour', exact: true }).click()

        await page.getByRole('dialog').waitFor()

        await page.screenshot({ path: join(outputDirectory, `${component.slug}.png`) })

        continue
      }

      if (phoneExample || focusedCaptureSlugs.includes(component.slug)) {
        await focusedExample.screenshot({ path: join(outputDirectory, `${component.slug}.png`) })

        continue
      }
    }

    await page.waitForTimeout(500)

    await page.screenshot({
      fullPage: true,
      path: join(outputDirectory, `${component.slug}.png`)
    })
  }
} finally {
  await browser.close()
}

console.log(`Captured ${components.length} React Native component screenshots in ${outputDirectory}`)

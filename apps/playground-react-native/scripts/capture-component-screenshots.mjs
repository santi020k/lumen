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

const baseURL = process.env.LUMEN_REACT_NATIVE_URL ?? 'http://127.0.0.1:8081/'
const components = nativeComponentDocs.filter(component => component.implementations['react-native'])

await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { height: 900, width: 1280 } })

try {
  for (const component of components) {
    const url = new URL(baseURL)

    url.searchParams.set('component', component.name)

    await page.goto(url.href, { waitUntil: 'load' })

    await page.getByText('Lumen Playground', { exact: true }).waitFor()

    if (component.slug === 'menu') {
      await page.getByLabel('Component actions').click()
    }

    const focusedExample = page.getByTestId(`component-${component.slug}`)

    if (await focusedExample.count() === 1) {
      await focusedExample.scrollIntoViewIfNeeded()
    }

    await page.screenshot({
      fullPage: true,
      path: join(outputDirectory, `${component.slug}.png`)
    })
  }
} finally {
  await browser.close()
}

console.log(`Captured ${components.length} React Native component screenshots in ${outputDirectory}`)

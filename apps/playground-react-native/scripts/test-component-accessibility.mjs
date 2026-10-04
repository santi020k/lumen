import assert from 'node:assert/strict'
import { mkdir, realpath } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, expect } from '@playwright/test'

const baseURL = process.env.LUMEN_REACT_NATIVE_URL ?? 'http://127.0.0.1:8081/'

if (process.env.LUMEN_REQUIRE_PACKED === '1') {
  const resolvedAdapter = await realpath(
    fileURLToPath(import.meta.resolve('@santi020k/lumen-react-native'))
  )

  assert.doesNotMatch(
    resolvedAdapter,
    /\/packages\/react-native\//,
    'Accessibility canary must resolve the packed React Native adapter'
  )
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { height: 844, width: 390 } })

try {
  const url = new URL(baseURL)

  url.searchParams.set('component', 'Tabs')

  await page.goto(url.href, { waitUntil: 'load' })

  await page.getByText('Lumen Playground', { exact: true }).waitFor()

  const tabList = page.getByRole('tablist', { name: 'Workspace views' })
  const overview = page.getByRole('tab', { name: 'Overview' })
  const activity = page.getByRole('tab', { name: 'Activity' })
  const billing = page.getByRole('tab', { name: 'Billing' })
  const panel = page.getByRole('tabpanel')

  await tabList.waitFor()

  await overview.focus()

  await page.keyboard.press('ArrowRight')

  await expect(activity).toBeFocused()

  await expect(activity).toHaveAttribute('aria-selected', 'true')

  await page.getByText('Three components updated today.', { exact: true }).waitFor()

  await page.keyboard.press('ArrowRight')

  await expect(overview).toBeFocused()

  await page.keyboard.press('ArrowLeft')

  await expect(activity).toBeFocused()

  await expect(billing).toHaveAttribute('aria-disabled', 'true')

  await expect(panel).toHaveAttribute('aria-labelledby', /.+/)

  url.searchParams.set('component', 'Segmented control')

  await page.goto(url.href, { waitUntil: 'load' })

  const comfortable = page.getByRole('radio', { name: 'Comfortable' })
  const compact = page.getByRole('radio', { name: 'Compact' })
  const spacious = page.getByRole('radio', { name: 'Spacious' })

  await compact.click()

  await expect(compact).toHaveAttribute('aria-checked', 'true')

  await expect(spacious).toHaveAttribute('aria-disabled', 'true')

  await spacious.click({ force: true })

  await expect(compact).toHaveAttribute('aria-checked', 'true')

  await expect(comfortable).toHaveAttribute('aria-checked', 'false')

  url.searchParams.set('component', 'Radio group')

  await page.goto(url.href, { waitUntil: 'load' })

  const quiet = page.getByRole('radio', { name: 'Quiet' })

  await quiet.click()

  await expect(quiet).toHaveAttribute('aria-checked', 'true')

  url.searchParams.set('component', 'Navigation bar')

  await page.goto(url.href, { waitUntil: 'load' })

  const navigation = page.getByRole('tablist', { name: 'Primary navigation' }).last()
  const updates = navigation.getByRole('tab', { name: 'Updates' })
  const settings = navigation.getByRole('tab', { name: 'Settings' })

  await updates.click()

  await expect(updates).toHaveAttribute('aria-selected', 'true')

  await expect(settings).toHaveAttribute('aria-disabled', 'true')

  url.searchParams.set('component', 'Heatmap')

  const captureDirectory = resolve(import.meta.dirname, '../../../test-results/react-native-components')

  await mkdir(captureDirectory, { recursive: true })

  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 })

    await page.goto(url.href, { waitUntil: 'load' })

    const disclosure = page.getByRole('button', { name: /View chart data/ })

    await expect(page.getByText('Weekly activity', { exact: true })).toBeVisible()

    await expect(page.getByLabel('Chart legend: -20, 0, 20', { exact: true })).toBeVisible()

    for (const theme of ['light', 'dark']) {
      const toggle = page.getByRole('button', { name: `Use ${theme} theme` })

      if (await toggle.count()) await toggle.click()

      await disclosure.scrollIntoViewIfNeeded()

      await page.screenshot({ path: resolve(captureDirectory, `heatmap-${width}-${theme}.png`) })

      if (width === 1280 && theme === 'light') {
        await page.screenshot({ path: resolve(captureDirectory, 'heatmap.png') })
      }

      const bounds = await disclosure.boundingBox()

      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width, 'Disclosure fits the viewport')

      await disclosure.focus()

      await page.keyboard.press('Enter')

      await expect(disclosure).toHaveAttribute('aria-expanded', 'true')

      await expect(page.getByText('8:00, Mon: 0', { exact: true })).toBeVisible()

      await page.getByText('14:00, Fri: Not available', { exact: true }).scrollIntoViewIfNeeded()

      await expect(page.getByText('14:00, Fri: Not available', { exact: true })).toBeVisible()

      await page.getByText('19:00, Sun: -5', { exact: true }).scrollIntoViewIfNeeded()

      await expect(page.getByText('19:00, Sun: -5', { exact: true })).toBeVisible()

      await disclosure.click()

      await expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    }
  }
} finally {
  await browser.close()
}

console.log('React Native web accessibility canary passed, including heatmaps at 390px and 1280px in both themes.')

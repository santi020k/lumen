import assert from 'node:assert/strict'
import { realpath } from 'node:fs/promises'
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
} finally {
  await browser.close()
}

console.log('React Native web accessibility canary passed at a 390px viewport.')

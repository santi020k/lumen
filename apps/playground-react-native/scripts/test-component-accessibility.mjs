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

  url.searchParams.set('component', 'Bullet chart')

  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 })

    await page.goto(url.href, { waitUntil: 'load' })

    const chart = page.getByTestId('component-bullet-chart')
    const disclosure = chart.getByRole('button', { name: /View chart data/ })

    for (const theme of ['light', 'dark']) {
      const toggle = page.getByRole('button', { name: `Use ${theme} theme` })

      if (await toggle.count()) await toggle.click()

      await chart.scrollIntoViewIfNeeded()

      await expect(chart.getByText('86%', { exact: true })).toBeVisible()

      await expect(chart.getByText('Target: 95%', { exact: true })).toBeVisible()

      const bounds = await chart.boundingBox()

      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width, 'Target chart fits the viewport')

      await page.screenshot({ path: resolve(captureDirectory, `bullet-chart-${width}-${theme}.png`) })

      if (width === 1280 && theme === 'light') {
        await page.screenshot({ path: resolve(captureDirectory, 'bullet-chart.png') })
      }

      await disclosure.focus()

      await page.keyboard.press('Enter')

      await expect(disclosure).toHaveAttribute('aria-expanded', 'true')

      await expect(chart.getByText('Value: 86%', { exact: true })).toBeVisible()

      await expect(chart.getByText('Excellent: 90%–100%', { exact: true })).toBeVisible()

      await disclosure.click()

      await expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    }
  }

  const longNote = 'A long keyboard-edited note. '.repeat(40)

  for (const viewport of [{ height: 844, width: 390 }, { height: 900, width: 1280 }]) {
    await page.setViewportSize(viewport)

    for (const labels of [
      { language: 'English', search: 'Search records', edit: 'Edit record', note: 'Notes', save: 'Save', saved: 'Changes saved locally', cancel: 'Cancel' },
      { language: 'Español', search: 'Buscar registros', edit: 'Editar registro', note: 'Notas', save: 'Guardar', saved: 'Cambios guardados localmente', cancel: 'Cancelar' }
    ]) {
      const workspaceURL = new URL(baseURL)

      workspaceURL.searchParams.set('destination', 'examples')

      workspaceURL.searchParams.set('pattern', 'workspace')

      await page.goto(workspaceURL.href, { waitUntil: 'load' })

      await page.getByRole('radio', { name: labels.language, exact: true }).click()

      await page.getByRole('textbox', { name: labels.search, exact: true }).fill('Lumen 200')

      await page.getByRole('button', { name: 'Lumen 200', exact: true }).click()

      const edit = page.getByRole('button', { name: labels.edit, exact: true })
      const dialog = page.getByRole('dialog', { name: labels.edit, exact: true })

      await edit.click()

      await dialog.getByRole('textbox', { name: labels.note, exact: true }).fill(longNote)

      await dialog.getByRole('button', { name: labels.save, exact: true }).click()

      await expect(dialog).toBeHidden()

      await expect(edit).toBeFocused()

      await expect(page.getByText('Lumen 200', { exact: true }).last()).toBeInViewport({ ratio: 1 })

      await expect(page.getByText(labels.saved, { exact: true })).toBeInViewport({ ratio: 1 })

      await edit.click()

      await expect(dialog.getByRole('textbox', { name: labels.note, exact: true })).toHaveValue(longNote)

      await dialog.getByRole('button', { name: labels.cancel, exact: true }).click()

      await expect(dialog).toBeHidden()
    }
  }

  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 })

    for (const name of ['Lollipop chart', 'Dumbbell chart']) {
      url.searchParams.set('component', name)

      await page.goto(url.href, { waitUntil: 'load' })

      const comparison = page.getByTestId(`component-${name.toLowerCase().replace(' ', '-')}`)

      await expect(comparison).toBeVisible()

      await expect(comparison.getByText('Support', { exact: true })).toBeVisible()

      const disclosure = comparison.getByRole('button', { name: 'View chart data' })

      await disclosure.focus()

      await page.keyboard.press('Enter')

      await expect(comparison.getByText(name === 'Dumbbell chart' ? 'Support. Previous: 81. Current: 74.' : 'Support. Current: 74.', { exact: true })).toBeVisible()

      const bounds = await comparison.boundingBox()

      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width)
    }
  }
} finally {
  await browser.close()
}

console.log('React Native web accessibility canary passed, including charts in both themes and English/Spanish long-note editing at phone and desktop sizes.')

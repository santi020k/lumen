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
} finally {
  await browser.close()
}

console.log('React Native web accessibility canary passed, including English and Spanish phone and desktop long-note editing.')

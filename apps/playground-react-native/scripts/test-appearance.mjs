import assert from 'node:assert/strict'

import { chromium, expect } from '@playwright/test'
import { santi020kTheme } from '@santi020k/lumen-react-native/themes/santi020k'

const rgb = value => {
  const channels = [1, 3, 5].map(index => Number.parseInt(value.slice(index, index + 2), 16))

  return `rgb(${channels.join(', ')})`
}

const baseURL = process.env.LUMEN_REACT_NATIVE_URL ?? 'http://127.0.0.1:8081/'
const evidenceDirectory = process.env.LUMEN_APPEARANCE_EVIDENCE
const browser = await chromium.launch()

try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { height: 900, width } })
    const url = new URL(baseURL)

    url.searchParams.set('destination', 'settings')

    url.searchParams.set('scheme', 'light')

    await page.goto(url.href)

    const note = page.getByRole('textbox', { name: 'Release note' })

    await note.fill('Keep my appearance review draft')

    const scenarios = ['Light', 'Dark'].flatMap(scheme => (
      ['Normal', 'Studio', 'Glass', 'santi020k', 'Paper', 'Field'].map(preset => ({ preset, scheme }))
    ))

    for (const { preset, scheme } of scenarios) {
      await page.getByRole('radio', { name: scheme, exact: true }).click()

      const picker = page.getByRole('combobox', { name: 'Playground theme' })

      await picker.focus()

      await page.keyboard.press('Enter')

      const option = page.getByRole('menuitem', { name: preset, exact: true })

      await option.focus()

      await page.keyboard.press('Enter')

      await expect(picker).toContainText(preset)

      await expect(note).toHaveValue('Keep my appearance review draft')

      if (preset === 'santi020k') {
        const mode = scheme === 'Dark' ? 'dark' : 'light'
        const colors = santi020kTheme[mode]
        const action = page.getByRole('button', { name: 'Validate note' })

        await expect(action).toHaveCSS('background-color', rgb(colors.ink))

        await expect(action.getByText('Validate note')).toHaveCSS('color', rgb(colors.surface))

        await note.fill('')

        await action.click()

        const errorColor = mode === 'light' ? colors.ink : colors.danger

        await expect(page.getByText('A release note is required.')).toHaveCSS('color', rgb(errorColor))

        await note.fill('Keep my appearance review draft')
      }

      const canvas = await page.locator('body').evaluate(element => element.scrollWidth)

      assert.ok(canvas <= width, `Settings overflow at ${width}px with ${preset}`)

      if (evidenceDirectory) {
        await page.screenshot({
          fullPage: true,
          path: `${evidenceDirectory}/after-${width}-${scheme.toLowerCase()}-${preset}.png`
        })
      }
    }

    for (const preset of ['studio', 'glass', 'santi020k', 'paper', 'field']) {
      url.searchParams.set('theme', preset)

      await page.goto(url.href)

      await expect(page.getByRole('combobox', { name: 'Playground theme' }))
        .toContainText(preset, { ignoreCase: true })
    }

    await page.getByRole('radio', { name: 'Dark', exact: true }).click()

    await expect(page.getByText('Harbor is using dark mode.')).toBeVisible()

    await page.getByRole('radio', { name: 'Always light' }).click()

    await expect(page.getByText('Harbor is using light mode.')).toBeVisible()

    const trigger = page.getByRole('button', { name: 'Edit preview note' })

    await trigger.click()

    const sheetNote = page.getByRole('textbox', { name: 'Harbor note' })

    await sheetNote.fill('A local draft')

    await page.getByRole('button', { name: 'Done', exact: true }).click()

    await trigger.click()

    await expect(sheetNote).toHaveValue('A local draft')

    await page.getByRole('button', { name: 'Done', exact: true }).click()

    await page.close()
  }
} finally {
  await browser.close()
}

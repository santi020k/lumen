import assert from 'node:assert/strict'

import { chromium, expect } from '@playwright/test'

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
      ['Normal', 'Studio', 'Glass', 'santi020k'].map(preset => ({ preset, scheme }))
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

      const canvas = await page.locator('body').evaluate(element => element.scrollWidth)

      assert.ok(canvas <= width, `Settings overflow at ${width}px with ${preset}`)

      if (evidenceDirectory) {
        await page.screenshot({
          fullPage: true,
          path: `${evidenceDirectory}/after-${width}-${scheme.toLowerCase()}-${preset}.png`
        })
      }
    }

    for (const preset of ['studio', 'glass']) {
      url.searchParams.set('theme', preset)

      await page.goto(url.href)

      await expect(page.getByRole('combobox', { name: 'Playground theme' }))
        .toContainText(preset === 'studio' ? 'Studio' : 'Glass')
    }

    await page.close()
  }
} finally {
  await browser.close()
}

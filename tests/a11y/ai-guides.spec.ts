import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')

for (const theme of ['lumen-light', 'lumen-dark']) {
  for (const width of [390, 1440]) {
    test(`AI adoption guide preserves edits, validates input, and copies markup at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('lumen-theme', value)
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: (text: string) => {
            document.documentElement.dataset.copiedSnippet = text

            return Promise.resolve()
          } }
        })
      }, theme)
      await page.goto('/guides/build-ui-with-ai')
      const assertAccessible = async () => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await page.addScriptTag({ path: axePath })
        const accessibility: unknown = await page.evaluate('axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')

        expect(accessibility).toEqual([])
      }

      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      const form = page.locator('#ai-preferences-form')
      const email = form.getByRole('textbox', { name: 'Email address', exact: true })
      const toggle = form.getByRole('button', { name: 'Show delivery details', exact: true })
      const details = page.locator('#ai-delivery-details')
      const result = page.locator('#ai-preferences-result')

      await email.fill('invalid')
      await form.getByRole('button', { name: 'Save preferences', exact: true }).click()
      await expect(email).toBeFocused()
      await expect(result).toBeHidden()
      await email.fill('grace@example.com')
      await toggle.focus()
      await page.keyboard.press('Enter')
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(details).toBeVisible()
      await page.keyboard.press('Enter')
      await expect(details).toBeHidden()
      await expect(email).toHaveValue('grace@example.com')
      await page.keyboard.press('Tab')
      await expect(form.getByRole('button', { name: 'Save preferences', exact: true })).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(form.getByRole('status')).toHaveText('Preferences saved for grace@example.com.')
      await email.fill('ada@example.com')
      await expect(result).toBeHidden()

      const tabs = page.getByRole('tablist', { name: 'Set up styles and runtime' })

      for (const name of ['Astro layout', 'React entry']) {
        const tab = tabs.getByRole('tab', { name, exact: true })

        await tab.click()
        const panelId = await tab.getAttribute('aria-controls')

        if (!panelId) throw new Error('Code tab is missing its panel relationship.')
        const panel = page.locator(`[id="${panelId}"]`)

        await panel.getByRole('button', { name: 'Copy code to clipboard' }).click()
        await expect(page.locator('html')).toHaveAttribute('data-copied-snippet', /<h1>Account settings<\/h1>/u)
        await expect(page.locator('html')).toHaveAttribute('data-copied-snippet', /\n/u)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      }

      const referenceTabs = page.getByRole('tablist', { name: 'Reference implementation by framework' })

      for (const { name, file } of [
        { name: 'Astro', file: 'AiSettingsExample.astro' },
        { name: 'React', file: 'AiSettingsReact.tsx' }
      ]) {
        const tab = referenceTabs.getByRole('tab', { name, exact: true })

        await tab.click()
        const panelId = await tab.getAttribute('aria-controls')

        if (!panelId) throw new Error('Reference tab is missing its panel relationship.')
        await page.locator(`[id="${panelId}"]`).getByRole('button', { name: 'Copy code to clipboard' }).click()
        const source = await readFile(new URL(`../../apps/docs/src/components/${file}`, import.meta.url), 'utf8')

        await expect(page.locator('html')).toHaveAttribute('data-copied-snippet', source.trim())
      }

      await page.getByRole('link', { name: 'compare the full workflow with our measurement method', exact: true }).click()
      await expect(page).toHaveURL(/\/guides\/measure-ai-ui-token-usage$/u)
      await expect(page.getByRole('table').getByRole('row')).toHaveCount(7)
      await expect(page.getByRole('link', { name: 'Download all 18 results as JSON' })).toHaveAttribute('href', '/benchmarks/ai-efficiency-2026-10-04.json')
      await assertAccessible()
      await page.goBack()
      await expect(page).toHaveURL(/\/guides\/build-ui-with-ai$/u)
      await email.fill('lin@example.com')
      await toggle.click()
      await expect(details).toBeVisible()
      await form.getByRole('button', { name: 'Save preferences', exact: true }).click()
      await expect(form.getByRole('status')).toHaveText('Preferences saved for lin@example.com.')

      await assertAccessible()
    })
  }
}

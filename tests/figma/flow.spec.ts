import { readFile } from 'node:fs/promises'

import { expect, type Page, test } from '@playwright/test'

import type { PluginResult } from '../../apps/figma-plugin/src/model.js'

const result: PluginResult = {
  target: 'astro', lumenVersion: '5.0.0', selectionName: 'Onboarding form',
  code: '<main>Workspace</main>', layout: '<html lang="en"><slot /></html>', handoff: 'Review every finding before implementing.',
  findings: [
    { nodeId: 'button', name: 'Continue', status: 'verified', message: 'Matched Button.' },
    { nodeId: 'drawing', name: 'Drawing', status: 'unsupported', message: 'Implement the drawing manually.' },
    ...Array.from({ length: 20 }, (_, index) => ({
      nodeId: `field-${index}`, name: `Field ${index}`, status: 'review' as const, message: 'Connect the input to validation and application state.'
    }))
  ]
}

const openReview = async (page: Page, analysis = result) => {
  const ui = await readFile(new URL('../../apps/figma-plugin/dist/ui.html', import.meta.url), 'utf8')
  await page.setViewportSize({ width: 480, height: 720 })
  await page.setContent(ui)
  await expect(page.getByRole('heading', { name: 'Nothing selected' })).toBeVisible()
  await page.evaluate(() => { window.postMessage({ pluginMessage: { type: 'selection', name: 'Onboarding form' } }, '*'); })
  await page.getByRole('button', { name: 'Inspect selection' }).click()
  await page.evaluate(value => { window.postMessage({ pluginMessage: { type: 'result', result: value } }, '*'); }, analysis)
  await expect(page.getByRole('heading', { name: 'Design review' })).toBeFocused()
}

test('review filters and reading position survive the round trip through handoff and setup', async ({ page }) => {
  await openReview(page)
  // Large output stays unmounted until the user opens Handoff.
  await expect(page.getByRole('tablist', { name: 'Conversion output', includeHidden: true })).toHaveCount(0)
  const filter = page.getByRole('combobox', { name: 'Show findings' })
  await filter.click()
  await page.getByRole('option', { name: 'Unsupported (1)', exact: true }).click()
  const findings = page.getByRole('region', { name: 'Items to review' })
  await expect(findings.getByRole('listitem')).toHaveCount(1)
  await expect(findings).toContainText('Implement the drawing manually.')
  await filter.click()
  await page.getByRole('option', { name: 'Inferred (0)', exact: true }).click()
  await expect(findings).toHaveText('No inferred findings in this selection.')
  await filter.click()
  await page.getByRole('option', { name: 'Needs review (20)', exact: true }).click()
  await expect(findings.getByRole('listitem')).toHaveCount(20)
  await findings.press('End')
  await expect.poll(() => findings.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  const scrollTop = await findings.evaluate(element => element.scrollTop)
  await page.getByRole('button', { name: 'Open handoff' }).click()
  await expect(page.getByRole('heading', { name: 'Project handoff' })).toBeFocused()
  await page.getByRole('tab', { name: 'Layout' }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save layout' }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('LumenLayout.astro')
  const file = await download.path()
  if (!file) throw new Error('Missing layout download.')
  expect(await readFile(file, 'utf8')).toBe(result.layout)
  await page.getByRole('button', { name: 'Back to review' }).click()
  await expect(filter).toHaveText('Needs review (20)')
  await expect.poll(() => findings.evaluate(element => element.scrollTop)).toBe(scrollTop)
  await page.getByRole('button', { name: 'Back to setup' }).click()
  await expect(page.getByRole('tablist', { name: 'Conversion output' })).toHaveCount(0)
  await page.getByRole('button', { name: 'View design review' }).click()
  await expect(filter).toHaveText('Needs review (20)')
  await page.getByRole('button', { name: 'Open handoff' }).click()
  await expect(page.getByRole('tab', { name: 'Layout' })).toHaveAttribute('aria-selected', 'true')
  await page.evaluate(() => { window.postMessage({ pluginMessage: { type: 'selection', name: 'Different frame' } }, '*'); })
  await expect(page.getByRole('heading', { name: 'Export settings' })).toBeFocused()
  await expect(page.getByRole('tablist', { name: 'Conversion output', includeHidden: true })).toHaveCount(0)
  await page.evaluate(value => { window.postMessage({ pluginMessage: { type: 'result', result: value } }, '*'); }, result)
  await expect(filter).toHaveText('All notes (21)')
})

test('a review with no findings has a clear next action and no empty filter', async ({ page }) => {
  await openReview(page, { ...result, findings: [] })
  await expect(page.getByText('No additional review notes for this selection.')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Show findings' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open handoff' }).click()
  await expect(page.getByRole('button', { name: 'Save starter' })).toBeInViewport({ ratio: 1 })
})

test('branded setup and all step actions fit a narrow panel', async ({ page }) => {
  const ui = await readFile(new URL('../../apps/figma-plugin/dist/ui.html', import.meta.url), 'utf8')
  await page.setViewportSize({ width: 320, height: 720 })
  await page.setContent(ui)
  await expect(page.getByRole('heading', { name: 'Nothing selected' })).toBeVisible()
  await page.evaluate(() => { window.postMessage({ pluginMessage: { type: 'selection', name: 'Onboarding form' } }, '*'); })
  await page.getByRole('combobox', { name: 'Project appearance' }).click()
  await page.getByRole('option', { name: 'santi020k', exact: true }).click()
  await page.getByRole('radio', { name: 'Dark', exact: true }).check()
  await expect(page.getByRole('button', { name: 'Inspect selection' })).toBeInViewport({ ratio: 1 })
  await page.evaluate(value => { window.postMessage({ pluginMessage: { type: 'result', result: value } }, '*'); }, result)
  await expect(page.getByText('Astro · 5.0.0 · santi020k Dark')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to setup' })).toBeInViewport({ ratio: 1 })
  await page.getByRole('button', { name: 'Open handoff' }).click()
  await expect(page.getByRole('button', { name: 'Save layout' })).toBeInViewport({ ratio: 1 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
})

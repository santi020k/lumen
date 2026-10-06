import { expect, test } from '@playwright/test'

const topics = [
  ['motion', 'Coordinated motion'],
  ['effects', 'Visual effects'],
  ['charts', 'Live chart continuity'],
  ['ai', 'AI surfaces'],
  ['recipes', 'Installable product blocks']
] as const

for (const [topic, preview] of topics) {
  test(`${topic} guide has an isolated live preview and framework setup`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(`/docs/visual-playground/${topic}`)
    await expect(page.getByRole('region', { name: preview, exact: true })).toBeVisible()
    await expect(page.locator('.visual-workbench > section')).toHaveCount(1)
    const navigation = page.getByRole('navigation', { name: 'Visual guides', exact: true })

    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1)
    const framework = page.getByRole('tablist', { name: 'Framework setup', exact: true })

    const setup = page.locator('.ui-code-tabs').filter({ has: framework })

    await framework.getByRole('tab', { name: 'React', exact: true }).click()
    await expect(setup.getByRole('tabpanel', { name: 'React', exact: true }))
      .toContainText('@santi020k/lumen-react/styles.css')
    await setup.getByRole('button', { name: 'Copy code to clipboard', exact: true }).click()
    await expect(setup.getByRole('button', { name: 'Code copied to clipboard', exact: true })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('@santi020k/lumen-react/styles.css')
    await framework.getByRole('tab', { name: 'Elements', exact: true }).press('Enter')
    await expect(setup.getByRole('tabpanel', { name: 'Elements', exact: true }))
      .toContainText('defineLumenElements')
    await expect(page.getByRole('heading', { name: 'Before you ship', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Component reference', exact: true })).toBeVisible()
    const links = page.locator('#component-reference').locator('..').getByRole('link')

    expect(await links.count()).toBeGreaterThan(0)
  })
}

test('guide navigation replaces the demo and retains working controls on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/visual-playground')
  const navigation = page.getByRole('navigation', { name: 'Visual guides', exact: true })

  await navigation.getByRole('link', { name: 'Motion', exact: true }).click()
  await expect(page).toHaveURL(/\/visual-playground\/motion\/?$/)
  await page.getByRole('button', { name: 'Reverse order', exact: true }).click()
  await expect(page.locator('.visual-motion-list').first().getByRole('listitem').first()).toHaveText('Review')
  await navigation.getByRole('link', { name: 'Effects', exact: true }).click()
  await page.getByRole('button', { name: 'Enable animation', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause animation', exact: true })).toBeVisible()
  await expect(page.locator('.visual-workbench > section')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1)
  await navigation.getByRole('link', { name: 'Overview', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Choose a visual guide', exact: true }).getByRole('link')).toHaveCount(5)
  await expect(page.locator('.visual-workbench > section')).toHaveCount(5)
})

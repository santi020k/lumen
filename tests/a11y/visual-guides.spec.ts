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

  await page.getByRole('region', { name: 'Choose a visual guide', exact: true }).getByRole('link', { name: 'Keep changes easy to follow.' }).click()
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
  await expect(page.locator('[data-visual-interactions-demo]')).toHaveCount(0)
  await expect(navigation).toHaveCount(0)
})

for (const width of [390, 1280]) {
  test(`guide navigation has rounded targets and breathing room at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/docs/visual-playground/motion')
    const navigation = page.getByRole('navigation', { name: 'Visual guides', exact: true })
    const active = navigation.getByRole('link', { name: 'Motion', exact: true })
    const presentation = await active.evaluate(element => ({
      height: element.getBoundingClientRect().height,
      radius: Number.parseFloat(getComputedStyle(element).borderRadius)
    }))

    expect(presentation.height).toBeGreaterThanOrEqual(44)
    expect(presentation.radius).toBeGreaterThan(0)
    const spacing = await navigation.evaluate(element => ({
      before: Number.parseFloat(getComputedStyle(element).marginBlockStart),
      after: Number.parseFloat(getComputedStyle(element).marginBlockEnd)
    }))

    expect(spacing.before).toBeGreaterThan(0)
    expect(spacing.after).toBeGreaterThan(0)
    await active.focus()
    await active.press('Tab')
    await expect(navigation.getByRole('link', { name: 'Effects', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/visual-playground\/effects\/?$/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
      .toBeLessThanOrEqual(1)
  })
}

for (const [anchor, topic] of [
  ['motion-workbench', 'motion'], ['effects-workbench', 'effects'], ['chart-workbench', 'charts'],
  ['ai-workbench', 'ai'], ['product-blocks-workbench', 'recipes']
] as const) {
  test(`old ${anchor} links open the focused guide`, async ({ page }) => {
    await page.goto(`/docs/visual-playground#${anchor}`)
    await expect(page).toHaveURL(new RegExp(`/docs/visual-playground/${topic}/?$`))
    await expect(page.locator('.visual-workbench > section')).toHaveCount(1)
  })
}

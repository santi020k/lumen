import { expect, type Locator, test } from '@playwright/test'

interface FrameworkScenario {
  id: 'astro' | 'elements' | 'react'
  label: 'Astro' | 'Elements' | 'React'
  progressName: string
}

const frameworks: FrameworkScenario[] = [
  { id: 'astro', label: 'Astro', progressName: 'Astro web readiness' },
  { id: 'react', label: 'React', progressName: 'React web readiness' },
  { id: 'elements', label: 'Elements', progressName: 'Elements web readiness' }
]

const exerciseFramework = async (root: Locator, scenario: FrameworkScenario) => {
  const selector = root.getByRole('button', { exact: true, name: scenario.label })

  await selector.click()

  const panel = root.locator(`[data-framework-panel="${scenario.id}"]`)
  const progress = panel.getByRole('progressbar', { name: scenario.progressName })
  const initialProgress = Number(await progress.getAttribute('aria-valuenow'))
  const advance = panel.getByRole('button', { exact: true, name: 'Advance' })
  const readiness = panel.locator('.ui-alert')

  await expect(panel).toBeVisible()
  await expect(selector).toHaveAttribute('aria-pressed', 'true')
  await expect(selector).toHaveAttribute('data-variant', 'default')
  await expect(selector).toHaveClass(/ui-button--default/)
  await expect(selector).not.toHaveClass(/ui-button--ghost/)

  const unselectedSelectors = root.locator('[data-framework-select][aria-pressed="false"]')

  await expect(unselectedSelectors).toHaveCount(2)
  await expect.poll(async () => unselectedSelectors.evaluateAll(nodes => (
    nodes.every(node => node.getAttribute('data-variant') === 'ghost')
  ))).toBe(true)
  await advance.click()
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow')))
    .toBeGreaterThan(initialProgress)

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if ((await readiness.textContent())?.includes('Ready for review.')) break

    await advance.click()
  }

  await expect(readiness).toContainText('Ready for review.')
  await expect(readiness).toHaveClass(/ui-alert--success/)

  const behavior = panel.getByRole('tab', { name: 'Behavior' })
  const delivery = panel.getByRole('tab', { name: 'Delivery' })

  await behavior.focus()
  await behavior.press('ArrowRight')

  await expect(delivery).toBeFocused()
  await expect(delivery).toHaveAttribute('aria-selected', 'true')
  await expect(panel.getByRole('tabpanel', { name: 'Delivery' })).toBeVisible()
}

test('web playground switches and exercises each real framework adapter', async ({ page }) => {
  await page.goto('/docs/web/playground')

  const playground = page.locator('.web-framework-playground')

  await expect(playground).toBeVisible()

  for (const framework of frameworks) {
    await exerciseFramework(playground, framework)
  }
})

test('web playground loads optional framework runtimes only when selected', async ({ page }) => {
  await page.route('**/web-framework-playground.*.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 250))
    await route.continue()
  })

  await page.goto('/docs/web/playground')

  const playground = page.locator('.web-framework-playground')
  const reactPanel = playground.locator('[data-framework-panel="react"]')
  const status = playground.locator('[data-framework-status]')
  const viewport = playground.locator('.web-framework-playground__viewport')

  await expect(status).toHaveText('Rendering with Astro')
  await expect(reactPanel.locator('[data-framework-runtime="react"]')).toHaveCount(0)
  await expect.poll(async () => page.evaluate(() => customElements.get('lumen-alert') !== undefined))
    .toBe(false)

  await playground.getByRole('button', { exact: true, name: 'React' }).click()
  await expect(status).toHaveText('Loading React preview…')
  await expect(viewport).toHaveAttribute('aria-busy', 'true')
  await expect(reactPanel.locator('[data-framework-runtime="react"]')).toBeVisible()
  await expect(status).toHaveText('Rendering with React')
  await expect(viewport).not.toHaveAttribute('aria-busy', 'true')
  await expect.poll(async () => page.evaluate(() => customElements.get('lumen-alert') !== undefined))
    .toBe(false)

  await playground.getByRole('button', { exact: true, name: 'Elements' }).click()
  await expect(playground.locator('[data-framework-panel="elements"]')).toBeVisible()
  await expect.poll(async () => page.evaluate(() => customElements.get('lumen-alert') !== undefined))
    .toBe(true)
  await expect.poll(async () => page.evaluate(() => customElements.get('lumen-dialog') !== undefined))
    .toBe(false)
})

test('web playground keeps the framework chooser usable on a phone viewport', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto('/docs/web/playground')

  const chooser = page.getByRole('group', { name: 'Preview framework' })

  await expect(chooser).toBeVisible()
  await expect(chooser.getByRole('button')).toHaveCount(3)

  await chooser.getByRole('button', { exact: true, name: 'Elements' }).click()
  await expect(page.locator('[data-framework-panel="elements"]')).toBeVisible()
})

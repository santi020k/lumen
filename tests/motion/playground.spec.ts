import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

const route = '/docs/motion-playground'
const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')

test('presets animate real components and lists retain focus and state', async ({ page }) => {
  await page.goto(route)
  await expect(page.locator('[data-motion-playground]')).toHaveAttribute('data-ui-motion', /^(system|reduce)$/)
  await page.getByLabel('Presence preset').selectOption('slide-up')
  await page.getByLabel('Duration', { exact: true }).selectOption('slow')
  await page.getByRole('button', { name: 'Replay entrance' }).click()
  await expect(page.locator('[data-motion-sample]')).toBeVisible()
  await page.getByRole('button', { name: 'Add item', exact: true }).click()
  await expect(page.locator('[data-motion-list] > [role="listitem"]')).toHaveCount(2)
  await page.getByRole('button', { name: 'Remove last item' }).click()
  await expect(page.getByRole('button', { name: 'Add item', exact: true })).toBeFocused()
  await expect(page.locator('[data-motion-list] > [role="listitem"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Remove last item' }).click()
  await expect(page.locator('[data-motion-list] > [role="listitem"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Remove last item' })).toBeDisabled()
})

test('the playground reinitializes after client navigation', async ({ page }) => {
  await page.goto(route)
  await page.locator('[data-motion-playground]').getByRole('link', { name: 'ScrollReveal', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/components\/scroll-reveal$/)
  await page.goBack()
  await expect(page).toHaveURL(new RegExp(`${route}$`))
  await page.getByRole('button', { name: 'Add item', exact: true }).click()
  await expect(page.locator('[data-motion-list] [role="listitem"]')).toHaveCount(2)
})

test('save feedback announces completion without losing the button focus', async ({ page }) => {
  await page.goto(route)
  const save = page.getByRole('button', { name: 'Simulate save' })
  await save.focus()
  await page.keyboard.press('Enter')
  await expect(save).toHaveAttribute('aria-busy', 'true')
  await expect(page.locator('[data-motion-feedback]')).toHaveText('Saving demonstration…')
  await expect(page.locator('[data-motion-success]')).toBeVisible()
  await expect(save).toBeEnabled()
  await expect(save).toBeFocused()
  await expect(page.locator('[data-motion-feedback]')).toHaveText('Demonstration saved.')
})

test('native disclosures and dialogs keep their keyboard behavior', async ({ page }) => {
  await page.goto(route)
  const summary = page.locator('[data-motion-playground] [data-ui-collapsible] > summary')
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-motion-playground] [data-ui-collapsible]')).toHaveAttribute('open', '')
  await expect(page.getByText('The content opens immediately.', { exact: false }).first()).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-motion-playground] [data-ui-collapsible]')).not.toHaveAttribute('open')
  const trigger = page.getByRole('button', { name: 'Open dialog' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Review the transition' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Review the transition' })).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('system and local reduced motion skip presence and disclosure animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(route)
  const root = page.locator('[data-motion-playground]')
  await expect(root).toHaveAttribute('data-ui-motion', 'reduce')
  await page.getByRole('button', { name: 'Replay entrance' }).click()
  expect(await page.locator('[data-motion-sample]').evaluate(element => element.getAnimations().length)).toBe(0)
  await page.locator('[data-motion-playground] [data-ui-collapsible] > summary').click()
  expect(await page.locator('[data-motion-playground] [data-ui-collapsible]').evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByLabel('Motion preference').selectOption('reduce')
  await expect(root).toHaveAttribute('data-ui-motion', 'reduce')
  await page.getByRole('button', { name: 'Replay entrance' }).click()
  expect(await page.locator('[data-motion-sample]').evaluate(element => element.getAnimations().length)).toBe(0)
})

test('overlay panels and backdrops respect system and local reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(route)
  const root = page.locator('[data-motion-playground]')
  // Isolate the base stylesheet's system preference from the optional local reduction scope.
  await root.evaluate(element => { element.removeAttribute('data-ui-motion'); })
  for (const kind of ['dialog', 'drawer', 'sheet']) {
    const trigger = page.getByRole('button', { name: `Open ${kind}`, exact: true })
    const panel = page.locator(`#motion-${kind}`)
    await trigger.click()
    await expect(panel).toBeVisible()
    const durations = await panel.evaluate(element => [
      getComputedStyle(element).transitionDuration,
      getComputedStyle(element, '::backdrop').transitionDuration
    ].flatMap(value => value.split(',').map(duration => Number.parseFloat(duration))))
    expect(Math.max(...durations)).toBeLessThanOrEqual(0.001)
    await page.keyboard.press('Escape')
    await expect(panel).not.toBeVisible()
    await expect(trigger).toBeFocused()
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByLabel('Motion preference').selectOption('reduce')
  await page.getByRole('button', { name: 'Open drawer', exact: true }).click()
  const local = await page.locator('#motion-drawer').evaluate(element => [
    getComputedStyle(element).transitionDuration,
    getComputedStyle(element, '::backdrop').transitionDuration
  ])
  expect(local).toEqual(['0s', '0s'])
})

test('drawers and sheets retain focus and close during an entrance', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(route)
  for (const kind of ['drawer', 'sheet']) {
    const trigger = page.getByRole('button', { name: `Open ${kind}`, exact: true })
    const panel = page.locator(`#motion-${kind}`)
    await trigger.click()
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('button', { name: `Close ${kind}` })).toBeFocused()
    if (kind === 'drawer') {
      const centered = await panel.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        return Math.abs(bounds.left - (innerWidth - bounds.width) / 2) < 1
      })
      expect(centered).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(panel).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await panel.getByRole('button', { name: `Close ${kind}` }).click()
    await expect(panel).not.toBeVisible()
    await expect(trigger).toBeFocused()
  }
})

test('grid layout preserves a drawer centered in the viewport', async ({ page }) => {
  await page.goto(route)
  const drawer = page.locator('#motion-drawer')
  await drawer.evaluate(element => {
    const grid = document.querySelector('[data-motion-playground] .ui-grid')
    grid?.append(element)
  })
  await page.getByRole('button', { name: 'Open drawer', exact: true }).click()
  const centered = await drawer.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    return Math.abs(bounds.left - (innerWidth - bounds.width) / 2) < 1
  })
  expect(centered).toBe(true)
})

test('native disclosure content remains usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(route)
  const summary = page.locator('[data-motion-playground] [data-ui-collapsible] > summary')
  await summary.click()
  await expect(page.locator('[data-motion-playground] [data-ui-collapsible]')).toHaveAttribute('open', '')
  await expect(page.locator('[data-motion-playground] [data-ui-collapsible] > p')).toBeVisible()
  await summary.click()
  await expect(page.locator('[data-motion-playground] [data-ui-collapsible]')).not.toHaveAttribute('open')
  await context.close()
})


test('running presence effects stop when the system preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(route)
  await page.locator('[data-motion-playground]').evaluate(element => {
    if (element instanceof HTMLElement) element.style.setProperty('--ui-duration', '10s')
  })
  await page.getByRole('button', { name: 'Replay entrance' }).click()
  expect(await page.locator('[data-motion-sample]').evaluate(element => element.getAnimations().length)).toBe(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[data-motion-playground]')).toHaveAttribute('data-ui-motion', 'reduce')
  expect(await page.locator('[data-motion-sample]').evaluate(element => element.getAnimations().length)).toBe(0)
})


test('the playground has no accessibility violations or horizontal overflow', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(route)
  await page.addScriptTag({ path: axePath })
  const violations: unknown = await page.evaluate('axe.run("[data-motion-playground]", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }).then(result => result.violations)')
  expect(violations).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  // Optional motion CSS must not place component styles below Tailwind's reset layer.
  expect(await page.locator('[data-motion-sample]').evaluate(element => Number.parseFloat(getComputedStyle(element).paddingTop))).toBeGreaterThan(0)
  expect(await page.locator('[data-motion-replay]').evaluate(element => Number.parseFloat(getComputedStyle(element).paddingTop))).toBeGreaterThan(0)
  expect(errors).toEqual([])
})


test('local reduction also works on the motion component itself', async ({ page }) => {
  await page.goto('/docs/components/scroll-reveal')
  await page.addStyleTag({ path: 'packages/lumen/styles/motion.css' })
  const reveal = page.locator('.component-doc-preview [data-ui-scroll-reveal]').first()
  await reveal.evaluate(element => {
    if (!(element instanceof HTMLElement)) return
    element.dataset.uiMotion = 'reduce'
    element.dataset.uiScrollRevealBound = 'true'
    element.classList.remove('is-revealed')
  })
  const style = await reveal.evaluate(element => {
    const computed = getComputedStyle(element)
    return { opacity: computed.opacity, transform: computed.transform }
  })
  expect(style).toEqual({ opacity: '1', transform: 'none' })
})

test('supporting browsers interpolate disclosure height in both directions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(route)
  const disclosure = page.locator('[data-motion-playground] [data-ui-collapsible]')
  const supported = await page.evaluate(() =>
    CSS.supports('interpolate-size', 'allow-keywords') && CSS.supports('selector(details::details-content)')
  )
  test.skip(!supported, 'The browser retains the native immediate disclosure fallback.')
  await disclosure.evaluate(element => {
    if (element instanceof HTMLElement) element.style.setProperty('--ui-duration', '1s')
  })
  await disclosure.locator('summary').click()
  const opening = await disclosure.evaluate(async element => {
    // Force a frame so native pseudo-element transitions have started.
    await new Promise<void>(resolve => requestAnimationFrame(() => { resolve(); }))
    return getComputedStyle(element, '::details-content').blockSize
  })
  await expect.poll(() => disclosure.evaluate(element => getComputedStyle(element, '::details-content').blockSize))
    .not.toBe(opening)
  await expect.poll(() => disclosure.evaluate(element => getComputedStyle(element, '::details-content').opacity)).toBe('1')
  const expanded = await disclosure.evaluate(element => getComputedStyle(element, '::details-content').blockSize)
  await disclosure.locator('summary').click()
  await expect.poll(() => disclosure.evaluate(element => getComputedStyle(element, '::details-content').blockSize))
    .not.toBe(expanded)
  await expect.poll(() => disclosure.evaluate(element => getComputedStyle(element, '::details-content').blockSize)).toBe('0px')
})

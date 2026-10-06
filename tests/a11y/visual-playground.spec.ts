import { expect, test } from '@playwright/test'

for (const width of [390, 1280]) {
  for (const theme of ['light', 'dark']) {
    test(`visual playground keeps styled controls and responsive comparisons at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/docs/visual-playground')
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
      const reverse = page.getByRole('button', { name: 'Reverse order', exact: true })

      await expect(reverse).toBeVisible()
      const presentation = await reverse.evaluate(element => {
        const style = getComputedStyle(element)

        return {
          height: element.getBoundingClientRect().height,
          padding: Number.parseFloat(style.paddingInlineStart),
          border: Number.parseFloat(style.borderTopWidth)
        }
      })

      // A motion stylesheet loaded before the cascade declaration allowed Tailwind's
      // reset to erase button padding and borders even though the components mounted.
      expect(presentation.height).toBeGreaterThanOrEqual(40)
      expect(presentation.padding).toBeGreaterThan(0)
      expect(presentation.border).toBeGreaterThan(0)
      const duration = page.getByLabel('Duration · milliseconds', { exact: true })

      await expect(duration).toHaveValue('240')
      expect(await duration.evaluate(element => Number.parseFloat(getComputedStyle(element).borderTopWidth)))
        .toBeGreaterThan(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
        .toBeLessThanOrEqual(1)
      const columns = await page.locator('.visual-demo-grid').first().evaluate(element =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length)

      expect(columns).toBe(width < 720 ? 1 : 2)
      await reverse.press('Enter')
      await expect(page.locator('.visual-motion-list').first().getByRole('listitem').first()).toHaveText('Review')
      await page.getByRole('button', { name: 'Add item', exact: true }).click()
      await expect(page.locator('.visual-motion-list').first().getByRole('listitem').last()).toHaveText('New task 1')
    })
  }
}

test('visual playground remains usable with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/visual-playground')
  await page.getByRole('button', { name: 'Reverse order', exact: true }).press('Enter')
  const list = page.locator('.visual-motion-list').first()

  await expect(list.getByRole('listitem').first()).toHaveText('Review')
  expect(await list.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
  await page.getByRole('button', { name: 'Save demonstration', exact: true }).click()
  await expect(page.getByText('Saved for this demonstration.', { exact: true })).toBeVisible()
})


for (const width of [390, 1280]) {
  test.describe(`playground interactions at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/docs/visual-playground')
    })

    test('motion controls, tabs, disclosure and feedback', async ({ page }) => {
      const section = page.getByRole('region', { name: 'Coordinated motion', exact: true })
      const items = section.getByRole('list', { name: 'Animated tasks' }).getByRole('listitem')

      await expect(items).toHaveCount(3)
      await expect(section.getByRole('button', { name: 'Research', exact: true })).toHaveCount(0)
      await section.getByLabel('Duration · milliseconds').fill('1200')
      await expect(section.getByLabel('Duration · milliseconds')).toHaveValue('1000')
      await section.getByLabel('Duration · milliseconds').fill('-40')
      await expect(section.getByLabel('Duration · milliseconds')).toHaveValue('0')
      for (let count = 0; count < 3; count++) await section.getByRole('button', { name: 'Remove last' }).click()
      await expect(items).toHaveCount(0)
      await expect(section.getByRole('button', { name: 'Remove last' })).toBeDisabled()
      await expect(section.getByRole('button', { name: 'Reverse order' })).toBeDisabled()
      await expect(section.getByText('No tasks. Add an item to restart the comparison.')).toHaveCount(2)
      await section.getByRole('button', { name: 'Add item' }).click()
      await expect(items).toHaveText(['New task 1'])
      await section.getByRole('button', { name: 'Change view' }).click()
      await expect(section.getByRole('heading', { name: 'Workspace details' })).toBeVisible()
      await section.getByRole('button', { name: 'Change view' }).click()
      await expect(section.getByRole('heading', { name: 'Workspace overview' })).toBeVisible()
      await section.getByRole('tab', { name: 'Overview', exact: true }).press('ArrowRight')
      await expect(section.getByRole('tabpanel')).toHaveText('Your recent changes.')
      await section.getByRole('tab', { name: 'Activity', exact: true }).press('Home')
      await expect(section.getByRole('tabpanel')).toHaveText('Your project summary.')
      await section.getByText('Disclosure resizing', { exact: true }).click()
      await expect(section.getByText('Browsers that support interpolate-size animate the content height. Other browsers open it immediately.')).toBeVisible()
      await section.getByRole('button', { name: 'Save demonstration' }).click()
      await expect(section.getByRole('status')).toHaveText('Saved for this demonstration.')
    })

    test('all effects, intensity, animation and framework examples', async ({ page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      const section = page.getByRole('region', { name: 'Visual effects', exact: true })

      for (const variant of ['mesh', 'aurora', 'spotlight', 'grain', 'border', 'draw', 'depth']) {
        await section.getByRole('combobox', { name: 'Effect', exact: true }).click()
        await page.getByRole('option', { name: variant, exact: true }).click()
        await expect(section.locator('[data-ui-visual-effect]')).toHaveCount(2)
        for (const preview of await section.locator('[data-ui-visual-effect]').all()) {
          await expect(preview).toHaveAttribute('data-ui-visual-effect', variant)
        }
        if (['aurora', 'draw', 'depth'].includes(variant)) {
          await section.getByRole('button', { name: 'Enable animation' }).click()
          await expect(section.getByRole('button', { name: 'Pause animation' })).toHaveAttribute('aria-pressed', 'true')
          await section.getByRole('button', { name: 'Pause animation' }).click()
        } else await expect(section.getByRole('button', { name: 'Static effect' })).toBeDisabled()
      }
      await section.getByLabel('Intensity', { exact: true }).fill('0.8')
      for (const framework of ['Astro', 'React', 'Elements']) {
        await section.getByRole('tab', { name: framework, exact: true }).click()
        await expect(section.getByRole('tabpanel')).toContainText('depth')
        await expect(section.getByRole('tabpanel')).toContainText('0.8')
        await section.getByRole('button', { name: 'Copy code to clipboard' }).click()
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('depth')
      }
    })

    test('charts update, recover from empty and reset loading', async ({ page }) => {
      const section = page.getByRole('region', { name: 'Live chart continuity', exact: true })

      const plots = section.locator('[data-ui-chart-interaction-plot]')

      await plots.first().press('End')
      for (const chart of await section.locator('[data-ui-chart-sync]').all()) {
        await expect(chart.locator('[data-ui-chart-point="3"]')).toBeVisible()
      }
      await plots.first().press('Escape')
      for (const chart of await section.locator('[data-ui-chart-sync]').all()) {
        await expect(chart.locator('[data-ui-chart-inspection]')).toBeHidden()
      }

      await section.getByRole('button', { name: 'Update values' }).click()
      await section.getByRole('button', { name: 'Append point' }).click()
      await section.getByText('View chart data', { exact: true }).first().click()
      await expect(section.getByRole('table').first()).toContainText('40')
      await expect(section.getByRole('table').first().getByRole('row')).toHaveCount(6)
      await section.getByRole('button', { name: 'Empty', exact: true }).click()
      await expect(section.getByRole('button', { name: 'Update values' })).toBeDisabled()
      await expect(section.getByRole('button', { name: 'Empty', exact: true })).toBeDisabled()
      await expect(section.getByText('No chart data available.', { exact: true }).first()).toBeVisible()
      await section.getByRole('button', { name: 'Append point' }).click()
      await expect(section.getByRole('button', { name: 'Update values' })).toBeEnabled()
      await section.getByRole('button', { name: 'Show loading' }).click()
      await expect(section.locator('[aria-busy]')).toHaveAttribute('aria-busy', 'true')
      await section.getByRole('button', { name: 'Reset', exact: true }).click()
      await expect(section.locator('[aria-busy]')).toHaveAttribute('aria-busy', 'false')
      await expect(section.getByRole('button', { name: 'Show loading' })).toBeVisible()
      await section.getByText('View chart data', { exact: true }).first().click()
      await expect(section.getByRole('table').first().getByRole('row')).toHaveCount(5)
    })

    test('AI send, stop, retry, disclosure and approvals', async ({ page }) => {
      const section = page.getByRole('region', { name: 'AI surfaces', exact: true })

      await expect(section.getByRole('button', { name: 'Reset proposal' })).toBeDisabled()
      await section.getByLabel('Message', { exact: true }).fill('')
      await expect(section.getByRole('button', { name: 'Send', exact: true })).toBeDisabled()
      await section.getByLabel('Message', { exact: true }).fill('Preview the local workspace')
      await section.getByRole('button', { name: 'Send', exact: true }).click()
      await section.getByRole('button', { name: 'Stop', exact: true }).click()
      await expect(section.getByText('Response canceled', { exact: true })).toBeVisible()
      await section.getByRole('button', { name: 'Retry', exact: true }).click()
      await expect(section.getByText('Response complete', { exact: true })).toBeVisible()
      await section.getByText('Inspect project structure', { exact: true }).click()
      await expect(section.getByText('Three fictional tasks are available. No files are read.')).toBeVisible()
      for (const decision of ['Approve', 'Reject']) {
        await section.getByRole('button', { name: decision, exact: true }).click()
        await expect(section.getByText(`Decision: ${decision === 'Approve' ? 'approved' : 'rejected'}`, { exact: true })).toBeVisible()
        await expect(section.getByRole('button', { name: decision, exact: true })).toBeDisabled()
        await section.getByRole('button', { name: 'Reset proposal' }).click()
        await expect(section.getByText('Waiting for your decision', { exact: true })).toBeVisible()
      }
    })

    test('all recipes with keyboard commands and editable onboarding', async ({ page }) => {
      const section = page.getByRole('region', { name: 'Installable product blocks', exact: true })

      await section.getByRole('button', { name: 'Annual', exact: true }).click()
      await expect(section.getByText('$240 / year', { exact: true })).toBeVisible()
      await section.getByRole('button', { name: 'Choose team' }).click()
      await expect(section.getByText('Selected team, annual.', { exact: true })).toBeVisible()
      await section.getByRole('button', { name: 'Monthly', exact: true }).click()
      await expect(section.getByText('$24 / month', { exact: true })).toBeVisible()
      for (const stage of ['Review', 'Ship', 'Plan']) {
        await section.getByRole('button', { name: stage, exact: true }).click()
        await expect(section.getByText(`Previewing ${stage.toLowerCase()}.`, { exact: true })).toBeVisible()
      }
      const workspace = section.getByLabel('Workspace name', { exact: true })

      await workspace.fill('   ')
      await expect(section.getByRole('button', { name: 'Continue' })).toBeDisabled()
      await workspace.fill('Test workspace')
      await section.getByRole('button', { name: 'Continue' }).click()
      await expect(section.getByRole('heading', { name: 'Review your draft' })).toBeFocused()
      await section.getByRole('button', { name: 'Back', exact: true }).click()
      await expect(workspace).toHaveValue('Test workspace')
      await workspace.fill('Updated workspace')
      await section.getByRole('button', { name: 'Continue' }).click()
      await section.getByRole('button', { name: 'Complete setup' }).click()
      await expect(section.getByText('Workspace draft completed.', { exact: true })).toBeVisible()
      await section.getByRole('button', { name: 'Edit draft' }).click()
      await expect(workspace).toHaveValue('Updated workspace')
      const search = section.getByLabel('Search workspace commands', { exact: true })

      await search.fill('unmatched command')
      await expect(section.getByText('No matching commands. Try another search.', { exact: true })).toBeVisible()
      await search.fill('review')
      await search.press('ArrowDown')
      const review = section.getByRole('button', { name: 'Review pending proposals', exact: true })

      await expect(review).toBeFocused()
      await review.press('Enter')
      await expect(section.getByText('Selected: Review pending proposals', { exact: true })).toBeVisible()
      await review.press('Escape')
      await expect(search).toBeFocused()
      await search.fill('')
      await search.press('ArrowDown')
      const first = section.getByRole('button', { name: 'Search project documentation', exact: true })

      await expect(first).toBeFocused()
      await first.press('End')
      await expect(review).toBeFocused()
      await review.press('ArrowDown')
      await expect(first).toBeFocused()
    })
  })
}


test('aurora visibly moves, pauses in place, resumes and replays', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/docs/visual-playground#effects-workbench')
  const section = page.getByRole('region', { name: 'Visual effects', exact: true })
  const previews = section.locator('[data-ui-visual-effect]')
  const transform = () => previews.first().evaluate(element => getComputedStyle(element, '::before').transform)

  await section.getByRole('button', { name: 'Enable animation' }).click()
  await expect(section.getByRole('status', { name: 'Effect playback' })).toContainText('Playing aurora')
  const first = await transform()

  await expect.poll(transform).not.toBe(first)
  expect(await previews.last().evaluate(element => getComputedStyle(element, '::before').animationName)).toBe('none')
  await section.getByRole('button', { name: 'Pause animation' }).click()
  const paused = await transform()

  await page.waitForTimeout(250) // Sample elapsed motion, not page readiness.
  expect(await transform()).toBe(paused)
  await section.getByRole('button', { name: 'Enable animation' }).click()
  await expect.poll(transform).not.toBe(paused)
  await section.getByRole('button', { name: 'Replay effect' }).click()
  await expect(section.getByRole('button', { name: 'Pause animation' })).toHaveAttribute('aria-pressed', 'true')
})

test('line, area and bar geometry interpolate while the comparison and table update immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/docs/visual-playground#chart-workbench')
  const section = page.getByRole('region', { name: 'Live chart continuity', exact: true })

  await section.getByLabel('Transition · milliseconds').fill('2000')
  await section.getByText('View chart data', { exact: true }).first().click()
  const shapes = section.locator('[data-ui-chart-motion-key]')

  await section.getByRole('button', { name: 'Update values' }).click()
  await expect(section.getByRole('table').first()).toContainText('40')
  for (const selector of ['.ui-line-chart__line', '.ui-line-chart__area', '.ui-bar-chart__marks rect']) {
    const mark = section.locator(selector).last()

    await expect.poll(() => mark.evaluate(element => element.getAnimations().some(animation => animation.playState === 'running'))).toBe(true)
    const property = selector.includes('rect') ? 'height' : 'd'
    const read = () => mark.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)
    const initial = await read()

    await expect.poll(read).not.toBe(initial)
  }
  expect(await shapes.count()).toBeGreaterThan(12)
  const comparison = section.locator('[data-ui-chart-motion][data-ui-motion="reduce"]')

  expect(await comparison.locator('[data-ui-chart-motion-key]').evaluateAll(elements => elements.every(element => element.getAnimations().length === 0))).toBe(true)
  await section.getByRole('button', { name: 'Play charts', exact: true }).click()
  await expect(section.getByRole('button', { name: 'Pause charts', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const playingValues = await section.getByRole('table').first().innerText()

  await expect.poll(() => section.getByRole('table').first().innerText()).not.toBe(playingValues)
  await section.getByRole('button', { name: 'Pause charts', exact: true }).click()
  const values = await section.getByRole('table').first().innerText()

  await page.waitForTimeout(3200) // Longer than the playback interval proves timer cleanup.
  expect(await section.getByRole('table').first().innerText()).toBe(values)
})

test('system reduced motion suppresses effects and every chart animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/docs/visual-playground')
  const effects = page.getByRole('region', { name: 'Visual effects', exact: true })

  await effects.getByRole('button', { name: 'Enable animation' }).click()
  await expect(effects.getByRole('status', { name: 'Effect playback' })).toContainText('Your system requests reduced motion')
  expect(await effects.locator('[data-ui-visual-effect]').evaluateAll(elements => elements.every(element => getComputedStyle(element, '::before').animationName === 'none'))).toBe(true)
  const charts = page.getByRole('region', { name: 'Live chart continuity', exact: true })

  await expect(charts.getByRole('button', { name: 'Play charts' })).toBeDisabled()
  await charts.getByRole('button', { name: 'Update values' }).click()
  // The shared reduced-motion reset uses a 1 ms CSS transition to retain transitionend
  // contracts. ChartMotion must never introduce its normal 900 ms geometry animation.
  expect(await charts.locator('[data-ui-chart-motion-key]').evaluateAll(elements => elements.every(element =>
    element.getAnimations().every(animation => {
      const duration = animation.effect?.getComputedTiming().duration ?? 0

      return typeof duration === 'number' && duration <= 1
    })
  ))).toBe(true)
})


test('SVG drawing advances, pauses and replays after finishing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/docs/visual-playground#effects-workbench')
  const section = page.getByRole('region', { name: 'Visual effects', exact: true })

  await section.getByRole('combobox', { name: 'Effect', exact: true }).click()
  await page.getByRole('option', { name: 'draw', exact: true }).click()
  await section.getByLabel('Cycle · seconds').fill('2')
  await section.getByRole('button', { name: 'Replay effect' }).click()
  const path = section.locator('[data-ui-visual-effect]').first().locator('path')
  const offset = () => path.evaluate(element => Number.parseFloat(getComputedStyle(element).strokeDashoffset))
  const start = await offset()

  expect(start).toBeGreaterThan(0)
  await expect.poll(offset).toBeLessThan(start)
  await section.getByRole('button', { name: 'Pause animation' }).click()
  const paused = await offset()

  await page.waitForTimeout(150) // Paused decorative geometry must stay in place.
  expect(await offset()).toBe(paused)
  await section.getByRole('button', { name: 'Enable animation' }).click()
  await expect.poll(offset).toBe(0)
  await section.getByRole('button', { name: 'Replay effect' }).click()
  expect(await offset()).toBeGreaterThan(0)
})

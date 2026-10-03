import assert from 'node:assert/strict'
import { join } from 'node:path'

import { expect } from '@playwright/test'

const verifyContentFlow = async page => {
  await expect(page.getByRole('heading', { name: 'Notification settings', level: 1 })).toBeVisible()

  for (const [name, gap] of [['Settings sections', '32px'], ['Preference groups', '16px'], ['Preference actions', '8px']]) {
    const group = page.getByRole('group', { name, exact: true })

    await expect(group).toHaveCSS('gap', gap)

    const margins = await group.evaluate(element => [...element.children].map(child => {
      const style = getComputedStyle(child)

      return [style.marginTop, style.marginBottom]
    }))

    assert.ok(margins.every(values => values.every(value => value === '0px')), `${name} duplicates gap with child margins.`)
  }

  const container = page.locator('[data-ui-container]')

  await expect(container).toHaveCount(1)

  const gutter = await container.evaluate(element => {
    const bounds = element.getBoundingClientRect()

    return { left: bounds.left, right: innerWidth - bounds.right, padding: getComputedStyle(element).paddingInlineStart }
  })

  assert.ok(gutter.left >= 16 && Math.abs(gutter.left - gutter.right) < 1, 'Page gutters must be symmetric and token-owned.')

  assert.equal(gutter.padding, '0px', 'Container duplicates its page gutters with padding.')

  const field = page.getByRole('textbox', { name: 'Email address for weekly project activity summaries', exact: true })

  await expect(field).toHaveValue('ada@example.com')

  await field.fill('grace@example.com')

  const toggle = page.getByRole('button', { name: 'Show delivery details', exact: true })
  const details = page.getByText('Weekly summaries arrive on Monday.', { exact: true })

  await expect(details).toBeHidden()

  await toggle.focus()

  await toggle.press('Enter')

  await expect(details).toBeVisible()

  await toggle.press('Enter')

  await expect(details).toBeHidden()

  await expect(page.locator('[data-slot="card-content"][hidden]')).toHaveCount(1)

  await toggle.press('Enter')

  await expect(details).toBeVisible()

  await expect(field).toHaveValue('grace@example.com')

  await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible()
}

const verifyPresets = async (page, capture) => {
  await expect(page.getByRole('heading', { name: 'Appearance settings', level: 1 })).toBeVisible()

  const preview = page.getByRole('region', { name: 'Appearance preview', exact: true })
  const primary = page.getByRole('region', { name: 'Primary workspace', exact: true })
  const supporting = page.getByRole('region', { name: 'Supporting preview', exact: true })
  const field = preview.getByRole('textbox', { name: 'Workspace name', exact: true })
  const scheme = page.getByRole('button', { name: 'Dark scheme', exact: true })

  await expect(preview).toHaveAttribute('data-lumen-preset', 'default')

  await expect(preview).toHaveAttribute('data-lumen-scheme', 'light')

  await expect(field).toHaveValue('Atlas')

  await field.fill('Orion')

  for (const dark of [false, true]) {
    if (dark) {
      await scheme.focus()

      await scheme.press('Enter')
    }

    await expect(scheme).toHaveAttribute('aria-pressed', String(dark))

    await expect(preview).toHaveAttribute('data-lumen-scheme', dark ? 'dark' : 'light')

    for (const [name, radius] of [['Studio', '0.375rem'], ['Glass', '0.875rem'], ['Default', '0.625rem']]) {
      const button = page.getByRole('button', { name, exact: true })

      await button.focus()

      await button.press('Enter')

      await expect(button).toBeFocused()

      await expect(button).toHaveAttribute('aria-pressed', 'true')

      await expect(preview).toHaveAttribute('data-lumen-preset', name.toLowerCase())

      assert.equal(await preview.evaluate(element => getComputedStyle(element).getPropertyValue('--ui-radius').trim()), radius)

      await expect(primary).toHaveCSS('backdrop-filter', 'none')

      if (name === 'Glass') assert.notEqual(await supporting.evaluate(element => getComputedStyle(element).backdropFilter), 'none')
      else await expect(supporting).toHaveCSS('backdrop-filter', 'none')

      await expect(field).toHaveValue('Orion')

      await capture(`${name.toLowerCase()}-${dark ? 'dark' : 'light'}`)
    }
  }
}

export const verifyV4AgentScreen = async (page, kind, directory, root, width) => {
  await page.addScriptTag({ path: join(root, 'packages/elements/node_modules/axe-core/axe.min.js') })

  const capture = async suffix => {
    await page.evaluate(async () => {
      const transitions = document.getAnimations().filter(animation => animation instanceof CSSTransition)

      await Promise.allSettled(transitions.map(animation => animation.finished))
    })

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Horizontal overflow at ${width}px`)

    const violations = await page.evaluate(async () => (await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }
    })).violations.map(value => ({ id: value.id, impact: value.impact, nodes: value.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })))

    await page.screenshot({ path: join(directory, `${width}-${suffix}.png`), fullPage: true })

    assert.deepEqual(violations, [], `Accessibility violations in ${suffix}.`)
  }

  if (kind === 'react-content-flow') {
    await verifyContentFlow(page)

    await capture('content-flow')
  } else {
    assert.equal(kind, 'react-appearance-presets')

    await verifyPresets(page, capture)
  }
}

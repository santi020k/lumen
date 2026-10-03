import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`data list mounts a bounded window and keeps the last row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/docs/components/virtual-list')
    const list = page.locator('#data-virtual-list')

    await expect(list).toHaveAttribute('data-ui-range-start', '0')
    expect(await list.locator('[data-ui-virtual-list-index]').count()).toBeLessThan(20)
    const height = await list.evaluate(element => element.scrollHeight)

    await list.screenshot({ path: test.info().outputPath('data-list.png') })

    await list.evaluate(element => { element.scrollTop = element.scrollHeight })
    await expect(list.locator('[data-ui-virtual-list-index="9999"]')).toHaveText('Deployment #10000')
    expect(await list.evaluate(element => element.scrollHeight)).toBe(height)
    expect(await list.locator('[data-ui-virtual-list-index]').count()).toBeLessThan(20)
  })
}

for (const width of [390, 1440]) {
  test(`fixed-height list preserves its extent and last row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/docs/components/virtual-list')
    const list = page.locator('.component-doc-preview [data-ui-virtual-list-mode="mounted"]')

    await expect(list).toHaveAttribute('data-ui-range-start', '0')
    const initialHeight = await list.evaluate(element => element.scrollHeight)

    await list.evaluate(element => {
      element.style.maxHeight = '100px'
    })
    await expect(list).toHaveAttribute('data-ui-range-end', '5')
    await list.evaluate(element => {
      element.scrollTop = element.scrollHeight
    })
    await expect(list.locator(':scope > :not([data-ui-virtual-list-spacer]):not([hidden])').last()).toHaveText('Deployment #1')
    expect(await list.evaluate(element => element.scrollHeight)).toBe(initialHeight)
    await expect(list).toHaveAttribute('data-ui-range-end', '199')
    expect(await list.evaluate(element => element.scrollHeight)).toBe(initialHeight)
  })
}

test('Tab reaches rows beyond the initial window and scrolling retains the active control', async ({ page }) => {
  await page.goto('/docs/components/virtual-list')
  const list = page.locator('.component-doc-preview [data-ui-virtual-list-mode="mounted"]')

  await expect(list).toHaveAttribute('data-ui-range-start', '0')
  await list.evaluate(element => {
    for (const row of element.querySelectorAll(':scope > :not([data-ui-virtual-list-spacer])')) {
      const button = document.createElement('button')

      button.textContent = row.textContent
      row.replaceChildren(button)
    }
  })
  const first = list.getByRole('button', { name: 'Deployment #200', exact: true })

  await first.focus()
  for (let index = 0; index < 12; index += 1) await page.keyboard.press('Tab')
  await expect(list.getByRole('button', { name: 'Deployment #188', exact: true })).toBeFocused()
  await list.evaluate(element => {
    element.scrollTop = element.scrollHeight
  })
  await expect(list.getByRole('button', { name: 'Deployment #188', exact: true })).toBeFocused()
  await list.focus()
  await expect(list.locator(':scope > :not([data-ui-virtual-list-spacer]):not([hidden])')).not.toHaveCount(200)
})

test('external editor handles a toolbar request once and suppresses browser formatting', async ({ page }) => {
  await page.goto('/docs/components/rich-text-editor')
  const root = page.locator('.component-doc-preview [data-ui-rich-text-editor]')
  const editor = root.locator('[contenteditable="true"]')

  await root.evaluate(element => {
    element.setAttribute('data-ui-editor-native-state', 'false')
    element.addEventListener('ui:editor-command-request', event => {
      const request = event as CustomEvent<{ command: string, executed: boolean }>

      request.preventDefault()
      request.detail.executed = true
      element.setAttribute('data-engine-command', request.detail.command)
      element.setAttribute('data-engine-count', String(Number(element.getAttribute('data-engine-count') ?? 0) + 1))
    })
    element.addEventListener('ui:editor-command', event => {
      const completion = event as CustomEvent<{ executed: boolean }>

      element.setAttribute('data-command-result', String(completion.detail.executed))
    })
  })
  const original = await editor.innerHTML()

  await editor.focus()
  await page.keyboard.press('ControlOrMeta+A')
  await root.getByRole('button', { name: 'Bold', exact: true }).click()
  await expect(root).toHaveAttribute('data-engine-count', '1')
  await expect(root).toHaveAttribute('data-engine-command', 'bold')
  await expect(root).toHaveAttribute('data-command-result', 'true')
  expect(await editor.innerHTML()).toBe(original)
})

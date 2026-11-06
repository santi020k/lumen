import { expect, test } from '@playwright/test'

for (const platform of ['react', 'elements'] as const) {
  for (const [version, port] of [['5.0.0', 4762], ['4.4.0', 4763]] as const) {
    test(`generated ${platform} export works with Lumen ${version}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
      await page.goto(`http://127.0.0.1:${port}/${platform}/`)
      const input = page.getByRole('textbox', { name: 'Workspace name' })
      await input.fill('Edited workspace')
      await expect(input).toHaveAccessibleDescription('Shown to everyone in your workspace.')
      await expect(page.getByRole('heading', { name: 'Workspace settings' })).toBeVisible()
      await page.getByRole('tab', { name: 'Profile' }).press('ArrowRight')
      await expect(page.getByRole('tab', { name: 'Team' })).toBeFocused()
      await expect(page.getByRole('tabpanel', { name: 'Team' })).toContainText('details content')
      await expect(page.getByRole('tab', { name: 'npm', exact: true })).toHaveAttribute('aria-selected', 'true')
      await page.getByRole('tab', { name: 'yarn' }).click()
      await expect(page.getByRole('tabpanel', { name: 'yarn' })).toContainText('yarn install')
      await expect(page.getByRole('button', { name: 'Copy release sample' })).toBeVisible()
      const sample = page.locator('code').filter({ hasText: 'throw Error("injected")' })
      expect(await sample.textContent()).toBe('</code><script>throw Error("injected")</script>\n{expression} & "quoted"')
      await expect(page.getByRole('textbox', { name: 'Review input label' })).toHaveAttribute('placeholder', '" autofocus onfocus="throw Error(1)')
      await expect(page.getByText('Release 3', { exact: true })).toBeVisible()
      const trigger = page.getByRole('button', { name: 'Open dialog' })
      await trigger.click()
      const dialog = page.getByRole('dialog', { name: 'Archive workspace' })
      await expect(dialog).toBeVisible()
      const nativeDialog = page.locator('dialog')
      // The browser restores focus synchronously and dispatches close in a later rendering step.
      // Both adapters finish their own focus handling in that event.
      await nativeDialog.evaluate(element => {
        let closed = 0
        element.addEventListener('close', () => { element.setAttribute('data-test-close-count', String(++closed)); })
      })
      const cancel = dialog.getByRole('button', { name: 'Cancel' })
      await expect(cancel).toBeFocused()
      await cancel.click()
      await expect(nativeDialog).toHaveAttribute('data-test-close-count', '1')
      await expect(dialog).not.toBeVisible()
      await expect(trigger).toBeFocused()
      await trigger.press('Enter')
      await expect(dialog).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(nativeDialog).toHaveAttribute('data-test-close-count', '2')
      await expect(dialog).not.toBeVisible()
      await expect(trigger).toBeFocused()
      const html = page.locator('html')
      const branded = version === '4.4.0'
      await expect(html).toHaveAttribute(branded ? 'data-theme' : 'data-lumen-preset', branded ? 'santi020k-dark' : 'paper')
      const toggle = page.getByRole(platform === 'elements' && !branded ? 'switch' : 'button', { name: 'Toggle color theme' })
      await toggle.press('Enter')
      await expect(html).toHaveAttribute('data-theme', branded ? 'santi020k-light' : 'dark')
      if (platform === 'elements') {
        expect(await page.locator('lumen-stack *').evaluateAll(nodes => nodes.filter(node => node.localName.startsWith('lumen-') && !node.matches(':defined')).map(node => node.localName))).toEqual([])
      }
      expect(errors).toEqual([])
    })
  }
}

test('switches framework, downloads the selected starter and clears stale output', async ({ page }) => {
  await page.goto('/')
  for (const [label, extension, pkg] of [['React', 'tsx', 'react'], ['Web Components', 'html', 'elements']] as const) {
    await page.getByRole('combobox', { name: 'Export target' }).click()
    await page.getByRole('option', { name: label, exact: true }).click()
    await expect(page.getByRole('tablist', { name: 'Conversion output' })).toHaveCount(0)
    await page.getByRole('combobox', { name: 'Target version' }).click()
    await page.getByRole('option', { name: `Lumen 4.4.0 · ${label} 4.3.0` }).click()
    await page.getByRole('button', { name: 'Inspect selection' }).click()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: `Save ${label} starter` }).click()
    expect((await download).suggestedFilename()).toBe(`LumenSelection.${extension}`)
    await page.getByRole('tab', { name: `${label} setup` }).click()
    await expect(page.getByRole('tabpanel')).toContainText(`@santi020k/lumen-${pkg}/styles.css`)
    const setup = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Save app setup' }).click()
    expect((await setup).suggestedFilename()).toBe('lumen-setup.js')
    await page.getByRole('tab', { name: 'AI handoff' }).click()
    await expect(page.getByRole('tabpanel')).toContainText(`@santi020k/lumen-${pkg} 4.3.0`)
  }
})

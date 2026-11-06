import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

test('the built sandbox and offline UI exchange versioned exports', async ({ page }) => {
  const dist = new URL('../../apps/figma-plugin/dist/', import.meta.url)
  const [sandbox, ui] = await Promise.all([
    readFile(new URL('code.js', dist), 'utf8'),
    readFile(new URL('ui.html', dist), 'utf8')
  ])
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const html = `<!doctype html><html lang="en"><body>
    <script>
      const __html__ = ${JSON.stringify(ui).replaceAll('<', '\\u003c')};
      const frame = document.createElement('iframe');
      frame.setAttribute('sandbox', 'allow-scripts allow-downloads');
      const figma = {
        showUI: html => { frame.srcdoc = html; document.body.append(frame) },
        on: () => {}, root: { setRelaunchData: () => {} },
        currentPage: { on: () => {}, selection: [{ id: 'test', name: 'Real bridge test', type: 'TEXT', visible: true, characters: 'Hello Lumen' }] },
        ui: { postMessage: pluginMessage => frame.contentWindow.postMessage({ pluginMessage }, '*') }
      };
      window.addEventListener('message', event => {
        if (event.source === frame.contentWindow) figma.ui.onmessage(event.data.pluginMessage);
      });
    </script><script src="/sandbox.js"></script></body></html>`
  await page.route('**/sandbox.js', route => route.fulfill({ contentType: 'text/javascript', body: sandbox }))
  await page.route('**/bundle-test', route => route.fulfill({ contentType: 'text/html', body: html }))
  await page.goto('/bundle-test')
  const panel = page.frameLocator('iframe')
  await expect(panel.getByRole('heading', { name: 'Real bridge test' })).toBeVisible()
  await panel.getByRole('combobox', { name: 'Target version' }).click()
  await panel.getByRole('option', { name: 'Lumen Astro 4.4.0' }).click()
  await panel.getByRole('button', { name: 'Inspect selection' }).click()
  await expect(panel.getByRole('tabpanel')).toContainText('Hello Lumen')
  await panel.getByRole('tab', { name: 'Astro layout' }).click()
  await expect(panel.getByRole('tabpanel')).toContainText('@santi020k/lumen-astro/styles.css')
  for (const [name, pkg] of [['React', 'react'], ['Web Components', 'elements']] as const) {
    await panel.getByRole('combobox', { name: 'Export target' }).click()
    await panel.getByRole('option', { name, exact: true }).click()
    await expect(panel.getByRole('tablist', { name: 'Conversion output' })).toHaveCount(0)
    await panel.getByRole('button', { name: 'Inspect selection' }).click()
    await panel.getByRole('tab', { name: `${name} setup` }).click()
    await expect(panel.getByRole('tabpanel')).toContainText(`@santi020k/lumen-${pkg}/styles.css`)
  }
  for (const [label, extension, version] of [
    ['React Native', 'tsx', '4.1.0'], ['Android · Jetpack Compose', 'kt', '4.1.0'],
    ['iPhone · SwiftUI', 'swift', '5.0.0'], ['Mac · SwiftUI', 'swift', '5.0.0']
  ] as const) {
    await panel.getByRole('combobox', { name: 'Export target' }).click()
    await panel.getByRole('option', { name: label, exact: true }).click()
    await expect(panel.getByRole('tablist')).toHaveCount(0)
    await expect(panel.getByText(version + ' ·', { exact: false })).toBeVisible()
    await expect(panel.getByRole('combobox', { name: 'Project appearance' })).toHaveCount(0)
    await panel.getByRole('button', { name: 'Inspect selection' }).click()
    await expect(panel.getByRole('tabpanel')).toContainText('Hello Lumen')
    const download = page.waitForEvent('download')
    await panel.getByRole('button', { name: 'Save ' + label + ' starter' }).click()
    expect((await download).suggestedFilename()).toBe('LumenSelection.' + extension)
  }
  expect(errors).toEqual([])
})

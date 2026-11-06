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
  await page.context().grantPermissions(['clipboard-read'], { origin: new URL(page.url()).origin })
  const starterDownload = page.waitForEvent('download')
  await panel.getByRole('button', { name: 'Save Astro starter' }).click()
  const sourcePath = await (await starterDownload).path()
  if (!sourcePath) throw new Error('Missing saved Astro starter.')
  const source = await readFile(sourcePath, 'utf8')
  expect(source).toContain('Hello Lumen')
  await panel.getByRole('button', { name: 'Copy code to clipboard' }).click()
  await expect(panel.getByRole('button', { name: 'Code copied to clipboard' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source)
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

test('receives selection from the Figma editor above the desktop sandbox', async ({ page }) => {
  const ui = await readFile(new URL('../../apps/figma-plugin/dist/ui.html', import.meta.url), 'utf8')
  // Desktop relays UI requests through its sandbox, then responds directly from the top frame.
  const wrapper = `<!doctype html><script>
    window.addEventListener('message', event => {
      if (event.source === frames[0] && event.data.pluginMessage?.type === 'ready') parent.postMessage('ready', '*')
      if (event.source === parent && event.data === 'done') {
        frames[0].postMessage({ pluginMessage: { type: 'error', message: 'Host check complete' } }, '*')
      }
    })
  </script><iframe sandbox="allow-scripts" src="/local-plugin"></iframe>`
  const editor = `<!doctype html><script>
    window.addEventListener('message', event => {
      if (event.source === frames[0] && event.data === 'ready') {
        frames[0].frames[0].postMessage({ pluginMessage: { type: 'selection', name: 'Onboarding form' } }, '*')
        frames[0].postMessage('done', '*')
      }
    })
  </script><iframe src="https://www.figma.com/local-sandbox"></iframe>`
  await page.route('https://www.figma.com/local-plugin', route => route.fulfill({ contentType: 'text/html', body: ui }))
  await page.route('https://www.figma.com/local-sandbox', route => route.fulfill({ contentType: 'text/html', body: wrapper }))
  await page.route('https://www.figma.com/local-editor', route => route.fulfill({ contentType: 'text/html', body: editor }))
  await page.goto('https://www.figma.com/local-editor')
  const panel = page.frameLocator('iframe').frameLocator('iframe')
  await expect(panel.getByRole('heading', { name: 'Onboarding form' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Inspect selection' })).toBeEnabled()

  await page.route('https://untrusted.example/local-editor', route => route.fulfill({ contentType: 'text/html', body: editor }))
  await page.goto('https://untrusted.example/local-editor')
  await expect(panel.getByText('Host check complete')).toBeVisible()
  await expect(panel.getByRole('heading', { name: 'Nothing selected' })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Inspect selection' })).toBeDisabled()
})

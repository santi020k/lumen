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
  await panel.getByRole('button', { name: 'Open handoff' }).click()
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
  await panel.getByRole('tab', { name: 'Layout' }).click()
  await expect(panel.getByRole('tabpanel')).toContainText('@santi020k/lumen-astro/styles.css')
  for (const [name, pkg] of [['React', 'react'], ['Web Components', 'elements']] as const) {
    await panel.getByRole('button', { name: 'Back to review' }).click()
    await panel.getByRole('button', { name: 'Back to setup' }).click()
    await panel.getByRole('combobox', { name: 'Export target' }).click()
    await panel.getByRole('option', { name, exact: true }).click()
    await expect(panel.getByRole('tablist', { name: 'Conversion output' })).toHaveCount(0)
    await panel.getByRole('button', { name: 'Inspect selection' }).click()
    await panel.getByRole('button', { name: 'Open handoff' }).click()
    await panel.getByRole('tab', { name: 'Setup' }).click()
    await expect(panel.getByRole('tabpanel')).toContainText(`@santi020k/lumen-${pkg}/styles.css`)
  }
  for (const [label, extension, version] of [
    ['React Native', 'tsx', '4.1.0'], ['Android · Jetpack Compose', 'kt', '4.1.0'],
    ['iPhone · SwiftUI', 'swift', '5.0.0'], ['Mac · SwiftUI', 'swift', '5.0.0']
  ] as const) {
    await panel.getByRole('button', { name: 'Back to review' }).click()
    await panel.getByRole('button', { name: 'Back to setup' }).click()
    await panel.getByRole('combobox', { name: 'Export target' }).click()
    await panel.getByRole('option', { name: label, exact: true }).click()
    await expect(panel.getByRole('tablist')).toHaveCount(0)
    await expect(panel.getByText(version + ' ·', { exact: false })).toBeVisible()
    await expect(panel.getByRole('combobox', { name: 'Project appearance' })).toHaveCount(0)
    await panel.getByRole('button', { name: 'Inspect selection' }).click()
    await panel.getByRole('button', { name: 'Open handoff' }).click()
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

test('the offline inspector follows the editor theme and fits long selections', async ({ page }) => {
  const ui = await readFile(new URL('../../apps/figma-plugin/dist/ui.html', import.meta.url), 'utf8')
  await page.setViewportSize({ width: 480, height: 720 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.setContent(ui)
  const root = page.locator('html')
  await expect(root).toHaveCSS('color-scheme', 'dark')
  await root.evaluate(element => { element.classList.add('figma-light'); })
  await expect(root).toHaveCSS('color-scheme', 'light')
  const inspect = page.getByRole('button', { name: 'Inspect selection' })
  await expect(inspect).toBeDisabled()
  await expect(inspect).toBeInViewport({ ratio: 1 })

  const name = 'Component'.repeat(20)
  await page.evaluate(selection => {
    window.postMessage({ pluginMessage: { type: 'selection', name: selection } }, '*')
  }, name)
  await expect(page.getByRole('heading', { name })).toBeVisible()
  await expect(inspect).toBeEnabled()
  await page.getByRole('combobox', { name: 'Export target' }).click()
  await page.getByRole('option', { name: 'Android · Jetpack Compose' }).click()
  await root.evaluate(element => element.classList.replace('figma-light', 'figma-dark'))
  await expect(root).toHaveCSS('color-scheme', 'dark')
  await expect(page.getByRole('combobox', { name: 'Export target' })).toHaveText('Android · Jetpack Compose')

  await page.setViewportSize({ width: 320, height: 720 })
  expect(await root.evaluate(element => element.scrollWidth <= innerWidth)).toBe(true)
  await page.evaluate(() => { window.postMessage({ pluginMessage: { type: 'error', message: 'Try a smaller frame.' } }, '*'); })
  await expect(page.getByRole('status')).toHaveText('Try a smaller frame.')
})

test('keeps the handoff available for an unsupported design and resets on a new selection', async ({ page }) => {
  const ui = await readFile(new URL('../../apps/figma-plugin/dist/ui.html', import.meta.url), 'utf8')
  await page.setViewportSize({ width: 480, height: 720 })
  await page.setContent(ui)
  await expect(page.getByRole('heading', { name: 'Nothing selected' })).toBeVisible()
  await page.evaluate(() => { window.postMessage({ pluginMessage: { type: 'selection', name: 'Artwork' } }, '*'); })
  await page.getByRole('button', { name: 'Inspect selection' }).click()
  await expect(page.getByRole('combobox', { name: 'Export target' })).toBeDisabled()
  await page.evaluate(() => {
    window.postMessage({ pluginMessage: { type: 'result', result: {
      target: 'astro', lumenVersion: '5.0.0', selectionName: 'Artwork', code: '', layout: 'Setup',
      findings: [{ nodeId: 'shape', name: 'Shape', status: 'unsupported', message: 'Review the original design.' }],
      handoff: 'Review the drawing.'
    } } }, '*')
  })
  await expect(page.getByText('No starter is available', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Open handoff' }).click()
  await expect(page.getByRole('tab', { name: 'AI handoff' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: 'Starter' })).toHaveCount(0)
  await page.evaluate(() => { window.postMessage({ pluginMessage: { type: 'selection', name: 'New frame' } }, '*'); })
  await expect(page.getByRole('heading', { name: 'Export settings' })).toBeFocused()
  await expect(page.getByRole('heading', { name: 'New frame' })).toBeVisible()
  await expect(page.getByRole('tablist', { name: 'Conversion output' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Inspect selection' })).toBeEnabled()
})

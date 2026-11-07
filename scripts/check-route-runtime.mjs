import assert from 'node:assert/strict'

/** @param {import('@playwright/test').Browser} browser @param {string} origin */
export const checkScopedInitialization = async (browser, origin) => {
  const page = await browser.newPage()
  const errors = []

  page.on('pageerror', error => errors.push(error.message))

  await page.goto(`${origin}/static-runtime/`)

  await page.waitForLoadState('networkidle')

  const state = await page.evaluate(async () => {
    const toggle = document.createElement('button')

    toggle.setAttribute('data-ui-toggle', '')

    toggle.setAttribute('aria-pressed', 'false')

    toggle.textContent = 'First scoped toggle'

    await window.LumenInitUiPrimitives(toggle)

    toggle.click()

    const detached = toggle.getAttribute('aria-pressed')
    const sibling = document.createElement('button')

    sibling.setAttribute('data-ui-toggle', '')

    sibling.setAttribute('aria-pressed', 'false')

    sibling.textContent = 'Second scoped toggle'

    document.body.append(toggle, sibling)

    await window.LumenInitUiPrimitives(toggle)

    toggle.click()

    return { detached, first: toggle.getAttribute('aria-pressed'), sibling: sibling.dataset.uiBound ?? null }
  })

  assert.deepEqual(state, { detached: 'true', first: 'false', sibling: null })

  await page.getByRole('button', { name: 'Second scoped toggle' }).click()

  assert.equal(await page.getByRole('button', { name: 'Second scoped toggle' }).getAttribute('aria-pressed'), 'true')

  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<button data-ui-dialog-trigger="scoped-dialog">Open dynamic dialog</button><dialog id="scoped-dialog" data-ui-dialog aria-label="Dynamic dialog"><button data-ui-dialog-close>Close dynamic dialog</button></dialog>')
  })

  const trigger = page.getByRole('button', { name: 'Open dynamic dialog' })
  const dialog = page.getByRole('dialog', { name: 'Dynamic dialog' })

  await trigger.click()

  await dialog.waitFor({ state: 'visible' })

  assert.equal(await dialog.getAttribute('aria-modal'), 'true')

  await page.getByRole('button', { name: 'Close dynamic dialog' }).click()

  await dialog.waitFor({ state: 'hidden' })

  await page.waitForFunction(() => document.activeElement?.textContent === 'Open dynamic dialog')

  assert.deepEqual(errors, [])

  await page.close()
}

/** @param {import('@playwright/test').Browser} browser @param {string} origin */
export const checkDialogViewport = async (browser, origin) => {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })

    await page.goto(`${origin}/dialog/?theme=lumen-dark&direction=rtl&text=200%`)

    await page.getByRole('button', { name: 'Open dialog' }).click()

    const dialog = page.getByRole('dialog')

    await dialog.waitFor({ state: 'visible' })

    const bounds = await dialog.boundingBox()
    const close = await dialog.getByRole('button', { name: 'Close', exact: true }).boundingBox()

    assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width, 'Enlarged RTL dialog stays inside the viewport.')

    assert(close && close.x >= 0 && close.x + close.width <= width, 'Dialog recovery control stays reachable.')

    await dialog.getByRole('button', { name: 'Close', exact: true }).click()

    await dialog.waitFor({ state: 'hidden' })

    await page.close()
  }
}

/** @param {import('@playwright/test').Browser} browser @param {string} origin */
export const checkDynamicToast = async (browser, origin) => {
  const page = await browser.newPage()
  const styles = []
  const errors = []

  page.on('request', request => { if (request.url().endsWith('.css')) styles.push(request.url()) })

  page.on('pageerror', error => { errors.push(error.message) })

  await page.goto(`${origin}/static-runtime/`)

  await page.waitForLoadState('networkidle')

  assert(!styles.some(url => url.includes('toast')), 'Absent toasts must not load their styles.')

  await page.evaluate(() => {
    window.LumenToast.create({ title: 'Saved', duration: 0, action: { label: 'Undo' } })
  })

  const toast = page.locator('.ui-toast')

  await toast.waitFor({ state: 'visible' })

  assert(styles.some(url => url.includes('toast')), 'Dynamic toasts load their own stylesheet.')

  assert.equal(await toast.evaluate(element => getComputedStyle(element).display), 'grid')

  assert.equal(await toast.getByRole('button', { name: 'Undo', exact: true }).count(), 1)

  assert.deepEqual(errors, [])

  await page.close()
}

/** @param {Record<string, string[]>} graph @param {string} suffix */
const featureAsset = (graph, suffix) => {
  const asset = Object.entries(graph).find(([, modules]) => modules.some(module => module.endsWith(suffix)))?.[0]

  assert(asset, `Missing feature asset for ${suffix}`)

  return asset
}

/** @param {import('@playwright/test').Browser} browser @param {string} origin
 * @param {Record<string, string[]>} graph */
export const checkColdInteractions = async (browser, origin, graph) => {
  const asset = featureAsset(graph, '/runtime/controllers/dialogs.ts')

  for (const activation of ['click', 'Enter', 'Space']) {
    const page = await browser.newPage()
    let release = () => undefined
    const held = new Promise(resolve => { release = resolve })
    const started = page.waitForRequest(`**/${asset}`)

    await page.route(`**/${asset}`, async route => {
      await held

      await route.continue()
    })

    await page.goto(`${origin}/dialog/`, { waitUntil: 'domcontentloaded' })

    await started

    const trigger = page.getByRole('button', { name: 'Open dialog' })

    if (activation === 'click') await trigger.click()
    else await trigger.press(activation)

    release()

    await page.getByRole('dialog').waitFor({ state: 'visible' })

    await page.getByRole('button', { name: 'Close', exact: true }).click()

    await page.getByRole('dialog').waitFor({ state: 'hidden' })

    assert.equal(await trigger.evaluate(element => element === document.activeElement), true)

    await page.close()
  }
}

/** @param {import('@playwright/test').Browser} browser @param {string} origin */
export const checkNavigation = async (browser, origin) => {
  const page = await browser.newPage()
  const errors = []

  page.on('pageerror', error => { errors.push(error.message) })

  await page.goto(`${origin}/navigation-dialog/`)

  await page.getByRole('button', { name: 'Open dialog' }).click()

  await page.getByRole('dialog').waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'Close', exact: true }).click()

  const documentStartedAt = await page.evaluate(() => performance.timeOrigin)

  await page.evaluate(() => { window.LumenToast.create({ title: 'Before navigation', duration: 0 }) })

  await page.locator('.ui-toast').waitFor({ state: 'visible' })

  for (let index = 0; index < 2; index += 1) {
    await page.getByRole('link', { name: 'Next fixture' }).click()

    await page.waitForURL('**/navigation-calendar/')

    await page.evaluate(() => { window.LumenToast.create({ title: 'After navigation', duration: 0 }) })

    const toast = page.locator('.ui-toast')

    await toast.waitFor({ state: 'visible' })

    assert.equal(await toast.evaluate(element => getComputedStyle(element).display), 'grid',
      'Cached toast controllers must retain their dynamically loaded stylesheet after a head swap.')

    assert.equal(await page.locator('link[rel="stylesheet"][href*="toast"]').count(), 1)

    await page.locator('[data-ui-calendar-next]').click()

    assert.match(await page.locator('[data-ui-calendar-label]').innerText(), /December 2026/)

    await page.getByRole('link', { name: 'Next fixture' }).click()

    await page.waitForURL('**/navigation-dialog/')

    await page.getByRole('button', { name: 'Open dialog' }).click()

    await page.getByRole('dialog').waitFor({ state: 'visible' })

    await page.getByRole('button', { name: 'Close', exact: true }).click()
  }

  assert.equal(await page.evaluate(() => performance.timeOrigin), documentStartedAt)

  assert.deepEqual(errors, [])

  await page.close()
}

/** @param {import('@playwright/test').Browser} browser @param {string} origin
 * @param {Record<string, string[]>} graph */
export const checkFailedChunkRecovery = async (browser, origin, graph) => {
  const page = await browser.newPage()
  const asset = featureAsset(graph, '/runtime/controllers/dialogs.ts')
  let failed = false

  await page.addInitScript(() => {
    document.addEventListener('ui:runtime-error', () => { document.documentElement.dataset.runtimeFailed = 'true' })
  })

  await page.route(`**/${asset}`, async route => {
    if (failed) { await route.continue();

 return }

    failed = true

    await route.abort('failed')
  })

  const failure = page.waitForEvent('pageerror')

  await page.goto(`${origin}/dialog/`)

  await failure

  assert.equal(await page.locator('html').getAttribute('data-runtime-failed'), 'true')

  // A document reload is portable even when a browser caches failed module requests.
  await page.reload()

  await page.getByRole('button', { name: 'Open dialog' }).click()

  await page.getByRole('dialog').waitFor({ state: 'visible' })

  await page.close()
}

import assert from 'node:assert/strict'

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

  for (let index = 0; index < 2; index += 1) {
    await page.getByRole('link', { name: 'Next fixture' }).click()

    await page.waitForURL('**/navigation-calendar/')

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

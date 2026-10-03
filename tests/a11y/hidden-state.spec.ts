import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

const stylesheet = await readFile(new URL('../../packages/lumen/styles.css', import.meta.url), 'utf8')

test('standalone primitives preserve native hidden semantics and keyboard order', async ({ page }) => {
  await page.setContent(`
    <button id="before">Before</button>
    <button class="ui-button" hidden>Hidden action</button>
    <section class="ui-empty" hidden>Hidden empty state</section>
    <section class="ui-error-state" hidden>Hidden error state</section>
    <div class="ui-card" hidden="false">Hidden card</div>
    <div class="ui-stack" hidden="hidden">Hidden stack</div>
    <button id="after">After</button>
  `)
  await page.addStyleTag({ content: stylesheet })

  for (const element of await page.locator('[hidden]').all()) {
    await expect(element).toHaveCSS('display', 'none')
    await expect(element).not.toBeVisible()
  }

  await page.locator('#before').focus()
  await page.keyboard.press('Tab')
  await expect(page.locator('#after')).toBeFocused()

  const action = page.locator('.ui-button')

  await action.evaluate(element => {
    element.removeAttribute('hidden')
  })
  await expect(action).toBeVisible()
  await page.locator('#before').focus()
  await page.keyboard.press('Tab')
  await expect(action).toBeFocused()
})

test('hidden until-found retains browser find-in-page layout semantics', async ({ page }) => {
  await page.setContent('<section class="ui-empty" hidden="until-found">Find this content</section>')
  await page.addStyleTag({ content: stylesheet })

  const state = page.locator('.ui-empty')

  await expect(state).toHaveCSS('display', 'grid')
  await expect(state).toHaveCSS('content-visibility', 'hidden')
})

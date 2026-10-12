import { expect, test } from '@playwright/test'

test('unnamed Astro ListBoxes have unique native, list, label and option references', async ({ page }) => {
  await page.goto('/internal/list-box-adapters')
  const group = page.locator('#unnamed-lists')
  const controls = group.locator('select')
  const ids = await controls.evaluateAll(elements => elements.map(element => element.id))
  expect(ids).toHaveLength(2)
  expect(new Set(ids).size).toBe(2)
  for (const name of ['First unnamed list', 'Second unnamed list']) {
    const list = group.getByRole('listbox', { name, exact: true })
    await group.getByText(name, { exact: true }).click()
    await expect(list).toBeFocused()
    const active = await list.getAttribute('aria-activedescendant')
    expect(active).toBeTruthy()
    if (!active) throw new Error('Expected an active option ID')
    await expect(list.locator(`[id="${active}"]`)).toHaveText('Amina')
    await expect(page.locator(`[id="${active}"]`)).toHaveCount(1)
  }
})

for (const adapter of ['Astro', 'Elements']) {
  test(`${adapter} ListBox keeps one focus stop and supports validation, selection and reset`, async ({ page }) => {
    await page.goto('/internal/list-box-adapters')
    const form = page.locator(`#${adapter.toLowerCase()}-list-form`)
    const list = form.getByRole('listbox', { name: `${adapter} reviewers`, exact: true })
    const native = form.locator('select')
    await expect(list).toBeVisible()
    await expect(native).toHaveAttribute('tabindex', '-1')
    await expect(native).toHaveAttribute('aria-hidden', 'true')
    await expect(list).toHaveAttribute('aria-required', 'true')
    await expect(list).toHaveJSProperty('ariaMultiSelectable', 'true')
    await form.getByRole('button', { name: `Before ${adapter}` }).focus()
    await page.keyboard.press('Tab')
    await expect(list).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(form.getByRole('button', { name: `Submit ${adapter}` })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(list).toBeFocused()
    await expect(list).toHaveAttribute('aria-invalid', 'true')
    await page.keyboard.press('Home')
    await page.keyboard.press(' ')
    await expect(list.getByRole('option', { name: 'Amina' })).toHaveAttribute('aria-selected', 'true')
    await expect(list).not.toHaveAttribute('aria-invalid', 'true')
    expect(await form.evaluate(element => element instanceof HTMLFormElement ? new FormData(element).getAll('reviewers') : [])).toEqual(['amina'])
    await form.evaluate(element => {
      element.addEventListener('reset', event => { event.preventDefault() }, { once: true })
      if (element instanceof HTMLFormElement) element.reset()
    })
    await expect(list.getByRole('option', { name: 'Amina' })).toHaveAttribute('aria-selected', 'true')
    await form.getByRole('button', { name: `Reset ${adapter}` }).click()
    await expect(list.getByRole('option', { name: 'Amina' })).toHaveAttribute('aria-selected', 'false')
    await form.getByRole('button', { name: `Submit ${adapter}` }).click()
    await expect(list).toHaveAttribute('aria-invalid', 'true')
    await form.evaluate(element => {
      element.addEventListener('reset', event => { event.preventDefault() }, { once: true })
      if (element instanceof HTMLFormElement) element.reset()
    })
    await expect(list).toHaveAttribute('aria-invalid', 'true')
    await form.getByRole('button', { name: `Reset ${adapter}` }).click()
    await expect(list).not.toHaveAttribute('aria-invalid', 'true')
    await native.evaluate(element => { element.setAttribute('disabled', '') })
    await expect(list).toHaveAttribute('aria-disabled', 'true')
    await expect(list).toHaveAttribute('tabindex', '-1')
    await form.getByRole('button', { name: `Before ${adapter}` }).focus()
    await page.keyboard.press('Tab')
    await expect(form.getByRole('button', { name: `Submit ${adapter}` })).toBeFocused()
    await native.evaluate(element => { element.removeAttribute('disabled') })
    await expect(list).not.toHaveAttribute('aria-disabled', 'true')
    await expect(list).toHaveAttribute('tabindex', '0')
  })

  test(`${adapter} ListBox clears obsolete generated invalid state`, async ({ page }) => {
    await page.goto('/internal/list-box-adapters')
    const form = page.locator(`#${adapter.toLowerCase()}-list-form`)
    const list = form.getByRole('listbox')
    const native = form.locator('select')
    await form.getByRole('button', { name: `Submit ${adapter}` }).click()
    await expect(list).toHaveAttribute('aria-invalid', 'true')
    await native.evaluate(element => { element.removeAttribute('required') })
    await expect(list).not.toHaveAttribute('aria-invalid')
    await native.evaluate(element => { element.setAttribute('required', '') })
    await expect(list).not.toHaveAttribute('aria-invalid')
    await form.getByRole('button', { name: `Submit ${adapter}` }).click()
    await expect(list).toHaveAttribute('aria-invalid', 'true')
    await native.evaluate(element => { element.setAttribute('disabled', '') })
    await expect(list).not.toHaveAttribute('aria-invalid')
    await native.evaluate(element => { element.removeAttribute('disabled') })
    await expect(list).not.toHaveAttribute('aria-invalid')
  })

  test(`${adapter} ListBox mirrors changing consumer accessibility state`, async ({ page }) => {
    await page.goto('/internal/list-box-adapters')
    const form = page.locator(`#${adapter.toLowerCase()}-list-form`)
    const list = form.getByRole('listbox')
    const native = form.locator('select')
    await native.evaluate(element => {
      element.setAttribute('aria-label', 'Updated reviewers')
      element.setAttribute('aria-describedby', 'list-help')
      element.setAttribute('aria-errormessage', 'list-error')
      element.setAttribute('aria-invalid', 'grammar')
      element.removeAttribute('required')
    })
    await expect(list).toHaveAccessibleName('Updated reviewers')
    await expect(list).toHaveAttribute('aria-describedby', 'list-help')
    await expect(list).toHaveAttribute('aria-errormessage', 'list-error')
    await expect(list).toHaveAttribute('aria-invalid', 'grammar')
    await expect(list).not.toHaveAttribute('aria-required', 'true')
    await form.getByRole('button', { name: `Reset ${adapter}` }).click()
    await expect(list).toHaveAttribute('aria-invalid', 'grammar')
    await native.evaluate(element => {
      element.removeAttribute('aria-label')
      element.removeAttribute('aria-describedby')
      element.removeAttribute('aria-errormessage')
      element.removeAttribute('aria-invalid')
      element.setAttribute('required', '')
    })
    await expect(list).toHaveAccessibleName(`${adapter} reviewers`)
    await expect(list).not.toHaveAttribute('aria-describedby')
    await expect(list).not.toHaveAttribute('aria-errormessage')
    await expect(list).not.toHaveAttribute('aria-invalid')
    await expect(list).toHaveAttribute('aria-required', 'true')
  })
}

test('a reinserted bound Astro ListBox resynchronizes external labels after LumenInitUiPrimitives', async ({ page }) => {
  await page.goto('/internal/list-box-adapters')
  const group = page.locator('#unnamed-lists')
  const selectId = await group.locator('[data-ui-list-box] select').first().getAttribute('id')
  if (!selectId) throw new Error('Expected a native select ID')
  // Anchored to its select so the locator keeps naming this root after it leaves and returns.
  const root = page.locator('[data-ui-list-box]').filter({ has: page.locator(`select[id="${selectId}"]`) })
  const list = root.locator('[data-ui-list-box-list]')
  const addLabel = (id: string, text: string) => page.evaluate(({ id, selectId, text }) => {
    const label = document.createElement('label')
    label.id = id
    label.htmlFor = selectId
    label.textContent = text
    document.body.append(label)
  }, { id, selectId, text })
  await expect(root).toHaveAttribute('data-ui-list-box-bound', 'true')
  await addLabel('external-reviewers-label', 'External reviewers')
  await expect(list).toHaveAttribute('aria-labelledby', /(^| )external-reviewers-label( |$)/)
  await expect(group.getByRole('listbox', { name: 'First unnamed list External reviewers', exact: true })).toBeVisible()
  await page.locator('#external-reviewers-label').evaluate(element => { element.remove() })
  await expect(list).not.toHaveAttribute('aria-labelledby', /external-reviewers-label/)
  await expect(group.getByRole('listbox', { name: 'First unnamed list', exact: true })).toBeVisible()
  // The same bound root leaves, misses a label change while detached, then returns through the runtime entry point.
  const rootHandle = await root.elementHandle()
  await rootHandle.evaluate(element => { element.remove() })
  await expect(root).toHaveCount(0)
  await addLabel('detached-reviewers-label', 'Detached reviewers')
  await rootHandle.evaluate(element => { document.querySelector('#unnamed-lists')?.prepend(element) })
  await expect(list).not.toHaveAttribute('aria-labelledby', /detached-reviewers-label/)
  await page.evaluate(() => {
    const init: unknown = Reflect.get(window, 'LumenInitUiPrimitives')
    if (typeof init !== 'function') throw new Error('Expected the Lumen runtime entry point')
    Reflect.apply(init, window, [document.querySelector('#unnamed-lists')])
  })
  await expect(root).toHaveAttribute('data-ui-list-box-bound', 'true')
  await expect(list).toHaveAttribute('aria-labelledby', /(^| )detached-reviewers-label( |$)/)
  await addLabel('returned-reviewers-label', 'Returned reviewers')
  await expect(list).toHaveAttribute('aria-labelledby', /(^| )returned-reviewers-label( |$)/)
  await expect(group.getByRole('listbox', {
    name: 'First unnamed list Detached reviewers Returned reviewers', exact: true
  })).toBeVisible()
  await group.getByText('First unnamed list', { exact: true }).click()
  await expect(list).toBeFocused()
})

for (const adapter of ['Astro', 'Elements']) {
  test(`${adapter} ListBox follows external labels after synchronous document adoption`, async ({ page }) => {
    await page.goto('/internal/list-box-adapters')
    await expect(page.locator(`#${adapter.toLowerCase()}-list-form [data-ui-list-box-list]`)).toBeVisible()
    await page.evaluate(adapter => {
      const root = document.querySelector<HTMLElement>(adapter === 'Astro' ? '#unnamed-lists [data-ui-list-box]' : 'lumen-list-box')
      const select = root?.querySelector('select')
      if (!root || !select) throw new Error('Missing enhanced list')
      const iframe = document.createElement('iframe')
      iframe.id = 'adopted-list'
      document.body.append(iframe)
      const destination = iframe.contentDocument
      if (!destination) throw new Error('Missing destination document')
      destination.body.append(destination.adoptNode(root))
      const label = destination.createElement('label')
      label.id = 'adopted-label'
      label.htmlFor = select.id
      label.textContent = 'Adopted reviewers'
      destination.body.append(label)
    }, adapter)
    const frame = page.frameLocator('#adopted-list')
    const list = frame.locator('[data-ui-list-box-list]')
    await expect(list).toHaveAttribute('aria-labelledby', /(^| )adopted-label( |$)/)
    await frame.locator('#adopted-label').evaluate(label => { label.id = 'renamed-label' })
    await expect(list).toHaveAttribute('aria-labelledby', /(^| )renamed-label( |$)/)
    await frame.locator('#renamed-label').evaluate(label => { label.remove() })
    await expect(list).not.toHaveAttribute('aria-labelledby', /renamed-label/)
  })
}


for (const adapter of ['Astro', 'Elements']) {
  test(`${adapter} ListBox selection resets with a late external form`, async ({ page }) => {
    await page.goto('/internal/list-box-adapters')
    const list = page.locator(`#${adapter.toLowerCase()}-list-form [data-ui-list-box-list]`)
    const native = page.locator(`#${adapter.toLowerCase()}-list-form select`)
    await expect(list).toBeVisible()
    await native.evaluate(select => { select.setAttribute('form', 'late-reset-form') })
    await page.evaluate(() => {
      const form = document.createElement('form')
      form.id = 'late-reset-form'
      document.body.append(form)
    })
    await list.getByRole('option', { name: 'Amina' }).click()
    await expect(list.getByRole('option', { name: 'Amina' })).toHaveAttribute('aria-selected', 'true')
    await page.locator('#late-reset-form').evaluate(form => {
      if (!(form instanceof HTMLFormElement)) throw new Error('Missing form')
      form.reset()
    })
    await expect(list.getByRole('option', { name: 'Amina' })).toHaveAttribute('aria-selected', 'false')
  })
}

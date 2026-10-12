// cspell:words Elegir fecha Précédent Suivant valuetext
import { expect, test } from '@playwright/test'

for (const adapter of ['astro', 'elements']) {
  test(`${adapter} DatePicker closes when removed and can reopen after reinsertion`, async ({ page }) => {
    await page.goto('/internal/date-controls')
    const form = page.locator(`#${adapter}-form`)
    const trigger = form.locator('[data-ui-date-picker-trigger]')
    const popover = form.locator('[data-ui-date-picker-popover]')
    await trigger.click()
    await expect(popover).toBeVisible()
    await form.evaluate(async element => {
      const parent = element.parentElement
      const next = element.nextSibling
      if (!parent) throw new Error('Expected form parent')
      element.remove()
      await new Promise<void>(resolve => requestAnimationFrame(() => { resolve(); }))
      parent.insertBefore(element, next)
    })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).not.toHaveAttribute('popover')
    await trigger.click()
    await expect(popover).toBeVisible()
    await popover.locator('[data-date="2026-07-24"]').click()
    await expect(form.locator('[data-ui-date-picker-native]')).toHaveValue('2026-07-24')
  })

  test(`${adapter} DatePicker escapes a scrolling dialog and closes with its parent`, async ({ page }, testInfo) => {
    await page.goto('/internal/date-controls')
    const form = page.locator(`#${adapter}-form`)
    const trigger = form.locator('[data-ui-date-picker-trigger]')
    await expect(trigger).toBeVisible()
    await form.evaluate(root => {
      const dialog = document.createElement('dialog')
      dialog.setAttribute('aria-label', 'Scrolling date form')
      dialog.style.cssText = 'width:280px;height:150px;overflow:auto;padding:16px;margin:60px auto;'
      root.before(dialog)
      dialog.append(root)
      dialog.showModal()
    })
    await trigger.click()
    const popover = form.locator('[data-ui-date-picker-popover]')
    const day = popover.locator('[data-date="2026-07-24"]')
    await expect(popover).toBeVisible()
    await expect(popover).toHaveCSS('opacity', '1')
    await page.screenshot({ path: testInfo.outputPath(`date-overlay-${adapter}.png`) })
    await expect.poll(() => day.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const hit = element.ownerDocument.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      return hit !== null && element.contains(hit)
    })).toBe(true)
    await day.click()
    await expect(form.locator('[data-ui-date-picker-native]')).toHaveValue('2026-07-24')
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(popover).toBeVisible()
    await page.getByRole('dialog', { name: 'Scrolling date form', exact: true }).evaluate(element => {
      if (!(element instanceof HTMLDialogElement)) throw new Error('Expected containing dialog')
      element.close()
    })
    await expect(page.locator(':popover-open')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).not.toHaveAttribute('popover')
  })
}

test('Astro SSR renders the requested locale, real dates, custom labels and year bounds without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()

  await page.goto('/internal/date-controls')
  await expect(page.locator('#astro-calendar [data-ui-calendar-label]')).toContainText('julio')
  await expect(page.locator('#astro-calendar [data-ui-calendar-prev]')).toHaveAttribute('aria-label', 'Mes anterior')
  await expect(page.locator('#custom-calendar [data-ui-calendar-next]')).toHaveAttribute('aria-label', 'Suivant')
  await expect(page.locator('#early-calendar [data-ui-calendar-prev]')).toBeDisabled()
  await expect(page.locator('#early-calendar [data-date="0001-01-02"]')).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#invalid-date')).toHaveValue('')
  await expect(page.locator('#invalid-date').locator('..').locator('[data-ui-date-picker-value]')).toHaveText('Select appointment')
  await expect(page.locator('#astro-date')).toBeVisible()
  await context.close()
})

for (const adapter of ['astro', 'elements']) {
  test(`${adapter} picker preserves label focus, localization, keyboard selection and form state`, async ({ page }) => {
    await page.goto('/internal/date-controls')
    const form = page.locator(`#${adapter}-form`)
    const trigger = form.locator('[data-ui-date-picker-trigger]')
    const native = form.locator('[data-ui-date-picker-native]')
    const popover = form.locator('[data-ui-date-picker-popover]')

    await expect(trigger).toBeVisible()
    await form.locator('label').click()
    await expect(popover).toBeVisible()
    await expect(popover.locator('[data-ui-calendar-day][tabindex="0"]')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await trigger.press('ArrowDown')
    await expect(popover).toBeVisible()
    await expect(popover).toHaveAttribute('aria-label', 'Elegir fecha')
    await expect(popover.locator('[data-ui-calendar-label]')).toContainText('julio')
    await expect(popover.locator('[data-date="2026-07-23"]')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await expect(native).toHaveValue('2026-07-24')
    await expect(popover).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(popover.locator('[data-ui-calendar-day][tabindex="0"]')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await expect(popover).toBeHidden()
    await trigger.click()
    await form.evaluate(element => {
      element.addEventListener('reset', event => { event.preventDefault(); }, { once: true })
      if (element instanceof HTMLFormElement) element.reset()
    })
    await expect(native).toHaveValue('2026-07-24')
    await expect(popover).toBeVisible()
    // Close the calendar before clicking the reset control that it overlaps.
    await expect(popover.locator('[data-ui-calendar-day][tabindex="0"]')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(popover).toBeHidden()
    await form.locator('[type="reset"]').click()
    await expect(native).toHaveValue('2026-07-23')
    await expect(form.locator('[data-ui-date-picker-value]')).toContainText('23')
    await trigger.click()
    await expect(popover).toBeVisible()
    await form.evaluate(element => { if (element instanceof HTMLFormElement) element.reset() })
    await expect(popover).toBeHidden()
    await native.evaluate(input => { input.setAttribute('readonly', '') })
    await trigger.dispatchEvent('click')
    await expect(popover).toBeHidden()
    await native.evaluate(input => { input.removeAttribute('readonly') })
    await trigger.click()
    await expect(popover).toBeVisible()
    await native.evaluate(input => { input.setAttribute('disabled', '') })
    await expect(popover).toBeHidden()
    await expect(trigger).toBeDisabled()
    expect(await form.evaluate(element => element instanceof HTMLFormElement && new FormData(element).has('appointment'))).toBe(false)
  })
}

test('Astro calendar moves keyboard focus across months and restores the initial form value', async ({ page }) => {
  await page.goto('/internal/date-controls')
  const calendar = page.locator('#astro-calendar')

  await calendar.locator('[data-date="2026-07-31"]').focus()
  await page.keyboard.press('ArrowRight')
  await expect(calendar.locator('[data-date="2026-08-01"]')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(calendar.locator('input')).toHaveValue('2026-08-01')
  await page.locator('#calendar-form').evaluate(element => {
    element.addEventListener('reset', event => { event.preventDefault(); }, { once: true })
    if (element instanceof HTMLFormElement) element.reset()
  })
  await expect(calendar.locator('input')).toHaveValue('2026-08-01')
  await page.locator('#calendar-form').evaluate(element => { if (element instanceof HTMLFormElement) element.reset() })
  await expect(calendar.locator('input')).toHaveValue('2026-07-31')
  await calendar.evaluate(element => { element.setAttribute('data-readonly', 'true') })
  await calendar.locator('[data-date="2026-07-30"]').click()
  await expect(calendar.locator('input')).toHaveValue('2026-07-31')
})

test('a real reset-button click synchronizes ImageComparison value, frame and accessible text', async ({ page }) => {
  await page.goto('/internal/date-controls')
  const form = page.locator('#comparison-form')
  const range = form.getByRole('slider', { name: 'Compare reset behavior' })
  const frame = form.locator('.ui-image-comparison__frame')

  await expect(range).toBeEnabled()
  await range.evaluate(input => {
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected native range input')

    input.value = '75'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(frame).toHaveCSS('--ui-image-comparison-position', '75%')
  await form.getByRole('button', { name: 'Reset comparison' }).click()
  await expect(range).toHaveValue('25')
  await expect(range).toHaveAttribute('aria-valuetext', /25%/)
  await expect(frame).toHaveCSS('--ui-image-comparison-position', '25%')
  expect(await form.evaluate(element => element instanceof HTMLFormElement && new FormData(element).get('reveal'))).toBe('25')
})

test('Calendar navigates after adoption while attribute updates preserve focused day', async ({ page }) => {
  await page.goto('/internal/date-controls')
  await expect(page.locator('#astro-calendar')).toHaveAttribute('data-ui-bound', 'true')
  const result = await page.evaluate(async () => {
    const root = document.querySelector<HTMLElement>('#astro-calendar')
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const destination = iframe.contentDocument
    if (!root || !destination) throw new Error('Missing adoption fixture')
    destination.body.append(destination.adoptNode(root))
    const day = root.querySelector<HTMLElement>('[data-date="2026-07-23"]')
    if (!day) throw new Error('Missing calendar day')
    day.focus()
    root.setAttribute('lang', 'en')
    await new Promise(resolve => setTimeout(resolve, 0))
    return destination.activeElement?.getAttribute('data-date')
  })
  expect(result).toBe('2026-07-23')
})

test('Tooltip opens with generated IDs unique in its owning iframe document', async ({ page }) => {
  await page.goto('/internal/date-controls')
  const result = await page.evaluate(() => {
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const destination = iframe.contentDocument
    if (!destination) throw new Error('Missing destination document')
    // Occupy the next generated IDs in the destination, including IDs absent from the source.
    for (let index = 1; index < 2000; index++) {
      const node = destination.createElement('span')
      node.id = 'ui-tooltip-' + String(index)
      destination.body.append(node)
    }
    const root = destination.createElement('div')
    root.dataset.uiTooltip = ''
    root.innerHTML = '<button type="button">Help</button><span role="tooltip">Explanation</span>'
    destination.body.append(root)
    const initialize: unknown = Reflect.get(window, 'LumenInitUiPrimitives')
    const isInitializer = (value: unknown): value is (scope: ParentNode) => void => typeof value === 'function'
    if (!isInitializer(initialize)) throw new Error('Missing public runtime initialization')
    initialize(destination)
    const tooltip = root.querySelector('[role="tooltip"]')
    const id = tooltip?.id
    if (!id) throw new Error('Missing generated tooltip ID')
    return {
      unique: destination.querySelectorAll('[id="' + id + '"]').length === 1,
      linked: root.querySelector('button')?.getAttribute('aria-describedby') === id
    }
  })
  expect(result).toEqual({ unique: true, linked: true })
})

test('Calendar navigates Elements attribute updates after cross-document adoption', async ({ page }) => {
  await page.goto('/internal/date-controls')
  await expect(page.locator('lumen-date-picker lumen-calendar')).toHaveAttribute('data-ui-bound', 'true')
  await page.locator('#elements-form [data-ui-date-picker-trigger]').click()
  await expect(page.locator('lumen-date-picker lumen-calendar [data-date="2026-07-23"]')).toBeVisible()
  const result = await page.evaluate(async () => {
    const root = document.querySelector<HTMLElement>('lumen-date-picker lumen-calendar')
    if (!root) throw new Error('Missing Elements calendar fixture')
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const destination = iframe.contentDocument
    if (!destination) throw new Error('Missing destination document')
    destination.body.append(destination.adoptNode(root))
    const day = root.querySelector<HTMLElement>('[data-date="2026-07-23"]')
    if (!day) throw new Error('Missing calendar day')
    day.focus()
    root.setAttribute('lang', 'en')
    await new Promise(resolve => setTimeout(resolve, 0))
    return destination.activeElement?.getAttribute('data-date')
  })
  expect(result).toBe('2026-07-23')
})

test('ImageComparison follows reassigned and adopted form resets without canceling drafts', async ({ page }) => {
  await page.goto('/internal/date-controls')
  const comparison = page.locator('[data-ui-image-comparison]')

  await expect(comparison.locator('input[type="range"]')).toBeEnabled()
  const result = await comparison.evaluate(async root => {
    const form = document.createElement('form')

    document.body.append(form)
    form.append(root)
    const input = root.querySelector<HTMLInputElement>('input[type="range"]')
    const frame = root.querySelector<HTMLElement>('.ui-image-comparison__frame')

    if (!input || !frame) throw new Error('Missing comparison controls')

    input.value = '80'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    form.reset()
    await new Promise(resolve => setTimeout(resolve, 0))
    const reset = frame.style.getPropertyValue('--ui-image-comparison-position')

    input.value = '80'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    form.addEventListener('reset', event => { event.preventDefault() }, { once: true })
    form.reset()
    await new Promise(resolve => setTimeout(resolve, 0))
    const canceled = frame.style.getPropertyValue('--ui-image-comparison-position')
    const iframe = document.createElement('iframe')

    document.body.append(iframe)
    const destination = iframe.contentDocument

    if (!destination) throw new Error('Missing destination document')

    destination.body.append(destination.adoptNode(form))
    const initialize = (window as Window & { LumenInitUiPrimitives?: (scope: ParentNode) => void }).LumenInitUiPrimitives

    if (!initialize) throw new Error('Missing initializer')

    initialize(destination)
    await new Promise(resolve => setTimeout(resolve, 0))
    return { reset, canceled }
  })

  expect(result).toEqual({ reset: '25%', canceled: '80%' })
  // Optional media initialization imports asynchronously in the destination scope.
  await expect.poll(() => page.evaluate(async () => {
    const form = document.querySelector('iframe')?.contentDocument?.querySelector('form')

    if (!form) throw new Error('Missing adopted form')

    form.reset()
    await new Promise(resolve => setTimeout(resolve, 0))

    return form.querySelector<HTMLElement>('.ui-image-comparison__frame')?.style.getPropertyValue('--ui-image-comparison-position')
  })).toBe('25%')
})

for (const adapter of ['astro', 'elements']) {
  test(`${adapter} DatePicker mirrors dynamic application errors and clears only generated validation`, async ({ page }) => {
    await page.goto('/internal/date-controls')
    const native = page.locator(`#${adapter}-form [data-ui-date-picker-native]`)
    const trigger = page.locator(`#${adapter}-form [data-ui-date-picker-trigger]`)

    await expect(trigger).toBeVisible()
    await native.evaluate(input => {
      input.setAttribute('aria-invalid', 'grammar')
      input.setAttribute('aria-errormessage', 'application-date-error')
      input.setAttribute('aria-describedby', 'application-date-help')
    })
    await expect(trigger).toHaveAttribute('aria-invalid', 'grammar')
    await expect(trigger).toHaveAttribute('aria-errormessage', 'application-date-error')
    await expect(trigger).toHaveAttribute('aria-describedby', 'application-date-help')
    await native.evaluate(input => {
      if (!(input instanceof HTMLInputElement)) throw new Error('Expected date input')
      input.form?.reset()
    })
    await expect(trigger).toHaveAttribute('aria-invalid', 'grammar')
    await native.evaluate(input => {
      input.removeAttribute('aria-invalid')
      input.removeAttribute('aria-errormessage')
    })
    await expect(trigger).not.toHaveAttribute('aria-invalid')
    await expect(trigger).not.toHaveAttribute('aria-errormessage')
    await native.evaluate(input => {
      if (!(input instanceof HTMLInputElement)) throw new Error('Expected date input')
      input.required = true
      input.value = ''
      input.checkValidity()
    })
    await expect(trigger).toHaveAttribute('aria-invalid', 'true')
    await native.evaluate(input => {
      if (!(input instanceof HTMLInputElement)) throw new Error('Expected date input')
      input.value = '2026-07-24'
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await expect(trigger).not.toHaveAttribute('aria-invalid')
  })
}

for (const adapter of ['astro', 'elements']) {
  test(`${adapter} DatePicker keeps its calendar and focus during ARIA updates`, async ({ page }) => {
    await page.goto('/internal/date-controls')
    const form = page.locator(`#${adapter}-form`)
    const trigger = form.locator('[data-ui-date-picker-trigger]')
    const popover = form.locator('[data-ui-date-picker-popover]')
    const native = form.locator('[data-ui-date-picker-native]')
    await trigger.click()
    const day = popover.locator('[data-ui-calendar-day][tabindex="0"]')
    await day.focus()
    await native.evaluate(input => {
      for (const [name, value] of Object.entries({
        'aria-invalid': 'grammar', 'aria-errormessage': 'error', 'aria-describedby': 'help',
        'aria-label': 'Appointment', 'aria-labelledby': 'appointment-label'
      })) input.setAttribute(name, value)
    })
    await expect(popover).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(day).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-invalid', 'grammar')
    await expect(trigger).toHaveAttribute('aria-errormessage', 'error')
    await expect(trigger).toHaveAttribute('aria-describedby', 'help')
    await expect(trigger).toHaveAttribute('aria-label', 'Appointment')
    await expect(trigger).toHaveAttribute('aria-labelledby', 'appointment-label')
    await native.evaluate(input => { input.setAttribute('disabled', '') })
    await expect(popover).toBeHidden()
  })
}

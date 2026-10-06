// cspell:words Elegir fecha Précédent Suivant valuetext
import { expect, test } from '@playwright/test'

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
    await form.locator('[type="reset"]').click()
    await expect(native).toHaveValue('2026-07-23')
    await expect(form.locator('[data-ui-date-picker-value]')).toContainText('23')
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

import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`Combobox keeps editing focus during option navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/docs/components/combobox')
    const input = page.locator('.component-doc-preview input[role="combobox"]')

    await input.fill('rea')
    await input.press('ArrowDown')
    await expect(input).toBeFocused()
    const option = page.locator('.component-doc-preview [role="option"][aria-selected="true"]')

    await expect(option).toHaveText('React')
    await expect(input).toHaveAttribute('aria-activedescendant', await option.getAttribute('id') ?? '')
    await input.press('Backspace')
    await expect(input).toHaveValue('re')
    await expect(input).not.toHaveAttribute('aria-activedescendant')
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(input).toHaveValue('react')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
  })
}

test('Combobox ignores composing keys and follows options added after initialization', async ({ page }) => {
  await page.goto('/docs/components/combobox')
  const root = page.locator('.component-doc-preview [data-ui-combobox]')
  const input = root.locator('input')

  await input.fill('rea')
  await input.press('ArrowDown')
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
  await expect(input).toHaveValue('rea')
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await input.fill('angular')
  await root.locator('[role="listbox"]').evaluate(list => {
    const option = document.createElement('button')

    option.type = 'button'
    option.setAttribute('role', 'option')
    option.dataset.value = 'angular'
    option.textContent = 'Angular'
    list.append(option)
  })
  await input.press('ArrowDown')
  await expect(root.getByRole('option', { name: 'Angular' })).toHaveAttribute('aria-selected', 'true')
  await input.press('Enter')
  await expect(input).toHaveValue('angular')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
})

test('Escape closes a Combobox before its containing dialog', async ({ page }) => {
  await page.goto('/docs/components/combobox')
  const root = page.locator('.component-doc-preview [data-ui-combobox]')

  await root.evaluate(element => {
    const dialog = document.createElement('dialog')

    dialog.setAttribute('aria-label', 'Nested control fixture')
    element.before(dialog)
    dialog.append(element)
    dialog.showModal()
  })
  const input = page.getByRole('combobox', { name: 'Framework' })
  const dialog = page.getByRole('dialog', { name: 'Nested control fixture' })

  await input.fill('rea')
  await input.press('Escape')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await expect(dialog).toBeVisible()
  await input.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('nested disclosures consume Escape once from either the trigger or the panel', async ({ page }) => {
  await page.goto('/docs/components/combobox')
  const root = page.locator('.component-doc-preview [data-ui-combobox]')

  await root.evaluate(element => {
    const wrapper = document.createElement('div')

    wrapper.setAttribute('data-ui-popover', '')
    wrapper.innerHTML = `<button data-ui-trigger aria-controls="outer-keyboard-panel">Outer popup</button>
      <div id="outer-keyboard-panel" data-ui-panel hidden>
        <div data-ui-popover><button data-ui-trigger aria-controls="inner-keyboard-panel">Inner popup</button>
          <div id="inner-keyboard-panel" data-ui-panel hidden></div>
        </div>
      </div>`
    element.before(wrapper)
    wrapper.querySelector('#inner-keyboard-panel')?.append(element)
    const initialize = (window as Window & { LumenInitUiPrimitives?: (scope: ParentNode) => void }).LumenInitUiPrimitives

    if (typeof initialize === 'function') initialize(document)
  })
  const outer = page.getByRole('button', { name: 'Outer popup', exact: true })
  const inner = page.getByRole('button', { name: 'Inner popup', exact: true })

  await outer.click()
  await inner.click()
  await inner.press('Escape')
  await expect(inner).toHaveAttribute('aria-expanded', 'false')
  await expect(outer).toHaveAttribute('aria-expanded', 'true')
  await inner.click()
  const input = root.locator('input')

  await input.fill('rea')
  await input.press('Escape')
  await expect(inner).toHaveAttribute('aria-expanded', 'true')
  await input.press('Home')
  await expect(input).toBeFocused()
  await input.press('Escape')
  await expect(inner).toHaveAttribute('aria-expanded', 'false')
  await expect(inner).toBeFocused()
  await expect(outer).toHaveAttribute('aria-expanded', 'true')
  await inner.press('Escape')
  await expect(outer).toHaveAttribute('aria-expanded', 'false')
  await expect(outer).toBeFocused()
})

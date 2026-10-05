import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`consumer forms and record actions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })

    await page.goto('/docs/web/consumer-workflows')

    const form = page.getByRole('form', { name: 'Formulario de ejemplo' })
    const name = page.getByRole('textbox', { name: 'Nombre del registro' })
    const amount = page.getByRole('textbox', { name: 'Monto de ejemplo (COP)' })

    await expect(amount).toHaveValue('1.234,50')

    await form.getByRole('button', { name: 'Guardar ejemplo' }).click()

    await expect(name).toBeFocused()

    await name.fill('Registro sintético')

    await amount.fill('9,50')

    await form.getByRole('button', { name: 'Guardar ejemplo' }).click()

    await expect(page.locator('[data-submitted-amount]')).toHaveText('Submitted decimal string: 9.50')

    await form.getByRole('button', { name: 'Simular error del servidor' }).click()

    await form.getByRole('button', { name: 'Guardar ejemplo' }).click()

    await expect(name).toBeFocused()

    await expect(amount).toHaveValue('9,50')

    await expect(page.locator('#consumer-form-errors')).toContainText('El servidor de ejemplo solicita otro nombre.')

    await form.getByRole('button', { name: 'Restablecer' }).click()

    await expect(amount).toHaveValue('1.234,50')

    await expect(page.locator('#consumer-form-errors')).toBeHidden()

    await page.getByRole('button', { name: 'Nombre', exact: true }).click()

    await expect(page.locator('[data-sort-request]')).toHaveText('name: ascending')

    const trigger = page.getByRole('button', { name: 'Acciones: Registro de ejemplo B' })

    await trigger.focus()

    await page.keyboard.press('Enter')

    const menuItem = page.getByRole('menuitem', { name: 'Ver registro' })

    await expect(menuItem).toBeVisible()

    await menuItem.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Ver registro' })

    await expect(dialog).toBeVisible()

    await expect(dialog.getByRole('button', { name: 'Cerrar registro' })).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()

    await expect(trigger).toBeFocused()

    await expect(page.getByRole('region', { name: 'Empty synthetic records' })).toBeVisible()

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.screenshot({ path: testInfo.outputPath(`consumer-workflows-${width}.png`), fullPage: true })

    await form.screenshot({ path: testInfo.outputPath(`consumer-form-${width}.png`) })

    await page.getByRole('region', { name: 'Registros sintéticos' }).screenshot({ path: testInfo.outputPath(`consumer-records-${width}.png`) })
  })
}

test('Astro amount field submits an exact localized decimal', async ({ page }) => {
  await page.goto('/docs/components/amount-field')

  const amount = page.getByRole('textbox', { name: 'Amount COP' }).first()

  await expect(amount).toHaveValue('1.234,50')

  await amount.fill('9,50')

  await expect(amount).toHaveValue('9,50')

  expect(await amount.evaluate(input => input.parentElement?.querySelector<HTMLInputElement>('[data-ui-amount-value]')?.value)).toBe('9.50')
})

test('activity feeds follow updates and preserve a reader across prepended history', async ({ page }) => {
  await page.goto('/docs/web/consumer-workflows')

  const viewport = page.getByLabel('Synthetic activity feed', { exact: true })

  for (let index = 0; index < 20; index += 1) await page.getByRole('button', { name: 'Append event', exact: true }).click()

  await expect.poll(() => viewport.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2)

  await viewport.evaluate(element => {
    element.scrollTop = 0
  })

  await expect(viewport).toHaveAttribute('data-at-end', 'false')

  const original = viewport.getByText('Synthetic activity feed. Scroll up to read without following new messages.', { exact: true })
  const before = await original.evaluate(element => element.getBoundingClientRect().top)

  await page.getByRole('button', { name: 'Load earlier', exact: true }).click()

  await expect.poll(async () => Math.abs(await original.evaluate(element => element.getBoundingClientRect().top) - before)).toBeLessThan(2)

  await viewport.getByRole('button', { name: 'Jump to latest' }).click()

  await expect(viewport).toHaveAttribute('data-at-end', 'true')

  await expect(viewport).toBeFocused()
})

test('theme inspection resolves light, dark and inherited nested mappings', async ({ page }) => {
  await page.goto('/docs/web/consumer-workflows')

  await page.getByRole('button', { name: 'Audit resolved scopes' }).click()

  await expect(page.locator('[data-theme-audit-result]')).toHaveText('light: passed\nnested: passed\ndark: passed')

  await page.locator('[data-theme-audit-scope="nested"]').evaluate(scope => {
    scope.style.setProperty('--on-brand', '0 0% 0%')
  })

  await page.getByRole('button', { name: 'Audit resolved scopes' }).click()

  await expect(page.locator('[data-theme-audit-result]')).toContainText('--on-brand on --brand-solid has 1:1 contrast')
})

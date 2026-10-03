import { expect, test } from '@playwright/test'

for (const width of [390, 1280]) {
  test(`PhoneInput preserves geometry and keyboard behavior at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/docs/components/phone-input')
    const preview = page.locator('.component-doc-preview')
    const field = preview.locator('.ui-phone-input').first()
    const selector = field.locator('select')
    const input = preview.getByLabel('Phone number', { exact: true })

    await expect(field).toHaveAttribute('data-phone-enhanced', 'true')
    await expect(input).toHaveAttribute('id', 'ex-phone')
    await expect(input).toHaveAttribute('required', '')
    const sizes = await preview.locator('.ui-phone-input').evaluateAll(elements => (
      elements.map(element => element.getBoundingClientRect().height)
    ))
    expect(sizes).toEqual([44, 40, 48, 44, 44, 44])
    const geometry = await field.evaluate(element => {
      const number = element.querySelector('input')
      const country = element.querySelector('.ui-phone-input__picker')
      if (!number || !country) throw new Error('Missing phone field controls')
      return {
        gap: number.getBoundingClientRect().left - country.getBoundingClientRect().right,
        fontSize: getComputedStyle(number).fontSize
      }
    })
    expect(geometry).toEqual({ gap: 0, fontSize: '16px' })

    const picker = field.locator('.ui-phone-input__picker')
    const normalBackground = await picker.evaluate(element => getComputedStyle(element).backgroundColor)
    await picker.hover()
    await expect.poll(() => picker.evaluate(element => getComputedStyle(element).backgroundColor))
      .not.toBe(normalBackground)
    await selector.focus()
    await expect(selector).toBeFocused()
    const focusRing = await field.evaluate(element => getComputedStyle(element).boxShadow)
    expect(focusRing).not.toBe('none')
    await selector.press('Tab')
    await expect(input).toBeFocused()

    await input.fill('3')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(preview.locator('.ui-phone-input__error').first()).toBeVisible()
    await selector.selectOption('US')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await input.fill('+57 601 5550123')
    await expect(selector).toHaveValue('CO')
    await expect(field.locator('[data-ui-phone-code]')).toHaveText('+57')
    await expect(input).toHaveAttribute('aria-invalid', 'false')
    await expect(preview.locator('.ui-phone-input__error').first()).toBeHidden()

    await expect(preview.getByLabel('Disabled', { exact: true })).toBeDisabled()
    await expect(preview.locator('.ui-phone-input[data-disabled] select')).toBeDisabled()
    await expect(preview.getByLabel('Disabled', { exact: true })).toHaveCSS('opacity', '1')
    await expect(preview.locator('.ui-phone-input[data-disabled]')).toHaveCSS('opacity', '0.55')
    await expect(preview.getByLabel('Read only', { exact: true })).toHaveAttribute('readonly', '')
    await expect(preview.locator('.ui-phone-input[data-readonly] select')).toBeDisabled()
    await expect(preview.locator('.ui-phone-number[href^="tel:"]')).toHaveCount(1)
  })
}

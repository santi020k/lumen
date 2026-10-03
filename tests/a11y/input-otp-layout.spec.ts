import { expect, test } from '@playwright/test'

for (const width of [320, 1440]) {
  test(`eight-digit verification remains one editable row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/docs/components/input-otp')

    const input = page.locator('#ex-otp')
    const field = input.locator('..')
    const segments = field.locator('[data-ui-input-otp-segment]')

    await expect(input).toHaveAttribute('data-ui-enhanced', 'true')
    await expect(segments).toHaveCount(8)

    const bounds = await segments.evaluateAll(elements => elements.map(element => {
      const { left, right, top, height } = element.getBoundingClientRect()

      return { left, right, top, height }
    }))

    expect(new Set(bounds.map(box => Math.round(box.top))).size).toBe(1)
    expect(bounds.every(box => box.left >= 0 && box.right <= width && box.height >= 44)).toBe(true)
    await input.press('ControlOrMeta+A')
    await input.press('Backspace')
    await input.pressSequentially('87654321')
    await expect(segments.last()).toHaveText('1')
    await input.press('ArrowLeft')
    await expect(input).toBeFocused()
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width)
  })
}

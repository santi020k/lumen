import { expect, test } from '@playwright/test'

test('installer Elements wrapper registers and styles only the selected element', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/installer-elements.html')
  const button = page.getByRole('button', { name: 'Installed Elements button' })
  await expect(button).toBeVisible()
  await expect(button).toHaveClass(/ui-button/u)
  const result = await page.evaluate(async () => {
    const before = customElements.get('lumen-button')
    const script = document.querySelector<HTMLScriptElement>('script[type="module"][src]')
    if (!script) throw new Error('Missing installed consumer module')
    await import(script.src + '?repeated=1')
    return {
      registered: typeof before === 'function',
      preserved: customElements.get('lumen-button') === before,
      unrelated: Boolean(customElements.get('lumen-scheduler'))
    }
  })
  expect(result).toEqual({ registered: true, preserved: true, unrelated: false })
  expect(await button.evaluate(element => getComputedStyle(element).minHeight)).not.toBe('0px')
  expect(errors).toEqual([])
})

test('installer React wrapper renders and receives selective component styles', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/installer-react.html')
  const button = page.getByRole('button', { name: 'Installed React button' })
  await expect(button).toBeVisible()
  await expect(button).toHaveClass(/ui-button/u)
  expect(await button.evaluate(element => getComputedStyle(element).minHeight)).not.toBe('0px')
  await button.focus()
  await expect(button).toBeFocused()
  expect(errors).toEqual([])
})

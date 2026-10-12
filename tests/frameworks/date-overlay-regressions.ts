import { expect, test } from '@playwright/test'

test('DatePicker calendar remains clickable beyond a scrolling dialog boundary', async ({ page }, testInfo) => {
  await page.goto('/visual/consumer-date')
  await page.locator('[data-ui-date-picker]').first().evaluate(root => {
    const dialog = document.createElement('dialog')

    dialog.setAttribute('aria-label', 'Scrolling date form')
    dialog.style.cssText = 'width:280px;height:150px;overflow:auto;padding:16px;margin:60px auto;'
    root.before(dialog)
    dialog.append(root)
    dialog.showModal()
  })
  await page.getByRole('button', { name: 'Saved appointment', exact: true }).click()
  await expect(page.locator('[data-ui-date-picker-popover]').first()).toHaveCSS('opacity', '1')

  const day = page.locator('[data-ui-date-picker] [data-date="2026-09-11"]')
  await expect.poll(() => day.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)

    return hit !== null && element.contains(hit)
  })).toBe(true)

  await page.screenshot({ path: testInfo.outputPath('date-overlay-after.png') })
  await day.click()
  await expect(page.getByRole('button', { name: 'Saved appointment', exact: true })).toContainText('Sep 11')
})

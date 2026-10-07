import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const width of [320, 768, 1440]) {
    for (const textScale of [100, 200]) {
      test(`reading and compound surfaces at ${width}px, ${theme}, ${textScale}% text`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto('/internal/content-flow-details')
        await page.evaluate(({ selectedTheme, scale }) => {
          document.documentElement.dataset.theme = selectedTheme
          document.documentElement.style.fontSize = `${scale}%`
        }, { selectedTheme: theme, scale: textScale })

        for (const id of ['prose-flow', 'typography-flow']) {
          const rhythm = await page.locator(`#${id}`).evaluate(element => {
            const first = element.firstElementChild
            const last = element.lastElementChild
            const heading = element.querySelector('h3')

            if (!first || !last || !heading) throw new Error('Missing reading content')

            return {
              first: getComputedStyle(first).marginTop,
              last: getComputedStyle(last).marginBottom,
              beforeHeading: Number.parseFloat(getComputedStyle(heading).marginTop),
              afterHeading: Number.parseFloat(getComputedStyle(heading).marginBottom)
            }
          })

          expect(rhythm.first).toBe('0px')
          expect(rhythm.last).toBe('0px')
          expect(rhythm.beforeHeading).toBeGreaterThan(rhythm.afterHeading)
        }

        expect(await page.locator('#media-card').evaluate(card => getComputedStyle(card).overflow)).toBe('visible')
        expect(await page.locator('#media-frame').evaluate(frame => getComputedStyle(frame).overflow)).toBe('hidden')
        await page.locator('#media-action').focus()
        await expect(page.locator('#media-action')).toBeFocused()
        await page.locator('#flow-menu-trigger').click()
        const menu = page.locator('#flow-menu [role="menu"]')

        await expect(menu).toBeVisible()
        await menu.screenshot({ animations: 'disabled' })
        const menuBounds = await menu.boundingBox()
        const cardBounds = await page.locator('#menu-card').boundingBox()

        if (!menuBounds || !cardBounds) throw new Error('Missing menu geometry')

        expect(menuBounds.y < cardBounds.y || menuBounds.y + menuBounds.height > cardBounds.y + cardBounds.height).toBe(true)
        await page.keyboard.press('Escape')
        await expect(page.locator('#flow-menu-trigger')).toBeFocused()
        await page.getByRole('tab', { name: 'Pending invitations' }).click()
        await expect(page.getByRole('heading', { name: 'No pending invitations' })).toBeVisible()
        await page.getByRole('tab', { name: 'Notification preferences', exact: true }).click()
        await expect(page.locator('#flow-email-error')).toBeVisible()
        await page.locator('#accordion-action').focus()
        await expect(page.locator('#accordion-action')).toBeFocused()
        expect(await page.locator('#accordion-action').evaluate(button => button.scrollWidth - button.clientWidth)).toBeLessThanOrEqual(1)
        await page.locator('#flow-accordion summary').first().click()
        await expect(page.locator('#accordion-action')).toBeHidden()
        await page.locator('#flow-accordion summary').first().click()
        await expect(page.locator('#accordion-action')).toBeVisible()
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0)
        await page.screenshot({ animations: 'disabled', fullPage: true, path: testInfo.outputPath('compound-flow.png') })
        await page.locator('#open-flow-dialog').click()
        await expect(page.getByRole('dialog')).toBeVisible()
        const dialog = await page.locator('#flow-dialog').evaluate(element => ({
          width: element.getBoundingClientRect().width,
          overflow: element.scrollWidth - element.clientWidth
        }))

        expect(dialog.width).toBeLessThanOrEqual(width)
        expect(dialog.overflow).toBeLessThanOrEqual(1)
        await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('dialog-flow.png') })
        await page.keyboard.press('Escape')
        await expect(page.locator('#open-flow-dialog')).toBeFocused()
      })
    }
  }
}

test('container gutters grow predictably and allow product overrides', async ({ page }) => {
  await page.goto('/internal/content-flow-details')

  for (const [width, gutter] of [[320, 16], [600, 24], [800, 32]] as const) {
    await page.setViewportSize({ width, height: 1000 })
    const bounds = await page.locator('#fluid-container').boundingBox()

    expect(bounds?.x).toBe(gutter)
    expect(bounds?.width).toBe(width - gutter * 2)
  }

  await page.locator('#fluid-container').evaluate(element => { element.style.setProperty('--ui-container-gutter', '20px') })
  expect((await page.locator('#fluid-container').boundingBox())?.x).toBe(20)
  await page.locator('#fluid-container').evaluate(element => { element.style.removeProperty('--ui-container-gutter') })
  await page.evaluate(() => { document.documentElement.style.setProperty('--ui-container-gutter', '24px') })
  expect((await page.locator('#fluid-container').boundingBox())?.x).toBe(24)
})

test('fallback menus escape the card and remain clickable without anchor positioning', async ({ page }) => {
  await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS)

    CSS.supports = (property: string, value?: string) => {
      if (property.startsWith('anchor-name')) return false

      return value === undefined ? supports(property) : supports(property, value)
    }
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/internal/content-flow-details')
  await page.locator('#flow-menu-trigger').click()
  const menu = page.locator('#flow-menu [role="menu"]')

  await expect(menu).toBeVisible()
  await menu.screenshot({ animations: 'disabled' })
  expect(await page.evaluate(() => CSS.supports('anchor-name', '--ui-anchor'))).toBe(false)
  const item = page.getByRole('menuitem', { name: 'View recent activity' })

  expect(await item.evaluate(element => {
    const bounds = element.getBoundingClientRect()

    return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
  })).toBe(true)
  await item.click()
  await expect(menu).toBeHidden()
})

for (const framework of ['astro', 'react', 'elements']) {
  for (const theme of ['light', 'dark']) {
    for (const width of [320, 1440]) {
      test(`${framework} complete recipes at ${width}px in ${theme}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto(`/internal/content-flow-recipes/${framework}`)
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toBeVisible()
        await expect(page.getByRole('listitem')).toHaveCount(2)
        await page.getByRole('textbox', { name: 'Team name', exact: true }).fill('Example studio')
        await page.keyboard.press('Tab')
        await expect(page.getByRole('textbox', { name: 'Team email', exact: true })).toBeFocused()
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
        await page.getByRole('button', { name: 'Invite a teammate' }).evaluate(button => { button.textContent = 'Review notification preferences and team communication settings' })
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0)
        await page.screenshot({ animations: 'disabled', fullPage: true, path: testInfo.outputPath('complete-recipes.png') })
      })
    }
  }
}

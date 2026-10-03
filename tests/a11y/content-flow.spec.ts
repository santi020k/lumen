import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 768, 1440]) {
    test(`content flow keeps one spacing owner at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/internal/content-flow')
      await expect(page.locator('#elements-card')).toHaveClass(/ui-card/u)
      await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)

      for (const id of ['astro-card', 'react-card', 'elements-card']) {
        expect(await page.locator(`#${id}`).evaluate(card => getComputedStyle(card).overflow)).toBe('visible')
        const geometry = await page.locator(`#${id}`).evaluate(card => {
          const header = card.querySelector('[data-slot="card-header"]')
          const content = card.querySelector('[data-slot="card-content"]')
          const footer = card.querySelector('[data-slot="card-footer"]')

          if (!header || !content || !footer) throw new Error('Missing compound card parts')

          return {
            inset: header.getBoundingClientRect().left - card.getBoundingClientRect().left,
            headerGap: content.getBoundingClientRect().top - header.getBoundingClientRect().bottom,
            footerGap: footer.getBoundingClientRect().top - content.getBoundingClientRect().bottom,
            edges: [header, content, footer].map(part => part.getBoundingClientRect().left),
            padding: getComputedStyle(card).paddingTop
          }
        })

        expect(geometry.inset).toBe(25)
        expect(geometry.headerGap).toBe(16)
        expect(geometry.footerGap).toBe(16)
        expect(new Set(geometry.edges).size).toBe(1)
        expect(geometry.padding).toBe('24px')
      }

      for (const id of ['content-only', 'hidden-parts', 'empty-parts']) {
        const topGap = await page.locator(`#${id}`).evaluate(card => {
          const content = card.querySelector('[data-slot="card-content"]')

          if (!content) throw new Error('Missing card content')

          return content.getBoundingClientRect().top - card.getBoundingClientRect().top
        })

        expect(topGap).toBe(25)
      }

      await expect(page.locator('#email-error')).toBeVisible()
      const field = page.locator('#workspace-email').locator('..')

      expect(await field.evaluate(element => getComputedStyle(element).gap)).toBe('8px')
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0)
      await page.locator('#workspace-name').focus()
      await page.keyboard.press('Tab')
      await expect(page.locator('#workspace-email')).toBeFocused()
    })
  }
}

test('canonical gaps, density, overrides and long text remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto('/internal/content-flow')
  await expect(page.locator('#elements-card')).toHaveClass(/ui-card/u)

  for (const [gap, expected] of Object.entries({ none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, related: 8, group: 16, section: 32 })) {
    await page.locator('#elements-stack').evaluate((stack, value) => { stack.setAttribute('gap', value) }, gap)
    await expect.poll(() => page.locator('#elements-stack').evaluate(stack => Number.parseFloat(getComputedStyle(stack).gap))).toBe(expected)
  }

  for (const [density, inset] of Object.entries({ compact: 16, comfortable: 24, spacious: 32 })) {
    await page.locator('#elements-card').evaluate((card, value) => { card.setAttribute('density', value) }, density)
    await expect.poll(() => page.locator('#elements-card').evaluate(card => Number.parseFloat(getComputedStyle(card).paddingTop))).toBe(inset)
  }

  await page.evaluate(() => {
    document.documentElement.style.setProperty('--ui-space-group', '20px')
  })
  expect(await page.locator('#fields').evaluate(stack => getComputedStyle(stack).gap)).toBe('20px')
  expect(await page.locator('#astro-card').evaluate(card => getComputedStyle(card).gap)).toBe('20px')

  await page.locator('#astro-card [data-slot="card-title"]').evaluate(title => {
    title.textContent = 'Preferencias de comunicación y permisos para las personas del espacio compartido'
  })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0)

  const footer = page.locator('#form-card [data-slot="card-footer"]')

  expect(await footer.evaluate(element => getComputedStyle(element).flexWrap)).toBe('wrap')
  for (const button of await footer.getByRole('button').all()) {
    const geometry = await button.evaluate(element => {
      const parent = element.parentElement

      if (!parent) throw new Error('Missing footer')

      return {
        edge: element.getBoundingClientRect().right - parent.getBoundingClientRect().right,
        clippedText: element.scrollWidth - element.clientWidth
      }
    })

    expect(geometry.edge).toBeLessThanOrEqual(1)
    expect(geometry.clippedText).toBeLessThanOrEqual(1)
  }
  await footer.getByRole('button', { name: 'Discard changes' }).focus()
  await expect(footer.getByRole('button', { name: 'Discard changes' })).toBeFocused()
})

import { expect, test } from '@playwright/test'

for (const theme of ['lumen-light', 'lumen-dark']) {
  test(`docs navigation and footer maintain compact spacing in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('lumen-theme', value)
    }, theme)
    await page.goto('/docs/foundations')
    await page.evaluate(() => document.fonts.ready)

    for (const viewport of [
      ...[320, 390, 768, 900, 1024, 1440].map(width => ({ width, height: 900 })),
      { width: 1440, height: 2400 }
    ]) {
      const { width } = viewport

      await page.setViewportSize(viewport)
      await page.evaluate(() => {
        window.scrollTo(0, 600)
      })

      await expect.poll(async () => page.evaluate(() => {
        const header = document.querySelector('.docs-site-header')
        const navigation = document.querySelector(
          window.innerWidth < 1024 ? '.docs-mobile-navigation-bar' : '.docs-sidebar'
        )

        if (!header || !navigation) throw new Error('Missing docs navigation')

        const gap = navigation.getBoundingClientRect().top - header.getBoundingClientRect().bottom

        return Math.abs(gap - (window.innerWidth < 1024 ? 0 : 16))
      }), `Sticky navigation spacing at ${width}px`).toBeLessThanOrEqual(1)

      const layout = await page.evaluate(() => {
        const lastSection = document.querySelector('.docs-content > :last-child')
        const footer = document.querySelector('.docs-site-footer')

        if (!lastSection || !footer) throw new Error('Missing docs content or footer')

        return {
          footerGap: footer.getBoundingClientRect().top - lastSection.getBoundingClientRect().bottom,
          overflow: document.documentElement.scrollWidth - window.innerWidth
        }
      })

      expect(layout.footerGap, `Footer spacing at ${width}px`).toBeGreaterThanOrEqual(32)
      expect(layout.footerGap, `Footer spacing at ${width}px`).toBeLessThanOrEqual(64)
      expect(layout.overflow, `Horizontal overflow at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
}

test('docs spacing survives client navigation and the browse drawer remains keyboard usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/foundations')
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Guides', exact: true }).click()
  await expect(page).toHaveURL(/\/guides$/u)
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--docs-sticky-header-height'))).toBe('')
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Docs', exact: true }).click()
  await expect(page).toHaveURL(/\/docs$/u)
  await expect.poll(() => page.evaluate(() => Number.parseFloat(document.documentElement.style.getPropertyValue('--docs-sticky-header-height')))).toBeGreaterThan(0)

  const trigger = page.getByRole('button', { name: 'Browse all documentation' })

  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('narrow docs headers stay compact and active context links remain fully visible', async ({ page }) => {
  await page.goto('/docs/components')

  for (const width of [320, 390, 768, 1440, 320]) {
    await page.setViewportSize({ width, height: 844 })

    await expect.poll(() => page.evaluate(() => {
      const navigation = document.querySelector('.docs-context-navigation__links')
      const active = navigation?.querySelector('[aria-current="page"]')

      if (!navigation || !active) throw new Error('Missing active context link')

      const viewport = navigation.getBoundingClientRect()
      const link = active.getBoundingClientRect()

      return link.left >= viewport.left + 10 && link.right <= viewport.right - 10
    })).toBe(true)

    if (width === 320) {
      const header = await page.locator('.docs-site-header').boundingBox()

      if (!header) throw new Error('Missing site header')

      expect(header.height).toBeLessThan(175)
      await expect(page.getByRole('link', { name: 'Lumen UI home' })).toBeVisible()
      await expect(page.locator('.docs-theme-toggle')).toBeVisible()
    }
  }
})

for (const width of [320, 390, 900, 1440]) {
  test(`section anchors clear the sticky navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/docs/foundations#principles')

    const selectorFits = await page.locator('.docs-context-navigation__platform').evaluate(element => {
      const trigger = element.querySelector('[data-ui-select-trigger]')

      if (!trigger) throw new Error('Missing documentation scope trigger')

      return trigger.getBoundingClientRect().right <= element.getBoundingClientRect().right + 1
    })

    expect(selectorFits).toBe(true)

    await expect.poll(() => page.evaluate(() => {
      const section = document.querySelector('#principles')
      const header = document.querySelector('.docs-site-header')
      const navigation = document.querySelector('.docs-mobile-navigation-bar')

      if (!section || !header || !navigation) throw new Error('Missing anchor or navigation')

      return section.getBoundingClientRect().top - Math.max(
        header.getBoundingClientRect().bottom,
        navigation.getBoundingClientRect().bottom
      )
    })).toBeGreaterThanOrEqual(8)
  })
}

test('component search precedes demos and filters the catalog on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/components')

  const search = page.getByRole('searchbox', { name: 'Search the component library' })
  const bounds = await search.boundingBox()

  if (!bounds) throw new Error('Missing component search')

  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844)
  await search.fill('ImageComparison')
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(1)
  await expect(page.locator('[data-component-card]:visible')).toContainText('ImageComparison')
})

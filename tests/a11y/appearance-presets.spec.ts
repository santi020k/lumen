import { expect, test } from '@playwright/test'

for (const preset of ['default', 'studio', 'glass']) {
  for (const scheme of ['light', 'dark']) {
    test(`small card descriptions keep readable contrast in ${preset} ${scheme}`, async ({ page }) => {
      await page.goto('/internal/content-flow')
      await expect(page.locator('#elements-card')).toHaveClass(/ui-card/u)
      const preview = page.locator('#adapter-cards')

      await preview.evaluate((element, appearance) => {
        element.setAttribute('data-lumen-preset', appearance.preset)
        element.setAttribute('data-lumen-scheme', appearance.scheme)
      }, { preset, scheme })

      const descriptions = preview.locator('.ui-card:not(.ui-card--glass) .ui-card__description')

      expect(await descriptions.count()).toBeGreaterThan(0)

      const ratios = await descriptions.evaluateAll(elements => {
        const luminance = (color: string): number => {
          const channels = color.match(/[\d.]+/gu)?.slice(0, 3).map(value => {
            const channel = Number(value) / 255

            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          })

          if (channels?.length !== 3) throw new Error(`Unexpected computed color: ${color}`)

          const [red = 0, green = 0, blue = 0] = channels

          return 0.2126 * red + 0.7152 * green + 0.0722 * blue
        }

        return elements.map(element => {
          const card = element.closest('.ui-card')

          if (!card) throw new Error('Description is missing its Card owner.')

          const foreground = luminance(getComputedStyle(element).color)
          const background = luminance(getComputedStyle(card).backgroundColor)

          return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
        })
      })

      for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  }
}

test('appearance presets keep preview, dimensions and exports in sync', async ({ page }) => {
  await page.goto('/docs/theme-playground')
  const builder = page.locator('[data-theme-playground]')
  const preview = page.locator('#theme-playground-preview')
  const output = builder.locator('[data-ui-theme-output]')
  await expect(builder).toHaveAttribute('data-ui-theme-builder-bound', 'true')
  const originalPageBrand = await page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--brand'))
  const studio = builder.locator('[data-ui-theme-preset="studio"]')
  await studio.focus()
  await page.keyboard.press('Enter')
  await expect(studio).toHaveAttribute('aria-pressed', 'true')
  await expect(output).toHaveValue(/--brand: 0 0% 9%;/)
  await builder.locator('[data-ui-theme-radius-scale]').fill('2')
  await builder.locator('[data-ui-theme-spacing-scale]').fill('1.5')
  await builder.locator('[data-ui-theme-border-width]').fill('0')
  await expect(output).toHaveValue(/--ui-radius: 0.75rem;/)
  await expect(output).toHaveValue(/--ui-space-lg: 1.5rem;/)
  await expect(output).toHaveValue(/--ui-border-width: 0px;/)
  await expect(preview).toHaveCSS('--ui-radius', '0.75rem')
  await builder.locator('[data-ui-theme-scheme="dark"]').click()
  await expect(output).toHaveValue(/--canvas: 0 0% 7%;/)
  await expect(preview.locator('.ui-toggle[aria-pressed="false"]').first()).toHaveCSS('color', 'rgb(204, 204, 204)')
  await expect(preview.locator('.ui-toggle[aria-pressed="true"]').first()).toHaveCSS('color', 'rgb(245, 245, 245)')
  await builder.locator('[data-ui-theme-preset="glass"]').click()
  await expect(output).toHaveValue(/--glass-blur: 22px;/)
  await builder.locator('[data-ui-theme-preset="custom"]').click()
  await expect(output).toHaveValue(/--brand: 264 /)
  expect(await page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--brand'))).toBe(originalPageBrand)
})

test('scoped CSS presets reset palettes and remain opaque without explicit glass', async ({ page }) => {
  await page.goto('/docs/theme-playground')
  await page.evaluate(() => {
    const parent = document.createElement('section')
    parent.id = 'scoped-preset-test'
    parent.dataset.lumenPreset = 'studio'
    parent.dataset.lumenScheme = 'dark'
    const child = document.createElement('section')
    child.dataset.lumenPreset = 'default'
    child.dataset.lumenScheme = 'light'
    parent.append(child)
    document.body.append(parent)
  })
  const parent = page.locator('#scoped-preset-test')
  await expect(parent).toHaveCSS('--brand', '0 0% 96%')
  await expect(parent).toHaveCSS('--ui-shadow-md', 'none')
  const child = parent.locator('[data-lumen-preset="default"]')
  await expect(child).toHaveCSS('--brand', '201 96% 32%')
  expect(await child.evaluate(element => getComputedStyle(element).getPropertyValue('--ui-shadow-md'))).not.toBe('none')
})

test('Studio preview stays within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/theme-playground')
  await page.locator('[data-ui-theme-preset="studio"]').click()
  const dimensions = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1)
  await expect(page.locator('#studio-reference-title')).toBeVisible()
})

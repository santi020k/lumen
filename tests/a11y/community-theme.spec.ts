import { expect, test } from '@playwright/test'

import { lumenSemanticColorTokenNames } from '../../packages/core/src/theme.js'
import { auditLumenTheme } from '../../packages/core/src/theme-audit.js'

test('the downloadable theme follows the nearest scheme and keeps overrides local', async ({ page }) => {
  await page.goto('/docs/web/themes')
  const stylesheet = '/examples/themes/harbor.css'
  await expect(page.getByRole('link', { name: 'Harbor example stylesheet' })).toHaveAttribute('href', stylesheet)

  await page.setContent(`
    <html data-theme="dark" style="--brand: 0 0% 50%">
      <body>
        <section id="workspace" data-lumen-preset="example-harbor">
          <section id="preview" data-lumen-preset="example-harbor" data-lumen-scheme="light">
            <aside id="inherited" data-lumen-preset="example-harbor"></aside>
          </section>
        </section>
        <aside id="sibling"></aside>
      </body>
    </html>
  `)
  await page.addStyleTag({ url: stylesheet })
  const workspace = page.locator('#workspace')
  const preview = page.locator('#preview')
  const inherited = page.locator('#inherited')
  await expect(workspace).toHaveCSS('color-scheme', 'dark')
  await expect(preview).toHaveCSS('color-scheme', 'light')
  await expect(inherited).toHaveCSS('background-color', await preview.evaluate(element => getComputedStyle(element).backgroundColor))
  await expect(page.locator('#sibling')).toHaveCSS('--brand', '0 0% 50%')
  const darkCanvas = await workspace.evaluate(element => getComputedStyle(element).backgroundColor)
  await expect(preview).not.toHaveCSS('background-color', darkCanvas)

  for (const scope of [workspace, preview]) {
    const tokens = await scope.evaluate((element, names) => {
      const styles = getComputedStyle(element)
      return Object.fromEntries(names.map(name => [name, styles.getPropertyValue(`--${name}`)]))
    }, lumenSemanticColorTokenNames)
    expect(auditLumenTheme(tokens).findings).toEqual([])
  }

  await page.locator('html').evaluate(element => {
    element.setAttribute('data-theme', 'light')
  })
  await expect(workspace).toHaveCSS('background-color', await preview.evaluate(element => getComputedStyle(element).backgroundColor))
})

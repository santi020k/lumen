import { expect, test } from '@playwright/test'

for (const width of [320, 1440]) {
  for (const scale of [100, 200]) {
    test(`dashboard header recipes retain identity and actions at ${width}px and ${scale}% text`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/internal/dashboard-headers')
      await page.evaluate(textScale => { document.documentElement.style.fontSize = `${textScale}%` }, scale)
      for (const framework of ['Astro', 'React', 'Elements']) {
        for (const locale of ['en', 'es']) {
          const region = page.getByRole('region', { name: `${framework} ${locale}`, exact: true })
          await expect(region.getByRole('heading', { level: 1 })).toBeVisible()
          await expect(region.getByRole('heading', { level: 2 })).toBeVisible()
          await expect(region.locator('[aria-current="page"]')).toHaveCount(1)
          await expect(region.getByRole('navigation', { name: locale === 'es' ? 'Ruta de navegación' : 'Breadcrumb', exact: true }).getByRole('link')).toHaveCount(1)
          const action = region.getByRole('group', { name: locale === 'es' ? 'Acciones de la página' : 'Page actions', exact: true }).getByRole('button').first()
          await action.focus()
          await expect(action).toBeFocused()
          await action.press('Tab')
          expect(await region.evaluate(element => element.contains(document.activeElement))).toBe(true)
          await expect(region).toContainText(locale === 'es' ? '0 registros' : '0 records')
        }
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0)
      const overflow = await page.locator('#header-recipes').evaluate(element => Array.from(element.querySelectorAll('h1, h2, button, lumen-button')).filter(item => item.scrollWidth > item.clientWidth + 1).map(item => item.textContent))
      expect(overflow).toEqual([])
      await page.getByRole('region', { name: 'Astro es', exact: true }).screenshot({ animations: 'disabled', path: testInfo.outputPath('header-astro-es.png') })
      await page.screenshot({ animations: 'disabled', fullPage: true, path: testInfo.outputPath('dashboard-headers.png') })
    })
  }
}

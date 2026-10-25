import { expect, test } from '@playwright/test'

for (const width of [320, 390, 1440]) {
  for (const theme of ['lumen-light', 'lumen-dark']) {
    test(`installed editorial recipes fit ${width}px in ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/')
      await page.locator('html').evaluate((html, value) => { html.dataset.theme = value }, theme)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('article', { name: 'Repeated card 1' })).toBeVisible()
      await expect(page.getByRole('region', { name: 'A conversation 2' })).toBeVisible()
      await expect(page.getByRole('img', { name: 'Contained illustration' })).toBeVisible()
      const structure = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map(element => element.id)
        const missingLabels = [...document.querySelectorAll('[aria-labelledby]')].flatMap(element => (element.getAttribute('aria-labelledby') ?? '').split(' ').filter(id => !document.getElementById(id)))
        return { uniqueIds: new Set(ids).size === ids.length, missingLabels, overflow: document.documentElement.scrollWidth > window.innerWidth }
      })
      expect(structure).toEqual({ uniqueIds: true, missingLabels: [], overflow: false })
      for (const link of await page.locator('a[target="_blank"]').all()) {
        await expect(link).toHaveAttribute('rel', /noopener/)
        await expect(link).toHaveAttribute('rel', /noreferrer/)
      }
      const contrasts = await page.evaluate(() => {
        const luminance = (color: string): number => {
          const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(value => {
            const channel = Number(value) / 255
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          })
          const [red, green, blue] = channels
          if (red === undefined || green === undefined || blue === undefined) throw new Error(`Unsupported computed color: ${color}`)
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue
        }
        return [...document.querySelectorAll('.editorial-card__category, .editorial-card__copy, .editorial-card__action, .editorial-contact__label, .editorial-replacement__label, .editorial-introduction__label')].map(element => {
          let background: Element | null = element
          while (background && getComputedStyle(background).backgroundColor === 'rgba(0, 0, 0, 0)') background = background.parentElement
          if (!background) throw new Error('Expected an opaque consumer background')
          const foregroundLight = luminance(getComputedStyle(element).color)
          const backgroundLight = luminance(getComputedStyle(background).backgroundColor)
          return (Math.max(foregroundLight, backgroundLight) + 0.05) / (Math.min(foregroundLight, backgroundLight) + 0.05)
        })
      })
      expect(contrasts.length).toBeGreaterThan(0)
      expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5)
      if (theme === 'lumen-light') {
        const backgrounds = await page.locator('.editorial-card').evaluateAll(cards => cards.map(card => getComputedStyle(card).backgroundColor))
        expect(backgrounds[0]).not.toBe(backgrounds[2])
      }
      const action = page.getByRole('link', { name: 'Read the external guide' }).first()
      await action.focus()
      await expect(action).toBeFocused()
      expect(await action.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
      await page.screenshot({ path: testInfo.outputPath(`editorial-${width}-${theme}.png`), fullPage: true })
      await page.locator('html').evaluate(html => { html.style.fontSize = '200%' })
      await page.locator('#card-1').evaluate(element => { element.textContent = 'MultidisciplinaryResearchAndDocumentation'.repeat(4) })
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
    })
  }
}

test('static recipes remain usable without client JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Read the external guide' })).toHaveCount(2)
  await expect(page.getByRole('heading', { name: 'Text without media' })).toBeVisible()
  await context.close()
})

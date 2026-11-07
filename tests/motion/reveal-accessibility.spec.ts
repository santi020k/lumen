import { expect, type Locator, test } from '@playwright/test'

const visibleContent = async (root: Locator): Promise<void> => {
  await expect(root).not.toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
  await expect(root).toHaveCSS('opacity', '1')
  await expect(root.locator('p')).toHaveCSS('opacity', '1')
}

for (const framework of ['astro', 'react', 'elements']) {
  test(`${framework} honors real thresholds and reveals unreachable or focused content`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`/internal/reveal-regressions/${framework}`)
    const tall = page.locator('[data-case="tall"]')
    const threshold = page.locator('[data-case="threshold"]')
    const resized = page.locator('[data-case="resize"]')

    await expect(threshold).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
    await visibleContent(tall)
    await expect(tall).toHaveClass(/is-revealed/)
    // Use a second native observer to wait for actual geometry before checking the
    // library's threshold. No mocked intersection entries or arbitrary delays.
    await threshold.evaluate(async element => {
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - window.innerHeight + 100)
      await new Promise<void>(resolve => {
        const observer = new IntersectionObserver(entries => {
          if (!entries.some(entry => entry.intersectionRatio > 0.2 && entry.intersectionRatio < 0.5)) return
          observer.disconnect()
          requestAnimationFrame(() => requestAnimationFrame(() => { resolve() }))
        }, { threshold: [0, 0.2, 0.5] })
        observer.observe(element)
      })
    })
    await expect(threshold).not.toHaveClass(/is-revealed/)
    await threshold.evaluate(element => { element.scrollIntoView({ block: 'center' }) })
    await expect(threshold).toHaveClass(/is-revealed/)
    await page.evaluate(() => { window.scrollTo(0, 0) })
    await expect(threshold).not.toHaveClass(/is-revealed/)
    await threshold.getByRole('button').focus()
    await visibleContent(threshold)
    await expect(threshold.getByRole('button')).toBeFocused()
    await expect(resized).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
    await resized.evaluate(element => {
      document.documentElement.style.fontSize = '200%'
      if (element instanceof HTMLElement) element.style.minHeight = '1000em'
    })
    await visibleContent(resized)
    await page.evaluate(() => { window.scrollTo(0, 0) })
    await page.screenshot({ path: testInfo.outputPath('tall-group.png') })
  })

  test(`${framework} keeps reduced-motion and no-script content visible`, async ({ page, browser }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/internal/reveal-regressions/${framework}`)
    for (const root of await page.locator('[data-case]').all()) await visibleContent(root)
    const context = await browser.newContext({ javaScriptEnabled: false })
    const noScript = await context.newPage()
    try {
      await noScript.goto(new URL(`/internal/reveal-regressions/${framework}`, page.url()).href)
      for (const root of await noScript.locator('[data-case]').all()) await visibleContent(root)
    } finally {
      await context.close()
    }
  })
}

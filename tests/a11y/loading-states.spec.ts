import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`Astro loading examples preserve size, semantics, and motion at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/docs/components/skeleton')
    const preview = page.locator('.component-doc-preview')
    const pulse = preview.locator('.ui-skeleton--pulse')

    await expect(preview).toBeVisible()
    for (const theme of ['light', 'dark']) {
      await page.locator('html').evaluate((element, value) => { element.setAttribute('data-theme', value); }, theme)
      await expect(preview.locator('.ui-skeleton--circle')).toHaveCSS('width', '40px')
      await expect(preview.locator('.ui-skeleton--circle')).toHaveCSS('height', '40px')
      await expect(pulse).toHaveCSS('height', '8px')
      await expect(pulse).toHaveAttribute('aria-hidden', 'true')
      await expect(preview.getByRole('status', { name: 'Loading article', exact: true })).toHaveCSS('height', '96px')
      await preview.screenshot({ path: testInfo.outputPath(`astro-skeleton-${theme}.png`) })
    }
    expect(await pulse.evaluate(element => element.getAnimations().some(animation => animation instanceof CSSAnimation && animation.animationName === 'ui-skeleton-pulse'))).toBe(true)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect.poll(async () => pulse.evaluate(element => element.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0)
  })
}

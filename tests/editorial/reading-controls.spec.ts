import { expect, test } from '@playwright/test'

test('article progress excludes the opening and footer and Anchor follows native fragments', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 440 })
  await page.goto('/reading-controls')
  await page.locator('html').evaluate(html => { html.style.fontSize = '200%' })
  const article = page.getByRole('progressbar', { name: 'Article progress' })
  const documentProgress = page.getByRole('progressbar', { name: 'Page progress' })

  await expect(article).toHaveAttribute('data-ui-bound', 'true')
  await expect(article).toHaveAttribute('aria-valuenow', '0')
  const chapter = page.getByRole('link', { name: 'Second section' })

  await chapter.focus()
  await chapter.press('Enter')
  await expect(chapter).toHaveAttribute('aria-current', 'location')
  await expect(article).toHaveAttribute('aria-valuenow', /^[1-9]\d?$/)

  await page.locator('footer').evaluate(footer => { footer.scrollIntoView() })
  await expect(article).toHaveAttribute('aria-valuenow', '100')
  await expect(documentProgress).not.toHaveAttribute('aria-valuenow', '100')
})

test('only the active code group scrolls and clipboard recovery selects the complete command', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 530 })
  await page.addInitScript(() => {
    const clipboard = {
      writeText: (value: string): Promise<void> => {
        if (!document.documentElement.hasAttribute('data-copy-allowed')) {
          return Promise.reject(new DOMException('Denied', 'NotAllowedError'))
        }

        document.documentElement.dataset.copied = value

        return Promise.resolve()
      }
    }

    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })
  })
  await page.goto('/reading-controls')
  const first = page.getByRole('tablist', { name: 'First code group' })
  const last = page.getByRole('tablist', { name: 'Last code group' })
  const long = first.getByRole('tab', { name: 'Long' })

  await first.getByRole('tab', { name: 'Short' }).focus()
  await first.getByRole('tab', { name: 'Short' }).press('ArrowRight')
  await expect(long).toBeFocused()
  await expect(long).toBeInViewport()
  await expect(last.getByRole('tab', { name: 'Long' })).toHaveAttribute('aria-selected', 'true')

  const panels = page.getByRole('tabpanel', { name: 'Long' })
  const panel = panels.first()

  await expect(panel.getByText('Scroll to read more')).toBeVisible()
  const copy = panel.getByRole('button', { name: 'Copy code to clipboard' })

  await copy.click()
  const field = panel.getByRole('textbox', { name: 'Select the complete command' })

  await expect(field).toHaveValue(/^pnpm add .*\n# end of command$/)
  await field.focus()
  await panel.screenshot({ path: testInfo.outputPath('copy-recovery.png') })
  expect(await field.evaluate(element => element instanceof HTMLTextAreaElement && element.selectionStart === 0 && element.selectionEnd === element.value.length)).toBe(true)

  await first.getByRole('tab', { name: 'Short' }).click()
  await expect(page.locator('textarea')).toHaveCount(0)
  await long.click()
  await expect(panel.getByText('Scroll to read more')).toBeVisible()
  await copy.click()
  await expect(field).toBeVisible()
  await page.locator('html').evaluate(html => { html.dataset.copyAllowed = '' })
  await panel.getByRole('button', { name: /Could not copy code|Copy code to clipboard/ }).click()
  await expect(field).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-copied', /^pnpm add .*\n# end of command$/)
})

test('standalone CopyButton recovers when Clipboard API is missing', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  })
  await page.goto('/reading-controls')
  await page.getByRole('button', { name: 'Copy to clipboard', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Select the link' })).toHaveValue('https://example.com/guide')
})

test('CoverImage emits WebP fallback without a duplicate picture source', async ({ page }) => {
  await page.goto('/reading-controls')
  const picture = page.locator('picture').filter({ has: page.getByRole('img', { name: 'Example cover' }) })

  await expect(picture.locator('source')).toHaveCount(1)
  await expect(picture.locator('source')).toHaveAttribute('type', 'image/avif')
  await expect(picture.getByRole('img')).toHaveAttribute('src', /\.webp$/)
})

import { expect, test } from '@playwright/test'

const repository = 'https://github.com/santi020k/lumen'

for (const colorScheme of ['light', 'dark'] as const) {
  for (const width of [320, 390, 1440]) {
    test(`feedback routes stay usable at ${width}px in ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ height: 900, width })
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await page.goto('/support')
      const main = page.getByRole('main')

      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Feedback & support')
      await expect(main.getByRole('link', { name: 'Suggest an improvement', exact: true }))
        .toHaveAttribute('href', `${repository}/discussions/categories/ideas`)
      await expect(main.getByRole('link', { name: 'Ask a question', exact: true }))
        .toHaveAttribute('href', `${repository}/discussions/categories/q-a`)
      await expect(main.getByRole('link', { name: 'Report a bug', exact: true }))
        .toHaveAttribute('href', `${repository}/issues/new?template=bug-report.yml`)

      const roadmap = main.getByRole('link', { name: 'Follow progress', exact: true })

      await roadmap.focus()
      await expect(roadmap).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/support#roadmap$/)
      await expect(main.getByRole('heading', { name: 'From an idea to a release' })).toBeInViewport()

      const shipped = main.getByRole('link', { name: 'View shipped work' })
      const shippedUrl = new URL(await shipped.getAttribute('href') ?? '')

      expect(shippedUrl.searchParams.get('q')).toBe('is:issue is:closed label:roadmap label:shipped')
      await expect(main.getByRole('link', { name: 'Report a vulnerability privately' }))
        .toHaveAttribute('href', `${repository}/security/advisories/new`)
      await expect(main).toContainText('sign in to post, vote, or subscribe')

      for (const link of await main.locator('a[target="_blank"]').all()) {
        await expect(link).toHaveAttribute('rel', /noopener/)
        await expect(link).toHaveAttribute('rel', /noreferrer/)
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)

      expect(overflow).toBe(false)
    })
  }
}

const references = [
  { path: '/docs/components/button', subject: 'Button' },
  { path: '/docs/apple/components/button', subject: 'Button (Apple / SwiftUI)' },
  { path: '/docs/android/components/button', subject: 'Button (Android / Compose)' },
  { path: '/docs/react-native/components/button', subject: 'Button (React Native)' },
  { path: '/docs/web/playground', subject: 'Web playground' },
  { path: '/docs/apple/playground', subject: 'Apple / SwiftUI playground' },
  { path: '/docs/android/playground', subject: 'Android / Compose playground' },
  { path: '/docs/react-native/playground', subject: 'React Native playground' }
]

for (const { path, subject } of references) {
  test(`${path} provides a contextual public report and community paths`, async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 390 })
    await page.goto(path)
    const feedback = page.getByRole('region', { name: `Feedback about ${subject}` })
    const bug = feedback.getByRole('link', { name: 'Report a bug' })

    await bug.scrollIntoViewIfNeeded()
    await expect(bug).toBeVisible()
    const url = new URL(await bug.getAttribute('href') ?? '')

    expect(`${url.origin}${url.pathname}`).toBe(`${repository}/issues/new`)
    expect(url.searchParams.get('template')).toBe('bug-report.yml')
    expect(url.searchParams.get('component')).toBe(subject)
    expect(url.searchParams.get('reference')).toBe(`https://lumen.santi020k.com${path}`)
    expect(url.searchParams.has('version')).toBe(false)

    await bug.focus()
    await page.keyboard.press('Tab')
    await expect(feedback.getByRole('link', { name: 'Suggest an improvement' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(feedback.getByRole('link', { name: 'Ask a question' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(feedback.getByRole('link', { name: 'Follow progress' })).toBeFocused()
  })
}

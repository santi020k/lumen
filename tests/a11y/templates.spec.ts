import { expect, test } from '@playwright/test'

const templateSlugs = [
  'analytics-dashboard',
  'saas-admin',
  'commerce-dashboard',
  'project-workspace',
  'auth-onboarding'
] as const

test('template gallery exposes every live preview and install command', async ({ page }) => {
  await page.goto('/templates')

  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Start with the whole product surface.'
  })).toBeVisible()

  for (const slug of templateSlugs) {
    const card = page.locator('.template-gallery-card').filter({
      has: page.locator(`a[href="/templates/${slug}"]`)
    })

    await expect(card).toBeVisible()
    await expect(card.locator('code')).toContainText(`lumen add ${slug} --target astro`)
  }
})

for (const slug of templateSlugs) {
  test(`${slug} has semantic landmarks and named controls`, async ({ page }) => {
    const pageErrors: string[] = []

    page.on('pageerror', error => pageErrors.push(error.message))
    await page.goto(`/templates/${slug}`)

    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

    const accessibility = await page.locator('main').evaluate(main => {
      const controls = [...main.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [role="button"], [role="radio"]'
      )]
      const labelledByFor = (control: HTMLElement) =>
        control.getAttribute('aria-labelledby')
          ?.split(/\s+/)
          .map(id => document.getElementById(id)?.textContent.trim())
          .filter(Boolean)
          .join(' ')

      const explicitLabelFor = (control: HTMLElement) => main
        .querySelector<HTMLLabelElement>(`label[for="${CSS.escape(control.id)}"]`)
        ?.textContent.trim()

      const nameFor = (control: HTMLElement) => [
        control.getAttribute('aria-label')?.trim(),
        labelledByFor(control),
        control.id ? explicitLabelFor(control) : undefined,
        control.closest('label')?.textContent.trim(),
        control.textContent.trim(),
        control.getAttribute('placeholder')?.trim()
      ].find(Boolean) ?? ''
      const ids = [...main.querySelectorAll<HTMLElement>('[id]')]
        .map(element => element.id)
      const missingHashReferences = [...main.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
        .map(anchor => anchor.hash.slice(1))
        .filter(id => id && !document.getElementById(decodeURIComponent(id)))

      return {
        duplicateIds: [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))],
        missingHashReferences,
        unlabeledControls: controls
          .filter(control => !nameFor(control))
          .map(control => control.outerHTML.slice(0, 120))
      }
    })

    expect(accessibility.duplicateIds).toEqual([])
    expect(accessibility.missingHashReferences).toEqual([])
    expect(accessibility.unlabeledControls).toEqual([])
    expect(pageErrors).toEqual([])
  })
}

test('template theme and onboarding choice remain keyboard operable', async ({ page }) => {
  await page.goto('/templates/analytics-dashboard')

  const themeToggle = page.locator(
    '.template-shell__topbar-actions .ui-theme-toggle'
  )
  const initialTheme = await page.locator('html').getAttribute('data-theme')

  await themeToggle.focus()
  await themeToggle.press('Enter')
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', initialTheme ?? '')

  await page.goto('/templates/auth-onboarding')

  const personal = page.getByRole('radio', { name: /personal workspace/i })

  await personal.focus()
  await personal.press('Space')
  await expect(personal).toBeChecked()
})

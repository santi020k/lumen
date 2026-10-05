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
    name: 'Skip the blank canvas. Ship the product.'
  })).toBeVisible()

  for (const slug of templateSlugs) {
    const card = page.locator('.template-gallery-card').filter({
      has: page.locator(`a[href="/templates/${slug}"]`)
    })

    await expect(card).toBeVisible()
    await expect(card.locator('code').filter({ hasText: '--target astro' })).toContainText(
      `lumen add ${slug} --target astro`
    )
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

for (const slug of ['analytics-dashboard', 'saas-admin', 'commerce-dashboard']) {
  for (const width of [375, 1280, 1600]) {
    test(`${slug} preserves readable metric values at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`/templates/${slug}`)
      const metrics = page.locator('.template-metric')
      expect(await metrics.count()).toBeGreaterThan(0)
      for (const metric of await metrics.all()) {
        const valueLines = await metric.locator('[data-slot="stat-value"]').evaluate(value => {
          const range = document.createRange()
          range.selectNodeContents(value)
          return range.getClientRects().length
        })
        expect(valueLines).toBe(1)
        const bounds = await metric.boundingBox()
        const badgeBounds = await metric.locator('.template-metric__summary > span[data-variant]').boundingBox()
        if (!bounds || !badgeBounds) throw new Error('Expected visible metric and change badge')
        expect(badgeBounds.x).toBeGreaterThanOrEqual(bounds.x)
        expect(badgeBounds.x + badgeBounds.width).toBeLessThanOrEqual(bounds.x + bounds.width)
      }
    })
  }
}

for (const width of [390, 1440]) {
  for (const theme of ['light', 'dark']) {
    test(`login examples are clearly visual and fit ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/templates/auth-onboarding')
      await page.locator('html').evaluate((html, value) => {
        html.dataset.theme = value
      }, theme)
      const examples = page.getByRole('region', { name: 'A familiar way back in.' })
      await expect(examples).toBeVisible()
      await expect(examples).toContainText('These visual examples do not send codes or sign you in.')
      for (const name of ['Welcome back', 'Check your inbox', 'Try another way']) {
        await expect(examples.getByRole('heading', { name, exact: true })).toBeVisible()
      }
      for (const button of await examples.locator('.lumen-login-examples__card button').all()) {
        await expect(button).toBeDisabled()
      }
      await expect(examples.getByLabel('Email address')).toHaveAttribute('readonly', '')
      await expect(examples.getByRole('textbox', { name: 'Email code', exact: true })).toHaveAttribute('autocomplete', 'one-time-code')
      const overflows = await examples.evaluate(element => {
        const viewport = document.documentElement.clientWidth
        return [...element.querySelectorAll<HTMLElement>('.lumen-login-examples__card')]
          .filter(card => card.getBoundingClientRect().right > viewport || card.scrollWidth > card.clientWidth)
          .length
      })
      expect(overflows).toBe(0)
      await examples.getByRole('tab', { name: 'Email code', exact: true }).click()
      await expect(examples.getByRole('tabpanel')).toContainText('requestEmailOtp')
      await expect(examples.getByRole('tabpanel')).toContainText('signInWithEmailOtp')
      await examples.getByRole('tab', { name: 'Passkey', exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(examples.getByRole('tabpanel')).toContainText('signInWithPasskey')
      await examples.getByRole('tab', { name: 'Set up', exact: true }).click()
      await page.locator('body').click({ position: { x: 1, y: 1 } })
      await examples.screenshot({ style: '.docs-site-header, .docs-skip-link { visibility: hidden; }', path: `/private/tmp/lumen-login-${width}-${theme}.png` })
    })
  }
}

import { createRequire } from 'node:module'

import { expect, type Page, test } from '@playwright/test'

import { chartGuides } from '../../apps/docs/src/data/chart-guides.js'
import { chartTopics } from '../../apps/docs/src/data/chart-topics.js'
import { mcpGuideTopics } from '../../apps/docs/src/data/mcp-guides.js'
import { nativeGuideTopics } from '../../apps/docs/src/data/native-guide-topics.js'

const axePath = createRequire(new URL('../../packages/elements/package.json', import.meta.url)).resolve('axe-core/axe.min.js')

const expectNoOverflow = async (page: Page): Promise<void> => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
}

for (const width of [390, 1440]) {
  test(`visual chart directory supports discovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/docs/web/data-visualization')
    const cards = page.locator('[data-chart-tile]:visible')
    await expect(cards).toHaveCount(16)
    for (const card of await cards.all()) await expect(card.locator('svg').first()).toBeAttached()
    await page.getByLabel('Search charts', { exact: true }).fill('trend')
    for (const name of ['LineChart', 'RangeChart', 'Sparkline']) {
      await expect(cards.getByRole('link', { name, exact: true })).toBeVisible()
    }
    await page.getByLabel('Search charts', { exact: true }).fill('distribution')
    await expect(cards).toHaveCount(2)
    await expect(cards).toContainText(['Histogram', 'BoxPlot'])
    await page.getByLabel('Search charts', { exact: true }).fill('unavailable-chart')
    await expect(cards).toHaveCount(0)
    await expect(page.locator('[data-chart-empty]')).toBeVisible()
    await page.getByLabel('Search charts', { exact: true }).fill('')
    await page.getByRole('combobox', { name: 'Your question', exact: true }).click()
    await page.getByRole('option', { name: 'Trend', exact: true }).click()
    await expect(cards).toHaveCount(3)
    await expectNoOverflow(page)
    await cards.getByRole('link', { name: 'LineChart', exact: true }).click()
    await expect(page).toHaveURL(/\/docs\/components\/line-chart$/)
  })

  test(`section navigation keeps headings visible and focused at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    for (const route of ['/docs/components/box-plot', '/docs/frameworks/react/hooks/use-dialog', '/docs/mcp/reference', '/docs/migrations/v3-to-v4', '/docs/react-native/hooks']) {
      await page.goto(route)
      const summary = page.locator('[data-docs-page-navigation] summary')
      await summary.press('Enter')
      const navigation = page.getByRole('navigation', { name: 'On this page', exact: true })
      await expect(navigation).toBeVisible()
      await navigation.getByRole('link').last().press('Escape')
      await expect(navigation).toBeHidden()
      await expect(summary).toBeFocused()
      await summary.press('Enter')
      const destination = navigation.getByRole('link').last()
      const href = await destination.getAttribute('href')
      if (!href) throw new Error(`Missing section destination on ${route}`)
      await destination.press('Enter')
      await expect(navigation).toBeHidden()
      const heading = page.locator(`[id="${href.slice(1)}"]`)
      await expect(heading).toBeFocused()
      await expect.poll(async () => heading.evaluate(element => {
        const bottom = Math.max(...Array.from(document.querySelectorAll('.docs-site-header, .docs-mobile-navigation-bar'))
          .map(header => header.getBoundingClientRect().bottom))
        return element.getBoundingClientRect().top >= bottom - 1
      })).toBe(true)
      await expectNoOverflow(page)
    }
  })
}

for (const guide of chartGuides) {
  test(`${guide.name} has a live example, collapsed copyable code, data guidance, and API`, async ({ page }) => {
    await page.goto(`/docs/components/${guide.slug}`)
    const preview = page.locator('[data-playground-preview]').first()
    await expect(preview.locator('figure, .ui-sparkline').first()).toBeVisible()
    const code = page.locator('.framework-example__code').first()
    await expect(code).not.toHaveAttribute('open')
    await code.locator('summary').press('Enter')
    const tabs = code.getByRole('tablist', { name: 'Framework', exact: true })
    for (const name of ['Astro', 'React', 'Elements']) {
      await tabs.getByRole('tab', { name, exact: true }).click()
      await expect(code.getByRole('tabpanel').filter({ visible: true })).toContainText(guide.name)
      await expect(code.getByRole('button', { name: 'Copy code to clipboard', exact: true }).filter({ visible: true })).toBeVisible()
    }
    await code.locator('summary').press('Space')
    await expect(tabs).toBeHidden()
    for (const id of ['chart-reading-title', 'chart-data-title', 'chart-pitfalls-title', 'api-title']) {
      await expect(page.locator(`[id="${id}"]`)).toBeAttached()
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoOverflow(page)
  })
}

test('all new guides have unique metadata, canonical URLs, and structured breadcrumbs', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/docs/frameworks/react/hooks')
  const hookLinks = await page.locator('.hook-catalog__link').evaluateAll(links => links.map(link => ({
    href: link.getAttribute('href') ?? ''
  })))
  expect(hookLinks).toHaveLength(19)
  const routes = [...chartTopics.slice(1), ...mcpGuideTopics.slice(1), ...nativeGuideTopics, ...hookLinks,
    { href: '/docs/frameworks/react/hooks' }]
  const titles = new Set<string>()
  for (const { href } of routes) {
    const response = await page.goto(href)
    expect(response?.status(), href).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    const title = await page.title()
    expect(titles.has(title), title).toBe(false)
    titles.add(title)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://lumen.santi020k.com${href}`)
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description?.length, href).toBeGreaterThan(30)
    const metadata = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(metadata.join(' '), href).toContain('BreadcrumbList')
    expect(metadata.join(' '), href).not.toContain('https://lumen.santi020k.com/docs/frameworks"')
    await expectNoOverflow(page)
  }
})

test('older section links arrive at the focused documentation', async ({ page }) => {
  for (const [oldPath, newPath] of [
    ['/docs/web/data-visualization#calendar-heatmap-usage', '/docs/components/calendar-heatmap'],
    ['/docs/web/data-visualization#chart-gallery', '/docs/web/data-visualization/gallery'],
    ['/docs/react-native#installation', '/docs/react-native/installation'],
    ['/docs/apple#theme', '/docs/apple/theming'],
    ['/docs/android#ai-usage', '/docs/android/ai'],
    ['/docs/mcp#tools-title', '/docs/mcp/reference#tools-title'],
    ['/docs/mcp#setup-title', '/docs/mcp/clients#setup-title']
  ] as const) {
    await page.goto(oldPath)
    await expect(page).toHaveURL(`http://127.0.0.1:${process.env.LUMEN_A11Y_PORT ?? '4323'}${newPath}`)
  }
  await page.goto('/docs/frameworks/react#useDialog')
  await expect(page.locator('a#useDialog')).toHaveAttribute('href', '/docs/frameworks/react/hooks/use-dialog')
})

test('split guide links remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  for (const [path, selector, href] of [
    ['/docs/web/data-visualization#chart-setup', '#chart-setup', '/docs/web/data-visualization/setup'],
    ['/docs/frameworks/react#useDialog', '#useDialog', '/docs/frameworks/react/hooks/use-dialog'],
    ['/docs/react-native#installation', '#installation', '/docs/react-native/installation'],
    ['/docs/mcp#tools-title', '#tools-title', '/docs/mcp/reference#tools-title']
  ] as const) {
    await page.goto(path)
    await expect(page.locator(`${selector}[href], ${selector} a`).first()).toHaveAttribute('href', href)
  }
  await context.close()
})

for (const theme of ['lumen-light', 'lumen-dark']) {
  test(`new visual guides remain accessible in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => { localStorage.setItem('lumen-theme', value); }, theme)
    for (const route of ['/docs/web/data-visualization', '/docs/components/box-plot', '/docs/frameworks/react/hooks', '/docs/react-native', '/docs/mcp/clients', '/docs/web/data-visualization/data', '/docs/web/data-visualization/accessibility']) {
      await page.goto(route)
      if (route === '/docs/components/box-plot') await page.locator('.framework-example__code > summary').press('Enter')
      await page.addScriptTag({ path: axePath })
      const report: unknown = await page.evaluate('axe.run(".docs-content")')
      expect(report, route).toMatchObject({ violations: [] })
    }
  })
}

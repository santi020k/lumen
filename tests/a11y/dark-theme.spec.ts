import { expect, type Page, test } from '@playwright/test'

/* eslint-disable complexity, unicorn/consistent-function-scoping */

type DarkTheme = 'lumen-dark' | 'santi020k-dark'

const darkThemes: DarkTheme[] = ['santi020k-dark', 'lumen-dark']

const checkedPaths = [
  '/',
  '/docs',
  '/docs/components',
  '/docs/components/button',
  '/docs/components/field',
  '/docs/components/particles',
  '/docs/components/scroll-reveal',
  '/docs/components/select',
  '/docs/components/theme-builder',
  '/docs/components/theme-toggle',
  '/docs/theme-playground'
]

const openDocsPage = async (page: Page, path: string, theme: DarkTheme) => {
  await page.addInitScript(themeName => {
    window.localStorage.setItem('lumen-theme', themeName)
  }, theme)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(path)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

  if (path === '/docs/theme-playground') {
    const playground = page.locator('.theme-playground')
    const darkScheme = playground.locator('[data-ui-theme-scheme="dark"]')

    await expect(playground).toHaveAttribute('data-ui-theme-builder-bound', 'true')
    await darkScheme.click()

    await expect(darkScheme).toHaveAttribute('aria-pressed', 'true')
    await expect(playground.locator('[data-ui-theme-output]')).toHaveValue(/color-scheme: dark/)
    await page.waitForFunction(() => {
      const label = document.querySelector('#theme-playground-preview .ui-label')

      return label && getComputedStyle(label).color !== 'rgb(26, 17, 39)'
    })
    await page.keyboard.press('Tab')
  }
}

const getDarkThemeAccessibilityReport = async (page: Page) => page.evaluate(() => {
  type Rgb = [number, number, number, number]

  interface ContrastFailure {
    background: string
    contrast: number
    foreground: string
    selector: string
    text: string
    threshold: number
  }

  interface FocusFailure {
    selector: string
    tag: string
  }

  const ignoredSelectors = [
    '[aria-hidden="true"]',
    '[hidden]',
    'script',
    'style',
    'svg',
    '.sr-only',
    '[data-ui-code-line-numbers]',
    '[data-ui-swatch]',
    '.docs-home-title span',
    '.docs-site-footer__statement h2 em',
    '.home-hero h1 em'
  ]

  const parseRgb = (value: string): Rgb | null => {
    const match = /rgba?\(([^)]+)\)/.exec(value)

    if (!match?.[1]) return null

    const parts = match[1].split(/,\s*|\s+/).filter(part => part !== '/')
    const [red, green, blue] = parts.slice(0, 3).map(Number)
    const alpha = parts[3] === undefined ? 1 : Number(parts[3])

    if ([red, green, blue, alpha].some(part => Number.isNaN(part))) return null

    return [red ?? 0, green ?? 0, blue ?? 0, alpha ?? 1]
  }

  const blend = (top: Rgb, bottom: Rgb): Rgb => {
    const alpha = top[3] + bottom[3] * (1 - top[3])

    if (alpha === 0) return [0, 0, 0, 0]

    return [
      (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / alpha,
      (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / alpha,
      (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / alpha,
      alpha
    ]
  }

  const channelLuminance = (channel: number) => {
    const value = channel / 255

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  const luminance = ([red, green, blue]: Rgb) => (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  )

  const contrastRatio = (foreground: Rgb, background: Rgb) => {
    const lighter = Math.max(luminance(foreground), luminance(background))
    const darker = Math.min(luminance(foreground), luminance(background))

    return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
  }

  const colorToString = (color: Rgb) => (
    `rgb(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])})`
  )

  const isElementVisible = (element: Element) => {
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) > 0.2
    )
  }

  const getSelector = (element: Element) => {
    if (element.id) return `#${element.id}`

    const testId = element.getAttribute('data-ui-component') ?? element.getAttribute('data-ui-docs-section')

    if (testId) return `[data-ui-component="${testId}"]`

    const className = [...element.classList].slice(0, 2).join('.')
    const label = element.textContent?.trim().replaceAll(/\s+/g, ' ').slice(0, 32)

    return `${element.tagName.toLowerCase()}${className ? `.${className}` : ''}${label ? ` "${label}"` : ''}`
  }

  const shouldSkipElement = (element: Element) => (
    ignoredSelectors.some(selector => element.closest(selector)) ||
    Boolean(element.closest(':disabled, [aria-disabled="true"]')) ||
    !isElementVisible(element)
  )

  const getBackground = (element: Element): Rgb => {
    const ancestors: Element[] = []
    let current: Element | null = element

    while (current) {
      ancestors.unshift(current)
      current = current.parentElement
    }

    return ancestors.reduce<Rgb>((background, ancestor) => {
      const color = parseRgb(window.getComputedStyle(ancestor).backgroundColor)

      return color && color[3] > 0 ? blend(color, background) : background
    }, [255, 255, 255, 1])
  }

  const getTextThreshold = (element: Element) => {
    const style = window.getComputedStyle(element)
    const fontSize = Number.parseFloat(style.fontSize)
    const fontWeight = Number.parseInt(style.fontWeight, 10)

    return fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5
  }

  const contrastFailures: ContrastFailure[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const node = walker.currentNode
    const element = node.parentElement
    const text = node.textContent?.replaceAll(/\s+/g, ' ').trim()

    if (!element || !text || shouldSkipElement(element)) continue

    const range = document.createRange()
    range.selectNodeContents(node)
    const rect = range.getBoundingClientRect()
    range.detach()

    if (rect.width <= 0 || rect.height <= 0) continue

    const style = window.getComputedStyle(element)
    const foreground = parseRgb(style.color)
    const background = getBackground(element)

    if (!foreground) continue

    const blendedForeground = foreground[3] < 1 ? blend(foreground, background) : foreground
    const contrast = contrastRatio(blendedForeground, background)
    const threshold = getTextThreshold(element)

    if (contrast < threshold) {
      contrastFailures.push({
        background: colorToString(background),
        contrast,
        foreground: colorToString(blendedForeground),
        selector: getSelector(element),
        text: text.slice(0, 80),
        threshold
      })
    }
  }

  for (const element of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]')) {
    if (shouldSkipElement(element)) continue

    const foreground = parseRgb(window.getComputedStyle(element, '::placeholder').color)
    const background = getBackground(element)

    if (!foreground) continue

    const contrast = contrastRatio(foreground[3] < 1 ? blend(foreground, background) : foreground, background)

    if (contrast < 4.5) {
      contrastFailures.push({
        background: colorToString(background),
        contrast,
        foreground: colorToString(foreground),
        selector: getSelector(element),
        text: element.placeholder,
        threshold: 4.5
      })
    }
  }

  const focusableSelectors = [
    'header a[href]',
    'header button',
    'header select',
    'main a[href]',
    'main button:not([disabled])',
    'main input:not([disabled])',
    'main select:not([disabled])',
    'main textarea:not([disabled])',
    'main [tabindex]:not([tabindex="-1"])'
  ]

  const focusFailures: FocusFailure[] = []
  const focusable = [...document.querySelectorAll<HTMLElement>(focusableSelectors.join(','))]
    .filter(element => !shouldSkipElement(element))
    .slice(0, 36)

  for (const element of focusable) {
    element.focus()

    const style = window.getComputedStyle(element)
    const hasOutline = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2
    const hasShadow = style.boxShadow !== 'none'

    if (!hasOutline && !hasShadow) {
      focusFailures.push({
        selector: getSelector(element),
        tag: element.tagName.toLowerCase()
      })
    }
  }

  return {
    contrastFailures: contrastFailures.slice(0, 20),
    focusFailures
  }
})

for (const theme of darkThemes) {
  for (const path of checkedPaths) {
    test(`${path} keeps dark theme text and focus accessible (${theme})`, async ({ page }) => {
      await openDocsPage(page, path, theme)

      const report = await getDarkThemeAccessibilityReport(page)

      expect(report.contrastFailures).toEqual([])
      expect(report.focusFailures).toEqual([])
    })
  }
}

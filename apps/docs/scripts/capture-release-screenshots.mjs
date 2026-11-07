import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '../../..')
const output = path.join(root, 'docs/assets/releases/v5.0.0/screenshots')
const base = process.env.LUMEN_RELEASE_CAPTURE_URL ?? 'http://127.0.0.1:4335'
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const browser = await chromium.launch()
const captures = []

await mkdir(output, { recursive: true })

try {
  for (const mode of ['light', 'dark']) {
    const context = await browser.newContext({
      colorScheme: mode,
      reducedMotion: 'reduce',
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 1
    })

    await context.addInitScript(theme => localStorage.setItem('lumen-theme', theme), `lumen-${mode}`)

    const page = await context.newPage()
    const errors = []

    page.setDefaultTimeout(120_000)

    page.setDefaultNavigationTimeout(120_000)

    page.on('pageerror', error => errors.push(error.message))

    const capture = async (name, route, selector, alt, viewport) => {
      await page.setViewportSize(viewport ?? { width: 1440, height: 1100 })

      const url = new URL(route, base).href

      const response = page.url() === url ?
        await page.reload({ waitUntil: 'load' }) :
        await page.goto(url, { waitUntil: 'load' })

      assert.equal(response?.status(), 200, route)

      await page.evaluate(() => document.fonts.ready)

      const target = selector ? page.locator(selector) : page.locator('body')

      await target.waitFor({ state: 'visible' })

      if (name === 'react-native-profile') await page.getByText('Contributor onboarding', { exact: true }).waitFor()

      if (name === 'react-native-settings') await page.getByText('Appearance', { exact: true }).first().waitFor()

      const filename = `${name}-${mode}.webp`

      const png = selector ?
        await target.screenshot({ animations: 'disabled' }) :
        await page.screenshot({ animations: 'disabled' })

      const result = await sharp(png).webp({ quality: 92 }).toFile(path.join(output, filename))

      captures.push({
        file: `screenshots/${filename}`,
        route,
        selector,
        mode,
        alt,
        width: result.width,
        height: result.height,
        viewport: page.viewportSize(),
        sourceRevision: revision,
        capturedAt: new Date().toISOString(),
        renderer: name.startsWith('react-native') ? 'Expo web / Chromium' : 'Astro / Chromium'
      })
    }

    await capture('web-workspace', '/', '.home-workbench', 'Lumen web workspace with navigation, metrics, activity chart, and task form.')

    await capture('web-mobile', '/', '.home-workbench', 'Lumen workspace arranged for a narrow mobile browser.', { width: 390, height: 844 })

    await capture('web-frameworks', '/docs/web/playground', '.web-framework-playground__workbench', 'Live Astro playground with release readiness and behavior tabs.')

    // Exercise the actual adapter switch before recording the React surface.
    await page.getByRole('button', { name: 'React', exact: true }).click()

    await page.locator('[data-framework-panel="react"] h2').waitFor()

    await page.getByRole('button', { name: 'Advance', exact: true }).click()

    const react = page.locator('[data-framework-panel="react"]')

    await react.getByText('76% verified', { exact: true }).waitFor()

    const reactPng = await page.locator('.web-framework-playground__workbench').screenshot({ animations: 'disabled' })

    const reactImage = await sharp(reactPng).webp({ quality: 92 })
      .toFile(path.join(output, `web-react-interaction-${mode}.webp`))

    captures.push({ ...captures.at(-1), file: `screenshots/web-react-interaction-${mode}.webp`, width: reactImage.width, height: reactImage.height, capturedAt: new Date().toISOString(), renderer: 'React / Chromium', alt: 'React playground after advancing the interactive release example to 76 percent.' })

    await page.getByRole('button', { name: 'Elements', exact: true }).click()

    await page.locator('[data-elements-advance]').click()

    await page.locator('[data-elements-status]').filter({ hasText: '80% verified' }).waitFor()

    const elementsPng = await page.locator('.web-framework-playground__workbench').screenshot({ animations: 'disabled' })

    const elementsImage = await sharp(elementsPng).webp({ quality: 92 })
      .toFile(path.join(output, `web-elements-interaction-${mode}.webp`))

    captures.push({ ...captures.at(-1), file: `screenshots/web-elements-interaction-${mode}.webp`, width: elementsImage.width, height: elementsImage.height, capturedAt: new Date().toISOString(), renderer: 'Web Components / Chromium', alt: 'Web Components playground after advancing the release example to 80 percent.' })

    await capture('theme-studio', '/docs/theme-playground', '#theme-workbench', 'Theme studio with color inputs, a live component preview, and token export controls.')

    for (const [name, query, alt] of [
      ['react-native-profile', 'destination=examples&pattern=profile', 'React Native contributor profile example rendered in an Expo browser preview.'],
      ['react-native-settings', 'destination=settings&theme=paper', 'React Native settings with the Paper theme rendered in an Expo browser preview.']
    ]) {
      await capture(name, `/native-previews/react-native-live/index.html?${query}&scheme=${mode}`, null, alt, { width: 390, height: 844 })
    }

    assert.deepEqual(errors, [], `Browser exceptions in ${mode} captures`)

    await context.close()
  }

  await writeFile(path.join(output, '../web-captures.json'), `${JSON.stringify({ sourceRevision: revision, captures }, null, 2)}\n`)

  console.log(`Captured ${captures.length} release screenshots from ${revision}.`)
} finally {
  await browser.close()
}

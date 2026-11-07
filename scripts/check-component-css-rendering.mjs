import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const scenarios = [
  { name: 'mobile-light', width: 390, height: 844, theme: 'lumen-light', direction: 'ltr', text: '100%' },
  { name: 'mobile-dark', width: 390, height: 844, theme: 'lumen-dark', direction: 'ltr', text: '100%' },
  { name: 'desktop-light', width: 1440, height: 900, theme: 'lumen-light', direction: 'ltr', text: '100%' },
  { name: 'desktop-dark', width: 1440, height: 900, theme: 'lumen-dark', direction: 'ltr', text: '100%' },
  { name: 'mobile-rtl-large', width: 390, height: 844, theme: 'lumen-dark', direction: 'rtl', text: '200%' }
]

/** @param {import('@playwright/test').Browser} browser @param {string} origin
 * @param {string} directory @param {string[]} routes */
export const captureStyleMatrix = async (browser, origin, directory, routes) => {
  const output = join(directory, 'rendered')

  await mkdir(output, { recursive: true })

  for (const scenario of scenarios) {
    const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height }, reducedMotion: 'reduce' })

    for (const route of routes.filter(name => name !== 'static-runtime')) {
      const parameters = new URLSearchParams({ theme: scenario.theme, direction: scenario.direction, text: scenario.text })

      await page.goto(`${origin}/${route}/?${parameters}`)

      await page.waitForLoadState('networkidle')

      const computed = await page.locator('main').evaluate(root => {
        const properties = [
          'display', 'position', 'color', 'background-color', 'background-image', 'font-family', 'font-size',
          'font-weight', 'line-height', 'letter-spacing', 'width', 'height', 'min-width', 'max-width', 'min-height',
          'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right',
          'margin-bottom', 'margin-left', 'border-top-width', 'border-right-width', 'border-bottom-width',
          'border-left-width', 'border-top-color', 'border-top-style', 'border-radius', 'box-shadow',
          'outline-color', 'outline-width', 'outline-offset', 'opacity', 'visibility', 'overflow-x', 'overflow-y',
          'flex', 'gap', 'align-items', 'justify-content', 'grid-template-columns', 'grid-template-rows',
          'transform', 'transition-duration', 'animation-name', 'animation-duration', 'fill', 'stroke'
        ]

        return [...root.querySelectorAll('*')].filter(element => !element.matches('script, style')).map(element => ({
          tag: element.tagName,
          styles: Object.fromEntries(properties.map(property => [property, getComputedStyle(element).getPropertyValue(property)]))
        }))
      })

      const name = `${route}-${scenario.name}`

      await writeFile(join(output, `${name}.json`), JSON.stringify(computed, null, 2) + '\n')

      await page.screenshot({ path: join(output, `${name}.png`), fullPage: true, animations: 'disabled' })
    }

    await page.close()
  }
}

/** @param {string} baseline @param {string} candidate @param {string[]} routes */
export const compareStyleMatrix = async (baseline, candidate, routes) => {
  for (const scenario of scenarios) {
    for (const route of routes.filter(name => name !== 'static-runtime')) {
      const name = `${route}-${scenario.name}`
      const before = JSON.parse(await readFile(join(baseline, 'rendered', `${name}.json`), 'utf8'))
      const after = JSON.parse(await readFile(join(candidate, 'rendered', `${name}.json`), 'utf8'))

      assert.deepEqual(after, before, `Selective CSS changed computed styles in ${name}`)

      const [beforeImage, afterImage] = await Promise.all([baseline, candidate]
        .map(directory => readFile(join(directory, 'rendered', `${name}.png`))))

      assert(beforeImage.equals(afterImage), `Selective CSS changed rendered pixels in ${name}`)
    }
  }
}

import assert from 'node:assert/strict'
import { join } from 'node:path'

import { preprocessCSS, resolveConfig } from 'vite'

import { readSanti020kSiteColors } from './lib/santi020k-site-colors.mjs'

// Resolve the public imports from a real consumer package, including adapter and Core re-exports.
export const checkAppearanceDelivery = async (browser, repo) => {
  const root = join(repo, 'apps/docs')
  const config = await resolveConfig({ configFile: false, root, logLevel: 'silent' }, 'build')

  const css = async paths => {
    const source = paths.map(path => `@import "@santi020k/lumen-astro/${path}.css";`).join('\n')
    const result = await preprocessCSS(source, join(root, 'appearances.css'), config)

    return result.code
  }

  const base = await css(['styles/foundation', 'styles/components/card', 'styles/components/button', 'styles/components/stack', 'styles/components/code', 'styles/components/stat'])
  const paper = await css(['styles/themes/paper'])
  const field = await css(['styles/themes/field'])
  const studio = await css(['styles/themes/studio'])
  const glass = await css(['styles/effects/glass'])
  const branded = await css(['styles/themes/santi020k'])
  const full = await css(['styles'])
  const siteColors = await readSanti020kSiteColors()

  assert.doesNotMatch(base, /data-lumen-preset="(?:studio|glass|paper|field)"|santi020k-dark|ui-card--glass|--glass-bg:/u)

  assert.doesNotMatch(base + studio + branded + glass, /--_(?:paper|field)-/u)

  assert.doesNotMatch(paper, /--_field-|data-lumen-preset="field"/u)

  assert.doesNotMatch(field, /--_paper-|data-lumen-preset="paper"/u)

  assert.doesNotMatch(paper + field + studio + branded, /backdrop-filter\s*:/u)

  assert.doesNotMatch(glass, /data-lumen-preset="studio"|santi020k-(?:light|dark)/u)

  const page = await browser.newPage({ reducedMotion: 'reduce' })

  for (const styles of [full, base + studio + glass + branded]) {
    for (const [theme, boundary, scheme] of [
      ['lumen-dark', 'data-theme="lumen-light"', 'light'],
      ['santi020k-dark', '', 'dark'],
      ['lumen-light', 'data-lumen-scheme="dark"', 'dark']
    ]) {
      for (const preset of ['default', 'studio', 'glass']) {
        await page.setContent(`<html data-theme="${theme}"><style>${styles}</style><section ${boundary}><div data-lumen-preset="${preset}"></div></section></html>`)

        assert.equal(await page.locator('[data-lumen-preset]').evaluate(element => getComputedStyle(element).colorScheme), scheme)
      }
    }
  }

  try {
    const read = async (styles, theme, preset) => {
      await page.setContent(`<!doctype html><html data-theme="${theme}" data-lumen-preset="${preset}"><head>
        <style>${styles}</style></head><body><div class="ui-card ui-card--glass ui-glass-subtle">Toolbar</div>
        <div class="ui-stat ui-stat--glass">Metric</div><code class="ui-code" data-code-theme="auto">value</code>
        <article class="ui-card" style="color: hsl(var(--ink))"><button class="ui-button ui-button--default">Read</button></article>
        <div class="ui-stack ui-stack--gap-section"></div>
        <section data-lumen-preset="default" data-lumen-scheme="light"><article class="ui-card"></article></section></body></html>`)

      return page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement)
        const card = getComputedStyle(document.querySelector('.ui-card'))

        return {
          brand: rootStyle.getPropertyValue('--brand').trim(),
          radius: rootStyle.getPropertyValue('--ui-radius').trim(),
          nestedBrand: getComputedStyle(document.querySelector('section')).getPropertyValue('--brand').trim(),
          code: getComputedStyle(document.querySelector('code')).getPropertyValue('--ui-code-fg').trim(),
          sheet: getComputedStyle(document.querySelector('article')).borderRadius,
          primary: getComputedStyle(document.querySelector('button')).backgroundColor,
          ink: getComputedStyle(document.querySelector('article')).color,
          sectionGap: getComputedStyle(document.querySelector('.ui-stack')).rowGap,
          nestedSheet: getComputedStyle(document.querySelector('section article')).borderRadius,
          background: card.backgroundImage, filter: card.backdropFilter,
          statPadding: getComputedStyle(document.querySelector('.ui-stat')).paddingTop
        }
      })
    }

    for (const scheme of ['light', 'dark']) {
      const theme = `lumen-${scheme}`
      const plain = await read(base, theme, '')

      assert.equal(plain.filter, 'none')

      assert.equal(plain.brand, scheme === 'light' ? '193 79% 26%' : '185 56% 72%')

      assert.deepEqual(await read(base, theme, 'studio'), plain)

      const solidStudio = await read(base + studio, theme, 'studio')

      assert.equal(solidStudio.brand, scheme === 'light' ? '0 0% 9%' : '0 0% 96%')

      assert.equal(solidStudio.filter, 'none')

      assert.equal(solidStudio.nestedBrand, '193 79% 26%')

      const brandTheme = `santi020k-${scheme}`
      const brandOnly = await read(base + branded, brandTheme, '')

      const colors = await page.evaluate(roles => {
        const style = getComputedStyle(document.documentElement)

        return Object.fromEntries(roles.map(role => [role, style.getPropertyValue(`--${role}`).trim()]))
      }, Object.keys(siteColors[scheme]))

      const published = siteColors[scheme]

      assert.deepEqual(colors, {
        ...published,
        brand: scheme === 'dark' ? published.accent : published.brand,
        'ink-muted': scheme === 'light' ? published['ink-soft'] : published['ink-muted']
      })

      assert.equal(await page.locator('html').evaluate(root =>
        getComputedStyle(root).getPropertyValue('--ui-website-brand').trim()
      ), published.brand)

      assert.equal(brandOnly.filter, 'none')

      assert.equal(brandOnly.sheet, '24px 24px 8px')

      assert.equal(brandOnly.primary, brandOnly.ink)

      assert.equal(brandOnly.sectionGap, '112px')

      assert.equal(brandOnly.nestedSheet, plain.sheet)

      assert.deepEqual(await read(branded + base, theme, ''), plain)

      for (const [activeTheme, preset, extra] of [
        [theme, '', ''], [theme, 'paper', paper], [theme, 'field', field], [theme, 'studio', studio], [theme, 'glass', ''], [brandTheme, '', branded],
        [brandTheme, 'paper', branded + paper], [brandTheme, 'field', branded + field]
      ]) {
        const reference = await read(full, activeTheme, preset)

        assert.match(reference.filter, /blur/u)

        assert.deepEqual(await read(base + extra + glass, activeTheme, preset), reference)

        assert.deepEqual(await read(glass + extra + base, activeTheme, preset), reference)
      }
    }

    const session = await page.context().newCDPSession(page)

    await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })

    assert.equal((await read(base + glass, 'lumen-dark', 'glass')).filter, 'none')
  } finally {
    await page.close()
  }
}

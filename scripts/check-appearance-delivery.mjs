import assert from 'node:assert/strict'
import { join } from 'node:path'

import { preprocessCSS, resolveConfig } from 'vite'

// Resolve the public imports from a real consumer package, including adapter and Core re-exports.
export const checkAppearanceDelivery = async (browser, repo) => {
  const root = join(repo, 'apps/docs')
  const config = await resolveConfig({ configFile: false, root, logLevel: 'silent' }, 'build')

  const css = async paths => {
    const source = paths.map(path => `@import "@santi020k/lumen-astro/${path}.css";`).join('\n')
    const result = await preprocessCSS(source, join(root, 'appearances.css'), config)

    return result.code
  }

  const base = await css(['styles/foundation', 'styles/components/card', 'styles/components/code', 'styles/components/stat'])
  const studio = await css(['styles/themes/studio'])
  const glass = await css(['styles/effects/glass'])
  const branded = await css(['styles/themes/santi020k'])
  const full = await css(['styles'])

  assert.doesNotMatch(base, /data-lumen-preset="(?:studio|glass)"|santi020k-dark|ui-card--glass|--glass-bg:/u)

  assert.doesNotMatch(studio + branded, /backdrop-filter\s*:/u)

  assert.doesNotMatch(glass, /data-lumen-preset="studio"|santi020k-(?:light|dark)/u)

  const page = await browser.newPage({ reducedMotion: 'reduce' })

  try {
    const read = async (styles, theme, preset) => {
      await page.setContent(`<!doctype html><html data-theme="${theme}" data-lumen-preset="${preset}"><head>
        <style>${styles}</style></head><body><div class="ui-card ui-card--glass ui-glass-subtle">Toolbar</div>
        <div class="ui-stat ui-stat--glass">Metric</div><code class="ui-code" data-code-theme="auto">value</code>
        <section data-lumen-preset="default" data-lumen-scheme="light"></section></body></html>`)

      return page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement)
        const card = getComputedStyle(document.querySelector('.ui-card'))

        return {
          brand: rootStyle.getPropertyValue('--brand').trim(),
          radius: rootStyle.getPropertyValue('--ui-radius').trim(),
          nestedBrand: getComputedStyle(document.querySelector('section')).getPropertyValue('--brand').trim(),
          code: getComputedStyle(document.querySelector('code')).getPropertyValue('--ui-code-fg').trim(),
          background: card.backgroundImage, filter: card.backdropFilter,
          statPadding: getComputedStyle(document.querySelector('.ui-stat')).paddingTop
        }
      })
    }

    for (const scheme of ['light', 'dark']) {
      const theme = `lumen-${scheme}`
      const plain = await read(base, theme, '')

      assert.equal(plain.filter, 'none')

      assert.equal(plain.brand, scheme === 'light' ? '201 96% 32%' : '199 91% 56%')

      assert.deepEqual(await read(base, theme, 'studio'), plain)

      const solidStudio = await read(base + studio, theme, 'studio')

      assert.equal(solidStudio.brand, scheme === 'light' ? '0 0% 9%' : '0 0% 96%')

      assert.equal(solidStudio.filter, 'none')

      assert.equal(solidStudio.nestedBrand, '201 96% 32%')

      const brandTheme = `santi020k-${scheme}`
      const brandOnly = await read(base + branded, brandTheme, '')

      assert.equal(brandOnly.brand, scheme === 'light' ? '264 92% 47%' : '264 90% 70%')

      assert.equal(brandOnly.filter, 'none')

      for (const [activeTheme, preset, extra] of [
        [theme, '', ''], [theme, 'studio', studio], [theme, 'glass', ''], [brandTheme, '', branded]
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

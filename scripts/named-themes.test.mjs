import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { resolveNamedThemes } from './lib/named-themes.mjs'
import { readSanti020kSiteColors } from './lib/santi020k-site-colors.mjs'

const source = JSON.parse(await readFile(new URL('../tokens/lumen.tokens.json', import.meta.url), 'utf8'))
const site = await readSanti020kSiteColors()
const themes = resolveNamedThemes(source, site)

const luminance = hex => {
  const channels = [1, 3, 5].map(start => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

for (const [name, theme] of Object.entries(themes)) {
  for (const scheme of ['light', 'dark']) {
    test(`${name} ${scheme} has legible text and filled actions after native color quantization`, () => {
      const palette = { ...theme[scheme], onSuccess: theme.onSuccess?.[scheme] ?? theme[scheme].onBrand }

      const pairs = [
        ['ink', 'canvas'], ['ink', 'surface'], ['ink', 'surfaceMuted'], ['inkSoft', 'surface'],
        ['inkMuted', 'surface'], ['onBrand', 'brandSolid'], ['onDanger', 'danger'], ['onSuccess', 'success'],
        theme.inkActions ? ['surface', 'ink'] : ['onBrand', 'brandSolid']
      ]

      for (const tone of ['success', 'warning', 'danger']) {
        const foreground = theme.statusText?.[scheme] ?? palette[tone]
        const status = luminance(foreground)
        const background = luminance(palette.surface)

        assert.ok((Math.max(status, background) + 0.05) / (Math.min(status, background) + 0.05) >= 4.5, `${name}.${scheme} ${tone} text on surface`)
      }

      assert.equal(Object.keys(theme[scheme]).length, 17)

      for (const [foreground, background] of pairs) {
        const values = [luminance(palette[foreground]), luminance(palette[background])]
        const ratio = (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05)

        assert.ok(ratio >= 4.5, `${name}.${scheme} ${foreground}/${background} has ${ratio}:1 contrast`)
      }
    })
  }
}

test('requires complete, resolved colors and finite radii in a shared reading theme', () => {
  for (const invalid of [undefined, ['0 0% 100%'], 'var(--ink)', '361 80% 50%', '40 500% 50%', '0 0% 200%']) {
    const changed = structuredClone(source)

    changed.$extensions['com.santi020k.lumen'].readingThemes.paper.light.ink = invalid

    assert.throws(() => resolveNamedThemes(changed, site), /paper.light.ink/u)
  }

  const changed = structuredClone(source)
  const readings = changed.$extensions['com.santi020k.lumen'].readingThemes

  readings.field.radii.md = -1

  assert.throws(() => resolveNamedThemes(changed, site), /Invalid field appearance/u)

  readings.unregistered = readings.field

  assert.throws(() => resolveNamedThemes(changed, site), /Unknown reading theme/u)
})

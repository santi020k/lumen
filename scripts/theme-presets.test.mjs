import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { readCssNodes } from './lib/css-source.mjs'
import { generatePresetCss, readThemePresets } from './lib/theme-presets.mjs'

const source = JSON.parse(await readFile(new URL('../tokens/lumen.tokens.json', import.meta.url), 'utf8'))

test('preset dimensions follow canonical radius and spacing tokens', () => {
  const changed = structuredClone(source)

  changed.radius.md.$value.value = 20

  changed.space.lg.$value.value = 32

  const css = generatePresetCss(changed, readThemePresets(changed))

  assert.match(css, /--ui-radius: 0\.75rem;/u)

  assert.match(css, /--ui-space-lg: 2rem;/u)

  assert.match(css, /data-lumen-scheme="light"/u)

  assert.match(css, /data-lumen-scheme="dark"/u)
})

test('rejects incomplete presets, invalid appearance values and unknown color roles', () => {
  const missing = structuredClone(source)

  delete missing.$extensions['com.santi020k.lumen'].themePresets.glass

  assert.throws(() => readThemePresets(missing), /define default, studio and glass/u)

  for (const value of [-1, Infinity, '1']) {
    const changed = structuredClone(source)

    changed.$extensions['com.santi020k.lumen'].themePresets.studio.radiusScale = value

    assert.throws(() => readThemePresets(changed), /Invalid theme preset/u)
  }

  const invalid = structuredClone(source)

  invalid.$extensions['com.santi020k.lumen'].themePresets.studio.colors.light.missing = { hex: '#000000', css: '0 0% 0%' }

  assert.throws(() => readThemePresets(invalid), /Invalid studio.light.missing/u)
})

test('private color mappings survive a different dark palette property order', () => {
  const changed = structuredClone(source)

  changed.color.dark = Object.fromEntries(Object.entries(changed.color.dark).reverse())

  const css = generatePresetCss(changed, readThemePresets(changed))
  const rules = readCssNodes(readCssNodes(css)[0].body)
  const mapping = rules.find(rule => rule.header === '[data-lumen-preset="default"]')
  const dark = rules.find(rule => rule.header.includes(':is([data-theme="dark"]'))

  for (const role of ['canvas', 'ink', 'brand', 'danger']) {
    const variable = new RegExp(`--${role}: var\\(([^)]+)\\)`, 'u').exec(mapping.body)?.[1]

    assert.ok(variable)

    assert.ok(dark.body.includes(`${variable}: ${changed.color.dark[role].$extensions['com.santi020k.lumen'].cssValue};`))
  }
})

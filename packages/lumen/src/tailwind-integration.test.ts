import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compile } from 'tailwindcss'
import { describe, expect, test } from 'vitest'

import { createLumenSetup } from './integration-diagnostics.js'

const root = fileURLToPath(new URL('../../', import.meta.url))
const colors = [
  'canvas',
  'surface',
  'surface-muted',
  'surface-strong',
  'line',
  'ink',
  'ink-soft',
  'ink-muted',
  'brand',
  'brand-solid',
  'brand-soft',
  'on-brand',
  'accent',
  'success',
  'warning',
  'danger',
  'on-danger'
]

const compileStyles = (css: string, base: string) => compile(css, {
  base,
  loadStylesheet: async (id, from) => {
    const path = createRequire(`${from}/package.json`).resolve(id === 'tailwindcss' ? 'tailwindcss/index.css' : id)

    return { base: dirname(path), content: await readFile(path, 'utf8'), path }
  }
})

describe('Tailwind complement', () => {
  test.each(['astro', 'react', 'elements'] as const)('compiles the public %s setup with responsive and semantic utilities', async framework => {
    const setup = createLumenSetup(framework, true).split('\n\n')[0] ?? ''
    const compiler = await compileStyles(setup, `${root}/${framework}`)
    const css = compiler.build([
      'hidden',
      'p-8',
      'rounded-none',
      'sm:block',
      'w-1/2',
      'bg-brand/10',
      'border-line',
      'ring-brand',
      ...colors.map(color => `text-${color}`)
    ])

    expect(css).toContain('@layer theme, base, lumen.tokens, lumen.base, components, lumen.components, lumen.glass, utilities;')
    expect(css).toContain('.ui-button')
    expect(css).toContain('.hidden')
    expect(css).toContain('display: none')
    expect(css).toContain('width: calc(1 / 2 * 100%)')
    expect(css).toContain('border-radius: 0')
    expect(css).toContain('padding: calc(var(--spacing) * 8)')
    expect(css).toContain('@media (width >= 40rem)')
    expect(css).toContain('hsl(var(--brand)) 10%, transparent)')
    expect(css).toContain('border-color: hsl(var(--line))')

    for (const color of colors) {
      expect(css).toContain(`color: hsl(var(--${color}))`)
      expect(css).not.toContain(`color: var(--color-${color})`)
    }
  })

  test('supports a consumer that omits Preflight', async () => {
    const compiler = await compileStyles(`
      @import "@santi020k/lumen/layers.css";
      @import "tailwindcss/theme.css" layer(theme);
      @import "tailwindcss/utilities.css" layer(utilities);
      @import "@santi020k/lumen/styles.css";
      @import "@santi020k/lumen/tailwind.css";
    `, `${root}/lumen`)
    const css = compiler.build(['bg-surface', 'text-on-brand', 'p-8'])

    expect(css).toContain('background-color: hsl(var(--surface))')
    expect(css).toContain('color: hsl(var(--on-brand))')
    expect(css).toContain('.ui-card')
    expect(css.includes('@layer base {')).toBe(false)
  })

  test('does not add Tailwind processing to standalone consumer setup', async () => {
    for (const framework of ['astro', 'react', 'elements'] as const) {
      expect(createLumenSetup(framework)).not.toContain('tailwind')
    }

    const standalone = await readFile(new URL('../styles.css', import.meta.url), 'utf8')

    expect(standalone).not.toContain('@theme')
    expect(standalone).not.toContain('tailwind.css')
  })

  test('the umbrella bridge is theme-only and does not generate unused colors', async () => {
    const compiler = await compileStyles(`
      @import "@santi020k/lumen/tailwind.css";
      @tailwind utilities;
    `, `${root}/lumen`)
    const css = compiler.build(['text-ink'])

    expect(css).toContain('color: hsl(var(--ink))')
    expect(css).not.toContain('.ui-button')
    expect(css.includes('@layer base {')).toBe(false)
    expect(css).not.toContain('.text-danger')
  })
})

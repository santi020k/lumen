import { readFile } from 'node:fs/promises'

import { compile } from 'tailwindcss'
import { describe, expect, test } from 'vitest'

describe('Tailwind migration layer fixture', () => {
  test('keeps common consumer utilities in the final utilities layer', async () => {
    const prelude = await readFile(new URL('../layers.css', import.meta.url), 'utf8')
    const compiler = await compile(`
      ${prelude}
      @theme {
        --spacing: 0.25rem;
        --breakpoint-sm: 40rem;
      }
      @layer utilities {
        @tailwind utilities;
      }
    `)
    const css = compiler.build(['hidden', 'p-8', 'rounded-none', 'sm:block', 'w-1/2'])

    expect(css).toContain('@layer theme, base, lumen.tokens, lumen.base, components, lumen.components, lumen.glass, utilities;')
    expect(css).toContain('.hidden')
    expect(css).toContain('display: none')
    expect(css).toContain('.w-1\\/2')
    expect(css).toContain('width: calc(1 / 2 * 100%)')
    expect(css).toContain('.rounded-none')
    expect(css).toContain('border-radius: 0')
    expect(css).toContain('.p-8')
    expect(css).toContain('padding: calc(var(--spacing) * 8)')
    expect(css).toContain('.sm\\:block')
    expect(css).toContain('@media (width >= 40rem)')
  })
})

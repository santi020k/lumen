import { readFile } from 'node:fs/promises'

import { lumenComponentNames } from '@santi020k/lumen-core'

import { describe, expect, test } from 'vitest'

const packageRoot = new URL('.', import.meta.url)

describe('@santi020k/lumen-astro package surface', () => {
  test('ships one Astro component file per shared component name', async () => {
    await expect(Promise.all(
      lumenComponentNames.map(componentName =>
        readFile(new URL(`./components/${componentName}.astro`, packageRoot), 'utf8')
      )
    )).resolves.toHaveLength(lumenComponentNames.length)
  })

  test('keeps runtime exports mirrored in TypeScript declarations', async () => {
    const [runtime, declarations] = await Promise.all([
      readFile(new URL('./index.ts', packageRoot), 'utf8'),
      readFile(new URL('./index.d.ts', packageRoot), 'utf8')
    ])

    expect(declarations).toBe(runtime)
  })

  test('documents every component export from the package index', async () => {
    const index = await readFile(new URL('./index.ts', packageRoot), 'utf8')

    for (const componentName of lumenComponentNames) {
      expect(index).toContain(`export { default as ${componentName} }`)
      expect(index).toContain(`./components/${componentName}.astro`)
    }
  })

  test('uses the public runtime and CSS files referenced by package exports', async () => {
    const packageJson = JSON.parse(await readFile(new URL('./package.json', packageRoot), 'utf8')) as {
      exports: Record<string, string | { import?: string }>
    }

    expect(packageJson.exports['./runtime']).toBe('./runtime/UIPrimitives.astro')
    expect(packageJson.exports['./styles.css']).toBe('./styles/lumen.css')

    await expect(readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8')).resolves.toContain('<script>')
    await expect(readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')).resolves.toContain('.ui-button')
  })

  test('ships glass styles for overlay and structural surfaces', async () => {
    const css = await readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')

    expect(css).toContain('.ui-dialog--glass')
    expect(css).toContain('.ui-alert--glass')
    expect(css).toContain('.ui-table-wrap--glass')
    expect(css).toContain('@supports not ((backdrop-filter: blur(1px))')
  })

  test('ships the code primitive markup and standalone styles', async () => {
    const [component, styles] = await Promise.all([
      readFile(new URL('./components/Code.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(component).toContain('code?: string')
    expect(component).toContain('renderLumenCodeHtml')
    expect(component).toContain("variant = 'inline'")
    expect(component).toContain('data-ui-code-copy')
    expect(component).toContain('Copy code to clipboard')
    expect(styles).toContain('.ui-code--inline')
    expect(styles).toContain('.ui-code--block')
    expect(styles).toContain('.ui-code__copy')
  })

  test('ships Select as a progressively enhanced listbox distinct from NativeSelect', async () => {
    const [select, nativeSelect, runtime, styles] = await Promise.all([
      readFile(new URL('./components/Select.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/NativeSelect.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8'),
      readFile(new URL('./styles/lumen.css', packageRoot), 'utf8')
    ])

    expect(nativeSelect).toContain('<select class:list')
    expect(nativeSelect).not.toContain('data-ui-select-trigger')
    expect(select).toContain('data-ui-select-native')
    expect(select).toContain('data-ui-select-trigger')
    expect(select).toContain('role="listbox"')
    expect(select).toContain('data-ui-select-option')
    expect(runtime).toContain('const initSelects = (scope: ParentNode): void =>')
    expect(runtime).toContain("select.dispatchEvent(new Event('change', { bubbles: true }))")
    expect(styles).toContain('.ui-select__list')
  })

  test('keeps accessibility and sanitization guards in component sources', async () => {
    const [aspectRatio, avatar, field, runtime] = await Promise.all([
      readFile(new URL('./components/AspectRatio.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/Avatar.astro', packageRoot), 'utf8'),
      readFile(new URL('./components/Field.astro', packageRoot), 'utf8'),
      readFile(new URL('./runtime/UIPrimitives.astro', packageRoot), 'utf8')
    ])

    expect(aspectRatio).toContain('ratio?: number | string')
    expect(aspectRatio).toContain('Number.isFinite(ratio)')
    expect(avatar).toContain('fallback && <span>{fallback}</span>')
    expect(field).toContain(`data-ui-field-${'described' + 'by'}={fieldDescribedBy}`)
    expect(runtime).toContain(`control.setAttribute('aria-${'described' + 'by'}'`)
  })
})

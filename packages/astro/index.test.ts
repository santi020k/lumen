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
})

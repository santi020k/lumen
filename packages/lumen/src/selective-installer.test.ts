import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { componentDeliveryEntries, getComponentEntry } from './component-delivery.js'
import { getDeliveryVersion } from './delivery-version.js'
import { addLumenRegistryItem } from './installer.js'
import { inspectLumenIntegration } from './integration-diagnostics.js'

describe('selective component installation', () => {
  test.each(['elements', 'react'] as const)('uses only real %s public export paths', async target => {
    const manifest: unknown = JSON.parse(await readFile(new URL(`../../${target}/package.json`, import.meta.url), 'utf8'))
    for (const [name, entry] of Object.entries(componentDeliveryEntries[target])) {
      expect(manifest).toHaveProperty(['exports', './components/' + entry])
      expect(getComponentEntry(name, target)).toBe(`@santi020k/lumen-${target}/components/${entry}`)
    }
  })

  test('installs auto-styled Astro and selectively styled React/Elements wrappers', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-selective-install-'))
    try {
      for (const target of ['astro', 'react', 'elements'] as const) {
        await addLumenRegistryItem('Button', { cwd: root, target })
        const extension = { astro: 'astro', react: 'tsx', elements: 'ts' }[target]
        const source = await readFile(join(root, `src/lumen/button.${extension}`), 'utf8')
        expect(source).toContain(`@santi020k/lumen-${target}/components/`)
        expect(source.includes('/styles/foundation.css')).toBe(target !== 'astro')
        expect(source.includes('/styles/components/button.css')).toBe(target !== 'astro')
        expect(source).not.toContain('defineLumenElements')
        expect(source).not.toContain('Catalog fallback')
      }
      const source = await readFile(join(root, 'src/lumen/button.ts'), 'utf8')
      expect(source).toContain('!customElements.get(\'lumen-button\')')
      expect(source).toContain('customElements.define(\'lumen-button\', LumenButtonElement)')
      const result = await addLumenRegistryItem('Button', { cwd: root, target: 'elements' })
      expect(result.skipped).toEqual(['src/lumen/button.ts'])
      await addLumenRegistryItem('Alert', { cwd: root, target: 'elements' })
      expect(await readFile(join(root, 'src/lumen/alert.ts'), 'utf8')).toContain('Catalog fallback')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('v5 setup evidence', () => {
  test.each([
    ['^5.0.0', 'v5'], ['^4.4.0', 'legacy'], ['workspace:*', 'unknown'], ['>=4', 'unknown'], ['^6.0.0', 'unknown']
  ])('classifies declared %s conservatively', async (version, expected) => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-delivery-version-'))
    try {
      await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { '@santi020k/lumen-astro': version } }))
      expect(await getDeliveryVersion(root, '@santi020k/lumen-astro')).toBe(expected)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test('installed version overrides a declared target', async () => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-delivery-installed-'))
    try {
      const adapter = '@santi020k/lumen-astro'
      await mkdir(join(root, 'node_modules', adapter), { recursive: true })
      await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { [adapter]: '^5.0.0' } }))
      await writeFile(join(root, 'node_modules', adapter, 'package.json'), JSON.stringify({ name: adapter, version: '4.4.0' }))
      expect(await getDeliveryVersion(root, adapter)).toBe('legacy')
      await writeFile(join(root, 'node_modules', adapter, 'package.json'), '{broken')
      expect(await getDeliveryVersion(root, adapter)).toBe('unknown')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test.each(['astro', 'react', 'elements'] as const)('accepts verified v5 %s CSS and rejects missing setup', async framework => {
    const root = await mkdtemp(join(tmpdir(), 'lumen-doctor-selective-'))
    try {
      const adapter = `@santi020k/lumen-${framework}`
      await mkdir(join(root, 'src'), { recursive: true })
      await writeFile(join(root, 'package.json'), JSON.stringify({ private: true, dependencies: { [adapter]: '^5.0.0' } }))
      const source = framework === 'astro' ?
        `---\nimport Card from '${adapter}/components/Card.astro'\n---\n<Card />` :
        `import { ${framework === 'elements' ? 'LumenButtonElement' : 'Button'} } from '${adapter}/components/button'\n`
      await writeFile(join(root, 'src', framework === 'astro' ? 'page.astro' : 'page.ts'), source)
      const before = await inspectLumenIntegration(root)
      expect(before.findings.some(item => item.rule === 'framework-style-missing')).toBe(framework !== 'astro')
      if (framework !== 'astro') {
        await writeFile(join(root, 'src', 'global.css'), `@import "${adapter}/styles/foundation.css";\n@import "${adapter}/styles/components/button.css";`)
      }
      expect((await inspectLumenIntegration(root)).findings).not.toContainEqual(expect.objectContaining({ rule: 'framework-style-missing' }))
      await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { [adapter]: '^4.4.0' } }))
      expect((await inspectLumenIntegration(root)).findings).toContainEqual(expect.objectContaining({ rule: 'framework-style-missing' }))
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

test('selective Astro imports retain interactive runtime diagnostics', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-runtime-selective-'))
  try {
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { '@santi020k/lumen-astro': '^5.0.0' } }))
    const component = 'import Dialog from \'@santi020k/lumen-astro/components/Dialog.astro\'\n'
    await writeFile(join(root, 'src/page.astro'), '---\n' + component + '---\n<Dialog />')
    expect((await inspectLumenIntegration(root)).findings).toContainEqual(expect.objectContaining({ rule: 'astro-runtime-missing' }))
    await writeFile(join(root, 'src/page.astro'), '---\n' + component +
    'import Runtime from \'@santi020k/lumen-astro/runtime\'\n---\n<Runtime /><Dialog />')
    expect((await inspectLumenIntegration(root)).healthy).toBe(true)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

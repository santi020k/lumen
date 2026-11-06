import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build as buildAstro } from 'astro'
import { build } from 'vite'
import { expect, test } from 'vitest'

import { loadBuildReport } from './build-report.js'
import { lumenBuildReport } from './build-report-plugin.js'
import { parseRenderedAuditArguments } from './rendered-audit-options.js'

test('attributes emitted CSS to the full Lumen stylesheet through its application importer', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-css-report-'))
  try {
    const dependency = join(root, 'node_modules/@santi020k/lumen-react')
    await mkdir(dependency, { recursive: true })
    await writeFile(join(dependency, 'package.json'), JSON.stringify({ name: '@santi020k/lumen-react', exports: { './styles.css': './styles.css' } }))
    await writeFile(join(dependency, 'styles.css'), '.ui-button { color: red }')
    await writeFile(join(root, 'index.html'), '<script type="module" src="/entry.js"></script>')
    await writeFile(join(root, 'entry.js'), 'import \'@santi020k/lumen-react/styles.css\'')
    await build({ root, configFile: false, logLevel: 'silent', plugins: [lumenBuildReport()] })
    const options = parseRenderedAuditArguments(['http://localhost:4321/', '--build-report', '.cache/lumen/build-report.json'], root)
    const report = await loadBuildReport(options)
    const css = [...(report?.entries() ?? [])].find(([path]) => path.endsWith('.css'))
    expect(css).toBeDefined()
    expect(css?.[1]).toContainEqual(['./index.html', './entry.js', '@santi020k/lumen-react/styles.css'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('keeps PostCSS import provenance and existing application transforms', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-css-import-report-'))
  try {
    const dependency = join(root, 'node_modules/@santi020k/lumen-react')
    await mkdir(dependency, { recursive: true })
    await writeFile(join(dependency, 'package.json'), JSON.stringify({ name: '@santi020k/lumen-react', exports: { './styles.css': './styles.css' } }))
    await writeFile(join(dependency, 'styles.css'), '.ui-button { color: red }')
    await writeFile(join(root, 'index.html'), '<script type="module" src="/entry.js"></script>')
    await writeFile(join(root, 'entry.js'), 'import \'./global.css\'')
    await writeFile(join(root, 'global.css'), '@import "@santi020k/lumen-react/styles.css";')
    const reportPlugin = lumenBuildReport()
    let transformed = false
    await build({ root,
      configFile: false,
      logLevel: 'silent',
      plugins: [reportPlugin],
      css: { postcss: { plugins: [
        { postcssPlugin: 'application-transform',
          Once() {
            transformed = true
          } }, reportPlugin.api.postcss
      ] } } })
    expect(transformed).toBe(true)
    const report = await loadBuildReport(parseRenderedAuditArguments(['http://localhost:4321/', '--build-report', '.cache/lumen/build-report.json'], root))
    expect([...(report?.values() ?? [])].flat()).toContainEqual(['./index.html', './entry.js', './global.css', '@santi020k/lumen-react/styles.css'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('attributes server-emitted Astro CSS without a client script', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lumen-astro-css-report-'))
  try {
    const dependency = join(root, 'node_modules/@santi020k/lumen-astro')
    await mkdir(join(dependency, 'styles'), { recursive: true })
    await symlink(await realpath(fileURLToPath(new URL('../node_modules/astro', import.meta.url))), join(root, 'node_modules/astro'))
    await writeFile(join(dependency, 'package.json'), JSON.stringify({ name: '@santi020k/lumen-astro', exports: { './styles.css': './styles/lumen.css' } }))
    await writeFile(join(dependency, 'styles/lumen.css'), '.ui-button { color: red }')
    await mkdir(join(root, 'src/pages'), { recursive: true })
    await writeFile(join(root, 'src/pages/index.astro'), '---\nimport "../global.css"\n---\n<html lang="en"><head><title>CSS report</title></head><body>Server page</body></html>')
    await writeFile(join(root, 'src/global.css'), '@import "@santi020k/lumen-astro/styles.css";')
    const reportPlugin = lumenBuildReport()
    await buildAstro({ root,
      configFile: false,
      logLevel: 'silent',
      vite: {
        plugins: [reportPlugin], css: { postcss: { plugins: [reportPlugin.api.postcss] } }
      } })
    const report = await loadBuildReport(parseRenderedAuditArguments(['http://localhost:4321/', '--build-report', '.cache/lumen/build-report.json'], root))
    const entries = [...(report?.entries() ?? [])]
    expect(entries.length).toBeGreaterThan(0)
    expect(entries.every(([path]) => path.endsWith('.css'))).toBe(true)
    expect(entries.flatMap(([, chains]) => chains)).toContainEqual(['./src/pages/index.astro', './src/global.css', '@santi020k/lumen-astro/styles/lumen.css'])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}, 90_000)

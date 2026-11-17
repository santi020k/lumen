import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { build } from 'esbuild'

const typecheck = async consumer => {
  await writeFile(join(consumer, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx', strict: true, noEmit: true, allowJs: true, checkJs: true, skipLibCheck: true, types: [], lib: ['ES2022', 'DOM'] },
    include: ['*.tsx', '*.js', '*.d.ts']
  }))

  await writeFile(join(consumer, 'styles.d.ts'), 'declare module "*.css" {}\n')

  const tsc = spawnSync(process.execPath, [join(consumer, 'node_modules/typescript/bin/tsc'), '-p', consumer], { cwd: consumer, stdio: 'inherit' })

  if (tsc.error) throw tsc.error

  if (tsc.status !== 0) throw new Error(`Generated consumer failed strict typechecking in ${consumer}.`)
}

const manifests = {
  react: { current: import.meta.resolve('@santi020k/lumen-react/package.json'), baseline: import.meta.resolve('lumen-react-v5/package.json'), legacy: import.meta.resolve('lumen-react-v4/package.json') },
  elements: { current: import.meta.resolve('@santi020k/lumen-elements/package.json'), baseline: import.meta.resolve('lumen-elements-v5/package.json'), legacy: import.meta.resolve('lumen-elements-v4/package.json') }
}

const verifiedAdapter = async (platform, pkg, source, expected) => {
  const adapter = dirname(fileURLToPath(manifests[platform][source]))
  const installed = JSON.parse(await readFile(join(adapter, 'package.json'), 'utf8'))

  assert.equal(installed.name, pkg, 'The consumer must resolve the intended adapter package.')

  if (installed.version !== expected) throw new Error(`Expected ${pkg}@${expected}, found ${installed.version}`)

  return adapter
}

// Export targets stay pinned to published adapters even when the workspace advances.
// The workspace gets a separate consumer so candidate compatibility remains covered.
export const webConsumerAdapters = async (platform, version) => {
  const pkg = `@santi020k/lumen-${platform}`
  const legacy = version === '4.4.0'
  const expected = legacy ? '4.3.0' : '5.0.0'
  const baseline = await verifiedAdapter(platform, pkg, legacy ? 'legacy' : 'baseline', expected)
  const adapters = [{ adapter: baseline, version: expected, scope: 'baseline' }]

  if (!legacy) {
    const workspace = JSON.parse(await readFile(new URL(`../../../packages/${platform}/package.json`, import.meta.url), 'utf8'))
    const candidate = await verifiedAdapter(platform, pkg, 'current', workspace.version)

    adapters.push({ adapter: candidate, version: workspace.version, scope: 'workspace' })
  }

  return adapters
}

const checkStaticExport = async (compiled, result, react, out) => {
  const catalog = Object.keys(compiled.metafile.inputs)
    .filter(path => /(?:lumen-|packages\/)(?:react|elements)\/dist\/(?:index|define)\.js$/u.test(path))

  assert.deepEqual(catalog, [], 'Static exports must avoid the adapter catalog.')

  if (react) assert(!result.code.includes('use client'), 'Static React exports must remain server-compatible.')
  else {
    const bytes = gzipSync(await readFile(join(out, 'app.js')), { level: 9 }).length

    assert(bytes < 12_000, `Static Elements export exceeds its JavaScript budget: ${bytes} gzip bytes.`)

    console.log(`Static Elements export: ${bytes} gzip JavaScript bytes.`)
  }
}

const verifyWebConsumer = async ({
  version, root, fixture, selection, analyzeSelection, linkDependency, scenario,
  platform, adapter, installedVersion, scope
}) => {
  const legacy = version === '4.4.0'
  const pkg = `@santi020k/lumen-${platform}`
  const segments = scope === 'workspace' ? ['workspace', platform, scenario] : [platform, scenario]
  const consumer = join(fixture, 'consumers', ...segments)
  const modules = join(consumer, 'node_modules')
  const out = join(fixture, 'dist', ...segments)

  await mkdir(out, { recursive: true })

  await linkDependency(modules, pkg, adapter)

  for (const name of ['react', 'react-dom', '@types/react', '@types/react-dom', 'typescript']) {
    await linkDependency(modules, name, join(root, 'node_modules', name))
  }

  const result = analyzeSelection(selection, { platform, version, appearance: legacy ? 'santi020k-dark' : 'paper' })
  const react = platform === 'react'

  await writeFile(join(consumer, 'lumen-setup.js'), result.layout)

  await writeFile(join(consumer, react ? 'LumenSelection.tsx' : 'LumenSelection.html'), result.code)

  const entry = react ? 'main.tsx' : 'lumen-setup.js'

  if (react) {
    await writeFile(join(consumer, entry), `import './lumen-setup.js'
import { createRoot } from 'react-dom/client'
import LumenSelection from './LumenSelection'
const root = document.getElementById('root')
if (!root) throw new Error('Missing React root')
createRoot(root).render(<LumenSelection />)
`)
  }

  await typecheck(consumer)

  const compiled = await build({ absWorkingDir: consumer, entryPoints: [entry], outfile: join(out, 'app.js'), bundle: true, format: 'esm', jsx: 'automatic', minify: scenario === 'static', metafile: true, define: { 'process.env.NODE_ENV': '"production"' } })

  if (scenario === 'static') await checkStaticExport(compiled, result, react, out)

  await writeFile(join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lumen ${platform} consumer</title><link rel="stylesheet" href="./app.css"></head><body><main>${react ? '<div id="root"></div>' : result.code}</main><script type="module" src="./app.js"></script></body></html>`)

  console.log(`Built and typechecked generated ${pkg}@${installedVersion} ${scope} consumer for Lumen ${version}.`)
}

export const verifyWebConsumers = async options => {
  for (const platform of ['react', 'elements']) {
    for (const { adapter, version: installedVersion, scope } of await webConsumerAdapters(platform, options.version)) {
      await verifyWebConsumer({ ...options, platform, adapter, installedVersion, scope })
    }
  }
}

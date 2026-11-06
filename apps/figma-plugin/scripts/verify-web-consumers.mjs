import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  react: { current: import.meta.resolve('@santi020k/lumen-react/package.json'), legacy: import.meta.resolve('lumen-react-v4/package.json') },
  elements: { current: import.meta.resolve('@santi020k/lumen-elements/package.json'), legacy: import.meta.resolve('lumen-elements-v4/package.json') }
}

const verifiedAdapter = async (platform, pkg, legacy, expected) => {
  const adapter = dirname(fileURLToPath(manifests[platform][legacy ? 'legacy' : 'current']))
  const installed = JSON.parse(await readFile(join(adapter, 'package.json'), 'utf8'))

  if (installed.version !== expected) throw new Error(`Expected ${pkg}@${expected}, found ${installed.version}`)

  return adapter
}

export const verifyWebConsumers = async ({ version, root, fixture, selection, analyzeSelection, linkDependency }) => {
  for (const platform of ['react', 'elements']) {
    const legacy = version === '4.4.0'
    const pkg = `@santi020k/lumen-${platform}`
    const expected = legacy ? '4.3.0' : '5.0.0'
    const adapter = await verifiedAdapter(platform, pkg, legacy, expected)
    const consumer = join(fixture, 'consumers', platform)
    const modules = join(consumer, 'node_modules')
    const out = join(fixture, 'dist', platform)

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

    await build({ absWorkingDir: consumer, entryPoints: [entry], outfile: join(out, 'app.js'), bundle: true, format: 'esm', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' } })

    await writeFile(join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lumen ${platform} consumer</title><link rel="stylesheet" href="./app.css"></head><body><main>${react ? '<div id="root"></div>' : result.code}</main><script type="module" src="./app.js"></script></body></html>`)

    console.log(`Built and typechecked generated ${pkg}@${expected} consumer for Lumen ${version}.`)
  }
}

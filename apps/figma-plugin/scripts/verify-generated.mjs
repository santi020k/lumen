import { spawnSync } from 'node:child_process'
import { mkdir, readFile, realpath, symlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { build } from 'esbuild'

import { verifyWebConsumers } from './verify-web-consumers.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const verification = join(root, '.verification')
const docsModules = fileURLToPath(new URL('../../docs/node_modules/', import.meta.url))

await mkdir(verification, { recursive: true })

const generator = join(verification, 'generator.mjs')

await build({
  absWorkingDir: root,
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: generator,
  stdin: {
    contents: `export { analyzeSelection } from './src/convert.ts'
export { settingsFixture, editorialFixture, componentNode, designNode } from './src/fixtures.ts'
export { versions } from './src/targets.ts'`,
    resolveDir: root
  }
})

const generatedModule = await import(pathToFileURL(generator).href)
const { analyzeSelection, settingsFixture, editorialFixture, componentNode, designNode, versions } = generatedModule

const linkDependency = async (modules, name, source) => {
  const destination = join(modules, name)

  await mkdir(dirname(destination), { recursive: true })

  try {
    await symlink(source, destination, 'dir')
  } catch (error) {
    if (error.code !== 'EEXIST' || await realpath(destination) !== await realpath(source)) throw error
  }
}

for (const version of versions) {
  const legacy = version === '4.4.0'
  const fixture = join(verification, version)
  const modules = join(fixture, 'node_modules')
  const manifest = legacy ? import.meta.resolve('lumen-astro-v4/package.json') : import.meta.resolve('@santi020k/lumen-astro/package.json')
  const adapter = dirname(fileURLToPath(manifest))
  const installed = JSON.parse(await readFile(join(adapter, 'package.json'), 'utf8'))

  if (installed.version !== version) throw new Error(`Expected Astro adapter ${version}, found ${installed.version}.`)

  for (const name of ['astro', 'typescript', '@astrojs/check']) {
    await linkDependency(modules, name, join(docsModules, name))
  }

  await linkDependency(modules, '@santi020k/lumen-astro', adapter)

  await mkdir(join(fixture, 'src/pages'), { recursive: true })

  const target = { version, appearance: legacy ? 'studio' : 'paper' }
  const settings = analyzeSelection(settingsFixture, target)
  const editorial = analyzeSelection(editorialFixture, target)

  await writeFile(join(fixture, 'src/Selection.astro'), settings.code)

  await writeFile(join(fixture, 'src/Editorial.astro'), editorial.code)

  await writeFile(join(fixture, 'src/Layout.astro'), settings.layout)

  await writeFile(join(fixture, 'package.json'), '{"name":"lumen-figma-verification","private":true,"type":"module"}\n')

  await writeFile(join(fixture, 'tsconfig.json'), '{"extends":"astro/tsconfigs/strictest","include":[".astro/types.d.ts","src/**/*"],"exclude":["dist"]}\n')

  await writeFile(join(fixture, 'src/pages/index.astro'), `---
import Selection from '../Selection.astro'
import Editorial from '../Editorial.astro'
import Layout from '../Layout.astro'
---
<Layout title="Generated Lumen settings pilot"><main><h1>Generated settings pilot</h1><Selection /><Editorial /></main></Layout>
<style>main { max-width: 52rem; margin: auto; padding: 1.5rem; }</style>
`)

  const astro = JSON.parse(await readFile(join(modules, 'astro/package.json'), 'utf8'))

  for (const command of ['check', 'build']) {
    const result = spawnSync(process.execPath, [join(modules, 'astro', astro.bin.astro), command], { cwd: fixture, stdio: 'inherit' })

    if (result.error) throw result.error

    if (result.status !== 0) process.exit(result.status ?? 1)
  }

  await verifyWebConsumers({ version,
    root,
    fixture,
    analyzeSelection,
    linkDependency,
    selection: { ...settingsFixture,
      children: [...settingsFixture.children,
        editorialFixture,
        componentNode('Code', { Variant: 'Block', Wrap: 'Off' }, [
          designNode({ type: 'TEXT', name: 'Line', text: '</code><script>throw Error("injected")</script>' }),
          designNode({ type: 'TEXT', name: 'Line', text: '{expression} & "quoted"' })
        ]),
        componentNode('Input', { Size: 'Sm', Placeholder: '" autofocus onfocus="throw Error(1)' })
      ] } })
}

import { execFileSync } from 'node:child_process'
import { copyFile, cp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build, createServer } from 'vite'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const consumer = join(root, '.cache/portable-editorial-consumer')
const tarballs = join(consumer, 'tarballs')

await rm(consumer, { recursive: true, force: true })

await mkdir(tarballs, { recursive: true })

await mkdir(join(consumer, 'src'), { recursive: true })

await mkdir(join(consumer, 'public'), { recursive: true })

await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }))

const linkDependency = async (name, source) => {
  const target = join(consumer, 'node_modules', name)

  await mkdir(join(target, '..'), { recursive: true })

  await symlink(source, target, 'dir')
}

for (const name of ['core', 'react', 'elements', 'lumen']) {
  const packageRoot = join(root, 'packages', name)
  const metadata = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))

  execFileSync('pnpm', ['--filter', metadata.name, 'pack', '--pack-destination', tarballs], { cwd: root, stdio: 'pipe' })

  const tarball = join(tarballs, `${metadata.name.replace('@', '').replace('/', '-')}-${metadata.version}.tgz`)
  const destination = join(consumer, 'node_modules', metadata.name)

  await mkdir(destination, { recursive: true })

  execFileSync('tar', ['-xzf', tarball, '--strip-components=1', '-C', destination])
}

for (const name of ['react', 'react-dom', 'typescript', 'semver']) {
  const owner = name === 'semver' || name === 'typescript' ? 'lumen' : 'react'

  await linkDependency(name, join(root, 'packages', owner, 'node_modules', name))
}

await linkDependency('@types/react', join(root, 'packages/react/node_modules/@types/react'))

await linkDependency('@types/react-dom', join(root, 'packages/react/node_modules/@types/react-dom'))

await linkDependency('libphonenumber-js', join(root, 'packages/core/node_modules/libphonenumber-js'))

await linkDependency('@lucide/icons', join(root, 'packages/core/node_modules/@lucide/icons'))

for (const target of ['react', 'elements']) {
  const installed = join(consumer, `${target}-source`)

  for (const recipe of ['article-reading', 'site-search-dialog', 'image-viewer']) {
    execFileSync(process.execPath, [join(consumer, 'node_modules/@santi020k/lumen/bin/lumen.mjs'), 'add', recipe, '--target', target, '--cwd', installed], { cwd: consumer, stdio: 'inherit' })
  }

  await cp(join(installed, 'src/lumen'), join(consumer, 'src', target), { recursive: true })
}

for (const file of ['react-app.tsx', 'react-main.tsx', 'elements-main.ts']) {
  await copyFile(join(root, 'tests/fixtures/portable-editorial', `${file}.template`), join(consumer, 'src', file))
}

await copyFile(join(root, 'tests/fixtures/portable-editorial/fixture.css'), join(consumer, 'src/fixture.css'))

await writeFile(join(consumer, 'src/styles.d.ts'), 'declare module \'*.css\' {}\n')

await writeFile(join(consumer, 'tsconfig.json'), JSON.stringify({
  compilerOptions: {
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    noEmit: true,
    skipLibCheck: false,
    jsx: 'react-jsx',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    target: 'ES2022',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    types: ['react', 'react-dom']
  },
  include: ['src/**/*']
}))

execFileSync(process.execPath, [join(consumer, 'node_modules/typescript/bin/tsc'), '--project', join(consumer, 'tsconfig.json')], { cwd: consumer, stdio: 'inherit' })

await writeFile(join(consumer, 'public/preview.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640"><title>Two connected stages</title><path fill="#fff" d="M0 0h960v640H0z"/><path fill="#123" d="M100 100h240v240H100zM580 300h240v240H580z"/><path stroke="#123" stroke-width="12" d="m340 220 240 200"/></svg>')

const page = (body, script) => `<!doctype html><html lang="en" data-theme="lumen-light"><head><script>if(new URLSearchParams(location.search).get("theme")==="dark")document.documentElement.dataset.theme="lumen-dark"</script><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Portable editorial consumer</title></head><body>${body}<script type="module" src="/src/${script}"></script></body></html>`

process.env.NODE_ENV = 'production'

const server = await createServer({ root: consumer, configFile: false, server: { middlewareMode: true }, appType: 'custom', esbuild: { jsx: 'automatic' } })

try {
  const { App } = await server.ssrLoadModule('/src/react-app.tsx')
  const consumerRequire = createRequire(join(consumer, 'package.json'))
  const { createElement } = await import(consumerRequire.resolve('react'))
  const { renderToString } = await import(consumerRequire.resolve('react-dom/server'))

  await writeFile(join(consumer, 'react.html'), page(`<div id="app">${renderToString(createElement(App))}</div>`, 'react-main.tsx'))
} finally {
  await server.close()
}

const fragments = await Promise.all(['site-search-dialog', 'image-viewer', 'article-reading'].map(name => readFile(join(consumer, 'src/elements', `${name}.html`), 'utf8')))
const article = fragments[2].replace('<p>The consumer supplies article content.</p>', '<div class="chapter">First chapter content.</div>').replace('<p>The consumer supplies article content.</p>', '<div class="chapter">Second chapter content.</div>')
const content = fragments[0] + fragments[1].replaceAll('/illustration.svg', '/preview.svg') + '<div class="outside">Before the article.</div>' + article + '<div class="outside">After the article.</div>'

await writeFile(join(consumer, 'elements.html'), page(`<header><h1>Portable editorial consumer</h1><lumen-button data-remount>Remount recipes</lumen-button><output data-aborts>0</output></header><main>${content}</main><template data-recipe-template>${content}</template><footer><a href="https://santi020k.com">Santiago Molina</a></footer>`, 'elements-main.ts'))

await build({ root: consumer, configFile: false, esbuild: { jsx: 'automatic' }, build: { rollupOptions: { input: { react: join(consumer, 'react.html'), elements: join(consumer, 'elements.html') } } } })

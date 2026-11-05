import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const consumer = new URL('../../../.cache/editorial-consumer/', import.meta.url)
const cwd = fileURLToPath(consumer)

await rm(consumer, { force: true, recursive: true })

await mkdir(new URL('src/pages/', consumer), { recursive: true })

await writeFile(new URL('package.json', consumer), JSON.stringify({ private: true, type: 'module' }))

await writeFile(new URL('tsconfig.json', consumer), JSON.stringify({ extends: 'astro/tsconfigs/strict', include: ['.astro/types.d.ts', 'src/**/*'], exclude: ['dist', 'node_modules'] }))

await writeFile(new URL('astro.config.mjs', consumer), 'export default { output: "static", devToolbar: { enabled: false } }\n')

await symlink(new URL('../../../apps/docs/node_modules/', import.meta.url), new URL('node_modules', consumer), 'dir')

await copyFile(new URL('../../../tests/fixtures/editorial/index.astro.template', import.meta.url), new URL('src/pages/index.astro', consumer))

await copyFile(new URL('../../../tests/fixtures/editorial/reading-controls.astro.template', import.meta.url), new URL('src/pages/reading-controls.astro', consumer))

await copyFile(new URL('../../../apps/docs/src/assets/cover-dummy.jpg', import.meta.url), new URL('src/cover.jpg', consumer))

await mkdir(new URL('src/assets/', consumer), { recursive: true })

await copyFile(new URL('../../../tests/fixtures/editorial/inspection.svg', import.meta.url), new URL('src/assets/inspection.svg', consumer))

await copyFile(new URL('../../../tests/fixtures/editorial/interactive.astro.template', import.meta.url), new URL('src/pages/interactive.astro', consumer))

for (const recipe of ['editorial', 'article-reading', 'site-search-dialog', 'image-viewer']) {
  execFileSync(process.execPath, ['packages/lumen/bin/lumen.mjs', 'add', recipe, '--target', 'astro', '--cwd', cwd], { cwd: root, stdio: 'inherit' })
}

for (const command of ['check', 'build']) {
  execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url)), command], { cwd, stdio: 'inherit' })
}

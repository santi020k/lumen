import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const consumer = new URL('../../../.cache/product-workflow-consumer/', import.meta.url)
const cwd = fileURLToPath(consumer)

await rm(consumer, { force: true, recursive: true })

await mkdir(new URL('src/pages/', consumer), { recursive: true })

await mkdir(new URL('public/', consumer), { recursive: true })

await writeFile(new URL('package.json', consumer), JSON.stringify({ private: true, type: 'module' }))

await writeFile(new URL('tsconfig.json', consumer), JSON.stringify({ extends: 'astro/tsconfigs/strict', include: ['.astro/types.d.ts', 'src/**/*'], exclude: ['dist', 'node_modules'] }))

await writeFile(new URL('astro.config.mjs', consumer), 'export default { output: "static", devToolbar: { enabled: false } }\n')

await symlink(new URL('../../../apps/docs/node_modules/', import.meta.url), new URL('node_modules', consumer), 'dir')

await copyFile(new URL('../../../tests/fixtures/product-workflows/index.astro.template', import.meta.url), new URL('src/pages/index.astro', consumer))

await writeFile(new URL('src/pages/other.astro', consumer), '<h1>Another page</h1>')

await copyFile(new URL('../../../apps/docs/public/launch/prompt-to-verified-ui.mp4', import.meta.url), new URL('public/film.mp4', consumer))

await copyFile(new URL('../../../tests/fixtures/product-workflows/captions.vtt', import.meta.url), new URL('public/captions.vtt', consumer))

for (const recipe of ['editorial', 'code-example', 'share', 'feedback-board', 'responsive-navigation']) {
  execFileSync(process.execPath, ['packages/lumen/bin/lumen.mjs', 'add', recipe, '--target', 'astro', '--cwd', cwd], { cwd: root, stdio: 'inherit' })
}

for (const command of ['check', 'build']) {
  execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url)), command], { cwd, stdio: 'inherit' })
}

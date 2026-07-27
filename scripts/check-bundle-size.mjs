import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const budgets = [
  { file: 'packages/astro/runtime/UIPrimitives.astro', gzip: 30_000, raw: 150_000 },
  { file: 'packages/astro/runtime/controllers/motion.ts', gzip: 1_500, raw: 5_000 },
  { file: 'packages/lumen/styles.css', gzip: 25_000, raw: 150_000 },
  { file: 'packages/react/dist/components.js', gzip: 22_500, raw: 105_000 },
  { file: 'packages/react/dist/hooks.js', gzip: 19_000, raw: 90_000 },
  { file: 'packages/elements/dist/define.js', gzip: 38_000, raw: 215_000 }
]

const formatBytes = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`
const failures = []

for (const budget of budgets) {
  const source = await readFile(new URL(`../${budget.file}`, import.meta.url))
  const raw = source.byteLength
  const gzip = gzipSync(source, { level: 9 }).byteLength

  process.stdout.write(
    `${budget.file}: ${formatBytes(raw)} raw, ${formatBytes(gzip)} gzip\n`
  )

  if (raw > budget.raw) {
    failures.push(`${budget.file} raw size ${formatBytes(raw)} exceeds ${formatBytes(budget.raw)}`)
  }

  if (gzip > budget.gzip) {
    failures.push(`${budget.file} gzip size ${formatBytes(gzip)} exceeds ${formatBytes(budget.gzip)}`)
  }
}

if (failures.length) {
  throw new Error(`Bundle size budget exceeded:\n${failures.join('\n')}`)
}

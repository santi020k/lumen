import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const allBudgets = [
  { file: 'packages/astro/runtime/UIPrimitives.astro', gzip: 33_000, packageName: '@santi020k/lumen-astro', raw: 162_000 },
  { file: 'packages/astro/runtime/controllers/motion.ts', gzip: 1_500, packageName: '@santi020k/lumen-astro', raw: 5_000 },
  { file: 'packages/astro/runtime/controllers/dialogs.ts', gzip: 2_000, packageName: '@santi020k/lumen-astro', raw: 6_000 },
  { file: 'packages/astro/runtime/controllers/document-navigation.ts', gzip: 1_500, packageName: '@santi020k/lumen-astro', raw: 5_000 },
  { file: 'packages/lumen/styles.css', gzip: 28_500, packageName: '@santi020k/lumen', raw: 172_000 },
  { file: 'packages/react/dist/components.js', gzip: 33_100, packageName: '@santi020k/lumen-react', raw: 160_000 },
  { file: 'packages/react/dist/hooks.js', gzip: 20_000, packageName: '@santi020k/lumen-react', raw: 100_000 },
  { file: 'packages/elements/dist/define.js', gzip: 43_000, packageName: '@santi020k/lumen-elements', raw: 250_000 }
]

const requestedPackagesSource = process.env.LUMEN_RELEASE_PACKAGES
const requestedPackages = requestedPackagesSource ? JSON.parse(requestedPackagesSource) : undefined

if (requestedPackages && (!Array.isArray(requestedPackages) || requestedPackages.some(name => typeof name !== 'string'))) {
  throw new TypeError('LUMEN_RELEASE_PACKAGES must be a JSON array of package names')
}

const budgetPackages = new Set(requestedPackages ?? allBudgets.map(budget => budget.packageName))

if (budgetPackages.has('@santi020k/lumen-core')) {
  for (const budget of allBudgets) budgetPackages.add(budget.packageName)
}

const budgets = allBudgets.filter(budget => budgetPackages.has(budget.packageName))
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

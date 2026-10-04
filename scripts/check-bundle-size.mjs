import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

// Phone v4 adds measured presentation/validation code and shared offline artwork.
const allBudgets = [
  { file: 'packages/core/dist/virtual-window.js', gzip: 2_200, packageName: '@santi020k/lumen-core', raw: 7_000 },
  { file: 'packages/core/dist/virtual-collection.js', gzip: 2_500, packageName: '@santi020k/lumen-core', raw: 9_000 },
  { file: 'packages/react/dist/virtual-list-data.js', gzip: 2_000, packageName: '@santi020k/lumen-react', raw: 6_000 },
  { file: 'packages/core/dist/phone-flags.generated.js', gzip: 205_000, packageName: '@santi020k/lumen-core', raw: 305_000 },

  { file: 'packages/react/dist/combobox.js', gzip: 2_500, packageName: '@santi020k/lumen-react', raw: 10_000 },
  { file: 'packages/core/dist/combobox.js', gzip: 2_400, packageName: '@santi020k/lumen-core', raw: 9_000 },
  { file: 'packages/core/dist/virtual-list.js', gzip: 2_200, packageName: '@santi020k/lumen-core', raw: 7_000 },
  { file: 'packages/react/dist/virtual-list.js', gzip: 1_000, packageName: '@santi020k/lumen-react', raw: 3_000 },
  { file: 'packages/react/dist/rich-text-editor.js', gzip: 2_500, packageName: '@santi020k/lumen-react', raw: 10_000 },
  { file: 'packages/astro/runtime/UIPrimitives.astro', gzip: 33_000, packageName: '@santi020k/lumen-astro', raw: 167_000 },
  { file: 'packages/astro/runtime/controllers/motion.ts', gzip: 1_500, packageName: '@santi020k/lumen-astro', raw: 5_000 },
  { file: 'packages/astro/runtime/controllers/dialogs.ts', gzip: 2_000, packageName: '@santi020k/lumen-astro', raw: 6_000 },
  { file: 'packages/astro/runtime/controllers/document-navigation.ts', gzip: 1_500, packageName: '@santi020k/lumen-astro', raw: 5_000 },
  { file: 'packages/astro/runtime/controllers/image-comparison.ts', gzip: 900, packageName: '@santi020k/lumen-astro', raw: 2_000 },
  // Appearance presets add 12.3 KiB raw / 1.3 KiB gzip to the reviewed v4 stylesheet.
  { file: 'packages/lumen/styles.css', gzip: 33_000, packageName: '@santi020k/lumen', raw: 204_000 },
  { file: 'packages/react/dist/components.js', gzip: 35_000, packageName: '@santi020k/lumen-react', raw: 171_000 },
  {
    file: 'packages/react/dist/hooks.js',
    gzip: 20_000,
    packageName: '@santi020k/lumen-react',
    raw: 100_000,
    relatedFiles: ['packages/react/dist/toast-context.js', 'packages/react/dist/toast-provider.js']
  },
  { file: 'packages/elements/dist/define.js', gzip: 45_000, packageName: '@santi020k/lumen-elements', raw: 261_000 }
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
  // Keep extracted modules within their original budget instead of dropping their bytes.
  const files = [budget.file, ...(budget.relatedFiles ?? [])]

  const source = Buffer.concat(await Promise.all(files.map(file => (
    readFile(new URL(`../${file}`, import.meta.url))
  ))))

  const raw = source.byteLength
  const gzip = gzipSync(source, { level: 9 }).byteLength
  const label = files.join(' + ')

  process.stdout.write(
    `${label}: ${formatBytes(raw)} raw, ${formatBytes(gzip)} gzip\n`
  )

  if (raw > budget.raw) {
    failures.push(`${label} raw size ${formatBytes(raw)} exceeds ${formatBytes(budget.raw)}`)
  }

  if (gzip > budget.gzip) {
    failures.push(`${label} gzip size ${formatBytes(gzip)} exceeds ${formatBytes(budget.gzip)}`)
  }
}

if (failures.length) {
  throw new Error(`Bundle size budget exceeded:\n${failures.join('\n')}`)
}

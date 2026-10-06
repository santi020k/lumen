import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const { build } = createRequire(new URL('../../packages/elements/package.json', import.meta.url))('esbuild')
const formatBytes = bytes => `${(bytes / 1024).toFixed(1)} KiB`

const selectMeasurements = (measurements, requestedPackagesSource) => {
  const requestedPackages = requestedPackagesSource ? JSON.parse(requestedPackagesSource) : undefined

  if (requestedPackagesSource && (!Array.isArray(requestedPackages) || requestedPackages.some(name => typeof name !== 'string'))) {
    throw new TypeError('LUMEN_RELEASE_PACKAGES must be a JSON array of package names')
  }

  // A core change affects every adapter; otherwise measure only the built release scope.
  const packages = new Set(requestedPackages ?? measurements.map(entry => entry.packageName))

  if (packages.has('@santi020k/lumen-core')) {
    for (const entry of measurements) packages.add(entry.packageName)
  }

  return measurements.filter(measurement => packages.has(measurement.packageName))
}

const readMeasurement = async (entry, root) => {
  if (entry.contents === undefined) {
    // Extracted modules remain included in their original combined measurement.
    const files = [entry.file, ...(entry.relatedFiles ?? [])]
    const source = Buffer.concat(await Promise.all(files.map(file => readFile(new URL(file, root)))))

    return { source, label: files.join(' + ') }
  }

  const result = await build({
    bundle: true,
    external: ['react', 'react/jsx-runtime'],
    format: 'esm',
    logLevel: 'silent',
    minify: true,
    platform: 'browser',
    stdin: { contents: entry.contents, resolveDir: fileURLToPath(new URL(`${entry.resolveDirectory}/`, root)) },
    treeShaking: true,
    write: false
  })

  const source = result.outputFiles[0]?.contents

  if (!source) throw new Error(`${entry.label} produced no bundle`)

  return { source, label: entry.label }
}

const budgetFailures = (entry, label, sizes) => {
  if (entry.kind === 'catalog') return []

  return ['raw', 'gzip'].filter(format => sizes[format] > entry[format]).map(format =>
    `${label} ${format} size ${formatBytes(sizes[format])} exceeds ${formatBytes(entry[format])}`
  )
}

export const checkBundleSize = async (measurements, {
  root = new URL('../../', import.meta.url),
  requestedPackagesSource = process.env.LUMEN_RELEASE_PACKAGES,
  write = line => process.stdout.write(line)
} = {}) => {
  const failures = []

  for (const entry of selectMeasurements(measurements, requestedPackagesSource)) {
    const { source, label } = await readMeasurement(entry, root)
    const sizes = { raw: source.byteLength, gzip: gzipSync(source, { level: 9 }).byteLength }
    const mode = entry.kind === 'catalog' ? 'catalog, informational' : 'enforced'

    write(`${label}: ${formatBytes(sizes.raw)} raw, ${formatBytes(sizes.gzip)} gzip (${mode})\n`)

    failures.push(...budgetFailures(entry, label, sizes))
  }

  if (failures.length) throw new Error(`Bundle size budget exceeded:\n${failures.join('\n')}`)
}

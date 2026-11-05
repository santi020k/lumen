import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

interface StyleEntry {
  dependencies: readonly string[]
  parts: readonly string[]
  stylesheet: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const isStringList = (value: unknown): value is string[] => (
  Array.isArray(value) && value.every((entry: unknown) => typeof entry === 'string')
)

const loadStyles = (): Readonly<Record<string, StyleEntry>> => {
  const require = createRequire(import.meta.url)
  const manifest: unknown = JSON.parse(readFileSync(require.resolve('@santi020k/lumen-core/styles/manifest.json'), 'utf8'))

  if (!isRecord(manifest)) throw new Error('Invalid Lumen CSS delivery manifest.')

  const entries: Record<string, StyleEntry> = {}

  for (const [name, entry] of Object.entries(manifest)) {
    if (!isRecord(entry) || typeof entry.stylesheet !== 'string' ||
      !isStringList(entry.parts) || !isStringList(entry.dependencies)) {
      throw new Error('Invalid Lumen CSS delivery manifest entry.')
    }

    entries[name] = { stylesheet: entry.stylesheet, parts: entry.parts, dependencies: entry.dependencies }
  }

  return entries
}

const styles = loadStyles()

const partsFor = (name: string, visited = new Set<string>()): Set<string> => {
  const entry = styles[name]

  if (!entry || visited.has(name)) return new Set()

  const next = new Set([...visited, name])

  return new Set([...entry.parts, ...entry.dependencies.flatMap(dependency => [...partsFor(dependency, next)])])
}

export const hasComponentCss = (
  name: string, references: ReadonlySet<string>, framework: 'astro' | 'elements' | 'react'
): boolean => {
  const packages = framework === 'astro' ? ['astro'] : [framework, 'core', '']

  const observed = new Set(Object.entries(styles).flatMap(([component, entry]) => {
    const loaded = packages.some(adapter => references.has(`@santi020k/lumen${adapter ? '-' + adapter : ''}/${entry.stylesheet}`))

    return loaded ? [...partsFor(component)] : []
  }))

  return [...partsFor(name)].every(part => observed.has(part))
}

/* eslint-disable complexity */
import { readFile } from 'node:fs/promises'

import { lumenRegistry } from './registry-data.js'
import type {
  LumenRegistry,
  LumenRegistryComponent,
  LumenRegistryEntry,
  LumenRegistryFile,
  LumenRegistryItem,
  LumenRegistryLoadOptions
} from './registry-types.js'

export { lumenRegistry }

export type {
  LumenRegistry,
  LumenRegistryComponent,
  LumenRegistryEntry,
  LumenRegistryFile,
  LumenRegistryItem,
  LumenRegistryLoadOptions
}

const defaultRegistryTimeoutMs = 30_000

const normalizeRegistryEntryName = (name: string) =>
  name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').replaceAll(/[\s_]+/g, '-').toLowerCase()

export const getLumenRegistryEntries = (registry: LumenRegistry = lumenRegistry): LumenRegistryEntry[] => [
  ...(registry.components ?? []),
  ...registry.items
]

export const getLumenRegistryItem = (
  name: string,
  registry: LumenRegistry = lumenRegistry
): LumenRegistryEntry | undefined => {
  const normalizedName = normalizeRegistryEntryName(name)
  const entries = getLumenRegistryEntries(registry)

  return entries.find(item => item.name === name) ??
    entries.find(item => normalizeRegistryEntryName(item.name) === normalizedName)
}

const isRegistryFile = (value: unknown): value is LumenRegistryFile | string => {
  if (typeof value === 'string') return value.length > 0

  if (!value || typeof value !== 'object') return false

  const file = value as Partial<LumenRegistryFile>

  return typeof file.path === 'string' && typeof file.source === 'string'
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(entry => typeof entry === 'string')

const isRegistryFileArray = (value: unknown): boolean =>
  Array.isArray(value) && value.every(entry => isRegistryFile(entry))

const registryItemTypes = new Set(['component-set', 'documentation', 'recipe'])

const isRegistryItem = (value: unknown): value is LumenRegistryItem => {
  if (!value || typeof value !== 'object') return false

  const item = value as Partial<LumenRegistryItem>

  return typeof item.name === 'string' &&
    typeof item.type === 'string' &&
    registryItemTypes.has(item.type) &&
    (item.components === undefined || isStringArray(item.components)) &&
    (item.files === undefined || isRegistryFileArray(item.files))
}

const isRegistryComponent = (value: unknown): value is LumenRegistryComponent => {
  if (!value || typeof value !== 'object') return false

  const component = value as Partial<LumenRegistryComponent>

  return typeof component.name === 'string' &&
    component.type === 'component' &&
    typeof component.description === 'string' &&
    typeof component.category === 'string' &&
    isRegistryFileArray(component.files) &&
    (component.dependencies === undefined || isStringArray(component.dependencies))
}

const isLumenRegistry = (value: unknown): value is LumenRegistry => {
  if (!value || typeof value !== 'object') return false

  const registry = value as Partial<LumenRegistry>

  return typeof registry.name === 'string' &&
    typeof registry.version === 'number' &&
    typeof registry.description === 'string' &&
    isStringArray(registry.packages) &&
    Array.isArray(registry.items) &&
    registry.items.every(item => isRegistryItem(item)) &&
    (registry.components === undefined ||
      (Array.isArray(registry.components) && registry.components.every(component => isRegistryComponent(component))))
}

const fetchRegistrySource = async (source: string, options: LumenRegistryLoadOptions): Promise<string> => {
  if (options.token && source.startsWith('http://')) {
    throw new Error('Refusing to send a Lumen registry token over plain HTTP. Use an https:// registry URL.')
  }

  const response = await fetch(source, {
    headers: {
      ...options.headers,
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    signal: AbortSignal.timeout(options.timeoutMs ?? defaultRegistryTimeoutMs)
  })

  if (!response.ok) {
    throw new Error(`Failed to load Lumen registry: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

export const loadLumenRegistry = async (
  source: string | URL,
  options: LumenRegistryLoadOptions = {}
): Promise<LumenRegistry> => {
  const sourceValue = String(source)

  const raw = sourceValue.startsWith('http://') || sourceValue.startsWith('https://')
    ? await fetchRegistrySource(sourceValue, options)
    : await readFile(source, 'utf8')

  const parsed: unknown = JSON.parse(raw)

  if (!isLumenRegistry(parsed)) {
    throw new Error('Invalid Lumen registry manifest')
  }

  return parsed
}

export {
  addLumenRegistryItem,
  type LumenAddOptions,
  type LumenAddResult,
  type LumenAddTarget,
  type LumenMergeConflict
} from './installer.js'

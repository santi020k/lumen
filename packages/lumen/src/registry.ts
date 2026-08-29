/* eslint-disable complexity */
import { readFile, stat } from 'node:fs/promises'

import { lumenRegistry } from './registry-data.js'
import { isSafeRegistryFilePath } from './registry-path.js'
import type {
  LumenRegistry,
  LumenRegistryComponent,
  LumenRegistryComponentContract,
  LumenRegistryEntry,
  LumenRegistryFile,
  LumenRegistryItem,
  LumenRegistryLoadOptions
} from './registry-types.js'

export { lumenRegistry }

export type {
  LumenRegistry,
  LumenRegistryComponent,
  LumenRegistryComponentContract,
  LumenRegistryEntry,
  LumenRegistryFile,
  LumenRegistryItem,
  LumenRegistryLoadOptions
}

const defaultRegistryTimeoutMs = 30_000
const defaultRegistryMaxBytes = 5 * 1024 * 1024

const resolvePositiveInteger = (
  value: number | undefined,
  fallback: number,
  name: string
): number => {
  const resolved = value ?? fallback

  if (!Number.isSafeInteger(resolved) || resolved <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return resolved
}

const normalizeRegistryEntryName = (name: string) => name
  .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replaceAll(/[\s_]+/g, '-')
  .toLowerCase()

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

  return (
    entries.find(item => item.name === name) ??
    entries.find(item => normalizeRegistryEntryName(item.name) === normalizedName)
  )
}

const isRegistryFile = (value: unknown): value is LumenRegistryFile | string => {
  if (typeof value === 'string') return value.length > 0

  if (!value || typeof value !== 'object') return false

  const file = value as Partial<LumenRegistryFile>

  return (
    typeof file.path === 'string' &&
    isSafeRegistryFilePath(file.path) &&
    typeof file.source === 'string'
  )
}

const isString = (entry: unknown): entry is string => typeof entry === 'string'
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString)
const isRegistryFileArray = (value: unknown): boolean => Array.isArray(value) && value.every(isRegistryFile)
const registryItemTypes = new Set(['component-set', 'documentation', 'recipe'])

const isRegistryItem = (value: unknown): value is LumenRegistryItem => {
  if (!value || typeof value !== 'object') return false

  const item = value as Partial<LumenRegistryItem>

  return (
    typeof item.name === 'string' && item.name.trim().length > 0 &&
    typeof item.type === 'string' &&
    registryItemTypes.has(item.type) &&
    (item.components === undefined || isStringArray(item.components)) &&
    (item.files === undefined || isRegistryFileArray(item.files))
  )
}

const isRegistryComponent = (value: unknown): value is LumenRegistryComponent => {
  if (!value || typeof value !== 'object') return false

  const component = value as Partial<LumenRegistryComponent>

  return (
    typeof component.name === 'string' && component.name.trim().length > 0 &&
    component.type === 'component' &&
    typeof component.description === 'string' && component.description.trim().length > 0 &&
    typeof component.category === 'string' && component.category.trim().length > 0 &&
    isRegistryFileArray(component.files) &&
    (component.dependencies === undefined || isStringArray(component.dependencies))
  )
}

const isLumenRegistry = (value: unknown): value is LumenRegistry => {
  if (!value || typeof value !== 'object') return false

  const registry = value as Partial<LumenRegistry>

  return (
    typeof registry.name === 'string' && registry.name.trim().length > 0 &&
    typeof registry.version === 'number' &&
    Number.isSafeInteger(registry.version) && registry.version > 0 &&
    typeof registry.description === 'string' && registry.description.trim().length > 0 &&
    isStringArray(registry.packages) &&
    Array.isArray(registry.items) &&
    registry.items.every(item => isRegistryItem(item)) &&
    (registry.components === undefined ||
      (Array.isArray(registry.components) && registry.components.every(component => isRegistryComponent(component))))
  )
}

const getResponseBody = (response: Response): ReadableStream<Uint8Array> | null => response.body

const readBoundedResponse = async (response: Response, maxBytes: number): Promise<string> => {
  const contentLength = Number(response.headers.get('content-length'))

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel()

    throw new Error(`Lumen registry exceeds the ${maxBytes} byte limit.`)
  }

  const body = getResponseBody(response)

  if (!body) return ''

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    let chunk = await reader.read()

    while (!chunk.done) {
      totalBytes += chunk.value.byteLength

      if (totalBytes > maxBytes) {
        await reader.cancel()

        throw new Error(`Lumen registry exceeds the ${maxBytes} byte limit.`)
      }

      chunks.push(chunk.value)

      chunk = await reader.read()
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)

    offset += chunk.byteLength
  }

  return new TextDecoder().decode(bytes)
}

const fetchRegistrySource = async (
  source: string,
  options: LumenRegistryLoadOptions,
  maxBytes: number
): Promise<string> => {
  if (options.token && source.startsWith('http://')) {
    throw new Error('Refusing to send a Lumen registry token over plain HTTP. Use an https:// registry URL.')
  }

  const response = await fetch(source, {
    headers: {
      ...options.headers,
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    signal: AbortSignal.timeout(resolvePositiveInteger(
      options.timeoutMs,
      defaultRegistryTimeoutMs,
      'timeoutMs'
    ))
  })

  if (!response.ok) {
    throw new Error(`Failed to load Lumen registry: ${response.status} ${response.statusText}`)
  }

  return readBoundedResponse(response, maxBytes)
}

const readRegistrySource = async (source: string | URL, maxBytes: number): Promise<string> => {
  const details = await stat(source)

  if (details.size > maxBytes) {
    throw new Error(`Lumen registry exceeds the ${maxBytes} byte limit.`)
  }

  return readFile(source, 'utf8')
}

export const loadLumenRegistry = async (
  source: string | URL,
  options: LumenRegistryLoadOptions = {}
): Promise<LumenRegistry> => {
  const sourceValue = String(source)
  const maxBytes = resolvePositiveInteger(options.maxBytes, defaultRegistryMaxBytes, 'maxBytes')

  const raw =
    sourceValue.startsWith('http://') || sourceValue.startsWith('https://') ?
      await fetchRegistrySource(sourceValue, options, maxBytes) :
      await readRegistrySource(source, maxBytes)

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Invalid Lumen registry JSON')
  }

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

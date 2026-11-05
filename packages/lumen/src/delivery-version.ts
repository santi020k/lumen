import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { subset, valid } from 'semver'

export type DeliveryVersion = 'legacy' | 'unknown' | 'v5'

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const readJson = async (path: string): Promise<unknown> => {
  const source = await readFile(path, 'utf8').catch(() => undefined)

  if (source === undefined) return undefined

  try {
    const value: unknown = JSON.parse(source)

    return value
  } catch {
    return null
  }
}

const classifyVersion = (version: string): DeliveryVersion => {
  if (subset(version, '>=5.0.0 <6.0.0-0')) return 'v5'

  if (subset(version, '>=0.0.0 <5.0.0-0')) return 'legacy'

  return 'unknown'
}

const installedDeliveryVersion = async (root: string, adapter: string): Promise<DeliveryVersion | undefined> => {
  let directory = resolve(root)

  for (;;) {
    const installed = await readJson(join(directory, 'node_modules', adapter, 'package.json'))

    if (installed !== undefined) {
      return isRecord(installed) && installed.name === adapter && typeof installed.version === 'string' &&
        valid(installed.version) ?
        classifyVersion(installed.version) :
        'unknown'
    }

    const parent = dirname(directory)

    if (parent === directory) break

    directory = parent
  }

  return undefined
}

const declaredDeliveryVersion = async (root: string, adapter: string): Promise<DeliveryVersion> => {
  const manifest = await readJson(join(root, 'package.json'))

  if (!isRecord(manifest)) return 'unknown'

  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const dependencies = manifest[field]
    const range = isRecord(dependencies) ? dependencies[adapter] : undefined

    if (typeof range !== 'string') continue

    const candidate = range.startsWith('workspace:') ? range.slice('workspace:'.length) : range

    try {
      return classifyVersion(candidate)
    } catch {
      return 'unknown'
    }
  }

  return 'unknown'
}

export const getDeliveryVersion = async (root: string, adapter: string): Promise<DeliveryVersion> => (
  await installedDeliveryVersion(root, adapter) ?? await declaredDeliveryVersion(root, adapter)
)

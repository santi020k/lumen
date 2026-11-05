import { readFile } from 'node:fs/promises'

import { valid } from 'semver'

export interface ConsumerRelease {
  composeVersion: string
  npmVersions: ReadonlyMap<string, string>
  swiftTag: string
  version: string
}

const record = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : {}
)

const exactVersion = (value: unknown): string | undefined => (
  typeof value === 'string' && valid(value) === value ? value : undefined
)

const readNativeTargets = (release: Record<string, unknown>): Pick<ConsumerRelease, 'composeVersion' | 'swiftTag'> => {
  const composeVersion = exactVersion(record(release.compose).version)
  const swiftTag = record(release.swift).tag

  if (!composeVersion || typeof swiftTag !== 'string') throw new Error('Invalid native targets in the release manifest.')

  return { composeVersion, swiftTag }
}

export const loadConsumerRelease = async (
  targetVersion: string | undefined,
  manifestPath?: string
): Promise<ConsumerRelease | undefined> => {
  const source: unknown = JSON.parse(await readFile(
    manifestPath ?? new URL('../release-manifest.json', import.meta.url), 'utf8'
  ))

  const release = record(record(source).release)
  const packages = record(record(release.npm).packages)
  const version = exactVersion(release.version)

  if (!version) throw new Error('Invalid release version in the release manifest.')

  if (targetVersion && version !== targetVersion) {
    if (manifestPath) throw new Error('The release manifest version must match the requested target.')

    return undefined
  }

  const npmVersions = new Map<string, string>()

  for (const [name, metadata] of Object.entries(packages)) {
    const packageVersion = exactVersion(record(metadata).version)

    if (!packageVersion) throw new Error(`Invalid release manifest version for ${name}.`)

    npmVersions.set(name, packageVersion)
  }

  if (!npmVersions.has('@santi020k/lumen')) throw new Error('The release manifest must include the npm umbrella.')

  return { ...readNativeTargets(release), npmVersions, version }
}

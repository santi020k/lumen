import { readFile } from 'node:fs/promises'

import { major, valid } from 'semver'

const record = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
)

const npmPackages = (manifest: unknown): Record<string, unknown> => {
  if (!record(manifest) || !record(manifest.release) || !record(manifest.release.npm) ||
    !record(manifest.release.npm.packages)) throw new Error('Invalid bundled npm release manifest.')

  return manifest.release.npm.packages
}

const releaseVersions = (packages: Record<string, unknown>): Readonly<Record<string, string>> => {
  const versions: Record<string, string> = {}

  for (const [name, entry] of Object.entries(packages)) {
    if (!record(entry) || typeof entry.version !== 'string' || !valid(entry.version)) {
      throw new Error('Invalid bundled npm package release version.')
    }

    versions[name] = entry.version
  }

  return versions
}

export const consumerPackageVersion = (
  name: string, targetVersion: string, versions?: Readonly<Record<string, string>>
): string => {
  if (!versions) return targetVersion

  const version = versions[name]

  if (!version || !valid(version)) throw new Error(`The bundled release manifest has no npm target for ${name}.`)

  return version
}

/** A release target identifies a release manifest, not a shared version for every npm package. */
export const consumerReleaseVersions = async (
  targetVersion: string
): Promise<Readonly<Record<string, string>> | undefined> => {
  if (!valid(targetVersion)) throw new Error('Consumer rollout requires an exact semantic target version.')

  if (major(targetVersion) !== 5) return undefined

  const manifest: unknown = JSON.parse(await readFile(new URL('../release-manifest.json', import.meta.url), 'utf8'))
  const versions = releaseVersions(npmPackages(manifest))

  if (versions['@santi020k/lumen'] !== targetVersion) {
    throw new Error(`The bundled release manifest does not describe requested target ${targetVersion}.`)
  }

  return versions
}

import type { LumenData } from './data.js'
import { loadLumenData } from './data.js'
import type { LumenToolResult } from './tools.js'

export interface LumenVersionCheck {
  catalogVersion: string | null
  installedVersion: string
  packageName: string
  status: 'match' | 'mismatch' | 'unknown'
}

export interface LumenCompatibilityReport {
  checks: LumenVersionCheck[]
  compatible: boolean
  guidance: string
}

const versionStatus = (catalog: string | null, installed: string): LumenVersionCheck['status'] => {
  if (catalog === null) return 'unknown'

  return catalog === installed ? 'match' : 'mismatch'
}

/** Compare resolved versions, never dependency ranges, without reading a consumer repository. */
export const checkCompatibility = (
  args: { packageVersions: Readonly<Record<string, string>> },
  data: LumenData = loadLumenData()
): LumenToolResult<LumenCompatibilityReport> => {
  const checks = Object.entries(args.packageVersions).sort(([left], [right]) => left.localeCompare(right))
    .map(([packageName, installedVersion]): LumenVersionCheck => {
      const catalogVersion = Object.hasOwn(data.meta.packageVersions, packageName) ?
        data.meta.packageVersions[packageName] ?? null :
        null

      return {
        catalogVersion,
        installedVersion,
        packageName,
        status: versionStatus(catalogVersion, installedVersion)
      }
    })

  const compatible = checks.length > 0 && checks.every(check => check.status === 'match')

  const guidance = compatible ?
    'Resolved package versions match this catalog. Retrieve the target framework or platform usage contract.' :
    'Use a catalog for the resolved installed version, or inspect installed public types and documentation. ' +
    'Do not apply this snapshot as the installed API or upgrade dependencies without the requested migration scope.'

  return {
    data: { checks, compatible, guidance },
    text: [guidance, ...checks.map(check => `${check.packageName}: installed ${check.installedVersion}; catalog ${check.catalogVersion ?? 'unknown'} (${check.status})`)].join('\n')
  }
}

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { RenderedAuditConfigurationError, type RenderedAuditOptions } from './rendered-audit-options.js'

type BuildReport = Map<string, string[][]>

const invalidReport = () => new RenderedAuditConfigurationError(
  'invalid-build-report', 'Expected a local Lumen build report with schemaVersion 1 and origin-relative asset paths.'
)

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isImportChain = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(label => typeof label === 'string' && label.length > 0)

const readAsset = (value: unknown, origin: string): [string, string[][]] => {
  if (!isRecord(value) || typeof value.path !== 'string' || !value.path.startsWith('/')) throw invalidReport()

  const url = URL.parse(value.path, origin)

  if (url?.origin !== origin || url.pathname !== value.path) throw invalidReport()

  const chains: unknown = value.imports

  if (!Array.isArray(chains) || !chains.length || !chains.every(isImportChain)) throw invalidReport()

  return [url.href, chains]
}

export const loadBuildReport = async (options: RenderedAuditOptions): Promise<BuildReport | undefined> => {
  if (!options.buildReportPath) return undefined

  let value: unknown

  try {
    value = JSON.parse(await readFile(resolve(options.cwd, options.buildReportPath), 'utf8'))
  } catch {
    throw invalidReport()
  }

  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.assets)) throw invalidReport()

  const paths: BuildReport = new Map()
  const origin = new URL(options.url).origin

  for (const entry of value.assets) {
    const [url, chains] = readAsset(entry, origin)

    if (paths.has(url)) throw invalidReport()

    paths.set(url, chains)
  }

  return paths
}

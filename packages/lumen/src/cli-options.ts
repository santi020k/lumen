import { resolveConsumerRolloutTargets } from './consumer-rollout.js'

const valueOptions = new Set([
  '--cwd',
  '--exclude',
  '--framework',
  '--manifest',
  '--registry',
  '--registry-token',
  '--report',
  '--target',
  '--version'
])

const readOptionValues = (
  args: readonly string[],
  flag: string,
  message: string
): { present: boolean, values: string[] } => {
  const values: string[] = []
  let present = false

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== flag) continue

    present = true

    const value = args[index + 1]

    if (!value || value.startsWith('--')) throw new Error(message)

    values.push(value)

    index += 1
  }

  return { present, values }
}

const getFirstPositional = (args: readonly string[]): string | undefined => {
  for (let index = 1; index < args.length; index += 1) {
    const value = args[index]

    if (!value) continue

    if (valueOptions.has(value)) {
      index += 1

      continue
    }

    if (!value.startsWith('--')) return value
  }

  return undefined
}

const getRolloutArguments = (args: readonly string[]): { repositories: string[], targetVersion?: string } => {
  const values: string[] = []

  for (let index = 1; index < args.length; index += 1) {
    const value = args[index]

    if (!value) continue

    if (valueOptions.has(value)) {
      index += 1

      continue
    }

    if (!value.startsWith('--')) values.push(value)
  }

  return resolveConsumerRolloutTargets(values)
}

export interface ParsedCliOptions {
  allowDirty: boolean
  applyRollout: boolean
  command: string
  conflict: 'error' | 'merge' | 'skip'
  cwd?: string
  dependencies: boolean
  dryRun: boolean
  excludeValues: string[]
  force: boolean
  frameworkValue?: string
  json: boolean
  manifestPath?: string
  name?: string
  noVerify: boolean
  registrySource?: string
  registryToken?: string
  reportPath?: string
  rollout: { repositories: string[], targetVersion?: string }
  tailwind: boolean
  targetProvided: boolean
  targetValue?: string
  versionValue?: string
}

export const resolveAuditRenderedCwd = (args: readonly string[]): string | undefined => {
  const cwdOption = readOptionValues(args, '--cwd', 'Provide a path after --cwd.')

  return cwdOption.values[0]
}

const resolveConflictMode = (args: readonly string[]): 'error' | 'merge' | 'skip' => {
  if (args.includes('--fail-on-conflict')) return 'error'

  if (args.includes('--merge')) return 'merge'

  return 'skip'
}

const optionalEntry = <K extends string>(key: K, value: string | undefined): Partial<Record<K, string>> => (
  value ? { [key]: value } as Partial<Record<K, string>> : {}
)

export const parseCliOptions = (
  args: readonly string[],
  envToken = process.env.LUMEN_REGISTRY_TOKEN
): ParsedCliOptions => {
  const command = args[0] ?? 'help'
  const cwdOption = readOptionValues(args, '--cwd', 'Provide a path after --cwd.')
  const registryOption = readOptionValues(args, '--registry', 'Provide a path or URL after --registry.')
  const registryTokenOption = readOptionValues(args, '--registry-token', 'Provide a token after --registry-token.')
  const targetOption = readOptionValues(args, '--target', 'Missing Lumen add target. Use astro, react, or elements.')
  const reportOption = readOptionValues(args, '--report', 'Provide a path after --report.')
  const manifestOption = readOptionValues(args, '--manifest', 'Provide a path after --manifest.')

  const frameworkOption = readOptionValues(
    args,
    '--framework',
    'Missing or invalid framework. Use --framework astro, react, or elements.'
  )

  const versionOption = readOptionValues(
    args,
    '--version',
    'audit-consumer --version requires an exact semantic version.'
  )

  const excludeOption = readOptionValues(args, '--exclude', 'Provide a path after --exclude.')
  const registryToken = registryTokenOption.present ? registryTokenOption.values[0] : envToken

  return {
    allowDirty: args.includes('--allow-dirty'),
    applyRollout: args.includes('--apply'),
    command,
    conflict: resolveConflictMode(args),
    ...optionalEntry('cwd', cwdOption.values[0]),
    dependencies: args.includes('--dependencies'),
    dryRun: args.includes('--dry-run'),
    excludeValues: excludeOption.values,
    force: args.includes('--force'),
    ...optionalEntry('frameworkValue', frameworkOption.values[0]),
    json: args.includes('--json'),
    ...optionalEntry('manifestPath', manifestOption.values[0]),
    ...optionalEntry('name', getFirstPositional(args)),
    noVerify: args.includes('--no-verify'),
    ...optionalEntry('registrySource', registryOption.values[0]),
    ...optionalEntry('registryToken', registryToken),
    ...optionalEntry('reportPath', reportOption.values[0]),
    rollout: getRolloutArguments(args),
    tailwind: args.includes('--tailwind'),
    targetProvided: targetOption.present,
    ...optionalEntry('targetValue', targetOption.values[0]),
    ...optionalEntry('versionValue', versionOption.values[0])
  }
}

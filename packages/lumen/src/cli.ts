import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  consumerRolloutSucceeded,
  formatConsumerRollout,
  runConsumerRollout
} from './consumer-rollout.js'
import {
  addLumenRegistryItem,
  getLumenRegistryEntries,
  getLumenRegistryItem,
  loadLumenRegistry,
  type LumenAddTarget,
  type LumenRegistry,
  lumenRegistry,
  type LumenRegistryEntry
} from './registry.js'
import { auditLumenTokenCss, type LumenTokenAuditFinding } from './token-audit.js'

const args = process.argv.slice(2)
const [command = 'help', name] = args
const dryRun = args.includes('--dry-run')
const failOnConflict = args.includes('--fail-on-conflict')
const force = args.includes('--force')
const merge = args.includes('--merge')
const cwdIndex = args.indexOf('--cwd')
const cwd = cwdIndex >= 0 ? args[cwdIndex + 1] : undefined
const registryIndex = args.indexOf('--registry')
const registrySource = registryIndex >= 0 ? args[registryIndex + 1] : undefined
const registryTokenIndex = args.indexOf('--registry-token')
const registryToken = registryTokenIndex >= 0 ? args[registryTokenIndex + 1] : process.env.LUMEN_REGISTRY_TOKEN
const targetIndex = args.indexOf('--target')
const targetProvided = targetIndex >= 0
const targetValue = targetIndex >= 0 ? args[targetIndex + 1] : undefined
const applyRollout = args.includes('--apply')
const allowDirty = args.includes('--allow-dirty')
const noVerify = args.includes('--no-verify')
const reportIndex = args.indexOf('--report')
const reportPath = reportIndex >= 0 ? args[reportIndex + 1] : undefined

const excludeValues = args.flatMap((value, index) => {
  const nextValue = args[index + 1]

  return value === '--exclude' && nextValue ? [nextValue] : []
})

let conflict: 'error' | 'merge' | 'skip' = 'skip'

const getRolloutArguments = (): { repositories: string[], targetVersion?: string } => {
  const values: string[] = []
  const optionsWithValues = new Set(['--exclude', '--report'])

  for (let index = 1; index < args.length; index += 1) {
    const value = args[index]

    if (!value) continue

    if (optionsWithValues.has(value)) {
      index += 1

      continue
    }

    if (!value.startsWith('--')) values.push(value)
  }

  const [targetVersion, ...repositories] = values

  return {
    repositories: repositories.length ? repositories : [process.cwd()],
    ...(targetVersion ? { targetVersion } : {})
  }
}

const getAddTarget = (value: string | undefined, provided = false): LumenAddTarget => {
  if (provided && !value) {
    throw new Error('Missing Lumen add target. Use astro, react, or elements.')
  }

  if (!value || value === 'astro') return 'astro'

  if (value === 'react' || value === 'elements') return value

  throw new Error(`Unknown Lumen add target: ${value}. Use astro, react, or elements.`)
}

if (failOnConflict) {
  conflict = 'error'
} else if (merge) {
  conflict = 'merge'
}

const formatList = (registry: LumenRegistry = lumenRegistry) => getLumenRegistryEntries(registry)
  .map(item => `${item.name} (${item.type})`)
  .join('\n')

const getRegistryFilePath = (file: NonNullable<LumenRegistryEntry['files']>[number]): string => typeof file === 'string' ? file : file.path

const getRegistryItemFiles = (item: LumenRegistryEntry): string | undefined => {
  if (!item.files?.length) return undefined

  return item.files.map(getRegistryFilePath).join(', ')
}

const getRegistryItemDescription = (item: LumenRegistryEntry): string | undefined => 'description' in item ? item.description : undefined
const getRegistryItemCategory = (item: LumenRegistryEntry): string | undefined => 'category' in item ? `category: ${item.category}` : undefined

const getRegistryItemComponents = (item: LumenRegistryEntry): string | undefined => 'components' in item && Array.isArray(item.components) && item.components.length > 0 ?
  `components: ${item.components.join(', ')}` :
  undefined

const getRegistryItemDependencies = (item: LumenRegistryEntry): string | undefined => 'dependencies' in item && item.dependencies.length > 0 ?
  `dependencies: ${item.dependencies.join(', ')}` :
  undefined

const formatItem = (itemName: string, registry: LumenRegistry = lumenRegistry) => {
  const item: LumenRegistryEntry | undefined =
    getLumenRegistryItem(itemName, registry)

  if (!item) {
    process.exitCode = 1

    return `Unknown Lumen registry item: ${itemName}`
  }

  const lines = [
    `${item.name} (${item.type})`,
    getRegistryItemDescription(item),
    getRegistryItemCategory(item),
    getRegistryItemComponents(item),
    getRegistryItemDependencies(item)
  ]

  const files = getRegistryItemFiles(item)

  if (files) {
    lines.push(`files: ${files}`)
  }

  return lines.filter((line): line is string => Boolean(line)).join('\n')
}

const formatAddResult = async (itemName: string, registry: LumenRegistry) => {
  const result = await addLumenRegistryItem(itemName, {
    ...(cwd ? { cwd } : {}),
    conflict,
    dryRun,
    force,
    registry,
    target: getAddTarget(targetValue, targetProvided)
  })

  return [
    `${result.dryRun ? 'Would add' : 'Added'} ${result.item.name}`,
    ...result.added.map(file => `- ${file}`),
    ...result.merged.map(file => `- merged existing ${file}`),
    ...result.skipped.map(file => `- skipped existing ${file}`)
  ].join('\n')
}

const getCssFiles = async (path: string): Promise<string[]> => {
  const details = await stat(path)

  if (details.isFile()) return path.endsWith('.css') ? [path] : []

  const entries = await readdir(path, { withFileTypes: true })

  const nested = await Promise.all(entries
    .filter(entry => entry.name !== 'node_modules' && !entry.name.startsWith('.'))
    .map(entry => getCssFiles(resolve(path, entry.name))))

  return nested.flat()
}

const formatTokenAudit = async (inputPath: string): Promise<string> => {
  const target = resolve(inputPath)
  const files = await getCssFiles(target)
  const findings: LumenTokenAuditFinding[] = []

  for (const file of files) {
    findings.push(...auditLumenTokenCss(await readFile(file, 'utf8'), file))
  }

  if (!findings.length) return `No incompatible Lumen semantic token declarations found in ${target}.`

  process.exitCode = 1

  return [
    `Found ${findings.length} incompatible Lumen semantic token declaration${findings.length === 1 ? '' : 's'}:`,
    ...findings.map(finding => (
      `${finding.file}:${finding.line}:${finding.column} --${finding.token}: ${finding.value}`
    )),
    '',
    'Lumen semantic colors must be HSL channels such as "220 13% 96%", not complete colors such as "#fff" or "hsl(...)".',
    'Rename legacy variables during incremental migration or convert their values to channels before importing Lumen.'
  ].join('\n')
}

const help = [
  'Lumen registry helper',
  '',
  'Commands:',
  '  lumen list             List registry items',
  '  lumen show <name>      Show components and files for an item',
  '  lumen add <name>       Install a recipe or component into the current project',
  '  lumen install          Print install commands',
  '  lumen audit-tokens     Report incompatible semantic color custom properties',
  '  lumen rollout [version] [repositories...]  Inventory or upgrade pnpm consumers',
  '',
  'Options:',
  '  --cwd <path>           Target directory for lumen add',
  '  --dry-run              Print files without writing them',
  '  --fail-on-conflict     Exit if a target recipe file already exists',
  '  --force                Overwrite existing recipe files',
  '  --merge                Merge recipe files with existing files',
  '  --registry <source>    Load list/show data from a local or remote registry JSON file',
  '  --registry-token <key> Use a bearer token for private remote registries',
  '  --target <framework>   Generate wrappers or recipe starters for astro, react, or elements',
  '  --apply                Apply a rollout (requires a target version)',
  '  --allow-dirty          Allow rollout after recording an uncommitted baseline',
  '  --exclude <path>       Exclude a repository (repeatable)',
  '  --no-verify            Skip downstream check, typecheck, build, and browser scripts',
  '  --report <path>        Write the machine-readable rollout report as JSON',
  ''
].join('\n')

// eslint-disable-next-line complexity -- Command dispatch keeps CLI exit behavior and output in one place.
const run = async () => {
  let output = help

  const registry = registrySource ?
    await loadLumenRegistry(registrySource, registryToken ? { token: registryToken } : {}) :
    lumenRegistry

  switch (command) {
    case 'audit-tokens': {
      output = await formatTokenAudit(name ?? cwd ?? process.cwd())

      break
    }

    case 'add': {
      if (name) output = await formatAddResult(name, registry)

      break
    }

    case 'install': {
      output = 'pnpm add @santi020k/lumen-astro\nnpm install @santi020k/lumen-astro\nyarn add @santi020k/lumen-astro'

      break
    }

    case 'list': {
      output = formatList(registry)

      break
    }

    case 'rollout': {
      const rollout = getRolloutArguments()

      const report = await runConsumerRollout({
        allowDirty,
        apply: applyRollout,
        exclude: excludeValues,
        ...(reportPath ? { report: reportPath } : {}),
        repositories: rollout.repositories,
        ...(rollout.targetVersion ? { targetVersion: rollout.targetVersion } : {}),
        verify: !noVerify
      })

      output = formatConsumerRollout(report)

      if (!consumerRolloutSucceeded(report)) process.exitCode = 1

      break
    }

    case 'show': {
      if (name) output = formatItem(name, registry)

      break
    }
  }

  process.stdout.write(`${output}\n`)
}

run().catch((error: unknown) => {
  process.exitCode = 1

  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
})

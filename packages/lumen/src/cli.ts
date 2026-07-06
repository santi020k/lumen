import {
  addLumenRegistryItem,
  getLumenRegistryEntries,
  getLumenRegistryItem,
  loadLumenRegistry,
  type LumenRegistry,
  lumenRegistry,
  type LumenRegistryEntry
} from './registry.js'

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
let conflict: 'error' | 'merge' | 'skip' = 'skip'

if (failOnConflict) {
  conflict = 'error'
} else if (merge) {
  conflict = 'merge'
}

const formatList = (registry: LumenRegistry = lumenRegistry) => getLumenRegistryEntries(registry)
  .map(item => `${item.name} (${item.type})`)
  .join('\n')

const getRegistryFilePath = (file: NonNullable<LumenRegistryEntry['files']>[number]): string =>
  typeof file === 'string' ? file : file.path

const getRegistryItemFiles = (item: LumenRegistryEntry): string | undefined => {
  if (!item.files?.length) return undefined

  return item.files.map(getRegistryFilePath).join(', ')
}

const getRegistryItemDescription = (item: LumenRegistryEntry): string | undefined =>
  'description' in item ? item.description : undefined

const getRegistryItemCategory = (item: LumenRegistryEntry): string | undefined =>
  'category' in item ? `category: ${item.category}` : undefined

const getRegistryItemComponents = (item: LumenRegistryEntry): string | undefined =>
  'components' in item && Array.isArray(item.components) && item.components.length > 0
    ? `components: ${item.components.join(', ')}`
    : undefined

const getRegistryItemDependencies = (item: LumenRegistryEntry): string | undefined =>
  'dependencies' in item && item.dependencies.length > 0
    ? `dependencies: ${item.dependencies.join(', ')}`
    : undefined

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
    registry
  })

  return [
    `${result.dryRun ? 'Would add' : 'Added'} ${result.item.name}`,
    ...result.added.map(file => `- ${file}`),
    ...result.merged.map(file => `- merged existing ${file}`),
    ...result.skipped.map(file => `- skipped existing ${file}`)
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
  '',
  'Options:',
  '  --cwd <path>           Target directory for lumen add',
  '  --dry-run              Print files without writing them',
  '  --fail-on-conflict     Exit if a target recipe file already exists',
  '  --force                Overwrite existing recipe files',
  '  --merge                Merge recipe files with existing files',
  '  --registry <source>    Load list/show data from a local or remote registry JSON file',
  '  --registry-token <key> Use a bearer token for private remote registries',
  ''
].join('\n')

const run = async () => {
  let output = help

  const registry = registrySource
    ? await loadLumenRegistry(registrySource, registryToken ? { token: registryToken } : {})
    : lumenRegistry

  switch (command) {
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

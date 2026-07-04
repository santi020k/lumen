import {
  addLumenRegistryItem,
  getLumenRegistryItem,
  loadLumenRegistry,
  type LumenRegistry,
  lumenRegistry,
  type LumenRegistryItem} from './registry.js'

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

const formatList = (registry: LumenRegistry = lumenRegistry) => registry.items
  .map(item => `${item.name} (${item.type})`)
  .join('\n')

const formatItem = (itemName: string, registry: LumenRegistry = lumenRegistry) => {
  const item: LumenRegistryItem | undefined =
    registry.items.find(registryItem => registryItem.name === itemName) ?? getLumenRegistryItem(itemName)

  if (!item) {
    process.exitCode = 1

    return `Unknown Lumen registry item: ${itemName}`
  }

  const lines = [
    `${item.name} (${item.type})`
  ]

  if (item.components?.length) {
    lines.push(`components: ${item.components.join(', ')}`)
  }

  if (item.files?.length) {
    lines.push(`files: ${item.files.map(file => typeof file === 'string' ? file : file.path).join(', ')}`)
  }

  return lines.join('\n')
}

const help = [
  'Lumen registry helper',
  '',
  'Commands:',
  '  lumen list             List registry items',
  '  lumen show <name>      Show components and files for an item',
  '  lumen add <name>       Install a recipe into the current project',
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

  if (command === 'list') {
    output = formatList(registry)
  }

  if (command === 'show' && name) {
    output = formatItem(name, registry)
  }

  if (command === 'add' && name) {
    const result = await addLumenRegistryItem(name, {
      ...(cwd ? { cwd } : {}),
      conflict,
      dryRun,
      force,
      registry
    })

    output = [
      `${result.dryRun ? 'Would add' : 'Added'} ${result.item.name}`,
      ...result.added.map(file => `- ${file}`),
      ...result.merged.map(file => `- merged existing ${file}`),
      ...result.skipped.map(file => `- skipped existing ${file}`)
    ].join('\n')
  }

  if (command === 'install') {
    output = 'pnpm add @santi020k/lumen-astro\nnpm install @santi020k/lumen-astro\nyarn add @santi020k/lumen-astro'
  }

  process.stdout.write(`${output}\n`)
}

run().catch((error: unknown) => {
  process.exitCode = 1

  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
})

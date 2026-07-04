import {
  addLumenRegistryItem,
  getLumenRegistryItem,
  lumenRegistry
} from './registry.js'

const args = process.argv.slice(2)
const [command = 'help', name] = args
const dryRun = args.includes('--dry-run')
const cwdIndex = args.indexOf('--cwd')
const cwd = cwdIndex >= 0 ? args[cwdIndex + 1] : undefined

const formatList = () => lumenRegistry.items
  .map(item => `${item.name} (${item.type})`)
  .join('\n')

const formatItem = (itemName: string) => {
  const item = getLumenRegistryItem(itemName)

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
    lines.push(`files: ${item.files.join(', ')}`)
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
  ''
].join('\n')

const run = async () => {
  let output = help

  if (command === 'list') {
    output = formatList()
  }

  if (command === 'show' && name) {
    output = formatItem(name)
  }

  if (command === 'add' && name) {
    const result = await addLumenRegistryItem(name, { cwd, dryRun })

    output = [
      `${result.dryRun ? 'Would add' : 'Added'} ${result.item.name}`,
      ...result.files.map(file => `- ${file}`)
    ].join('\n')
  }

  if (command === 'install') {
    output = 'pnpm add @santi020k/lumen-astro\nnpm install @santi020k/lumen-astro\nyarn add @santi020k/lumen-astro'
  }

  process.stdout.write(`${output}\n`)
}

run().catch(error => {
  process.exitCode = 1

  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
})

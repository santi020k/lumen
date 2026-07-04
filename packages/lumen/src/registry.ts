import { readFile } from 'node:fs/promises'

export interface LumenRegistryFile {
  path: string
  source: string
}

export interface LumenRegistryItem {
  components?: string[]
  files?: (LumenRegistryFile | string)[]
  name: string
  type: 'component-set' | 'documentation' | 'recipe'
}

export interface LumenRegistry {
  description: string
  items: LumenRegistryItem[]
  name: string
  packages: string[]
  version: number
}

export interface LumenRegistryLoadOptions {
  headers?: Record<string, string>
  token?: string
}

export const lumenRegistry = {
  name: 'lumen',
  version: 1,
  description: 'Astro-first Lumen UI primitives, recipes, tokens, runtime, and AI docs.',
  packages: [
    '@santi020k/lumen-astro',
    '@santi020k/lumen-react',
    '@santi020k/lumen-elements',
    '@santi020k/lumen-core'
  ],
  items: [
    {
      name: 'all-components',
      type: 'component-set',
      files: [
        'packages/core/src/components.ts',
        'packages/astro/components',
        'packages/astro/styles/lumen.css',
        'packages/astro/runtime/UIPrimitives.astro'
      ]
    },
    {
      name: 'advanced-fields',
      type: 'recipe',
      components: ['Autocomplete', 'SearchField', 'NumberField', 'TimeField', 'DateRangePicker', 'ColorPicker', 'TagGroup']
    },
    {
      name: 'scheduler',
      type: 'recipe',
      components: ['Schedule', 'Agenda', 'Calendar', 'DatePicker']
    },
    {
      name: 'data-collections',
      type: 'recipe',
      components: ['DataTable', 'Tree', 'TreeGrid', 'VirtualList', 'Pagination', 'Command']
    },
    {
      name: 'theme-builder',
      type: 'recipe',
      components: ['ThemeBuilder', 'ColorPicker', 'Card', 'Button', 'Input']
    },
    {
      name: 'rich-text-editor',
      type: 'recipe',
      components: ['RichTextEditor', 'ButtonGroup', 'ToggleGroup', 'Textarea']
    },
    {
      name: 'ai-docs',
      type: 'documentation',
      files: ['llms.txt', 'docs/ai-usage.md', 'docs/feature-roadmap.md']
    }
  ]
} as const satisfies LumenRegistry

export const getLumenRegistryItem = (name: string): LumenRegistryItem | undefined =>
  lumenRegistry.items.find(item => item.name === name)

const isLumenRegistry = (value: unknown): value is LumenRegistry => {
  if (!value || typeof value !== 'object') return false

  const registry = value as Partial<LumenRegistry>

  return typeof registry.name === 'string' &&
    typeof registry.version === 'number' &&
    Array.isArray(registry.items) &&
    Array.isArray(registry.packages)
}

export const loadLumenRegistry = async (
  source: string | URL,
  options: LumenRegistryLoadOptions = {}
): Promise<LumenRegistry> => {
  const sourceValue = String(source)

  const raw = sourceValue.startsWith('http://') || sourceValue.startsWith('https://')
    ? await fetch(sourceValue, {
      headers: {
        ...options.headers,
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load Lumen registry: ${response.status} ${response.statusText}`)
      }

      return response.text()
    })
    : await readFile(source, 'utf8')

  const parsed: unknown = JSON.parse(raw)

  if (!isLumenRegistry(parsed)) {
    throw new Error('Invalid Lumen registry manifest')
  }

  return parsed
}

export {
  addLumenRegistryItem,
  type LumenAddOptions,
  type LumenAddResult,
  type LumenMergeConflict
} from './installer.js'

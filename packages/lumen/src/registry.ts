export interface LumenRegistryItem {
  components?: string[]
  files?: string[]
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

export {
  addLumenRegistryItem,
  type LumenAddOptions,
  type LumenAddResult
} from './installer.js'

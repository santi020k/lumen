export interface LumenRegistryFile {
  path: string
  source: string
}

export interface LumenRegistryComponentContract {
  composition?: readonly string[]
  events?: readonly string[]
  imports: Readonly<Record<string, string>>
  props?: readonly {
    default?: string
    name: string
    required?: boolean
    type: string
  }[]
  runtime?: string
  slots?: readonly string[]
  stylingParts?: readonly string[]
  tokens?: readonly string[]
  usage: Readonly<Record<string, string>>
}

export interface LumenRegistryComponent {
  category: string
  contract?: LumenRegistryComponentContract
  dependencies?: readonly string[]
  description: string
  files: readonly (LumenRegistryFile | string)[]
  name: string
  type: 'component'
}

export interface LumenRegistryItem {
  components?: readonly string[]
  files?: readonly (LumenRegistryFile | string)[]
  name: string
  type: 'component-set' | 'documentation' | 'recipe'
}

export type LumenRegistryEntry = LumenRegistryComponent | LumenRegistryItem

export interface LumenRegistry {
  components?: readonly LumenRegistryComponent[]
  description: string
  items: readonly LumenRegistryItem[]
  name: string
  packages: readonly string[]
  version: number
}

export interface LumenRegistryLoadOptions {
  headers?: Record<string, string>
  maxBytes?: number
  timeoutMs?: number
  token?: string
}

export interface LumenRegistryFile {
  path: string
  source: string
}

export interface LumenRegistryComponent {
  category: string
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
  timeoutMs?: number
  token?: string
}

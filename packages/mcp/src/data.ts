import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export interface LumenApiReferenceRow {
  attribute: string
  defaultValue: string
  description: string
  values: string
}

export interface LumenComponentProp {
  name: string
  optional: boolean
  type: string
}

export interface LumenComponentRecipe {
  name: string
  type: string
}

export interface LumenComponentSnapshot {
  apiReference: LumenApiReferenceRow[]
  astroSource: string
  category: string
  collections: string[]
  dependencies: string[]
  description: string
  files: unknown[]
  frameworkDetails: Record<LumenFramework, LumenFrameworkSnapshot>
  frameworks: {
    astro: boolean
    elements: boolean
    react: boolean
  }
  guidance: null | {
    distinction?: string
    when: string
  }
  kebab: string
  keyboardInteractions: LumenKeyboardInteraction[]
  keywords: string[]
  name: string
  props: LumenComponentProp[]
  propsExtends: null | string
  recipes: LumenComponentRecipe[]
  runtimeEvents: LumenRuntimeEvent[]
}

export interface LumenData {
  components: LumenComponentSnapshot[]
  docs: {
    aiUsage: string
    readme: string
  }
  meta: {
    componentCount: number
    packages: string[]
    registryName: string
    registryVersion: number
    serverVersion: string
  }
  recipes: LumenRecipeSnapshot[]
  rules: string
  tokens: LumenTokens
}

export type LumenFramework = 'astro' | 'elements' | 'react'

export interface LumenFrameworkSnapshot {
  attributes?: string[]
  available: boolean
  example: string
  importStatement: string
  language: 'astro' | 'html' | 'tsx'
  packageName: string
  props: LumenComponentProp[]
  propsExtends: null | string
  registration?: string
  source: string
  styleImport: string
  tagName?: string
}

export interface LumenKeyboardInteraction {
  action: string
  key: string
}

export interface LumenRecipeSnapshot {
  categories: string[]
  components?: string[]
  description: string
  files?: unknown[]
  install: Record<LumenFramework, string>
  name: string
  type: string
}

export interface LumenRuntimeEvent {
  detail: string
  name: string
  target: string
  when: string
}

export interface LumenTokens {
  colors: Record<string, string>
  glass: Record<string, string>
  semantic: string[]
  themeAttribute: string
}

const dataUrl = new URL('../data/lumen-data.json', import.meta.url)
let cached: LumenData | undefined

export const loadLumenData = (): LumenData => {
  if (cached) return cached

  const raw = readFileSync(fileURLToPath(dataUrl), 'utf8')

  cached = JSON.parse(raw) as LumenData

  return cached
}

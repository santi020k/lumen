import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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
  astroSource: string
  frameworks: {
    astro: boolean
    elements: boolean
    react: boolean
  }
  kebab: string
  name: string
  props: LumenComponentProp[]
  propsExtends: null | string
  recipes: LumenComponentRecipe[]
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

export interface LumenRecipeSnapshot {
  components?: string[]
  files?: unknown[]
  name: string
  type: string
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

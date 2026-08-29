import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'

export interface LumenCatalogManifest {
  components: Record<string, string>
  nativeComponents?: Record<string, string> | undefined
  recipes: Record<string, string>
}

export interface LumenComponentSnapshot {
  apiReference: {
    attribute: string
    defaultValue: string
    description: string
    values: string
  }[]
  astroSource: string
  category: string
  collections: string[]
  contract: null | Record<string, unknown>
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
  keyboardInteractions: {
    action: string
    key: string
  }[]
  keywords: string[]
  name: string
  props: {
    name: string
    optional: boolean
    type: string
  }[]
  propsExtends: null | string
  recipes: {
    name: string
    type: string
  }[]
  runtimeEvents: {
    detail: string
    name: string
    target: string
    when: string
  }[]
}

export interface LumenData {
  catalogManifest: LumenCatalogManifest
  components: LumenComponentSnapshot[]
  docs: {
    aiUsage: string
    readme: string
  }
  meta: {
    catalogHash: string
    componentCount: number
    nativeComponentCount: number
    packages: string[]
    packageVersions: Record<string, string>
    registryName: string
    registryVersion: number
    schemaVersion: number
    serverVersion: string
  }
  nativeComponents: LumenNativeComponentSnapshot[]
  nativeSources: Record<LumenNativePlatform, Record<string, string>>
  recipes: LumenRecipeSnapshot[]
  releaseManifest: LumenReleaseManifest
  rules: string
  tokens: {
    chart: Record<string, string>
    colors: Record<string, string>
    glass: Record<string, string>
    semantic: string[]
    themeAttribute: string
  }
}

interface LumenReleaseManifest {
  migration: {
    codemod: null | string
    css: Record<string, string>
    deprecatedExports: string[]
    removedExports: string[]
    runtime: Record<string, string>
  }
  release: {
    compose: { artifacts: string[], version: string }
    npm: {
      packages: Record<string, {
        peerDependencies: Record<string, string>
        version: string
      }>
    }
    swift: { package: string, revision: null | string, tag: string }
    version: string
  }
  schemaVersion: number
}

interface LumenNativeApiRow {
  defaultValue: string
  description: string
  name: string
  values: string
}

export interface LumenNativeComponentSnapshot {
  accessibility: string
  category: string
  contract: string
  guidance: string
  id: string
  implementations: Partial<Record<LumenNativePlatform, LumenNativeImplementationSnapshot>>
  name: string
  summary: string
  supportedPlatforms?: string[]
  tier: string
}

export interface LumenNativeImplementationSnapshot {
  api: LumenNativeApiRow[]
  example: string
  exportName: string
  importStatement: string
  install: string
  language: 'kotlin' | 'swift' | 'tsx'
  maturity: 'Experimental' | 'Supported'
  packageName: string
  setup: string
  sourceFile: string
  symbol: string
}

export type LumenNativePlatform = 'compose' | 'react-native' | 'swiftui'

export type LumenFramework = 'astro' | 'elements' | 'react'

export interface LumenFrameworkSnapshot {
  attributes?: string[]
  available: boolean
  behavior?: {
    controller?: {
      defaultValue: string
      description: string
      name: string
      type: string
    }[]
    description?: string
    hook?: string
    mode: 'adapter' | 'built-in' | 'hook' | 'registration' | 'runtime'
    options?: {
      defaultValue: string
      description: string
      name: string
      type: string
    }[]
    setup: string
  }
  example: string
  importStatement: string
  language: 'astro' | 'html' | 'tsx'
  packageName: string
  props: {
    name: string
    optional: boolean
    type: string
  }[]
  propsExtends: null | string
  registration?: string
  source: string
  styleImport: string
  tagName?: string
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

let cached: LumenData | undefined

/** Supply the generated snapshot in runtimes that cannot read package files, such as Workers. */
export const setLumenData = (data: LumenData): void => {
  cached = data
}

export const loadLumenData = (): LumenData => {
  if (cached) return cached

  const dataUrl = new URL('../data/lumen-data.json', import.meta.url)
  const readFsFile = Reflect.get(fs, 'readFileSync')
  const raw = readFsFile(fileURLToPath(dataUrl), 'utf8')

  cached = JSON.parse(raw) as LumenData

  return cached
}

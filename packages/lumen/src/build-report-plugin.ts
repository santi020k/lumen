import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, posix, relative, resolve } from 'node:path'

import type { Plugin } from 'vite'

import { createCssDependencyCollector, type CssDependencyCollector, cssModuleKey } from './build-report-css.js'

const moduleLabel = (id: string, root: string): string => {
  const clean = id.split('?', 1)[0] ?? ''

  if (!isAbsolute(clean) || clean.includes('\0')) return '(virtual module)'

  const normalized = clean.replaceAll('\\', '/')
  const marker = '/node_modules/'
  const dependency = normalized.lastIndexOf(marker)

  if (dependency >= 0) return normalized.slice(dependency + marker.length)

  const local = relative(root, clean).replaceAll('\\', '/')

  return local.startsWith('../') || isAbsolute(local) ? '(external module)' : './' + local
}

const isLumenModule = (label: string) => /^@santi020k\/lumen(?:-[\w-]+)?\//u.test(label)

const traceImports = (entries: string[], importsFor: (id: string) => readonly string[]): Map<string, string | null> => {
  const parents = new Map<string, string | null>(entries.map(id => [id, null]))

  for (const id of entries) {
    for (const imported of importsFor(id)) {
      if (parents.has(imported)) continue

      parents.set(imported, id)

      entries.push(imported)
    }
  }

  return parents
}

const cssPaths = (chunk: unknown): string[] => {
  if (!chunk || typeof chunk !== 'object') return []

  const metadata: unknown = Reflect.get(chunk, 'viteMetadata')

  if (!metadata || typeof metadata !== 'object') return []

  const imports: unknown = Reflect.get(metadata, 'importedCss')

  return imports instanceof Set ? Array.from<unknown>(imports).filter((path): path is string => typeof path === 'string') : []
}

interface ReportAsset { path: string, imports: string[][] }

type LumenBuildReportPlugin = Omit<Plugin, 'api'> & { api: { postcss: CssDependencyCollector } }

const describeChain = (id: string, parents: Map<string, string | null>, root: string): string[] => {
  const chain: string[] = []
  let current: string | null | undefined = id

  while (current) {
    chain.push(moduleLabel(current, root))

    current = parents.get(current)
  }

  return chain.reverse().filter(label => label !== '(virtual module)')
}

const mergeAssets = (assets: ReportAsset[]): ReportAsset[] => {
  const paths = new Map<string, string[][]>()

  for (const asset of assets) paths.set(asset.path, [...(paths.get(asset.path) ?? []), ...asset.imports])

  return [...paths].map(([path, imports]) => ({ path, imports }))
}

export const lumenBuildReport = (filename = '.cache/lumen/build-report.json'): LumenBuildReportPlugin => {
  let root = ''
  let base = '/'
  const cssDependencies = new Map<string, Set<string>>()
  const environments = new Map<string, ReportAsset[]>()

  return {
    name: 'lumen-build-report',
    api: { postcss: createCssDependencyCollector(cssDependencies) },
    apply: 'build',
    configResolved(config) {
      root = config.root

      base = config.base
    },
    async writeBundle(_options, bundle) {
      if (!base.startsWith('/') || base.startsWith('//')) {
        throw new Error('Lumen build reports require an origin-relative Vite base, such as / or /app/.')
      }

      const chunks = Object.values(bundle).filter(output => output.type === 'chunk')
      const entries = chunks.flatMap(chunk => chunk.isEntry && chunk.facadeModuleId ? [chunk.facadeModuleId] : [])

      const importsFor = (id: string, dynamic = false): string[] => {
        const info = this.getModuleInfo(id)
        const declared = cssDependencies.get(cssModuleKey(id)) ?? cssDependencies.get(cssModuleKey(id.split('?', 1)[0] ?? '')) ?? []

        return [...(info?.importedIds ?? []), ...(dynamic ? info?.dynamicallyImportedIds ?? [] : []), ...declared]
      }

      const parents = traceImports(entries, id => importsFor(id, true))
      const chainFor = (id: string) => describeChain(id, parents, root)
      const clientChunks = this.environment.config.consumer === 'client' ? chunks : []

      const assets = clientChunks.flatMap(chunk => {
        const imports = Object.keys(chunk.modules)
          .filter(id => isLumenModule(moduleLabel(id, root)))
          .sort().map(chainFor)

        return imports.length ? [{ path: posix.join(base, chunk.fileName), imports }] : []
      })

      const stylesForChunk = (chunk: (typeof chunks)[number]) => {
        const modules = traceImports(Object.keys(chunk.modules), id => importsFor(id))

        const imports = [...modules.keys()].filter(id => {
          const label = moduleLabel(id, root)

          return isLumenModule(label) && label.endsWith('.css')
        }).sort().map(chainFor)

        if (!imports.length) return []

        return cssPaths(chunk).filter(path => bundle[path]?.type === 'asset')
          .map(path => ({ path: posix.join(base, path), imports }))
      }

      const cssAssets = new Map<string, string[][]>()

      for (const asset of clientChunks.flatMap(stylesForChunk)) {
        cssAssets.set(asset.path, [...(cssAssets.get(asset.path) ?? []), ...asset.imports])
      }

      assets.push(...[...cssAssets].map(([path, imports]) => ({ path, imports })))

      // Vite retains CSS-only entry ownership here even when no client script exists.
      const sourceIds = new Map([...this.getModuleIds()].map(id => [
        relative(root, id).replaceAll('\\', '/').replaceAll('\0', ''), id
      ]))

      const stylesForAsset = (asset: { fileName: string, originalFileNames: string[] }): ReportAsset[] => {
        const owners = asset.originalFileNames.flatMap(name => {
          const id = sourceIds.get(name)

          return id ? [id] : []
        })

        const styleParents = traceImports(owners, id => importsFor(id))

        const imports = [...styleParents.keys()]
          .filter(id => isLumenModule(moduleLabel(id, root)) && moduleLabel(id, root).endsWith('.css'))
          .sort().map(id => describeChain(id, styleParents, root))

        return imports.length ? [{ path: posix.join(base, asset.fileName), imports }] : []
      }

      const stylesheetAssets = Object.values(bundle).filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css'))

      for (const asset of stylesheetAssets) {
        if (asset.type !== 'asset') continue

        const specific = stylesForAsset(asset)

        if (specific.length) {
          const index = assets.findIndex(existing => existing.path === specific[0]?.path)

          if (index >= 0) assets.splice(index, 1)

          assets.push(...specific)
        }
      }

      environments.set(this.environment.name, assets)

      const combined = mergeAssets([...environments.values()].flat())
      const target = resolve(root, filename)

      await mkdir(dirname(target), { recursive: true })

      await writeFile(target, JSON.stringify({ schemaVersion: 1, assets: combined }, null, 2) + '\n')
    }
  }
}

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, posix, relative, resolve } from 'node:path'

import type { Plugin } from 'vite'

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

export const lumenBuildReport = (filename = '.cache/lumen/build-report.json'): Plugin => {
  let root = ''
  let base = '/'

  return {
    name: 'lumen-build-report',
    apply: 'build',
    configResolved(config) {
      root = config.root

      base = config.base
    },
    async writeBundle(_options, bundle) {
      if (this.environment.config.consumer !== 'client') return

      if (!base.startsWith('/') || base.startsWith('//')) {
        throw new Error('Lumen build reports require an origin-relative Vite base, such as / or /app/.')
      }

      const chunks = Object.values(bundle).filter(output => output.type === 'chunk')
      const entries = chunks.flatMap(chunk => chunk.isEntry && chunk.facadeModuleId ? [chunk.facadeModuleId] : [])

      // Keep one shortest import path, including dynamic imports, while visiting cycles once.
      const parents = traceImports(entries, id => {
        const info = this.getModuleInfo(id)

        return info ? [...info.importedIds, ...info.dynamicallyImportedIds] : []
      })

      const chainFor = (id: string): string[] => {
        const chain: string[] = []
        let current: string | null | undefined = id

        while (current) {
          chain.push(moduleLabel(current, root))

          current = parents.get(current)
        }

        return chain.reverse()
      }

      const assets = chunks.flatMap(chunk => {
        const imports = Object.keys(chunk.modules)
          .filter(id => isLumenModule(moduleLabel(id, root)))
          .sort().map(chainFor)

        return imports.length ? [{ path: posix.join(base, chunk.fileName), imports }] : []
      })

      const stylesForChunk = (chunk: (typeof chunks)[number]) => {
        const modules = traceImports(Object.keys(chunk.modules), id => this.getModuleInfo(id)?.importedIds ?? [])

        const imports = [...modules.keys()].filter(id => {
          const label = moduleLabel(id, root)

          return isLumenModule(label) && label.endsWith('.css')
        }).sort().map(chainFor)

        if (!imports.length) return []

        return cssPaths(chunk).filter(path => bundle[path]?.type === 'asset')
          .map(path => ({ path: posix.join(base, path), imports }))
      }

      const cssAssets = new Map<string, string[][]>()

      for (const asset of chunks.flatMap(stylesForChunk)) {
        cssAssets.set(asset.path, [...(cssAssets.get(asset.path) ?? []), ...asset.imports])
      }

      assets.push(...[...cssAssets].map(([path, imports]) => ({ path, imports })))

      const target = resolve(root, filename)

      await mkdir(dirname(target), { recursive: true })

      await writeFile(target, JSON.stringify({ schemaVersion: 1, assets }, null, 2) + '\n')
    }
  }
}

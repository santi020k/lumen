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
      const parents = new Map<string, string | null>(entries.map(id => [id, null]))

      // One shortest build-time import path per module, including dynamic imports. Cycles visit once.
      for (const id of entries) {
        const info = this.getModuleInfo(id)

        if (!info) continue

        for (const imported of [...info.importedIds, ...info.dynamicallyImportedIds]) {
          if (!parents.has(imported)) {
            parents.set(imported, id)

            entries.push(imported)
          }
        }
      }

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

      const target = resolve(root, filename)

      await mkdir(dirname(target), { recursive: true })

      await writeFile(target, JSON.stringify({ schemaVersion: 1, assets }, null, 2) + '\n')
    }
  }
}

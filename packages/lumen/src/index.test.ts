import {
  existsSync
} from 'node:fs'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises'
import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from 'node:http'
import {
  tmpdir
} from 'node:os'
import {
  join
} from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  addLumenRegistryItem,
  getLumenRegistryItem,
  loadLumenRegistry,
  lumen,
  lumenComponentNames,
  lumenGlass,
  lumenPackages,
  lumenRegistry} from './index.js'

describe('@santi020k/lumen umbrella package', () => {
  test('exports umbrella metadata and shared package metadata', () => {
    expect(lumen).toEqual({
      name: 'Lumen',
      packageName: '@santi020k/lumen',
      scope: '@santi020k'
    })

    expect(lumenComponentNames).toContain('Button')
    expect(lumenGlass.blur).toBe('18px')

    expect(lumenPackages.some(pkg => pkg.packageName === lumen.packageName)).toBe(true)
  })

  test('exports registry recipes for product surfaces', () => {
    expect(lumenRegistry.items.map(item => item.name)).toEqual([
      'all-components',
      'advanced-fields',
      'scheduler',
      'data-collections',
      'theme-builder',
      'rich-text-editor',
      'ai-docs'
    ])

    expect(getLumenRegistryItem('scheduler')?.components).toEqual([
      'Schedule',
      'Agenda',
      'Calendar',
      'DatePicker'
    ])
  })

  test('installs registry recipes into a target directory', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-add-'))

    try {
      const dryRun = await addLumenRegistryItem('scheduler', { cwd, dryRun: true })

      expect(dryRun.files).toEqual(['src/lumen/scheduler.astro'])
      expect(existsSync(join(cwd, 'src/lumen/scheduler.astro'))).toBe(false)

      const result = await addLumenRegistryItem('scheduler', { cwd })
      const source = await readFile(join(cwd, 'src/lumen/scheduler.astro'), 'utf8')

      expect(result.dryRun).toBe(false)
      expect(source).toContain('data-ui-schedule-event')
      expect(source).toContain('@santi020k/lumen-astro')

      await writeFile(join(cwd, 'src/lumen/scheduler.astro'), 'custom', 'utf8')

      const skipped = await addLumenRegistryItem('scheduler', { cwd })

      expect(skipped.added).toEqual([])
      expect(skipped.skipped).toEqual(['src/lumen/scheduler.astro'])
      await expect(readFile(join(cwd, 'src/lumen/scheduler.astro'), 'utf8')).resolves.toBe('custom')

      const forced = await addLumenRegistryItem('scheduler', { cwd, force: true })

      expect(forced.added).toEqual(['src/lumen/scheduler.astro'])
      await expect(readFile(join(cwd, 'src/lumen/scheduler.astro'), 'utf8')).resolves.toContain('data-ui-schedule-event')
      await expect(addLumenRegistryItem('scheduler', { conflict: 'error', cwd })).rejects.toThrow('Refusing to overwrite')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('rejects unknown install items', async () => {
    await expect(addLumenRegistryItem('missing')).rejects.toThrow('Unknown Lumen registry item')
  })

  test('loads external registry manifests', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-registry-'))
    const registryPath = join(cwd, 'registry.json')

    try {
      await writeFile(registryPath, JSON.stringify({
        description: 'Test registry',
        items: [{ name: 'custom', type: 'recipe', components: ['Button'] }],
        name: 'test',
        packages: ['@santi020k/lumen-astro'],
        version: 1
      }), 'utf8')

      const registry = await loadLumenRegistry(registryPath)

      expect(registry.name).toBe('test')
      expect(registry.items[0]?.name).toBe('custom')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('installs inline files from external registry manifests', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-external-'))
    const registryPath = join(cwd, 'registry.json')

    try {
      await writeFile(registryPath, JSON.stringify({
        description: 'Test registry',
        items: [{
          files: [{
            path: 'src/lumen/custom.astro',
            source: '<section>Custom recipe</section>\n'
          }],
          name: 'custom',
          type: 'recipe'
        }],
        name: 'test',
        packages: ['@santi020k/lumen-astro'],
        version: 1
      }), 'utf8')

      const registry = await loadLumenRegistry(registryPath)
      const result = await addLumenRegistryItem('custom', { cwd, registry })

      expect(result.added).toEqual(['src/lumen/custom.astro'])
      await expect(readFile(join(cwd, 'src/lumen/custom.astro'), 'utf8')).resolves.toContain('Custom recipe')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('merges registry recipes with existing files', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'lumen-merge-'))

    try {
      const target = join(cwd, 'src/lumen/custom.astro')
      await mkdir(join(cwd, 'src/lumen'), { recursive: true })

      await writeFile(target, '<section>Existing</section>\n', 'utf8')

      const result = await addLumenRegistryItem('custom', {
        conflict: 'merge',
        cwd,
        registry: {
          description: 'Test registry',
          items: [{
            files: [{
              path: 'src/lumen/custom.astro',
              source: '<section>Incoming</section>\n'
            }],
            name: 'custom',
            type: 'recipe'
          }],
          name: 'test',
          packages: ['@santi020k/lumen-astro'],
          version: 1
        }
      })
      const source = await readFile(target, 'utf8')

      expect(result.added).toEqual([])
      expect(result.merged).toEqual(['src/lumen/custom.astro'])
      expect(source).toContain('Existing')
      expect(source).toContain('Lumen merge: src/lumen/custom.astro')
      expect(source).toContain('Incoming')
    } finally {
      await rm(cwd, { force: true, recursive: true })
    }
  })

  test('loads authenticated remote registry manifests', async () => {
    const registry = JSON.stringify({
      description: 'Private registry',
      items: [{ name: 'private', type: 'recipe' }],
      name: 'private',
      packages: ['@santi020k/lumen-astro'],
      version: 1
    })
    const server = createServer((request: IncomingMessage, response: ServerResponse) => {
      if (request.headers.authorization !== 'Bearer secret') {
        response.writeHead(401)
        response.end('Unauthorized')

        return
      }

      response.setHeader('content-type', 'application/json')
      response.end(registry)
    })

    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

    try {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      const loaded = await loadLumenRegistry(`http://127.0.0.1:${port}/registry.json`, {
        token: 'secret'
      })

      expect(loaded.name).toBe('private')
      expect(loaded.items[0]?.name).toBe('private')
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error)

            return
          }

          resolve()
        })
      })
    }
  })
})

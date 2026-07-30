import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  getLumenRegistryItem,
  type LumenRegistry,
  type LumenRegistryEntry,
  type LumenRegistryFile,
} from './registry.js'

interface LumenRecipeFile {
  path: string
  source: string
}

export interface LumenAddOptions {
  conflict?: 'error' | 'merge' | 'overwrite' | 'skip'
  cwd?: string
  dryRun?: boolean
  force?: boolean
  merge?: (conflict: LumenMergeConflict) => string
  registry?: LumenRegistry
  target?: LumenAddTarget
}

export type LumenAddTarget = 'astro' | 'elements' | 'react'

export interface LumenMergeConflict {
  existing: string
  incoming: string
  path: string
}

export interface LumenAddResult {
  added: string[]
  dryRun: boolean
  files: string[]
  item: LumenRegistryEntry
  merged: string[]
  skipped: string[]
}

const templatesRoot = fileURLToPath(new URL('../templates/', import.meta.url))

const productTemplateRecipes = new Set([
  'analytics-dashboard',
  'auth-onboarding',
  'commerce-dashboard',
  'project-workspace',
  'saas-admin',
])

const loadTemplateDirectory = async (templateDir: string): Promise<LumenRecipeFile[]> => {
  let entries

  try {
    entries = await readdir(templateDir, { recursive: true, withFileTypes: true })
  } catch {
    return []
  }

  return Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const absolutePath = join(entry.parentPath, entry.name)

        return {
          path: relative(templateDir, absolutePath).split(sep).join('/'),
          source: await readFile(absolutePath, 'utf8'),
        }
      }),
  )
}

const loadRecipeTemplateFiles = async (
  itemName: string,
  target: LumenAddTarget,
): Promise<LumenRecipeFile[] | undefined> => {
  const templateDirectories = [
    ...(productTemplateRecipes.has(itemName) ? [join(templatesRoot, 'shared', 'common')] : []),
    join(templatesRoot, 'shared', itemName),
    join(templatesRoot, target, itemName),
  ]

  const templateFiles = await Promise.all(templateDirectories.map(loadTemplateDirectory))

  const filesByPath = new Map<string, LumenRecipeFile>()

  for (const file of templateFiles.flat()) {
    filesByPath.set(file.path, file)
  }

  const files = [...filesByPath.values()].sort((first, second) => first.path.localeCompare(second.path))

  return files.length > 0 ? files : undefined
}

const toKebabCase = (name: string) => name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const toCamelCase = (value: string): string =>
  value.replaceAll(/-([a-z])/g, (_match, character: string) => character.toUpperCase())

const createAstroComponentFile = (name: string): LumenRecipeFile => ({
  path: `src/lumen/${toKebabCase(name)}.astro`,
  source: `---
import { ${name} as Lumen${name} } from '@santi020k/lumen-astro'

const props = Astro.props
---

<Lumen${name} {...props}>
  <slot />
</Lumen${name}>
`,
})

const createReactComponentFile = (name: string): LumenRecipeFile => ({
  path: `src/lumen/${toKebabCase(name)}.tsx`,
  source: `import type { ComponentPropsWithoutRef } from 'react'

import { ${name} as Lumen${name} } from '@santi020k/lumen-react'

export type ${name}Props = ComponentPropsWithoutRef<typeof Lumen${name}>

export const ${name} = (props: ${name}Props) => <Lumen${name} {...props} />
`,
})

const createElementsComponentFile = (name: string): LumenRecipeFile => {
  const tagName = `lumen-${toKebabCase(name)}`
  const variableName = `${toCamelCase(toKebabCase(name))}TagName`

  return {
    path: `src/lumen/${toKebabCase(name)}.ts`,
    source: `import {
  defineLumenElements,
  Lumen${name}Element
} from '@santi020k/lumen-elements'

defineLumenElements()

export { Lumen${name}Element }

export const ${variableName} = '${tagName}' as const

declare global {
  interface HTMLElementTagNameMap {
    '${tagName}': InstanceType<typeof Lumen${name}Element>
  }
}
`,
  }
}

const createComponentFile = (name: string, target: LumenAddTarget): LumenRecipeFile => {
  if (target === 'react') return createReactComponentFile(name)

  if (target === 'elements') return createElementsComponentFile(name)

  return createAstroComponentFile(name)
}

const getFilesForItem = async (item: LumenRegistryEntry, target: LumenAddTarget): Promise<LumenRecipeFile[]> => {
  if (item.type === 'component') return [createComponentFile(item.name, target)]

  const targetRecipeFiles = await loadRecipeTemplateFiles(item.name, target)

  if (targetRecipeFiles) {
    return targetRecipeFiles
  }

  const inlineFiles =
    item.files
      ?.filter((file): file is LumenRegistryFile => typeof file !== 'string')
      .map((file) => ({
        path: file.path,
        source: file.source,
      })) ?? []

  if (inlineFiles.length > 0) return inlineFiles

  if (item.type === 'recipe') {
    throw new Error(`Registry recipe "${item.name}" does not have ${target} starter files yet.`)
  }

  return []
}

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

const mergeFileSource = ({ existing, incoming, path }: LumenMergeConflict): string => {
  if (existing.includes(incoming.trim())) return existing

  return `${existing.trimEnd()}\n\n/* Lumen merge: ${path} */\n${incoming}`
}

const getConflictMode = (options: LumenAddOptions) => (options.force ? 'overwrite' : (options.conflict ?? 'skip'))

const getInstallSource = async (
  file: LumenRecipeFile,
  target: string,
  exists: boolean,
  options: LumenAddOptions,
  conflict: NonNullable<LumenAddOptions['conflict']>,
) => {
  if (!exists || conflict !== 'merge') return file.source

  return (options.merge ?? mergeFileSource)({
    existing: await readFile(target, 'utf8'),
    incoming: file.source,
    path: file.path,
  })
}

const writeInstallFile = async (target: string, source: string, dryRun: boolean | undefined) => {
  if (dryRun) return

  await mkdir(dirname(target), { recursive: true })

  await writeFile(target, source, 'utf8')
}

type InstallFileOutcome = 'added' | 'merged' | 'skipped'

const installRegistryFile = async (
  file: LumenRecipeFile,
  cwd: string,
  options: LumenAddOptions,
  conflict: NonNullable<LumenAddOptions['conflict']>,
): Promise<InstallFileOutcome> => {
  const target = join(cwd, file.path)
  const exists = await fileExists(target)

  if (exists && conflict === 'error') {
    throw new Error(`Refusing to overwrite existing file: ${file.path}`)
  }

  if (exists && conflict === 'skip') return 'skipped'

  const source = await getInstallSource(file, target, exists, options, conflict)

  await writeInstallFile(target, source, options.dryRun)

  return exists && conflict === 'merge' ? 'merged' : 'added'
}

export const addLumenRegistryItem = async (name: string, options: LumenAddOptions = {}): Promise<LumenAddResult> => {
  const item = getLumenRegistryItem(name, options.registry)

  if (!item) {
    throw new Error(`Unknown Lumen registry item: ${name}`)
  }

  const files = await getFilesForItem(item, options.target ?? 'astro')
  const cwd = options.cwd ?? process.cwd()

  if (!files.length) {
    throw new Error(`Registry item cannot be installed yet: ${name}`)
  }

  const added: string[] = []
  const conflict = getConflictMode(options)
  const merged: string[] = []
  const skipped: string[] = []

  for (const file of files) {
    const outcome = await installRegistryFile(file, cwd, options, conflict)

    if (outcome === 'skipped') {
      skipped.push(file.path)

      continue
    }

    if (outcome === 'merged') {
      merged.push(file.path)
    } else {
      added.push(file.path)
    }
  }

  return {
    added,
    dryRun: Boolean(options.dryRun),
    files: files.map((file) => file.path),
    item,
    merged,
    skipped,
  }
}

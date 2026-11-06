import { access, lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { lumenComponentNames } from '@santi020k/lumen-core'

import { componentCssName, getComponentEntry } from './component-delivery.js'
import {
  getLumenRegistryItem,
  type LumenRegistry,
  type LumenRegistryEntry,
  type LumenRegistryFile
} from './registry.js'
import { isSafeRegistryComponentName } from './registry-component-name.js'
import { assertSafeRegistryFilePath } from './registry-path.js'

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
  conflicts: { path: string, diff: string }[]
  dryRun: boolean
  files: string[]
  item: LumenRegistryEntry
  merged: string[]
  skipped: string[]
}

const templatesRoot = fileURLToPath(new URL('../templates/', import.meta.url))
const visualProductBlocks = new Set(['interactive-pricing', 'feature-preview', 'guided-onboarding', 'command-center'])

const productTemplateRecipes = new Set([
  'analytics-dashboard',
  'auth-onboarding',
  'commerce-dashboard',
  'project-workspace',
  'saas-admin'
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
      .filter(entry => entry.isFile())
      .map(async entry => {
        const absolutePath = join(entry.parentPath, entry.name)

        return {
          path: relative(templateDir, absolutePath).split(sep).join('/'),
          source: await readFile(absolutePath, 'utf8')
        }
      })
  )
}

const loadRecipeTemplateFiles = async (
  itemName: string,
  target: LumenAddTarget
): Promise<LumenRecipeFile[] | undefined> => {
  const templateDirectories = [
    ...(productTemplateRecipes.has(itemName) ? [join(templatesRoot, 'shared', 'common')] : []),
    ...(target !== 'react' && visualProductBlocks.has(itemName) ? [join(templatesRoot, 'shared', 'visual-blocks')] : []),
    join(templatesRoot, 'shared', itemName),
    join(templatesRoot, target, itemName)
  ]

  const templateFiles = await Promise.all(templateDirectories.map(loadTemplateDirectory))
  const filesByPath = new Map<string, LumenRecipeFile>()

  for (const file of templateFiles.flat()) {
    filesByPath.set(file.path, file)
  }

  const files = [...filesByPath.values()].sort((first, second) => first.path.localeCompare(second.path))

  return files.length > 0 ? files : undefined
}

const toKebabCase = componentCssName

const toCamelCase = (value: string): string => (
  value.replaceAll(/-([a-z])/g, (_match, character: string) => character.toUpperCase())
)

const createAstroComponentFile = (name: string): LumenRecipeFile => ({
  path: `src/lumen/${toKebabCase(name)}.astro`,
  source: `---
${lumenComponentNames.some(component => component === name) ?
    `import Lumen${name} from '@santi020k/lumen-astro/components/${name}.astro'` :
    `import { ${name} as Lumen${name} } from '@santi020k/lumen-astro'`}

const props = Astro.props
---

<Lumen${name} {...props}>
  <slot />
</Lumen${name}>
`
})

const componentStyleImports = (name: string, target: 'elements' | 'react'): string => (
  lumenComponentNames.some(component => component === name) ?
    `import '@santi020k/lumen-${target}/styles/foundation.css'\n` +
    `import '@santi020k/lumen-${target}/styles/components/${componentCssName(name)}.css'\n\n` :
    ''
)

const catalogComment = (name: string, selective: string | undefined): string => selective ?
  '' :
  `// Catalog fallback: ${name} has no published selective entry. This import traverses the catalog.\n`

const createReactComponentFile = (name: string): LumenRecipeFile => {
  const selective = getComponentEntry(name, 'react')

  return {
    path: `src/lumen/${toKebabCase(name)}.tsx`,
    source: `import type { ComponentPropsWithoutRef } from 'react'

${componentStyleImports(name, 'react')}${catalogComment(name, selective)}import { ${name} as Lumen${name} } from '${selective ?? '@santi020k/lumen-react'}'

export type ${name}Props = ComponentPropsWithoutRef<typeof Lumen${name}>

export const ${name} = (props: ${name}Props) => <Lumen${name} {...props} />
`
  }
}

const createElementsComponentFile = (name: string): LumenRecipeFile => {
  const tagName = `lumen-${toKebabCase(name)}`
  const variableName = `${toCamelCase(toKebabCase(name))}TagName`
  const selective = getComponentEntry(name, 'elements')

  return {
    path: `src/lumen/${toKebabCase(name)}.ts`,
    source: `${componentStyleImports(name, 'elements')}${catalogComment(name, selective)}import { Lumen${name}Element } from '${selective ?? '@santi020k/lumen-elements'}'

// Register this constructor only; repeated imports preserve existing registry definitions.
if (typeof customElements !== 'undefined' && !customElements.get('${tagName}')) {
  customElements.define('${tagName}', Lumen${name}Element)
}

export { Lumen${name}Element }

export const ${variableName} = '${tagName}' as const

declare global {
  interface HTMLElementTagNameMap {
    '${tagName}': InstanceType<typeof Lumen${name}Element>
  }
}
`
  }
}

const createComponentFile = (name: string, target: LumenAddTarget): LumenRecipeFile => {
  if (!isSafeRegistryComponentName(name)) {
    throw new Error('Registry component names must be safe identifiers without reserved keywords.')
  }

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
      .map(file => ({
        path: file.path,
        source: file.source
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

// Exclude matching outer lines. One replacement hunk keeps work linear even for unrelated templates.
const diffSource = ({ existing, incoming, path }: LumenMergeConflict): string => {
  const before = existing ? existing.split(/(?<=\n)/) : []
  const after = incoming ? incoming.split(/(?<=\n)/) : []
  let start = 0

  while (start < before.length && before[start] === after[start]) start++

  let oldEnd = before.length
  let newEnd = after.length

  while (oldEnd > start && newEnd > start && before[oldEnd - 1] === after[newEnd - 1]) {
    oldEnd--

    newEnd--
  }

  const range = (end: number) => `${end === start ? start : start + 1},${end - start}`

  const lines = (source: string[], end: number, prefix: string) => source.slice(start, end)
    .map(line => prefix + (line.endsWith('\n') ? line.slice(0, -1) : line + '\n\\ No newline at end of file'))

  return [
    `--- local/${path}`,
    `+++ incoming/${path}`,
    `@@ -${range(oldEnd)} +${range(newEnd)} @@`,
    ...lines(before, oldEnd, '-'),
    ...lines(after, newEnd, '+')
  ].join('\n')
}

const getConflictMode = (options: LumenAddOptions) => (options.force ? 'overwrite' : (options.conflict ?? 'skip'))

const assertNoSymlinkSegments = async (cwd: string, path: string): Promise<void> => {
  let current = resolve(cwd)

  for (const segment of path.split('/')) {
    current = join(current, segment)

    try {
      const details = await lstat(current)

      if (details.isSymbolicLink()) {
        throw new Error(`Refusing to write through a symbolic link: ${path}`)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return

      throw error
    }
  }
}

const validateInstallFiles = async (
  files: LumenRecipeFile[],
  cwd: string
): Promise<void> => {
  const paths = new Set<string>()

  for (const file of files) {
    assertSafeRegistryFilePath(file.path)

    if (paths.has(file.path)) {
      throw new Error(`Duplicate Lumen registry file path: ${file.path}`)
    }

    paths.add(file.path)

    await assertNoSymlinkSegments(cwd, file.path)
  }
}

const validateInstallConflicts = async (
  files: readonly LumenRecipeFile[],
  cwd: string,
  conflict: NonNullable<LumenAddOptions['conflict']>
): Promise<void> => {
  if (conflict !== 'error') return

  for (const file of files) {
    if (await fileExists(join(cwd, file.path))) {
      throw new Error(`Refusing to overwrite existing file: ${file.path}`)
    }
  }
}

type InstallFileOutcome = 'added' | 'merged' | 'skipped' | { path: string, diff: string }

const handleExistingFile = async (
  file: LumenRecipeFile,
  target: string,
  options: LumenAddOptions,
  conflict: NonNullable<LumenAddOptions['conflict']>
): Promise<InstallFileOutcome> => {
  if (conflict === 'error') throw new Error(`Refusing to overwrite existing file: ${file.path}`)

  if (conflict === 'skip') return 'skipped'

  const existing = await readFile(target, 'utf8')

  if (existing === file.source) return 'skipped'

  const input = { existing, incoming: file.source, path: file.path }

  if (!options.merge) return { path: file.path, diff: diffSource(input) }

  const merged = options.merge(input)

  if (!options.dryRun) await writeFile(target, merged, 'utf8')

  return 'merged'
}

const installRegistryFile = async (
  file: LumenRecipeFile,
  cwd: string,
  options: LumenAddOptions,
  conflict: NonNullable<LumenAddOptions['conflict']>
): Promise<InstallFileOutcome> => {
  const target = join(cwd, file.path)

  if (options.dryRun) {
    if (conflict === 'overwrite' || !(await fileExists(target))) return 'added'

    return handleExistingFile(file, target, options, conflict)
  }

  await mkdir(dirname(target), { recursive: true })

  try {
    await writeFile(target, file.source, { encoding: 'utf8', flag: conflict === 'overwrite' ? 'w' : 'wx' })

    return 'added'
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error

    return handleExistingFile(file, target, options, conflict)
  }
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

  await validateInstallFiles(files, cwd)

  const added: string[] = []
  const conflict = getConflictMode(options)

  await validateInstallConflicts(files, cwd, conflict)

  const conflicts: LumenAddResult['conflicts'] = []
  const merged: string[] = []
  const skipped: string[] = []

  for (const file of files) {
    const outcome = await installRegistryFile(file, cwd, options, conflict)

    if (typeof outcome !== 'string') {
      conflicts.push(outcome)

      continue
    }

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
    conflicts,
    dryRun: Boolean(options.dryRun),
    files: files.map(file => file.path),
    item,
    merged,
    skipped
  }
}

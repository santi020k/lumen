import { constants, type Stats } from 'node:fs'
import { lstat, mkdir, open, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { lumenComponentNames } from '@santi020k/lumen-core'

import { componentCssName, getComponentEntry } from './component-delivery.js'
import {
  getLumenRegistryItem,
  type LumenRegistry,
  lumenRegistry,
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
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []

    throw error
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
  if (!['astro', 'elements', 'react'].includes(target)) throw new Error('Unknown Lumen install target')

  if (item.type === 'component') return [createComponentFile(item.name, target)]

  const inlineFiles =
    item.files
      ?.filter((file): file is LumenRegistryFile => typeof file !== 'string')
      .map(file => ({
        path: file.path,
        source: file.source
      })) ?? []

  if (inlineFiles.length > 0) return inlineFiles

  // Only packaged catalog entries can select a bundled template directory.
  const bundled = lumenRegistry.items.find(entry => entry.name === item.name && entry.type === item.type)

  if (bundled) {
    const files = await loadRecipeTemplateFiles(bundled.name, target)

    if (files) return files
  }

  if (item.type === 'recipe') {
    throw new Error(`Registry recipe "${item.name}" does not have ${target} starter files yet.`)
  }

  return []
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

type ConflictMode = NonNullable<LumenAddOptions['conflict']>

const assertFileTarget = (details: Stats, path: string, conflict: ConflictMode): void => {
  if (!details.isFile()) throw new Error(`Expected a regular file at: ${path}`)

  if (details.nlink > 1 && (conflict === 'overwrite' || conflict === 'merge')) {
    throw new Error(`Refusing to modify or read a hard-linked file: ${path}`)
  }
}

const inspectInstallPath = async (cwd: string, path: string, conflict: ConflictMode): Promise<boolean> => {
  let current = resolve(cwd)
  const target = join(current, path)

  for (const segment of path.split('/')) {
    current = join(current, segment)

    try {
      const details = await lstat(current)

      if (details.isSymbolicLink()) throw new Error(`Refusing to write through a symbolic link: ${path}`)

      if (current === target) {
        assertFileTarget(details, path, conflict)
      } else if (!details.isDirectory()) {
        throw new Error(`Expected a directory above: ${path}`)
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false

      throw error
    }
  }

  return true
}

const validateInstallFiles = async (
  files: readonly LumenRecipeFile[],
  cwd: string,
  conflict: ConflictMode
): Promise<void> => {
  // A trailing slash sorts a file immediately before any descendants, even beside "a-other".
  const paths = files.map(file => file.path.normalize('NFC').toLowerCase() + '/').sort()
  let previous = ''

  for (const path of paths) {
    if (path === previous) throw new Error(`Duplicate Lumen registry file path: ${path.slice(0, -1)}`)

    if (previous && path.startsWith(previous)) {
      throw new Error(`Registry path is both a file and a directory: ${previous.slice(0, -1)}`)
    }

    previous = path
  }

  for (const file of files) {
    assertSafeRegistryFilePath(file.path)

    if (await inspectInstallPath(cwd, file.path, conflict) && conflict === 'error') {
      throw new Error(`Refusing to overwrite existing file: ${file.path}`)
    }
  }
}

type InstallFileOutcome = 'added' | 'merged' | 'skipped' | { path: string, diff: string }

const writeExistingFile = async (target: string, source: string, expected?: Stats): Promise<void> => {
  // Check the opened file before writing, without following or truncating a replacement link.
  const handle = await open(target, constants.O_WRONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)

  try {
    const details = await handle.stat()

    assertFileTarget(details, target, 'overwrite')

    if (expected && (
      expected.dev !== details.dev || expected.ino !== details.ino || expected.ctimeMs !== details.ctimeMs
    )) {
      throw new Error(`File changed while resolving merge: ${target}`)
    }

    await handle.writeFile(source, 'utf8')

    await handle.truncate(Buffer.byteLength(source))
  } finally {
    await handle.close()
  }
}

const handleExistingFile = async (
  file: LumenRecipeFile,
  target: string,
  options: LumenAddOptions,
  conflict: ConflictMode
): Promise<InstallFileOutcome> => {
  if (conflict === 'error') throw new Error(`Refusing to overwrite existing file: ${file.path}`)

  if (conflict === 'skip') return 'skipped'

  if (conflict === 'overwrite') {
    if (!options.dryRun) await writeExistingFile(target, file.source)

    return 'added'
  }

  const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)

  try {
    const details = await handle.stat()

    assertFileTarget(details, file.path, conflict)

    const existing = await handle.readFile('utf8')

    if (existing === file.source) return 'skipped'

    const input = { existing, incoming: file.source, path: file.path }

    if (!options.merge) return { path: file.path, diff: diffSource(input) }

    const merged = options.merge(input)

    if (!options.dryRun) await writeExistingFile(target, merged, details)

    return 'merged'
  } finally {
    await handle.close()
  }
}

const installRegistryFile = async (
  file: LumenRecipeFile,
  cwd: string,
  options: LumenAddOptions,
  conflict: ConflictMode
): Promise<InstallFileOutcome> => {
  const target = join(cwd, file.path)

  if (await inspectInstallPath(cwd, file.path, conflict)) {
    return handleExistingFile(file, target, options, conflict)
  }

  if (options.dryRun) return 'added'

  await mkdir(dirname(target), { recursive: true })

  try {
    await writeFile(target, file.source, { encoding: 'utf8', flag: 'wx' })

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

  const conflict = getConflictMode(options)

  await validateInstallFiles(files, cwd, conflict)

  const added: string[] = []
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

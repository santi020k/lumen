import { lumenComponentNames } from '@santi020k/lumen-core'
import { createSourceFile, type ImportDeclaration, isImportDeclaration, isNamedImports, isStringLiteral, ScriptKind, ScriptTarget, type SourceFile, SyntaxKind } from 'typescript'

import { componentDeliveryEntries } from './component-delivery.js'
import { findMarkupTagEnd } from './v2-migration.js'

const componentName = (name: string): string | undefined => {
  const candidate = name.startsWith('defineLumen') ? name.slice(11) : name
  const canonical = candidate.startsWith('Lumen') && candidate.endsWith('Element') ? candidate.slice(5, -7) : candidate

  return lumenComponentNames.some(component => component === canonical) ? canonical : undefined
}

type Adapter = 'astro' | 'elements' | 'react'

interface ValueImport {
  defaultImport: boolean
  named: string[]
  path: string
}

const valueImport = (statement: ImportDeclaration): ValueImport[] => {
  const clause = statement.importClause

  if (!clause || clause.phaseModifier === SyntaxKind.TypeKeyword) return []

  if (!isStringLiteral(statement.moduleSpecifier)) return []

  const bindings = clause.namedBindings

  const named = bindings && isNamedImports(bindings) ?
    bindings.elements.filter(binding => !binding.isTypeOnly)
      .map(binding => (binding.propertyName ?? binding.name).text) :
    []

  return [{ defaultImport: Boolean(clause.name), named, path: statement.moduleSpecifier.text }]
}

const componentsFromImport = (entry: ValueImport, framework: Adapter, root: string): string[] => {
  const prefix = root + '/components/'

  if (entry.path !== root && !entry.path.startsWith(prefix)) return []

  const names = entry.named.map(componentName).filter(name => name !== undefined)

  if (entry.path === root) return names

  const subpath = entry.path.slice(prefix.length)

  if (framework === 'astro') {
    const name = componentName(subpath.replace(/\.astro$/u, ''))

    return entry.defaultImport && name ? [name] : []
  }

  return names.filter(name => componentDeliveryEntries[framework][name] === subpath)
}

const adapterImports = (entries: readonly ValueImport[], framework: Adapter) => {
  const root = `@santi020k/lumen-${framework}`

  return {
    components: [...new Set(entries.flatMap(entry => componentsFromImport(entry, framework, root)))],
    rootNames: [...new Set(entries.filter(entry => entry.path === root).flatMap(entry => entry.named))]
  }
}

const parseConsumer = (body: string): SourceFile | undefined => {
  try {
    return createSourceFile('consumer.tsx', body, ScriptTarget.Latest, false, ScriptKind.TSX)
  } catch (error: unknown) {
    if (!(error instanceof RangeError)) throw error

    return undefined
  }
}

const scriptImports = (body: string, leadingOnly: boolean): ValueImport[] => {
  if (!body.includes('import')) return []

  const parsed = parseConsumer(body)
  const entries: ValueImport[] = []

  for (const statement of parsed?.statements ?? []) {
    if (isImportDeclaration(statement)) entries.push(...valueImport(statement))
    else if (leadingOnly) break
  }

  return entries
}

const htmlImports = (source: string): ValueImport[] => {
  const lower = source.toLowerCase()
  const imports: ValueImport[] = []
  let cursor = 0

  while (cursor < source.length) {
    const start = lower.indexOf('<', cursor)

    if (start < 0) break

    if (lower.startsWith('<!--', start)) {
      const end = lower.indexOf('-->', start + 4)

      cursor = end < 0 ? source.length : end + 3

      continue
    }

    cursor = start + 1

    if (!lower.startsWith('<script', start) || !/[\s>]/u.test(lower[start + 7] ?? '')) continue

    const openingEnd = findMarkupTagEnd(source, start + 7)
    const closing = lower.indexOf('</script', openingEnd)

    if (openingEnd < 0 || closing < 0) break

    imports.push(...scriptImports(source.slice(openingEnd + 1, closing), false))

    cursor = closing + 8
  }

  return imports
}

export const readComponentImports = (source: string, file = '') => {
  const trimmed = source.trimStart()
  const opening = /^---[ \t]*\r?(?:\n|$)/u.exec(trimmed)
  const script = opening ? trimmed.slice(opening[0].length) : source
  const end = opening ? /^---[ \t]*\r?$/mu.exec(script)?.index : undefined
  const body = script.slice(0, end)
  // Loose Astro snippets can begin with imports. Markup and HTML comments cannot declare components.
  const entries = /\.html?$/u.test(file) ? htmlImports(source) : scriptImports(body, !opening && file.endsWith('.astro'))

  return {
    astro: adapterImports(entries, 'astro'),
    elements: adapterImports(entries, 'elements'),
    react: adapterImports(entries, 'react')
  }
}

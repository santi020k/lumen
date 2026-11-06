import { lumenComponentNames } from '@santi020k/lumen-core'
import { createSourceFile, type ImportDeclaration, isImportDeclaration, isNamedImports, isStringLiteral, ScriptKind, ScriptTarget, type SourceFile, SyntaxKind } from 'typescript'

import { componentDeliveryEntries } from './component-delivery.js'

const componentName = (name: string): string | undefined => {
  const canonical = name.startsWith('Lumen') && name.endsWith('Element') ? name.slice(5, -7) : name

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

export const readComponentImports = (source: string) => {
  const end = source.indexOf('\n---', 3)
  const body = source.startsWith('---') ? source.slice(3, end < 0 ? undefined : end) : source
  const statements = body.includes('import') ? parseConsumer(body)?.statements.filter(isImportDeclaration) : undefined
  const entries = statements?.flatMap(valueImport) ?? []

  return {
    astro: adapterImports(entries, 'astro'),
    elements: adapterImports(entries, 'elements'),
    react: adapterImports(entries, 'react')
  }
}

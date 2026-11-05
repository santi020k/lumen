import { lumenComponentNames } from '@santi020k/lumen-core'
import { createSourceFile, type ImportDeclaration, isImportDeclaration, isNamedImports, isStringLiteral, ScriptKind, ScriptTarget, type SourceFile, SyntaxKind } from 'typescript'

import { componentDeliveryEntries } from './component-delivery.js'

const componentName = (name: string): string | undefined => {
  const canonical = name.startsWith('Lumen') && name.endsWith('Element') ? name.slice(5, -7) : name

  return lumenComponentNames.some(component => component === canonical) ? canonical : undefined
}

const namedComponents = (
  statement: ImportDeclaration, framework: 'astro' | 'elements' | 'react', path: string, root: string
): string[] => {
  const clause = statement.importClause

  if (!clause) return []

  const bindings = clause.namedBindings

  if (!bindings || !isNamedImports(bindings)) return []

  return bindings.elements.filter(binding => !binding.isTypeOnly).flatMap(binding => {
    const name = componentName((binding.propertyName ?? binding.name).text)

    if (!name) return []

    if (path === root) return [name]

    if (framework === 'astro') return []

    return componentDeliveryEntries[framework][name] === path.slice((root + '/components/').length) ? [name] : []
  })
}

const namesFromImport = (statement: ImportDeclaration, framework: 'astro' | 'elements' | 'react'): string[] => {
  if (!isStringLiteral(statement.moduleSpecifier)) return []

  const path = statement.moduleSpecifier.text
  const clause = statement.importClause
  const root = `@santi020k/lumen-${framework}`

  if (!clause || clause.phaseModifier === SyntaxKind.TypeKeyword) return []

  if (path !== root && !path.startsWith(root + '/components/')) return []

  if (framework === 'astro' && path.startsWith(root + '/components/') && clause.name) {
    const name = componentName(path.slice((root + '/components/').length).replace(/\.astro$/u, ''))

    return name ? [name] : []
  }

  return namedComponents(statement, framework, path, root)
}

const parseConsumer = (body: string): SourceFile | undefined => {
  try {
    return createSourceFile('consumer.tsx', body, ScriptTarget.Latest, false, ScriptKind.TSX)
  } catch (error: unknown) {
    if (!(error instanceof RangeError)) throw error

    return undefined
  }
}

export const importedComponents = (source: string, framework: 'astro' | 'elements' | 'react'): string[] => {
  const end = source.indexOf('\n---', 3)
  const body = source.startsWith('---') ? source.slice(3, end < 0 ? undefined : end) : source
  const parsed = parseConsumer(body)

  if (!parsed) return []

  const names = parsed.statements.filter(isImportDeclaration)
    .flatMap(statement => namesFromImport(statement, framework))

  return [...new Set(names)]
}

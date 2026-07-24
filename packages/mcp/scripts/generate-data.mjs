// Build-time snapshot generator for the Lumen MCP server.
//
// Reads the authoritative sources in the monorepo (component catalog, Astro
// component files, design tokens, registry manifest, and llms.txt agent rules)
// and writes a single self-contained JSON payload the published server reads at
// runtime. This keeps @santi020k/lumen-mcp installable without the whole repo.

import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const scriptDir = dirname(fileURLToPath(import.meta.url))

const findRepoRoot = async (start) => {
  let dir = start

  for (let depth = 0; depth < 10; depth += 1) {
    try {
      await access(join(dir, 'pnpm-workspace.yaml'))

      return dir
    } catch {
      const parent = dirname(dir)

      if (parent === dir) break

      dir = parent
    }
  }

  throw new Error('Could not locate repo root (pnpm-workspace.yaml).')
}

const exists = async (path) => {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

const readIfExists = async (path) => (await exists(path)) ? readFile(path, 'utf8') : ''

// Extract the quoted entries of `export const lumenComponentNames = [ ... ]`.
const parseComponentNames = (source) => {
  const match = source.match(/lumenComponentNames\s*=\s*\[([\s\S]*?)\]\s*as const/)

  if (!match) return []

  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

// Parse a `key: 'value'` object literal block into a record.
const parseTokenBlock = (source, identifier) => {
  const startStr = `${identifier} = {`
  const startIndex = source.indexOf(startStr)
  
  if (startIndex === -1) return {}
  
  const endStr = `} as const`
  const endIndex = source.indexOf(endStr, startIndex)
  
  if (endIndex === -1) return {}

  const block = source.slice(startIndex + startStr.length, endIndex)
  const out = {}

  for (const entry of block.matchAll(/(\w+)\s*:\s*'([^']*)'/g)) {
    out[entry[1]] = entry[2]
  }

  return out
}

// Pull the `interface Props { ... }` body out of Astro frontmatter and turn it
// into a compact list of { name, optional, type } records.
const parseProps = (source) => {
  let extendsClause = null
  let body = ''
  const interfaceStart = source.indexOf('interface Props')
  
  if (interfaceStart === -1) {
    const typeStart = source.indexOf('type Props')
    
    if (typeStart !== -1) {
      const braceStart = source.indexOf('{', typeStart)
      const end = source.indexOf('\n}', braceStart)
      
      if (braceStart !== -1 && end !== -1) {
        const between = source.slice(typeStart + 10, braceStart).trim()
        
        if (between.startsWith('=') && between.endsWith('&')) {
          extendsClause = between.slice(1, -1).trim()
        }
        
        body = source.slice(braceStart + 1, end)
      }
    }
  } else {
    const braceStart = source.indexOf('{', interfaceStart)
    const end = source.indexOf('\n}', braceStart)
    
    if (braceStart !== -1 && end !== -1) {
      const between = source.slice(interfaceStart + 15, braceStart).trim()
      
      if (between.startsWith('extends ')) {
        extendsClause = between.slice(8).trim()
      }
      
      body = source.slice(braceStart + 1, end)
    }
  }

  if (!body) return { extends: null, props: [] }

  const props = []

  for (const line of body.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue

    const m = trimmed.match(/^([A-Za-z_][\w-]*)(\?)?\s*:\s*(.+?);?$/)

    if (!m) continue

    props.push({ name: m[1], optional: Boolean(m[2]), type: m[3].trim() })
  }

  return { extends: extendsClause, props }
}

const toKebab = (name) =>
  name.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').replaceAll(/[\s_]+/g, '-').toLowerCase()

const parseMemberProps = (members, sourceFile) => members.flatMap((member) => {
  if (!ts.isPropertySignature(member) || !member.name || !member.type) return []

  const name = member.name.getText(sourceFile).replaceAll(/['"]/g, '')

  return [{
    name,
    optional: Boolean(member.questionToken),
    type: member.type.getText(sourceFile)
  }]
})

const parseTypeScriptProps = (declaration, sourceFile) => {
  if (!declaration) return { extends: null, props: [] }

  if (ts.isInterfaceDeclaration(declaration)) {
    const extended = declaration.heritageClauses
      ?.flatMap((clause) => clause.types.map((type) => type.getText(sourceFile)))
      .join(', ') || null

    return {
      extends: extended,
      props: parseMemberProps(declaration.members, sourceFile)
    }
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    const parts = ts.isIntersectionTypeNode(declaration.type)
      ? [...declaration.type.types]
      : [declaration.type]

    const literals = parts.filter(ts.isTypeLiteralNode)

    const extended = parts
      .filter((part) => !ts.isTypeLiteralNode(part))
      .map((part) => part.getText(sourceFile))
      .join(' & ') || null

    return {
      extends: extended,
      props: literals.flatMap((literal) => parseMemberProps(literal.members, sourceFile))
    }
  }

  return { extends: null, props: [] }
}

const processReactStatement = (statement, componentNameSet, componentDeclarations, propDeclarations) => {
  if (
    (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
    statement.name.text.endsWith('Props')
  ) {
    propDeclarations.set(statement.name.text.slice(0, -5), statement)
  }

  if (ts.isFunctionDeclaration(statement) && statement.name && componentNameSet.has(statement.name.text)) {
    componentDeclarations.set(statement.name.text, statement)
  }

  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && componentNameSet.has(declaration.name.text)) {
        componentDeclarations.set(declaration.name.text, statement)
      }
    }
  }
}

const parseReactComponents = (source, componentNames) => {
  const sourceFile = ts.createSourceFile('components.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const componentNameSet = new Set(componentNames)
  const componentDeclarations = new Map()
  const propDeclarations = new Map()

  for (const statement of sourceFile.statements) {
    processReactStatement(statement, componentNameSet, componentDeclarations, propDeclarations)
  }

  return new Map(componentNames.map((name) => {
    const componentDeclaration = componentDeclarations.get(name)
    const propsDeclaration = propDeclarations.get(name)
    const props = parseTypeScriptProps(propsDeclaration, sourceFile)

    const snippets = [propsDeclaration, componentDeclaration]
      .filter(Boolean)
      .map((declaration) => declaration.getText(sourceFile))

    return [name, {
      available: Boolean(componentDeclaration),
      props,
      source: snippets.join('\n\n')
    }]
  }))
}

const propertyName = (property, sourceFile) =>
  property.name?.getText(sourceFile).replaceAll(/['"]/g, '')

const unwrapExpression = (expression) => {
  let current = expression

  while (
    ts.isAsExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression
  }

  return current
}

const processElementConfigProperty = (property, sourceFile) => {
  if (!ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer)) return null

  const name = propertyName(property, sourceFile)
  const config = property.initializer

  const tagNameProperty = config.properties.find((entry) =>
    ts.isPropertyAssignment(entry) && propertyName(entry, sourceFile) === 'tagName')

  const tagName = tagNameProperty &&
    ts.isPropertyAssignment(tagNameProperty) &&
    ts.isStringLiteral(tagNameProperty.initializer)
    ? tagNameProperty.initializer.text
    : `lumen-${toKebab(name)}`

  const attributes = config.properties.flatMap((entry) => {
    if (
      !ts.isPropertyAssignment(entry) ||
      !ts.isObjectLiteralExpression(entry.initializer) ||
      !['attributeClasses', 'defaults'].includes(propertyName(entry, sourceFile))
    ) return []

    return entry.initializer.properties
      .map((attribute) => propertyName(attribute, sourceFile))
      .filter(Boolean)
  })

  return { config: { attributes: [...new Set(attributes)].sort(), source: property.getText(sourceFile), tagName }, name }
}

const parseElementComponents = (source, componentNames) => {
  const sourceFile = ts.createSourceFile('define.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const entries = new Map()

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue

    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer && unwrapExpression(declaration.initializer)

      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== 'elementConfigs' ||
        !initializer ||
        !ts.isObjectLiteralExpression(initializer)
      ) continue

      for (const property of initializer.properties) {
        const result = processElementConfigProperty(property, sourceFile)

        if (result) entries.set(result.name, result.config)
      }
    }
  }

  return new Map(componentNames.map((name) => [
    name,
    entries.get(name) ?? {
      attributes: [],
      source: '',
      tagName: `lumen-${toKebab(name)}`
    }
  ]))
}

const loadDocsData = async (source) => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText

  const dataUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`

  return import(dataUrl)
}

const componentNamesFromExample = (example, componentNames) => {
  const available = new Set(componentNames)

  return [...example.matchAll(/<\/?([A-Z][A-Za-z0-9]*)\b/g)]
    .map((match) => match[1])
    .filter((name, index, names) => available.has(name) && names.indexOf(name) === index)
}

const toReactExample = (example) => example
  .replaceAll(/\bclass=/g, 'className=')
  .replaceAll(/\bfor=/g, 'htmlFor=')
  .replaceAll(/\bdatetime=/g, 'dateTime=')
  .replaceAll(/\binputmode=/g, 'inputMode=')
  .replaceAll(/\bcontenteditable=/g, 'contentEditable=')
  .replaceAll(/\bstroke-width=/g, 'strokeWidth=')

const buildFrameworkDetails = ({
  astroSource,
  componentNames,
  doc,
  element,
  hasAstro,
  name,
  parsedAstro,
  react
}) => {
  const exampleNames = componentNamesFromExample(doc.example, componentNames)
  const imports = exampleNames.length > 0 ? exampleNames : [name]

  return {
    astro: {
      available: hasAstro,
      example: doc.example,
      importStatement: `import { ${imports.join(', ')} } from '@santi020k/lumen-astro'`,
      language: 'astro',
      packageName: '@santi020k/lumen-astro',
      props: parsedAstro.props,
      propsExtends: parsedAstro.extends,
      source: astroSource,
      styleImport: "import '@santi020k/lumen-astro/styles.css'"
    },
    elements: {
      attributes: [...new Set([
        ...element.attributes,
        ...doc.apiReference.map((row) => row.attribute)
      ])],
      available: Boolean(element.source),
      example: `<${element.tagName}></${element.tagName}>`,
      importStatement: "import { defineLumenElements } from '@santi020k/lumen-elements/define'",
      language: 'html',
      packageName: '@santi020k/lumen-elements',
      props: [],
      propsExtends: 'HTMLElement attributes',
      registration: 'defineLumenElements()',
      source: element.source,
      styleImport: "import '@santi020k/lumen-elements/styles.css'",
      tagName: element.tagName
    },
    react: {
      available: react.available,
      example: toReactExample(doc.example),
      importStatement: `import { ${imports.join(', ')} } from '@santi020k/lumen-react'`,
      language: 'tsx',
      packageName: '@santi020k/lumen-react',
      props: react.props.props,
      propsExtends: react.props.extends,
      source: react.source,
      styleImport: "import '@santi020k/lumen-react/styles.css'"
    }
  }
}

const keywordsForComponent = (doc, collections) => [...new Set(
  [
    doc.name,
    doc.category,
    doc.summary,
    doc.guidance?.when,
    doc.guidance?.distinction,
    ...collections.flatMap((collection) => [collection.title, collection.description])
  ]
    .filter(Boolean)
    .flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/))
    .filter((value) => value.length > 2)
)].sort()

const main = async () => {
  const repoRoot = await findRepoRoot(scriptDir)
  const p = (...parts) => resolve(repoRoot, ...parts)
  const componentsSource = await readIfExists(p('packages/core/src/components.ts'))
  const tokensSource = await readIfExists(p('packages/core/src/tokens.ts'))
  const rules = await readIfExists(p('llms.txt'))
  const readme = await readIfExists(p('README.md'))
  const aiUsage = await readIfExists(p('docs/ai-usage.md'))
  const docsSource = await readIfExists(p('apps/docs/src/data/docs.ts'))
  const packageJson = JSON.parse(await readFile(resolve(scriptDir, '..', 'package.json'), 'utf8'))
  let registry = { items: [] }

  try {
    registry = JSON.parse(await readFile(p('registry/lumen.registry.json'), 'utf8'))
  } catch {
    // registry optional for the snapshot
  }

  const names = parseComponentNames(componentsSource)
  const docsData = await loadDocsData(docsSource)
  const docsByComponent = new Map(docsData.componentDocs.map((doc) => [doc.name, doc]))
  const registryComponents = new Map((registry.components ?? []).map((component) => [component.name, component]))
  const colors = parseTokenBlock(tokensSource, 'lumenColors')
  const glass = parseTokenBlock(tokensSource, 'lumenGlass')

  const semanticTokens = [
    'canvas', 'surface', 'surface-muted', 'surface-strong', 'line',
    'ink', 'ink-soft', 'ink-muted', 'brand', 'brand-solid', 'brand-soft',
    'accent', 'success', 'warning', 'danger'
  ]

  const astroDir = p('packages/astro/components')

  const astroFiles = new Set(
    (await exists(astroDir)) ? (await readdir(astroDir)).filter((f) => f.endsWith('.astro')) : []
  )

  const reactSource = await readIfExists(p('packages/react/src/components.tsx'))
  const elementsSource = await readIfExists(p('packages/elements/src/define.ts'))
  const reactComponents = parseReactComponents(reactSource, names)
  const elementComponents = parseElementComponents(elementsSource, names)
  // Map recipe / component-set membership per component name.
  const recipesByComponent = new Map()

  for (const item of registry.items ?? []) {
    for (const componentName of item.components ?? []) {
      const list = recipesByComponent.get(componentName) ?? []

      list.push({ name: item.name, type: item.type })

      recipesByComponent.set(componentName, list)
    }
  }

const buildComponentData = async (name, ctx) => {
  const fileName = `${name}.astro`
  const hasAstro = ctx.astroFiles.has(fileName)
  const astroSource = hasAstro ? await readFile(join(ctx.astroDir, fileName), 'utf8') : ''
  const parsed = hasAstro ? parseProps(astroSource) : { extends: null, props: [] }
  const kebab = toKebab(name)
  const registryComponent = ctx.registryComponents.get(name) ?? {}

  const doc = ctx.docsByComponent.get(name) ?? {
    apiReference: [],
    category: registryComponent.category ?? 'Uncategorized',
    example: `<${name} />`,
    name,
    summary: registryComponent.description ?? `${name} component.`
  }

  const collections = ctx.docsData.componentCollections.filter((collection) => collection.names.includes(name))

  const frameworkDetails = buildFrameworkDetails({
    astroSource,
    componentNames: ctx.names,
    doc,
    element: ctx.elementComponents.get(name),
    hasAstro,
    name,
    parsedAstro: parsed,
    react: ctx.reactComponents.get(name)
  })

  return {
    apiReference: doc.apiReference,
    astroSource,
    category: doc.category,
    collections: collections.map((collection) => collection.title),
    dependencies: registryComponent.dependencies ?? [],
    description: doc.summary,
    files: registryComponent.files ?? [],
    frameworkDetails,
    frameworks: {
      astro: hasAstro,
      elements: frameworkDetails.elements.available,
      react: frameworkDetails.react.available
    },
    guidance: doc.guidance ?? null,
    kebab,
    keyboardInteractions: doc.keyboardInteractions ?? [],
    keywords: keywordsForComponent(doc, collections),
    name,
    props: parsed.props,
    propsExtends: parsed.extends,
    recipes: ctx.recipesByComponent.get(name) ?? [],
    runtimeEvents: doc.runtimeEvents ?? []
  }
}

  const components = []
  
  const ctx = {
    astroDir,
    astroFiles,
    docsByComponent,
    docsData,
    elementComponents,
    names,
    reactComponents,
    recipesByComponent,
    registryComponents
  }

  for (const name of names) {
    components.push(await buildComponentData(name, ctx))
  }

  const componentMap = new Map(components.map((component) => [component.name, component]))

  const recipes = (registry.items ?? [])
    .filter((item) => item.type === 'recipe' || item.type === 'component-set')
    .map((item) => {
      const recipeComponents = (item.components ?? []).map((name) => componentMap.get(name)).filter(Boolean)
      const categories = [...new Set(recipeComponents.map((component) => component.category))].sort()

      return {
        ...item,
        categories,
        description: item.type === 'component-set'
          ? 'The complete Lumen component catalog and shared runtime foundation.'
          : `${/^[aeiou]/i.test(item.name) ? 'An' : 'A'} ${item.name.replaceAll('-', ' ')} composition using ${recipeComponents.map((component) => component.name).join(', ')}.`,
        install: {
          astro: `lumen add ${item.name} --target astro`,
          elements: `lumen add ${item.name} --target elements`,
          react: `lumen add ${item.name} --target react`
        }
      }
    })

  const payload = {
    components,
    docs: {
      aiUsage,
      readme
    },
    meta: {
      componentCount: components.length,
      packages: registry.packages ?? [
        '@santi020k/lumen-astro',
        '@santi020k/lumen-react',
        '@santi020k/lumen-elements',
        '@santi020k/lumen-core'
      ],
      registryName: registry.name ?? 'lumen',
      registryVersion: registry.version ?? 1,
      serverVersion: packageJson.version
    },
    recipes,
    rules,
    tokens: {
      colors,
      glass,
      semantic: semanticTokens,
      themeAttribute: 'data-theme'
    }
  }

  const outDir = resolve(scriptDir, '..', 'data')

  await mkdir(outDir, { recursive: true })

  await writeFile(join(outDir, 'lumen-data.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  process.stdout.write(
    `lumen-mcp: wrote data/lumen-data.json (${components.length} components, ` +
    `${Object.keys(colors).length} color tokens, ${rules.length} bytes of rules)\n`
  )
}

main().catch((error) => {
  process.stderr.write(String(error) + '\n')

  process.exitCode = 1
})

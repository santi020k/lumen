// Build-time snapshot generator for the Lumen MCP server.
//
// Reads the authoritative sources in the monorepo (component catalog, Astro
// component files, design tokens, registry manifest, and llms.txt agent rules)
// and writes a single self-contained JSON payload the published server reads at
// runtime. This keeps @santi020k/lumen-mcp installable without the whole repo.

import { createHash, randomUUID } from 'node:crypto'
import { access, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const scriptDir = dirname(fileURLToPath(import.meta.url))

const findRepoRoot = async start => {
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

const exists = async path => {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

const readIfExists = async path => ((await exists(path)) ? readFile(path, 'utf8') : '')

// Extract the quoted entries of `export const lumenComponentNames = [ ... ]`.
const parseComponentNames = source => {
  const match = source.match(/lumenComponentNames\s*=\s*\[([\s\S]*?)\]\s*as const/)

  if (!match) return []

  return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1])
}

const readQuotedProperty = (source, property) => new RegExp(`${property}:\\s*'([^']+)'`).exec(source)?.[1]

const parseComponentBehaviorEntry = entry => {
  const name = entry[1]
  const body = entry[2] ?? ''
  const astro = readQuotedProperty(body, 'astro')
  const elements = readQuotedProperty(body, 'elements')
  const react = readQuotedProperty(body, 'react')
  const astroRuntimeBypass = readQuotedProperty(body, 'astroRuntimeBypass')

  if (!name || !astro || !elements || !react) return []

  return [
    [
      name,
      {
        astro,
        ...(astroRuntimeBypass ? { astroRuntimeBypass } : {}),
        elements,
        react
      }
    ]
  ]
}

const parseComponentBehavior = source => {
  const match = source.match(/lumenComponentBehavior\s*=\s*\{([\s\S]*?)\}\s*as const satisfies/)

  if (!match) return new Map()

  return new Map(
    [...match[1].matchAll(/(\w+):\s*\{([^{}]+)\}/g)].flatMap(parseComponentBehaviorEntry)
  )
}

// Parse a `key: 'value'` object literal block into a record.
const parseTokenBlock = (source, identifier) => {
  const startStr = `${identifier} = {`
  const startIndex = source.indexOf(startStr)

  if (startIndex === -1) return {}

  const endStr = '} as const'
  const endIndex = source.indexOf(endStr, startIndex)

  if (endIndex === -1) return {}

  const block = source.slice(startIndex + startStr.length, endIndex)
  const out = {}

  for (const entry of block.matchAll(/(\w+)\s*:\s*'([^']*)'/g)) {
    out[entry[1]] = entry[2]
  }

  return out
}

const toCamel = value => value.replaceAll(/-([a-z0-9])/g, (_, character) => character.toUpperCase())

const parsePlatformColors = source => {
  if (!source) return {}

  const parsed = JSON.parse(source)
  const light = parsed.color?.light ?? {}

  return Object.fromEntries(
    Object.entries(light)
      .filter(([name]) => !name.startsWith('$'))
      .map(([name, token]) => [
        toCamel(name),
        token?.$extensions?.['com.santi020k.lumen']?.cssValue ?? token?.$value
      ])
      .filter(([, value]) => typeof value === 'string')
  )
}

// Pull the `interface Props { ... }` body out of Astro frontmatter and turn it
// into a compact list of { name, optional, type } records.
const extractInterfaceBody = source => {
  const interfaceStart = source.indexOf('interface Props')

  if (interfaceStart !== -1) {
    const braceStart = source.indexOf('{', interfaceStart)
    const end = source.indexOf('\n}', braceStart)

    if (braceStart !== -1 && end !== -1) {
      const between = source.slice(interfaceStart + 15, braceStart).trim()
      const extendsClause = between.startsWith('extends ') ? between.slice(8).trim() : null

      return { body: source.slice(braceStart + 1, end), extendsClause }
    }
  }

  return null
}

const extractTypeBody = source => {
  const typeStart = source.indexOf('type Props')

  if (typeStart !== -1) {
    const braceStart = source.indexOf('{', typeStart)
    const end = source.indexOf('\n}', braceStart)

    if (braceStart !== -1 && end !== -1) {
      const between = source.slice(typeStart + 10, braceStart).trim()

      const extendsClause =
        between.startsWith('=') && between.endsWith('&') ? between.slice(1, -1).trim() : null

      return { body: source.slice(braceStart + 1, end), extendsClause }
    }
  }

  return null
}

const parseProps = source => {
  const extracted = extractInterfaceBody(source) || extractTypeBody(source)

  if (!extracted?.body) return { extends: null, props: [] }

  const props = []

  for (const line of extracted.body.split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*'))
      continue

    const m = trimmed.match(/^([A-Za-z_][\w-]*)(\?)?\s*:\s*(.+?);?$/)

    if (m) props.push({ name: m[1], optional: Boolean(m[2]), type: m[3].trim() })
  }

  return { extends: extracted.extendsClause, props }
}

const toKebab = name => name
  .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replaceAll(/[\s_]+/g, '-')
  .toLowerCase()

const parseMemberProps = (members, sourceFile) => members.flatMap(member => {
  if (!ts.isPropertySignature(member) || !member.name || !member.type) return []

  const name = member.name.getText(sourceFile).replaceAll(/['"]/g, '')

  return [
    {
      name,
      optional: Boolean(member.questionToken),
      type: member.type.getText(sourceFile)
    }
  ]
})

const parseTypeScriptProps = (declaration, sourceFile) => {
  if (!declaration) return { extends: null, props: [] }

  if (ts.isInterfaceDeclaration(declaration)) {
    const extended =
      declaration.heritageClauses
        ?.flatMap(clause => clause.types.map(type => type.getText(sourceFile)))
        .join(', ') || null

    return {
      extends: extended,
      props: parseMemberProps(declaration.members, sourceFile)
    }
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    const parts = ts.isIntersectionTypeNode(declaration.type) ?
      [...declaration.type.types] :
      [declaration.type]

    const literals = parts.filter(ts.isTypeLiteralNode)

    const extended =
      parts
        .filter(part => !ts.isTypeLiteralNode(part))
        .map(part => part.getText(sourceFile))
        .join(' & ') || null

    return {
      extends: extended,
      props: literals.flatMap(literal => parseMemberProps(literal.members, sourceFile))
    }
  }

  return { extends: null, props: [] }
}

const processTypeStatement = (statement, propDeclarations) => {
  if (
    (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
    statement.name.text.endsWith('Props')
  ) {
    propDeclarations.set(statement.name.text.slice(0, -5), statement)
  }
}

const processFunctionStatement = (statement, componentNameSet, componentDeclarations) => {
  if (
    ts.isFunctionDeclaration(statement) &&
    statement.name &&
    componentNameSet.has(statement.name.text)
  ) {
    componentDeclarations.set(statement.name.text, statement)
  }
}

const processVariableStatement = (statement, componentNameSet, componentDeclarations) => {
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && componentNameSet.has(declaration.name.text)) {
        componentDeclarations.set(declaration.name.text, statement)
      }
    }
  }
}

const processReactStatement = (
  statement,
  componentNameSet,
  componentDeclarations,
  propDeclarations
) => {
  processTypeStatement(statement, propDeclarations)

  processFunctionStatement(statement, componentNameSet, componentDeclarations)

  processVariableStatement(statement, componentNameSet, componentDeclarations)
}

const parseReactComponents = (source, componentNames) => {
  const sourceFile = ts.createSourceFile(
    'components.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  const componentNameSet = new Set(componentNames)
  const componentDeclarations = new Map()
  const propDeclarations = new Map()

  for (const statement of sourceFile.statements) {
    processReactStatement(statement, componentNameSet, componentDeclarations, propDeclarations)
  }

  return new Map(
    componentNames.map(name => {
      const componentDeclaration = componentDeclarations.get(name)
      const propsDeclaration = propDeclarations.get(name)
      const props = parseTypeScriptProps(propsDeclaration, sourceFile)

      const snippets = [propsDeclaration, componentDeclaration]
        .filter(Boolean)
        .map(declaration => declaration.getText(sourceFile))

      return [
        name,
        {
          available: Boolean(componentDeclaration),
          props,
          source: snippets.join('\n\n')
        }
      ]
    })
  )
}

const propertyName = (property, sourceFile) => property.name?.getText(sourceFile).replaceAll(/['"]/g, '')

const unwrapExpression = expression => {
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
  if (!ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer))
    return null

  const name = propertyName(property, sourceFile)
  const config = property.initializer

  const tagNameProperty = config.properties.find(
    entry => ts.isPropertyAssignment(entry) && propertyName(entry, sourceFile) === 'tagName'
  )

  const tagName =
    tagNameProperty &&
    ts.isPropertyAssignment(tagNameProperty) &&
    ts.isStringLiteral(tagNameProperty.initializer) ?
      tagNameProperty.initializer.text :
      `lumen-${toKebab(name)}`

  const attributes = config.properties.flatMap(entry => {
    if (
      !ts.isPropertyAssignment(entry) ||
      !ts.isObjectLiteralExpression(entry.initializer) ||
      !['attributeClasses', 'defaults'].includes(propertyName(entry, sourceFile))
    )
      return []

    return entry.initializer.properties
      .map(attribute => propertyName(attribute, sourceFile))
      .filter(Boolean)
  })

  return {
    config: {
      attributes: [...new Set(attributes)].sort(),
      source: property.getText(sourceFile),
      tagName
    },
    name
  }
}

const processElementStatement = (statement, entries, sourceFile) => {
  if (!ts.isVariableStatement(statement)) return

  for (const declaration of statement.declarationList.declarations) {
    const initializer = declaration.initializer && unwrapExpression(declaration.initializer)

    if (
      !ts.isIdentifier(declaration.name) ||
      declaration.name.text !== 'elementConfigs' ||
      !initializer ||
      !ts.isObjectLiteralExpression(initializer)
    )
      continue

    for (const property of initializer.properties) {
      const result = processElementConfigProperty(property, sourceFile)

      if (result) entries.set(result.name, result.config)
    }
  }
}

const parseElementComponents = (source, componentNames) => {
  const sourceFile = ts.createSourceFile(
    'define.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )

  const entries = new Map()

  for (const statement of sourceFile.statements) {
    processElementStatement(statement, entries, sourceFile)
  }

  return new Map(
    componentNames.map(name => [
      name,
      entries.get(name) ?? {
        attributes: [],
        source: '',
        tagName: `lumen-${toKebab(name)}`
      }
    ])
  )
}

const loadDocsData = async source => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText

  const dataUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`

  return import(dataUrl)
}

const componentNamesFromExample = example => [...example.matchAll(/<\/?([A-Z][A-Za-z0-9]*)\b/g)]
  .map(match => match[1])
  .filter((name, index, names) => names.indexOf(name) === index)

const reactStyleValue = value => {
  const properties = value
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .map(declaration => {
      const separator = declaration.indexOf(':')

      if (separator === -1) return ''

      const property = declaration
        .slice(0, separator)
        .trim()
        .replaceAll(/-([a-z])/g, (_, letter) => letter.toUpperCase())

      const propertyValue = declaration.slice(separator + 1).trim()

      return `${property}: '${propertyValue.replaceAll('\'', '\\\'')}'`
    })
    .filter(Boolean)

  return `style={{ ${properties.join(', ')} }}`
}

const toReactExample = example => example
  .replaceAll(/\bclass=/g, 'className=')
  .replaceAll(/\bfor=/g, 'htmlFor=')
  .replaceAll(/\bdatetime=/g, 'dateTime=')
  .replaceAll(/\binputmode=/g, 'inputMode=')
  .replaceAll(/\bcontenteditable=/g, 'contentEditable=')
  .replaceAll(/\bstroke-width=/g, 'strokeWidth=')
  .replaceAll(/style="([^"]*)"/g, (_, value) => reactStyleValue(value))

const reactExampleOverrides = {
  AnimatedPortrait:
    '<AnimatedPortrait><img src="/portrait.jpg" alt="Portrait of Ana" /></AnimatedPortrait>',
  ButtonLink:
    '<ButtonLink href="/docs">Read the docs <span aria-hidden="true">→</span></ButtonLink>',
  Combobox:
    '<Combobox label="Framework" list="framework-options" options={["Astro", "React", "Vue"]} placeholder="Search package" />',
  CoverImage:
    '<CoverImage showBottomGradient><Image src="/cover.jpg" alt="Abstract purple forms" /></CoverImage>',
  Image: '<Image alt="Lumen UI logo" invertOnDark src="/logo.svg" />',
  PhoneInput:
    '<PhoneInput name="phone" defaultCountryValue="+1" countries={[{ label: "+1", value: "+1" }, { label: "+44", value: "+44" }]} placeholder="(555) 000-0000" />',
  Tabs: `import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@santi020k/lumen-react'

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsPanel value="general">
        <p>General settings content.</p>
      </TabsPanel>
      <TabsPanel value="security">
        <p>Security settings content.</p>
      </TabsPanel>
    </Tabs>
  )
}`,
  VirtualList:
    '<VirtualList style={{ height: \'16rem\' }}><div>Row 1</div><div>Row 2</div></VirtualList>'
}

const reactHookByComponent = {
  AlertDialog: 'useDialog',
  Calendar: 'useCalendar',
  ContextMenu: 'useContextMenu',
  DateRangePicker: 'useDateRangePicker',
  Dialog: 'useDialog',
  Drawer: 'useDialog',
  DropdownMenu: 'useDropdownMenu',
  Field: 'useFormValidation',
  InputOTP: 'useInputOTP',
  Popover: 'usePopover',
  Resizable: 'useResizable',
  RichTextEditor: 'useRichTextEditor',
  Schedule: 'useSchedule',
  Select: 'useSelect',
  Sheet: 'useDialog',
  Tabs: 'useTabs',
  ThemeBuilder: 'useThemeBuilder',
  Toast: 'useToast',
  Tooltip: 'useTooltip'
}

const reactExampleForComponent = (name, hook, fallback) => {
  const override = Reflect.get(reactExampleOverrides, name)

  if (override) return override

  if (!hook) return toReactExample(fallback)

  if (name === 'AlertDialog') {
    return hook.code
      .replaceAll('ConfirmDialog', 'DestructiveActionDialog')
      .replaceAll('useDialog()', 'useDialog({ alert: true })')
      .replaceAll('<Dialog ', '<AlertDialog ')
      .replaceAll('</Dialog>', '</AlertDialog>')
      .replaceAll('Button, Dialog, Card', 'AlertDialog, Button, Card')
  }

  if (name === 'Drawer' || name === 'Sheet') {
    const example = hook.code
      .replaceAll('ConfirmDialog', `${name}Example`)
      .replaceAll('<Dialog ', `<${name} `)
      .replaceAll('</Dialog>', `</${name}>`)
      .replaceAll('Button, Dialog, Card', `Button, Card, ${name}`)

    return name === 'Drawer' ?
      example
        .replaceAll('Open dialog', 'Open filters')
        .replaceAll('Confirm action', 'Filters')
        .replaceAll(
          'Are you sure you want to continue?',
          'Adjust the records shown in this view.'
        ) :
      example
        .replaceAll('Open dialog', 'Open details')
        .replaceAll('Confirm action', 'Project details')
        .replaceAll(
          'Are you sure you want to continue?',
          'Review supporting information without leaving the page.'
        )
  }

  return hook.code
}

const toElementsExample = (example, elementComponents) => {
  let converted = example
    .replaceAll(/<Form(?=[\s/>])/g, '<form data-ui-form')
    .replaceAll('</Form>', '</form>')

  for (const [name, element] of elementComponents) {
    if (name === 'Form') continue

    converted = converted
      .replaceAll(/<([A-Z][A-Za-z0-9]*)(?=[\s/>])/g, (match, p1) => p1 === name ? `<${element.tagName}` : match)
      .replaceAll(`</${name}>`, `</${element.tagName}>`)
  }

  converted = converted
    .replaceAll(/<\/?TimelineItem>/g, tag => (tag.startsWith('</') ? '</li>' : '<li>'))
    .replaceAll(/(\s[\w-]+)=\{(-?[0-9]+\.[0-9]+)\}/g, '$1="$2"')
    .replaceAll(/(\s[\w-]+)=\{(-?[0-9]+)\}/g, '$1="$2"')
    .replaceAll(/(\s[\w-]+)=\{true\}/g, '$1')
    .replaceAll(/(\s[\w-]+)=\{false\}/g, '$1="false"')
    .replaceAll(/<([\w-]+)([^<>]*?)\s*\/>/g, '<$1$2></$1>')

  return converted.includes('{') ? '' : converted
}

const getAstroBehavior = (runtimeRequired, runtimeBypass) => {
  if (!runtimeRequired) return

  return {
    ...(runtimeBypass ? { runtimeBypass } : {}),
    mode: 'runtime',
    setup:
      'Mount UIPrimitives once in the application\'s root layout; do not mount it beside each component.' +
      (runtimeBypass ?
        ` Set ${runtimeBypass} when application code owns the complete interaction behavior.` :
        '')
  }
}

const getElementsBehavior = runtimeRequired => ({
  mode: 'registration',
  setup:
    'Call defineLumenElements() once before rendering Lumen custom elements.' +
    (runtimeRequired ? ' Registration includes this component’s interactive behavior.' : '')
})

const getReactBehavior = (hook, reactSource, runtimeRequired) => {
  if (hook) {
    return {
      controller: hook.controller,
      description: hook.description,
      hook: hook.name,
      mode: 'hook',
      options: hook.options,
      setup: `Use ${hook.name} from @santi020k/lumen-react; do not mount Astro UIPrimitives in React.`
    }
  }

  if (runtimeRequired) {
    const builtIn = /\buse[A-Z]\w+\(/.test(reactSource)

    return {
      mode: builtIn ? 'built-in' : 'adapter',
      setup: builtIn ?
        'Interactive behavior is implemented by the React component; do not mount Astro UIPrimitives.' :
        'The React component exposes the documented data attributes; app-level state must implement the documented interactive and event behavior. Do not mount Astro UIPrimitives.'
    }
  }
}

const frameworkBehavior = ({ framework, hook, reactSource, runtimeBypass, runtimeRequired }) => {
  if (framework === 'astro') return getAstroBehavior(runtimeRequired, runtimeBypass)

  if (framework === 'elements') return getElementsBehavior(runtimeRequired)

  if (framework === 'react') return getReactBehavior(hook, reactSource, runtimeRequired)
}

const withFallback = (values, fallback) => (values.length > 0 ? values : [fallback])

const buildFrameworkDetails = ({
  astroSource,
  doc,
  element,
  elementComponents,
  hasAstro,
  name,
  parsedAstro,
  react,
  reactHooks,
  runtimeBypass,
  runtimeRequired
}) => {
  const hookName = Reflect.get(reactHookByComponent, name)
  let hook

  if (name !== 'Tabs' && hookName) {
    hook = reactHooks.get(hookName)
  }

  let elementsExample = toElementsExample(doc.example, elementComponents)

  if (name === 'ScrollCue') {
    elementsExample = `<lumen-scroll-cue>
  <a href="#projects" aria-label="Continue to projects">
    <span class="ui-scroll-cue__mouse" aria-hidden="true">
      <span class="ui-scroll-cue__wheel"></span>
    </span>
    <span class="ui-scroll-cue__chevron" aria-hidden="true"></span>
    <span class="ui-scroll-cue__label">Explore projects</span>
  </a>
</lumen-scroll-cue>`
  }

  const reactExample = reactExampleForComponent(name, hook, doc.example)
  const astroExampleNames = componentNamesFromExample(doc.example)
  const astroImports = withFallback(astroExampleNames, name)
  const reactExampleNames = componentNamesFromExample(reactExample)
  const reactImportsList = withFallback(reactExampleNames, name)

  const reactImports = hook ?
    (reactExample.match(/^import .+$/gm)?.join('\n') ??
      `import { ${hook.name} } from '@santi020k/lumen-react'`) :
    `import { ${reactImportsList.join(', ')} } from '@santi020k/lumen-react'`

  return {
    astro: {
      available: hasAstro,
      behavior: frameworkBehavior({
        framework: 'astro',
        runtimeBypass,
        runtimeRequired
      }),
      example: doc.example,
      importStatement: `import { ${astroImports.join(', ')} } from '@santi020k/lumen-astro'`,
      language: 'astro',
      packageName: '@santi020k/lumen-astro',
      props: parsedAstro.props,
      propsExtends: parsedAstro.extends,
      source: astroSource,
      styleImport: 'import \'@santi020k/lumen-astro/styles.css\''
    },
    elements: {
      attributes: [
        ...new Set([...element.attributes, ...doc.apiReference.map(row => row.attribute)])
      ],
      available: Boolean(element.source),
      behavior: frameworkBehavior({ framework: 'elements', runtimeRequired }),
      example: elementsExample || `<${element.tagName}></${element.tagName}>`,
      importStatement: 'import { defineLumenElements } from \'@santi020k/lumen-elements/define\'',
      language: 'html',
      packageName: '@santi020k/lumen-elements',
      props: [],
      propsExtends: 'HTMLElement attributes',
      registration: 'defineLumenElements()',
      source: element.source,
      styleImport: 'import \'@santi020k/lumen-elements/styles.css\'',
      tagName: name === 'Form' ? 'form' : element.tagName
    },
    react: {
      available: react.available,
      behavior: frameworkBehavior({
        framework: 'react',
        hook,
        reactSource: react.source,
        runtimeRequired
      }),
      example: reactExample,
      importStatement: reactImports,
      language: 'tsx',
      packageName: '@santi020k/lumen-react',
      props: react.props.props,
      propsExtends: react.props.extends,
      source: react.source,
      styleImport: 'import \'@santi020k/lumen-react/styles.css\''
    }
  }
}

const keywordsForComponent = (doc, collections) => [
  ...new Set(
    [
      doc.name,
      doc.category,
      doc.summary,
      doc.guidance?.when,
      doc.guidance?.distinction,
      ...collections.flatMap(collection => [collection.title, collection.description])
    ]
      .filter(Boolean)
      .flatMap(value => value.toLowerCase().split(/[^a-z0-9]+/))
      .filter(value => value.length > 2)
  )
].sort()

const loadWorkspaceFiles = async p => ({
  aiUsage: await readIfExists(p('docs/ai-usage.md')),
  componentsSource: await readIfExists(p('packages/core/src/components.ts')),
  docsSource: await readIfExists(p('apps/docs/src/data/docs.ts')),
  nativeDocsSource: await readIfExists(p('apps/docs/src/data/native-components.ts')),
  elementsSource: await readIfExists(p('packages/elements/src/define.ts')),
  reactSource: await readIfExists(p('packages/react/src/components.tsx')),
  readme: await readIfExists(p('README.md')),
  rules: await readIfExists(p('llms.txt')),
  platformTokensSource: await readIfExists(p('tokens/lumen.tokens.json')),
  tokensSource: await readIfExists(p('packages/core/src/tokens.ts'))
})

const loadRegistry = async p => {
  try {
    return JSON.parse(await readFile(p('registry/lumen.registry.json'), 'utf8'))
  } catch {
    return { items: [] }
  }
}

const loadNativeRegistry = async p => JSON.parse(await readFile(p('registry/native-components.json'), 'utf8'))

const nativePlatformConfigs = {
  compose: {
    adapter: 'compose',
    docsPlatform: 'android',
    importStatement: symbol => `import com.santi020k.lumen.${symbol}`,
    install:
      'Include packages/compose from a shallow Git checkout pinned to the Lumen release tag, then add implementation(project(":lumen-compose")).',
    setup: 'Wrap application content in LumenTheme and preserve Compose state and navigation.'
  },
  'react-native': {
    adapter: 'reactNative',
    docsPlatform: 'react-native',
    importStatement: symbol => `import { ${symbol} } from '@santi020k/lumen-react-native'`,
    install: 'pnpm add @santi020k/lumen-react-native',
    setup:
      'Mount one LumenProvider near the application root. Native adapters do not load CSS or the Astro runtime.'
  },
  swiftui: {
    adapter: 'swiftUI',
    docsPlatform: 'apple',
    importStatement: () => 'import LumenUI',
    install:
      'Add https://github.com/santi020k/lumen with Swift Package Manager, pin an exact or compatible release version, and link the LumenUI product to the application target.',
    setup:
      'Apply .lumenTheme(...) near the SwiftUI application root and preserve native environment behavior.'
  }
}

const nativeSourceExtensions = {
  compose: new Set(['.kt']),
  'react-native': new Set(['.ts', '.tsx']),
  swiftui: new Set(['.swift'])
}

const nativeImplementationOverrides = [
  {
    install:
      'Include packages/compose from a shallow Git checkout pinned to the Lumen release tag, then add implementation(project(":wear")).',
    packageName: 'com.santi020k:lumen-compose-wear',
    platform: 'compose',
    setup:
      'Wrap wearable content in LumenWearTheme inside the application-owned Wear Material theme.',
    sourcePrefix: 'packages/compose/wear/'
  }
]

const extensionOf = fileName => {
  const index = fileName.lastIndexOf('.')

  return index === -1 ? '' : fileName.slice(index)
}

const loadNativeSources = async (repoRoot, nativeRegistry) => {
  const sources = {}

  for (const [platform, config] of Object.entries(nativePlatformConfigs)) {
    const adapter = nativeRegistry.adapters[config.adapter]
    const files = {}

    for (const sourceDirectory of [adapter.sourceDirectory, ...(adapter.additionalSourceDirectories ?? [])]) {
      const directory = resolve(repoRoot, sourceDirectory)

      for (const fileName of await readdir(directory)) {
        if (!nativeSourceExtensions[platform].has(extensionOf(fileName))) continue

        const absolutePath = join(directory, fileName)

        files[relative(repoRoot, absolutePath)] = await readFile(absolutePath, 'utf8')
      }
    }

    sources[platform] = files
  }

  return sources
}

const findNativeSourceFile = (sources, platform, symbol) => {
  const match = Object.entries(sources[platform]).find(([, source]) => source.includes(symbol))

  if (!match) throw new Error(`Missing ${platform} source for native symbol ${symbol}.`)

  return match[0]
}

const nativeRegistryEntry = (nativeRegistry, id) => nativeRegistry.components.find(component => component.id === id) ??
  nativeRegistry.platformComponents.find(component => component.id === id)

const buildNativeImplementation = ({ config, implementation, nativeRegistry, platform, sources, symbol }) => {
  const sourceFile = findNativeSourceFile(sources, platform, symbol)

  const implementationOverride = nativeImplementationOverrides.find(candidate => (
    candidate.platform === platform && sourceFile.startsWith(candidate.sourcePrefix)
  ))

  return {
    api: implementation.api,
    example: implementation.example,
    exportName: implementation.exportName,
    importStatement: config.importStatement(symbol),
    install: implementationOverride?.install ?? config.install,
    language: implementation.language,
    maturity: implementation.maturity,
    packageName:
      implementationOverride?.packageName ?? nativeRegistry.adapters[config.adapter].package,
    setup: implementationOverride?.setup ?? config.setup,
    sourceFile,
    symbol
  }
}

const buildNativeComponents = async (repoRoot, files, nativeRegistry) => {
  const docsData = await loadDocsData(files.nativeDocsSource)
  const sources = await loadNativeSources(repoRoot, nativeRegistry)
  const registryEntries = [...nativeRegistry.components, ...nativeRegistry.platformComponents]

  for (const registryEntry of registryEntries) {
    if (!docsData.nativeComponentDocs.some(doc => doc.slug === registryEntry.id)) {
      throw new Error(
        `Native registry entry ${registryEntry.id} is missing from native documentation.`
      )
    }
  }

  const components = docsData.nativeComponentDocs.map(doc => {
    const registryEntry = nativeRegistryEntry(nativeRegistry, doc.slug)

    if (!registryEntry)
      throw new Error(`Native documentation entry ${doc.slug} is missing from the native registry.`)

    const implementations = {}

    for (const [platform, config] of Object.entries(nativePlatformConfigs)) {
      const implementation = doc.implementations[config.docsPlatform]

      if (!implementation) continue

      const symbol = registryEntry.symbols?.[config.adapter] ?? registryEntry.symbol

      if (!symbol)
        throw new Error(`Native registry entry ${doc.slug} is missing a ${platform} symbol.`)

      implementations[platform] = buildNativeImplementation({
        config,
        implementation,
        nativeRegistry,
        platform,
        sources,
        symbol
      })
    }

    return {
      accessibility: doc.accessibility,
      category: doc.category,
      contract: registryEntry.contract,
      guidance: doc.guidance,
      id: doc.slug,
      implementations,
      name: doc.name,
      summary: doc.summary,
      ...(registryEntry.platforms ? { supportedPlatforms: registryEntry.platforms } : {}),
      tier: registryEntry.tier ?? 'platform-specific'
    }
  })

  return { components, sources }
}

const mapRecipesByComponent = registry => {
  const map = new Map()

  for (const item of registry.items ?? []) {
    for (const componentName of item.components ?? []) {
      const list = map.get(componentName) ?? []

      list.push({ name: item.name, type: item.type })

      map.set(componentName, list)
    }
  }

  return map
}

const buildContextData = async (files, registry, names) => {
  const docsData = await loadDocsData(files.docsSource)
  const componentBehavior = parseComponentBehavior(files.componentsSource)
  const missingBehavior = names.filter(name => !componentBehavior.has(name))

  if (missingBehavior.length > 0) {
    throw new Error(`Missing framework behavior metadata for: ${missingBehavior.join(', ')}`)
  }

  return {
    componentBehavior,
    docsByComponent: new Map(docsData.componentDocs.map(doc => [doc.name, doc])),
    docsData,
    elementComponents: parseElementComponents(files.elementsSource, names),
    reactComponents: parseReactComponents(files.reactSource, names),
    reactHooks: new Map(docsData.reactHooksReference.map(hook => [hook.name, hook])),
    recipesByComponent: mapRecipesByComponent(registry),
    registryComponents: new Map(
      (registry.components ?? []).map(component => [component.name, component])
    )
  }
}

const getDocDefaults = (name, ctx, registryComponent) => ctx.docsByComponent.get(name) ?? {
  apiReference: [],
  category: registryComponent.category ?? 'Uncategorized',
  example: `<${name} />`,
  name,
  summary: registryComponent.description ?? `${name} component.`
}

const main = async () => {
  const repoRoot = await findRepoRoot(scriptDir)
  const p = (...parts) => resolve(repoRoot, ...parts)
  const files = await loadWorkspaceFiles(p)
  const { aiUsage, componentsSource, platformTokensSource, readme, rules, tokensSource } = files
  const packageJson = JSON.parse(await readFile(resolve(scriptDir, '..', 'package.json'), 'utf8'))
  const registry = await loadRegistry(p)
  const nativeRegistry = await loadNativeRegistry(p)
  const releaseManifest = JSON.parse(await readFile(p('registry/release-manifest.json'), 'utf8'))
  const names = parseComponentNames(componentsSource)
  const ctxData = await buildContextData(files, registry, names)

  const { components: nativeComponents, sources: nativeSources } = await buildNativeComponents(
    repoRoot,
    files,
    nativeRegistry
  )

  const chart = parseTokenBlock(tokensSource, 'lumenChart')
  const colors = parsePlatformColors(platformTokensSource)
  const glass = parseTokenBlock(tokensSource, 'lumenGlass')

  const semanticTokens = [
    'canvas',
    'surface',
    'surface-muted',
    'surface-strong',
    'line',
    'ink',
    'ink-soft',
    'ink-muted',
    'brand',
    'brand-solid',
    'brand-soft',
    'on-brand',
    'accent',
    'success',
    'warning',
    'danger',
    'on-danger'
  ]

  const astroDir = p('packages/astro/components')

  const astroFiles = new Set(
    (await exists(astroDir)) ? (await readdir(astroDir)).filter(f => f.endsWith('.astro')) : []
  )

  const getAstroProps = async (name, ctx) => {
    const fileName = `${name}.astro`
    const hasAstro = ctx.astroFiles.has(fileName)
    const astroSource = hasAstro ? await readFile(join(ctx.astroDir, fileName), 'utf8') : ''
    const parsed = hasAstro ? parseProps(astroSource) : { extends: null, props: [] }

    return { astroSource, hasAstro, parsed }
  }

  const buildComponentData = async (name, ctx) => {
    const { astroSource, hasAstro, parsed } = await getAstroProps(name, ctx)
    const kebab = toKebab(name)
    const registryComponent = ctx.registryComponents.get(name) ?? {}
    const doc = getDocDefaults(name, ctx, registryComponent)
    const behavior = ctx.componentBehavior.get(name)
    const collections = ctx.docsData.componentCollections.filter(collection => collection.names.includes(name))

    const frameworkDetails = buildFrameworkDetails({
      astroSource,
      doc,
      element: ctx.elementComponents.get(name),
      elementComponents: ctx.elementComponents,
      hasAstro,
      name,
      parsedAstro: parsed,
      react: ctx.reactComponents.get(name),
      reactHooks: ctx.reactHooks,
      reactSource: ctx.files.reactSource,
      runtimeBypass: behavior?.astroRuntimeBypass,
      runtimeRequired: behavior?.astro === 'ui-primitives'
    })

    return {
      apiReference: doc.apiReference,
      astroSource,
      category: doc.category,
      collections: collections.map(collection => collection.title),
      dependencies: registryComponent.dependencies ?? [],
      description: doc.summary,
      behavior,
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
    files,
    names,
    ...ctxData
  }

  for (const name of names) {
    components.push(await buildComponentData(name, ctx))
  }

  const componentMap = new Map(components.map(component => [component.name, component]))

  const recipes = (registry.items ?? [])
    .filter(item => item.type === 'recipe' || item.type === 'component-set')
    .map(item => {
      const recipeComponents = (item.components ?? [])
        .map(name => componentMap.get(name))
        .filter(Boolean)

      const categories = [...new Set(recipeComponents.map(component => component.category))].sort()

      return {
        ...item,
        categories,
        description:
          item.type === 'component-set' ?
            'The complete Lumen component catalog and shared runtime foundation.' :
            `${/^[aeiou]/i.test(item.name) ? 'An' : 'A'} ${item.name.replaceAll('-', ' ')} composition using ${recipeComponents.map(component => component.name).join(', ')}.`,
        install: {
          astro: `lumen add ${item.name} --target astro`,
          elements: `lumen add ${item.name} --target elements`,
          react: `lumen add ${item.name} --target react`
        }
      }
    })

  const docs = { aiUsage, readme }

  const tokens = {
    chart,
    colors,
    glass,
    semantic: semanticTokens,
    themeAttribute: 'data-theme'
  }

  const packagePaths = {
    '@santi020k/lumen-astro': 'packages/astro/package.json',
    '@santi020k/lumen-core': 'packages/core/package.json',
    '@santi020k/lumen-elements': 'packages/elements/package.json',
    '@santi020k/lumen-mcp': 'packages/mcp/package.json',
    '@santi020k/lumen-react': 'packages/react/package.json',
    '@santi020k/lumen-react-native': 'packages/react-native/package.json',
    '@santi020k/lumen-tokens': 'packages/tokens/package.json'
  }

  const packageVersions = {}

  for (const [packageName, packagePath] of Object.entries(packagePaths)) {
    const manifest = JSON.parse(await readFile(p(packagePath), 'utf8'))

    Reflect.set(packageVersions, packageName, manifest.version)
  }

  packageVersions.LumenUI = 'workspace'

  packageVersions['com.santi020k:lumen-compose'] = 'workspace'

  packageVersions['com.santi020k:lumen-compose-wear'] = 'workspace'

  const catalogHash = createHash('sha256')
    .update(
      JSON.stringify({
        components,
        docs,
        nativeComponents,
        nativeSources,
        recipes,
        releaseManifest,
        rules,
        tokens
      })
    )
    .digest('hex')

  const catalogManifest = {
    components: Object.fromEntries(
      components.map(component => [
        component.name,
        createHash('sha256').update(JSON.stringify(component)).digest('hex')
      ])
    ),
    nativeComponents: Object.fromEntries(
      nativeComponents.map(component => [
        component.name,
        createHash('sha256')
          .update(
            JSON.stringify({
              component,
              sources: Object.fromEntries(
                Object.entries(component.implementations).map(([platform, implementation]) => [
                  platform,
                  nativeSources[platform][implementation.sourceFile]
                ])
              )
            })
          )
          .digest('hex')
      ])
    ),
    recipes: Object.fromEntries(
      recipes.map(recipe => [
        recipe.name,
        createHash('sha256').update(JSON.stringify(recipe)).digest('hex')
      ])
    )
  }

  const payload = {
    catalogManifest,
    components,
    docs,
    meta: {
      catalogHash,
      componentCount: components.length,
      nativeComponentCount: nativeComponents.length,
      packages: [
        ...new Set([
          ...(registry.packages ?? [
            '@santi020k/lumen-astro',
            '@santi020k/lumen-react',
            '@santi020k/lumen-elements',
            '@santi020k/lumen-core'
          ]),
          ...Object.values(nativeRegistry.adapters).map(adapter => adapter.package)
        ])
      ],
      packageVersions,
      registryName: registry.name ?? 'lumen',
      registryVersion: registry.version ?? 1,
      schemaVersion: 5,
      serverVersion: packageJson.version
    },
    nativeComponents,
    nativeSources,
    recipes,
    releaseManifest,
    rules,
    tokens
  }

  const outDir = resolve(scriptDir, '..', 'data')
  const outPath = join(outDir, 'lumen-data.json')
  const output = `${JSON.stringify(payload, null, 2)}\n`

  await mkdir(outDir, { recursive: true })

  if (process.argv.includes('--check')) {
    const current = await readIfExists(outPath)

    if (current !== output) {
      throw new Error(
        'Lumen MCP snapshot is stale. Run "pnpm --filter @santi020k/lumen-mcp generate".'
      )
    }

    process.stdout.write('lumen-mcp: data/lumen-data.json is current\n')

    return
  }

  const temporaryPath = `${outPath}.${process.pid}.${randomUUID()}.tmp`

  try {
    await writeFile(temporaryPath, output, 'utf8')

    await rename(temporaryPath, outPath)
  } finally {
    await unlink(temporaryPath).catch(() => {})
  }

  process.stdout.write(
    `lumen-mcp: wrote data/lumen-data.json (${components.length} components, ` +
    `${nativeComponents.length} native components, ` +
    `${Object.keys(colors).length} color tokens, ${rules.length} bytes of rules)\n`
  )
}

main().catch(error => {
  process.stderr.write(String(error) + '\n')

  process.exitCode = 1
})

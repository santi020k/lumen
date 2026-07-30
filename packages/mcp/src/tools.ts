import type {
  LumenCatalogManifest,
  LumenComponentSnapshot,
  LumenData,
  LumenFramework,
  LumenFrameworkSnapshot,
  LumenRecipeSnapshot,
} from './data.js'
import { loadLumenData } from './data.js'

export interface CatalogChanges {
  added: string[]
  changed: string[]
  removed: string[]
  unchanged: string[]
}
export type ComponentDetailLevel = 'source' | 'summary' | 'usage'

export interface ComponentSummary {
  category: string
  collections: string[]
  description: string
  frameworks: LumenFramework[]
  kebab: string
  name: string
  recipes: string[]
}

export type FrameworkFilter = LumenFramework

export interface LumenToolResult<Data = unknown> {
  data: Data
  isError?: boolean
  text: string
}

export interface SearchResult {
  category?: string
  description: string
  frameworks?: LumenFramework[]
  kind: 'component' | 'recipe' | 'rule' | 'token'
  matchedTerms: string[]
  name: string
  score: number
}

const normalize = (value: string) =>
  value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll(/[\s_]+/g, '-')
    .toLowerCase()
const tokenize = (value: string): string[] =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

const searchStopWords = new Set([
  'a',
  'accessibility',
  'accessible',
  'admin',
  'an',
  'and',
  'app',
  'application',
  'component',
  'for',
  'in',
  'lumen',
  'not',
  'of',
  'or',
  'the',
  'to',
  'ui',
  'with',
])

const searchTermAliases: Record<string, string[]> = {
  booking: ['booking', 'schedule', 'calendar', 'appointment', 'date'],
  dark: ['dark', 'theme'],
  dashboard: ['dashboard', 'data-table', 'sidebar', 'chart', 'stat', 'metric'],
  mode: ['mode', 'theme'],
  pagination: ['pagination', 'paginated'],
  sortable: ['sortable', 'sort'],
}

const meaningfulSearchTerms = (value: string): string[] => {
  const terms = tokenize(value)
  const meaningful = terms.filter((term) => !searchStopWords.has(term))

  return meaningful.length > 0 ? meaningful : terms
}

const availableFrameworks = (component: LumenComponentSnapshot): LumenFramework[] =>
  (Object.entries(component.frameworks) as [LumenFramework, boolean][])
    .filter(([, available]) => available)
    .map(([framework]) => framework)

const componentSummary = (component: LumenComponentSnapshot): ComponentSummary => ({
  category: component.category,
  collections: component.collections,
  description: component.description,
  frameworks: availableFrameworks(component),
  kebab: component.kebab,
  name: component.name,
  recipes: component.recipes.map((recipe) => recipe.name),
})

export const resolveComponent = (
  name: string,
  data: LumenData = loadLumenData(),
): LumenComponentSnapshot | undefined => {
  const target = normalize(name)

  return (
    data.components.find((component) => component.name === name) ??
    data.components.find((component) => component.kebab === target) ??
    data.components.find((component) => normalize(component.name) === target)
  )
}

export const resolveRecipe = (name: string, data: LumenData = loadLumenData()): LumenRecipeSnapshot | undefined => {
  const target = normalize(name)

  return data.recipes.find((recipe) => normalize(recipe.name) === target)
}

const frameworkBehaviorSearchText = (behavior: LumenFrameworkSnapshot['behavior']) => [
  behavior?.description ?? '',
  behavior?.hook ?? '',
  behavior?.mode ?? '',
  behavior?.setup ?? '',
]

const frameworkDetailsSearchText = (framework: LumenFrameworkSnapshot) => [
  framework.packageName,
  ...frameworkBehaviorSearchText(framework.behavior),
  framework.example,
  framework.propsExtends ?? '',
  framework.props.map((prop) => `${prop.name} ${prop.type}`).join(' '),
  framework.attributes?.join(' ') ?? '',
  framework.tagName ?? '',
]

const frameworkSearchText = (component: LumenComponentSnapshot, framework?: LumenFramework) =>
  (framework ? [Reflect.get(component.frameworkDetails, framework)] : Object.values(component.frameworkDetails))
    .flatMap(frameworkDetailsSearchText)
    .join(' ')

const componentSearchText = (component: LumenComponentSnapshot, framework?: LumenFramework) =>
  [
    component.name,
    component.kebab,
    component.description,
    component.category,
    component.collections.join(' '),
    component.recipes.map((recipe) => recipe.name).join(' '),
    component.keywords.join(' '),
    component.dependencies.join(' '),
    component.guidance?.when ?? '',
    component.guidance?.distinction ?? '',
    component.apiReference.map((row) => `${row.attribute} ${row.values} ${row.description}`).join(' '),
    frameworkSearchText(component, framework),
  ].join(' ')

const scoreCandidate = (query: string, terms: string[], searchableText: string, primaryName = '') => {
  const normalizedText = normalize(searchableText)
  const matchedTerms = terms.filter((term) =>
    ((Reflect.get(searchTermAliases, term) as string[] | undefined) ?? [term]).some((candidate) =>
      normalizedText.includes(candidate),
    ),
  )

  if (matchedTerms.length === 0) return { matchedTerms, score: 0 }

  const normalizedQuery = terms.join('-')
  const normalizedName = normalize(primaryName)
  const coverage = matchedTerms.length / terms.length

  let score = matchedTerms.reduce(
    (total, term) =>
      total +
      (((Reflect.get(searchTermAliases, term) as string[] | undefined) ?? [term]).some((candidate) =>
        normalizedName.includes(candidate),
      )
        ? 20
        : 5),
    0,
  )

  score += Math.round(coverage * 80)

  score -= (terms.length - matchedTerms.length) * 3

  if (terms.includes(normalizedName)) score += 50

  if (normalizedText.includes(normalizedQuery)) score += 100

  if (normalizedName === normalizedQuery) score += 500

  return { matchedTerms, score }
}

const appendSearchResult = (
  results: SearchResult[],
  candidate: Omit<SearchResult, 'matchedTerms' | 'score'>,
  query: string,
  terms: string[],
  searchableText: string,
) => {
  const match = scoreCandidate(query, terms, searchableText, candidate.kind === 'rule' ? '' : candidate.name)

  if (match.score > 0) results.push({ ...candidate, ...match })
}

const collectSearchResults = (
  query: string,
  terms: string[],
  data: LumenData,
  framework?: LumenFramework,
): SearchResult[] => {
  const results: SearchResult[] = []

  for (const component of data.components) {
    if (framework && !Reflect.get(component.frameworks, framework)) continue

    appendSearchResult(
      results,
      {
        category: component.category,
        description: component.description,
        frameworks: availableFrameworks(component),
        kind: 'component',
        name: component.name,
      },
      query,
      terms,
      componentSearchText(component, framework),
    )
  }

  for (const recipe of data.recipes) {
    appendSearchResult(
      results,
      {
        category: recipe.categories.join(', '),
        description: recipe.description,
        kind: 'recipe',
        name: recipe.name,
      },
      query,
      terms,
      `${recipe.name} ${recipe.description} ${recipe.categories.join(' ')} ${(recipe.components ?? []).join(' ')}`,
    )
  }

  for (const token of data.tokens.semantic) {
    appendSearchResult(
      results,
      {
        description: 'Lumen semantic design token.',
        kind: 'token',
        name: token,
      },
      query,
      terms,
      token,
    )
  }

  for (const line of data.rules.split('\n').filter((rule) => rule.trim())) {
    appendSearchResult(
      results,
      {
        description: line.trim(),
        kind: 'rule',
        name: line.trim(),
      },
      query,
      terms,
      line,
    )
  }

  return results
}

export const listComponents = (
  args: {
    framework?: FrameworkFilter | undefined
    query?: string | undefined
    recipe?: string | undefined
  } = {},
  data: LumenData = loadLumenData(),
): LumenToolResult<{ components: ComponentSummary[]; count: number }> => {
  const query = args.query?.trim()
  const queryTerms = query ? meaningfulSearchTerms(query) : []
  const recipe = args.recipe ? resolveRecipe(args.recipe, data) : undefined
  const recipeName = recipe?.name ?? (args.recipe ? normalize(args.recipe) : undefined)

  const matches = data.components.filter((component) => {
    if (args.framework && !component.frameworks[args.framework]) return false

    if (recipeName && !component.recipes.some((componentRecipe) => normalize(componentRecipe.name) === recipeName))
      return false

    if (
      query &&
      scoreCandidate(query, queryTerms, componentSearchText(component, args.framework), component.name).score === 0
    )
      return false

    return true
  })

  const summaries = matches.map(componentSummary)

  if (summaries.length === 0) {
    return {
      data: { components: [], count: 0 },
      text: 'No components matched the given filters.',
    }
  }

  const lines = summaries.map((component) => {
    const recipeNote = component.recipes.length > 0 ? ` [recipes: ${component.recipes.join(', ')}]` : ''

    return `${component.name} (${component.kebab}) — ${component.description} — ${component.frameworks.join(', ')}${recipeNote}`
  })

  return {
    data: { components: summaries, count: summaries.length },
    text: `${summaries.length} component(s):\n\n${lines.join('\n')}`,
  }
}

const frameworkWithoutSource = (framework: LumenFrameworkSnapshot) => {
  const { source: _source, ...usage } = framework

  return usage
}

const getFrameworkDetail = (
  details: Record<LumenFramework, LumenFrameworkSnapshot>,
  framework: LumenFramework,
): LumenFrameworkSnapshot => {
  if (framework === 'astro') return details.astro

  if (framework === 'elements') return details.elements

  return details.react
}

const getRecipeInstall = (install: Record<LumenFramework, string>, framework: LumenFramework): string => {
  if (framework === 'astro') return install.astro

  if (framework === 'elements') return install.elements

  return install.react
}

const componentDetail = (
  component: LumenComponentSnapshot,
  framework: LumenFramework,
  detail: ComponentDetailLevel,
) => {
  const selectedFramework = getFrameworkDetail(component.frameworkDetails, framework)
  const summary = componentSummary(component)

  if (detail === 'summary') {
    return {
      ...summary,
      dependencies: component.dependencies,
      framework: {
        available: selectedFramework.available,
        packageName: selectedFramework.packageName,
        tagName: selectedFramework.tagName,
      },
      guidance: component.guidance,
    }
  }

  const usage = {
    ...summary,
    apiReference: component.apiReference,
    dependencies: component.dependencies,
    files: component.files,
    framework: frameworkWithoutSource(selectedFramework),
    guidance: component.guidance,
    keyboardInteractions: component.keyboardInteractions,
    runtimeEvents: component.runtimeEvents,
  }

  return detail === 'source' ? { ...usage, framework: selectedFramework } : usage
}

const formatProps = (framework: LumenFrameworkSnapshot): string => {
  if (framework.attributes && framework.attributes.length > 0) {
    return `Attributes:\n${framework.attributes.map((attribute) => `- ${attribute}`).join('\n')}`
  }

  if (framework.props.length === 0) {
    return framework.propsExtends
      ? `Props extend ${framework.propsExtends}; no additional local props were detected.`
      : 'No typed props detected.'
  }

  const lines = framework.props.map((prop) => `- ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}`)

  const header = framework.propsExtends ? `Props (extends ${framework.propsExtends}):` : 'Props:'

  return `${header}\n${lines.join('\n')}`
}

const buildSummarySections = (
  component: LumenComponentSnapshot,
  frameworkName: LumenFramework,
  framework: LumenFrameworkSnapshot,
) =>
  [
    `# ${component.name}`,
    component.description,
    `Category: ${component.category}`,
    `Framework: ${frameworkName}`,
    `Package: ${framework.packageName}`,
    `Import: ${framework.importStatement}`,
    `Styles: ${framework.styleImport}`,
    framework.tagName ? `Custom element: <${framework.tagName}>` : '',
    component.recipes.length > 0
      ? `Recipes: ${component.recipes.map((recipe) => recipe.name).join(', ')}`
      : 'Recipes: none',
  ].filter(Boolean)

const appendBehaviorSections = (sections: string[], behavior: LumenFrameworkSnapshot['behavior']) => {
  if (!behavior) return

  sections.push('', '## Framework behavior', behavior.setup)

  if (behavior.hook) sections.push(`Hook: ${behavior.hook}`)

  if (behavior.description) sections.push(behavior.description)

  if (behavior.options && behavior.options.length > 0) {
    sections.push(
      '',
      'Hook options:',
      ...behavior.options.map((option) => `- ${option.name}: ${option.type} — ${option.description}`),
    )
  }

  if (behavior.controller && behavior.controller.length > 0) {
    sections.push(
      '',
      'Controller values:',
      ...behavior.controller.map((value) => `- ${value.name}: ${value.type} — ${value.description}`),
    )
  }
}

const appendGuidanceSections = (sections: string[], component: LumenComponentSnapshot) => {
  if (component.guidance) {
    sections.push('', '## Guidance', component.guidance.when)

    if (component.guidance.distinction) sections.push(component.guidance.distinction)
  }

  if (component.keyboardInteractions.length > 0) {
    sections.push('', '## Keyboard interactions')

    sections.push(...component.keyboardInteractions.map((interaction) => `- ${interaction.key}: ${interaction.action}`))
  }

  if (component.apiReference.length > 0) {
    sections.push('', '## API reference')

    sections.push(...component.apiReference.map((row) => `- \`${row.attribute}\` ${row.values} — ${row.description}`))
  }

  if (component.runtimeEvents.length > 0) {
    sections.push('', '## Runtime events')

    sections.push(...component.runtimeEvents.map((event) => `- ${event.name}: ${event.when}`))
  }
}

const formatComponentUsage = (
  component: LumenComponentSnapshot,
  frameworkName: LumenFramework,
  detail: ComponentDetailLevel,
) => {
  const framework = getFrameworkDetail(component.frameworkDetails, frameworkName)
  const sections = buildSummarySections(component, frameworkName, framework)

  if (detail === 'summary') return sections.join('\n')

  sections.push('', formatProps(framework), '', '## Example', `\`\`\`${framework.language}`, framework.example, '```')

  appendBehaviorSections(sections, framework.behavior)

  appendGuidanceSections(sections, component)

  if (detail === 'source') {
    sections.push(
      '',
      `## ${frameworkName} reference source`,
      `\`\`\`${framework.language}`,
      framework.source.trimEnd(),
      '```',
    )
  }

  return sections.join('\n')
}

export const getComponent = (
  args: {
    detail?: ComponentDetailLevel | undefined
    framework?: FrameworkFilter | undefined
    includeSource?: boolean | undefined
    name: string
  },
  data: LumenData = loadLumenData(),
): LumenToolResult<{
  component?: ReturnType<typeof componentDetail>
  found: boolean
  message?: string
}> => {
  const component = resolveComponent(args.name, data)

  if (!component) {
    const message = `Unknown component "${args.name}". Use lumen_list_components to see available names.`

    return {
      data: { found: false, message },
      isError: true,
      text: message,
    }
  }

  const framework = args.framework ?? 'astro'
  const detail = args.detail ?? (args.includeSource ? 'source' : 'usage')
  const selectedFramework = getFrameworkDetail(component.frameworkDetails, framework)

  if (!selectedFramework.available) {
    const message = `${component.name} is not available for ${framework}.`

    return {
      data: { found: false, message },
      isError: true,
      text: message,
    }
  }

  return {
    data: {
      component: componentDetail(component, framework, detail),
      found: true,
    },
    text: formatComponentUsage(component, framework, detail),
  }
}

export const getRecipe = (
  args: { framework?: FrameworkFilter | undefined; name: string },
  data: LumenData = loadLumenData(),
): LumenToolResult<{ found: boolean; message?: string; recipe?: LumenRecipeSnapshot }> => {
  const recipe = resolveRecipe(args.name, data)

  if (!recipe) {
    const message = `Unknown recipe "${args.name}". Use lumen_search or lumen_list_components to discover recipes.`

    return {
      data: { found: false, message },
      isError: true,
      text: message,
    }
  }

  const framework = args.framework ?? 'astro'

  const componentLines = (recipe.components ?? []).map((name) => {
    const component = resolveComponent(name, data)

    return component ? `- ${component.name}: ${component.description}` : `- ${name}`
  })

  return {
    data: { found: true, recipe },
    text: [
      `# ${recipe.name}`,
      recipe.description,
      `Type: ${recipe.type}`,
      `Categories: ${recipe.categories.join(', ') || 'all'}`,
      `Install for ${framework}: ${getRecipeInstall(recipe.install, framework)}`,
      '',
      '## Components',
      ...componentLines,
    ].join('\n'),
  }
}

export const search = (
  args: {
    framework?: FrameworkFilter | undefined
    limit?: number | undefined
    query: string
  },
  data: LumenData = loadLumenData(),
): LumenToolResult<{ query: string; results: SearchResult[]; total: number }> => {
  const query = args.query.trim()

  if (!query) {
    return {
      data: { query, results: [], total: 0 },
      isError: true,
      text: 'Provide a non-empty query.',
    }
  }

  const limit = Math.max(1, Math.min(args.limit ?? 20, 100))

  const results = collectSearchResults(query, meaningfulSearchTerms(query), data, args.framework)

  const kindPriority: Record<SearchResult['kind'], number> = {
    component: 0,
    recipe: 1,
    rule: 3,
    token: 2,
  }

  results.sort(
    (left, right) =>
      right.score - left.score ||
      kindPriority[left.kind] - kindPriority[right.kind] ||
      left.name.localeCompare(right.name),
  )

  const shown = results.slice(0, limit)

  if (results.length === 0) {
    return {
      data: { query, results: [], total: 0 },
      text: `No matches for "${args.query}".`,
    }
  }

  return {
    data: { query, results: shown, total: results.length },
    text: `${results.length} match(es) for "${args.query}"${
      results.length > shown.length ? ` (showing ${shown.length})` : ''
    }:\n\n${shown.map((result) => `${result.kind}: ${result.name} — ${result.description} [matched: ${result.matchedTerms.join(', ')}]`).join('\n')}`,
  }
}

export const getMeta = (data: LumenData = loadLumenData()): LumenToolResult<{ meta: LumenData['meta'] }> => ({
  data: { meta: data.meta },
  text: [
    '# Lumen MCP snapshot',
    `Server version: ${data.meta.serverVersion}`,
    `Schema version: ${data.meta.schemaVersion}`,
    `Catalog hash: ${data.meta.catalogHash}`,
    `Components: ${data.meta.componentCount}`,
    '',
    '## Package versions',
    ...Object.entries(data.meta.packageVersions).map(([name, version]) => `- ${name}: ${version}`),
  ].join('\n'),
})

const diffManifestSection = (current: Record<string, string>, baseline: Record<string, string>): CatalogChanges => {
  const currentNames = Object.keys(current)
  const baselineNames = Object.keys(baseline)

  return {
    added: currentNames.filter((name) => (Reflect.get(baseline, name) as string | undefined) === undefined).sort(),
    changed: currentNames
      .filter(
        (name) =>
          (Reflect.get(baseline, name) as string | undefined) !== undefined &&
          Reflect.get(baseline, name) !== Reflect.get(current, name),
      )
      .sort(),
    removed: baselineNames.filter((name) => (Reflect.get(current, name) as string | undefined) === undefined).sort(),
    unchanged: currentNames.filter((name) => Reflect.get(baseline, name) === Reflect.get(current, name)).sort(),
  }
}

export const getCatalogManifest = (
  data: LumenData = loadLumenData(),
): LumenToolResult<{
  catalogHash: string
  manifest: LumenCatalogManifest
  schemaVersion: number
}> => ({
  data: {
    catalogHash: data.meta.catalogHash,
    manifest: data.catalogManifest,
    schemaVersion: data.meta.schemaVersion,
  },
  text: [
    '# Lumen catalog manifest',
    `Catalog hash: ${data.meta.catalogHash}`,
    `Components: ${Object.keys(data.catalogManifest.components).length}`,
    `Recipes: ${Object.keys(data.catalogManifest.recipes).length}`,
    '',
    'Keep this structured result and pass its manifest to lumen_diff_catalog after an MCP update.',
  ].join('\n'),
})

export const diffCatalog = (
  args: {
    baseline: LumenCatalogManifest
    baselineCatalogHash?: string | undefined
  },
  data: LumenData = loadLumenData(),
): LumenToolResult<{
  components: CatalogChanges
  currentCatalogHash: string
  recipes: CatalogChanges
  unchanged: boolean
}> => {
  const components = diffManifestSection(data.catalogManifest.components, args.baseline.components)
  const recipes = diffManifestSection(data.catalogManifest.recipes, args.baseline.recipes)

  const changedCount = [
    ...components.added,
    ...components.changed,
    ...components.removed,
    ...recipes.added,
    ...recipes.changed,
    ...recipes.removed,
  ].length

  const unchanged =
    changedCount === 0 && (args.baselineCatalogHash === undefined || args.baselineCatalogHash === data.meta.catalogHash)

  return {
    data: {
      components,
      currentCatalogHash: data.meta.catalogHash,
      recipes,
      unchanged,
    },
    text: unchanged
      ? `The Lumen catalog is unchanged (${data.meta.catalogHash}).`
      : [
          '# Lumen catalog changes',
          `Current catalog hash: ${data.meta.catalogHash}`,
          `Changed entries: ${changedCount}`,
          `Components — added: ${components.added.length}, changed: ${components.changed.length}, removed: ${components.removed.length}`,
          `Recipes — added: ${recipes.added.length}, changed: ${recipes.changed.length}, removed: ${recipes.removed.length}`,
        ].join('\n'),
  }
}

export const diagnose = (
  data: LumenData = loadLumenData(),
): LumenToolResult<{
  checks: { message: string; name: string; status: 'fail' | 'pass' }[]
  frameworkCoverage: Record<LumenFramework, number>
  status: 'healthy' | 'issues'
}> => {
  const componentNames = data.components.map((component) => component.name)

  const frameworkCoverage = {
    astro: data.components.filter((component) => component.frameworks.astro).length,
    elements: data.components.filter((component) => component.frameworks.elements).length,
    react: data.components.filter((component) => component.frameworks.react).length,
  }

  const checks = [
    {
      message: `${data.components.length} component records match metadata.`,
      name: 'component-count',
      status: data.components.length === data.meta.componentCount ? 'pass' : 'fail',
    },
    {
      message: 'Component names are unique.',
      name: 'unique-components',
      status: new Set(componentNames).size === componentNames.length ? 'pass' : 'fail',
    },
    {
      message: 'Every component has a manifest fingerprint.',
      name: 'component-manifest',
      status: componentNames.every((name) => Reflect.get(data.catalogManifest.components, name)) ? 'pass' : 'fail',
    },
    {
      message: 'Every available framework contract has an example and import statement.',
      name: 'framework-contracts',
      status: data.components.every((component) =>
        (Object.entries(component.frameworks) as [LumenFramework, boolean][]).every(([framework, available]) => {
          if (!available) return true

          const details = Reflect.get(component.frameworkDetails, framework) as LumenFrameworkSnapshot | undefined

          return Boolean(details?.example.trim()) && Boolean(details?.importStatement.trim())
        }),
      )
        ? 'pass'
        : 'fail',
    },
  ] satisfies { message: string; name: string; status: 'fail' | 'pass' }[]

  const status = checks.every((check) => check.status === 'pass') ? 'healthy' : 'issues'

  return {
    data: { checks, frameworkCoverage, status },
    isError: status === 'issues',
    text: [
      `# Lumen MCP diagnostics: ${status}`,
      `Catalog hash: ${data.meta.catalogHash}`,
      `Framework coverage — Astro: ${frameworkCoverage.astro}, React: ${frameworkCoverage.react}, Elements: ${frameworkCoverage.elements}`,
      '',
      ...checks.map((check) => `- ${check.status.toUpperCase()} ${check.name}: ${check.message}`),
    ].join('\n'),
  }
}

export const getTokens = (data: LumenData = loadLumenData()): LumenToolResult<{ tokens: LumenData['tokens'] }> => {
  const { tokens } = data
  const chartLines = Object.entries(tokens.chart).map(([name, value]) => `- ${name}: ${value}`)

  const colorLines = Object.entries(tokens.colors).map(([name, value]) => `- ${name}: hsl(${value})`)

  const glassLines = Object.entries(tokens.glass).map(([name, value]) => `- ${name}: ${value}`)

  const text = [
    '# Lumen design tokens',
    `Theme attribute: ${tokens.themeAttribute} (values: light, dark)`,
    '',
    '## Semantic token names (use as `text-ink`, `bg-surface`, `border-line`, etc.)',
    tokens.semantic.map((token) => `- ${token}`).join('\n'),
    '',
    '## Base color values',
    colorLines.join('\n'),
    '',
    '## Data visualization tokens',
    chartLines.join('\n'),
    '',
    '## Glass surface tokens',
    glassLines.join('\n'),
  ].join('\n')

  return { data: { tokens }, text }
}

export const getRules = (data: LumenData = loadLumenData()): LumenToolResult<{ rules: string }> => {
  if (!data.rules) {
    return {
      data: { rules: '' },
      isError: true,
      text: 'No agent rules (llms.txt) were bundled.',
    }
  }

  return {
    data: { rules: data.rules.trimEnd() },
    text: data.rules.trimEnd(),
  }
}

import type {
  LumenComponentSnapshot,
  LumenData,
  LumenFramework,
  LumenFrameworkSnapshot,
  LumenRecipeSnapshot
} from './data.js'
import { loadLumenData } from './data.js'

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
  value.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').replaceAll(/[\s_]+/g, '-').toLowerCase()

const tokenize = (value: string): string[] =>
  normalize(value).split(/[^a-z0-9]+/).filter(Boolean)

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
  recipes: component.recipes.map((recipe) => recipe.name)
})

export const resolveComponent = (
  name: string,
  data: LumenData = loadLumenData()
): LumenComponentSnapshot | undefined => {
  const target = normalize(name)

  return data.components.find((component) => component.name === name) ??
    data.components.find((component) => component.kebab === target) ??
    data.components.find((component) => normalize(component.name) === target)
}

export const resolveRecipe = (
  name: string,
  data: LumenData = loadLumenData()
): LumenRecipeSnapshot | undefined => {
  const target = normalize(name)

  return data.recipes.find((recipe) => normalize(recipe.name) === target)
}

const frameworkSearchText = (component: LumenComponentSnapshot) =>
  Object.values(component.frameworkDetails)
    .flatMap((framework) => [
      framework.packageName,
      framework.propsExtends ?? '',
      framework.props.map((prop) => `${prop.name} ${prop.type}`).join(' '),
      framework.attributes?.join(' ') ?? '',
      framework.tagName ?? ''
    ])
    .join(' ')

const componentSearchText = (component: LumenComponentSnapshot) => [
  component.name,
  component.kebab,
  'accessible accessibility',
  component.description,
  component.category,
  component.collections.join(' '),
  component.keywords.join(' '),
  component.dependencies.join(' '),
  component.guidance?.when ?? '',
  component.guidance?.distinction ?? '',
  component.apiReference
    .map((row) => `${row.attribute} ${row.values} ${row.description}`)
    .join(' '),
  frameworkSearchText(component)
].join(' ')

const scoreCandidate = (
  query: string,
  terms: string[],
  searchableText: string,
  primaryName = ''
) => {
  const normalizedText = normalize(searchableText)
  const matchedTerms = terms.filter((term) => normalizedText.includes(term))

  if (matchedTerms.length !== terms.length) return { matchedTerms, score: 0 }

  const normalizedQuery = normalize(query)
  const normalizedName = normalize(primaryName)

  let score = terms.reduce(
    (total, term) => total + (normalizedName.includes(term) ? 20 : 5),
    0
  )

  if (normalizedText.includes(normalizedQuery)) score += 100

  if (normalizedName === normalizedQuery) score += 500

  return { matchedTerms, score }
}

const appendSearchResult = (
  results: SearchResult[],
  candidate: Omit<SearchResult, 'matchedTerms' | 'score'>,
  query: string,
  terms: string[],
  searchableText: string
) => {
  const match = scoreCandidate(query, terms, searchableText, candidate.name)

  if (match.score > 0) results.push({ ...candidate, ...match })
}

const collectSearchResults = (query: string, terms: string[], data: LumenData): SearchResult[] => {
  const results: SearchResult[] = []

  for (const component of data.components) {
    appendSearchResult(
      results,
      {
        category: component.category,
        description: component.description,
        frameworks: availableFrameworks(component),
        kind: 'component',
        name: component.name
      },
      query,
      terms,
      componentSearchText(component)
    )
  }

  for (const recipe of data.recipes) {
    appendSearchResult(
      results,
      {
        category: recipe.categories.join(', '),
        description: recipe.description,
        kind: 'recipe',
        name: recipe.name
      },
      query,
      terms,
      `${recipe.name} ${recipe.description} ${recipe.categories.join(' ')} ${(recipe.components ?? []).join(' ')}`
    )
  }

  for (const token of data.tokens.semantic) {
    appendSearchResult(
      results,
      {
        description: 'Lumen semantic design token.',
        kind: 'token',
        name: token
      },
      query,
      terms,
      token
    )
  }

  for (const line of data.rules.split('\n').filter((rule) => rule.trim())) {
    appendSearchResult(
      results,
      {
        description: line.trim(),
        kind: 'rule',
        name: line.trim()
      },
      query,
      terms,
      line
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
  data: LumenData = loadLumenData()
): LumenToolResult<{ components: ComponentSummary[]; count: number }> => {
  const query = args.query?.trim()
  const queryTerms = query ? tokenize(query) : []

  const matches = data.components.filter((component) => {
    if (args.framework && !component.frameworks[args.framework]) return false

    if (args.recipe && !component.recipes.some((recipe) => recipe.name === args.recipe)) return false

    if (
      query &&
      scoreCandidate(query, queryTerms, componentSearchText(component), component.name).score === 0
    ) return false

    return true
  })

  const summaries = matches.map(componentSummary)

  if (summaries.length === 0) {
    return {
      data: { components: [], count: 0 },
      text: 'No components matched the given filters.'
    }
  }

  const lines = summaries.map((component) => {
    const recipeNote = component.recipes.length > 0
      ? ` [recipes: ${component.recipes.join(', ')}]`
      : ''

    return `${component.name} (${component.kebab}) — ${component.description} — ${component.frameworks.join(', ')}${recipeNote}`
  })

  return {
    data: { components: summaries, count: summaries.length },
    text: `${summaries.length} component(s):\n\n${lines.join('\n')}`
  }
}

const frameworkWithoutSource = (framework: LumenFrameworkSnapshot) => {
  const { source: _source, ...usage } = framework

  return usage
}

const componentDetail = (
  component: LumenComponentSnapshot,
  framework: LumenFramework,
  detail: ComponentDetailLevel
) => {
  const selectedFramework = component.frameworkDetails[framework]
  const summary = componentSummary(component)

  if (detail === 'summary') {
    return {
      ...summary,
      dependencies: component.dependencies,
      framework: {
        available: selectedFramework.available,
        packageName: selectedFramework.packageName,
        tagName: selectedFramework.tagName
      },
      guidance: component.guidance
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
    runtimeEvents: component.runtimeEvents
  }

  return detail === 'source'
    ? { ...usage, framework: selectedFramework }
    : usage
}

const formatProps = (framework: LumenFrameworkSnapshot): string => {
  if (framework.props.length === 0) {
    return framework.propsExtends
      ? `Props extend ${framework.propsExtends}; no additional local props were detected.`
      : 'No typed props detected.'
  }

  const lines = framework.props.map(
    (prop) => `- ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}`
  )

  const header = framework.propsExtends
    ? `Props (extends ${framework.propsExtends}):`
    : 'Props:'

  return `${header}\n${lines.join('\n')}`
}

const formatComponentUsage = (
  component: LumenComponentSnapshot,
  frameworkName: LumenFramework,
  detail: ComponentDetailLevel
) => {
  const framework = component.frameworkDetails[frameworkName]

  const sections = [
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
      : 'Recipes: none'
  ].filter(Boolean)

  if (detail === 'summary') return sections.join('\n')

  sections.push('', formatProps(framework), '', '## Example', `\`\`\`${framework.language}`)

  sections.push(framework.example, '```')

  if (component.guidance) {
    sections.push('', '## Guidance', component.guidance.when)

    if (component.guidance.distinction) sections.push(component.guidance.distinction)
  }

  if (component.keyboardInteractions.length > 0) {
    sections.push('', '## Keyboard interactions')

    sections.push(...component.keyboardInteractions.map((row) => `- ${row.key}: ${row.action}`))
  }

  if (component.runtimeEvents.length > 0) {
    sections.push('', '## Runtime events')

    sections.push(...component.runtimeEvents.map((event) => `- ${event.name}: ${event.when}`))
  }

  if (detail === 'source') {
    sections.push('', `## ${frameworkName} reference source`)

    sections.push(`\`\`\`${framework.language}`, framework.source.trimEnd(), '```')
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
  data: LumenData = loadLumenData()
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
      text: message
    }
  }

  const framework = args.framework ?? 'astro'
  const detail = args.detail ?? (args.includeSource ? 'source' : 'usage')
  const selectedFramework = component.frameworkDetails[framework]

  if (!selectedFramework.available) {
    const message = `${component.name} is not available for ${framework}.`

    return {
      data: { found: false, message },
      isError: true,
      text: message
    }
  }

  return {
    data: {
      component: componentDetail(component, framework, detail),
      found: true
    },
    text: formatComponentUsage(component, framework, detail)
  }
}

export const getRecipe = (
  args: { framework?: FrameworkFilter | undefined; name: string },
  data: LumenData = loadLumenData()
): LumenToolResult<{ found: boolean; message?: string; recipe?: LumenRecipeSnapshot }> => {
  const recipe = resolveRecipe(args.name, data)

  if (!recipe) {
    const message = `Unknown recipe "${args.name}". Use lumen_search or lumen_list_components to discover recipes.`

    return {
      data: { found: false, message },
      isError: true,
      text: message
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
      `Install for ${framework}: ${recipe.install[framework]}`,
      '',
      '## Components',
      ...componentLines
    ].join('\n')
  }
}

export const search = (
  args: { limit?: number | undefined; query: string },
  data: LumenData = loadLumenData()
): LumenToolResult<{ query: string; results: SearchResult[]; total: number }> => {
  const query = args.query.trim()

  if (!query) {
    return {
      data: { query, results: [], total: 0 },
      isError: true,
      text: 'Provide a non-empty query.'
    }
  }

  const limit = Math.max(1, Math.min(args.limit ?? 20, 100))
  const results = collectSearchResults(query, tokenize(query), data)

  results.sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))

  const shown = results.slice(0, limit)

  if (results.length === 0) {
    return {
      data: { query, results: [], total: 0 },
      text: `No matches for "${args.query}".`
    }
  }

  return {
    data: { query, results: shown, total: results.length },
    text: `${results.length} match(es) for "${args.query}"${
      results.length > shown.length ? ` (showing ${shown.length})` : ''
    }:\n\n${shown.map((result) =>
      `${result.kind}: ${result.name} — ${result.description} [matched: ${result.matchedTerms.join(', ')}]`
    ).join('\n')}`
  }
}

export const getTokens = (
  data: LumenData = loadLumenData()
): LumenToolResult<{ tokens: LumenData['tokens'] }> => {
  const { tokens } = data

  const colorLines = Object.entries(tokens.colors).map(
    ([name, value]) => `- ${name}: hsl(${value})`
  )

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
    '## Glass surface tokens',
    glassLines.join('\n')
  ].join('\n')

  return { data: { tokens }, text }
}

export const getRules = (
  data: LumenData = loadLumenData()
): LumenToolResult<{ rules: string }> => {
  if (!data.rules) {
    return {
      data: { rules: '' },
      isError: true,
      text: 'No agent rules (llms.txt) were bundled.'
    }
  }

  return {
    data: { rules: data.rules.trimEnd() },
    text: data.rules.trimEnd()
  }
}

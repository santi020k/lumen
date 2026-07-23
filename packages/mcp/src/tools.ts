import type { LumenComponentSnapshot, LumenData } from './data.js'
import { loadLumenData } from './data.js'

export type FrameworkFilter = 'astro' | 'elements' | 'react'

export interface LumenToolResult {
  isError?: boolean
  text: string
}

const normalize = (value: string) =>
  value.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').replaceAll(/[\s_]+/g, '-').toLowerCase()

const tokenize = (value: string): string[] =>
  normalize(value).split(/[^a-z0-9]+/).filter(Boolean)

const componentAliases = (component: LumenComponentSnapshot): string => {
  const name = component.kebab
  const aliases: string[] = []

  if (/(?:autocomplete|cascader|checkbox|combobox|field|input|mentions|picker|radio|select|slider|switch|textarea|upload)/.test(name)) {
    aliases.push('form input control field')
  }

  if (/(?:calendar|date|schedule|time)/.test(name)) {
    aliases.push('date time scheduling')
  }

  if (/(?:alert-dialog|dialog|drawer|popover|sheet|popconfirm)/.test(name)) {
    aliases.push('modal overlay confirmation')
  }

  if (/(?:alert|callout|message|note|sonner|toast)/.test(name)) {
    aliases.push('notification feedback status message')
  }

  if (/(?:breadcrumb|menu|pagination|sidebar|tabs)/.test(name)) {
    aliases.push('navigation')
  }

  if (/(?:progress|skeleton|spinner)/.test(name)) {
    aliases.push('loading progress status')
  }

  if (/(?:chart|data-table|list|table|tree)/.test(name)) {
    aliases.push('data collection display')
  }

  return aliases.join(' ')
}

const scoreSearchCandidate = (
  query: string,
  terms: string[],
  searchableText: string,
  primaryName = ''
): number => {
  const normalizedText = normalize(searchableText)

  if (!terms.every((term) => normalizedText.includes(term))) return 0

  const normalizedQuery = normalize(query)
  const normalizedName = normalize(primaryName)
  let score = terms.reduce((total, term) => total + (normalizedName.includes(term) ? 20 : 5), 0)

  if (normalizedText.includes(normalizedQuery)) score += 100

  if (normalizedName === normalizedQuery) score += 500

  return score
}

export const resolveComponent = (
  name: string,
  data: LumenData = loadLumenData()
): LumenComponentSnapshot | undefined => {
  const target = normalize(name)

  return data.components.find((component) => component.name === name) ??
    data.components.find((component) => component.kebab === target) ??
    data.components.find((component) => normalize(component.name) === target)
}

const formatProps = (component: LumenComponentSnapshot): string => {
  if (component.props.length === 0) {
    return component.propsExtends
      ? `Props extend ${component.propsExtends}; no additional local props were detected.`
      : 'No typed props detected.'
  }

  const lines = component.props.map(
    (prop) => `- ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}`
  )

  const header = component.propsExtends ? `Props (extends ${component.propsExtends}):` : 'Props:'

  return `${header}\n${lines.join('\n')}`
}

const frameworkSummary = (component: LumenComponentSnapshot): string => {
  const available = Object.entries(component.frameworks)
    .filter(([, isAvailable]) => isAvailable)
    .map(([framework]) => framework)

  return available.length > 0 ? available.join(', ') : 'none detected'
}

export const listComponents = (
  args: { framework?: FrameworkFilter | undefined; query?: string | undefined; recipe?: string | undefined } = {},
  data: LumenData = loadLumenData()
): LumenToolResult => {
  const query = args.query ? normalize(args.query) : ''

  const matches = data.components.filter((component) => {
    if (args.framework && !component.frameworks[args.framework]) return false

    if (args.recipe && !component.recipes.some((recipe) => recipe.name === args.recipe)) return false

    if (query && !normalize(component.name).includes(query) && !component.kebab.includes(query)) return false

    return true
  })

  if (matches.length === 0) {
    return { text: 'No components matched the given filters.' }
  }

  const lines = matches.map((component) => {
    const recipes = component.recipes.map((recipe) => recipe.name)
    const recipeNote = recipes.length > 0 ? ` [recipes: ${recipes.join(', ')}]` : ''

    return `${component.name} (${component.kebab}) — ${frameworkSummary(component)}${recipeNote}`
  })

  return {
    text: `${matches.length} component(s):\n\n${lines.join('\n')}`
  }
}

export const getComponent = (
  args: { includeSource?: boolean | undefined; name: string },
  data: LumenData = loadLumenData()
): LumenToolResult => {
  const component = resolveComponent(args.name, data)

  if (!component) {
    return {
      isError: true,
      text: `Unknown component "${args.name}". Use lumen_list_components to see available names.`
    }
  }

  const sections = [
    `# ${component.name}`,
    `Aliases: ${component.kebab}`,
    `Frameworks: ${frameworkSummary(component)}`,
    component.recipes.length > 0
      ? `Recipes: ${component.recipes.map((recipe) => `${recipe.name} (${recipe.type})`).join(', ')}`
      : 'Recipes: none',
    '',
    formatProps(component)
  ]

  const includeSource = args.includeSource !== false

  if (includeSource && component.frameworks.astro && component.astroSource) {
    sections.push('', '## Astro source', '```astro', component.astroSource.trimEnd(), '```')
  } else if (includeSource) {
    sections.push('', 'No Astro reference source is bundled for this component.')
  }

  return { text: sections.join('\n') }
}

export const search = (
  args: { limit?: number | undefined; query: string },
  data: LumenData = loadLumenData()
): LumenToolResult => {
  const query = args.query.trim()

  if (!query) {
    return { isError: true, text: 'Provide a non-empty query.' }
  }

  const limit = Math.max(1, Math.min(args.limit ?? 20, 100))
  const terms = tokenize(query)
  const results: { label: string; score: number }[] = []

  for (const component of data.components) {
    const haystack = [
      component.name,
      component.kebab,
      componentAliases(component),
      component.propsExtends ?? '',
      component.props.map((prop) => `${prop.name} ${prop.type}`).join(' ')
    ].join(' ')

    const score = scoreSearchCandidate(query, terms, haystack, component.name)

    if (score > 0) {
      results.push({
        label: `component: ${component.name} (${component.kebab}) — ${frameworkSummary(component)}`,
        score
      })
    }
  }

  for (const recipe of data.recipes) {
    const haystack = `${recipe.name} ${(recipe.components ?? []).join(' ')}`
    const score = scoreSearchCandidate(query, terms, haystack, recipe.name)

    if (score > 0) {
      results.push({
        label: `recipe: ${recipe.name} — ${(recipe.components ?? []).join(', ') || 'files'}`,
        score
      })
    }
  }

  for (const token of data.tokens.semantic) {
    const score = scoreSearchCandidate(query, terms, token, token)

    if (score > 0) {
      results.push({ label: `token: ${token}`, score })
    }
  }

  for (const line of data.rules.split('\n')) {
    const score = scoreSearchCandidate(query, terms, line)

    if (score > 0) {
      results.push({ label: `rule: ${line.trim()}`, score })
    }
  }

  if (results.length === 0) {
    return { text: `No matches for "${args.query}".` }
  }

  results.sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))

  const shown = results.slice(0, limit)

  return {
    text: `${results.length} match(es) for "${args.query}"${
      results.length > shown.length ? ` (showing ${shown.length})` : ''
    }:\n\n${shown.map((result) => result.label).join('\n')}`
  }
}

export const getTokens = (data: LumenData = loadLumenData()): LumenToolResult => {
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

  return { text }
}

export const getRules = (data: LumenData = loadLumenData()): LumenToolResult => {
  if (!data.rules) {
    return { isError: true, text: 'No agent rules (llms.txt) were bundled.' }
  }

  return { text: data.rules.trimEnd() }
}

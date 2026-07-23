import type { LumenComponentSnapshot, LumenData } from './data.js'
import { loadLumenData } from './data.js'

export type FrameworkFilter = 'astro' | 'elements' | 'react'

export interface LumenToolResult {
  isError?: boolean
  text: string
}

const normalize = (value: string) =>
  value.replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2').replaceAll(/[\s_]+/g, '-').toLowerCase()

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
  const query = args.query.trim().toLowerCase()

  if (!query) {
    return { isError: true, text: 'Provide a non-empty query.' }
  }

  const limit = Math.max(1, Math.min(args.limit ?? 20, 100))
  const results: string[] = []

  for (const component of data.components) {
    const haystack = [
      component.name,
      component.kebab,
      component.propsExtends ?? '',
      component.props.map((prop) => `${prop.name} ${prop.type}`).join(' ')
    ].join(' ').toLowerCase()

    if (haystack.includes(query)) {
      results.push(`component: ${component.name} (${component.kebab}) — ${frameworkSummary(component)}`)
    }
  }

  for (const recipe of data.recipes) {
    const haystack = `${recipe.name} ${(recipe.components ?? []).join(' ')}`.toLowerCase()

    if (haystack.includes(query)) {
      results.push(`recipe: ${recipe.name} — ${(recipe.components ?? []).join(', ') || 'files'}`)
    }
  }

  for (const token of data.tokens.semantic) {
    if (token.toLowerCase().includes(query)) {
      results.push(`token: ${token}`)
    }
  }

  if (data.rules.toLowerCase().includes(query)) {
    const ruleLines = data.rules
      .split('\n')
      .filter((line) => line.toLowerCase().includes(query))
      .slice(0, 5)
      .map((line) => `rule: ${line.trim()}`)

    results.push(...ruleLines)
  }

  if (results.length === 0) {
    return { text: `No matches for "${args.query}".` }
  }

  const shown = results.slice(0, limit)

  return {
    text: `${results.length} match(es) for "${args.query}"${
      results.length > shown.length ? ` (showing ${shown.length})` : ''
    }:\n\n${shown.join('\n')}`
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

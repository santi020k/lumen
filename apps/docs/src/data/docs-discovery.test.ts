import { readdirSync, readFileSync } from 'node:fs'
import { Script } from 'node:vm'

import ts from 'typescript'
import { describe, expect, test } from 'vitest'

import { getMatchedSearchItems, normalizeSearchText } from '../lib/docs-search'
import { toSlug } from '../lib/routes'

import { chartGuides } from './chart-guides'
import { chartTopics } from './chart-topics'
import { componentDocs, runtimeEvents } from './docs'
import { getCurrentDocsContextLink, getDocsContextLinks } from './docs-context-navigation'
import { guideDestinations } from './guides'
import { mcpGuideTopics } from './mcp-guides'
import { getNativeComponentsForPlatform } from './native-components'
import { nativeGuidePlatforms, nativeGuideTopics } from './native-guide-topics'
import { reactHookGuides } from './react-hooks'
import { docsSearchIndex } from './search'

const pagesDirectory = new URL('../pages/', import.meta.url)

const pageRoute = (file: string): string => {
  const path = file.slice(0, -'.astro'.length)

  return `/${path.endsWith('/index') ? path.slice(0, -'/index'.length) : path}`
}

// Execute the route's exported path generator with its real data dependencies. Merely
// matching a wildcard filename would miss a guide omitted from getStaticPaths.
const dynamicPageRoutes = (file: string): string[] => {
  const source = readFileSync(new URL(file, pagesDirectory), 'utf8')
  const frontmatter = source.slice(source.indexOf('---') + 3)
  const parsed = ts.createSourceFile(file, frontmatter, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS)
  const declaration = parsed.statements.filter(ts.isVariableStatement)
    .flatMap(statement => statement.declarationList.declarations)
    .find(candidate => ts.isIdentifier(candidate.name) && candidate.name.text === 'getStaticPaths')

  if (!declaration?.initializer) throw new Error(`Missing getStaticPaths in ${file}`)

  const compiled = ts.transpileModule(`(${declaration.initializer.getText(parsed)})()`, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS }
  })
  const paths: unknown = new Script(compiled.outputText).runInNewContext({
    componentDocs, getNativeComponentsForPlatform, nativeGuideTopics, reactHookGuides, toSlug
  }, { timeout: 1000 })

  if (!Array.isArray(paths)) throw new Error(`getStaticPaths in ${file} did not return an array`)

  const entries: unknown[] = paths

  return entries.map(entry => {
    if (typeof entry !== 'object' || entry === null || !('params' in entry) ||
      typeof entry.params !== 'object' || entry.params === null) {
      throw new Error(`Missing static path parameters in ${file}`)
    }

    const params = new Map(Object.entries(entry.params))

    return pageRoute(file).replaceAll(/\[([^\]]+)\]/g, (_match: string, name: string) => {
      const value: unknown = params.get(name)

      if (typeof value !== 'string') throw new Error(`Missing parameter ${name} in ${file}`)

      return value
    })
  })
}

const staticPageRoutes = (directory: URL, prefix = ''): string[] => readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => {
    const relative = `${prefix}${entry.name}`

    if (entry.isDirectory()) return staticPageRoutes(new URL(`${entry.name}/`, directory), `${relative}/`)

    return entry.isFile() && relative.endsWith('.astro') && !relative.includes('[') ? [pageRoute(relative)] : []
  })

const routes = new Set([
  ...staticPageRoutes(pagesDirectory),
  ...[
    'docs/components/[slug].astro',
    'docs/frameworks/react/hooks/[slug].astro',
    'docs/[platform]/[topic].astro',
    'docs/[platform]/components/[slug].astro'
  ].flatMap(dynamicPageRoutes)
])

const searchDestinations = (query: string): string[] => (
  getMatchedSearchItems(docsSearchIndex, normalizeSearchText(query)).map(item => item.href)
)

describe('documentation discovery', () => {
  test('finds all 16 chart guides by name and by the question they answer', () => {
    expect(chartGuides).toHaveLength(16)

    for (const guide of chartGuides) {
      const href = `/docs/components/${guide.slug}`
      const entries = docsSearchIndex.filter(item => item.href === href && item.type === 'Component')

      expect(entries).toHaveLength(1)
      expect(searchDestinations(guide.name)[0]).toBe(href)
      expect(searchDestinations(guide.question)).toContain(href)
      expect(routes.has(href), `Missing chart page: ${href}`).toBe(true)
    }
  })

  test('finds every React hook at its focused page rather than an old framework-page anchor', () => {
    expect(reactHookGuides).toHaveLength(19)

    for (const hook of reactHookGuides) {
      expect(searchDestinations(hook.name)[0]).toBe(hook.href)
      expect(docsSearchIndex.filter(item => item.title === hook.name).map(item => item.href)).toEqual([hook.href])
      expect(routes.has(hook.href), `Missing hook page: ${hook.href}`).toBe(true)
      expect(routes.has(hook.componentHref), `Missing hook visual reference: ${hook.componentHref}`).toBe(true)
      expect(getCurrentDocsContextLink(getDocsContextLinks('web'), hook.href)?.label).toBe('React')
    }
  })

  test('makes all nine native guides searchable and selects their dedicated context link', () => {
    expect(nativeGuideTopics).toHaveLength(9)

    for (const topic of nativeGuideTopics) {
      expect(searchDestinations(topic.title)).toContain(topic.href)
      expect(docsSearchIndex.filter(item => item.href === topic.href)).toHaveLength(1)
      expect(getCurrentDocsContextLink(getDocsContextLinks(topic.platform), topic.href)?.href).toBe(topic.href)
      expect(routes.has(topic.href), `Missing native guide page: ${topic.href}`).toBe(true)
    }
  })

  test('indexes every available native component under its own platform and existing reference route', () => {
    for (const platform of nativeGuidePlatforms) {
      for (const component of getNativeComponentsForPlatform(platform)) {
        const title = `${component.name} (${platform})`
        const href = `/docs/${platform}/components/${component.slug}`

        expect(docsSearchIndex.filter(item => item.href === href && item.type === 'Component')).toHaveLength(1)
        expect(searchDestinations(title)[0]).toBe(href)
        expect(routes.has(href), `Missing native component page: ${href}`).toBe(true)
        expect(getCurrentDocsContextLink(getDocsContextLinks(platform), href)?.href).toBe(`/docs/${platform}/components`)
      }
    }
  })

  test('finds each chart topic and MCP reference page without requiring a long overview-page scroll', () => {
    for (const topic of chartTopics) {
      expect(searchDestinations(`Charts: ${topic.label}`)).toContain(topic.href)
      expect(getCurrentDocsContextLink(getDocsContextLinks('web'), topic.href)?.href).toBe('/docs/web/data-visualization')
    }

    for (const topic of mcpGuideTopics.slice(1)) {
      expect(searchDestinations(`MCP: ${topic.label}`)).toContain(topic.href)
      expect(getCurrentDocsContextLink(getDocsContextLinks(undefined), topic.href)?.href).toBe('/docs/mcp')
    }
  })

  test('keeps guide inventories unique and backed by actual static routes', () => {
    const destinations = [
      ...guideDestinations,
      ...chartTopics,
      ...mcpGuideTopics,
      ...nativeGuideTopics,
      ...reactHookGuides
    ].map(guide => guide.href)

    expect(new Set(destinations).size).toBe(destinations.length)

    for (const href of destinations) {
      expect(href, 'Focused guide destinations should be pages').not.toContain('#')
      expect(routes.has(href), `Guide destination does not have a generated page: ${href}`).toBe(true)
    }
  })

  test('routes every runtime event to the component that documents its exact name and target', () => {
    expect(runtimeEvents.length).toBeGreaterThan(0)

    for (const event of runtimeEvents) {
      const owner = componentDocs.find(component => component.runtimeEvents?.some(
        item => item.name === event.name && item.target === event.target
      ))

      if (!owner) throw new Error(`${event.name} targeting ${event.target} is not documented on any component`)

      const pageHref = `/docs/components/${toSlug(owner.name)}`
      const href = `${pageHref}#runtime-events-title`
      const matches = docsSearchIndex.filter(item => item.type === 'Event' &&
        item.title === event.name && item.category === owner.name)

      expect(matches, `Expected exactly one search result for ${event.name} on ${owner.name}`).toHaveLength(1)
      expect(matches[0]?.href).toBe(href)
      expect(routes.has(pageHref), `Missing component page: ${pageHref}`).toBe(true)
    }
  })

  test('never falls back to the generic docs landing page for a runtime event search result', () => {
    const missingDestinations = docsSearchIndex.filter(item => item.type === 'Event' && (item.href === '/docs' || item.category === 'Runtime'))

    expect(missingDestinations).toEqual([])
  })

  test('keeps shared chart runtime events documented by every chart primitive that fires them', () => {
    const chartOwners = componentDocs
      .filter(component => component.runtimeEvents?.some(event => event.name === 'ui:chart-datum-activate'))
      .map(component => component.name)
      .sort((a, b) => a.localeCompare(b))

    expect(chartOwners).toEqual(
      ['BarChart', 'ComboChart', 'Heatmap', 'LineChart', 'PieChart', 'RangeChart', 'ScatterChart'].sort((a, b) => a.localeCompare(b))
    )
  })

  test('documents Transfer, Cascader, and TreeSelect runtime events on their own component pages', () => {
    const ownEvents: readonly (readonly [string, string])[] = [
      ['Transfer', 'ui:transfer-change'],
      ['Cascader', 'ui:cascader-change'],
      ['TreeSelect', 'ui:tree-select-change']
    ]

    for (const [name, eventName] of ownEvents) {
      const component = componentDocs.find(entry => entry.name === name)

      expect(component?.runtimeEvents?.map(event => event.name)).toEqual([eventName])
      expect(searchDestinations(eventName)).toContain(`/docs/components/${toSlug(name)}#runtime-events-title`)
    }
  })

  test('separates the ThemeToggle and ThemeBuilder ui:theme-change events by their real target', () => {
    const themeToggle = componentDocs.find(component => component.name === 'ThemeToggle')
    const themeBuilder = componentDocs.find(component => component.name === 'ThemeBuilder')

    expect(themeToggle?.runtimeEvents?.map(event => event.name)).toEqual(['ui:theme-change'])
    expect(themeToggle?.runtimeEvents?.every(event => event.target.startsWith('ThemeToggle'))).toBe(true)

    expect(themeBuilder?.runtimeEvents?.map(event => event.name)).toEqual(['ui:theme-change', 'ui:theme-export'])
    expect(themeBuilder?.runtimeEvents?.every(event => !event.target.startsWith('ThemeToggle'))).toBe(true)

    const themeToggleHref = `/docs/components/${toSlug('ThemeToggle')}#runtime-events-title`
    const themeBuilderHref = `/docs/components/${toSlug('ThemeBuilder')}#runtime-events-title`

    const matches = docsSearchIndex.filter(item => item.type === 'Event' && item.title === 'ui:theme-change')

    expect(matches.map(item => item.href).sort()).toEqual([themeBuilderHref, themeToggleHref].sort())
    expect(matches.map(item => item.category).sort()).toEqual(['ThemeBuilder', 'ThemeToggle'])
    expect(searchDestinations('ui:theme-change')).toEqual(expect.arrayContaining([themeToggleHref, themeBuilderHref]))
  })

  test('documents the Tabs ui:tabs-change runtime event on its own component page', () => {
    const tabs = componentDocs.find(component => component.name === 'Tabs')

    expect(tabs?.runtimeEvents?.map(event => event.name)).toEqual(['ui:tabs-change'])
    expect(searchDestinations('ui:tabs-change')).toContain(`/docs/components/${toSlug('Tabs')}#runtime-events-title`)
  })
})

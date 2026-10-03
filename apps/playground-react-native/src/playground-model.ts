import {
  componentCategories,
  type ComponentCategory,
  componentNames
} from './playground-catalog.generated'

export type AppDestination = 'components' | 'examples' | 'home' | 'settings'

export {
  componentCategories,
  type ComponentCategory,
  componentNames,
  playgroundLumenVersion
} from './playground-catalog.generated'

export const getComponentCategory = (name: string): ComponentCategory | undefined => (
  componentCategories.find(category => category.names.includes(name))?.value
)

export const normalizeComponentQuery = (value: string): string => (
  value.toLowerCase().replace(/[\s_-]+/g, '')
)

export const getVisibleComponentNames = (
  query: string,
  category: ComponentCategory | 'all',
  embedded: boolean
): string[] => {
  const normalizedQuery = normalizeComponentQuery(query)

  return componentNames.filter(name => {
    const matchesCategory = category === 'all' || getComponentCategory(name) === category

    const matchesQuery = embedded && normalizedQuery.length > 0 ?
      normalizeComponentQuery(name) === normalizedQuery :
      normalizeComponentQuery(name).includes(normalizedQuery)

    return matchesCategory && matchesQuery
  })
}

export const isAppDestination = (value: string): value is AppDestination => (
  value === 'components' || value === 'examples' || value === 'home' || value === 'settings'
)

export const isComponentCategory = (value: string): value is ComponentCategory => (
  componentCategories.some(category => category.value === value)
)

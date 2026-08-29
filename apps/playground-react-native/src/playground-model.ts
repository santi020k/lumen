import {
  componentCategories,
  type ComponentCategory,
  componentNames
} from './playground-catalog.generated'

export type AppDestination = 'components' | 'examples' | 'home' | 'settings'

export {
  componentCategories,
  type ComponentCategory,
  componentNames
} from './playground-catalog.generated'

export const getComponentCategory = (name: string): ComponentCategory | undefined => (
  componentCategories.find(category => category.names.includes(name))?.value
)

export const getVisibleComponentNames = (
  query: string,
  category: ComponentCategory | 'all',
  embedded: boolean
): string[] => {
  const normalizedQuery = query.trim().toLowerCase()

  return componentNames.filter(name => {
    const matchesCategory = category === 'all' || getComponentCategory(name) === category

    const matchesQuery = embedded && normalizedQuery.length > 0 ?
      name.toLowerCase() === normalizedQuery :
      name.toLowerCase().includes(normalizedQuery)

    return matchesCategory && matchesQuery
  })
}

export const isAppDestination = (value: string): value is AppDestination => (
  value === 'components' || value === 'examples' || value === 'home' || value === 'settings'
)

export const isComponentCategory = (value: string): value is ComponentCategory => (
  componentCategories.some(category => category.value === value)
)

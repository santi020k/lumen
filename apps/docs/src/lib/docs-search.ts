export interface DocsSearchItem {
  category: string
  description: string
  href: string
  keywords: string
  title: string
  type: 'Component' | 'Event' | 'Prop' | 'Recipe'
}

const COMPONENT_SCORE_BOOST = 75

export const normalizeSearchText = (value: string): string =>
  value.toLowerCase().normalize('NFKD').replaceAll(/[\u0300-\u036f]/g, '')

const scoreSearchItem = (item: DocsSearchItem, query: string): number => {
  const title = normalizeSearchText(item.title)
  const category = normalizeSearchText(item.category)
  const keywords = normalizeSearchText(item.keywords)
  const tokens = query.split(/\s+/).filter(Boolean)

  if (!tokens.every(token => title.includes(token) || category.includes(token) || keywords.includes(token))) {
    return 0
  }

  let score = 1

  if (title === query) score += 80

  if (title.startsWith(query)) score += 45

  if (title.includes(query)) score += 25

  if (category.includes(query)) score += 12

  score += tokens.reduce((sum, token) => sum + (keywords.includes(token) ? 4 : 0), 0)

  if (item.type === 'Component') score += COMPONENT_SCORE_BOOST

  return score
}

export const getMatchedSearchItems = (
  index: DocsSearchItem[],
  query: string,
  limit = 8
): DocsSearchItem[] =>
  index
    .map(item => ({ item, score: scoreSearchItem(item, query) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map(result => result.item)

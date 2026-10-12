export interface DocsSearchItem {
  category: string
  description: string
  href: string
  keywords: string
  title: string
  type: 'Component' | 'Event' | 'Prop' | 'Recipe'
}

const COMPONENT_SCORE_BOOST = 75

export const normalizeSearchText = (value: string): string => value.toLowerCase().normalize('NFKD').replaceAll(/[\u0300-\u036f]/g, '')

const includesSearchToken = (value: string, token: string): boolean => {
  if (token.length > 2 || /[^\p{L}\p{N}]/u.test(token)) return value.includes(token)

  return value.split(/[^\p{L}\p{N}]+/u).some(word => word.startsWith(token))
}

interface NormalizedSearchFields {
  category: string
  keywords: string
  source: Pick<DocsSearchItem, 'category' | 'keywords' | 'title'>
  title: string
}

// Normalizing every item's keywords dominated each search. Entries live only as long as their item and are
// rebuilt whenever the item's searchable text changes, so mutable indexes stay correct.
const normalizedFields = new WeakMap<DocsSearchItem, NormalizedSearchFields>()

const getNormalizedFields = (item: DocsSearchItem): NormalizedSearchFields => {
  const cached = normalizedFields.get(item)

  if (cached?.source.title === item.title && cached.source.category === item.category &&
    cached.source.keywords === item.keywords) return cached

  const fields = {
    category: normalizeSearchText(item.category),
    keywords: normalizeSearchText(item.keywords),
    source: { category: item.category, keywords: item.keywords, title: item.title },
    title: normalizeSearchText(item.title)
  }

  normalizedFields.set(item, fields)

  return fields
}

const scoreSearchItem = (item: DocsSearchItem, query: string, tokens: readonly string[]): number => {
  const { category, keywords, title } = getNormalizedFields(item)

  if (!tokens.every(token => includesSearchToken(title, token) ||
    includesSearchToken(category, token) || includesSearchToken(keywords, token))) {
    return 0
  }

  let score = 1

  if (title === query) score += 80

  if (title.startsWith(query)) score += 45

  if (title.includes(query)) score += 25

  if (category.includes(query)) score += 12

  score += tokens.reduce((sum, token) => sum + (includesSearchToken(keywords, token) ? 4 : 0), 0)

  if (item.type === 'Component') score += COMPONENT_SCORE_BOOST

  return score
}

export const getMatchedSearchItems = (
  index: DocsSearchItem[],
  query: string,
  limit = 8
): DocsSearchItem[] => {
  const tokens = query.split(/\s+/).filter(Boolean)

  return index
    .map(item => ({ item, score: scoreSearchItem(item, query, tokens) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map(result => result.item)
}

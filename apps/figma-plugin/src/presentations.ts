import type { DesignNode } from './model.js'

// The presentation sets expose their original canonical component as a nested
// instance. Old instances retain their original Figma property IDs.
export const presentationKeys = {
  Card: '1e21a9e58516679d291b2609408aa1c738866766',
  Dialog: '63563dfaa925dddacb9a3e7ecca680aa4c192fd0'
} as const

export const presentationName = (node: DesignNode) => {
  const key = node.component?.setKey

  if (key === presentationKeys.Card) return 'Card'

  if (key === presentationKeys.Dialog) return 'Dialog'

  return null
}

export const stackGaps = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'related', 'group', 'section']

const property = (node: DesignNode, name: string) => {
  const raw = node.properties[name]

  return typeof raw === 'string' ? raw.toLowerCase() : ''
}

const glassAttribute = (value: string, elements: boolean) => {
  if (value === 'glass') return elements ? ' glass="true"' : ' glass'

  if (value === 'subtle' || value === 'strong') return ` glass="${value}"`

  return ''
}

export const cardPresentationAttributes = (node: DesignNode, elements: boolean) => {
  const variant = property(node, 'Variant')
  const density = property(node, 'Density')
  const surface = variant.startsWith('glass ') ? variant.slice(6) : variant
  const appearance = ['muted', 'interactive', 'unstyled'].includes(variant) ? ` variant="${variant}"` : glassAttribute(surface, elements)
  const padding = ['compact', 'spacious'].includes(density) ? ` density="${density}"` : ''

  return appearance + padding
}

export const dialogPresentationAttributes = (node: DesignNode, elements: boolean) => {
  const layout = property(node, 'Layout') === 'fullscreen' ? ' layout="fullscreen"' : ''

  return layout + glassAttribute(property(node, 'Surface'), elements)
}

import {
  fab,
  type IconDefinition
} from '@fortawesome/free-brands-svg-icons'
import {
  getLumenIconPack,
  type LumenIconData,
  type LumenIconNode,
  registerLumenIconPack
} from '@santi020k/lumen-core'

export const lumenBrandIconPrefix = 'brand'

const createBrandIcon = (name: string, icon: IconDefinition): LumenIconData => ({
  height: icon.icon[1],
  name,
  node: (Array.isArray(icon.icon[4]) ? icon.icon[4] : [icon.icon[4]])
    .map(path => ['path', { d: path }] as LumenIconNode),
  source: lumenBrandIconPrefix,
  style: 'fill',
  width: icon.icon[0]
})

const createBrandCatalog = () => {
  const icons = new Map<string, LumenIconData>()

  for (const icon of Object.values(fab)) {
    if (!icons.has(icon.iconName)) {
      icons.set(icon.iconName, createBrandIcon(icon.iconName, icon))
    }
  }

  const xTwitter = icons.get('x-twitter')

  if (xTwitter) {
    icons.set('x', { ...xTwitter, name: 'x' })
  }

  return Object.fromEntries(
    [...icons.entries()].sort(([a], [b]) => a.localeCompare(b))
  )
}

export const lumenBrandIcons = Object.freeze(createBrandCatalog())

export type LumenBrandIconName = keyof typeof lumenBrandIcons

export const lumenBrandIconNames = Object.freeze(
  Object.keys(lumenBrandIcons)
) as readonly LumenBrandIconName[]

export const registerLumenBrandIcons = () => {
  registerLumenIconPack(lumenBrandIconPrefix, lumenBrandIcons)

  return getLumenIconPack(lumenBrandIconPrefix)
}

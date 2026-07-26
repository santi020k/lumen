import {
  getLumenIconPack,
  type LumenIconData,
  type LumenIconNode,
  registerLumenIconPack
} from '@santi020k/lumen-core'

import {
  faGithub,
  faLinkedin,
  faMedium,
  faWhatsapp,
  faXTwitter
} from '@fortawesome/free-brands-svg-icons'

export const lumenBrandIconPrefix = 'brand'

interface FontAwesomeBrandIcon {
  icon: [number, number, string[], string, string | string[]]
}

const createBrandIcon = (name: string, icon: FontAwesomeBrandIcon): LumenIconData => ({
  height: icon.icon[1],
  name,
  node: (Array.isArray(icon.icon[4]) ? icon.icon[4] : [icon.icon[4]])
    .map(path => ['path', { d: path }] as LumenIconNode),
  source: lumenBrandIconPrefix,
  style: 'fill',
  width: icon.icon[0]
})

export const lumenBrandIcons = Object.freeze({
  github: createBrandIcon('github', faGithub),
  linkedin: createBrandIcon('linkedin', faLinkedin),
  medium: createBrandIcon('medium', faMedium),
  whatsapp: createBrandIcon('whatsapp', faWhatsapp),
  x: createBrandIcon('x', faXTwitter)
})

export type LumenBrandIconName = keyof typeof lumenBrandIcons

export const lumenBrandIconNames = Object.freeze(
  Object.keys(lumenBrandIcons).sort()
) as readonly LumenBrandIconName[]

export const registerLumenBrandIcons = () => {
  registerLumenIconPack(lumenBrandIconPrefix, lumenBrandIcons)

  return getLumenIconPack(lumenBrandIconPrefix)
}

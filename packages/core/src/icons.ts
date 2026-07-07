import {
  icons as lucideIcons,
  type LucideIconData,
  type LucideIconNode
} from '@lucide/icons'

export type LumenIconNode = LucideIconNode
export type LumenIconData = LucideIconData
export type LumenIconName = string

const toKebabCase = (value: string) =>
  value.trim()
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll(/[\s_]+/g, '-')
    .toLowerCase()

const lucideIconEntries = Object.entries(lucideIcons)

const createLumenIconEntries = () => {
  const entries: [string, LumenIconData][] = []

  for (const [exportName, icon] of lucideIconEntries) {
    entries.push([toKebabCase(exportName), icon], [icon.name, icon])

    for (const alias of icon.aliases ?? []) {
      entries.push([toKebabCase(alias), icon])
    }
  }

  return entries
}

export const lumenIcons = Object.freeze(
  Object.fromEntries(createLumenIconEntries())
) as Readonly<Record<string, LumenIconData>>

export const lumenIconNames = Object.freeze(Object.keys(lumenIcons).sort())

const escapeHtmlAttribute = (value: string) =>
  value.replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const renderAttributes = (attributes: Record<string, string>) =>
  Object.entries(attributes)
    .map(([name, value]) => `${name}="${escapeHtmlAttribute(value)}"`)
    .join(' ')

const renderIconNode = ([tagName, attributes, children]: LumenIconNode): string => {
  const renderedAttributes = renderAttributes(attributes)
  const openingTag = renderedAttributes ? `<${tagName} ${renderedAttributes}` : `<${tagName}`

  if (!children?.length) {
    return `${openingTag} />`
  }

  return `${openingTag}>${children.map(renderIconNode).join('')}</${tagName}>`
}

export const resolveLumenIconName = (name: string): LumenIconName | undefined => {
  const normalized = toKebabCase(name)

  return lumenIcons[normalized] ? normalized : undefined
}

export const getLumenIcon = (name: string): LumenIconData | undefined => {
  const resolvedName = resolveLumenIconName(name)

  return resolvedName ? lumenIcons[resolvedName] : undefined
}

export interface LumenIconSvgOptions {
  className?: string
}

export const renderLumenIconSvg = (name: string, options: LumenIconSvgOptions = {}) => {
  const icon = getLumenIcon(name)

  if (!icon) return ''

  const className = ['ui-icon__svg', `lucide-${icon.name}`, options.className].filter(Boolean).join(' ')

  return `<svg ${renderAttributes({
    'aria-hidden': 'true',
    class: className,
    fill: 'none',
    focusable: 'false',
    height: '1em',
    stroke: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    viewBox: '0 0 24 24',
    width: '1em',
    xmlns: 'http://www.w3.org/2000/svg'
  })}>${icon.node.map(renderIconNode).join('')}</svg>`
}

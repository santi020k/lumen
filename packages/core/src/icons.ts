import {
  icons as lucideIcons,
  type LucideIconData
} from '@lucide/icons'

export type LumenIconNode = readonly [
  tagName: string,
  attributes: Readonly<Record<string, number | string>>,
  children?: readonly LumenIconNode[]
]
export type LumenIconStyle = 'fill' | 'stroke'
export type LumenIconData = Omit<LucideIconData, 'node'> & {
  node: readonly LumenIconNode[]
  source?: string
  style?: LumenIconStyle
}
export type LumenIconName = string
export type LumenIconPack = Readonly<Record<string, LumenIconData>>

const toKebabCase = (value: string) => value
  .trim()
  .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replaceAll(/[\s_]+/g, '-')
  .toLowerCase()

const lucideIconEntries = Object.entries(lucideIcons)
const registeredIconPacks = new Map<string, LumenIconPack>()

const createLumenIconEntries = () => {
  const entries: [string, LumenIconData][] = []

  for (const [exportName, icon] of lucideIconEntries) {
    entries.push([toKebabCase(exportName), icon])

    if (icon.name) {
      entries.push([icon.name, icon])
    }

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

const parseIconName = (name: string) => {
  const separatorIndex = name.indexOf(':')

  if (separatorIndex < 0) {
    return { iconName: toKebabCase(name) }
  }

  return {
    iconName: toKebabCase(name.slice(separatorIndex + 1)),
    prefix: toKebabCase(name.slice(0, separatorIndex))
  }
}

export const registerLumenIconPack = (prefix: string, icons: LumenIconPack) => {
  const normalizedPrefix = toKebabCase(prefix)

  if (!normalizedPrefix || normalizedPrefix.includes(':')) {
    throw new Error(
      'Lumen icon pack prefixes must be non-empty and cannot contain colons.'
    )
  }

  const normalizedIcons = Object.fromEntries(
    Object.entries(icons).map(([name, icon]) => [toKebabCase(name), icon])
  ) as LumenIconPack

  registeredIconPacks.set(normalizedPrefix, Object.freeze(normalizedIcons))
}

export const getLumenIconPack = (prefix: string): LumenIconPack | undefined => (
  registeredIconPacks.get(toKebabCase(prefix))
)

export const getRegisteredLumenIconNames = () => [...registeredIconPacks.entries()]
  .flatMap(([prefix, icons]) => Object.keys(icons).map(name => `${prefix}:${name}`))
  .sort()

const escapeHtmlAttribute = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const renderAttributes = (attributes: Readonly<Record<string, number | string>>) => Object.entries(attributes)
  .map(([name, value]) => `${name}="${escapeHtmlAttribute(String(value))}"`)
  .join(' ')

const renderIconNode = ([
  tagName,
  attributes,
  children
]: LumenIconNode): string => {
  const renderedAttributes = renderAttributes(attributes)

  const openingTag = renderedAttributes ?
    `<${tagName} ${renderedAttributes}` :
    `<${tagName}`

  if (!children?.length) {
    return `${openingTag} />`
  }

  return `${openingTag}>${children.map(renderIconNode).join('')}</${tagName}>`
}

export const resolveLumenIconName = (
  name: string
): LumenIconName | undefined => {
  const { iconName, prefix } = parseIconName(name)

  if (!prefix) {
    return lumenIcons[iconName] ? iconName : undefined
  }

  return registeredIconPacks.get(prefix)?.[iconName] ?
    `${prefix}:${iconName}` :
    undefined
}

export const getLumenIcon = (name: string): LumenIconData | undefined => {
  const resolvedName = resolveLumenIconName(name)

  if (!resolvedName) return undefined

  const { iconName, prefix } = parseIconName(resolvedName)

  return prefix ?
    registeredIconPacks.get(prefix)?.[iconName] :
    lumenIcons[iconName]
}

export interface LumenIconSvgOptions {
  className?: string
}

const resolveLumenIconDimensions = (icon: LumenIconData) => {
  if ('size' in icon) {
    const size = icon.size ?? 24

    return { height: size, width: size }
  }

  return {
    height: icon.height ?? 24,
    width: icon.width ?? 24
  }
}

const resolveLumenIconClassName = (icon: LumenIconData, requestedName: string) => (
  icon.name ?? parseIconName(requestedName).iconName
)

export const renderLumenIconSvg = (
  name: string,
  options: LumenIconSvgOptions = {}
) => {
  const icon = getLumenIcon(name)

  if (!icon) return ''

  const iconStyle = icon.style ?? 'stroke'
  const source = icon.source ?? 'lucide'
  const iconName = resolveLumenIconClassName(icon, name)
  const { height, width } = resolveLumenIconDimensions(icon)

  const className = [
    'ui-icon__svg',
    `${source}-${iconName}`,
    options.className
  ]
    .filter(Boolean)
    .join(' ')

  return `<svg ${renderAttributes({
    'aria-hidden': 'true',
    class: className,
    fill: iconStyle === 'fill' ? 'currentColor' : 'none',
    focusable: 'false',
    height: '1em',
    stroke: iconStyle === 'stroke' ? 'currentColor' : 'none',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': iconStyle === 'stroke' ? '2' : '0',
    viewBox: `0 0 ${width} ${height}`,
    width: '1em',
    xmlns: 'http://www.w3.org/2000/svg'
  })}>${icon.node.map(renderIconNode).join('')}</svg>`
}

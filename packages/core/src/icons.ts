import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Copy,
  ExternalLink,
  House,
  Info,
  LoaderCircle,
  type LucideIconData,
  type LucideIconNode,
  Menu,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  TriangleAlert,
  X
} from '@lucide/icons'

export type LumenIconNode = LucideIconNode
export type LumenIconData = LucideIconData

export const lumenIconNames = [
  'arrow-left',
  'arrow-right',
  'calendar',
  'check',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'circle-alert',
  'circle-check',
  'copy',
  'external-link',
  'home',
  'info',
  'loader-circle',
  'menu',
  'minus',
  'more-horizontal',
  'plus',
  'search',
  'settings',
  'triangle-alert',
  'x'
] as const

export type LumenIconName = typeof lumenIconNames[number]

export const lumenIcons = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  calendar: Calendar,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  copy: Copy,
  'external-link': ExternalLink,
  home: House,
  info: Info,
  'loader-circle': LoaderCircle,
  menu: Menu,
  minus: Minus,
  'more-horizontal': MoreHorizontal,
  plus: Plus,
  search: Search,
  settings: Settings,
  'triangle-alert': TriangleAlert,
  x: X
} as const satisfies Record<LumenIconName, LumenIconData>

const iconNameSet = new Set<string>(lumenIconNames)

const toKebabCase = (value: string) =>
  value.trim()
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll(/[\s_]+/g, '-')
    .toLowerCase()

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

  return iconNameSet.has(normalized) ? normalized as LumenIconName : undefined
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

import { createElement, type ReactNode } from 'react'

import type { LumenIconData, LumenIconNode } from '@santi020k/lumen-core'

const reactSvgAttributeNames: Record<string, string> = {
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-width': 'strokeWidth',
  tabindex: 'tabIndex'
}

const toReactSvgAttributes = (attributes: Readonly<Record<string, number | string>>) => Object.fromEntries(
  Object.entries(attributes).map(([name, value]) => [
    reactSvgAttributeNames[name] ?? name,
    value
  ])
)

const renderIconNode = (
  [tagName, attributes, children]: LumenIconNode,
  index: number
): ReactNode => createElement(
  tagName, {
    ...toReactSvgAttributes(attributes),
    key: attributes.key ?? index
  }, children?.map(renderIconNode)
)

export const renderIconSvg = (icon: LumenIconData, className: string) => {
  const width = ('size' in icon ? icon.size : icon.width) ?? 24
  const height = ('size' in icon ? icon.size : icon.height) ?? 24

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={icon.style === 'fill' ? 'currentColor' : 'none'}
      focusable="false"
      height="1em"
      stroke={icon.style === 'fill' ? 'none' : 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={icon.style === 'fill' ? '0' : '2'}
      viewBox={`0 0 ${width} ${height}`}
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      {icon.node.map(renderIconNode)}
    </svg>
  )
}

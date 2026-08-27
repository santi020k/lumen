import {
  createLumenElementClass,
  defineLumenElement,
  type LumenCustomElementRegistry,
  type LumenElementConfig
} from '../element-base.js'

export const lumenBadgeElementConfig = {
  attributeClasses: {
    variant: {
      default: 'ui-badge--default',
      destructive: 'ui-badge--destructive',
      outline: 'ui-badge--outline',
      secondary: 'ui-badge--secondary',
      success: 'ui-badge--success',
      warning: 'ui-badge--warning'
    }
  },
  baseClassName: 'ui-badge',
  defaults: { variant: 'default' },
  tagName: 'lumen-badge'
} as const satisfies LumenElementConfig

export const LumenBadgeElement = createLumenElementClass(
  lumenBadgeElementConfig
)

export const defineLumenBadge = (
  registry?: LumenCustomElementRegistry
): void => {
  defineLumenElement(lumenBadgeElementConfig, LumenBadgeElement, registry)
}

import {
  createLumenElementClass,
  defineLumenElement,
  type LumenCustomElementRegistry,
  type LumenElementConfig
} from '../element-base.js'

export const lumenButtonElementConfig = {
  attributeClasses: {
    variant: {
      default: 'ui-button--default',
      destructive: 'ui-button--destructive',
      ghost: 'ui-button--ghost',
      link: 'ui-button--link',
      outline: 'ui-button--outline',
      secondary: 'ui-button--secondary'
    },
    size: {
      default: 'ui-button--default-size',
      icon: 'ui-button--icon',
      lg: 'ui-button--lg',
      sm: 'ui-button--sm'
    },
    disabled: { true: 'ui-button--disabled' },
    loading: { true: 'ui-button--loading' }
  },
  baseClassName: 'ui-button',
  defaults: {
    'data-slot': 'button',
    role: 'button',
    size: 'default',
    tabindex: '0',
    variant: 'default'
  },
  role: 'button',
  tagName: 'lumen-button'
} as const satisfies LumenElementConfig

export const LumenButtonElement = createLumenElementClass(
  lumenButtonElementConfig
)

export const defineLumenButton = (
  registry?: LumenCustomElementRegistry
): void => {
  defineLumenElement(lumenButtonElementConfig, LumenButtonElement, registry)
}

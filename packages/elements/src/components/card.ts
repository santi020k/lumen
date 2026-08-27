import {
  createLumenElementClass,
  defineLumenElement,
  type LumenCustomElementRegistry,
  type LumenElementConfig
} from '../element-base.js'

export const lumenCardElementConfig = {
  attributeClasses: {
    glass: {
      strong: 'ui-card--glass ui-glass-strong',
      subtle: 'ui-card--glass ui-glass-subtle',
      true: 'ui-card--glass'
    },
    variant: {
      glass: 'ui-card--glass',
      interactive: 'ui-card--interactive',
      muted: 'ui-card--muted',
      unstyled: 'ui-card--unstyled'
    }
  },
  baseClassName: 'ui-card',
  defaults: { 'data-slot': 'card', variant: 'default' },
  tagName: 'lumen-card'
} as const satisfies LumenElementConfig

export const LumenCardElement = createLumenElementClass(
  lumenCardElementConfig
)

export const defineLumenCard = (
  registry?: LumenCustomElementRegistry
): void => {
  defineLumenElement(lumenCardElementConfig, LumenCardElement, registry)
}

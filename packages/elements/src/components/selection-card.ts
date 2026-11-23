import {
  createLumenElementClass,
  defineLumenElement,
  type LumenCustomElementRegistry,
  type LumenElementConfig
} from '../element-base.js'

const variants = {
  outline: 'ui-selection-card--outline',
  soft: 'ui-selection-card--soft'
} as const

/** The child label and native input own labelling, form values and checked state. */
export const lumenCheckboxCardElementConfig = {
  attributeClasses: { variant: variants },
  baseClassName: 'ui-selection-card ui-checkbox-card',
  defaults: { 'data-slot': 'checkbox-card', variant: 'outline' },
  tagName: 'lumen-checkbox-card'
} as const satisfies LumenElementConfig

/** Author a native radio input inside the child label; group choices by name. */
export const lumenRadioCardElementConfig = {
  attributeClasses: { variant: variants },
  baseClassName: 'ui-selection-card ui-radio-card',
  defaults: { 'data-slot': 'radio-card', variant: 'outline' },
  tagName: 'lumen-radio-card'
} as const satisfies LumenElementConfig

export const LumenCheckboxCardElement = createLumenElementClass(lumenCheckboxCardElementConfig)
export const LumenRadioCardElement = createLumenElementClass(lumenRadioCardElementConfig)

export const defineLumenCheckboxCard = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenCheckboxCardElementConfig, LumenCheckboxCardElement, registry)
}

export const defineLumenRadioCard = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenRadioCardElementConfig, LumenRadioCardElement, registry)
}

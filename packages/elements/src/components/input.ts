import { LumenScalarFormControlElement } from '../editorial-behaviors.js'
import { defineLumenElement, type LumenCustomElementRegistry, type LumenElementConfig } from '../element-base.js'
import { observedAttributeNames } from '../observed-attributes.js'

export const lumenInputElementConfig = {
  attributeClasses: {
    'visual-size': { lg: 'ui-input--lg', sm: 'ui-input--sm' }
  },
  baseClassName: 'ui-input',
  defaults: { type: 'text' },
  tagName: 'lumen-input'
} as const satisfies LumenElementConfig

export class LumenInputElement extends LumenScalarFormControlElement {
  static override config = { ...lumenInputElementConfig, observedAttributes: observedAttributeNames }
}

export const defineLumenInput = (registry?: LumenCustomElementRegistry): void => {
  defineLumenElement(lumenInputElementConfig, LumenInputElement, registry)
}

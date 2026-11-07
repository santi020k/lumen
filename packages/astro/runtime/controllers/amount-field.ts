import { createLumenAmountFieldController, type LumenAmountFieldController } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

const enhanced = new WeakMap<HTMLElement, LumenAmountFieldController>()

export const initAmountFields = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-amount-field]')) {
    const controller = enhanced.get(root)

    if (controller) controller.refresh()
    else enhanced.set(root, createLumenAmountFieldController(root))
  }
}

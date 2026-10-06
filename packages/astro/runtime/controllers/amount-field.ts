import { createLumenAmountFieldController, type LumenAmountFieldController } from '@santi020k/lumen-core'

const enhanced = new WeakMap<HTMLElement, LumenAmountFieldController>()

export const initAmountFields = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-amount-field]')) {
    const controller = enhanced.get(root)

    if (controller) controller.refresh()
    else enhanced.set(root, createLumenAmountFieldController(root))
  }
}

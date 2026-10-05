import { createLumenAmountFieldController } from '@santi020k/lumen-core'

const enhanced = new WeakSet<HTMLElement>()

export const initAmountFields = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-amount-field]')) {
    if (enhanced.has(root)) continue

    createLumenAmountFieldController(root)

    enhanced.add(root)
  }
}

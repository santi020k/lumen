import { createLumenChartInteractionController } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

interface BoundChart {
  controller: ReturnType<typeof createLumenChartInteractionController>
  document: Document
}

const controllers = new Map<HTMLElement, BoundChart>()

export const initChartControllers = (scope: ParentNode): void => {
  for (const [root, binding] of controllers) {
    if (!root.isConnected || root.ownerDocument !== binding.document) {
      binding.controller.destroy()

      controllers.delete(root)
    }
  }

  for (const root of queryScope(scope, '[data-ui-chart-interactive]')) {
    if (!controllers.has(root)) {
      controllers.set(root, {
        controller: createLumenChartInteractionController(root),
        document: root.ownerDocument
      })
    }
  }
}

document.addEventListener('astro:before-swap', () => {
  for (const { controller } of controllers.values()) controller.destroy()

  controllers.clear()
})

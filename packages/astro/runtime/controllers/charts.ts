import { createLumenChartInteractionController } from '@santi020k/lumen-core'

const controllers = new Map<HTMLElement, ReturnType<typeof createLumenChartInteractionController>>()

export const initChartControllers = (scope: ParentNode): void => {
  for (const [root, controller] of controllers) {
    if (!root.isConnected) {
      controller.destroy()

      controllers.delete(root)
    }
  }

  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-chart-interactive]')) {
    if (!controllers.has(root)) controllers.set(root, createLumenChartInteractionController(root))
  }
}

document.addEventListener('astro:before-swap', () => {
  for (const controller of controllers.values()) controller.destroy()

  controllers.clear()
})

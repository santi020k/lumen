import { createLumenChartActivationController } from '@santi020k/lumen-core'

const controllers = new Map<HTMLElement, ReturnType<typeof createLumenChartActivationController>>()

export const initChartActivationControllers = (scope: ParentNode): void => {
  for (const [root, controller] of controllers) {
    if (root.isConnected) continue

    controller.destroy()

    root.removeAttribute('data-ui-chart-activation-bound')

    controllers.delete(root)
  }

  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-chart-activation]:not([data-ui-chart-adapter="react"]):not([data-ui-chart-adapter="elements"])')) {
    if (!controllers.has(root)) {
      controllers.set(root, createLumenChartActivationController(root))

      root.setAttribute('data-ui-chart-activation-bound', 'true')
    }
  }
}

document.addEventListener('astro:before-swap', () => {
  for (const [root, controller] of controllers) {
    controller.destroy()

    root.removeAttribute('data-ui-chart-activation-bound')
  }

  controllers.clear()
})

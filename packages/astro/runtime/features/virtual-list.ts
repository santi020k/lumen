import { createLumenVirtualListController } from '@santi020k/lumen-core'

const virtualListControllers = new Map<HTMLElement, { destroy: () => void, ownerDocument: Document }>()

export const initVirtualLists = (scope: ParentNode): void => {
  for (const [root, controller] of virtualListControllers) {
    if (!root.isConnected || root.ownerDocument !== controller.ownerDocument) {
      controller.destroy()

      virtualListControllers.delete(root)
    }
  }

  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-virtual-list]')) {
    if (!virtualListControllers.has(root)) virtualListControllers.set(root, {
      ...createLumenVirtualListController(root), ownerDocument: root.ownerDocument
    })
  }
}

export const clearVirtualLists = (): void => {
  for (const controller of virtualListControllers.values()) controller.destroy()

  virtualListControllers.clear()
}

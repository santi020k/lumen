import { createLumenComboboxController, type LumenComboboxController } from '@santi020k/lumen-core'

interface BoundCombobox {
  controller: LumenComboboxController
  document: Document
  eventRoot: Node
}

const controllers = new Map<HTMLElement, BoundCombobox>()

export const closeCombobox = (root: HTMLElement): void => {
  controllers.get(root)?.controller.close()
}

export const clearComboboxes = (): void => {
  for (const { controller } of controllers.values()) controller.destroy()

  controllers.clear()
}

export const initComboboxes = (scope: ParentNode): void => {
  for (const [root, binding] of controllers) {
    if (!root.isConnected || root.ownerDocument !== binding.document || root.getRootNode() !== binding.eventRoot) {
      binding.controller.destroy()

      controllers.delete(root)
    }
  }

  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-combobox]')) {
    if (!controllers.has(root)) {
      controllers.set(root, {
        controller: createLumenComboboxController(root),
        document: root.ownerDocument,
        eventRoot: root.getRootNode()
      })
    }
  }
}

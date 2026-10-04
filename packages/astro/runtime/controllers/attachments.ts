import { createLumenAttachmentPreviewController } from '@santi020k/lumen-core'

const enhanced = new WeakSet<HTMLElement>()

export const initAttachmentPreviewControllers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-attachment-preview]')) {
    if (enhanced.has(root)) continue

    createLumenAttachmentPreviewController(root)

    enhanced.add(root)
  }
}

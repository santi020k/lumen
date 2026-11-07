import { createLumenAttachmentPreviewController } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

const enhanced = new WeakSet<HTMLElement>()

export const initAttachmentPreviewControllers = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-attachment-preview]')) {
    if (enhanced.has(root)) continue

    createLumenAttachmentPreviewController(root)

    enhanced.add(root)
  }
}

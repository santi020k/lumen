import { createLumenMessageScrollerController } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

const enhanced = new WeakSet<HTMLElement>()

export const initMessageFeeds = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-message-scroller]')) {
    if (enhanced.has(root)) continue

    createLumenMessageScrollerController(root, { threshold: Number(root.getAttribute('scroll-threshold') ?? 32) })

    enhanced.add(root)
  }
}

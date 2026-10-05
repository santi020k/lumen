import { createLumenMessageScrollerController } from '@santi020k/lumen-core'

const enhanced = new WeakSet<HTMLElement>()

export const initMessageFeeds = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-message-scroller]')) {
    if (enhanced.has(root)) continue

    createLumenMessageScrollerController(root, { threshold: Number(root.getAttribute('scroll-threshold') ?? 32) })

    enhanced.add(root)
  }
}

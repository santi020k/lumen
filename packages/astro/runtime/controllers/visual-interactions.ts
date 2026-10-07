import { bindLumenApprovalCard, bindLumenChartMotion, bindLumenMotionGroup, bindLumenTabIndicator, createLumenPromptComposerController, createLumenSpotlightController, type LumenWorkflowDuration } from '@santi020k/lumen-core'

let bindings = new WeakMap<HTMLElement, () => void>()
const roots = new Set<WeakRef<HTMLElement>>()

export const clearVisualInteractionControllers = (): void => {
  for (const reference of roots) {
    const root = reference.deref()

    if (root) bindings.get(root)?.()
  }

  roots.clear()

  bindings = new WeakMap()
}

const removeDetachedBindings = (): void => {
  for (const reference of roots) {
    const root = reference.deref()

    if (root?.isConnected) continue

    if (root) {
      bindings.get(root)?.()

      bindings.delete(root)
    }

    roots.delete(reference)
  }
}

const bind = (root: HTMLElement): (() => void) => {
  if (root.hasAttribute('data-ui-tab-indicator')) return bindLumenTabIndicator(root)

  if (root.hasAttribute('data-ui-chart-motion')) {
    const duration = root.dataset.uiMotionDuration

    return bindLumenChartMotion(root, duration === 'fast' || duration === 'slow' ? duration : 'standard')
  }

  if (root.hasAttribute('data-ui-motion-group')) {
    const raw = root.dataset.uiMotionDuration
    const duration: LumenWorkflowDuration = raw === 'fast' || raw === 'slow' ? raw : 'standard'

    return bindLumenMotionGroup(root, { duration, enterExit: root.dataset.uiMotionEnterExit !== 'false' })
  }

  if (root.hasAttribute('data-ui-prompt-composer')) {
    const controller = createLumenPromptComposerController(root)

    return () => {
      controller.destroy()
    }
  }

  if (root.hasAttribute('data-ui-approval-card')) return bindLumenApprovalCard(root)

  return createLumenSpotlightController(root)
}

export const initVisualInteractionControllers = (scope: ParentNode): void => {
  removeDetachedBindings()

  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-tab-indicator], [data-ui-chart-motion], [data-ui-motion-group], [data-ui-visual-effect="spotlight"], [data-ui-prompt-composer], [data-ui-approval-card]')) {
    if (bindings.has(root)) continue

    roots.add(new WeakRef(root))

    bindings.set(root, bind(root))
  }
}

if (typeof document !== 'undefined') document.addEventListener('astro:before-swap', clearVisualInteractionControllers)

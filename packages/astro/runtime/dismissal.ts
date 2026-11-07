import type { LumenRuntimeController, LumenRuntimeDismissal } from './types.js'

const controllers = new Set<LumenRuntimeController>()
let bound = false
const shadowTrees = new Set<WeakRef<ShadowRoot>>()
const trackedTrees = new WeakMap<ShadowRoot, WeakRef<ShadowRoot>>()
const shadowEventPaths = new WeakMap<Event, EventTarget[]>()

const rememberTree = (tree: ShadowRoot): void => {
  let reference = trackedTrees.get(tree)

  if (!reference) {
    reference = new WeakRef(tree)

    trackedTrees.set(tree, reference)

    // Preserve the inner path before a closed shadow tree hides it from document listeners.
    for (const type of ['click', 'keydown']) {
      tree.addEventListener(type, event => shadowEventPaths.set(event, event.composedPath()), true)
    }
  }

  shadowTrees.add(reference)
}

const dismissalTrees = (): ParentNode[] => {
  const trees: ParentNode[] = [document]

  for (const reference of shadowTrees) {
    const tree = reference.deref()

    if (!tree) shadowTrees.delete(reference)
    else if (tree.host.isConnected) trees.push(tree)
  }

  return trees
}

const eventPath = (event: Event): EventTarget[] => shadowEventPaths.get(event) ?? event.composedPath()

const matchesDismissal = (target: HTMLElement, dismissal: LumenRuntimeDismissal | undefined): boolean => (
  dismissal !== undefined && !target.closest('[data-ui-owner]') &&
  target.matches(dismissal.selector) && dismissal.isOpen?.(target) !== false
)

const closeOutside = (event: MouseEvent): void => {
  if (!(event.target instanceof Node)) return

  const path = eventPath(event)
  const trees = dismissalTrees()

  for (const { outside } of controllers) {
    if (!outside) continue

    for (const tree of trees) {
      for (const root of tree.querySelectorAll<HTMLElement>(outside.selector)) {
        if (!path.includes(root) && matchesDismissal(root, outside)) outside.close(root)
      }
    }
  }
}

const closeOnEscape = (event: KeyboardEvent): void => {
  if (event.defaultPrevented || event.isComposing || event.key !== 'Escape') return

  for (const target of eventPath(event)) {
    if (!(target instanceof HTMLElement)) continue

    for (const { escape } of controllers) {
      if (!escape || !matchesDismissal(target, escape)) continue

      event.preventDefault()

      escape.close(target, true)

      return
    }
  }
}

const isShadowTree = (node: Node): node is ShadowRoot => node.nodeType === 11 && 'host' in node

/** Load shared dismissal only for controllers that need it, retaining persisted shadow hosts. */
export const bindDismissal = (controller: LumenRuntimeController, scope: ParentNode): void => {
  controllers.add(controller)

  const tree = scope.getRootNode()

  if (isShadowTree(tree)) rememberTree(tree)

  if (bound) return

  bound = true

  document.addEventListener('click', closeOutside)

  document.addEventListener('keydown', closeOnEscape)
}

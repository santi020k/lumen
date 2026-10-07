const roots = new WeakSet<Node>()
const isRoot = (node: Node): node is ParentNode => 'querySelectorAll' in node

export const bindComparisonReset = (node: Node, syncs: WeakMap<HTMLInputElement, () => number>): void => {
  const scope = node.getRootNode()

  if (!isRoot(scope) || roots.has(scope)) return

  roots.add(scope)

  scope.addEventListener('reset', event => {
    setTimeout(() => {
      if (event.defaultPrevented) return

      for (const input of scope.querySelectorAll<HTMLInputElement>('[data-ui-image-comparison-input]')) {
        if (input.isConnected && input.form === event.target) syncs.get(input)?.()
      }
    })
  }, true)
}

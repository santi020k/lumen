const isElement = (node: Node): node is Element => node.nodeType === 1
const isHtmlElement = (node: Node): node is HTMLElement => isElement(node) && node.namespaceURI === 'http://www.w3.org/1999/xhtml'
const isIdRoot = (node: Node): node is Document | DocumentFragment => node.nodeType === 9 || node.nodeType === 11
const isFocusRoot = (node: Node): node is Document | ShadowRoot => node.nodeType === 9 || (node.nodeType === 11 && 'host' in node)

export const getScopeActiveElement = (reference: Element): Element | null => {
  const tree = reference.getRootNode()

  return isFocusRoot(tree) ? tree.activeElement : null
}

/** Resolve control relationships in their own tree, including detached and shadow content. */
export const getScopeTarget = (reference: Element, id: string): HTMLElement | null => {
  if (!id) return null

  const tree = reference.getRootNode()
  let target: Element | null = null

  if (isIdRoot(tree)) target = tree.getElementById(id)
  else if (isElement(tree)) {
    target = tree.id === id ?
      tree :
      [...tree.querySelectorAll('[id]')].find(element => element.id === id) ?? null
  }

  return target && isHtmlElement(target) ? target : null
}

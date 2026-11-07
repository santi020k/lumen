const isElement = (node: Node): node is Element => node.nodeType === 1
const isHtmlElement = (node: Node): node is HTMLElement => isElement(node) && node.namespaceURI === 'http://www.w3.org/1999/xhtml'

export const matchesScope = (scope: ParentNode, selector: string): boolean => (
  (isElement(scope) && scope.matches(selector)) || scope.querySelector(selector) !== null
)

/** Query a controller's root and descendants without reaching into sibling components. */
export function queryScope(scope: ParentNode, selector: string): HTMLElement[]
export function queryScope<T extends keyof HTMLElementTagNameMap>(
  scope: ParentNode, selector: string, tagName: T
): HTMLElementTagNameMap[T][]
export function queryScope(scope: ParentNode, selector: string, tagName?: keyof HTMLElementTagNameMap): HTMLElement[] {
  const elements = [...scope.querySelectorAll(selector)].filter(isHtmlElement)

  if (isHtmlElement(scope) && scope.matches(selector)) elements.unshift(scope)

  return tagName ? elements.filter(element => element.localName === tagName) : elements
}

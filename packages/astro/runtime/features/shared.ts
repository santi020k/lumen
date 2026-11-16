let uiGeneratedId = 0

export const nextRuntimeId = (prefix: string, ownerDocument: Document): string => {
  let id: string

  do {
    id = `${prefix}-${++uiGeneratedId}`
  } while (ownerDocument.getElementById(id))

  return id
}

export const getLoopedIndex = (
  key: string,
  currentIndex: number,
  itemCount: number,
  forwardKeys: readonly string[]
): number => {
  const lastIndex = itemCount - 1

  if (key === 'Home') return 0

  if (key === 'End') return lastIndex

  if (forwardKeys.includes(key)) return (currentIndex + 1) % itemCount

  return (currentIndex - 1 + itemCount) % itemCount
}

export const shouldIgnoreKeydown = (event: KeyboardEvent): boolean => (
  event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey
)

export const isOwnedByAnotherAdapter = (root: Element): boolean => root.hasAttribute('data-ui-owner')

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

export const supportsAnchoredPopovers =
  typeof HTMLElement !== 'undefined' &&
  'showPopover' in HTMLElement.prototype &&
  typeof CSS !== 'undefined' &&
  CSS.supports('anchor-name: --ui-anchor') &&
  CSS.supports('position-area: block-end')

let uiGeneratedId = 0

export const nextRuntimeId = (prefix: string, ownerDocument: Document): string => {
  let id: string

  do {
    id = `${prefix}-${++uiGeneratedId}`
  } while (ownerDocument.getElementById(id))

  return id
}

let uiAnchorCount = 0

export const nextAnchorName = (): string => `--ui-anchor-${++uiAnchorCount}`

const isElementVisible = (element: HTMLElement): boolean => {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ visibilityProperty: true })
  }

  const visibility = getComputedStyle(element).visibility

  if (visibility === 'hidden' || visibility === 'collapse') return false

  return element.offsetParent !== null || element.getClientRects().length > 0
}

export const getFocusable = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>(focusableSelector)
]
  .filter(element => !element.matches(':disabled') && !element.closest('[hidden], [inert]') && isElementVisible(element))

export const getPanel = (trigger: HTMLElement): HTMLElement | null => {
  const controls = trigger.getAttribute('aria-controls')

  if (controls) {
    return document.getElementById(controls)
  }

  return trigger.nextElementSibling instanceof HTMLElement ? trigger.nextElementSibling : null
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

export const setOpen = (trigger: HTMLElement, panel: HTMLElement, open: boolean): void => {
  trigger.setAttribute('aria-expanded', String(open))

  if (panel.hasAttribute('popover')) {
    try {
      if (open) {
        panel.hidden = false

        panel.showPopover()
      } else {
        panel.hidePopover()
      }
    } catch {
      /* popover already in requested state */
    }

    panel.hidden = !open
  } else {
    panel.hidden = !open
  }

  panel.dataset.state = open ? 'open' : 'closed'
}

export const isOwnedByAnotherAdapter = (root: Element): boolean => root.hasAttribute('data-ui-owner')

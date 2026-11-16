import { getScopeActiveElement, getScopeTarget } from './relationships.js'

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
    return getScopeTarget(trigger, controls)
  }

  return trigger.nextElementSibling instanceof HTMLElement ? trigger.nextElementSibling : null
}

export const shouldRestorePanelFocus = (panel: HTMLElement): boolean => {
  let reference: Element | null = panel

  while (reference) {
    const activeElement = getScopeActiveElement(reference)

    if (activeElement) {
      // WebKit can blur pointer-activated buttons to the page or enclosing modal.
      return panel.contains(activeElement) || activeElement === panel.ownerDocument.body ||
        (activeElement.matches('dialog[open]') && activeElement.contains(reference))
    }

    const tree = reference.getRootNode()

    reference = tree instanceof ShadowRoot ? tree.host : null
  }

  return false
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

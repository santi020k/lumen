import { getScopeActiveElement } from '../relationships.js'
import { queryScope } from '../scope.js'

import { getFocusable, getLoopedIndex, getPanel, nextAnchorName, setOpen, supportsAnchoredPopovers } from './shared.js'

const disclosureSelector = '[data-ui-popover], [data-ui-dropdown-menu], [data-ui-hover-card]'
const boundDisclosures = new WeakSet<HTMLElement>()

export const isBoundDisclosure = (root: HTMLElement): boolean => boundDisclosures.has(root)

export const closeDisclosure = (root: HTMLElement): void => {
  const trigger = root.querySelector<HTMLElement>('[data-ui-trigger]')

  if (!trigger) return

  const panel = getPanel(trigger)

  if (!panel) return

  setOpen(trigger, panel, false)
}

const bindDisclosures = (root: HTMLElement): void => {
  if (root.closest('[data-ui-owner]')) return

  const trigger = root.querySelector<HTMLElement>('[data-ui-trigger]')

  if (!trigger) return

  const panel = getPanel(trigger)

  if (!panel || trigger.dataset.uiBound === 'true') return

  trigger.dataset.uiBound = 'true'

  boundDisclosures.add(root)

  trigger.setAttribute('aria-haspopup', trigger.getAttribute('aria-haspopup') ?? 'menu')

  if (supportsAnchoredPopovers) {
    const anchorName = nextAnchorName()

    panel.hidden = false

    panel.setAttribute('popover', 'manual')

    trigger.style.setProperty('anchor-name', anchorName)

    panel.style.setProperty('position-anchor', anchorName)
  }

  setOpen(trigger, panel, trigger.getAttribute('aria-expanded') === 'true')

  trigger.addEventListener('click', () => {
    setOpen(trigger, panel, trigger.getAttribute('aria-expanded') !== 'true')
  })

  trigger.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing) return

    if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
      event.preventDefault()

      setOpen(trigger, panel, false)

      return
    }

    if (event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()

    setOpen(trigger, panel, true)

    getFocusable(panel)[0]?.focus()
  })

  panel.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing) return

    if (event.key === 'Escape') {
      event.preventDefault()

      setOpen(trigger, panel, false)

      trigger.focus({ preventScroll: true })

      return
    }

    if (event.target instanceof Element && event.target.matches('input, textarea, [contenteditable="true"]')) return

    if (root.hasAttribute('data-ui-cascader')) return

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

    const items = getFocusable(panel)

    if (!items.length) return

    event.preventDefault()

    const currentIndex = items.findIndex(item => item === getScopeActiveElement(panel))
    const nextItem = items[getLoopedIndex(event.key, Math.max(0, currentIndex), items.length, ['ArrowDown'])]

    nextItem?.focus()
  })

  if (root.hasAttribute('data-ui-dropdown-menu')) {
    panel.addEventListener('click', event => {
      const item = event.target instanceof Element ?
        event.target.closest<HTMLElement>('[role="menuitem"]') :
        null

      if (!item || item.matches(':disabled, [aria-disabled="true"]')) return

      setOpen(trigger, panel, false)
    })
  }

  if (root.hasAttribute('data-ui-hover-card')) {
    const containsFocusTarget = (target: EventTarget | null): boolean => {
      try {
        return Reflect.apply(root.contains.bind(root), root, [target]) === true
      } catch {
        return false
      }
    }

    root.addEventListener('mouseenter', () => {
      setOpen(trigger, panel, true)
    })

    root.addEventListener('mouseleave', () => {
      if (!root.contains(getScopeActiveElement(root))) setOpen(trigger, panel, false)
    })

    root.addEventListener('focusin', event => {
      if (containsFocusTarget(event.relatedTarget)) return

      setOpen(trigger, panel, true)
    })

    root.addEventListener('focusout', event => {
      if (containsFocusTarget(event.relatedTarget)) return

      setOpen(trigger, panel, false)
    })
  }
}

export const initDisclosures = (scope: ParentNode): void => {
  for (const root of queryScope(scope, disclosureSelector)) bindDisclosures(root)
}

import { nextAnchorName, nextRuntimeId, supportsAnchoredPopovers } from './shared.js'

const bindTooltips = (root: HTMLElement): void => {
  if (root.dataset.uiTooltipBound === 'true') return

  const tip = root.querySelector<HTMLElement>('[role="tooltip"]')

  const triggerSelector = [
    '[data-ui-tooltip-trigger]',
    '[data-ui-trigger]',
    'button',
    'a[href]',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  const trigger = root.querySelector<HTMLElement>(triggerSelector)

  if (!tip) return

  root.dataset.uiTooltipBound = 'true'

  if (trigger && !trigger.closest('[role="tooltip"]')) {
    if (!tip.id) {
      tip.id = nextRuntimeId('ui-tooltip', tip.ownerDocument)
    }

    const describedBy = new Set((trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean))

    describedBy.add(tip.id)

    trigger.setAttribute('aria-describedby', [...describedBy].join(' '))
  }

  if (supportsAnchoredPopovers) {
    const anchorName = nextAnchorName()

    tip.setAttribute('popover', 'manual')

    root.style.setProperty('anchor-name', anchorName)

    tip.style.setProperty('position-anchor', anchorName)

    let showTimer = 0

    const show = (delay: number): void => {
      window.clearTimeout(showTimer)

      showTimer = window.setTimeout(() => {
        try {
          tip.showPopover()
        } catch {
          /* already open */
        }
      }, delay)
    }

    const hide = (): void => {
      window.clearTimeout(showTimer)

      try {
        tip.hidePopover()
      } catch {
        /* already closed */
      }
    }

    root.addEventListener('mouseenter', () => {
      show(250)
    })

    root.addEventListener('mouseleave', hide)

    root.addEventListener('focusin', () => {
      show(0)
    })

    root.addEventListener('focusout', hide)

    root.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.isComposing) return

      if (event.key === 'Escape' && tip.matches(':popover-open')) {
        event.preventDefault()

        hide()
      }
    })
  } else {
    /* WCAG 1.4.13: hover/focus tooltips must be dismissible with Escape. */
    root.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.isComposing) return

      if (event.key !== 'Escape' || getComputedStyle(tip).visibility === 'hidden') return

      event.preventDefault()

      tip.style.visibility = 'hidden'
    })

    root.addEventListener('mouseleave', () => {
      tip.style.removeProperty('visibility')
    })

    root.addEventListener('focusout', () => {
      tip.style.removeProperty('visibility')
    })
  }
}

export const initTooltips = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('.ui-tooltip, [data-ui-tooltip]')) bindTooltips(root)
}

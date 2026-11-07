import { queryScope } from '../scope.js'

export const initThemeToggles = (scope: ParentNode): void => {
  const root = document.documentElement
  const selector = '[data-ui-theme-toggle]'
  const transitionDurationMs = 580
  const transitionFallbackDelayMs = 750
  const transitionZIndex = 99999
  const animatingControls = new WeakSet<HTMLButtonElement>()

  const sync = (theme: string): void => {
    for (const control of document.querySelectorAll<HTMLButtonElement>(selector)) {
      const darkTheme = control.dataset.darkTheme ?? 'dark'
      const isDark = theme === darkTheme

      control.setAttribute('aria-pressed', String(isDark))

      control.dataset.uiTheme = theme
    }
  }

  const apply = (theme: string, control?: HTMLButtonElement): void => {
    const previousTheme = root.dataset.theme
    const darkTheme = control?.dataset.darkTheme ?? 'dark'

    root.dataset.theme = theme

    root.classList.toggle('dark', theme === darkTheme || theme.endsWith('-dark'))

    sync(theme)

    if (!control || previousTheme === theme) return

    const storageKey = control.dataset.storageKey ?? 'lumen-theme'

    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // Storage can be unavailable in privacy modes; theme switching should still work.
    }

    control.dispatchEvent(new CustomEvent('ui:theme-change', {
      bubbles: true,
      detail: { previousTheme, storageKey, theme }
    }))
  }

  const transition = (control: HTMLButtonElement, theme: string): void => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches

    if (prefersReducedMotion || isTouchDevice) {
      apply(theme, control)

      return
    }

    animatingControls.add(control)

    control.dataset.uiThemeAnimating = 'true'

    const rect = control.getBoundingClientRect()
    const originX = Math.round(rect.left + (rect.width / 2))
    const originY = Math.round(rect.top + (rect.height / 2))

    const maximumRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX), Math.max(originY, window.innerHeight - originY)
    )

    const overlay = document.createElement('div')
    const backgroundColor = getComputedStyle(document.body).backgroundColor

    overlay.dataset.uiThemeTransition = ''

    overlay.setAttribute('aria-hidden', 'true')

    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: String(transitionZIndex),
      pointerEvents: 'none',
      backgroundColor,
      clipPath: `circle(${maximumRadius}px at ${originX}px ${originY}px)`,
      willChange: 'clip-path'
    })

    document.body.appendChild(overlay)

    apply(theme, control)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = `clip-path ${transitionDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`

        overlay.style.clipPath = `circle(0 at ${originX}px ${originY}px)`

        const complete = (): void => {
          overlay.remove()

          animatingControls.delete(control)

          delete control.dataset.uiThemeAnimating
        }

        overlay.addEventListener('transitionend', complete, { once: true })

        window.setTimeout(complete, transitionFallbackDelayMs)
      })
    })
  }

  const bindControl = (control: HTMLButtonElement): void => {
    if (control.dataset.uiBound === 'true') return

    control.dataset.uiBound = 'true'

    if (control.hasAttribute('data-ui-controlled')) {
      sync(root.dataset.theme ?? control.dataset.lightTheme ?? 'light')

      return
    }

    const storageKey = control.dataset.storageKey ?? 'lumen-theme'
    let storedTheme: string | null = null

    try {
      storedTheme = localStorage.getItem(storageKey)
    } catch {
      // Storage can be unavailable in privacy modes.
    }

    const currentTheme = storedTheme ?? root.dataset.theme

    if (currentTheme) {
      apply(currentTheme)
    } else {
      sync(control.dataset.lightTheme ?? 'light')
    }

    control.addEventListener('click', () => {
      if (control.hasAttribute('data-ui-controlled') || animatingControls.has(control)) return

      const lightTheme = control.dataset.lightTheme ?? 'light'
      const darkTheme = control.dataset.darkTheme ?? 'dark'
      const current = root.dataset.theme

      transition(control, current === darkTheme ? lightTheme : darkTheme)
    })
  }

  for (const control of queryScope(scope, selector, 'button')) bindControl(control)
}

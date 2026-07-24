/* eslint-disable complexity, unicorn/consistent-function-scoping -- Optional motion controllers keep their state and formatting behavior local to the matching primitives. */

const initBackToTopButtons = (scope: ParentNode): void => {
  for (const button of scope.querySelectorAll<HTMLButtonElement>('[data-ui-back-to-top]')) {
    if (button.dataset.uiBound === 'true') continue

    button.dataset.uiBound = 'true'

    button.addEventListener('click', () => {
      window.scrollTo({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        top: 0
      })
    })
  }
}

const initScrollReveals = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>(
    '[data-ui-scroll-reveal], [data-ui-reveal-group]'
  )) {
    if (root.dataset.uiScrollRevealBound === 'true') continue

    root.dataset.uiScrollRevealBound = 'true'

    if (root.matches('[data-ui-reveal-group]')) {
      for (const [index, child] of [...root.children].entries()) {
        if (child instanceof HTMLElement) {
          child.style.setProperty('--ui-reveal-index', String(index))
        }
      }
    }

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || typeof IntersectionObserver === 'undefined'
    ) {
      root.classList.add('is-revealed')

      continue
    }

    const once = root.dataset.uiRevealOnce !== 'false'

    const threshold = Math.min(
      1,
      Math.max(0, Number(root.dataset.uiRevealThreshold) || 0)
    )

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]

      if (!entry) return

      root.classList.toggle('is-revealed', entry.isIntersecting)

      if (entry.isIntersecting && once) observer.disconnect()
    }, { threshold })

    observer.observe(root)
  }
}

const initAnimatedNumbers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-animated-number]')) {
    if (root.dataset.uiBound === 'true') continue

    const output = root.querySelector<HTMLElement>('[data-ui-animated-number-output]')
    const from = Number(root.dataset.uiAnimatedNumberFrom)
    const value = Number(root.dataset.uiAnimatedNumberValue)

    if (!output || !Number.isFinite(from) || !Number.isFinite(value)) continue

    root.dataset.uiBound = 'true'

    const decimals = Math.max(
      0,
      Math.min(20, Number(root.dataset.uiAnimatedNumberDecimals) || 0)
    )

    const prefix = root.dataset.uiAnimatedNumberPrefix ?? ''
    const suffix = root.dataset.uiAnimatedNumberSuffix ?? ''

    const formatter = new Intl.NumberFormat(root.dataset.uiAnimatedNumberLocale || undefined, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    })

    const format = (current: number): string =>
      `${prefix}${formatter.format(current)}${suffix}`

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || typeof IntersectionObserver === 'undefined'
    ) {
      output.textContent = format(value)

      continue
    }

    output.textContent = format(from)

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return

      observer.disconnect()

      const durationValue = getComputedStyle(root)
        .getPropertyValue('--ui-motion-duration')
        .trim()

      const parsedDuration = Number.parseFloat(durationValue)
      let durationMs = 300

      if (Number.isFinite(parsedDuration)) {
        durationMs = durationValue.endsWith('ms')
          ? parsedDuration
          : parsedDuration * 1000
      }

      const startedAt = performance.now()

      const update = (now: number): void => {
        const progress = Math.min(1, (now - startedAt) / Math.max(1, durationMs))
        const eased = 1 - Math.pow(1 - progress, 3)

        output.textContent = format(from + ((value - from) * eased))

        if (progress < 1) requestAnimationFrame(update)
      }

      requestAnimationFrame(update)
    }, { threshold: 0.15 })

    observer.observe(root)
  }
}

export const initMotionControllers = (scope: ParentNode): void => {
  initBackToTopButtons(scope)

  initScrollReveals(scope)

  initAnimatedNumbers(scope)
}

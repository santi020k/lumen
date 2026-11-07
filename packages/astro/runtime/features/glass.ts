import { queryScope } from '../scope.js'

export const initGlassTracking = (scope: ParentNode): void => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  for (const element of queryScope(scope, '[data-ui-glass-track]')) {
    if (element.dataset.uiGlassBound === 'true') continue

    element.dataset.uiGlassBound = 'true'

    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect()

      if (!rect.width || !rect.height) return

      element.style.setProperty('--glass-x', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`)

      element.style.setProperty('--glass-y', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`)
    })

    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--glass-x')

      element.style.removeProperty('--glass-y')
    })
  }
}

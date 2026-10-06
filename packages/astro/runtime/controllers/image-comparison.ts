import { formatLumenImageComparisonValue, normalizeLumenImageComparisonMode, normalizeLumenImageComparisonValue, syncLumenImageComparisonMode } from '@santi020k/lumen-core'

import { bindComparisonReset } from './comparison-reset.js'

const syncs = new WeakMap<HTMLInputElement, () => number>()

export const initImageComparisonControllers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-image-comparison]')) {
    const input = root.querySelector<HTMLInputElement>('[data-ui-image-comparison-input]')
    const frame = root.querySelector<HTMLElement>('.ui-image-comparison__frame')

    if (!input || !frame) continue

    bindComparisonReset(input, syncs)

    if (syncs.has(input)) continue

    const update = () => {
      syncLumenImageComparisonMode(root, normalizeLumenImageComparisonMode(root.dataset.mode))

      input.disabled = root.dataset.disabled === 'true' || root.dataset.mode !== 'reveal'

      const value = normalizeLumenImageComparisonValue(input.valueAsNumber)

      input.value = `${value}`

      input.ariaValueText = formatLumenImageComparisonValue(value, root.dataset.afterLabel ?? 'After', root.dataset.locale || root.closest('[lang]')?.getAttribute('lang') || undefined)

      frame.style.setProperty('--ui-image-comparison-position', `${value}%`)

      return value
    }

    input.addEventListener('input', () => {
      if (input.disabled) return

      root.dispatchEvent(new CustomEvent('ui:image-comparison-change', {
        bubbles: true,
        detail: { value: update() }
      }))
    })

    input.addEventListener('change', update)

    const observer = new MutationObserver(update)

    observer.observe(root, { attributes: true, attributeFilter: ['data-mode', 'data-disabled'] })

    syncs.set(input, update)

    update()
  }
}

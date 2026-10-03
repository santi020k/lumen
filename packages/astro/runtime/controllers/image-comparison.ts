import {
  formatLumenImageComparisonValue,
  type LumenImageComparisonChangeDetail,
  normalizeLumenImageComparisonValue } from '@santi020k/lumen-core'

const boundComparisons = new WeakSet<HTMLElement>()

export const initImageComparisonControllers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-image-comparison]')) {
    if (boundComparisons.has(root)) continue

    const input = root.querySelector<HTMLInputElement>('[data-ui-image-comparison-input]')
    const frame = root.querySelector<HTMLElement>('.ui-image-comparison__frame')

    if (!input || !frame) continue

    boundComparisons.add(root)

    input.disabled = root.dataset.disabled === 'true'

    const update = (): number => {
      const value = normalizeLumenImageComparisonValue(input.valueAsNumber)
      const locale = root.dataset.locale || root.closest('[lang]')?.getAttribute('lang') || undefined

      input.value = String(value)

      input.ariaValueText = formatLumenImageComparisonValue(value, root.dataset.afterLabel ?? 'After', locale)

      frame.style.setProperty('--ui-image-comparison-position', `${value}%`)

      return value
    }

    const change = (): void => {
      if (input.disabled) return

      root.dispatchEvent(new CustomEvent<LumenImageComparisonChangeDetail>('ui:image-comparison-change', {
        bubbles: true,
        detail: { value: update() }
      }))
    }

    input.addEventListener('input', change)

    input.addEventListener('change', update)

    input.form?.addEventListener('reset', event => {
      window.setTimeout(() => {
        if (!event.defaultPrevented && root.isConnected) update()
      })
    })

    update()
  }
}

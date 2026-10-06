import { formatLumenImageComparisonValue, normalizeLumenImageComparisonValue } from '@santi020k/lumen-core'

const syncs = new WeakMap<HTMLInputElement, () => number>()
const roots = new WeakSet<Node>()
const isRoot = (node: Node): node is ParentNode => 'querySelectorAll' in node

const bindReset = (node: Node) => {
  const scope = node.getRootNode()

  if (!isRoot(scope) || roots.has(scope)) return

  roots.add(scope)

  scope.addEventListener('reset', event => {
    setTimeout(() => {
      if (event.defaultPrevented) return

      for (const input of scope.querySelectorAll<HTMLInputElement>('[data-ui-image-comparison-input]')) {
        if (input.isConnected && input.form === event.target) syncs.get(input)?.()
      }
    })
  }, true)
}

export const initImageComparisonControllers = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-image-comparison]')) {
    const input = root.querySelector<HTMLInputElement>('[data-ui-image-comparison-input]')
    const frame = root.querySelector<HTMLElement>('.ui-image-comparison__frame')

    if (!input || !frame) continue

    bindReset(input)

    if (syncs.has(input)) continue

    input.disabled = root.dataset.disabled === 'true'

    const update = () => {
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

    syncs.set(input, update)

    update()
  }
}

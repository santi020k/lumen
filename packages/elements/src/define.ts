const registry = new Set<string>()

export class LumenCardElement extends HTMLElement {
  connectedCallback() {
    this.classList.add('ui-card')
  }
}

export class LumenButtonElement extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', this.getAttribute('role') ?? 'button')

    this.tabIndex = this.tabIndex >= 0 ? this.tabIndex : 0

    this.classList.add('ui-button', 'ui-button--default', 'ui-button--default-size')
  }
}

export const defineLumenElements = (customElementsRegistry: CustomElementRegistry) => {
  const definitions = [
    ['lumen-button', LumenButtonElement],
    ['lumen-card', LumenCardElement]
  ] as const

  for (const [name, element] of definitions) {
    if (!registry.has(name) && !customElementsRegistry.get(name)) {
      customElementsRegistry.define(name, element)

      registry.add(name)
    }
  }
}

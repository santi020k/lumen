import { composeClassName } from '@santi020k/lumen-core'

export type LumenCustomElementRegistry = Pick<
  CustomElementRegistry,
  'define' | 'get'
>

export interface LumenElementConfig {
  attributeClassAliases?: Record<string, string>
  attributeClasses?: Record<string, Record<string, string>>
  baseClassName: string
  defaults?: Record<string, string>
  observedAttributes?: readonly string[]
  role?: string
  tagName: string
}

export type LumenElementConstructor = CustomElementConstructor & {
  config: LumenElementConfig
}

const appliedClassNames = new WeakMap<HTMLElement, string[]>()

const mergeClassNames = (
  ...classNames: (boolean | string | null | undefined)[]
) => composeClassName(...classNames)
  .split(/\s+/)
  .filter(Boolean)

const resolveAttributeClassName = (
  element: HTMLElement,
  config: LumenElementConfig,
  attributeName: string,
  classMap: Record<string, string>
): string | undefined => {
  const canonicalAttribute = config.attributeClassAliases?.[attributeName]

  if (canonicalAttribute && element.hasAttribute(canonicalAttribute)) return undefined

  const attributeValue = element.hasAttribute(attributeName) ?
    element.getAttribute(attributeName) || 'true' :
    config.defaults?.[attributeName]

  return attributeValue ? classMap[attributeValue] : undefined
}

export class LumenElement extends HTMLElement {
  static config: LumenElementConfig

  static get observedAttributes() {
    return this.config.observedAttributes ?? Object.keys(
      this.config.attributeClasses ?? {}
    )
  }

  connectedCallback() {
    this.applyDefaults()

    this.applyClassNames()
  }

  disconnectedCallback() {
    /* Subclasses clean up behavior listeners when needed. */
  }

  attributeChangedCallback(
    _name?: string,
    _previousValue?: string | null,
    _value?: string | null
  ) {
    this.applyClassNames()
  }

  protected get config() {
    return (this.constructor as typeof LumenElement).config
  }

  private applyDefaults() {
    for (const [name, value] of Object.entries(this.config.defaults ?? {})) {
      if (!this.hasAttribute(name)) {
        this.setAttribute(name, value)
      }
    }

    if (this.config.role && !this.hasAttribute('role')) {
      this.setAttribute('role', this.config.role)
    }
  }

  private applyClassNames() {
    const previousClassNames = appliedClassNames.get(this) ?? []

    for (const className of previousClassNames) {
      this.classList.remove(className)
    }

    const classNames = mergeClassNames(this.config.baseClassName)

    for (const [attributeName, classMap] of Object.entries(
      this.config.attributeClasses ?? {}
    )) {
      const className = resolveAttributeClassName(
        this,
        this.config,
        attributeName,
        classMap
      )

      if (className) {
        classNames.push(...mergeClassNames(className))
      }
    }

    this.classList.add(...classNames)

    appliedClassNames.set(this, classNames)
  }
}

export const createLumenElementClass = (
  config: LumenElementConfig
): LumenElementConstructor => class extends LumenElement {
  static override config = config
}

export const defineLumenElement = (
  config: LumenElementConfig,
  element: CustomElementConstructor,
  registry?: LumenCustomElementRegistry
): void => {
  const targetRegistry = registry ?? (
    typeof customElements === 'undefined' ? undefined : customElements
  )

  if (targetRegistry && !targetRegistry.get(config.tagName)) {
    targetRegistry.define(config.tagName, element)
  }
}

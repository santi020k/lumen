import { resolveLumenLoadingSemantics, resolveLumenSkeletonSize } from '@santi020k/lumen-core'

import {
  createLumenElementClass,
  defineLumenElement,
  type LumenCustomElementRegistry,
  LumenElement,
  type LumenElementConfig,
  type LumenElementConstructor
} from '../element-base.js'

const createFoundation = (
  config: LumenElementConfig,
  element: LumenElementConstructor = createLumenElementClass(config)
) => ({ config, element })

type ManagedLoadingAttribute = 'aria-hidden' | 'role'

const loadingSemanticAttributes = ['aria-hidden', 'aria-label', 'aria-labelledby', 'role'] as const
const skeletonSizeProperties = { height: '--ui-skeleton-height', width: '--ui-skeleton-width' } as const

/**
 * Applies the Astro loading-indicator contract: unnamed indicators are decorative, named ones are
 * status regions. Only attributes Lumen applied are updated or removed, so explicit consumer
 * `aria-hidden` and `role` values always win.
 */
class LumenLoadingIndicatorElement extends LumenElement {
  readonly #applied = new Set<ManagedLoadingAttribute>()
  #applying = false

  override connectedCallback(): void {
    super.connectedCallback()

    this.syncLoadingState()
  }

  override attributeChangedCallback(name?: string, previousValue?: string | null, value?: string | null): void {
    super.attributeChangedCallback(name, previousValue, value)

    if (this.#applying) return

    if (name === 'aria-hidden' || name === 'role') this.#applied.delete(name)

    if (this.isConnected) this.syncLoadingState()
  }

  protected syncLoadingState(): void {
    const semantics = resolveLumenLoadingSemantics({
      ariaHidden: this.#readExplicit('aria-hidden'),
      ariaLabel: this.getAttribute('aria-label'),
      ariaLabelledby: this.getAttribute('aria-labelledby'),
      role: this.#readExplicit('role')
    })

    this.#manage('aria-hidden', semantics.ariaHidden)

    this.#manage('role', semantics.role)
  }

  #readExplicit(name: ManagedLoadingAttribute): string | null {
    return this.#applied.has(name) ? null : this.getAttribute(name)
  }

  #manage(name: ManagedLoadingAttribute, value: string | undefined): void {
    if (!this.#applied.has(name) && this.hasAttribute(name)) return

    this.#applying = true

    try {
      if (value === undefined) {
        this.removeAttribute(name)

        this.#applied.delete(name)
      } else {
        this.setAttribute(name, value)

        this.#applied.add(name)
      }
    } finally {
      this.#applying = false
    }
  }
}

class LumenSkeletonBehaviorElement extends LumenLoadingIndicatorElement {
  readonly #appliedSizes = new Map<string, string>()

  protected override syncLoadingState(): void {
    super.syncLoadingState()

    for (const [attribute, property] of Object.entries(skeletonSizeProperties)) {
      const size = resolveLumenSkeletonSize(this.getAttribute(attribute))
      const current = this.style.getPropertyValue(property)
      const applied = this.#appliedSizes.get(property)

      // Inline consumer styles take precedence, including changes made after connection.
      if (current && current !== applied) {
        this.#appliedSizes.delete(property)

        continue
      }

      if (size) {
        this.style.setProperty(property, size)

        this.#appliedSizes.set(property, size)
      } else if (this.#appliedSizes.delete(property)) {
        this.style.removeProperty(property)
      }
    }
  }
}

export const lumenCardContentElementConfig = {
  baseClassName: 'ui-card__content',
  defaults: { 'data-slot': 'card-content' },
  tagName: 'lumen-card-content'
} as const satisfies LumenElementConfig

export const lumenCardDescriptionElementConfig = {
  baseClassName: 'ui-card__description',
  defaults: { 'data-slot': 'card-description' },
  tagName: 'lumen-card-description'
} as const satisfies LumenElementConfig

export const lumenCardFooterElementConfig = {
  baseClassName: 'ui-card__footer',
  defaults: { 'data-slot': 'card-footer' },
  tagName: 'lumen-card-footer'
} as const satisfies LumenElementConfig

export const lumenCardHeaderElementConfig = {
  baseClassName: 'ui-card__header',
  defaults: { 'data-slot': 'card-header' },
  tagName: 'lumen-card-header'
} as const satisfies LumenElementConfig

export const lumenCardTitleElementConfig = {
  baseClassName: 'ui-card__title',
  defaults: { 'data-slot': 'card-title' },
  tagName: 'lumen-card-title'
} as const satisfies LumenElementConfig

export const lumenContainerElementConfig = {
  attributeClasses: {
    size: {
      full: 'ui-container--full',
      lg: 'ui-container--lg',
      md: 'ui-container--md',
      sm: 'ui-container--sm'
    }
  },
  baseClassName: 'ui-container',
  defaults: { 'data-ui-container': '', size: 'lg' },
  tagName: 'lumen-container'
} as const satisfies LumenElementConfig

export const lumenDirectionElementConfig = {
  baseClassName: 'ui-direction',
  defaults: { dir: 'ltr' },
  tagName: 'lumen-direction'
} as const satisfies LumenElementConfig

export const lumenGridElementConfig = {
  attributeClasses: {
    columns: {
      1: 'ui-grid--columns-1',
      2: 'ui-grid--columns-2',
      3: 'ui-grid--columns-3',
      4: 'ui-grid--columns-4',
      6: 'ui-grid--columns-6',
      12: 'ui-grid--columns-12',
      auto: 'ui-grid--columns-auto'
    },
    gap: {
      '2xl': 'ui-grid--gap-2xl',
      '3xl': 'ui-grid--gap-3xl',
      group: 'ui-grid--gap-group',
      related: 'ui-grid--gap-related',
      section: 'ui-grid--gap-section',
      xs: 'ui-grid--gap-xs',
      lg: 'ui-grid--gap-lg',
      md: 'ui-grid--gap-md',
      none: 'ui-grid--gap-none',
      sm: 'ui-grid--gap-sm',
      xl: 'ui-grid--gap-xl'
    }
  },
  baseClassName: 'ui-grid',
  defaults: { 'data-ui-grid': '', columns: 'auto', gap: 'group' },
  tagName: 'lumen-grid'
} as const satisfies LumenElementConfig

export const lumenLabelElementConfig = {
  baseClassName: 'ui-label',
  tagName: 'lumen-label'
} as const satisfies LumenElementConfig

export const lumenSeparatorElementConfig = {
  attributeClasses: {
    orientation: {
      horizontal: 'ui-separator--horizontal',
      vertical: 'ui-separator--vertical'
    }
  },
  baseClassName: 'ui-separator',
  defaults: { orientation: 'horizontal' },
  tagName: 'lumen-separator'
} as const satisfies LumenElementConfig

export const lumenSkeletonElementConfig = {
  attributeClasses: {
    animation: { none: 'ui-skeleton--static', pulse: 'ui-skeleton--pulse' },
    shape: { circle: 'ui-skeleton--circle', text: 'ui-skeleton--text' }
  },
  baseClassName: 'ui-skeleton',
  observedAttributes: ['animation', 'height', 'shape', 'width', ...loadingSemanticAttributes],
  tagName: 'lumen-skeleton'
} as const satisfies LumenElementConfig

export const lumenSpinnerElementConfig = {
  baseClassName: 'ui-spinner',
  observedAttributes: loadingSemanticAttributes,
  tagName: 'lumen-spinner'
} as const satisfies LumenElementConfig

export const lumenStackElementConfig = {
  attributeClasses: {
    align: {
      center: 'ui-stack--align-center',
      end: 'ui-stack--align-end',
      start: 'ui-stack--align-start',
      stretch: 'ui-stack--align-stretch'
    },
    direction: {
      horizontal: 'ui-stack--horizontal',
      vertical: 'ui-stack--vertical'
    },
    justify: {
      between: 'ui-stack--justify-between',
      center: 'ui-stack--justify-center',
      end: 'ui-stack--justify-end',
      start: 'ui-stack--justify-start'
    },
    wrap: { '': 'ui-stack--wrap', true: 'ui-stack--wrap' },
    gap: {
      '2xl': 'ui-stack--gap-2xl',
      '3xl': 'ui-stack--gap-3xl',
      group: 'ui-stack--gap-group',
      related: 'ui-stack--gap-related',
      section: 'ui-stack--gap-section',
      xs: 'ui-stack--gap-xs',
      lg: 'ui-stack--gap-lg',
      md: 'ui-stack--gap-md',
      none: 'ui-stack--gap-none',
      sm: 'ui-stack--gap-sm',
      xl: 'ui-stack--gap-xl'
    }
  },
  baseClassName: 'ui-stack',
  defaults: { 'data-ui-stack': '', direction: 'vertical', gap: 'group' },
  tagName: 'lumen-stack'
} as const satisfies LumenElementConfig

export const lumenTypographyElementConfig = {
  baseClassName: 'ui-typography',
  tagName: 'lumen-typography'
} as const satisfies LumenElementConfig

export const lumenVisuallyHiddenElementConfig = {
  baseClassName: 'ui-visually-hidden',
  defaults: { 'data-ui-visually-hidden': '' },
  tagName: 'lumen-visually-hidden'
} as const satisfies LumenElementConfig

const cardContent = createFoundation(lumenCardContentElementConfig)
const cardDescription = createFoundation(lumenCardDescriptionElementConfig)
const cardFooter = createFoundation(lumenCardFooterElementConfig)
const cardHeader = createFoundation(lumenCardHeaderElementConfig)
const cardTitle = createFoundation(lumenCardTitleElementConfig)
const container = createFoundation(lumenContainerElementConfig)
const direction = createFoundation(lumenDirectionElementConfig)
const grid = createFoundation(lumenGridElementConfig)
const label = createFoundation(lumenLabelElementConfig)
const separator = createFoundation(lumenSeparatorElementConfig)

const skeleton = createFoundation(
  lumenSkeletonElementConfig,
  class extends LumenSkeletonBehaviorElement {
    static override config = lumenSkeletonElementConfig
  }
)

const spinner = createFoundation(
  lumenSpinnerElementConfig,
  class extends LumenLoadingIndicatorElement {
    static override config = lumenSpinnerElementConfig
  }
)

const stack = createFoundation(lumenStackElementConfig)
const typography = createFoundation(lumenTypographyElementConfig)
const visuallyHidden = createFoundation(lumenVisuallyHiddenElementConfig)

export const LumenCardContentElement = cardContent.element
export const LumenCardDescriptionElement = cardDescription.element
export const LumenCardFooterElement = cardFooter.element
export const LumenCardHeaderElement = cardHeader.element
export const LumenCardTitleElement = cardTitle.element
export const LumenContainerElement = container.element
export const LumenDirectionElement = direction.element
export const LumenGridElement = grid.element
export const LumenLabelElement = label.element
export const LumenSeparatorElement = separator.element
export const LumenSkeletonElement = skeleton.element
export const LumenSpinnerElement = spinner.element
export const LumenStackElement = stack.element
export const LumenTypographyElement = typography.element
export const LumenVisuallyHiddenElement = visuallyHidden.element

const foundationDefinitions = [
  cardContent,
  cardDescription,
  cardFooter,
  cardHeader,
  cardTitle,
  container,
  direction,
  grid,
  label,
  separator,
  skeleton,
  spinner,
  stack,
  typography,
  visuallyHidden
] as const

export const defineLumenFoundations = (
  registry?: LumenCustomElementRegistry
): void => {
  for (const definition of foundationDefinitions) {
    defineLumenElement(definition.config, definition.element, registry)
  }
}

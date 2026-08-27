import {
  createLumenElementClass,
  defineLumenElement,
  type LumenCustomElementRegistry,
  type LumenElementConfig
} from '../element-base.js'

const createFoundation = (config: LumenElementConfig) => ({
  config,
  element: createLumenElementClass(config)
})

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
      lg: 'ui-grid--gap-lg',
      md: 'ui-grid--gap-md',
      none: 'ui-grid--gap-none',
      sm: 'ui-grid--gap-sm',
      xl: 'ui-grid--gap-xl'
    }
  },
  baseClassName: 'ui-grid',
  defaults: { 'data-ui-grid': '', columns: 'auto', gap: 'md' },
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
  baseClassName: 'ui-skeleton',
  tagName: 'lumen-skeleton'
} as const satisfies LumenElementConfig

export const lumenSpinnerElementConfig = {
  baseClassName: 'ui-spinner',
  tagName: 'lumen-spinner'
} as const satisfies LumenElementConfig

export const lumenStackElementConfig = {
  attributeClasses: {
    direction: {
      horizontal: 'ui-stack--horizontal',
      vertical: 'ui-stack--vertical'
    },
    gap: {
      lg: 'ui-stack--gap-lg',
      md: 'ui-stack--gap-md',
      none: 'ui-stack--gap-none',
      sm: 'ui-stack--gap-sm',
      xl: 'ui-stack--gap-xl'
    }
  },
  baseClassName: 'ui-stack',
  defaults: { 'data-ui-stack': '', direction: 'vertical', gap: 'md' },
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
const skeleton = createFoundation(lumenSkeletonElementConfig)
const spinner = createFoundation(lumenSpinnerElementConfig)
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

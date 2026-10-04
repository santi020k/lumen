import {
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  createElement,
  type CSSProperties,
  type ElementType
} from 'react'

import { composeClassName, type LumenControlVisualSize } from '@santi020k/lumen-core'

export type LumenGlassProp = boolean | 'strong' | 'subtle'

export type LumenPrimitiveProps<T extends ElementType = 'div'> = {
  as?: T
} & Omit<ComponentPropsWithRef<T>, 'as'>

type PrimitiveProps = ComponentPropsWithoutRef<'div'> & {
  [key: string]: unknown
  as?: ElementType
}

const Primitive = ({
  as,
  className,
  uiClassName,
  ...props
}: PrimitiveProps & { uiClassName: string }) => {
  const tag = as ?? 'div'
  const safeClassName = typeof className === 'string' ? className : undefined

  return createElement(tag, {
    className: composeClassName(uiClassName, safeClassName),
    ...props
  })
}

const glassIntensityClass = (glass?: LumenGlassProp) => glass === 'subtle' ?
  'ui-glass-subtle' :
  glass === 'strong' && 'ui-glass-strong'

type BadgeVariant =
  'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning'

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  variant?: BadgeVariant
}

export const Badge = ({
  className,
  variant = 'default',
  ...props
}: BadgeProps) => (
  <span
    className={composeClassName('ui-badge', `ui-badge--${variant}`, className)}
    data-variant={variant}
    {...props}
  />
)

type CardVariant = 'default' | 'glass' | 'interactive' | 'muted' | 'unstyled'

export type CardProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T> & {
    'data-variant'?: CardVariant
    density?: 'comfortable' | 'compact' | 'spacious'
    glass?: LumenGlassProp
    variant?: CardVariant
  }

export const Card = <T extends ElementType = 'div'>({
  as,
  className,
  density = 'comfortable',
  glass = false,
  variant = 'default',
  ...props
}: CardProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    className={composeClassName(
      `ui-card--${density}`,
      variant === 'muted' && 'ui-card--muted',
      variant === 'interactive' && 'ui-card--interactive',
      variant === 'unstyled' && 'ui-card--unstyled',
      (glass || variant === 'glass') && composeClassName(
        'ui-card--glass', glassIntensityClass(glass)
      ),
      className
    )}
    data-density={density}
    data-slot="card"
    data-variant={variant}
    {...props}
    uiClassName="ui-card"
  />
)

export type CardHeaderProps<T extends ElementType = 'div'> = LumenPrimitiveProps<T>

export const CardHeader = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardHeaderProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-header"
    {...props}
    uiClassName="ui-card__header"
  />
)

export type CardTitleProps<T extends ElementType = 'div'> = LumenPrimitiveProps<T>

export const CardTitle = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardTitleProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-title"
    {...props}
    uiClassName="ui-card__title"
  />
)

export type CardDescriptionProps<T extends ElementType = 'div'> = LumenPrimitiveProps<T>

export const CardDescription = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardDescriptionProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-description"
    {...props}
    uiClassName="ui-card__description"
  />
)

export type CardContentProps<T extends ElementType = 'div'> = LumenPrimitiveProps<T>

export const CardContent = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardContentProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-content"
    {...props}
    uiClassName="ui-card__content"
  />
)

export type CardFooterProps<T extends ElementType = 'div'> = LumenPrimitiveProps<T>

export const CardFooter = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardFooterProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-footer"
    {...props}
    uiClassName="ui-card__footer"
  />
)

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  as?: ElementType
  size?: 'full' | 'lg' | 'md' | 'sm'
}

export const Container = ({
  as = 'div',
  className,
  size = 'lg',
  ...props
}: ContainerProps) => createElement(as, {
  className: composeClassName('ui-container', `ui-container--${size}`, className),
  'data-size': size,
  'data-ui-container': true,
  ...props
})

export type DirectionProps = ComponentPropsWithoutRef<'div'>

export const Direction = ({
  className,
  dir = 'ltr',
  ...props
}: DirectionProps) => (
  <div className={composeClassName('ui-direction', className)} dir={dir} {...props} />
)

export interface GridProps extends ComponentPropsWithRef<'div'> {
  as?: ElementType
  columns?: 1 | 2 | 3 | 4 | 6 | 12 | 'auto'
  gap?: '2xl' | '3xl' | 'group' | 'lg' | 'md' | 'none' | 'related' | 'section' | 'sm' | 'xl' | 'xs'
  minItemWidth?: string
}

type LumenCSSProperties = CSSProperties &
  Record<`--ui-${string}`, number | string | undefined>

export const Grid = ({
  as = 'div',
  className,
  columns = 'auto',
  gap = 'group',
  minItemWidth,
  style,
  ...props
}: GridProps) => {
  const gridStyle: LumenCSSProperties = {
    ...style,
    '--ui-grid-min': minItemWidth
  }

  return createElement(as, {
    className: composeClassName(
      'ui-grid', `ui-grid--columns-${columns}`, `ui-grid--gap-${gap}`, className
    ),
    'data-columns': columns,
    'data-ui-grid': true,
    style: gridStyle,
    ...props
  })
}

export interface InputProps extends ComponentPropsWithRef<'input'> {
  visualSize?: LumenControlVisualSize
}

export const Input = ({
  className,
  ref,
  type = 'text',
  visualSize = 'default',
  ...props
}: InputProps) => (
  <input
    className={composeClassName(
      'ui-input',
      visualSize === 'sm' && 'ui-input--sm',
      visualSize === 'lg' && 'ui-input--lg',
      className
    )}
    ref={ref}
    type={type}
    {...props}
  />
)

export type LabelProps = ComponentPropsWithRef<'label'>

export const Label = ({ className, ...props }: LabelProps) => (
  <label className={composeClassName('ui-label', className)} {...props} />
)

type Orientation = 'horizontal' | 'vertical'

export interface ProgressProps extends ComponentPropsWithoutRef<'div'> {
  max?: number
  value?: number
}

export const Progress = ({
  className,
  max = 100,
  value = 0,
  ...props
}: ProgressProps) => {
  const safeMax = max > 0 ? max : 100
  const safeValue = Math.min(safeMax, Math.max(0, value))
  const percentage = (safeValue / safeMax) * 100

  return (
    <div
      aria-valuemax={safeMax}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      className={composeClassName('ui-progress', className)}
      role="progressbar"
      {...props}
    >
      <span
        className="ui-progress__bar"
        data-slot="progress-indicator"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export interface SeparatorProps extends ComponentPropsWithRef<'hr'> {
  orientation?: Orientation
}

export const Separator = ({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) => (
  <hr
    aria-orientation={orientation}
    className={composeClassName(
      'ui-separator', `ui-separator--${orientation}`, className
    )}
    data-orientation={orientation}
    {...props}
  />
)

export type SkeletonProps = ComponentPropsWithRef<'div'>

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div className={composeClassName('ui-skeleton', className)} {...props} />
)

export type SpinnerProps = ComponentPropsWithoutRef<'span'>

export const Spinner = ({
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  role,
  ...props
}: SpinnerProps) => {
  const isAccessible = Boolean(ariaLabel || ariaLabelledby)

  return (
    <span
      aria-hidden={ariaHidden ?? (isAccessible ? undefined : true)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={composeClassName('ui-spinner', className)}
      role={role ?? (isAccessible ? 'status' : undefined)}
      {...props}
    />
  )
}

export interface StackProps extends ComponentPropsWithRef<'div'> {
  align?: 'center' | 'end' | 'start' | 'stretch'
  as?: ElementType
  direction?: Orientation
  gap?: '2xl' | '3xl' | 'group' | 'lg' | 'md' | 'none' | 'related' | 'section' | 'sm' | 'xl' | 'xs'
  justify?: 'between' | 'center' | 'end' | 'start'
  wrap?: boolean
}

export const Stack = ({
  align = 'stretch',
  as = 'div',
  className,
  direction = 'vertical',
  gap = 'group',
  justify = 'start',
  wrap = false,
  ...props
}: StackProps) => createElement(as, {
  className: composeClassName(
    'ui-stack',
    `ui-stack--${direction}`,
    `ui-stack--gap-${gap}`,
    `ui-stack--align-${align}`,
    `ui-stack--justify-${justify}`,
    wrap && 'ui-stack--wrap',
    className
  ),
  'data-direction': direction,
  'data-ui-stack': true,
  ...props
})

export type TextareaProps = ComponentPropsWithRef<'textarea'>

export const Textarea = ({
  className,
  ref,
  rows = 4,
  ...props
}: TextareaProps) => (
  <textarea
    className={composeClassName('ui-textarea', className)}
    ref={ref}
    rows={rows}
    {...props}
  />
)

export type TypographyProps = ComponentPropsWithoutRef<'div'>

export const Typography = ({ className, ...props }: TypographyProps) => (
  <div className={composeClassName('ui-typography', className)} {...props} />
)

export interface VisuallyHiddenProps extends ComponentPropsWithRef<'span'> {
  focusable?: boolean
}

export const VisuallyHidden = ({
  className,
  focusable = false,
  ...props
}: VisuallyHiddenProps) => (
  <span
    className={composeClassName(
      'ui-visually-hidden',
      focusable && 'ui-visually-hidden--focusable',
      className
    )}
    data-ui-visually-hidden
    {...props}
  />
)

export type DialogHeaderProps = ComponentPropsWithRef<'header'>
export const DialogHeader = ({ className, ...props }: DialogHeaderProps) => (
  <header {...props} className={composeClassName('ui-dialog-header', className)} data-slot="dialog-header" />
)

export type DialogTitleProps = ComponentPropsWithRef<'h2'> & { as?: 'h2' | 'h3' | 'h4' }
export const DialogTitle = ({ as: Tag = 'h2', className, ...props }: DialogTitleProps) => (
  <Tag {...props} className={composeClassName('ui-dialog-title', className)} data-slot="dialog-title" />
)

export type DialogBodyProps = ComponentPropsWithRef<'div'>
export const DialogBody = ({ className, ...props }: DialogBodyProps) => (
  <div {...props} className={composeClassName('ui-dialog-body', className)} data-slot="dialog-body" />
)

export type DialogFooterProps = ComponentPropsWithRef<'footer'>
export const DialogFooter = ({ className, ...props }: DialogFooterProps) => (
  <footer {...props} className={composeClassName('ui-dialog-footer', className)} data-slot="dialog-footer" />
)

export type DescriptionItemProps = ComponentPropsWithRef<'div'>
export const DescriptionItem = ({ className, ...props }: DescriptionItemProps) => (
  <div {...props} className={composeClassName('ui-description-item', 'ui-descriptions__item', className)} data-slot="description-item" />
)

export type DescriptionTermProps = ComponentPropsWithRef<'dt'>
export const DescriptionTerm = ({ className, ...props }: DescriptionTermProps) => (
  <dt {...props} className={composeClassName('ui-description-term', 'ui-descriptions__term', className)} data-slot="description-term" />
)

export type DescriptionDetailProps = ComponentPropsWithRef<'dd'>
export const DescriptionDetail = ({ className, ...props }: DescriptionDetailProps) => (
  <dd {...props} className={composeClassName('ui-description-detail', 'ui-descriptions__detail', className)} data-slot="description-detail" />
)

export type AttachmentListProps = ComponentPropsWithRef<'ul'>
export const AttachmentList = ({ className, ...props }: AttachmentListProps) => (
  <ul {...props} className={composeClassName('ui-attachment-list', className)} data-slot="attachment-list" />
)

import type { ComponentPropsWithoutRef, ComponentPropsWithRef } from 'react'

import { composeClassName } from '@santi020k/lumen-core'

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

export interface InputProps extends ComponentPropsWithRef<'input'> {
  visualSize?: 'default' | 'lg' | 'sm'
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

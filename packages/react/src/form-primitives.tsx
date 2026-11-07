import type { ComponentPropsWithoutRef, ComponentPropsWithRef, ReactNode } from 'react'

import { composeClassName } from '@santi020k/lumen-core/tokens'

import { glassClass, type LumenGlassProp } from './primitive-surface.js'

export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type'>
export const Checkbox = ({ className, ref, ...props }: CheckboxProps) => (
  <input
    className={composeClassName('ui-checkbox', className)}
    ref={ref}
    type="checkbox"
    {...props}
  />
)

export interface FieldProps extends ComponentPropsWithoutRef<'div'> {
  controlId?: string
  describedBy?: string
  glass?: LumenGlassProp
  invalid?: boolean
}
export const Field = ({
  'aria-describedby': ariaDescribedby,
  className,
  controlId,
  describedBy,
  glass = false,
  invalid = false,
  ...props
}: FieldProps) => {
  const fieldDescribedBy =
    [ariaDescribedby, describedBy].filter(Boolean).join(' ') || undefined

  return (
    <div
      aria-describedby={ariaDescribedby}
      className={composeClassName(
        'ui-field', glassClass('ui-field', glass), className
      )}
      data-invalid={invalid ? 'true' : undefined}
      data-ui-field
      data-ui-field-control={controlId}
      data-ui-field-describedby={fieldDescribedBy}
      {...props}
    />
  )
}

export interface FieldErrorProps extends ComponentPropsWithoutRef<'p'> {
  message?: ReactNode
}

export const FieldError = ({
  children,
  className,
  hidden,
  message,
  ...props
}: FieldErrorProps) => {
  const content = message ?? children

  return (
    <p
      className={composeClassName('ui-field-error', className)}
      data-ui-field-error
      hidden={hidden ?? !content}
      {...props}
    >
      {content}
    </p>
  )
}

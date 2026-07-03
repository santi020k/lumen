import {
  composeClassName,
  type LumenComponentName,
  lumenComponentNames
} from '@santi020k/lumen-core'

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

export type { LumenComponentName }
export { lumenComponentNames }

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  size?: 'default' | 'icon' | 'lg' | 'sm'
  variant?: 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'
}

export const Button = ({
  className,
  size = 'default',
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps) => (
  <button
    className={composeClassName('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)}
    type={type}
    {...props}
  />
)

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  as?: ElementType
  children?: ReactNode
  variant?: 'default' | 'interactive' | 'muted'
}

export const Card = ({
  as: Tag = 'div',
  className,
  variant = 'default',
  ...props
}: CardProps) => (
  <Tag
    className={composeClassName(
      'ui-card',
      variant === 'muted' && 'ui-card--muted',
      variant === 'interactive' && 'ui-card--interactive',
      className
    )}
    data-variant={variant}
    {...props}
  />
)

export type InputProps = ComponentPropsWithoutRef<'input'>

export const Input = ({ className, type = 'text', ...props }: InputProps) => (
  <input className={composeClassName('ui-input', className)} type={type} {...props} />
)

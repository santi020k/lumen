'use client'

import type { ComponentPropsWithoutRef, ComponentPropsWithRef, HTMLAttributes, KeyboardEvent, MouseEvent as ReactMouseEvent, Ref   } from 'react'
import { isValidElement } from 'react'

import { composeClassName } from '@santi020k/lumen-core/tokens'

import { glassClass, type LumenGlassProp } from './primitive-surface.js'

export type { LumenGlassProp } from './primitive-surface.js'

export type ButtonSize = 'default' | 'icon' | 'lg' | 'sm'

export type ButtonVariant =
  'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  asChild?: boolean
  loading?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

export interface ButtonChildProps extends HTMLAttributes<HTMLElement> {
  'data-slot'?: string
  ref?: Ref<HTMLElement> | undefined
}

/* eslint-disable complexity -- The compatibility path resolves native, slotted, loading, size, and disabled states in one public component. */
export const Button = ({
  asChild = false,
  children,
  className,
  disabled,
  loading = false,
  ref,
  size = 'default',
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps) => {
  const isDisabled = disabled === true || loading

  const buttonClassName = composeClassName(
    'ui-button', `ui-button--${variant}`, size === 'default' ? 'ui-button--default-size' : `ui-button--${size}`, isDisabled && 'ui-button--disabled', loading && 'ui-button--loading', className
  )

  if (asChild) {
    const child = children

    if (!isValidElement<ButtonChildProps>(child)) {
      throw new TypeError(
        'Button with asChild requires exactly one React element child.'
      )
    }

    const ChildComponent = child.type

    return (
      <ChildComponent
        {...child.props}
        {...props}
        aria-busy={loading ? true : undefined}
        aria-disabled={isDisabled ? true : undefined}
        className={composeClassName(buttonClassName, child.props.className)}
        data-slot="button"
        onClickCapture={isDisabled ?
          (event: ReactMouseEvent<HTMLElement>) => {
            event.preventDefault()

            event.stopPropagation()
          } :
          props.onClickCapture ?? child.props.onClickCapture}
        onKeyDownCapture={isDisabled ?
          (event: KeyboardEvent<HTMLElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()

              event.stopPropagation()
            }
          } :
          props.onKeyDownCapture ?? child.props.onKeyDownCapture}
        ref={ref as Ref<HTMLElement>}
        tabIndex={isDisabled ? -1 : props.tabIndex ?? child.props.tabIndex}
      >
        {loading && <span aria-hidden="true" className="ui-spinner" />}
        <span className="ui-button__content">{child.props.children}</span>
      </ChildComponent>
    )
  }

  return (
    <button
      aria-busy={loading || undefined}
      className={buttonClassName}
      data-slot="button"
      disabled={isDisabled}
      ref={ref}
      type={type}
      {...props}
    >
      {loading && <span aria-hidden="true" className="ui-spinner" />}
      <span className="ui-button__content">{children}</span>
    </button>
  )
}

/* eslint-enable complexity */

export type CollapsibleProps = ComponentPropsWithoutRef<'details'>

export const Collapsible = ({ className, ...props }: CollapsibleProps) => (
  <details
    className={composeClassName('ui-collapsible', className)}
    data-ui-collapsible
    {...props}
  />
)

export interface EmptyProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
  variant?: 'compact' | 'default'
}

export const Empty = ({
  className,
  glass = false,
  variant = 'default',
  ...props
}: EmptyProps) => (
  <section
    className={composeClassName(
      'ui-empty',
      variant === 'compact' && 'ui-empty--compact',
      glassClass('ui-empty', glass),
      className
    )}
    data-variant={variant}
    {...props}
  />
)

export type KbdProps = ComponentPropsWithoutRef<'kbd'>

export const Kbd = ({ className, ...props }: KbdProps) => (
  <kbd className={composeClassName('ui-kbd', className)} {...props} />
)

export type SearchFieldProps = ComponentPropsWithRef<'input'>

export const SearchField = ({
  className,
  ref,
  type = 'search',
  ...props
}: SearchFieldProps) => (
  <input
    className={composeClassName('ui-input ui-search-field', className)}
    ref={ref}
    type={type}
    {...props}
  />
)

export type LinkProps = ComponentPropsWithRef<'a'> & {
  newTab?: boolean
  variant?: 'default' | 'inherit'
}

export const Link = ({
  className,
  newTab = false,
  ref,
  rel,
  target,
  variant = 'default',
  ...props
}: LinkProps) => (
  <a
    className={composeClassName(
      'ui-link', variant === 'inherit' && 'ui-link--inherit', className
    )}
    data-slot="link"
    data-variant={variant}
    ref={ref}
    rel={
      newTab ?
        [
          ...new Set(`${rel ?? ''} noopener noreferrer`.trim().split(/\s+/))
        ].join(' ') :
        rel
    }
    target={newTab ? '_blank' : target}
    {...props}
  />
)

export type SkipLinkProps = ComponentPropsWithoutRef<'a'>

export const SkipLink = ({ className, ...props }: SkipLinkProps) => (
  <a className={composeClassName('ui-skip-link', className)} {...props} />
)

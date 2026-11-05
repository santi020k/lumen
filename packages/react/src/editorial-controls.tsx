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

const blockSlottedClick = (event: ReactMouseEvent<HTMLElement>): void => {
  event.preventDefault()

  event.stopPropagation()
}

const blockSlottedKey = (event: KeyboardEvent<HTMLElement>): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()

    event.stopPropagation()
  }
}

const slottedBehavior = (disabled: boolean, props: ButtonProps, child: ButtonChildProps) => {
  if (disabled) return { onClickCapture: blockSlottedClick, onKeyDownCapture: blockSlottedKey, tabIndex: -1 }

  return {
    onClickCapture: props.onClickCapture ?? child.onClickCapture,
    onKeyDownCapture: props.onKeyDownCapture ?? child.onKeyDownCapture,
    tabIndex: props.tabIndex ?? child.tabIndex
  }
}

interface SlottedButtonProps {
  children: ButtonProps['children']
  className: string
  disabled: boolean
  loading: boolean
  forwardedRef: ButtonProps['ref']
  props: ButtonProps
}

const SlottedButton = ({ children, className, disabled, loading, forwardedRef, props }: SlottedButtonProps) => {
  if (!isValidElement<ButtonChildProps>(children)) {
    throw new TypeError('Button with asChild requires exactly one React element child.')
  }

  const ChildComponent = children.type

  return (
    <ChildComponent
      {...children.props}
      {...props}
      {...slottedBehavior(disabled, props, children.props)}
      aria-busy={loading ? true : undefined}
      aria-disabled={disabled ? true : undefined}
      className={composeClassName(className, children.props.className)}
      data-slot="button"
      ref={forwardedRef as Ref<HTMLElement>}
    >
      {loading && <span aria-hidden="true" className="ui-spinner" />}
      <span className="ui-button__content">{children.props.children}</span>
    </ChildComponent>
  )
}

const buttonClassName = (
  className: string | undefined, disabled: boolean, loading: boolean, size: ButtonSize, variant: ButtonVariant
): string => composeClassName(
  'ui-button', 'ui-button--' + variant, size === 'default' ? 'ui-button--default-size' : 'ui-button--' + size, disabled && 'ui-button--disabled', loading && 'ui-button--loading', className
)

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
  const classes = buttonClassName(className, isDisabled, loading, size, variant)

  if (asChild) return (
    <SlottedButton
      className={classes}
      disabled={isDisabled}
      loading={loading}
      forwardedRef={ref}
      props={props}
    >
      {children}
    </SlottedButton>
  )

  return (
    <button
      aria-busy={loading || undefined}
      className={classes}
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

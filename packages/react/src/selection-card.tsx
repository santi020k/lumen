'use client'

import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useId } from 'react'

import { composeClassName } from '@santi020k/lumen-core/tokens'

interface SelectionCardProps extends Omit<ComponentPropsWithRef<'input'>, 'children' | 'type'> {
  /** Non-interactive metadata displayed below the description. */
  children?: ReactNode
  description?: ReactNode
  /** Decorative content; the visible label supplies the accessible name. */
  icon?: ReactNode
  invalid?: boolean
  label: ReactNode
  variant?: 'outline' | 'soft'
}

export type CheckboxCardProps = SelectionCardProps
export type RadioCardProps = SelectionCardProps

const selectionCardClasses = { checkbox: 'ui-checkbox-card', radio: 'ui-radio-card' } as const
const hasContent = (content: ReactNode): boolean => content !== undefined && content !== null

const resolveLabelledBy = (
  labelId: string, labelledBy: string | undefined, label: string | undefined
): string | undefined => labelledBy ?? (label ? undefined : labelId)

const SelectionCard = ({
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  children,
  className,
  description,
  icon,
  id,
  invalid = false,
  label,
  ref,
  type,
  variant = 'outline',
  ...props
}: SelectionCardProps & { type: 'checkbox' | 'radio' }) => {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const labelId = `${controlId}-label`
  const hasDescription = hasContent(description)
  const descriptionId = hasDescription ? `${controlId}-description` : undefined
  const describedBy = [ariaDescribedby, descriptionId].filter(Boolean).join(' ') || undefined

  return (
    <span
      className={composeClassName('ui-selection-card', selectionCardClasses[type], `ui-selection-card--${variant}`, className)}
      data-slot={`${type}-card`}
    >
      <label>
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : ariaInvalid}
          aria-label={ariaLabel}
          aria-labelledby={resolveLabelledBy(labelId, ariaLabelledby, ariaLabel)}
          id={controlId}
          ref={ref}
          type={type}
        />
        {hasContent(icon) && (
          <span aria-hidden="true" data-slot="selection-card-icon">{icon}</span>
        )}
        <span data-slot="selection-card-content">
          <span data-slot="selection-card-label" id={labelId}>{label}</span>
          {hasDescription && <span data-slot="selection-card-description" id={descriptionId}>{description}</span>}
          {hasContent(children) && <span data-slot="selection-card-addon">{children}</span>}
        </span>
      </label>
    </span>
  )
}

/** A descriptive checkbox choice with native form, reset and keyboard behavior. */
export const CheckboxCard = (props: CheckboxCardProps) => <SelectionCard {...props} type="checkbox" />

/** Use the same name for mutually exclusive choices, inside a labelled fieldset. */
export const RadioCard = (props: RadioCardProps) => <SelectionCard {...props} type="radio" />

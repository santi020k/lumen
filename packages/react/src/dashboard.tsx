'use client'

import type { ComponentPropsWithRef, ReactNode } from 'react'

import { composeClassName, type LumenActiveFilter } from '@santi020k/lumen-core'

import { Button } from './components.js'

export interface FilterBarProps extends ComponentPropsWithRef<'section'> {
  label?: string
  filters?: readonly LumenActiveFilter[]
  onRemoveFilter?: (id: string) => void
  onReset?: () => void
  resetLabel?: string
  removeLabel?: (filter: LumenActiveFilter) => string
  /** Pass a complete localized count message; zero and unknown are different. */
  resultLabel?: string
  pending?: boolean
  /** Controlled filters disclosure; omit for native browser ownership. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  actions?: ReactNode
}

const noFilters: readonly LumenActiveFilter[] = []
const defaultRemoveLabel = (filter: LumenActiveFilter): string => `Remove ${filter.label}: ${filter.value}`

export const FilterBar = ({
  label = 'Filters', filters = noFilters, onRemoveFilter, onReset, resetLabel = 'Reset filters',
  removeLabel = defaultRemoveLabel, resultLabel, pending = false, open, defaultOpen = true,
  onOpenChange, actions, className, children, ...props
}: FilterBarProps) => (
  <section className={composeClassName('ui-filter-bar', className)} aria-label={label} aria-busy={pending} {...props}>
    <details
      open={open ?? defaultOpen}
      onToggle={event => {
        if (open === undefined) onOpenChange?.(event.currentTarget.open)
      }}
    >
      <summary onClick={event => {
        if (open === undefined) return

        event.preventDefault()

        onOpenChange?.(!open)
      }}
      >
        {label}
      </summary>
      <div className="ui-filter-bar__controls">{children}</div>
    </details>
    <div className="ui-filter-bar__active">
      {filters.map(filter => onRemoveFilter ?
        (
          <Button
            key={filter.id}
            variant="outline"
            size="sm"
            disabled={pending}
            aria-label={removeLabel(filter)}
            onClick={() => {
              onRemoveFilter(filter.id)
            }}
          >
            {filter.label}
            :
            {filter.value}
            {' '}
            ×
          </Button>
        ) :
        (
          <span key={filter.id}>
            {filter.label}
            :
            {' '}
            {filter.value}
          </span>
        ))}
      {onReset && filters.length > 0 && <Button variant="ghost" size="sm" disabled={pending} onClick={onReset}>{resetLabel}</Button>}
      {actions}
    </div>
    <p className="ui-filter-bar__results" role="status" aria-live="polite" aria-atomic="true">{resultLabel}</p>
  </section>
)

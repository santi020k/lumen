'use client'

import type { ComponentPropsWithoutRef } from 'react'

import { formatLumenMediaThumbnailState, resolveLumenMediaOrder } from '@santi020k/lumen-core/media-workspace'
import { composeClassName } from '@santi020k/lumen-core/tokens'

import { Button, type ButtonProps } from './components.js'

export interface MediaThumbnailProps extends Omit<ButtonProps, 'asChild'> {
  label: string
  mediaId?: string
  order?: number
  selected?: boolean
  state?: 'ready' | 'loading' | 'error'
  stateLabel?: string
}

export const MediaThumbnail = ({
  children, className, disabled, label, mediaId, order, selected = false, state = 'ready', stateLabel, ...props
}: MediaThumbnailProps) => {
  const position = resolveLumenMediaOrder(order)
  const status = formatLumenMediaThumbnailState(state, stateLabel)

  return (
    <Button {...props} className={composeClassName('ui-media-thumbnail', className)} variant="outline" aria-busy={state === 'loading' || undefined} aria-pressed={selected} disabled={disabled === true || state !== 'ready'} data-state={state} data-media-id={mediaId}>
      <span className="ui-media-thumbnail__media" aria-hidden="true">{children}</span>
      <span className="ui-media-thumbnail__label">{label}</span>
      {position !== undefined && <span className="ui-media-thumbnail__order">{position}</span>}
      {state !== 'ready' && <span className="ui-media-thumbnail__state">{status}</span>}
    </Button>
  )
}

export interface MediaFilmstripProps extends ComponentPropsWithoutRef<'section'> {
  label: string
  selectionLabel: string
}

/** Children are native list items containing a thumbnail and optional sibling move actions. */
export const MediaFilmstrip = ({ children, className, label, selectionLabel, ...props }: MediaFilmstripProps) => (
  <section {...props} className={composeClassName('ui-media-filmstrip', className)} aria-label={label}>
    <div className="ui-media-filmstrip__heading">
      <span>{label}</span>
      <span role="status">{selectionLabel}</span>
    </div>
    <ol className="ui-media-filmstrip__items">{children}</ol>
  </section>
)

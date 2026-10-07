'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import {
  bindLumenMediaViewport,
  formatLumenMediaZoom,
  lumenMediaViewportActions,
  type LumenMediaViewportLabels,
  lumenMediaViewportLabels,
  syncLumenMediaViewport
} from '@santi020k/lumen-core/media-viewport'
import {
  type LumenMediaViewportValue,
  normalizeLumenMediaViewport,
  resolveLumenMediaMaxZoom
} from '@santi020k/lumen-core/media-workspace'
import { composeClassName } from '@santi020k/lumen-core/tokens'

import { Button } from './components.js'

export interface MediaViewportProps extends Omit<ComponentPropsWithoutRef<'figure'>, 'defaultValue'> {
  defaultValue?: Partial<LumenMediaViewportValue>
  disabled?: boolean
  label: string
  labels?: Partial<LumenMediaViewportLabels>
  locale?: string
  maxZoom?: number
  onValueChange?: (value: LumenMediaViewportValue) => void
  ratio?: number
  value?: LumenMediaViewportValue
}

export const MediaViewport = ({
  children, className, defaultValue, disabled = false, label, labels, locale, maxZoom = 4,
  onValueChange, ratio = 16 / 9, value, ...props
}: MediaViewportProps) => {
  const [internal, setInternal] = useState(() => normalizeLumenMediaViewport(defaultValue, maxZoom))
  const current = useMemo(() => normalizeLumenMediaViewport(value ?? internal, maxZoom), [value, internal, maxZoom])
  const rootRef = useRef<HTMLElement>(null)
  const statusId = useId()
  const optionsRef = useRef({ current, disabled, maxZoom, onValueChange, controlled: value !== undefined })

  useEffect(() => {
    optionsRef.current = { current, disabled, maxZoom, onValueChange, controlled: value !== undefined }

    if (rootRef.current) syncLumenMediaViewport(rootRef.current, current, maxZoom, disabled, locale)
  }, [current, disabled, maxZoom, onValueChange, value, locale])

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    return bindLumenMediaViewport(root, {
      disabled: () => optionsRef.current.disabled,
      getValue: () => optionsRef.current.current,
      maxZoom: () => optionsRef.current.maxZoom,
      onValueChange: next => {
        if (!optionsRef.current.controlled) setInternal(next)

        optionsRef.current.onValueChange?.(next)
      }
    })
  }, [])

  const copy = { ...lumenMediaViewportLabels, ...labels }
  const safeRatio = Number.isFinite(ratio) && ratio >= 0.1 && ratio <= 10 ? ratio : 16 / 9

  return (
    <figure {...props} ref={rootRef} className={composeClassName('ui-media-viewport', className)}>
      <div
        aria-describedby={statusId}
        aria-disabled={disabled}
        aria-label={label}
        className="ui-media-viewport__stage"
        data-ui-media-viewport-stage
        role="group"
        style={{ aspectRatio: safeRatio, touchAction: current.zoom > 1 && !disabled ? 'none' : 'pan-y' }}
        tabIndex={0}
      >
        <div
          className="ui-media-viewport__content"
          data-ui-media-viewport-content
          style={{ transform: `translate(${current.x * (current.zoom - 1) * 50}%, ${current.y * (current.zoom - 1) * 50}%) scale(${current.zoom})` }}
        >
          {children}
        </div>
      </div>
      <figcaption>
        <span>{label}</span>
        <span id={statusId} role="status" aria-live="polite" data-ui-media-viewport-status>{formatLumenMediaZoom(current.zoom, locale)}</span>
        <div className="ui-media-viewport__actions" role="group" aria-label={label}>
          {lumenMediaViewportActions.map(action => (
            <Button key={action} variant="outline" data-ui-media-viewport-action={action} disabled={disabled || (action === 'zoom-in' && current.zoom >= resolveLumenMediaMaxZoom(maxZoom)) || (action !== 'zoom-in' && current.zoom === 1)}>{copy[action]}</Button>
          ))}
        </div>
      </figcaption>
    </figure>
  )
}

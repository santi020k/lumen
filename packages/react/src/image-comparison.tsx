'use client'

import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  formatLumenImageComparisonValue,
  type LumenImageComparisonMode,
  normalizeLumenImageComparisonMode,
  normalizeLumenImageComparisonRatio,
  normalizeLumenImageComparisonValue
} from '@santi020k/lumen-core/image-comparison'
import { composeClassName } from '@santi020k/lumen-core/tokens'

export interface ImageComparisonProps extends ComponentPropsWithoutRef<'figure'> {
  after: ReactNode
  afterLabel?: string
  before: ReactNode
  beforeLabel?: string
  defaultValue?: number
  disabled?: boolean
  fit?: 'contain' | 'cover'
  label: string
  locale?: string
  mode?: LumenImageComparisonMode
  name?: string
  onValueChange?: (value: number) => void
  ratio?: number
  value?: number
}

type ComparisonStyle = CSSProperties & {
  '--ui-image-comparison-position': string
  '--ui-image-comparison-ratio': number
}

export const ImageComparison = ({
  after, afterLabel = 'After', before, beforeLabel = 'Before', children, className,
  defaultValue = 50, disabled = false, fit = 'cover', label, locale, name,
  mode: requestedMode = 'reveal', onValueChange, ratio = 16 / 9, value, ...props
}: ImageComparisonProps) => {
  const [internalValue, setInternalValue] = useState(() => normalizeLumenImageComparisonValue(defaultValue))
  const mode = normalizeLumenImageComparisonMode(requestedMode)
  const inputRef = useRef<HTMLInputElement>(null)
  const position = normalizeLumenImageComparisonValue(value ?? internalValue)

  useEffect(() => {
    const input = inputRef.current

    if (!input) return

    const pendingResets = new Set<Event>()
    let pendingReset: number | undefined

    const reset = (event: Event) => {
      if (event.target !== input.form) return

      pendingResets.add(event)

      if (pendingReset !== undefined) return

      pendingReset = window.setTimeout(() => {
        pendingReset = undefined

        const shouldReset = [...pendingResets].some(resetEvent => !resetEvent.defaultPrevented)

        pendingResets.clear()

        if (!shouldReset || !input.isConnected) return

        const next = normalizeLumenImageComparisonValue(value ?? defaultValue)

        input.value = String(next)

        if (value === undefined) setInternalValue(next)
      })
    }

    input.ownerDocument.addEventListener('reset', reset, true)

    return () => {
      if (pendingReset !== undefined) window.clearTimeout(pendingReset)

      pendingResets.clear()

      input.ownerDocument.removeEventListener('reset', reset, true)
    }
  }, [defaultValue, value])

  const frameStyle: ComparisonStyle = {
    '--ui-image-comparison-position': `${position}%`,
    '--ui-image-comparison-ratio': normalizeLumenImageComparisonRatio(ratio)
  }

  return (
    <figure {...props} className={composeClassName('ui-image-comparison', className)} data-fit={fit} data-mode={mode}>
      <div className="ui-image-comparison__frame" style={frameStyle}>
        <div className="ui-image-comparison__before" hidden={mode === 'after'}>{before}</div>
        <div className="ui-image-comparison__after" hidden={mode === 'before'}>{after}</div>
        <div aria-hidden="true" className="ui-image-comparison__divider" />
      </div>
      <div aria-hidden="true" className="ui-image-comparison__labels">
        <span hidden={mode === 'after'}>{beforeLabel}</span>
        <span hidden={mode === 'before'}>{afterLabel}</span>
      </div>
      <figcaption className="ui-image-comparison__caption">
        <label className="ui-image-comparison__control" hidden={mode !== 'reveal'}>
          <span>{label}</span>
          <input
            ref={inputRef}
            aria-valuetext={formatLumenImageComparisonValue(position, afterLabel, locale)}
            className="ui-slider ui-image-comparison__range"
            disabled={disabled || mode !== 'reveal'}
            max={100}
            min={0}
            name={name}
            onChange={event => {
              if (disabled || mode !== 'reveal') return

              const next = normalizeLumenImageComparisonValue(event.currentTarget.valueAsNumber)

              if (value === undefined) setInternalValue(next)

              onValueChange?.(next)
            }}
            step={1}
            type="range"
            value={position}
          />
        </label>
        {children}
      </figcaption>
    </figure>
  )
}

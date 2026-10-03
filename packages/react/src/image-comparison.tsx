import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  composeClassName,
  formatLumenImageComparisonValue,
  normalizeLumenImageComparisonRatio,
  normalizeLumenImageComparisonValue
} from '@santi020k/lumen-core'

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
  onValueChange, ratio = 16 / 9, value, ...props
}: ImageComparisonProps) => {
  const [internalValue, setInternalValue] = useState(() => normalizeLumenImageComparisonValue(defaultValue))
  const inputRef = useRef<HTMLInputElement>(null)
  const position = normalizeLumenImageComparisonValue(value ?? internalValue)

  useEffect(() => {
    const input = inputRef.current

    if (!input) return

    const pendingResets = new Set<number>()

    const reset = (event: Event) => {
      if (event.target !== input.form) return

      const timeout = window.setTimeout(() => {
        pendingResets.delete(timeout)

        if (event.defaultPrevented || !input.isConnected) return

        const next = normalizeLumenImageComparisonValue(value ?? defaultValue)

        input.value = String(next)

        if (value === undefined) setInternalValue(next)
      })

      pendingResets.add(timeout)
    }

    input.ownerDocument.addEventListener('reset', reset, true)

    return () => {
      for (const timeout of pendingResets) window.clearTimeout(timeout)

      pendingResets.clear()

      input.ownerDocument.removeEventListener('reset', reset, true)
    }
  }, [defaultValue, value])

  const frameStyle: ComparisonStyle = {
    '--ui-image-comparison-position': `${position}%`,
    '--ui-image-comparison-ratio': normalizeLumenImageComparisonRatio(ratio)
  }

  return (
    <figure {...props} className={composeClassName('ui-image-comparison', className)} data-fit={fit}>
      <div className="ui-image-comparison__frame" style={frameStyle}>
        <div className="ui-image-comparison__before">{before}</div>
        <div className="ui-image-comparison__after">{after}</div>
        <div aria-hidden="true" className="ui-image-comparison__divider" />
      </div>
      <div aria-hidden="true" className="ui-image-comparison__labels">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
      <figcaption className="ui-image-comparison__caption">
        <label className="ui-image-comparison__control">
          <span>{label}</span>
          <input
            ref={inputRef}
            aria-valuetext={formatLumenImageComparisonValue(position, afterLabel, locale)}
            className="ui-slider ui-image-comparison__range"
            disabled={disabled}
            max={100}
            min={0}
            name={name}
            onChange={event => {
              if (disabled) return

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

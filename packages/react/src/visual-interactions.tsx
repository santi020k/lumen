'use client'

import type { ComponentPropsWithoutRef, CSSProperties } from 'react'
import { useEffect, useRef } from 'react'

import {
  bindLumenChartMotion,
  bindLumenMotionGroup,
  composeClassName,
  createLumenSpotlightController,
  type LumenVisualEffectVariant,
  type LumenWorkflowDuration,
  normalizeLumenEffectIntensity
} from '@santi020k/lumen-core'

export interface MotionGroupProps extends ComponentPropsWithoutRef<'div'> {
  duration?: LumenWorkflowDuration
  enterExit?: boolean
}

export const MotionGroup = ({ className, duration = 'standard', enterExit = true, ...props }: MotionGroupProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) return bindLumenMotionGroup(ref.current, { duration, enterExit })
  }, [duration, enterExit])

  return <div {...props} ref={ref} className={composeClassName('ui-motion-group', className)} data-ui-motion-group />
}

export interface VisualEffectProps extends ComponentPropsWithoutRef<'div'> {
  animated?: boolean
  intensity?: number
  variant?: LumenVisualEffectVariant
}

type EffectStyle = CSSProperties & { '--ui-effect-intensity': number }

export const VisualEffect = ({ animated = false, className, intensity = 0.5, style, variant = 'mesh', ...props }: VisualEffectProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (variant === 'spotlight' && ref.current) return createLumenSpotlightController(ref.current)
  }, [variant])

  const effectStyle: EffectStyle = { ...style, '--ui-effect-intensity': normalizeLumenEffectIntensity(intensity) }

  return <div {...props} ref={ref} className={composeClassName('ui-visual-effect', className)} data-ui-effect-animated={String(animated)} data-ui-visual-effect={variant} style={effectStyle} />
}

/** Wrap a chart to animate stable SVG marks without delaying accessible data. */
export const ChartMotion = ({ className, duration = 'standard', ...props }: Omit<MotionGroupProps, 'enterExit'>) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) return bindLumenChartMotion(ref.current, duration)
  }, [duration])

  return <div {...props} ref={ref} className={className} data-ui-chart-motion />
}

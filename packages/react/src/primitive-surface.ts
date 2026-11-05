import { composeClassName } from '@santi020k/lumen-core/tokens'

export type LumenGlassProp = boolean | 'subtle' | 'strong'

export const glassIntensityClass = (glass?: LumenGlassProp) => glass === 'subtle' ?
  'ui-glass-subtle' :
  glass === 'strong' && 'ui-glass-strong'

export const glassClass = (base: string, glass?: LumenGlassProp) => Boolean(glass) &&
  composeClassName(`${base}--glass`, glassIntensityClass(glass))

export type SurfaceVariant = 'default' | 'glass'

export type EventHandler<Event> = (event: Event) => void

export interface SurfaceProps {
  'data-surface'?: SurfaceVariant
  glass?: LumenGlassProp
}

export const resolveSurface = (glass?: LumenGlassProp): SurfaceVariant => glass ? 'glass' : 'default'

export const glassSurfaceClass = (
  base: string,
  glass?: LumenGlassProp
) => resolveSurface(glass) === 'glass' &&
  composeClassName(`${base}--glass`, glassIntensityClass(glass))

export const composeHandlers =
  <Event>(
    userHandler: EventHandler<Event> | undefined,
    lumenHandler: EventHandler<Event> | undefined
  ) => (event: Event) => {
    userHandler?.(event)

    lumenHandler?.(event)
  }

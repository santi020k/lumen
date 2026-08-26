import type { LumenImageRadius } from './media-components.js'
import type { LumenTheme } from './theme.js'

export const resolveLumenImageAspectRatio = (
  aspectRatio: number | undefined
): number | undefined => {
  if (aspectRatio === undefined || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return undefined
  }

  return aspectRatio
}

export const resolveLumenImageRadius = (
  radii: LumenTheme['radii'],
  radius: LumenImageRadius
): number => radius === 'none' ? 0 : radii[radius]

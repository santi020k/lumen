import { lumenGraphicFrameSizes, lumenIllustrationSizes } from './tokens.generated.js'

export interface LumenDisclosureState {
  contentVisible: boolean
  disabled: boolean
  opacity: number
}

export const resolveLumenDisclosureState = (
  expanded: boolean,
  disabled: boolean
): LumenDisclosureState => ({
  contentVisible: expanded,
  disabled,
  opacity: disabled ? 0.52 : 1
})

export const resolveLumenSkeletonHeight = (height: number): number => (
  Number.isFinite(height) && height > 0 ? height : 16
)

export type LumenGraphicSize = 'lg' | 'md' | 'sm'

export const resolveLumenGraphicSize = (size: LumenGraphicSize): number => ({
  lg: lumenGraphicFrameSizes.lg,
  md: lumenGraphicFrameSizes.md,
  sm: lumenGraphicFrameSizes.sm
})[size]

export type LumenBackdropIntensity = 'medium' | 'strong' | 'subtle'

export const resolveLumenBackdropOpacity = (
  intensity: LumenBackdropIntensity
): number => ({ medium: 0.68, strong: 1, subtle: 0.4 })[intensity]

export type LumenIllustrationSize = 'lg' | 'md' | 'sm'

export const resolveLumenIllustrationSize = (
  size: LumenIllustrationSize
): number => ({
  lg: lumenIllustrationSizes.lg,
  md: lumenIllustrationSizes.md,
  sm: lumenIllustrationSizes.sm
})[size]

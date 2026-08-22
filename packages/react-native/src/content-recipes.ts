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

export interface LumenSelectionState {
  disabled: boolean
  opacity: number
  selected: boolean
}

export const resolveLumenSelectionState = (
  selected: boolean,
  disabled: boolean
): LumenSelectionState => ({
  disabled,
  opacity: disabled ? 0.52 : 1,
  selected
})

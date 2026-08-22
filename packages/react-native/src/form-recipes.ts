export interface LumenSearchFieldState {
  opacity: number
  showClearAction: boolean
}

export const resolveLumenSearchFieldState = (
  value: string,
  editable: boolean
): LumenSearchFieldState => ({
  opacity: editable ? 1 : 0.52,
  showClearAction: editable && value.length > 0
})

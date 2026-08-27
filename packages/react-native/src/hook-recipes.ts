export interface LumenHookSelectionOption<Value extends number | string> {
  disabled?: boolean
  label: string
  value: Value
}

export interface LumenHookToastDetail {
  description?: string
  duration?: number
  title: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
}

export interface LumenHookToastRecord extends LumenHookToastDetail {
  id: string
}

export const normalizeLumenHookSelectionOptions = <Value extends number | string>(
  options: readonly (LumenHookSelectionOption<Value> | Value)[]
): readonly LumenHookSelectionOption<Value>[] => options.map(option => (
  typeof option === 'object' ? option : { label: String(option), value: option }
))

export const getNextLumenThemeScheme = (scheme: 'dark' | 'light'): 'dark' | 'light' => (
  scheme === 'dark' ? 'light' : 'dark'
)

export const createLumenHookToast = (
  id: string,
  detail: LumenHookToastDetail
): LumenHookToastRecord => ({
  ...detail,
  id,
  variant: detail.variant ?? 'default'
})

export const updateLumenHookToast = (
  toast: LumenHookToastRecord,
  detail: Partial<LumenHookToastDetail>
): LumenHookToastRecord => ({ ...toast, ...detail, id: toast.id })

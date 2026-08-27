import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  getLumenLocalePair,
  type LumenLocaleOption,
  normalizeLumenLocales
} from '@santi020k/lumen-core'

import {
  createLumenHookToast,
  getNextLumenThemeScheme,
  type LumenHookSelectionOption,
  type LumenHookToastDetail,
  type LumenHookToastRecord,
  normalizeLumenHookSelectionOptions,
  updateLumenHookToast
} from './hook-recipes.js'

type LumenHookChangeHandler<Value> = (value: Value) => void

interface LumenControllableOptions<Value> {
  defaultValue: Value
  onChange: LumenHookChangeHandler<Value> | undefined
  value: Value | undefined
}

const useLumenControllableValue = <Value>({
  defaultValue,
  onChange,
  value
}: LumenControllableOptions<Value>): [Value, LumenHookChangeHandler<Value>] => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const currentValue = value ?? uncontrolledValue

  const setValue = useCallback((nextValue: Value) => {
    if (value === undefined) setUncontrolledValue(nextValue)

    onChange?.(nextValue)
  }, [onChange, value])

  return [currentValue, setValue]
}

export interface LumenDisclosureOptions {
  defaultOpen?: boolean
  onOpenChange?: LumenHookChangeHandler<boolean>
  open?: boolean
}

export interface LumenDisclosureController {
  close: () => void
  dialogProps: {
    onDismiss: () => void
    visible: boolean
  }
  open: boolean
  setOpen: LumenHookChangeHandler<boolean>
  show: () => void
  toggle: () => void
  visible: boolean
}

/** Controls native modal surfaces without introducing DOM focus or event assumptions. */
export const useDisclosure = ({
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen
}: LumenDisclosureOptions = {}): LumenDisclosureController => {
  const [open, setOpen] = useLumenControllableValue({
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    value: controlledOpen
  })

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const show = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  const toggle = useCallback(() => {
    setOpen(!open)
  }, [open, setOpen])

  return useMemo(() => ({
    close,
    dialogProps: { onDismiss: close, visible: open },
    open,
    setOpen,
    show,
    toggle,
    visible: open
  }), [close, open, setOpen, show, toggle])
}

/** React Native adaptation of the web useDialog state contract. */
export const useDialog = (options: LumenDisclosureOptions = {}): LumenDisclosureController => (
  useDisclosure(options)
)

export interface LumenTabsHookOptions {
  defaultValue?: string
  onValueChange?: LumenHookChangeHandler<string>
  value?: string
}

export interface LumenTabsHookController {
  isSelected: (value: string) => boolean
  onValueChange: LumenHookChangeHandler<string>
  select: LumenHookChangeHandler<string>
  setValue: LumenHookChangeHandler<string>
  tabsProps: {
    onValueChange: LumenHookChangeHandler<string>
    value: string
  }
  value: string
}

/** Shares controlled tabs state while leaving native tab semantics to LumenTabs. */
export const useTabs = ({
  defaultValue = '',
  onValueChange,
  value: controlledValue
}: LumenTabsHookOptions = {}): LumenTabsHookController => {
  const [value, setValue] = useLumenControllableValue({
    defaultValue,
    onChange: onValueChange,
    value: controlledValue
  })

  const isSelected = useCallback((candidate: string) => candidate === value, [value])

  return useMemo(() => ({
    isSelected,
    onValueChange: setValue,
    select: setValue,
    setValue,
    tabsProps: { onValueChange: setValue, value },
    value
  }), [isSelected, setValue, value])
}

export type LumenSelectOption<Value extends number | string = string> = LumenHookSelectionOption<Value>

export interface LumenSelectHookOptions<Value extends number | string = string> {
  defaultValue: Value
  onValueChange?: LumenHookChangeHandler<Value>
  options?: readonly (LumenSelectOption<Value> | Value)[]
  value?: Value
}

export interface LumenSelectHookController<Value extends number | string = string> {
  onValueChange: LumenHookChangeHandler<Value>
  options: readonly LumenSelectOption<Value>[]
  pickerProps: {
    onValueChange: LumenHookChangeHandler<Value>
    options: readonly LumenSelectOption<Value>[]
    value: Value
  }
  selectOption: LumenHookChangeHandler<Value>
  selectedOption: LumenSelectOption<Value> | undefined
  setValue: LumenHookChangeHandler<Value>
  value: Value
}

/** React Native adaptation of useSelect for LumenPicker and app-owned native pickers. */
export const useSelect = <Value extends number | string = string>({
  defaultValue,
  onValueChange,
  options = [],
  value: controlledValue
}: LumenSelectHookOptions<Value>): LumenSelectHookController<Value> => {
  const normalizedOptions = useMemo(
    () => normalizeLumenHookSelectionOptions(options),
    [options]
  )

  const [value, setValue] = useLumenControllableValue({
    defaultValue,
    onChange: onValueChange,
    value: controlledValue
  })

  const selectedOption = normalizedOptions.find(option => option.value === value)

  return useMemo(() => ({
    onValueChange: setValue,
    options: normalizedOptions,
    pickerProps: { onValueChange: setValue, options: normalizedOptions, value },
    selectOption: setValue,
    selectedOption,
    setValue,
    value
  }), [normalizedOptions, selectedOption, setValue, value])
}

export interface LumenLanguageToggleOptions {
  defaultValue?: string
  locales?: readonly LumenLocaleOption[]
  onValueChange?: LumenHookChangeHandler<string>
  value?: string
}

export interface LumenLanguageToggleController {
  currentLocale: LumenLocaleOption
  nextLocale: LumenLocaleOption
  selectNext: () => void
  setValue: LumenHookChangeHandler<string>
  value: string
}

/** Portable language state without browser document or localStorage side effects. */
export const useLanguageToggle = ({
  defaultValue,
  locales: localeOptions,
  onValueChange,
  value: controlledValue
}: LumenLanguageToggleOptions = {}): LumenLanguageToggleController => {
  const locales = useMemo(() => normalizeLumenLocales(localeOptions), [localeOptions])
  const defaultPair = getLumenLocalePair(locales, defaultValue)

  const [value, setValue] = useLumenControllableValue({
    defaultValue: defaultPair.current.value,
    onChange: onValueChange,
    value: controlledValue
  })

  const pair = getLumenLocalePair(locales, value)

  const selectNext = useCallback(() => {
    setValue(pair.next.value)
  }, [pair.next.value, setValue])

  return {
    currentLocale: pair.current,
    nextLocale: pair.next,
    selectNext,
    setValue,
    value: pair.current.value
  }
}

export interface LumenThemeToggleOptions {
  defaultScheme?: 'dark' | 'light'
  onSchemeChange?: LumenHookChangeHandler<'dark' | 'light'>
  scheme?: 'dark' | 'light'
}

export interface LumenThemeToggleController {
  providerProps: { scheme: 'dark' | 'light' }
  scheme: 'dark' | 'light'
  setScheme: LumenHookChangeHandler<'dark' | 'light'>
  toggleTheme: () => void
}

/** Native theme controller that can be spread directly onto LumenProvider. */
export const useThemeToggle = ({
  defaultScheme = 'light',
  onSchemeChange,
  scheme: controlledScheme
}: LumenThemeToggleOptions = {}): LumenThemeToggleController => {
  const [scheme, setScheme] = useLumenControllableValue({
    defaultValue: defaultScheme,
    onChange: onSchemeChange,
    value: controlledScheme
  })

  const toggleTheme = useCallback(() => {
    setScheme(getNextLumenThemeScheme(scheme))
  }, [scheme, setScheme])

  return useMemo(() => ({
    providerProps: { scheme },
    scheme,
    setScheme,
    toggleTheme
  }), [scheme, setScheme, toggleTheme])
}

export type LumenToastDetail = LumenHookToastDetail
export type LumenToastRecord = LumenHookToastRecord

export interface LumenToastHookOptions {
  defaultDuration?: number
  maxCount?: number
}

export interface LumenToastHookController {
  clear: () => void
  create: (detail: LumenToastDetail) => string
  dismiss: (id: string) => void
  getToastProps: (toast: LumenToastRecord) => {
    description?: string
    onDismiss: () => void
    title: string
    variant: 'default' | 'destructive' | 'success' | 'warning'
  }
  toasts: readonly LumenToastRecord[]
  update: (id: string, detail: Partial<LumenToastDetail>) => void
}

/** Owns a native toast queue while LumenToast remains responsible for rendering. */
export const useToast = ({
  defaultDuration = 5000,
  maxCount = 5
}: LumenToastHookOptions = {}): LumenToastHookController => {
  const instanceId = useId().replaceAll(':', '')
  const nextIdRef = useRef(0)
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const [toasts, setToasts] = useState<LumenToastRecord[]>([])

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id)

    if (timer) clearTimeout(timer)

    timersRef.current.delete(id)
  }, [])

  const dismiss = useCallback((id: string) => {
    clearTimer(id)

    setToasts(current => current.filter(toast => toast.id !== id))
  }, [clearTimer])

  const scheduleDismiss = useCallback((id: string, duration: number | undefined) => {
    const resolvedDuration = duration ?? defaultDuration

    clearTimer(id)

    if (!Number.isFinite(resolvedDuration) || resolvedDuration <= 0) return

    timersRef.current.set(id, setTimeout(() => {
      dismiss(id)
    }, resolvedDuration))
  }, [clearTimer, defaultDuration, dismiss])

  const create = useCallback((detail: LumenToastDetail): string => {
    nextIdRef.current += 1

    const id = `lumen-native-toast-${instanceId}-${nextIdRef.current}`
    const toast = createLumenHookToast(id, detail)

    setToasts(current => [...current, toast].slice(-Math.max(1, maxCount)))

    scheduleDismiss(id, detail.duration)

    return id
  }, [instanceId, maxCount, scheduleDismiss])

  const update = useCallback((id: string, detail: Partial<LumenToastDetail>) => {
    setToasts(current => current.map(toast => (
      toast.id === id ? updateLumenHookToast(toast, detail) : toast
    )))

    if (detail.duration !== undefined) scheduleDismiss(id, detail.duration)
  }, [scheduleDismiss])

  const clear = useCallback(() => {
    for (const id of timersRef.current.keys()) clearTimer(id)

    setToasts([])
  }, [clearTimer])

  useEffect(() => () => {
    for (const timer of timersRef.current.values()) clearTimeout(timer)

    timersRef.current.clear()
  }, [])

  useEffect(() => {
    const activeIds = new Set(toasts.map(toast => toast.id))

    for (const id of timersRef.current.keys()) {
      if (!activeIds.has(id)) clearTimer(id)
    }
  }, [clearTimer, toasts])

  const getToastProps = useCallback((toast: LumenToastRecord) => ({
    ...(toast.description === undefined ? {} : { description: toast.description }),
    onDismiss: () => {
      dismiss(toast.id)
    },
    title: toast.title,
    variant: toast.variant ?? 'default'
  }), [dismiss])

  return useMemo(() => ({
    clear,
    create,
    dismiss,
    getToastProps,
    toasts,
    update
  }), [clear, create, dismiss, getToastProps, toasts, update])
}

/* eslint-disable @eslint-react/no-context-provider, @eslint-react/no-use-context, react-refresh/only-export-components -- This package supports React 18 and intentionally keeps public hooks, context provider, and small helper components together in one library module. */
import {
  coerceThemeBuilderExportFormat,
  composeClassName,
  createThemeBuilderTokens,
  exportThemeBuilderValue,
  type LumenThemeBuilderExportFormat,
  type LumenThemeBuilderMode,
  type LumenThemeBuilderResult,
  type LumenThemeBuilderScheme,
  type LumenThemeTokens} from '@santi020k/lumen-core'

import {
  type ComponentPropsWithRef,
  createContext,
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react'

type ChangeHandler<T> = (value: T) => void

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning'

type DataAttributes = Record<`data-${string}`, unknown>

type LumenProps<Tag extends keyof HTMLElementTagNameMap> = ComponentPropsWithRef<Tag> & DataAttributes

export type ToastPlacement =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right'

export interface ToastAction {
  event?: string
  label?: string
  onClick?: (event: MouseEvent<HTMLButtonElement>, toast: HTMLElement | null) => void
  value?: unknown
}

export interface ToastDetail {
  action?: ToastAction
  description?: string
  duration?: number
  id?: string
  max?: number
  placement?: ToastPlacement
  title?: string
  variant?: ToastVariant
}

export interface ToastRecord extends ToastDetail {
  id: string
  open: boolean
  placement: ToastPlacement
  title: string
  variant: ToastVariant
}

export interface ToastApi {
  create: (detail: ToastDetail) => string
  dismiss: (id?: string) => void
  toasts: ToastRecord[]
  update: (id: string, detail: ToastDetail) => void
}

interface ControllableOptions<T> {
  defaultValue: T
  onChange?: ChangeHandler<T> | undefined
  value?: T | undefined
}

interface DisclosureOptions {
  defaultOpen?: boolean | undefined
  id?: string | undefined
  onOpenChange?: ChangeHandler<boolean> | undefined
  open?: boolean | undefined
}

interface DisclosureController {
  close: () => void
  open: boolean
  panelProps: LumenProps<'div'>
  panelRef: RefObject<HTMLElement | null>
  rootProps: LumenProps<'div'>
  rootRef: RefObject<HTMLElement | null>
  setOpen: Dispatch<SetStateAction<boolean>>
  toggle: () => void
  triggerProps: LumenProps<'button'>
  triggerRef: RefObject<HTMLElement | null>
}

export interface DialogOptions extends DisclosureOptions {
  alert?: boolean | undefined
}

export interface DialogController {
  close: () => void
  closeProps: LumenProps<'button'>
  dialogProps: LumenProps<'dialog'>
  dialogRef: RefObject<HTMLDialogElement | null>
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  triggerProps: LumenProps<'button'>
  triggerRef: RefObject<HTMLElement | null>
}

export type PopoverOptions = DisclosureOptions

export type PopoverController = DisclosureController

export type DropdownMenuOptions = DisclosureOptions

export type DropdownMenuController = DisclosureController

export interface TabsOptions {
  defaultValue?: string | undefined
  id?: string | undefined
  onValueChange?: ChangeHandler<string> | undefined
  orientation?: 'horizontal' | 'vertical' | undefined
  value?: string | undefined
}

export interface TabsController {
  getPanelProps: (value: string, props?: ComponentPropsWithRef<'div'>) => LumenProps<'div'>
  getTriggerProps: (value: string, props?: ComponentPropsWithRef<'button'>) => LumenProps<'button'>
  listProps: LumenProps<'div'>
  rootProps: LumenProps<'div'>
  rootRef: RefObject<HTMLElement | null>
  setValue: Dispatch<SetStateAction<string>>
  value: string
}

export interface SelectOption {
  disabled?: boolean
  label: string
  value: string
}

type SelectOptionInput = SelectOption | string

export interface SelectOptions {
  defaultValue?: string | undefined
  disabled?: boolean | undefined
  id?: string | undefined
  name?: string | undefined
  onValueChange?: ChangeHandler<string> | undefined
  options?: SelectOptionInput[] | undefined
  placeholder?: string | undefined
  required?: boolean | undefined
  value?: string | undefined
}

export interface SelectController {
  close: () => void
  controlProps: LumenProps<'div'>
  getOptionProps: (option: SelectOption, props?: ComponentPropsWithRef<'button'>) => LumenProps<'button'>
  listProps: LumenProps<'div'>
  nativeSelectProps: LumenProps<'select'>
  open: boolean
  options: SelectOption[]
  rootProps: LumenProps<'div'>
  rootRef: RefObject<HTMLElement | null>
  selectOption: (value: string) => void
  selectedOption: SelectOption | undefined
  setOpen: Dispatch<SetStateAction<boolean>>
  triggerProps: LumenProps<'button'>
  triggerText: string
  value: string
}

export interface TooltipOptions extends DisclosureOptions {
  delay?: number | undefined
}

export interface TooltipController {
  close: () => void
  open: boolean
  rootProps: LumenProps<'span'>
  setOpen: Dispatch<SetStateAction<boolean>>
  tooltipProps: LumenProps<'span'>
}

export interface ToastProviderProps {
  children?: ReactNode
  maxCount?: number
  placement?: ToastPlacement
}

type NativeFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

export interface FormValidationValidateDetail {
  control: NativeFormControl
  form: HTMLFormElement
  value: string
}

export interface FormValidationStateDetail {
  control?: NativeFormControl
  controls?: NativeFormControl[]
  form: HTMLFormElement
}

export interface FormValidationOptions {
  onInvalid?: ChangeHandler<FormValidationStateDetail> | undefined
  onValid?: ChangeHandler<FormValidationStateDetail> | undefined
  onValidate?: ChangeHandler<FormValidationValidateDetail> | undefined
}

export interface FormValidationController {
  formProps: LumenProps<'form'>
  formRef: RefObject<HTMLFormElement | null>
  getControls: (form?: HTMLFormElement | null) => NativeFormControl[]
  setFieldValidity: (control: NativeFormControl, invalid: boolean, message?: string) => void
  validateControl: (control: NativeFormControl, form?: HTMLFormElement | null) => boolean
  validateForm: (form?: HTMLFormElement | null) => NativeFormControl[]
}

export type ThemeBuilderChangeDetail = LumenThemeBuilderResult

export interface ThemeBuilderExportDetail {
  css?: string
  format: LumenThemeBuilderExportFormat
  tokens: LumenThemeTokens
  value: string
}

export interface ThemeBuilderOptions {
  accentHue?: number | undefined
  defaultAccentHue?: number | undefined
  defaultExportFormat?: LumenThemeBuilderExportFormat | undefined
  defaultHue?: number | undefined
  defaultMode?: LumenThemeBuilderMode | undefined
  defaultPrimaryColor?: string | undefined
  defaultScheme?: LumenThemeBuilderScheme | undefined
  defaultSecondaryColor?: string | undefined
  exportFormat?: LumenThemeBuilderExportFormat | undefined
  hue?: number | undefined
  mode?: LumenThemeBuilderMode | undefined
  onAccentHueChange?: ChangeHandler<number> | undefined
  onExportFormatChange?: ChangeHandler<LumenThemeBuilderExportFormat> | undefined
  onHueChange?: ChangeHandler<number> | undefined
  onModeChange?: ChangeHandler<LumenThemeBuilderMode> | undefined
  onPrimaryColorChange?: ChangeHandler<string> | undefined
  onSchemeChange?: ChangeHandler<LumenThemeBuilderScheme> | undefined
  onSecondaryColorChange?: ChangeHandler<string> | undefined
  onThemeChange?: ChangeHandler<ThemeBuilderChangeDetail> | undefined
  onThemeExport?: ChangeHandler<ThemeBuilderExportDetail> | undefined
  primaryColor?: string | undefined
  scheme?: LumenThemeBuilderScheme | undefined
  secondaryColor?: string | undefined
}

export interface ThemeBuilderController extends ThemeBuilderChangeDetail {
  accentHueProps: LumenProps<'input'>
  copyExport: () => Promise<string>
  exportButtonProps: LumenProps<'button'>
  exportFormat: LumenThemeBuilderExportFormat
  exportValue: string
  getExportFormatProps: (
    format: LumenThemeBuilderExportFormat,
    props?: ComponentPropsWithRef<'button'>
  ) => LumenProps<'button'>
  getModeProps: (
    mode: LumenThemeBuilderMode,
    props?: ComponentPropsWithRef<'button'>
  ) => LumenProps<'button'>
  getSchemeProps: (
    scheme: LumenThemeBuilderScheme,
    props?: ComponentPropsWithRef<'button'>
  ) => LumenProps<'button'>
  hueProps: LumenProps<'input'>
  outputProps: LumenProps<'textarea'>
  previewStyle: CSSProperties
  primaryColorProps: LumenProps<'input'>
  rootProps: LumenProps<'section'>
  secondaryColorProps: LumenProps<'input'>
  setAccentHue: Dispatch<SetStateAction<number>>
  setExportFormat: Dispatch<SetStateAction<LumenThemeBuilderExportFormat>>
  setHue: Dispatch<SetStateAction<number>>
  setMode: Dispatch<SetStateAction<LumenThemeBuilderMode>>
  setPrimaryColor: Dispatch<SetStateAction<string>>
  setScheme: Dispatch<SetStateAction<LumenThemeBuilderScheme>>
  setSecondaryColor: Dispatch<SetStateAction<string>>
}

const defaultToastDuration = 5000
const defaultToastMax = 5
const closeDelay = 240
const ToastContext = createContext<ToastApi | null>(null)

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

const composeHandlers = <Event,>(
  userHandler: ((event: Event) => void) | undefined,
  lumenHandler: (event: Event) => void
) => (event: Event) => {
  userHandler?.(event)

  lumenHandler(event)
}

const isElementVisible = (element: HTMLElement): boolean => {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility()
  }

  return element.offsetParent !== null || element.getClientRects().length > 0
}

const getFocusable = (root: ParentNode | null): HTMLElement[] => {
  if (!root) return []

  return [...root.querySelectorAll<HTMLElement>(focusableSelector)]
    .filter(element => !element.hasAttribute('hidden') && isElementVisible(element))
}

const getLoopedIndex = (
  key: string,
  currentIndex: number,
  itemCount: number,
  forwardKeys: readonly string[]
): number => {
  const lastIndex = itemCount - 1

  if (key === 'Home') return 0

  if (key === 'End') return lastIndex

  if (forwardKeys.includes(key)) return (currentIndex + 1) % itemCount

  return (currentIndex - 1 + itemCount) % itemCount
}

const getOwnedTarget = (event: Event): Node | null =>
  event.target instanceof Node ? event.target : null

const useSafeId = (prefix: string, id?: string): string => {
  const reactId = useId().replaceAll(':', '')

  return id ?? `${prefix}-${reactId}`
}

const useControllableState = <T,>({
  defaultValue,
  onChange,
  value
}: ControllableOptions<T>): [T, Dispatch<SetStateAction<T>>] => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const currentValue = value ?? uncontrolledValue

  const setValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const resolvedValue = typeof next === 'function'
      ? (next as (previous: T) => T)(currentValue)
      : next

    if (value === undefined) {
      setUncontrolledValue(resolvedValue)
    }

    onChange?.(resolvedValue)
  }, [currentValue, onChange, value])

  return [currentValue, setValue]
}

const focusFirstIn = (root: ParentNode | null): void => {
  globalThis.setTimeout(() => {
    getFocusable(root)[0]?.focus()
  })
}

const focusTrigger = (trigger: HTMLElement | null): void => {
  trigger?.focus({ preventScroll: true })
}

const useOutsideClose = (
  open: boolean,
  refs: RefObject<HTMLElement | null>[],
  onClose: () => void
): void => {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    const handlePointerDown = (event: globalThis.PointerEvent): void => {
      const target = getOwnedTarget(event)

      if (!target) return

      const isInside = refs.some(ref => ref.current?.contains(target))

      if (!isInside) onClose()
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [onClose, open, refs])
}

const useDisclosureController = (
  options: DisclosureOptions,
  hasPopup: 'listbox' | 'menu'
): DisclosureController => {
  const rootRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLElement | null>(null)
  const panelId = useSafeId(`ui-${hasPopup}`, options.id)

  const [open, setOpen] = useControllableState({
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
    value: options.open
  })

  const close = useCallback(() => { setOpen(false); }, [setOpen])
  const toggle = useCallback(() => { setOpen(current => !current); }, [setOpen])

  useOutsideClose(open, [rootRef, triggerRef, panelRef], close)

  const triggerProps: LumenProps<'button'> = {
    'aria-controls': panelId,
    'aria-expanded': open,
    'aria-haspopup': hasPopup,
    'data-ui-trigger': true,
    onClick: () => { toggle(); },
    onKeyDown: (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') return

      event.preventDefault()

      setOpen(true)

      focusFirstIn(panelRef.current)
    },
    ref: triggerRef as Ref<HTMLButtonElement>,
    type: 'button'
  }

  const panelProps: LumenProps<'div'> = {
    'data-state': open ? 'open' : 'closed',
    hidden: !open,
    id: panelId,
    onKeyDown: (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()

        close()

        focusTrigger(triggerRef.current)

        return
      }

      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']

      if (!keys.includes(event.key)) return

      const items = getFocusable(panelRef.current)

      if (!items.length) return

      event.preventDefault()

      const currentIndex = items.indexOf(document.activeElement as HTMLElement)
      const nextItem = items[getLoopedIndex(event.key, Math.max(0, currentIndex), items.length, ['ArrowDown'])]

      nextItem?.focus()
    },
    ref: panelRef as Ref<HTMLDivElement>
  }

  return {
    close,
    open,
    panelProps,
    panelRef,
    rootProps: {
      ref: rootRef as Ref<HTMLDivElement>
    },
    rootRef,
    setOpen,
    toggle,
    triggerProps,
    triggerRef
  }
}

export const useDialog = (options: DialogOptions = {}): DialogController => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const [open, setOpen] = useControllableState({
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
    value: options.open
  })

  const close = useCallback(() => { setOpen(false); }, [setOpen])

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal()
      } else {
        dialog.setAttribute('open', '')
      }

      focusFirstIn(dialog)

      return
    }

    if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const dialogProps: LumenProps<'dialog'> = {
    'aria-modal': true,
    'data-ui-alert-dialog': options.alert ? true : undefined,
    'data-ui-dialog': options.alert ? undefined : true,
    onClick: (event) => {
      if (event.target === dialogRef.current && !options.alert) {
        close()
      }
    },
    onClose: () => {
      close()

      focusTrigger(triggerRef.current)
    },
    ref: dialogRef,
    role: options.alert ? 'alertdialog' : 'dialog'
  }

  const triggerProps: LumenProps<'button'> = {
    'aria-haspopup': 'dialog',
    onClick: () => { setOpen(true); },
    ref: triggerRef as Ref<HTMLButtonElement>,
    type: 'button'
  }

  return {
    close,
    closeProps: {
      onClick: close,
      type: 'button'
    },
    dialogProps,
    dialogRef,
    open,
    setOpen,
    triggerProps,
    triggerRef
  }
}

export const usePopover = (options: PopoverOptions = {}): PopoverController =>
  useDisclosureController(options, 'menu')

export const useDropdownMenu = (options: DropdownMenuOptions = {}): DropdownMenuController =>
  useDisclosureController(options, 'menu')

export const useTabs = ({
  defaultValue = '',
  id,
  onValueChange,
  orientation = 'horizontal',
  value
}: TabsOptions = {}): TabsController => {
  const rootRef = useRef<HTMLElement | null>(null)
  const tabsId = useSafeId('ui-tabs', id)

  const [selectedValue, setSelectedValue] = useControllableState({
    defaultValue,
    onChange: onValueChange,
    value
  })

  const activate = useCallback((nextValue: string) => {
    setSelectedValue(nextValue)
  }, [setSelectedValue])

  const getTriggerProps = useCallback<TabsController['getTriggerProps']>((triggerValue, props = {}) => {
    const selected = selectedValue === triggerValue
    const triggerId = `${tabsId}-tab-${triggerValue}`
    const panelId = `${tabsId}-panel-${triggerValue}`

    return {
      ...props,
      'aria-controls': panelId,
      'aria-selected': selected,
      id: props.id ?? triggerId,
      onClick: composeHandlers(props.onClick, () => { activate(triggerValue); }),
      onKeyDown: composeHandlers(props.onKeyDown, (event) => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']

        if (!keys.includes(event.key)) return

        const tabs = rootRef.current
          ? [...rootRef.current.querySelectorAll<HTMLElement>('[role="tab"]')]
          : []

        if (!tabs.length) return

        event.preventDefault()

        const currentIndex = tabs.indexOf(event.currentTarget)
        const nextTab = tabs[getLoopedIndex(event.key, Math.max(0, currentIndex), tabs.length, ['ArrowRight'])]
        const nextValue = nextTab?.dataset.value

        if (!nextTab || !nextValue) return

        activate(nextValue)

        nextTab.focus()
      }),
      role: 'tab',
      tabIndex: selected ? 0 : -1,
      type: props.type ?? 'button',
      'data-value': triggerValue
    }
  }, [activate, selectedValue, tabsId])

  const getPanelProps = useCallback<TabsController['getPanelProps']>((panelValue, props = {}) => {
    const selected = selectedValue === panelValue

    return {
      ...props,
      'aria-labelledby': `${tabsId}-tab-${panelValue}`,
      hidden: !selected,
      id: props.id ?? `${tabsId}-panel-${panelValue}`,
      role: 'tabpanel',
      tabIndex: props.tabIndex ?? 0
    }
  }, [selectedValue, tabsId])

  return {
    getPanelProps,
    getTriggerProps,
    listProps: {
      'aria-orientation': orientation,
      role: 'tablist'
    },
    rootProps: {
      'data-ui-tabs': true,
      ref: rootRef as Ref<HTMLDivElement>
    },
    rootRef,
    setValue: setSelectedValue,
    value: selectedValue
  }
}

const normalizeOption = (option: SelectOptionInput): SelectOption =>
  typeof option === 'string' ? { label: option, value: option } : option

const isPrintableKey = (event: KeyboardEvent): boolean =>
  event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey

/* eslint-disable complexity -- Select owns the native select, ARIA listbox props, and keyboard/typeahead behavior as one public hook contract. */
export const useSelect = ({
  defaultValue = '',
  disabled = false,
  id,
  name,
  onValueChange,
  options = [],
  placeholder,
  required = false,
  value
}: SelectOptions = {}): SelectController => {
  const rootRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLElement | null>(null)
  const typeaheadRef = useRef('')
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const selectId = useSafeId('ui-select', id)
  const listId = `${selectId}-listbox`
  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options])
  const [open, setOpen] = useState(false)

  const [selectedValue, setSelectedValue] = useControllableState({
    defaultValue,
    onChange: onValueChange,
    value
  })

  const selectedOption = normalizedOptions.find(option => option.value === selectedValue)
  const triggerText = selectedOption?.label ?? placeholder ?? 'Select an option'
  const hasSelection = Boolean(selectedOption && selectedValue !== '')
  const close = useCallback(() => { setOpen(false); }, [setOpen])
  const openList = useCallback(() => { setOpen(true); }, [setOpen])

  useOutsideClose(open, [rootRef, triggerRef, listRef], close)

  useEffect(() => () => {
    if (typeaheadTimerRef.current) {
      clearTimeout(typeaheadTimerRef.current)
    }
  }, [])

  const getEnabledItems = useCallback((): HTMLElement[] => {
    if (!listRef.current) return []

    return [...listRef.current.querySelectorAll<HTMLElement>('[data-ui-select-option]')]
      .filter(item => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true')
  }, [])

  const focusOption = useCallback((key: string, currentItem?: HTMLElement): void => {
    const items = getEnabledItems()

    if (!items.length) return

    const selectedItem = items.find(item => item.getAttribute('aria-selected') === 'true')
    const current = currentItem ?? selectedItem ?? items[0]

    if (!current) return

    const currentIndex = items.indexOf(current)
    const nextItem = items[getLoopedIndex(key, Math.max(0, currentIndex), items.length, ['ArrowDown'])]

    nextItem?.focus()
  }, [getEnabledItems])

  const focusTypeaheadOption = useCallback((currentItem?: HTMLElement): void => {
    const items = getEnabledItems()
    const typeahead = typeaheadRef.current

    if (!items.length || !typeahead) return

    const selectedItem = items.find(item => item.getAttribute('aria-selected') === 'true')
    const current = currentItem ?? selectedItem ?? items[0]

    if (!current) return

    const currentIndex = items.indexOf(current)
    const startIndex = Math.max(0, currentIndex + 1)
    const orderedItems = [...items.slice(startIndex), ...items.slice(0, startIndex)]
    const nextItem = orderedItems.find(item => item.textContent.trim().toLowerCase().startsWith(typeahead))

    nextItem?.focus()
  }, [getEnabledItems])

  const handleTypeahead = useCallback((event: KeyboardEvent, currentItem?: HTMLElement): boolean => {
    if (!isPrintableKey(event)) return false

    event.preventDefault()

    typeaheadRef.current += event.key.toLowerCase()

    if (typeaheadTimerRef.current) {
      clearTimeout(typeaheadTimerRef.current)
    }

    typeaheadTimerRef.current = setTimeout(() => {
      typeaheadRef.current = ''
    }, 700)

    openList()

    focusTypeaheadOption(currentItem)

    return true
  }, [focusTypeaheadOption, openList])

  const selectOption = useCallback((nextValue: string): void => {
    const option = normalizedOptions.find(item => item.value === nextValue)

    if (!option || option.disabled) return

    setSelectedValue(nextValue)

    close()

    focusTrigger(triggerRef.current)
  }, [close, normalizedOptions, setSelectedValue])

  const rootProps: LumenProps<'div'> = {
    'data-placeholder': hasSelection ? 'false' : 'true',
    'data-ui-select': true,
    ref: rootRef as Ref<HTMLDivElement>
  }

  const controlProps: LumenProps<'div'> = {
    'data-ui-select-control': true
  }

  const nativeSelectProps: LumenProps<'select'> = {
    'aria-hidden': true,
    'data-ui-enhanced': true,
    'data-ui-select-native': true,
    disabled,
    id: selectId,
    name,
    onChange: event => { setSelectedValue(event.currentTarget.value); },
    required,
    tabIndex: -1,
    value: selectedValue
  }

  const triggerProps: LumenProps<'button'> = {
    'aria-controls': listId,
    'aria-expanded': open,
    'aria-haspopup': 'listbox',
    'aria-required': required || undefined,
    'data-ui-select-trigger': true,
    disabled,
    id: `${selectId}-trigger`,
    onClick: () => {
      setOpen(current => !current)
    },
    onKeyDown: (event) => {
      if (handleTypeahead(event)) return

      if (event.key === 'Escape') {
        close()

        return
      }

      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ']

      if (!keys.includes(event.key)) return

      event.preventDefault()

      openList()

      if (event.key === 'Enter' || event.key === ' ') {
        const selectedItem = getEnabledItems().find(item => item.getAttribute('aria-selected') === 'true')

        const firstItem = getEnabledItems()[0]

        ;(selectedItem ?? firstItem)?.focus()

        return
      }

      focusOption(event.key)
    },
    ref: triggerRef as Ref<HTMLButtonElement>,
    role: 'combobox',
    type: 'button'
  }

  const listProps: LumenProps<'div'> = {
    'data-state': open ? 'open' : 'closed',
    'data-ui-select-list': true,
    hidden: !open,
    id: listId,
    ref: listRef as Ref<HTMLDivElement>,
    role: 'listbox'
  }

  const getOptionProps = useCallback<SelectController['getOptionProps']>((option, props = {}) => ({
    ...props,
    'aria-disabled': option.disabled ? 'true' : undefined,
    'aria-selected': selectedValue === option.value,
    'data-ui-select-option': true,
    'data-value': option.value,
    disabled: option.disabled,
    onClick: composeHandlers(props.onClick, () => { selectOption(option.value); }),
    onKeyDown: composeHandlers(props.onKeyDown, (event) => {
      if (handleTypeahead(event, event.currentTarget)) return

      if (event.key === 'Escape') {
        close()

        focusTrigger(triggerRef.current)

        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()

        selectOption(option.value)

        return
      }

      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']

      if (!keys.includes(event.key)) return

      event.preventDefault()

      focusOption(event.key, event.currentTarget)
    }),
    role: 'option',
    tabIndex: -1,
    type: props.type ?? 'button'
  }), [close, focusOption, handleTypeahead, selectOption, selectedValue])

  return {
    close,
    controlProps,
    getOptionProps,
    listProps,
    nativeSelectProps,
    open,
    options: normalizedOptions,
    rootProps,
    rootRef,
    selectOption,
    selectedOption,
    setOpen,
    triggerProps,
    triggerText,
    value: selectedValue
  }
}
/* eslint-enable complexity */

export const useThemeBuilder = ({
  accentHue,
  defaultAccentHue = 54,
  defaultExportFormat = 'css',
  defaultHue = 264,
  defaultMode = 'generated',
  defaultPrimaryColor = '#6f20f0',
  defaultScheme = 'light',
  defaultSecondaryColor = '#14b8a6',
  exportFormat,
  hue,
  mode,
  onAccentHueChange,
  onExportFormatChange,
  onHueChange,
  onModeChange,
  onPrimaryColorChange,
  onSchemeChange,
  onSecondaryColorChange,
  onThemeChange,
  onThemeExport,
  primaryColor,
  scheme,
  secondaryColor
}: ThemeBuilderOptions = {}): ThemeBuilderController => {
  const [currentHue, setHue] = useControllableState({
    defaultValue: defaultHue,
    onChange: onHueChange,
    value: hue
  })

  const [currentAccentHue, setAccentHue] = useControllableState({
    defaultValue: defaultAccentHue,
    onChange: onAccentHueChange,
    value: accentHue
  })

  const [currentMode, setMode] = useControllableState({
    defaultValue: defaultMode,
    onChange: onModeChange,
    value: mode
  })

  const [currentScheme, setScheme] = useControllableState({
    defaultValue: defaultScheme,
    onChange: onSchemeChange,
    value: scheme
  })

  const [currentPrimaryColor, setPrimaryColor] = useControllableState({
    defaultValue: defaultPrimaryColor,
    onChange: onPrimaryColorChange,
    value: primaryColor
  })

  const [currentSecondaryColor, setSecondaryColor] = useControllableState({
    defaultValue: defaultSecondaryColor,
    onChange: onSecondaryColorChange,
    value: secondaryColor
  })

  const [currentExportFormat, setExportFormat] = useControllableState({
    defaultValue: defaultExportFormat,
    onChange: onExportFormatChange,
    value: exportFormat
  })

  const result = useMemo(() => createThemeBuilderTokens({
    accentHue: currentAccentHue,
    hue: currentHue,
    mode: currentMode,
    primaryColor: currentPrimaryColor,
    scheme: currentScheme,
    secondaryColor: currentSecondaryColor
  }), [
    currentAccentHue,
    currentHue,
    currentMode,
    currentPrimaryColor,
    currentScheme,
    currentSecondaryColor
  ])

  const exportValue = useMemo(() => exportThemeBuilderValue(
    result.tokens,
    result.scheme,
    currentExportFormat
  ), [currentExportFormat, result.scheme, result.tokens])

  const previewStyle = useMemo(() => Object.fromEntries(
    Object.entries(result.tokens).map(([token, value]) => [`--${token}`, value])
  ) as CSSProperties, [result.tokens])

  useEffect(() => {
    onThemeChange?.(result)
  }, [onThemeChange, result])

  const exportDetail = useMemo<ThemeBuilderExportDetail>(() => ({
    ...(currentExportFormat === 'css' ? { css: exportValue } : {}),
    format: currentExportFormat,
    tokens: result.tokens,
    value: exportValue
  }), [currentExportFormat, exportValue, result.tokens])

  const copyExport = useCallback(async (): Promise<string> => {
    if (typeof navigator !== 'undefined') {
      await navigator.clipboard.writeText(exportValue).catch(() => null)
    }

    onThemeExport?.(exportDetail)

    return exportValue
  }, [exportDetail, exportValue, onThemeExport])

  const getModeProps = useCallback<ThemeBuilderController['getModeProps']>((nextMode, props = {}) => ({
    ...props,
    'aria-pressed': currentMode === nextMode,
    'data-ui-theme-mode': nextMode,
    onClick: composeHandlers(props.onClick, () => { setMode(nextMode); }),
    type: props.type ?? 'button'
  }), [currentMode, setMode])

  const getSchemeProps = useCallback<ThemeBuilderController['getSchemeProps']>((nextScheme, props = {}) => ({
    ...props,
    'aria-pressed': currentScheme === nextScheme,
    'data-ui-theme-scheme': nextScheme,
    onClick: composeHandlers(props.onClick, () => { setScheme(nextScheme); }),
    type: props.type ?? 'button'
  }), [currentScheme, setScheme])

  const getExportFormatProps = useCallback<ThemeBuilderController['getExportFormatProps']>((format, props = {}) => ({
    ...props,
    'aria-pressed': currentExportFormat === format,
    'data-ui-theme-export-format': format,
    onClick: composeHandlers(props.onClick, () => { setExportFormat(coerceThemeBuilderExportFormat(format)); }),
    type: props.type ?? 'button'
  }), [currentExportFormat, setExportFormat])

  return {
    ...result,
    accentHueProps: {
      'data-ui-theme-accent-hue': true,
      max: 359,
      min: 0,
      onChange: event => { setAccentHue(Number(event.currentTarget.value)); },
      type: 'range',
      value: currentAccentHue
    },
    copyExport,
    exportButtonProps: {
      'data-ui-theme-export': true,
      onClick: () => {
        copyExport().catch(() => null)
      },
      type: 'button'
    },
    exportFormat: currentExportFormat,
    exportValue,
    getExportFormatProps,
    getModeProps,
    getSchemeProps,
    hueProps: {
      'data-ui-theme-brand-hue': true,
      max: 359,
      min: 0,
      onChange: event => { setHue(Number(event.currentTarget.value)); },
      type: 'range',
      value: currentHue
    },
    outputProps: {
      'data-ui-theme-output': true,
      readOnly: true,
      value: exportValue
    },
    previewStyle,
    primaryColorProps: {
      'data-ui-theme-primary-color': true,
      onChange: event => { setPrimaryColor(event.currentTarget.value); },
      type: 'color',
      value: currentPrimaryColor
    },
    rootProps: {
      'data-ui-theme-builder': true
    },
    secondaryColorProps: {
      'data-ui-theme-secondary-color': true,
      onChange: event => { setSecondaryColor(event.currentTarget.value); },
      type: 'color',
      value: currentSecondaryColor
    },
    setAccentHue,
    setExportFormat,
    setHue,
    setMode,
    setPrimaryColor,
    setScheme,
    setSecondaryColor
  }
}

export const useTooltip = ({
  defaultOpen = false,
  delay = 250,
  id,
  onOpenChange,
  open,
}: TooltipOptions = {}): TooltipController => {
  const tooltipId = useSafeId('ui-tooltip', id)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [isOpen, setIsOpen] = useControllableState({
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    value: open
  })

  const close = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setIsOpen(false)
  }, [setIsOpen])

  const scheduleOpen = useCallback((nextDelay: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => { setIsOpen(true); }, nextDelay)
  }, [setIsOpen])

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return {
    close,
    open: isOpen,
    rootProps: {
      'aria-describedby': isOpen ? tooltipId : undefined,
      'data-ui-tooltip': true,
      onFocus: () => { scheduleOpen(0); },
      onKeyDown: (event) => {
        if (event.key === 'Escape') {
          close()
        }
      },
      onMouseEnter: () => { scheduleOpen(delay); },
      onMouseLeave: close
    },
    setOpen: setIsOpen,
    tooltipProps: {
      hidden: !isOpen,
      id: tooltipId,
      role: 'tooltip'
    }
  }
}

const createToastId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ui-toast-${crypto.randomUUID()}`
  }

  return `ui-toast-${Math.random().toString(36).slice(2)}`
}

const getToastVariantClass = (variant: ToastVariant): string | false => {
  if (variant === 'success') return 'ui-toast--success'

  if (variant === 'warning') return 'ui-toast--warning'

  if (variant === 'destructive') return 'ui-toast--destructive'

  return false
}

const createToastRecord = (detail: ToastDetail, placement: ToastPlacement): ToastRecord => ({
  ...detail,
  id: detail.id ?? createToastId(),
  open: true,
  placement: detail.placement ?? placement,
  title: detail.title ?? 'Notification',
  variant: detail.variant ?? 'default'
})

export const ToastProvider = ({
  children,
  maxCount = defaultToastMax,
  placement = 'bottom-right'
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }, [])

  const dismiss = useCallback((id?: string) => {
    setToasts(current => current.map(toast => {
      if (id && toast.id !== id) return toast

      return { ...toast, open: false }
    }))
  }, [])

  const create = useCallback((detail: ToastDetail): string => {
    const record = createToastRecord(detail, placement)
    const stackMax = detail.max ?? maxCount

    setToasts(current => {
      const next = current.some(toast => toast.id === record.id)
        ? current.map(toast => toast.id === record.id ? record : toast)
        : [...current, record]

      const samePlacement = next.filter(toast => toast.placement === record.placement)

      const staleIds = samePlacement
        .slice(0, Math.max(0, samePlacement.length - stackMax))
        .map(toast => toast.id)

      return next.map(toast => staleIds.includes(toast.id) ? { ...toast, open: false } : toast)
    })

    return record.id
  }, [maxCount, placement])

  const update = useCallback((id: string, detail: ToastDetail) => {
    setToasts(current => current.map(toast => {
      if (toast.id !== id) return toast

      return {
        ...toast,
        ...detail,
        id,
        open: true,
        placement: detail.placement ?? toast.placement,
        title: detail.title ?? toast.title,
        variant: detail.variant ?? toast.variant
      }
    }))
  }, [])

  const api = useMemo<ToastApi>(() => ({
    create,
    dismiss,
    toasts,
    update
  }), [create, dismiss, toasts, update])

  const placements = [...new Set([placement, ...toasts.map(toast => toast.placement)])]

  return (
    <ToastContext.Provider value={api}>
      {children}
      {placements.map(item => (
        // eslint-disable-next-line no-use-before-define -- ToastViewport is kept with the toast rendering helpers below.
        <ToastViewport
          key={item}
          maxCount={maxCount}
          placement={item}
          removeToast={removeToast}
          toasts={toasts.filter(toast => toast.placement === item)}
        />
      ))}
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastApi => {
  const api = useContext(ToastContext)

  if (!api) {
    throw new Error('useToast must be used inside a ToastProvider.')
  }

  return api
}

interface ToastViewportProps {
  maxCount: number
  placement: ToastPlacement
  removeToast: (id: string) => void
  toasts: ToastRecord[]
}

const ToastViewport = ({
  maxCount,
  placement,
  removeToast,
  toasts
}: ToastViewportProps) => (
  <div
    aria-atomic="false"
    aria-label="Notifications"
    aria-live="polite"
    className="ui-sonner"
    data-placement={placement}
    data-ui-sonner
    data-ui-toast-max={maxCount}
  >
    {toasts.map(toast => (
      // eslint-disable-next-line no-use-before-define -- ToastItem is declared with the toast rendering helpers below.
        <ToastItem
        key={toast.id}
        onDismiss={() => { removeToast(toast.id); }}
        toast={toast}
      />
    ))}
  </div>
)

interface ToastItemProps {
  onDismiss: () => void
  toast: ToastRecord
}

const ToastItem = ({
  onDismiss,
  toast
}: ToastItemProps) => {
  const toastRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const remainingRef = useRef(toast.duration ?? defaultToastDuration)
  const startedAtRef = useRef(0)
  const dismiss = useToast().dismiss

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  const startTimer = useCallback(() => {
    const remaining = remainingRef.current

    clearTimer()

    if (!Number.isFinite(remaining) || remaining <= 0) return

    startedAtRef.current = Date.now()

    timerRef.current = setTimeout(() => { dismiss(toast.id); }, remaining)
  }, [clearTimer, dismiss, toast.id])

  const pauseTimer = useCallback(() => {
    clearTimer()

    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current))
  }, [clearTimer])

  const resumeTimer = useCallback(() => {
    if (remainingRef.current > 0) {
      startTimer()
    }
  }, [startTimer])

  useEffect(() => {
    remainingRef.current = toast.duration ?? defaultToastDuration

    startTimer()

    return clearTimer
  }, [clearTimer, startTimer, toast.duration])

  useEffect(() => {
    if (!toast.open) {
      const timer = setTimeout(onDismiss, closeDelay)

      return () => { clearTimeout(timer); }
    }
  }, [onDismiss, toast.open])

  const action = toast.action
  const description = toast.description ?? ''
  const variantClass = getToastVariantClass(toast.variant)

  return (
    <aside
      aria-live={toast.variant === 'destructive' ? 'assertive' : 'polite'}
      className={composeClassName('ui-toast', variantClass)}
      data-description={description}
      data-state={toast.open ? 'open' : 'closed'}
      data-title={toast.title}
      data-ui-toast
      data-variant={toast.variant}
      id={toast.id}
      onFocus={pauseTimer}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return

        event.preventDefault()

        dismiss(toast.id)
      }}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      ref={toastRef}
      role={toast.variant === 'destructive' ? 'alert' : 'status'}
    >
      <div className="ui-toast__body">
        <strong>{toast.title}</strong>
        {description && <p>{description}</p>}
      </div>
      {action?.label && (
        <button
          className="ui-button ui-button--secondary ui-button--sm ui-toast__action"
          onClick={(event) => {
            action.onClick?.(event, toastRef.current)

            toastRef.current?.dispatchEvent(new CustomEvent(action.event ?? 'ui:toast-action', {
              bubbles: true,
              detail: { id: toast.id, value: action.value }
            }))

            dismiss(toast.id)
          }}
          type="button"
        >
          {action.label}
        </button>
      )}
      <button
        aria-label="Dismiss notification"
        className="ui-toast__dismiss"
        onClick={() => { dismiss(toast.id); }}
        type="button"
      >
        Dismiss
      </button>
    </aside>
  )
}

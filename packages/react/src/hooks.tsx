/* eslint-disable @eslint-react/no-context-provider, @eslint-react/no-use-context, react-refresh/only-export-components -- The package intentionally keeps public hooks, explicit context providers, and small helper components together in one library module. */
'use client'

import {
  type ComponentPropsWithRef,
  createContext,
  type CSSProperties,
  type Dispatch,
  type JSX,
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

import {
  coerceThemeBuilderExportFormat,
  composeClassName,
  createThemeBuilderTokens,
  exportThemeBuilderValue,
  getLumenRichTextShortcut,
  isLumenRichTextToggleCommand,
  type LumenRichTextChangeDetail,
  type LumenRichTextCommandDetail as CoreRichTextCommandDetail,
  type LumenThemeBuilderExportFormat,
  type LumenThemeBuilderMode,
  type LumenThemeBuilderResult,
  type LumenThemeBuilderScheme,
  type LumenThemeTokens
} from '@santi020k/lumen-core'

type ChangeHandler<T> = (value: T) => void

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning'

type DataAttributes = Record<`data-${string}`, unknown>

type LumenProps<Tag extends keyof JSX.IntrinsicElements> = ComponentPropsWithRef<Tag> & DataAttributes

type InputMode = NonNullable<ComponentPropsWithRef<'input'>['inputMode']>

const setRefValue = <Value,>(ref: Ref<Value> | undefined, value: Value | null): void => {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

interface RichTextCommandDocument {
  execCommand?: (command: string, showUi?: boolean, value?: string) => boolean
  queryCommandState?: (command: string) => boolean
  queryCommandValue?: (command: string) => string
}

export type ToastPlacement = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right'

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

export type ContextMenuOptions = DisclosureOptions

export interface ContextMenuController {
  close: () => void
  menuProps: LumenProps<'menu'>
  menuRef: RefObject<HTMLElement | null>
  open: boolean
  openAt: (x: number, y: number) => void
  setOpen: Dispatch<SetStateAction<boolean>>
  triggerProps: LumenProps<'button'>
  triggerRef: RefObject<HTMLElement | null>
}

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

export interface InputOTPOptions {
  defaultValue?: string | undefined
  disabled?: boolean | undefined
  inputMode?: InputMode | undefined
  inputRef?: Ref<HTMLInputElement> | undefined
  invalid?: boolean | undefined
  length?: number | undefined
  onValueChange?: ChangeHandler<string> | undefined
  pattern?: string | undefined
  value?: string | undefined
}

export interface InputOTPController {
  activeIndex: number
  getInputProps: (props?: ComponentPropsWithRef<'input'>) => LumenProps<'input'>
  getSegmentChar: (index: number) => string
  getSegmentProps: (index: number, props?: ComponentPropsWithRef<'button'>) => LumenProps<'button'>
  inputRef: RefObject<HTMLInputElement | null>
  rootProps: LumenProps<'div'>
  rootRef: RefObject<HTMLDivElement | null>
  segmentIndexes: number[]
  segmentsProps: LumenProps<'div'>
  setSelection: (index: number) => void
  setValue: (value: string) => string
  syncValue: (input?: HTMLInputElement | null) => string
  value: string
}

export interface CalendarDay {
  date: string
  day: number
  disabled: boolean
  label: string
  outside: boolean
  selected: boolean
  tabIndex: 0 | -1
  today: boolean
}

export interface CalendarOptions {
  defaultValue?: string | undefined
  disabled?: boolean | undefined
  locale?: string | undefined
  max?: string | undefined
  min?: string | undefined
  month?: string | undefined
  name?: string | undefined
  onValueChange?: ChangeHandler<string> | undefined
  value?: string | undefined
}

export interface CalendarController {
  focusDate: (date: string | Date) => void
  getDayProps: (day: CalendarDay, props?: ComponentPropsWithRef<'td'>) => LumenProps<'td'>
  gridProps: LumenProps<'table'>
  inputProps: LumenProps<'input'>
  label: string
  labelProps: LumenProps<'strong'>
  month: string
  nextProps: LumenProps<'button'>
  previousProps: LumenProps<'button'>
  rootProps: LumenProps<'div'>
  rootRef: RefObject<HTMLDivElement | null>
  selectDate: (date: string | Date) => void
  value: string
  weekdays: string[]
  weeks: CalendarDay[][]
}

export interface DateRangePickerChangeDetail {
  end?: string
  start?: string
}

export interface DateRangePickerOptions {
  onRangeChange?: ChangeHandler<DateRangePickerChangeDetail> | undefined
}

export interface DateRangePickerController {
  endRef: RefObject<HTMLInputElement | null>
  getEndProps: (props?: ComponentPropsWithRef<'input'>) => LumenProps<'input'>
  getStartProps: (props?: ComponentPropsWithRef<'input'>) => LumenProps<'input'>
  rootProps: LumenProps<'div'>
  rootRef: RefObject<HTMLDivElement | null>
  startRef: RefObject<HTMLInputElement | null>
  syncRange: (root?: HTMLElement | null) => DateRangePickerChangeDetail
}

export type RichTextEditorCommandDetail = CoreRichTextCommandDetail

export interface RichTextEditorOptions {
  onChange?: ChangeHandler<LumenRichTextChangeDetail> | undefined
  onCommand?: ChangeHandler<RichTextEditorCommandDetail> | undefined
}

export interface RichTextEditorController {
  executeCommand: (command: string, root?: HTMLElement | null, value?: string) => boolean
  getCommandProps: (command: string, props?: LumenProps<'button'>) => LumenProps<'button'>
  getEditableProps: (props?: ComponentPropsWithRef<'div'>) => LumenProps<'div'>
  rootProps: LumenProps<'section'>
  rootRef: RefObject<HTMLElement | null>
}

export interface ScheduleChangeDetail {
  eventId?: string
  slot?: string
}

export interface ScheduleOptions {
  onChange?: ChangeHandler<ScheduleChangeDetail> | undefined
}

export interface ScheduleController {
  emitChange: (detail: ScheduleChangeDetail, root?: HTMLElement | null) => void
  getEventProps: (eventId?: string, props?: ComponentPropsWithRef<'article'>) => LumenProps<'article'>
  getSlotProps: (slot: string, props?: ComponentPropsWithRef<'section'>) => LumenProps<'section'>
  rootProps: LumenProps<'section'>
  rootRef: RefObject<HTMLElement | null>
}

export type ResizableDirection = 'horizontal' | 'vertical'

export interface ResizableOptions {
  defaultSizes?: number[] | undefined
  direction?: ResizableDirection | undefined
  maxSize?: number | number[] | undefined
  minSize?: number | number[] | undefined
  onSizesChange?: ChangeHandler<number[]> | undefined
  panelCount?: number | undefined
  resetOnDoubleClick?: boolean | undefined
}

export interface ResizableController {
  direction: ResizableDirection
  getHandleProps: (index: number, props?: ComponentPropsWithRef<'button'>) => LumenProps<'button'>
  getPanelProps: (index: number, props?: ComponentPropsWithRef<'div'>) => LumenProps<'div'>
  handleIndexes: number[]
  panelIndexes: number[]
  reset: () => void
  resizePair: (index: number, nextSize: number) => void
  rootProps: LumenProps<'div'>
  rootRef: RefObject<HTMLDivElement | null>
  sizes: number[]
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
  getModeProps: (mode: LumenThemeBuilderMode, props?: ComponentPropsWithRef<'button'>) => LumenProps<'button'>
  getSchemeProps: (scheme: LumenThemeBuilderScheme, props?: ComponentPropsWithRef<'button'>) => LumenProps<'button'>
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

const composeHandlers =
  <Event,>(userHandler: ((event: Event) => void) | undefined, lumenHandler: (event: Event) => void) => (event: Event) => {
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

  return [...root.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    element => !element.hasAttribute('hidden') && isElementVisible(element)
  )
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

const getOwnedTarget = (event: Event): Node | null => (event.target instanceof Node ? event.target : null)

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

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    next => {
      const resolvedValue = typeof next === 'function' ? (next as (previous: T) => T)(currentValue) : next

      if (value === undefined) {
        setUncontrolledValue(resolvedValue)
      }

      onChange?.(resolvedValue)
    }, [currentValue, onChange, value]
  )

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

const clampViewportPosition = (value: number, size: number, viewportSize: number): number => Math.max(8, Math.min(value, viewportSize - size - 8))

const getContextMenuPosition = (x: number, y: number, rect: DOMRect | undefined): { left: number, top: number } => {
  const width = rect?.width ?? 0
  const height = rect?.height ?? 0
  const viewportWidth = typeof window === 'undefined' ? x + width + 16 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? y + height + 16 : window.innerHeight

  return {
    left: clampViewportPosition(x, width, viewportWidth),
    top: clampViewportPosition(y, height, viewportHeight)
  }
}

const useOutsideClose = (open: boolean, refs: RefObject<HTMLElement | null>[], onClose: () => void): void => {
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

const useDisclosureController = (options: DisclosureOptions, hasPopup: 'listbox' | 'menu'): DisclosureController => {
  const rootRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLElement | null>(null)
  const panelId = useSafeId(`ui-${hasPopup}`, options.id)

  const [open, setOpen] = useControllableState({
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
    value: options.open
  })

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const toggle = useCallback(() => {
    setOpen(current => !current)
  }, [setOpen])

  useOutsideClose(open, [rootRef, triggerRef, panelRef], close)

  const triggerProps: LumenProps<'button'> = {
    'aria-controls': panelId,
    'aria-expanded': open,
    'aria-haspopup': hasPopup,
    'data-ui-trigger': true,
    onClick: () => {
      toggle()
    },
    onKeyDown: event => {
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
    onKeyDown: event => {
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

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

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
    onClick: event => {
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
    onClick: () => {
      setOpen(true)
    },
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

export const usePopover = (options: PopoverOptions = {}): PopoverController => useDisclosureController(options, 'menu')

export const useDropdownMenu = (options: DropdownMenuOptions = {}): DropdownMenuController => useDisclosureController(options, 'menu')

export const useContextMenu = ({
  defaultOpen = false,
  id,
  onOpenChange,
  open: controlledOpen
}: ContextMenuOptions = {}): ContextMenuController => {
  const menuRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const menuId = useSafeId('ui-context-menu', id)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  const [open, setOpen] = useControllableState({
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    value: controlledOpen
  })

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const openAt = useCallback<ContextMenuController['openAt']>(
    (x, y) => {
      const rect = menuRef.current?.getBoundingClientRect()

      setPosition(getContextMenuPosition(x, y, rect))

      setOpen(true)

      focusFirstIn(menuRef.current)
    }, [setOpen]
  )

  const triggerProps: LumenProps<'button'> = {
    'aria-controls': menuId,
    'aria-haspopup': 'menu',
    'data-ui-context-menu-trigger': menuId,
    onContextMenu: event => {
      event.preventDefault()

      openAt(event.clientX, event.clientY)
    },
    onKeyDown: event => {
      if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return

      event.preventDefault()

      const rect = event.currentTarget.getBoundingClientRect()

      openAt(rect.left + 16, rect.top + 16)
    },
    ref: triggerRef as Ref<HTMLButtonElement>,
    type: 'button'
  }

  const menuProps: LumenProps<'menu'> = {
    'data-state': open ? 'open' : 'closed',
    'data-ui-context-menu': true,
    hidden: !open,
    id: menuId,
    onClick: event => {
      if (event.target instanceof HTMLElement && event.target.closest('[role="menuitem"]')) {
        close()
      }
    },
    onKeyDown: event => {
      if (event.key === 'Escape') {
        event.preventDefault()

        close()

        focusTrigger(triggerRef.current)

        return
      }

      if (!['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(event.key)) return

      const items = getFocusable(menuRef.current)

      if (items.length === 0) return

      event.preventDefault()

      const activeElement = typeof document === 'undefined' ? null : document.activeElement
      const currentIndex = activeElement instanceof HTMLElement ? items.indexOf(activeElement) : -1

      items[getLoopedIndex(event.key, currentIndex, items.length, ['ArrowDown'])]?.focus()
    },
    ref: menuRef,
    role: 'menu',
    style: {
      left: position.left,
      position: 'fixed',
      top: position.top,
      zIndex: 60
    }
  }

  return {
    close,
    menuProps,
    menuRef,
    open,
    openAt,
    setOpen,
    triggerProps,
    triggerRef
  }
}

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

  const activate = useCallback(
    (nextValue: string) => {
      setSelectedValue(nextValue)
    }, [setSelectedValue]
  )

  const getTriggerProps = useCallback<TabsController['getTriggerProps']>(
    (triggerValue, props = {}) => {
      const selected = selectedValue === triggerValue
      const triggerId = `${tabsId}-tab-${triggerValue}`
      const panelId = `${tabsId}-panel-${triggerValue}`

      return {
        ...props,
        'aria-controls': panelId,
        'aria-selected': selected,
        id: props.id ?? triggerId,
        onClick: composeHandlers(props.onClick, () => {
          activate(triggerValue)
        }),
        onKeyDown: composeHandlers(props.onKeyDown, event => {
          const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']

          if (!keys.includes(event.key)) return

          const tabs = rootRef.current ? [...rootRef.current.querySelectorAll<HTMLElement>('[role="tab"]')] : []

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
    }, [activate, selectedValue, tabsId]
  )

  const getPanelProps = useCallback<TabsController['getPanelProps']>(
    (panelValue, props = {}) => {
      const selected = selectedValue === panelValue

      return {
        ...props,
        'aria-labelledby': `${tabsId}-tab-${panelValue}`,
        hidden: !selected,
        id: props.id ?? `${tabsId}-panel-${panelValue}`,
        role: 'tabpanel',
        tabIndex: props.tabIndex ?? 0
      }
    }, [selectedValue, tabsId]
  )

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

const normalizeOption = (option: SelectOptionInput): SelectOption => typeof option === 'string' ? { label: option, value: option } : option
const isPrintableKey = (event: KeyboardEvent): boolean => event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey

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

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const openList = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  useOutsideClose(open, [rootRef, triggerRef, listRef], close)

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current) {
        clearTimeout(typeaheadTimerRef.current)
      }
    }, []
  )

  const getEnabledItems = useCallback((): HTMLElement[] => {
    if (!listRef.current) return []

    return [...listRef.current.querySelectorAll<HTMLElement>('[data-ui-select-option]')].filter(
      item => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true'
    )
  }, [])

  const focusOption = useCallback(
    (key: string, currentItem?: HTMLElement): void => {
      const items = getEnabledItems()

      if (!items.length) return

      const selectedItem = items.find(item => item.getAttribute('aria-selected') === 'true')
      const current = currentItem ?? selectedItem ?? items[0]

      if (!current) return

      const currentIndex = items.indexOf(current)
      const nextItem = items[getLoopedIndex(key, Math.max(0, currentIndex), items.length, ['ArrowDown'])]

      nextItem?.focus()
    }, [getEnabledItems]
  )

  const focusTypeaheadOption = useCallback(
    (currentItem?: HTMLElement): void => {
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
    }, [getEnabledItems]
  )

  const handleTypeahead = useCallback(
    (event: KeyboardEvent, currentItem?: HTMLElement): boolean => {
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
    }, [focusTypeaheadOption, openList]
  )

  const selectOption = useCallback(
    (nextValue: string): void => {
      const option = normalizedOptions.find(item => item.value === nextValue)

      if (!option || option.disabled) return

      setSelectedValue(nextValue)

      close()

      focusTrigger(triggerRef.current)
    }, [close, normalizedOptions, setSelectedValue]
  )

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
    onChange: event => {
      setSelectedValue(event.currentTarget.value)
    },
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
    onKeyDown: event => {
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

  const getOptionProps = useCallback<SelectController['getOptionProps']>(
    (option, props = {}) => ({
      ...props,
      'aria-disabled': option.disabled ? 'true' : undefined,
      'aria-selected': selectedValue === option.value,
      'data-ui-select-option': true,
      'data-value': option.value,
      disabled: option.disabled,
      onClick: composeHandlers(props.onClick, () => {
        selectOption(option.value)
      }),
      onKeyDown: composeHandlers(props.onKeyDown, event => {
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
    }), [close, focusOption, handleTypeahead, selectOption, selectedValue]
  )

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

const fieldControlSelector = [
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="spinbutton"]',
  '[role="textbox"]'
].join(',')

const fieldDescriptionSelector = '[data-ui-field-hint], [data-ui-field-error], .ui-field__hint, .ui-field__error'
const fieldErrorSelector = '[data-ui-field-error], .ui-field__error'
const formControlSelector = ['input:not([type="hidden"])', 'select', 'textarea'].join(',')

const validityMessageAttributes = [
  ['valueMissing', 'data-error-required'],
  ['typeMismatch', 'data-error-type'],
  ['patternMismatch', 'data-error-pattern'],
  ['tooShort', 'data-error-too-short'],
  ['tooLong', 'data-error-too-long'],
  ['rangeUnderflow', 'data-error-min'],
  ['rangeOverflow', 'data-error-max'],
  ['stepMismatch', 'data-error-step'],
  ['badInput', 'data-error-bad-input'],
  ['customError', 'data-error-custom']
] as const

const isNativeFormControl = (element: EventTarget | null): element is NativeFormControl => element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
const getFieldRoot = (control: HTMLElement): HTMLElement | null => control.closest<HTMLElement>('.ui-field, [data-ui-field]')

const getValidationMessage = (control: NativeFormControl, field: HTMLElement | null): string => {
  for (const [validityKey, attributeName] of validityMessageAttributes) {
    if (!control.validity[validityKey]) continue

    return control.getAttribute(attributeName) ?? field?.getAttribute(attributeName) ?? control.validationMessage
  }

  return control.validationMessage
}

const getFieldDescriptionId = (element: HTMLElement): string => {
  if (!element.id) {
    element.id = `ui-field-description-${Math.random().toString(36).slice(2)}`
  }

  return element.id
}

const syncFieldDescription = (field: HTMLElement): void => {
  const controlId = field.dataset.uiFieldControl

  const control = controlId ?
    document.getElementById(controlId) :
    field.querySelector<HTMLElement>(fieldControlSelector)

  if (!(control instanceof HTMLElement)) return

  const existingIds = control.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []
  const configuredIds = field.dataset.uiFieldDescribedby?.trim().split(/\s+/) ?? []
  const descriptionIds = [...field.querySelectorAll<HTMLElement>(fieldDescriptionSelector)].map(element => getFieldDescriptionId(element))
  const describedBy = [...new Set([...existingIds, ...configuredIds, ...descriptionIds].filter(Boolean))]

  if (describedBy.length) {
    control.setAttribute('aria-describedby', describedBy.join(' '))
  }
}

export const useFormValidation = ({
  onInvalid,
  onValid,
  onValidate
}: FormValidationOptions = {}): FormValidationController => {
  const formRef = useRef<HTMLFormElement | null>(null)

  const setFieldValidity = useCallback<FormValidationController['setFieldValidity']>(
    (control, invalid, message = '') => {
      const field = getFieldRoot(control)

      if (invalid) {
        control.setAttribute('aria-invalid', 'true')

        control.dataset.uiValidationInvalid = 'true'
      } else if (control.dataset.uiValidationInvalid === 'true') {
        control.removeAttribute('aria-invalid')

        delete control.dataset.uiValidationInvalid
      }

      if (!field) return

      field.dataset.invalid = String(invalid)

      for (const error of field.querySelectorAll<HTMLElement>(fieldErrorSelector)) {
        error.dataset.uiValidationErrorBound = 'true'

        error.hidden = !invalid

        error.textContent = invalid ? message : ''
      }
    }, []
  )

  const getControls = useCallback<FormValidationController['getControls']>((form = formRef.current) => {
    if (!form) return []

    return [...form.querySelectorAll<NativeFormControl>(formControlSelector)].filter(
      control => control.form === form && !control.disabled
    )
  }, [])

  const validateControl = useCallback<FormValidationController['validateControl']>(
    (control, form = formRef.current ?? control.form) => {
      if (!form) return true

      const validateDetail = { control, form, value: control.value }

      form.dispatchEvent(
        new CustomEvent('ui:validate', {
          bubbles: true,
          detail: validateDetail
        })
      )

      onValidate?.(validateDetail)

      const invalid = !control.validity.valid
      const message = invalid ? getValidationMessage(control, getFieldRoot(control)) : ''

      setFieldValidity(control, invalid, message)

      return !invalid
    }, [onValidate, setFieldValidity]
  )

  const validateForm = useCallback<FormValidationController['validateForm']>(
    (form = formRef.current) => {
      if (!form) return []

      return getControls(form).filter(control => !validateControl(control, form))
    }, [getControls, validateControl]
  )

  const emitState = useCallback(
    (name: 'ui:invalid' | 'ui:valid', detail: FormValidationStateDetail): void => {
      detail.form.dispatchEvent(
        new CustomEvent(name, {
          bubbles: true,
          detail
        })
      )

      if (name === 'ui:invalid') {
        onInvalid?.(detail)
      } else {
        onValid?.(detail)
      }
    }, [onInvalid, onValid]
  )

  const syncFields = useCallback((form: HTMLFormElement): void => {
    for (const field of form.querySelectorAll<HTMLElement>('.ui-field, [data-ui-field]')) {
      syncFieldDescription(field)
    }
  }, [])

  const formProps: LumenProps<'form'> = {
    'data-ui-form': true,
    noValidate: true,
    onBlur: event => {
      const form = event.currentTarget

      syncFields(form)

      if (!isNativeFormControl(event.target) || event.target.form !== form) return

      const valid = validateControl(event.target, form)

      emitState(
        valid ? 'ui:valid' : 'ui:invalid', valid ? { control: event.target, form } : { control: event.target, controls: [event.target], form }
      )
    },
    onSubmit: event => {
      const form = event.currentTarget

      syncFields(form)

      const invalidControls = validateForm(form)

      if (invalidControls.length) {
        event.preventDefault()

        const firstInvalid = invalidControls[0]

        if (!firstInvalid) return

        emitState('ui:invalid', { control: firstInvalid, controls: invalidControls, form })

        firstInvalid.focus({ preventScroll: true })

        firstInvalid.reportValidity()

        return
      }

      emitState('ui:valid', { controls: getControls(form), form })
    },
    ref: formRef
  }

  return {
    formProps,
    formRef,
    getControls,
    setFieldValidity,
    validateControl,
    validateForm
  }
}

/* eslint-disable @stylistic/padding-line-between-statements, complexity, no-nested-ternary -- Calendar mirrors Astro's UTC date grid and keyboard runtime. */
const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/
const calendarMonthPattern = /^\d{4}-\d{2}$/

const parseCalendarDate = (value: string | null | undefined): Date | null => {
  if (!value || !calendarDatePattern.test(value)) return null

  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null
}

const parseCalendarMonth = (value: string | null | undefined): Date | null => {
  if (!value || !calendarMonthPattern.test(value)) return null

  const [year = Number.NaN, month = Number.NaN] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 ? date : null
}

const formatCalendarDate = (date: Date): string => date.toISOString().slice(0, 10)
const formatCalendarMonth = (date: Date): string => date.toISOString().slice(0, 7)
const startOfCalendarMonth = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
const addCalendarDays = (date: Date, days: number): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days))
const getCalendarDaysInMonth = (date: Date): number => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
const addCalendarMonths = (date: Date, months: number): Date => {
  const targetMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))

  return new Date(
    Date.UTC(
      targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), Math.min(date.getUTCDate(), getCalendarDaysInMonth(targetMonth))
    )
  )
}

const getCalendarToday = (): Date => {
  const today = new Date()

  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
}

const compareCalendarDates = (date: Date, other: Date | null): number => other ? formatCalendarDate(date).localeCompare(formatCalendarDate(other)) : 0

const isCalendarDateDisabled = (disabled: boolean, date: Date, min: Date | null, max: Date | null): boolean => disabled || compareCalendarDates(date, min) < 0 || compareCalendarDates(date, max) > 0

const clampCalendarDate = (date: Date, min: Date | null, max: Date | null): Date => {
  if (min && compareCalendarDates(date, min) < 0) return min

  if (max && compareCalendarDates(date, max) > 0) return max

  return date
}

const getCalendarGridStart = (month: Date): Date => addCalendarDays(month, -((month.getUTCDay() + 6) % 7))

const getCalendarLocale = (locale: string | undefined): string => {
  if (locale) return locale

  if (typeof document !== 'undefined' && document.documentElement.lang) {
    return document.documentElement.lang
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language
  }

  return 'en'
}

const coerceCalendarDate = (value: string | Date): Date | null => value instanceof Date ? value : parseCalendarDate(value)

const getCalendarFocusDate = (
  disabled: boolean,
  month: Date,
  min: Date | null,
  max: Date | null,
  selectedDate: Date | null,
  requestedDate?: Date | null
): Date => {
  const today = getCalendarToday()
  const candidates = [requestedDate, selectedDate, today, month]

  for (const candidate of candidates) {
    if (
      candidate &&
      formatCalendarMonth(candidate) === formatCalendarMonth(month) &&
      !isCalendarDateDisabled(disabled, candidate, min, max)
    ) {
      return candidate
    }
  }

  for (let index = 0; index < getCalendarDaysInMonth(month); index += 1) {
    const date = addCalendarDays(month, index)

    if (!isCalendarDateDisabled(disabled, date, min, max)) return date
  }

  return month
}

export const useCalendar = ({
  defaultValue,
  disabled = false,
  locale,
  max,
  min,
  month,
  name,
  onValueChange,
  value: controlledValue
}: CalendarOptions = {}): CalendarController => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const generatedId = useId()
  const calendarId = `ui-calendar-${generatedId}`
  const labelId = `${calendarId}-label`
  const minDate = parseCalendarDate(min)
  const maxDate = parseCalendarDate(max)
  const defaultDate = parseCalendarDate(defaultValue)
  const controlledDate = parseCalendarDate(controlledValue)
  const [uncontrolledValue, setUncontrolledValue] = useState(() => (defaultDate ? formatCalendarDate(defaultDate) : ''))
  const selectedValue =
    controlledValue === undefined ? uncontrolledValue : controlledDate ? formatCalendarDate(controlledDate) : ''
  const selectedDate = parseCalendarDate(selectedValue)
  const initialMonth =
    parseCalendarMonth(month) ??
    (selectedDate ? startOfCalendarMonth(selectedDate) : null) ??
    startOfCalendarMonth(getCalendarToday())
  const [visibleMonthValue, setVisibleMonthValue] = useState(() => formatCalendarMonth(initialMonth))
  const visibleMonth = parseCalendarMonth(month ?? visibleMonthValue) ?? initialMonth
  const [focusValue, setFocusValue] = useState<string | null>(null)
  const focusDate = getCalendarFocusDate(
    disabled, visibleMonth, minDate, maxDate, selectedDate, parseCalendarDate(focusValue)
  )
  const focusIso = formatCalendarDate(focusDate)
  const selectedIso = selectedDate ? formatCalendarDate(selectedDate) : ''
  const currentLocale = getCalendarLocale(locale)
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(currentLocale, {
      month: 'long',
      timeZone: 'UTC',
      year: 'numeric'
    }), [currentLocale]
  )
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(currentLocale, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric'
    }), [currentLocale]
  )
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(currentLocale, {
      timeZone: 'UTC',
      weekday: 'short'
    }), [currentLocale]
  )
  const todayIso = formatCalendarDate(getCalendarToday())
  const label = monthFormatter.format(visibleMonth)
  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => weekdayFormatter.format(new Date(Date.UTC(2026, 0, 5 + index)))), [weekdayFormatter]
  )
  const weeks = useMemo(() => {
    const firstCell = getCalendarGridStart(visibleMonth)

    return Array.from({ length: 6 }, (_, rowIndex) => Array.from({ length: 7 }, (_, columnIndex): CalendarDay => {
      const date = addCalendarDays(firstCell, rowIndex * 7 + columnIndex)
      const dateIso = formatCalendarDate(date)
      const unavailable = isCalendarDateDisabled(disabled, date, minDate, maxDate)

      return {
        date: dateIso,
        day: date.getUTCDate(),
        disabled: unavailable,
        label: dayFormatter.format(date),
        outside: formatCalendarMonth(date) !== formatCalendarMonth(visibleMonth),
        selected: selectedIso === dateIso,
        tabIndex: !unavailable && focusIso === dateIso ? 0 : -1,
        today: todayIso === dateIso
      }
    }))
  }, [dayFormatter, disabled, focusIso, maxDate, minDate, selectedIso, todayIso, visibleMonth])

  const focusCalendarDate: CalendarController['focusDate'] = dateInput => {
    const date = coerceCalendarDate(dateInput)

    if (!date) return

    const nextDate = clampCalendarDate(date, minDate, maxDate)

    setVisibleMonthValue(formatCalendarMonth(startOfCalendarMonth(nextDate)))
    setFocusValue(formatCalendarDate(nextDate))
  }

  const selectDate: CalendarController['selectDate'] = dateInput => {
    if (disabled) return

    const date = coerceCalendarDate(dateInput)

    if (!date) return

    const nextDate = clampCalendarDate(date, minDate, maxDate)

    if (isCalendarDateDisabled(disabled, nextDate, minDate, maxDate)) return

    const nextValue = formatCalendarDate(nextDate)

    if (controlledValue === undefined) {
      setUncontrolledValue(nextValue)
    }

    setVisibleMonthValue(formatCalendarMonth(startOfCalendarMonth(nextDate)))
    setFocusValue(nextValue)
    onValueChange?.(nextValue)
  }

  const moveFocus = (currentDate: Date, key: string): void => {
    const column = (currentDate.getUTCDay() + 6) % 7
    const keyOffsets: Record<string, number> = {
      ArrowDown: 7,
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      End: 6 - column,
      Home: -column
    }

    if (key === 'PageDown' || key === 'PageUp') {
      focusCalendarDate(addCalendarMonths(currentDate, key === 'PageDown' ? 1 : -1))

      return
    }

    const offset = keyOffsets[key]

    if (offset !== undefined) {
      focusCalendarDate(addCalendarDays(currentDate, offset))
    }
  }

  const previousMonthLastDay = addCalendarDays(visibleMonth, -1)
  const nextMonthFirstDay = addCalendarMonths(visibleMonth, 1)
  const previousDisabled = disabled || compareCalendarDates(previousMonthLastDay, minDate) < 0
  const nextDisabled = disabled || compareCalendarDates(nextMonthFirstDay, maxDate) > 0

  const getDayProps: CalendarController['getDayProps'] = (day, props = {}) => ({
    ...props,
    'aria-disabled': day.disabled ? true : undefined,
    'aria-label': props['aria-label'] ?? day.label,
    'aria-selected': day.selected ? 'true' : 'false',
    'data-date': day.date,
    'data-outside': day.outside ? 'true' : undefined,
    'data-selected': day.selected ? 'true' : undefined,
    'data-today': day.today ? 'true' : undefined,
    'data-ui-calendar-day': true,
    onClick: composeHandlers(props.onClick, () => {
      if (!day.disabled) {
        selectDate(day.date)
      }
    }),
    onKeyDown: composeHandlers(props.onKeyDown, event => {
      if (day.disabled) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()

        selectDate(day.date)

        return
      }

      if (
        event.key !== 'ArrowDown' &&
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'End' &&
        event.key !== 'Home' &&
        event.key !== 'PageDown' &&
        event.key !== 'PageUp'
      ) {
        return
      }

      const date = parseCalendarDate(day.date)

      if (!date) return

      event.preventDefault()

      moveFocus(date, event.key)
    }),
    role: 'gridcell',
    tabIndex: props.tabIndex ?? day.tabIndex
  })

  return {
    focusDate: focusCalendarDate,
    getDayProps,
    gridProps: {
      'aria-labelledby': labelId,
      className: 'ui-calendar__grid',
      'data-ui-calendar-grid': true,
      role: 'grid'
    },
    inputProps: {
      'data-ui-calendar-input': true,
      disabled,
      name,
      type: 'hidden',
      value: selectedValue
    },
    label,
    labelProps: {
      className: 'ui-calendar__label',
      'data-ui-calendar-label': true,
      id: labelId
    },
    month: formatCalendarMonth(visibleMonth),
    nextProps: {
      'aria-label': 'Next month',
      className: 'ui-calendar__nav',
      'data-ui-calendar-next': true,
      disabled: nextDisabled,
      onClick: () => {
        const nextMonth = startOfCalendarMonth(addCalendarMonths(visibleMonth, 1))

        setVisibleMonthValue(formatCalendarMonth(nextMonth))
        setFocusValue(formatCalendarDate(getCalendarFocusDate(disabled, nextMonth, minDate, maxDate, selectedDate)))
      },
      type: 'button'
    },
    previousProps: {
      'aria-label': 'Previous month',
      className: 'ui-calendar__nav',
      'data-ui-calendar-prev': true,
      disabled: previousDisabled,
      onClick: () => {
        const previousMonth = startOfCalendarMonth(addCalendarMonths(visibleMonth, -1))

        setVisibleMonthValue(formatCalendarMonth(previousMonth))
        setFocusValue(formatCalendarDate(getCalendarFocusDate(disabled, previousMonth, minDate, maxDate, selectedDate)))
      },
      type: 'button'
    },
    rootProps: {
      'aria-disabled': disabled ? true : undefined,
      className: 'ui-calendar',
      'data-disabled': disabled ? 'true' : undefined,
      'data-ui-calendar': true,
      'data-ui-calendar-initial-month': formatCalendarMonth(initialMonth),
      'data-ui-calendar-max': maxDate ? formatCalendarDate(maxDate) : undefined,
      'data-ui-calendar-min': minDate ? formatCalendarDate(minDate) : undefined,
      'data-ui-calendar-month': formatCalendarMonth(visibleMonth),
      'data-ui-calendar-value': selectedValue || undefined,
      ref: rootRef
    },
    rootRef,
    selectDate,
    value: selectedValue,
    weekdays,
    weeks
  }
}
/* eslint-enable @stylistic/padding-line-between-statements, complexity, no-nested-ternary */

const defaultInputOtpLength = 6
const defaultInputOtpPattern = '[0-9]*'
const normalizeInputOtpLength = (length: number | undefined): number => Math.max(1, Math.floor(Number(length) || defaultInputOtpLength))
const isNumericInputOtp = (inputMode: InputMode, pattern: string): boolean => inputMode === 'numeric' || pattern === defaultInputOtpPattern

const sanitizeInputOtpValue = (value: string, length: number, inputMode: InputMode, pattern: string): string => {
  const normalized = isNumericInputOtp(inputMode, pattern) ? value.replaceAll(/\D/g, '') : value.replaceAll(/\s/g, '')

  return normalized.slice(0, length)
}

const getInputOtpActiveIndex = (length: number, value: string, selectionStart: number | null): number => Math.min(length - 1, Math.max(0, selectionStart ?? value.length))

export const useInputOTP = ({
  defaultValue,
  disabled = false,
  inputMode = 'numeric',
  inputRef: forwardedInputRef,
  invalid = false,
  length: lengthOption,
  onValueChange,
  pattern = defaultInputOtpPattern,
  value: controlledValue
}: InputOTPOptions = {}): InputOTPController => {
  const length = normalizeInputOtpLength(lengthOption)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [uncontrolledValue, setUncontrolledValue] = useState(() => sanitizeInputOtpValue(defaultValue ?? '', length, inputMode, pattern))
  const value = sanitizeInputOtpValue(controlledValue ?? uncontrolledValue, length, inputMode, pattern)
  const segmentIndexes = useMemo(() => Array.from({ length }, (_, index) => index), [length])

  const syncValue = useCallback<InputOTPController['syncValue']>(
    (input = inputRef.current) => {
      if (!input) return value

      const nextValue = sanitizeInputOtpValue(input.value, length, inputMode, pattern)

      if (input.value !== nextValue) {
        input.value = nextValue
      }

      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue)
      }

      setActiveIndex(getInputOtpActiveIndex(length, nextValue, input.selectionStart))

      return nextValue
    }, [controlledValue, inputMode, length, pattern, value]
  )

  const setSelection = useCallback<InputOTPController['setSelection']>(
    index => {
      const input = inputRef.current
      const position = Math.min(value.length, Math.max(0, index))

      setActiveIndex(getInputOtpActiveIndex(length, value, position))

      input?.focus({ preventScroll: true })

      input?.setSelectionRange(position, position)
    }, [length, value]
  )

  const setValue = useCallback<InputOTPController['setValue']>(
    nextValue => {
      const sanitizedValue = sanitizeInputOtpValue(nextValue, length, inputMode, pattern)
      const input = inputRef.current

      if (controlledValue === undefined) {
        setUncontrolledValue(sanitizedValue)
      }

      if (input) {
        input.value = sanitizedValue

        input.setSelectionRange(sanitizedValue.length, sanitizedValue.length)
      }

      setActiveIndex(getInputOtpActiveIndex(length, sanitizedValue, sanitizedValue.length))

      onValueChange?.(sanitizedValue)

      return sanitizedValue
    }, [controlledValue, inputMode, length, onValueChange, pattern]
  )

  const commitInputValue = useCallback(
    (input: HTMLInputElement): void => {
      onValueChange?.(syncValue(input))
    }, [onValueChange, syncValue]
  )

  useEffect(() => {
    const form = inputRef.current?.form
    let resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined

    if (!form) return

    const handleReset = (): void => {
      resetTimer = globalThis.setTimeout(() => {
        syncValue(inputRef.current)
      })
    }

    form.addEventListener('reset', handleReset)

    return () => {
      if (resetTimer) {
        globalThis.clearTimeout(resetTimer)
      }

      form.removeEventListener('reset', handleReset)
    }
  }, [syncValue])

  const getInputProps = useCallback<InputOTPController['getInputProps']>(
    (props = {}) => ({
      ...props,
      'aria-invalid': props['aria-invalid'] ?? (invalid ? true : undefined),
      autoComplete: props.autoComplete ?? 'one-time-code',
      className: composeClassName('ui-input-otp ui-input-otp__native', props.className),
      'data-ui-enhanced': true,
      'data-ui-input-otp-native': true,
      disabled: props.disabled ?? disabled,
      inputMode: props.inputMode ?? inputMode,
      maxLength: props.maxLength ?? length,
      onBlur: composeHandlers(props.onBlur, event => {
        setFocused(false)

        syncValue(event.currentTarget)
      }),
      onChange: composeHandlers(props.onChange, event => {
        commitInputValue(event.currentTarget)
      }),
      onClick: composeHandlers(props.onClick, event => {
        syncValue(event.currentTarget)
      }),
      onFocus: composeHandlers(props.onFocus, event => {
        setFocused(true)

        syncValue(event.currentTarget)
      }),
      onInput: composeHandlers(props.onInput, event => {
        commitInputValue(event.currentTarget)
      }),
      onKeyDown: composeHandlers(props.onKeyDown, event => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()

          setSelection((event.currentTarget.selectionStart ?? event.currentTarget.value.length) - 1)

          return
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault()

          setSelection((event.currentTarget.selectionStart ?? event.currentTarget.value.length) + 1)

          return
        }

        if (event.key === 'Home') {
          event.preventDefault()

          setSelection(0)

          return
        }

        if (event.key === 'End') {
          event.preventDefault()

          setSelection(event.currentTarget.value.length)
        }
      }),
      onKeyUp: composeHandlers(props.onKeyUp, event => {
        syncValue(event.currentTarget)
      }),
      onPaste: composeHandlers(props.onPaste, event => {
        const pasted = event.clipboardData.getData('text')

        if (!pasted) return

        event.preventDefault()

        setValue(pasted)
      }),
      pattern: props.pattern ?? pattern,
      ref: node => {
        inputRef.current = node

        setRefValue(forwardedInputRef, node)
      },
      type: 'text',
      value
    }), [
      commitInputValue,
      disabled,
      forwardedInputRef,
      inputMode,
      invalid,
      length,
      pattern,
      setSelection,
      setValue,
      syncValue,
      value
    ]
  )

  const getSegmentChar = useCallback<InputOTPController['getSegmentChar']>(index => value[index] ?? '\u00a0', [value])

  const getSegmentProps = useCallback<InputOTPController['getSegmentProps']>(
    (index, props = {}) => ({
      ...props,
      'aria-hidden': true,
      className: composeClassName('ui-input-otp__segment', props.className),
      'data-active': String(focused && index === activeIndex),
      'data-index': index,
      'data-ui-input-otp-segment': true,
      disabled: props.disabled ?? disabled,
      onClick: composeHandlers(props.onClick, () => {
        setSelection(index)
      }),
      tabIndex: props.tabIndex ?? -1,
      type: 'button'
    }), [activeIndex, disabled, focused, setSelection]
  )

  return {
    activeIndex,
    getInputProps,
    getSegmentChar,
    getSegmentProps,
    inputRef,
    rootProps: {
      className: 'ui-input-otp-field',
      'data-disabled': disabled ? 'true' : 'false',
      'data-invalid': invalid ? 'true' : 'false',
      'data-ui-input-otp': true,
      'data-ui-input-otp-length': length,
      ref: rootRef
    },
    rootRef,
    segmentIndexes,
    segmentsProps: {
      className: 'ui-input-otp__segments',
      'data-ui-input-otp-segments': true
    },
    setSelection,
    setValue,
    syncValue,
    value
  }
}

const getDateRangeRoot = (control: HTMLInputElement, fallback: HTMLElement | null): HTMLElement | null => control.closest<HTMLElement>('[data-ui-date-range-picker]') ?? fallback

const getDateRangeInputs = (
  root: HTMLElement | null,
  start: HTMLInputElement | null,
  end: HTMLInputElement | null
): [HTMLInputElement | null, HTMLInputElement | null] => {
  if (start && end && start !== end) return [start, end]

  const inputs = root ? [...root.querySelectorAll<HTMLInputElement>('input[type="date"]')] : []

  return [start ?? inputs[0] ?? null, end ?? inputs.at(-1) ?? null]
}

const syncDateInputConstraint = (input: HTMLInputElement, property: 'max' | 'min', value: string): void => {
  if (value) {
    input[property] = value

    return
  }

  input.removeAttribute(property)
}

const syncDateRangeInputs = (
  start: HTMLInputElement | null,
  end: HTMLInputElement | null
): DateRangePickerChangeDetail => {
  if (!start || !end || start === end) return {}

  syncDateInputConstraint(end, 'min', start.value)

  syncDateInputConstraint(start, 'max', end.value)

  if (start.value && end.value && end.value < start.value) {
    end.value = start.value
  }

  return {
    ...(end.value ? { end: end.value } : {}),
    ...(start.value ? { start: start.value } : {})
  }
}

export const useDateRangePicker = ({ onRangeChange }: DateRangePickerOptions = {}): DateRangePickerController => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const startRef = useRef<HTMLInputElement | null>(null)
  const endRef = useRef<HTMLInputElement | null>(null)

  const syncRange = useCallback<DateRangePickerController['syncRange']>(
    (root = rootRef.current) => {
      const [start, end] = getDateRangeInputs(root, startRef.current, endRef.current)
      const detail = syncDateRangeInputs(start, end)

      onRangeChange?.(detail)

      return detail
    }, [onRangeChange]
  )

  const getStartProps = useCallback<DateRangePickerController['getStartProps']>(
    (props = {}) => ({
      ...props,
      onChange: composeHandlers(props.onChange, event => {
        startRef.current = event.currentTarget

        syncRange(getDateRangeRoot(event.currentTarget, rootRef.current))
      }),
      ref: startRef,
      type: props.type ?? 'date'
    }), [syncRange]
  )

  const getEndProps = useCallback<DateRangePickerController['getEndProps']>(
    (props = {}) => ({
      ...props,
      onChange: composeHandlers(props.onChange, event => {
        endRef.current = event.currentTarget

        syncRange(getDateRangeRoot(event.currentTarget, rootRef.current))
      }),
      ref: endRef,
      type: props.type ?? 'date'
    }), [syncRange]
  )

  return {
    endRef,
    getEndProps,
    getStartProps,
    rootProps: {
      'data-ui-date-range-picker': true,
      ref: rootRef
    },
    rootRef,
    startRef,
    syncRange
  }
}

const richTextEditorContentSelector = '[data-ui-rich-text-editable], [contenteditable="true"]'

const getRichTextChangeDetail = (root: HTMLElement | null): LumenRichTextChangeDetail | null => {
  const editable = root?.querySelector<HTMLElement>(richTextEditorContentSelector)

  if (!editable) return null

  return {
    html: editable.innerHTML,
    text: editable.textContent
  }
}

const executeRichTextDocumentCommand = (
  commandDocument: RichTextCommandDocument | undefined,
  command: string,
  value?: string
): boolean => {
  if (typeof commandDocument?.execCommand !== 'function') return false

  return value === undefined ? commandDocument.execCommand(command) : commandDocument.execCommand(command, false, value)
}

// eslint-disable-next-line complexity -- Command-state normalization covers toggle and value-bearing controls together.
const syncRichTextCommandStates = (root: HTMLElement | null): void => {
  if (!root || typeof document === 'undefined') return

  const commandDocument = document as unknown as RichTextCommandDocument

  for (const control of root.querySelectorAll<HTMLElement>('[data-ui-editor-command]')) {
    const command = control.dataset.uiEditorCommand ?? ''
    const value = control.dataset.uiEditorValue
    let active = false

    if (isLumenRichTextToggleCommand(command)) {
      active = commandDocument.queryCommandState?.(command) ?? false

      control.setAttribute('aria-pressed', String(active))
    } else if (command === 'formatBlock' && value) {
      const currentValue = commandDocument.queryCommandValue?.(command).replaceAll(/[<>]/g, '').toLowerCase()

      active = currentValue === value.replaceAll(/[<>]/g, '').toLowerCase()
    }

    control.dataset.state = active ? 'on' : 'off'
  }
}

export const useRichTextEditor = ({ onChange, onCommand }: RichTextEditorOptions = {}): RichTextEditorController => {
  const rootRef = useRef<HTMLElement | null>(null)

  const emitChange = useCallback(
    (root: HTMLElement | null) => {
      const detail = getRichTextChangeDetail(root)

      if (!detail) return

      if (typeof CustomEvent !== 'undefined') {
        root?.dispatchEvent(
          new CustomEvent<LumenRichTextChangeDetail>('ui:editor-change', {
            bubbles: true,
            detail
          })
        )
      }

      onChange?.(detail)
    }, [onChange]
  )

  const executeCommand = useCallback<RichTextEditorController['executeCommand']>(
    (command, root = rootRef.current, value) => {
      if (!command) return false

      const commandDocument =
        typeof document === 'undefined' ? undefined : (document as unknown as RichTextCommandDocument)

      const executed = executeRichTextDocumentCommand(commandDocument, command, value)

      const detail: RichTextEditorCommandDetail = {
        command,
        executed,
        ...(value === undefined ? {} : { value })
      }

      if (root && typeof CustomEvent !== 'undefined') {
        root.dispatchEvent(
          new CustomEvent<RichTextEditorCommandDetail>('ui:editor-command', {
            bubbles: true,
            detail
          })
        )
      }

      onCommand?.(detail)

      syncRichTextCommandStates(root)

      emitChange(root)

      return executed
    }, [emitChange, onCommand]
  )

  const getCommandProps = useCallback<RichTextEditorController['getCommandProps']>(
    (command, props = {}) => ({
      ...props,
      'data-ui-editor-command': command,
      onClick: composeHandlers(props.onClick, event => {
        const root = event.currentTarget.closest<HTMLElement>('[data-ui-rich-text-editor]') ?? rootRef.current

        executeCommand(command, root, event.currentTarget.dataset.uiEditorValue)
      }),
      type: props.type ?? 'button'
    }), [executeCommand]
  )

  const getEditableProps = useCallback<RichTextEditorController['getEditableProps']>(
    (props = {}) => ({
      ...props,
      'aria-multiline': props['aria-multiline'] ?? true,
      contentEditable: props.contentEditable ?? true,
      'data-ui-rich-text-editable': true,
      onInput: composeHandlers(props.onInput, event => {
        const root = event.currentTarget.closest<HTMLElement>('[data-ui-rich-text-editor]') ?? rootRef.current

        syncRichTextCommandStates(root)

        emitChange(root)
      }),
      onKeyDown: composeHandlers(props.onKeyDown, event => {
        const command = getLumenRichTextShortcut(event)

        if (!command) return

        event.preventDefault()

        const root = event.currentTarget.closest<HTMLElement>('[data-ui-rich-text-editor]') ?? rootRef.current

        executeCommand(command, root)
      }),
      onKeyUp: composeHandlers(props.onKeyUp, event => {
        syncRichTextCommandStates(
          event.currentTarget.closest<HTMLElement>('[data-ui-rich-text-editor]') ?? rootRef.current
        )
      }),
      onMouseUp: composeHandlers(props.onMouseUp, event => {
        syncRichTextCommandStates(
          event.currentTarget.closest<HTMLElement>('[data-ui-rich-text-editor]') ?? rootRef.current
        )
      }),
      role: props.role ?? 'textbox',
      suppressContentEditableWarning: props.suppressContentEditableWarning ?? true
    }), [emitChange, executeCommand]
  )

  return {
    executeCommand,
    getCommandProps,
    getEditableProps,
    rootProps: {
      'data-ui-rich-text-editor': true,
      ref: rootRef
    },
    rootRef
  }
}

const getScheduleRoot = (element: HTMLElement, fallback: HTMLElement | null): HTMLElement | null => element.closest<HTMLElement>('[data-ui-schedule]') ?? fallback

export const useSchedule = ({ onChange }: ScheduleOptions = {}): ScheduleController => {
  const rootRef = useRef<HTMLElement | null>(null)

  const emitChange = useCallback<ScheduleController['emitChange']>(
    (detail, root = rootRef.current) => {
      if (root && typeof CustomEvent !== 'undefined') {
        root.dispatchEvent(
          new CustomEvent('ui:schedule-change', {
            bubbles: true,
            detail
          })
        )
      }

      onChange?.(detail)
    }, [onChange]
  )

  const getEventProps = useCallback<ScheduleController['getEventProps']>(
    (eventId, props = {}) => ({
      ...props,
      ...(eventId && !props.id ? { id: eventId } : {}),
      'data-ui-draggable': true,
      'data-ui-schedule-event': true,
      draggable: props.draggable ?? true,
      onDragEnd: composeHandlers(props.onDragEnd, event => {
        const root = getScheduleRoot(event.currentTarget, rootRef.current)

        if (root) {
          delete root.dataset.uiDragging
        }
      }),
      onDragStart: composeHandlers(props.onDragStart, event => {
        const transferValue = eventId || event.currentTarget.id || event.currentTarget.textContent.trim()
        const root = getScheduleRoot(event.currentTarget, rootRef.current)

        event.dataTransfer.setData('text/plain', transferValue)

        if (root) {
          root.dataset.uiDragging = 'true'
        }
      })
    }), []
  )

  const getSlotProps = useCallback<ScheduleController['getSlotProps']>(
    (slot, props = {}) => ({
      ...props,
      'data-ui-schedule-slot': slot,
      onDragLeave: composeHandlers(props.onDragLeave, event => {
        delete event.currentTarget.dataset.state
      }),
      onDragOver: composeHandlers(props.onDragOver, event => {
        event.preventDefault()

        event.currentTarget.dataset.state = 'drag-over'
      }),
      onDrop: composeHandlers(props.onDrop, event => {
        event.preventDefault()

        delete event.currentTarget.dataset.state

        const draggedId = event.dataTransfer.getData('text/plain')
        const dragged = typeof document !== 'undefined' && draggedId ? document.getElementById(draggedId) : null

        if (typeof HTMLElement !== 'undefined' && dragged instanceof HTMLElement) {
          event.currentTarget.append(dragged)
        }

        emitChange(
          {
            ...(draggedId ? { eventId: draggedId } : {}),
            ...(slot ? { slot } : {})
          }, getScheduleRoot(event.currentTarget, rootRef.current)
        )
      })
    }), [emitChange]
  )

  return {
    emitChange,
    getEventProps,
    getSlotProps,
    rootProps: {
      'data-ui-schedule': true,
      ref: rootRef
    },
    rootRef
  }
}

/* eslint-disable @stylistic/padding-line-between-statements, @eslint-react/set-state-in-effect, @typescript-eslint/prefer-optional-chain, complexity, no-nested-ternary -- Resizable mirrors Astro's compact pane sizing runtime. */
const parseResizableNumberList = (value: number | number[] | undefined, count: number, fallback: number): number[] => {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]

  return Array.from({ length: count }, (_, index) => values[index] ?? values[0] ?? fallback)
}

const normalizeResizableSizes = (sizes: number[], count: number): number[] => {
  const fallbackSize = 100 / Math.max(1, count)
  const usableSizes = Array.from({ length: count }, (_, index) => {
    const size = sizes[index] ?? fallbackSize

    return Number.isFinite(size) && size > 0 ? size : fallbackSize
  })
  const total = usableSizes.reduce((sum, size) => sum + size, 0)

  if (total <= 0) return Array.from({ length: count }, () => fallbackSize)

  return usableSizes.map(size => (size / total) * 100)
}

const serializeResizableSize = (value: number | number[] | undefined): string | undefined => Array.isArray(value) ? value.join(',') : value === undefined ? undefined : String(value)

export const useResizable = ({
  defaultSizes,
  direction = 'horizontal',
  maxSize,
  minSize,
  onSizesChange,
  panelCount: panelCountOption = 2,
  resetOnDoubleClick = true
}: ResizableOptions = {}): ResizableController => {
  const panelCount = Math.max(0, Math.floor(panelCountOption))
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    containerSize: number
    index: number
    startPosition: number
    startSize: number
  } | null>(null)
  const minSizes = useMemo(() => parseResizableNumberList(minSize, panelCount, 12), [minSize, panelCount])
  const maxSizes = useMemo(() => parseResizableNumberList(maxSize, panelCount, 88), [maxSize, panelCount])
  const initialSizes = useMemo(
    () => normalizeResizableSizes(
      parseResizableNumberList(defaultSizes, panelCount, 100 / Math.max(1, panelCount)), panelCount
    ), [defaultSizes, panelCount]
  )
  const [sizes, setSizes] = useState(initialSizes)
  const axis = direction === 'horizontal' ? 'clientX' : 'clientY'
  const sizeProperty = direction === 'horizontal' ? 'width' : 'height'
  const separatorOrientation = direction === 'horizontal' ? 'vertical' : 'horizontal'
  const panelIndexes = useMemo(() => Array.from({ length: panelCount }, (_, index) => index), [panelCount])
  const handleIndexes = useMemo(
    () => Array.from({ length: Math.max(0, panelCount - 1) }, (_, index) => index), [panelCount]
  )

  useEffect(() => {
    setSizes(initialSizes)
  }, [initialSizes])

  const updateSizes = useCallback(
    (updater: (currentSizes: number[]) => number[]): void => {
      setSizes(currentSizes => {
        const nextSizes = updater(currentSizes)

        onSizesChange?.(nextSizes)

        return nextSizes
      })
    }, [onSizesChange]
  )

  const resizePair = useCallback<ResizableController['resizePair']>(
    (index, nextSize) => {
      updateSizes(currentSizes => {
        const nextSizes = [...currentSizes]
        const nextIndex = index + 1
        const total = (nextSizes[index] ?? 0) + (nextSizes[nextIndex] ?? 0)
        const min = Math.max(minSizes[index] ?? 0, total - (maxSizes[nextIndex] ?? 100))
        const max = Math.min(maxSizes[index] ?? 100, total - (minSizes[nextIndex] ?? 0))
        const paneSize = Math.min(max, Math.max(min, nextSize))

        nextSizes[index] = paneSize
        nextSizes[nextIndex] = total - paneSize

        return nextSizes
      })
    }, [maxSizes, minSizes, updateSizes]
  )

  const reset = useCallback<ResizableController['reset']>(() => {
    updateSizes(() => [...initialSizes])
  }, [initialSizes, updateSizes])

  const getPanelProps = useCallback<ResizableController['getPanelProps']>(
    (index, props = {}) => ({
      ...props,
      'data-ui-resizable-panel': true,
      style: {
        ...props.style,
        '--ui-resizable-size': `${sizes[index] ?? 0}%`
      } as CSSProperties
    }), [sizes]
  )

  const getHandleProps = useCallback<ResizableController['getHandleProps']>(
    (index, props = {}) => ({
      ...props,
      'aria-label': props['aria-label'] ?? `Resize panel ${index + 1}`,
      'aria-orientation': separatorOrientation,
      'aria-valuemax': Math.round(maxSizes[index] ?? 100),
      'aria-valuemin': Math.round(minSizes[index] ?? 0),
      'aria-valuenow': Math.round(sizes[index] ?? 0),
      className: composeClassName('ui-resizable__handle', props.className),
      'data-index': index,
      'data-ui-resizable-handle': true,
      onDoubleClick: composeHandlers(props.onDoubleClick, () => {
        if (resetOnDoubleClick) {
          reset()
        }
      }),
      onKeyDown: composeHandlers(props.onKeyDown, event => {
        const step = event.shiftKey ? 10 : 2
        const keyDeltas: Record<string, number> =
          direction === 'horizontal' ? { ArrowLeft: -step, ArrowRight: step } : { ArrowDown: step, ArrowUp: -step }

        if (event.key === 'Home') {
          event.preventDefault()

          resizePair(index, minSizes[index] ?? 0)

          return
        }

        if (event.key === 'End') {
          event.preventDefault()

          resizePair(index, maxSizes[index] ?? 100)

          return
        }

        const delta = keyDeltas[event.key]

        if (delta === undefined) return

        event.preventDefault()

        resizePair(index, (sizes[index] ?? 0) + delta)
      }),
      onPointerDown: composeHandlers(props.onPointerDown, event => {
        if (event.button !== 0) return

        event.preventDefault()

        dragRef.current = {
          containerSize: Math.max(1, rootRef.current?.getBoundingClientRect()[sizeProperty] ?? 1),
          index,
          startPosition: event[axis],
          startSize: sizes[index] ?? 0
        }

        if (rootRef.current) {
          rootRef.current.dataset.resizing = 'true'
        }

        event.currentTarget.dataset.active = 'true'
        event.currentTarget.setPointerCapture(event.pointerId)
      }),
      onPointerMove: composeHandlers(props.onPointerMove, event => {
        const drag = dragRef.current

        if (!drag || drag.index !== index || event.currentTarget.dataset.active !== 'true') return

        const delta = ((event[axis] - drag.startPosition) / drag.containerSize) * 100

        resizePair(index, drag.startSize + delta)
      }),
      onPointerUp: composeHandlers(props.onPointerUp, event => {
        if (event.currentTarget.dataset.active !== 'true') return

        delete event.currentTarget.dataset.active

        if (rootRef.current) {
          delete rootRef.current.dataset.resizing
        }

        dragRef.current = null

        event.currentTarget.releasePointerCapture(event.pointerId)
      }),
      role: 'separator',
      tabIndex: props.tabIndex ?? 0,
      type: props.type ?? 'button'
    }), [
      axis,
      direction,
      maxSizes,
      minSizes,
      reset,
      resetOnDoubleClick,
      resizePair,
      separatorOrientation,
      sizeProperty,
      sizes
    ]
  )

  return {
    direction,
    getHandleProps,
    getPanelProps,
    handleIndexes,
    panelIndexes,
    reset,
    resizePair,
    rootProps: {
      className: composeClassName('ui-resizable', direction === 'vertical' && 'ui-resizable--vertical'),
      'data-orientation': direction,
      'data-ui-resizable': true,
      'data-ui-resizable-default-sizes': defaultSizes?.join(','),
      'data-ui-resizable-enhanced': true,
      'data-ui-resizable-max-size': serializeResizableSize(maxSize),
      'data-ui-resizable-min-size': serializeResizableSize(minSize),
      'data-ui-resizable-reset': resetOnDoubleClick ? 'true' : undefined,
      ref: rootRef
    },
    rootRef,
    sizes
  }
}
/* eslint-enable @stylistic/padding-line-between-statements, @eslint-react/set-state-in-effect, @typescript-eslint/prefer-optional-chain, complexity, no-nested-ternary */

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

  const result = useMemo(
    () => createThemeBuilderTokens({
      accentHue: currentAccentHue,
      hue: currentHue,
      mode: currentMode,
      primaryColor: currentPrimaryColor,
      scheme: currentScheme,
      secondaryColor: currentSecondaryColor
    }), [currentAccentHue, currentHue, currentMode, currentPrimaryColor, currentScheme, currentSecondaryColor]
  )

  const exportValue = useMemo(
    () => exportThemeBuilderValue(result.tokens, result.scheme, currentExportFormat), [currentExportFormat, result.scheme, result.tokens]
  )

  const previewStyle = useMemo(
    () => Object.fromEntries(Object.entries(result.tokens).map(([token, value]) => [`--${token}`, value])) as CSSProperties, [result.tokens]
  )

  useEffect(() => {
    onThemeChange?.(result)
  }, [onThemeChange, result])

  const exportDetail = useMemo<ThemeBuilderExportDetail>(
    () => ({
      ...(currentExportFormat === 'css' ? { css: exportValue } : {}),
      format: currentExportFormat,
      tokens: result.tokens,
      value: exportValue
    }), [currentExportFormat, exportValue, result.tokens]
  )

  const copyExport = useCallback(async (): Promise<string> => {
    if (typeof navigator !== 'undefined') {
      await navigator.clipboard.writeText(exportValue).catch(() => null)
    }

    onThemeExport?.(exportDetail)

    return exportValue
  }, [exportDetail, exportValue, onThemeExport])

  const getModeProps = useCallback<ThemeBuilderController['getModeProps']>(
    (nextMode, props = {}) => ({
      ...props,
      'aria-pressed': currentMode === nextMode,
      'data-ui-theme-mode': nextMode,
      onClick: composeHandlers(props.onClick, () => {
        setMode(nextMode)
      }),
      type: props.type ?? 'button'
    }), [currentMode, setMode]
  )

  const getSchemeProps = useCallback<ThemeBuilderController['getSchemeProps']>(
    (nextScheme, props = {}) => ({
      ...props,
      'aria-pressed': currentScheme === nextScheme,
      'data-ui-theme-scheme': nextScheme,
      onClick: composeHandlers(props.onClick, () => {
        setScheme(nextScheme)
      }),
      type: props.type ?? 'button'
    }), [currentScheme, setScheme]
  )

  const getExportFormatProps = useCallback<ThemeBuilderController['getExportFormatProps']>(
    (format, props = {}) => ({
      ...props,
      'aria-pressed': currentExportFormat === format,
      'data-ui-theme-export-format': format,
      onClick: composeHandlers(props.onClick, () => {
        setExportFormat(coerceThemeBuilderExportFormat(format))
      }),
      type: props.type ?? 'button'
    }), [currentExportFormat, setExportFormat]
  )

  return {
    ...result,
    accentHueProps: {
      'data-ui-theme-accent-hue': true,
      max: 359,
      min: 0,
      onChange: event => {
        setAccentHue(Number(event.currentTarget.value))
      },
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
      onChange: event => {
        setHue(Number(event.currentTarget.value))
      },
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
      onChange: event => {
        setPrimaryColor(event.currentTarget.value)
      },
      type: 'color',
      value: currentPrimaryColor
    },
    rootProps: {
      'data-ui-theme-builder': true
    },
    secondaryColorProps: {
      'data-ui-theme-secondary-color': true,
      onChange: event => {
        setSecondaryColor(event.currentTarget.value)
      },
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
  open
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

  const scheduleOpen = useCallback(
    (nextDelay: number) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        setIsOpen(true)
      }, nextDelay)
    }, [setIsOpen]
  )

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }, []
  )

  return {
    close,
    open: isOpen,
    rootProps: {
      'aria-describedby': isOpen ? tooltipId : undefined,
      'data-ui-tooltip': true,
      onFocus: () => {
        scheduleOpen(0)
      },
      onKeyDown: event => {
        if (event.key === 'Escape') {
          close()
        }
      },
      onMouseEnter: () => {
        scheduleOpen(delay)
      },
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

  const create = useCallback(
    (detail: ToastDetail): string => {
      const record = createToastRecord(detail, placement)
      const stackMax = detail.max ?? maxCount

      setToasts(current => {
        const next = current.some(toast => toast.id === record.id) ?
          current.map(toast => (toast.id === record.id ? record : toast)) :
          [...current, record]

        const samePlacement = next.filter(toast => toast.placement === record.placement)
        const staleIds = samePlacement.slice(0, Math.max(0, samePlacement.length - stackMax)).map(toast => toast.id)

        return next.map(toast => (staleIds.includes(toast.id) ? { ...toast, open: false } : toast))
      })

      return record.id
    }, [maxCount, placement]
  )

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

  const api = useMemo<ToastApi>(
    () => ({
      create,
      dismiss,
      toasts,
      update
    }), [create, dismiss, toasts, update]
  )

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

const ToastViewport = ({ maxCount, placement, removeToast, toasts }: ToastViewportProps) => (
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
        onDismiss={() => {
          removeToast(toast.id)
        }}
        toast={toast}
      />
    ))}
  </div>
)

interface ToastItemProps {
  onDismiss: () => void
  toast: ToastRecord
}

const ToastItem = ({ onDismiss, toast }: ToastItemProps) => {
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

    timerRef.current = setTimeout(() => {
      dismiss(toast.id)
    }, remaining)
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

      return () => {
        clearTimeout(timer)
      }
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
      onKeyDown={event => {
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
          className="
            ui-button ui-button--secondary ui-button--sm ui-toast__action
          "
          onClick={event => {
            action.onClick?.(event, toastRef.current)

            toastRef.current?.dispatchEvent(
              new CustomEvent(action.event ?? 'ui:toast-action', {
                bubbles: true,
                detail: { id: toast.id, value: action.value }
              })
            )

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
        onClick={() => {
          dismiss(toast.id)
        }}
        type="button"
      >
        Dismiss
      </button>
    </aside>
  )
}

export const useThemeToggle = (defaultTheme = 'light') => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    }

    return defaultTheme
  })

  useEffect(() => {
    const doc = document.documentElement

    doc.setAttribute('data-theme', theme)

    if (theme === 'dark') {
      doc.classList.add('dark')
    } else {
      doc.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)

    window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }))
  }, [theme])

  const toggleTheme = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = theme === 'dark'
    const newTheme = isDark ? 'light' : 'dark'
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches

    if (prefersReducedMotion || isTouchDevice || !event) {
      setTheme(newTheme)

      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.round(rect.left + rect.width / 2)
    const y = Math.round(rect.top + rect.height / 2)
    const maxRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const oldBg = isDark ? 'hsl(277 20% 10%)' : 'hsl(268 20% 98%)'
    const overlay = document.createElement('div')

    overlay.setAttribute('aria-hidden', 'true')

    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '99999',
      pointerEvents: 'none',
      backgroundColor: oldBg,
      clipPath: `circle(${maxRadius}px at ${x}px ${y}px)`,
      willChange: 'clip-path'
    })

    document.body.appendChild(overlay)

    // Switch theme behind the overlay
    setTheme(newTheme)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = 'clip-path 580ms cubic-bezier(0.4, 0, 0.2, 1)'

        overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`

        const done = () => {
          overlay.remove()
        }

        overlay.addEventListener('transitionend', done, { once: true })

        setTimeout(done, 750)
      })
    })
  }

  return { theme, toggleTheme, setTheme }
}

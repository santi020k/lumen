'use client'

import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type Dispatch,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  coerceThemeBuilderExportFormat,
  composeClassName,
  createLumenKanbanMoveDetail,
  createThemeBuilderTokens,
  exportThemeBuilderValue,
  getLumenDirectionalKey,
  getLumenLocalePair,
  type LumenKanbanMoveDetail,
  type LumenLocaleOption,
  type LumenThemeBuilderExportFormat,
  type LumenThemeBuilderMode,
  type LumenThemeBuilderResult,
  type LumenThemeBuilderScheme,
  type LumenThemePreset,
  type LumenThemeTokens,
  normalizeLumenLocales,
  scrollLumenTabIntoView } from '@santi020k/lumen-core'
import { isLumenDateBoundsValid as isCalendarBoundsValid, parseLumenDate as parseCalendarDate, resolveLumenDateLabels as resolveDateControlLabels, resolveLumenDateLocale as getCalendarLocale } from '@santi020k/lumen-core'

import { useDialogLifecycle } from './dialog-lifecycle.js'
import { type FloatingPanelOptions, useFloatingPanel } from './floating-panel.js'
import { useSelectFormReset } from './select-form.js'

export { useToast } from './toast-context.js'

type ChangeHandler<T> = (value: T) => void

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning'

type DataAttributes = Record<`data-${string}`, unknown>

type LumenProps<Tag extends keyof JSX.IntrinsicElements> =
  ComponentPropsWithRef<Tag> & DataAttributes

type InputMode = NonNullable<ComponentPropsWithRef<'input'>['inputMode']>

const setRefValue = <Value,>(
  ref: Ref<Value> | undefined,
  value: Value | null
): void => {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

export type ToastPlacement =
  | 'bottom-center' |
  'bottom-left' |
  'bottom-right' |
  'top-center' |
  'top-left' |
  'top-right'

export interface ToastAction {
  event?: string
  label?: string
  onClick?: (
    event: MouseEvent<HTMLButtonElement>,
    toast: HTMLElement | null
  ) => void
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
  dismissOnEscape?: boolean | undefined
  dismissOnOutsidePress?: boolean | undefined
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

export type PopoverOptions = DisclosureOptions & FloatingPanelOptions

export type PopoverController = DisclosureController

export type DropdownMenuOptions = DisclosureOptions & FloatingPanelOptions

export type DropdownMenuController = DisclosureController

export interface LanguageToggleOptions {
  defaultValue?: string | undefined
  locales?: readonly LumenLocaleOption[] | undefined
  onValueChange?: ChangeHandler<string> | undefined
  storageKey?: string | undefined
  value?: string | undefined
}

export interface LanguageToggleController {
  currentLocale: LumenLocaleOption
  nextLocale: LumenLocaleOption
  selectNext: () => void
  value: string
}

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
  getPanelProps: (
    value: string,
    props?: ComponentPropsWithRef<'div'>
  ) => LumenProps<'div'>
  getTriggerProps: (
    value: string,
    props?: ComponentPropsWithRef<'button'>
  ) => LumenProps<'button'>
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
  getOptionProps: (
    option: SelectOption,
    props?: ComponentPropsWithRef<'button'>
  ) => LumenProps<'button'>
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

type NativeFormControl =
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

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
  setFieldValidity: (
    control: NativeFormControl,
    invalid: boolean,
    message?: string
  ) => void
  validateControl: (
    control: NativeFormControl,
    form?: HTMLFormElement | null
  ) => boolean
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
  getInputProps: (
    props?: ComponentPropsWithRef<'input'>
  ) => LumenProps<'input'>
  getSegmentChar: (index: number) => string
  getSegmentProps: (
    index: number,
    props?: ComponentPropsWithRef<'button'>
  ) => LumenProps<'button'>
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
  labels?: { previousMonth?: string, nextMonth?: string } | undefined
  locale?: string | undefined
  max?: string | undefined
  min?: string | undefined
  month?: string | undefined
  name?: string | undefined
  onValueChange?: ChangeHandler<string> | undefined
  readOnly?: boolean | undefined
  value?: string | undefined
}

export interface CalendarController {
  focusDate: (date: string | Date) => void
  getDayProps: (
    day: CalendarDay,
    props?: ComponentPropsWithRef<'td'>
  ) => LumenProps<'td'>
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
  getStartProps: (
    props?: ComponentPropsWithRef<'input'>
  ) => LumenProps<'input'>
  rootProps: LumenProps<'div'>
  rootRef: RefObject<HTMLDivElement | null>
  startRef: RefObject<HTMLInputElement | null>
  syncRange: (root?: HTMLElement | null) => DateRangePickerChangeDetail
}

export type { RichTextEditorCommandDetail, RichTextEditorController, RichTextEditorOptions } from './rich-text-editor.js'
export { useRichTextEditor } from './rich-text-editor.js'

export interface ScheduleChangeDetail {
  eventId?: string
  slot?: string
}

export interface ScheduleOptions {
  onChange?: ChangeHandler<ScheduleChangeDetail> | undefined
}

export interface ScheduleController {
  emitChange: (detail: ScheduleChangeDetail, root?: HTMLElement | null) => void
  getEventProps: (
    eventId?: string,
    props?: ComponentPropsWithRef<'article'>
  ) => LumenProps<'article'>
  getSlotProps: (
    slot: string,
    props?: ComponentPropsWithRef<'section'>
  ) => LumenProps<'section'>
  rootProps: LumenProps<'section'>
  rootRef: RefObject<HTMLElement | null>
}

export interface KanbanOptions {
  onMoveRequest?: ChangeHandler<LumenKanbanMoveDetail> | undefined
}

export interface KanbanController {
  getColumnProps: (
    column: string,
    props?: ComponentPropsWithRef<'section'>
  ) => LumenProps<'section'>
  getHandleProps: (
    itemId: string,
    props?: ComponentPropsWithRef<'button'>
  ) => LumenProps<'button'>
  getItemProps: (
    itemId: string,
    props?: ComponentPropsWithRef<'article'>
  ) => LumenProps<'article'>
  requestMove: (detail: LumenKanbanMoveDetail) => boolean
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
  getHandleProps: (
    index: number,
    props?: ComponentPropsWithRef<'button'>
  ) => LumenProps<'button'>
  getPanelProps: (
    index: number,
    props?: ComponentPropsWithRef<'div'>
  ) => LumenProps<'div'>
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
  radiusScale?: number | undefined
  spacingScale?: number | undefined
  borderWidth?: number | undefined
  preset?: LumenThemePreset | undefined
  defaultPreset?: LumenThemePreset | undefined
  onPresetChange?: ChangeHandler<LumenThemePreset | undefined> | undefined
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
  onExportFormatChange?:
    ChangeHandler<LumenThemeBuilderExportFormat> | undefined
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
  setPreset: Dispatch<SetStateAction<LumenThemePreset | undefined>>
  getPresetProps: (preset: LumenThemePreset, props?: ComponentPropsWithRef<'button'>) => LumenProps<'button'>
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

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

const composeHandlers =
  <Event,>(
    userHandler: ((event: Event) => void) | undefined,
    lumenHandler: (event: Event) => void
  ) => (event: Event) => {
    userHandler?.(event)

    lumenHandler(event)
  }

const isElementVisible = (element: HTMLElement): boolean => {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ visibilityProperty: true })
  }

  const visibility = getComputedStyle(element).visibility

  if (visibility === 'hidden' || visibility === 'collapse') return false

  return element.offsetParent !== null || element.getClientRects().length > 0
}

const getFocusable = (root: ParentNode | null): HTMLElement[] => {
  if (!root) return []

  return [...root.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    element => !element.matches(':disabled') && !element.closest('[hidden], [inert]') && isElementVisible(element)
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

const useSafeId = (prefix: string, id?: string): string => {
  const reactId = useId().replaceAll(':', '')

  return id ?? `${prefix}-${reactId}`
}

const useControllableState = <T extends string | number | boolean | undefined>({
  defaultValue,
  onChange,
  value
}: ControllableOptions<T>): [T, Dispatch<SetStateAction<T>>, (value: T) => void] => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const pendingValueRef = useRef(defaultValue)
  const currentValue = value ?? uncontrolledValue

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    next => {
      const previousValue = value === undefined ? pendingValueRef.current : currentValue
      const resolvedValue = typeof next === 'function' ? next(previousValue) : next

      if (value === undefined) {
        pendingValueRef.current = resolvedValue

        setUncontrolledValue(resolvedValue)
      }

      onChange?.(resolvedValue)
    }, [currentValue, onChange, value]
  )

  const restoreValue = useCallback((next: T) => {
    if (value !== undefined) return

    pendingValueRef.current = next

    setUncontrolledValue(next)
  }, [value])

  return [currentValue, setValue, restoreValue]
}

const focusFirstIn = (root: ParentNode | null): void => {
  globalThis.setTimeout(() => {
    getFocusable(root)[0]?.focus()
  })
}

const focusTrigger = (trigger: HTMLElement | null): void => {
  trigger?.focus({ preventScroll: true })
}

const clampViewportPosition = (
  value: number,
  size: number,
  viewportSize: number
): number => Math.max(8, Math.min(value, viewportSize - size - 8))

const getContextMenuPosition = (
  x: number,
  y: number,
  rect: DOMRect | undefined
): { left: number, top: number } => {
  const width = rect?.width ?? 0
  const height = rect?.height ?? 0

  const viewportWidth =
    typeof window === 'undefined' ? x + width + 16 : window.innerWidth

  const viewportHeight =
    typeof window === 'undefined' ? y + height + 16 : window.innerHeight

  return {
    left: clampViewportPosition(x, width, viewportWidth),
    top: clampViewportPosition(y, height, viewportHeight)
  }
}

const isDisclosureEditableTarget = (target: EventTarget | null, panel: HTMLElement): boolean => {
  const ElementType = panel.ownerDocument.defaultView?.Element

  if (!ElementType || !(target instanceof ElementType)) return false

  if (target.closest('input, textarea')) return true

  const editable = target.closest('[contenteditable]')?.getAttribute('contenteditable')?.toLowerCase()

  return editable === '' || editable === 'true' || editable === 'plaintext-only'
}

const useOutsideClose = (
  open: boolean,
  refs: RefObject<HTMLElement | null>[],
  onClose: () => void
): void => {
  useEffect(() => {
    const owner = refs.find(ref => ref.current)?.current?.ownerDocument
    const NodeType = owner?.defaultView?.Node

    if (!open || !owner || !NodeType) return

    const pointerDown = (event: globalThis.PointerEvent): void => {
      const target = event.target

      if (target instanceof NodeType && !refs.some(ref => ref.current?.contains(target))) onClose()
    }

    owner.addEventListener('pointerdown', pointerDown)

    return () => {
      owner.removeEventListener('pointerdown', pointerDown)
    }
  }, [onClose, open, refs])
}

const useDisclosureController = (
  options: DisclosureOptions & FloatingPanelOptions,
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

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const toggle = useCallback(() => {
    setOpen(current => !current)
  }, [setOpen])

  useOutsideClose(open, [rootRef, triggerRef, panelRef], close)

  useFloatingPanel(open, triggerRef, panelRef, close, options)

  const triggerProps: LumenProps<'button'> = {
    'aria-controls': panelId,
    'aria-expanded': open,
    'aria-haspopup': hasPopup,
    'data-ui-trigger': true,
    onClick: event => {
      if (event.defaultPrevented) return

      focusTrigger(triggerRef.current)

      toggle()
    },
    onKeyDown: event => {
      if (event.defaultPrevented || event.nativeEvent.isComposing) return

      if (event.key === 'Escape' && open) {
        event.preventDefault()

        close()

        return
      }

      if (
        event.key !== 'ArrowDown' &&
        event.key !== 'Enter' &&
        event.key !== ' '
      )
        return

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
      if (event.defaultPrevented || event.nativeEvent.isComposing) return

      if (event.key === 'Escape') {
        event.preventDefault()

        close()

        focusTrigger(triggerRef.current)

        return
      }

      if (isDisclosureEditableTarget(event.target, event.currentTarget)) return

      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']

      if (!keys.includes(event.key)) return

      const items = getFocusable(panelRef.current)

      if (!items.length) return

      event.preventDefault()

      const currentIndex = items.indexOf(document.activeElement as HTMLElement)

      const nextItem =
        items[
          getLoopedIndex(
            getLumenDirectionalKey(event.currentTarget, event.key), Math.max(0, currentIndex), items.length, [
              'ArrowDown'
            ]
          )
        ]

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

const isDialogBackdropPoint = (
  dialog: HTMLDialogElement | null,
  event: { clientX: number, clientY: number, target: EventTarget | null }
): boolean => {
  if (!dialog || event.target !== dialog) return false

  const bounds = dialog.getBoundingClientRect()

  return event.clientX < bounds.left || event.clientX >= bounds.right ||
    event.clientY < bounds.top || event.clientY >= bounds.bottom
}

export const useDialog = (options: DialogOptions = {}): DialogController => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const outsidePointerRef = useRef<boolean | undefined>(undefined)

  const [open, setOpen] = useControllableState({
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onOpenChange,
    value: options.open
  })

  const consumeProgrammaticClose = useDialogLifecycle(open, dialogRef, triggerRef)

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const dialogProps: LumenProps<'dialog'> = {
    'aria-modal': true,
    'data-ui-alert-dialog': options.alert ? true : undefined,
    'data-ui-bound': true,
    'data-ui-dialog': options.alert ? undefined : true,
    onCancel: event => {
      if (event.target !== dialogRef.current || event.defaultPrevented) return

      event.preventDefault()

      event.stopPropagation()

      if (options.dismissOnEscape !== false) close()
    },
    onClick: event => {
      const startedOutside = outsidePointerRef.current

      outsidePointerRef.current = undefined

      if (event.defaultPrevented || startedOutside === false || event.detail === 0) return

      if (!(options.dismissOnOutsidePress ?? !options.alert)) return

      if (isDialogBackdropPoint(dialogRef.current, event)) close()
    },
    onClose: event => {
      if (event.target !== dialogRef.current || consumeProgrammaticClose()) return

      close()
    },
    onPointerDown: event => {
      outsidePointerRef.current = isDialogBackdropPoint(dialogRef.current, event)
    },
    ref: dialogRef,
    role: options.alert ? 'alertdialog' : 'dialog'
  }

  const triggerProps: LumenProps<'button'> = {
    'aria-haspopup': 'dialog',
    onClick: () => {
      setOpen(true)
    },
    ref: element => {
      triggerRef.current = element
    },
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

export const useDropdownMenu = (
  options: DropdownMenuOptions = {}
): DropdownMenuController => useDisclosureController(options, 'menu')

const readLanguageStorage = (storageKey: string | undefined): string | null => {
  if (!storageKey) return null

  try {
    return localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

export const useLanguageToggle = ({
  defaultValue,
  locales: localeOptions,
  onValueChange,
  storageKey,
  value: controlledValue
}: LanguageToggleOptions = {}): LanguageToggleController => {
  const locales = useMemo(
    () => normalizeLumenLocales(localeOptions),
    [localeOptions]
  )

  const defaultPair = getLumenLocalePair(locales, defaultValue)
  const [internalValue, setInternalValue] = useState(defaultPair.current.value)
  const value = controlledValue ?? internalValue
  const pair = getLumenLocalePair(locales, value)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (controlledValue !== undefined) return

    if (!initializedRef.current) {
      initializedRef.current = true

      const preferredValue = readLanguageStorage(storageKey) ??
        defaultValue ??
        document.documentElement.lang

      if (
        preferredValue &&
        preferredValue !== value &&
        locales.some(locale => locale.value === preferredValue)
      ) {
        setInternalValue(preferredValue)

        return
      }
    }

    document.documentElement.lang = value

    if (storageKey) {
      try {
        localStorage.setItem(storageKey, value)
      } catch {
        // Storage can be unavailable in privacy modes.
      }
    }
  }, [controlledValue, defaultValue, locales, storageKey, value])

  return {
    currentLocale: pair.current,
    nextLocale: pair.next,
    selectNext: () => {
      if (controlledValue === undefined) setInternalValue(pair.next.value)

      onValueChange?.(pair.next.value)
    },
    value: pair.current.value
  }
}

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

  useOutsideClose(open, [triggerRef, menuRef], close)

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
      if (
        event.key !== 'ContextMenu' &&
        !(event.shiftKey && event.key === 'F10')
      )
        return

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
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[role="menuitem"]')
      ) {
        close()
      }
    },
    onKeyDown: event => {
      if (event.defaultPrevented || event.nativeEvent.isComposing) return

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

      const activeElement =
        typeof document === 'undefined' ? null : document.activeElement

      const currentIndex =
        activeElement instanceof HTMLElement ?
          items.indexOf(activeElement) :
          -1

      items[
        getLoopedIndex(getLumenDirectionalKey(event.currentTarget, event.key), currentIndex, items.length, ['ArrowDown'])
      ]?.focus()
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
        onClick: composeHandlers(props.onClick, event => {
          activate(triggerValue)

          scrollLumenTabIntoView(event.currentTarget)
        }),
        onKeyDown: composeHandlers(props.onKeyDown, event => {
          const keys = orientation === 'vertical' ?
            ['ArrowUp', 'ArrowDown', 'Home', 'End'] :
            ['ArrowLeft', 'ArrowRight', 'Home', 'End']

          if (!keys.includes(event.key)) return

          const tabs = rootRef.current ?
            [...rootRef.current.querySelectorAll<HTMLElement>('[role="tab"]')]
              .filter(tab => tab.closest('[data-ui-tabs]') === rootRef.current &&
                !tab.matches(':disabled, [aria-disabled="true"]')) :
            []

          if (!tabs.length) return

          event.preventDefault()

          const currentIndex = tabs.indexOf(event.currentTarget)

          const nextTab =
            tabs[
              getLoopedIndex(
                event.key,
                Math.max(0, currentIndex),
                tabs.length,
                orientation === 'vertical' ? ['ArrowDown'] : [getLumenDirectionalKey(event.currentTarget, 'ArrowRight')]
              )
            ]

          const nextValue = nextTab?.dataset.value

          if (!nextTab || !nextValue) return

          activate(nextValue)

          scrollLumenTabIntoView(nextTab)

          nextTab.focus()
        }),
        role: 'tab',
        tabIndex: selected ? 0 : -1,
        type: props.type ?? 'button',
        'data-value': triggerValue
      }
    }, [activate, orientation, selectedValue, tabsId]
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

const isPrintableKey = (event: KeyboardEvent): boolean => (
  event.key.length === 1 &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey
)

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

  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const selectId = useSafeId('ui-select', id)
  const listId = `${selectId}-listbox`

  const normalizedOptions = useMemo(
    () => options.map(normalizeOption), [options]
  )

  const [open, setOpen] = useState(false)

  const [selectedValue, setSelectedValue, restoreSelectedValue] = useControllableState({
    defaultValue,
    onChange: onValueChange,
    value
  })

  const selectedOption = normalizedOptions.find(
    option => option.value === selectedValue
  )

  const triggerText =
    selectedOption?.label ?? placeholder ?? 'Select an option'

  const hasSelection = Boolean(selectedOption && selectedValue !== '')

  const close = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const openList = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  useSelectFormReset(rootRef, defaultValue, value, restoreSelectedValue, close)

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

    return [
      ...listRef.current.querySelectorAll<HTMLElement>(
        '[data-ui-select-option]'
      )
    ].filter(
      item => !item.hasAttribute('disabled') &&
        item.getAttribute('aria-disabled') !== 'true'
    )
  }, [])

  const focusOption = useCallback(
    (key: string, currentItem?: HTMLElement): void => {
      const items = getEnabledItems()

      if (!items.length) return

      const selectedItem = items.find(
        item => item.getAttribute('aria-selected') === 'true'
      )

      const current = currentItem ?? selectedItem ?? items[0]

      if (!current) return

      const currentIndex = items.indexOf(current)

      const nextItem =
        items[
          getLoopedIndex(key, Math.max(0, currentIndex), items.length, [
            'ArrowDown'
          ])
        ]

      nextItem?.focus()
    }, [getEnabledItems]
  )

  const focusTypeaheadOption = useCallback(
    (currentItem?: HTMLElement): void => {
      const items = getEnabledItems()
      const typeahead = typeaheadRef.current

      if (!items.length || !typeahead) return

      const selectedItem = items.find(
        item => item.getAttribute('aria-selected') === 'true'
      )

      const current = currentItem ?? selectedItem ?? items[0]

      if (!current) return

      const currentIndex = items.indexOf(current)
      const startIndex = Math.max(0, currentIndex + 1)

      const orderedItems = [
        ...items.slice(startIndex),
        ...items.slice(0, startIndex)
      ]

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

      const native = rootRef.current?.querySelector<HTMLSelectElement>('[data-ui-select-native]')

      if (native) {
        native.value = nextValue

        native.dispatchEvent(new Event('change', { bubbles: true }))
      } else setSelectedValue(nextValue)

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
      if (event.defaultPrevented || event.nativeEvent.isComposing) return

      if (handleTypeahead(event)) return

      if (event.key === 'Escape' && open) {
        event.preventDefault()

        close()

        return
      }

      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ']

      if (!keys.includes(event.key)) return

      event.preventDefault()

      openList()

      if (event.key === 'Enter' || event.key === ' ') {
        const selectedItem = getEnabledItems().find(
          item => item.getAttribute('aria-selected') === 'true'
        )

        const firstItem = getEnabledItems()[0];

        (selectedItem ?? firstItem)?.focus()

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
        if (event.defaultPrevented || event.nativeEvent.isComposing) return

        if (handleTypeahead(event, event.currentTarget)) return

        if (event.key === 'Escape' && open) {
          event.preventDefault()

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
    }), [close, focusOption, handleTypeahead, open, selectOption, selectedValue]
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

const fieldDescriptionSelector =
  '[data-ui-field-hint], [data-ui-field-error], .ui-field__hint, .ui-field__error'

const fieldErrorSelector = '[data-ui-field-error], .ui-field__error'

const formControlSelector = [
  'input:not([type="hidden"])',
  'select',
  'textarea'
].join(',')

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

const isNativeFormControl = (
  element: EventTarget | null
): element is NativeFormControl => element instanceof HTMLInputElement ||
  element instanceof HTMLSelectElement ||
  element instanceof HTMLTextAreaElement

const getFieldRoot = (control: HTMLElement): HTMLElement | null => control.closest<HTMLElement>('.ui-field, [data-ui-field]')

const getValidationMessage = (
  control: NativeFormControl,
  field: HTMLElement | null
): string => {
  for (const [validityKey, attributeName] of validityMessageAttributes) {
    if (!control.validity[validityKey]) continue

    return (
      control.getAttribute(attributeName) ??
      field?.getAttribute(attributeName) ??
      control.validationMessage
    )
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

  const existingIds =
    control.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []

  const configuredIds =
    field.dataset.uiFieldDescribedby?.trim().split(/\s+/) ?? []

  const descriptionIds = [
    ...field.querySelectorAll<HTMLElement>(fieldDescriptionSelector)
  ].map(element => getFieldDescriptionId(element))

  const describedBy = [
    ...new Set(
      [...existingIds, ...configuredIds, ...descriptionIds].filter(Boolean)
    )
  ]

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

  const setFieldValidity = useCallback<
    FormValidationController['setFieldValidity']
  >((control, invalid, message = '') => {
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

    for (const error of field.querySelectorAll<HTMLElement>(
      fieldErrorSelector
    )) {
      error.dataset.uiValidationErrorBound = 'true'

      error.hidden = !invalid

      error.textContent = invalid ? message : ''
    }
  }, [])

  const getControls = useCallback<FormValidationController['getControls']>(
    (form = formRef.current) => {
      if (!form) return []

      return [
        ...form.querySelectorAll<NativeFormControl>(formControlSelector)
      ].filter(control => control.form === form && !control.disabled)
    }, []
  )

  const validateControl = useCallback<
    FormValidationController['validateControl']
  >(
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

      const message = invalid ?
        getValidationMessage(control, getFieldRoot(control)) :
        ''

      setFieldValidity(control, invalid, message)

      return !invalid
    }, [onValidate, setFieldValidity]
  )

  const validateForm = useCallback<FormValidationController['validateForm']>(
    (form = formRef.current) => {
      if (!form) return []

      return getControls(form).filter(
        control => !validateControl(control, form)
      )
    }, [getControls, validateControl]
  )

  const emitState = useCallback(
    (
      name: 'ui:invalid' | 'ui:valid',
      detail: FormValidationStateDetail
    ): void => {
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
    for (const field of form.querySelectorAll<HTMLElement>(
      '.ui-field, [data-ui-field]'
    )) {
      syncFieldDescription(field)
    }
  }, [])

  const formProps: LumenProps<'form'> = {
    'data-ui-form': true,
    noValidate: true,
    onBlur: event => {
      const form = event.currentTarget

      syncFields(form)

      if (!isNativeFormControl(event.target) || event.target.form !== form)
        return

      const valid = validateControl(event.target, form)

      emitState(
        valid ? 'ui:valid' : 'ui:invalid', valid ?
          { control: event.target, form } :
          { control: event.target, controls: [event.target], form }
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

        emitState('ui:invalid', {
          control: firstInvalid,
          controls: invalidControls,
          form
        })

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

/* eslint-disable complexity -- Calendar mirrors Astro's UTC date grid and keyboard runtime. */
const calendarMonthPattern = /^\d{4}-\d{2}$/

const parseCalendarMonth = (value: string | null | undefined): Date | null => {
  if (!value || !calendarMonthPattern.test(value)) return null

  return parseCalendarDate(`${value}-01`)
}

const createCalendarDate = (year: number, month: number, day: number): Date => {
  const date = new Date(0)

  date.setUTCFullYear(year, month, day)

  return date
}

const formatCalendarDate = (date: Date): string => date.toISOString().split('T')[0] ?? ''
const formatCalendarMonth = (date: Date): string => formatCalendarDate(date).slice(0, -3)
const startOfCalendarMonth = (date: Date): Date => createCalendarDate(date.getUTCFullYear(), date.getUTCMonth(), 1)

const addCalendarDays = (date: Date, days: number): Date => createCalendarDate(
  date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days
)

const getCalendarDaysInMonth = (date: Date): number => createCalendarDate(
  date.getUTCFullYear(), date.getUTCMonth() + 1, 0
).getUTCDate()

const addCalendarMonths = (date: Date, months: number): Date => {
  const targetMonth = createCalendarDate(
    date.getUTCFullYear(), date.getUTCMonth() + months, 1
  )

  const day = Math.min(
    date.getUTCDate(), getCalendarDaysInMonth(targetMonth)
  )

  return createCalendarDate(
    targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), day
  )
}

const getCalendarToday = (): Date => {
  const today = new Date()

  return createCalendarDate(
    today.getFullYear(), today.getMonth(), today.getDate()
  )
}

const compareCalendarDates = (date: Date, other: Date | null): number => {
  if (!other) return 0

  return Math.sign(date.getTime() - other.getTime())
}

const isCalendarDateDisabled = (
  disabled: boolean,
  date: Date,
  min: Date | null,
  max: Date | null
): boolean => disabled ||
  compareCalendarDates(date, min) < 0 ||
  compareCalendarDates(date, max) > 0

const clampCalendarDate = (
  date: Date,
  min: Date | null,
  max: Date | null
): Date => {
  if (min && compareCalendarDates(date, min) < 0) return min

  if (max && compareCalendarDates(date, max) > 0) return max

  return date
}

const getCalendarGridStart = (month: Date): Date => addCalendarDays(month, -((month.getUTCDay() + 6) % 7))

const coerceCalendarDate = (value: string | Date): Date | null => (
  value instanceof Date ? value : parseCalendarDate(value)
)

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

const formatSelectedCalendarDate = (value: Date | null): string => value ? formatCalendarDate(value) : ''

export const useCalendar = ({
  defaultValue,
  disabled: requestedDisabled = false,
  labels,
  locale,
  max,
  min,
  month,
  name,
  onValueChange,
  readOnly = false,
  value: controlledValue
}: CalendarOptions = {}): CalendarController => {
  const disabled = requestedDisabled || !isCalendarBoundsValid(min, max)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const generatedId = useId()
  const calendarId = `ui-calendar-${generatedId}`
  const labelId = `${calendarId}-label`
  const minDate = parseCalendarDate(min ?? '0001-01-01')
  const maxDate = parseCalendarDate(max ?? '9999-12-31')
  const defaultDate = parseCalendarDate(defaultValue)
  const controlledDate = parseCalendarDate(controlledValue)
  const [uncontrolledValue, setUncontrolledValue] = useState(() => defaultDate ? formatCalendarDate(defaultDate) : '')

  const selectedValue =
    controlledValue === undefined ?
      uncontrolledValue :
      formatSelectedCalendarDate(controlledDate)

  const selectedDate = parseCalendarDate(selectedValue)

  const initialMonth =
    parseCalendarMonth(month) ??
    (selectedDate ? startOfCalendarMonth(selectedDate) : null) ??
    startOfCalendarMonth(getCalendarToday())

  const [visibleMonthValue, setVisibleMonthValue] = useState(() => formatCalendarMonth(initialMonth))

  const visibleMonth =
    parseCalendarMonth(month ?? visibleMonthValue) ?? initialMonth

  const [focusValue, setFocusValue] = useState<string | null>(null)

  useEffect(() => {
    const root = rootRef.current
    const owner = root?.closest('form')
    let active = true
    let resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined

    const reset = (event: Event) => {
      globalThis.clearTimeout(resetTimer)

      resetTimer = globalThis.setTimeout(() => {
        if (!active || event.defaultPrevented || !root?.isConnected) return

        const date = parseCalendarDate(defaultValue)

        if (controlledValue === undefined) setUncontrolledValue(date ? formatCalendarDate(date) : '')

        const resetMonth = parseCalendarMonth(month) ?? startOfCalendarMonth(date ?? getCalendarToday())

        setVisibleMonthValue(formatCalendarMonth(resetMonth))

        setFocusValue(null)
      })
    }

    owner?.addEventListener('reset', reset)

    return () => {
      active = false

      globalThis.clearTimeout(resetTimer)

      owner?.removeEventListener('reset', reset)
    }
  }, [controlledValue, defaultValue, month])

  const focusDate = getCalendarFocusDate(
    disabled, visibleMonth, minDate, maxDate, selectedDate, parseCalendarDate(focusValue)
  )

  const focusIso = formatCalendarDate(focusDate)

  useEffect(() => {
    const root = rootRef.current

    if (root?.contains(root.ownerDocument.activeElement) &&
      root.ownerDocument.activeElement?.getAttribute('role') === 'gridcell') {
      root.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus({ preventScroll: true })
    }
  }, [focusIso])

  const selectedIso = selectedDate ? formatCalendarDate(selectedDate) : ''
  const currentLocale = getCalendarLocale(locale || 'en')
  const navigationLabels = { ...resolveDateControlLabels(currentLocale), ...labels }

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
    () => Array.from(
      { length: 7 }, (_, index) => weekdayFormatter.format(new Date(Date.UTC(2026, 0, 5 + index)))
    ), [weekdayFormatter]
  )

  const weeks = useMemo(() => {
    const firstCell = getCalendarGridStart(visibleMonth)

    return Array.from({ length: 6 }, (_, rowIndex) => Array.from({ length: 7 }, (_, columnIndex): CalendarDay => {
      const date = addCalendarDays(firstCell, rowIndex * 7 + columnIndex)
      const dateIso = formatCalendarDate(date)

      const unavailable = isCalendarDateDisabled(
        disabled, date, minDate, maxDate
      )

      return {
        date: dateIso,
        day: date.getUTCDate(),
        disabled: unavailable,
        label: dayFormatter.format(date),
        outside:
            formatCalendarMonth(date) !== formatCalendarMonth(visibleMonth),
        selected: selectedIso === dateIso,
        tabIndex: !unavailable && focusIso === dateIso ? 0 : -1,
        today: todayIso === dateIso
      }
    }))
  }, [
    dayFormatter,
    disabled,
    focusIso,
    maxDate,
    minDate,
    selectedIso,
    todayIso,
    visibleMonth
  ])

  const focusCalendarDate: CalendarController['focusDate'] = dateInput => {
    const date = coerceCalendarDate(dateInput)

    if (!date) return

    const nextDate = clampCalendarDate(date, minDate, maxDate)

    setVisibleMonthValue(formatCalendarMonth(startOfCalendarMonth(nextDate)))

    setFocusValue(formatCalendarDate(nextDate))
  }

  const selectDate: CalendarController['selectDate'] = dateInput => {
    if (disabled || readOnly) return

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
      focusCalendarDate(
        addCalendarMonths(currentDate, key === 'PageDown' ? 1 : -1)
      )

      return
    }

    const directionRoot = rootRef.current
    const offset = keyOffsets[directionRoot ? getLumenDirectionalKey(directionRoot, key) : key]

    if (offset !== undefined) {
      focusCalendarDate(addCalendarDays(currentDate, offset))
    }
  }

  const previousMonthLastDay = addCalendarDays(visibleMonth, -1)
  const nextMonthFirstDay = addCalendarMonths(visibleMonth, 1)

  const previousDisabled =
    disabled || compareCalendarDates(previousMonthLastDay, minDate) < 0

  const nextDisabled =
    disabled || compareCalendarDates(nextMonthFirstDay, maxDate) > 0

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
      'aria-readonly': readOnly || undefined,
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
      'aria-label': navigationLabels.nextMonth,
      className: 'ui-calendar__nav',
      'data-ui-calendar-next': true,
      disabled: nextDisabled,
      onClick: () => {
        if (nextDisabled) return

        const nextMonth = startOfCalendarMonth(
          addCalendarMonths(visibleMonth, 1)
        )

        setVisibleMonthValue(formatCalendarMonth(nextMonth))

        setFocusValue(
          formatCalendarDate(
            getCalendarFocusDate(
              disabled, nextMonth, minDate, maxDate, selectedDate
            )
          )
        )
      },
      type: 'button'
    },
    previousProps: {
      'aria-label': navigationLabels.previousMonth,
      className: 'ui-calendar__nav',
      'data-ui-calendar-prev': true,
      disabled: previousDisabled,
      onClick: () => {
        if (previousDisabled) return

        const previousMonth = startOfCalendarMonth(
          addCalendarMonths(visibleMonth, -1)
        )

        setVisibleMonthValue(formatCalendarMonth(previousMonth))

        setFocusValue(
          formatCalendarDate(
            getCalendarFocusDate(
              disabled, previousMonth, minDate, maxDate, selectedDate
            )
          )
        )
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
/* eslint-enable complexity */

const defaultInputOtpLength = 6
const defaultInputOtpPattern = '[0-9]*'
const coerceInputOtpLength = (length: number | undefined): number => Number(length) || defaultInputOtpLength
const clampInputOtpLength = (length: number): number => Math.max(1, Math.floor(length))

const normalizeInputOtpLength = (length: number | undefined): number => (
  clampInputOtpLength(coerceInputOtpLength(length))
)

const isNumericInputOtp = (inputMode: InputMode, pattern: string): boolean => (
  inputMode === 'numeric' || pattern === defaultInputOtpPattern
)

const sanitizeInputOtpValue = (
  value: string,
  length: number,
  inputMode: InputMode,
  pattern: string
): string => {
  const normalized = isNumericInputOtp(inputMode, pattern) ?
    value.replaceAll(/\D/g, '') :
    value.replaceAll(/\s/g, '')

  return normalized.slice(0, length)
}

const getInputOtpActiveIndex = (
  length: number,
  value: string,
  selectionStart: number | null
): number => Math.min(length - 1, Math.max(0, selectionStart ?? value.length))

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

  const value = sanitizeInputOtpValue(
    controlledValue ?? uncontrolledValue, length, inputMode, pattern
  )

  const segmentIndexes = useMemo(
    () => Array.from({ length }, (_, index) => index), [length]
  )

  const syncValue = useCallback<InputOTPController['syncValue']>(
    (input = inputRef.current) => {
      if (!input) return value

      const nextValue = sanitizeInputOtpValue(
        input.value, length, inputMode, pattern
      )

      if (input.value !== nextValue) {
        input.value = nextValue
      }

      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue)
      }

      setActiveIndex(
        getInputOtpActiveIndex(length, nextValue, input.selectionStart)
      )

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
      const sanitizedValue = sanitizeInputOtpValue(
        nextValue, length, inputMode, pattern
      )

      const input = inputRef.current

      if (controlledValue === undefined) {
        setUncontrolledValue(sanitizedValue)
      }

      if (input) {
        input.value = sanitizedValue

        input.setSelectionRange(sanitizedValue.length, sanitizedValue.length)
      }

      setActiveIndex(
        getInputOtpActiveIndex(length, sanitizedValue, sanitizedValue.length)
      )

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
      className: composeClassName(
        'ui-input-otp ui-input-otp__native', props.className
      ),
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

          setSelection(
            (event.currentTarget.selectionStart ??
              event.currentTarget.value.length) - 1
          )

          return
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault()

          setSelection(
            (event.currentTarget.selectionStart ??
              event.currentTarget.value.length) + 1
          )

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

  const getSegmentChar = useCallback<InputOTPController['getSegmentChar']>(
    index => value[index] ?? '\u00a0', [value]
  )

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

const getDateRangeRoot = (
  control: HTMLInputElement,
  fallback: HTMLElement | null
): HTMLElement | null => control.closest<HTMLElement>('[data-ui-date-range-picker]') ?? fallback

const getDateRangeInputs = (
  root: HTMLElement | null,
  start: HTMLInputElement | null,
  end: HTMLInputElement | null
): [HTMLInputElement | null, HTMLInputElement | null] => {
  if (start && end && start !== end) return [start, end]

  const inputs = root ?
    [...root.querySelectorAll<HTMLInputElement>('input[type="date"]')] :
    []

  return [start ?? inputs[0] ?? null, end ?? inputs.at(-1) ?? null]
}

const syncDateInputConstraint = (
  input: HTMLInputElement,
  property: 'max' | 'min',
  value: string
): void => {
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

export const useDateRangePicker = ({
  onRangeChange
}: DateRangePickerOptions = {}): DateRangePickerController => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const startRef = useRef<HTMLInputElement | null>(null)
  const endRef = useRef<HTMLInputElement | null>(null)

  const syncRange = useCallback<DateRangePickerController['syncRange']>(
    (root = rootRef.current) => {
      const [start, end] = getDateRangeInputs(
        root, startRef.current, endRef.current
      )

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

const getScheduleRoot = (
  element: HTMLElement,
  fallback: HTMLElement | null
): HTMLElement | null => element.closest<HTMLElement>('[data-ui-schedule]') ?? fallback

export const useSchedule = ({
  onChange
}: ScheduleOptions = {}): ScheduleController => {
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
        const transferValue =
          eventId ||
          event.currentTarget.id ||
          event.currentTarget.textContent.trim()

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

        const dragged =
          typeof document !== 'undefined' && draggedId ?
            document.getElementById(draggedId) :
            null

        if (
          typeof HTMLElement !== 'undefined' &&
          dragged instanceof HTMLElement
        ) {
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

const getKanbanRoot = (
  element: HTMLElement,
  fallback: HTMLElement | null
): HTMLElement | null => element.closest<HTMLElement>('[data-ui-kanban]') ?? fallback

const getKanbanItem = (root: HTMLElement | null, itemId: string): HTMLElement | null => [...(root?.querySelectorAll<HTMLElement>('[data-ui-kanban-item]') ?? [])]
  .find(item => item.dataset.uiKanbanItem === itemId) ?? null

const getKanbanColumnValues = (root: HTMLElement | null): string[] => [...(root?.querySelectorAll<HTMLElement>('[data-ui-kanban-column]') ?? [])]
  .map(column => column.dataset.uiKanbanColumn ?? '')
  .filter(Boolean)

interface KanbanPointerState {
  active: boolean
  itemId: string
  pointerId: number
  startX: number
  startY: number
}

const isKanbanArrowKey = (key: string): key is 'ArrowLeft' | 'ArrowRight' => ['ArrowLeft', 'ArrowRight'].includes(key)

const clearKanbanInteractionState = (root: HTMLElement | null, item: HTMLElement | null): void => {
  if (item?.dataset.state === 'dragging') delete item.dataset.state

  for (const column of root?.querySelectorAll<HTMLElement>('[data-ui-kanban-column]') ?? [])
    delete column.dataset.state
}

const setKanbanDropTarget = (
  root: HTMLElement | null,
  target: HTMLElement | null | undefined
): void => {
  for (const column of root?.querySelectorAll<HTMLElement>('[data-ui-kanban-column]') ?? []) {
    if (column === target) column.dataset.state = 'drop-target'
    else delete column.dataset.state
  }
}

const getKanbanColumnAtPoint = (
  root: HTMLElement | null,
  clientX: number,
  clientY: number
): HTMLElement | null => {
  if (!root) return null

  const column = document.elementFromPoint(clientX, clientY)
    ?.closest<HTMLElement>('[data-ui-kanban-column]') ?? null

  return column?.closest<HTMLElement>('[data-ui-kanban]') === root ? column : null
}

const requestKeyboardKanbanMove = (
  event: KeyboardEvent<HTMLButtonElement>,
  itemId: string,
  root: HTMLElement | null,
  requestMove: KanbanController['requestMove']
): void => {
  if (!isKanbanArrowKey(event.key)) return

  if (!root) return

  const item = getKanbanItem(root, itemId)

  if (!item) return

  if (item.getAttribute('aria-busy') === 'true') return

  const fromColumn = item.closest<HTMLElement>('[data-ui-kanban-column]')
    ?.dataset.uiKanbanColumn

  if (!fromColumn) return

  const columns = getKanbanColumnValues(root)
  const currentIndex = columns.indexOf(fromColumn)
  const visualDirection = event.key === 'ArrowRight' ? 1 : -1

  const direction = getComputedStyle(root).direction === 'rtl' ?
    -visualDirection :
    visualDirection

  const toColumn = columns[currentIndex + direction]

  if (!toColumn) return

  event.preventDefault()

  requestMove({ fromColumn, input: 'keyboard', itemId, toColumn })
}

const updateKanbanPointer = (
  event: PointerEvent<HTMLButtonElement>,
  pointer: KanbanPointerState | null,
  root: HTMLElement | null
): void => {
  if (pointer?.pointerId !== event.pointerId) return

  const distance = Math.hypot(
    event.clientX - pointer.startX,
    event.clientY - pointer.startY
  )

  if (distance < 8) {
    if (!pointer.active) return
  }

  pointer.active = true

  event.currentTarget.setPointerCapture(event.pointerId)

  const item = getKanbanItem(root, pointer.itemId)
  const target = getKanbanColumnAtPoint(root, event.clientX, event.clientY)

  if (item) item.dataset.state = 'dragging'

  setKanbanDropTarget(root, target)
}

const finishKanbanPointer = (
  event: PointerEvent<HTMLButtonElement>,
  pointer: KanbanPointerState | null,
  root: HTMLElement | null,
  requestMove: KanbanController['requestMove']
): void => {
  if (pointer?.pointerId !== event.pointerId) return

  if (!pointer.active) return

  const item = getKanbanItem(root, pointer.itemId)

  const fromColumn = item?.closest<HTMLElement>('[data-ui-kanban-column]')
    ?.dataset.uiKanbanColumn

  const toColumn = getKanbanColumnAtPoint(root, event.clientX, event.clientY)
    ?.dataset.uiKanbanColumn

  clearKanbanInteractionState(root, item)

  if (fromColumn && toColumn)
    requestMove({ fromColumn, input: 'pointer', itemId: pointer.itemId, toColumn })
}

export const useKanban = ({
  onMoveRequest
}: KanbanOptions = {}): KanbanController => {
  const rootRef = useRef<HTMLElement | null>(null)
  const pointerRef = useRef<KanbanPointerState | null>(null)

  const requestMove = useCallback<KanbanController['requestMove']>(detail => {
    const normalized = createLumenKanbanMoveDetail(detail)

    if (!normalized) return false

    const accepted = rootRef.current && typeof CustomEvent !== 'undefined' ?
      rootRef.current.dispatchEvent(
        new CustomEvent('ui:kanban-move-request', {
          bubbles: true,
          cancelable: true,
          detail: normalized
        })
      ) :
      true

    if (accepted) onMoveRequest?.(normalized)

    return accepted
  }, [onMoveRequest])

  const getItemProps = useCallback<KanbanController['getItemProps']>(
    (itemId, props = {}) => ({
      ...props,
      'data-ui-kanban-item': itemId,
      id: props.id ?? itemId
    }), []
  )

  const getHandleProps = useCallback<KanbanController['getHandleProps']>(
    (itemId, props = {}) => ({
      ...props,
      'aria-keyshortcuts': props['aria-keyshortcuts'] ?? 'ArrowLeft ArrowRight',
      'data-ui-kanban-handle': itemId,
      draggable: props.draggable ?? true,
      onDragEnd: composeHandlers(props.onDragEnd, event => {
        const root = getKanbanRoot(event.currentTarget, rootRef.current)
        const item = getKanbanItem(root, itemId)

        if (item?.dataset.state === 'dragging') delete item.dataset.state
      }),
      onDragStart: composeHandlers(props.onDragStart, event => {
        const root = getKanbanRoot(event.currentTarget, rootRef.current)
        const item = getKanbanItem(root, itemId)

        if (!item || item.getAttribute('aria-busy') === 'true') {
          event.preventDefault()

          return
        }

        event.dataTransfer.setData('text/plain', itemId)

        event.dataTransfer.effectAllowed = 'move'

        item.dataset.state = 'dragging'
      }),
      onKeyDown: composeHandlers(props.onKeyDown, event => {
        const root = getKanbanRoot(event.currentTarget, rootRef.current)

        requestKeyboardKanbanMove(event, itemId, root, requestMove)
      }),
      onPointerDown: composeHandlers(props.onPointerDown, (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType === 'mouse') return

        pointerRef.current = {
          active: false,
          itemId,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY
        }
      }),
      onPointerMove: composeHandlers(props.onPointerMove, (event: PointerEvent<HTMLButtonElement>) => {
        const root = getKanbanRoot(event.currentTarget, rootRef.current)

        updateKanbanPointer(event, pointerRef.current, root)
      }),
      onPointerCancel: composeHandlers(props.onPointerCancel, (event: PointerEvent<HTMLButtonElement>) => {
        const pointer = pointerRef.current

        if (pointer?.pointerId !== event.pointerId) return

        pointerRef.current = null

        const root = getKanbanRoot(event.currentTarget, rootRef.current)
        const item = getKanbanItem(root, pointer.itemId)

        clearKanbanInteractionState(root, item)
      }),
      onPointerUp: composeHandlers(props.onPointerUp, (event: PointerEvent<HTMLButtonElement>) => {
        const pointer = pointerRef.current

        pointerRef.current = null

        const root = getKanbanRoot(event.currentTarget, rootRef.current)

        finishKanbanPointer(event, pointer, root, requestMove)
      }),
      type: props.type ?? 'button'
    }), [requestMove]
  )

  const getColumnProps = useCallback<KanbanController['getColumnProps']>(
    (column, props = {}) => ({
      ...props,
      'data-ui-kanban-column': column,
      onDragLeave: composeHandlers(props.onDragLeave, event => {
        delete event.currentTarget.dataset.state
      }),
      onDragOver: composeHandlers(props.onDragOver, event => {
        event.preventDefault()

        event.dataTransfer.dropEffect = 'move'

        event.currentTarget.dataset.state = 'drop-target'
      }),
      onDrop: composeHandlers(props.onDrop, event => {
        event.preventDefault()

        delete event.currentTarget.dataset.state

        const itemId = event.dataTransfer.getData('text/plain')
        const root = getKanbanRoot(event.currentTarget, rootRef.current)
        const item = getKanbanItem(root, itemId)

        const fromColumn = item?.closest<HTMLElement>('[data-ui-kanban-column]')
          ?.dataset.uiKanbanColumn

        if (item?.dataset.state === 'dragging') delete item.dataset.state

        if (fromColumn)
          requestMove({ fromColumn, input: 'pointer', itemId, toColumn: column })
      })
    }), [requestMove]
  )

  return {
    getColumnProps,
    getHandleProps,
    getItemProps,
    requestMove,
    rootProps: {
      'aria-orientation': 'horizontal',
      'data-ui-kanban': true,
      ref: rootRef,
      tabIndex: 0
    },
    rootRef
  }
}

/* eslint-disable @eslint-react/set-state-in-effect */
/* eslint-disable complexity */
/* Resizable mirrors Astro's compact pane sizing runtime. */
const parseResizableNumberList = (
  value: number | number[] | undefined,
  count: number,
  fallback: number
): number[] => {
  const values = typeof value === 'number' ? [value] : (value ?? [])

  return Array.from(
    { length: count }, (_, index) => values[index] ?? values[0] ?? fallback
  )
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

const serializeResizableSize = (
  value: number | number[] | undefined
): string | undefined => {
  if (value === undefined) return undefined

  return Array.isArray(value) ? value.join(',') : String(value)
}

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

  const minSizes = useMemo(
    () => parseResizableNumberList(minSize, panelCount, 12), [minSize, panelCount]
  )

  const maxSizes = useMemo(
    () => parseResizableNumberList(maxSize, panelCount, 88), [maxSize, panelCount]
  )

  const initialSizes = useMemo(
    () => normalizeResizableSizes(
      parseResizableNumberList(
        defaultSizes, panelCount, 100 / Math.max(1, panelCount)
      ), panelCount
    ), [defaultSizes, panelCount]
  )

  const [sizes, setSizes] = useState(initialSizes)
  const axis = direction === 'horizontal' ? 'clientX' : 'clientY'
  const sizeProperty = direction === 'horizontal' ? 'width' : 'height'

  const separatorOrientation =
    direction === 'horizontal' ? 'vertical' : 'horizontal'

  const panelIndexes = useMemo(
    () => Array.from({ length: panelCount }, (_, index) => index), [panelCount]
  )

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

        const min = Math.max(
          minSizes[index] ?? 0, total - (maxSizes[nextIndex] ?? 100)
        )

        const max = Math.min(
          maxSizes[index] ?? 100, total - (minSizes[nextIndex] ?? 0)
        )

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
          direction === 'horizontal' ?
            { ArrowLeft: -step, ArrowRight: step } :
            { ArrowDown: step, ArrowUp: -step }

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

        const delta = keyDeltas[getLumenDirectionalKey(event.currentTarget, event.key)]

        if (delta === undefined) return

        event.preventDefault()

        resizePair(index, (sizes[index] ?? 0) + delta)
      }),
      onPointerDown: composeHandlers(props.onPointerDown, event => {
        if (event.button !== 0) return

        event.preventDefault()

        dragRef.current = {
          containerSize: Math.max(
            1, rootRef.current?.getBoundingClientRect()[sizeProperty] ?? 1
          ),
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

        if (
          drag?.index !== index ||
          event.currentTarget.dataset.active !== 'true'
        )
          return

        const delta =
          ((event[axis] - drag.startPosition) / drag.containerSize) * 100

        const multiplier = direction === 'horizontal' && getLumenDirectionalKey(event.currentTarget, 'ArrowRight') === 'ArrowLeft' ? -1 : 1

        resizePair(index, drag.startSize + delta * multiplier)
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
      className: composeClassName(
        'ui-resizable', direction === 'vertical' && 'ui-resizable--vertical'
      ),
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
/* eslint-enable @eslint-react/set-state-in-effect, complexity */

export const useThemeBuilder = ({
  radiusScale,
  spacingScale,
  borderWidth,
  preset,
  defaultPreset,
  onPresetChange,
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
  const [currentPreset, setPreset] = useControllableState<LumenThemePreset | undefined>({
    defaultValue: defaultPreset, onChange: onPresetChange, value: preset
  })

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
      radiusScale: radiusScale ?? null,
      spacingScale: spacingScale ?? null,
      borderWidth: borderWidth ?? null,
      preset: currentPreset ?? null,
      accentHue: currentAccentHue,
      hue: currentHue,
      mode: currentMode,
      primaryColor: currentPrimaryColor,
      scheme: currentScheme,
      secondaryColor: currentSecondaryColor
    }), [
      radiusScale,
      spacingScale,
      borderWidth,
      currentPreset,
      currentAccentHue,
      currentHue,
      currentMode,
      currentPrimaryColor,
      currentScheme,
      currentSecondaryColor
    ]
  )

  const exportValue = useMemo(
    () => exportThemeBuilderValue(
      result.tokens, result.scheme, currentExportFormat
    ), [currentExportFormat, result.scheme, result.tokens]
  )

  const previewStyle = useMemo(
    () => Object.fromEntries(
      Object.entries(result.tokens).map(([token, value]) => [
        `--${token}`,
        value
      ])
    ) as CSSProperties, [result.tokens]
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

  const getPresetProps = useCallback<ThemeBuilderController['getPresetProps']>(
    (nextPreset, props = {}) => ({
      ...props,
      'aria-pressed': currentPreset === nextPreset,
      'data-ui-theme-preset': nextPreset,
      onClick: composeHandlers(props.onClick, () => {
        setPreset(nextPreset)
      }),
      type: props.type ?? 'button'
    }), [currentPreset, setPreset]
  )

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

  const getExportFormatProps = useCallback<
    ThemeBuilderController['getExportFormatProps']
  >(
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
    setPreset,
    getPresetProps,
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
    clearTimeout(timerRef.current)

    setIsOpen(false)
  }, [setIsOpen])

  const scheduleOpen = useCallback(
    (nextDelay: number) => {
      clearTimeout(timerRef.current)

      timerRef.current = setTimeout(() => {
        setIsOpen(true)
      }, nextDelay)
    }, [setIsOpen]
  )

  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
    }, []
  )

  return {
    close,
    open: isOpen,
    rootProps: {
      'aria-describedby': isOpen ? tooltipId : undefined,
      'data-ui-tooltip': true,
      onBlur: event => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      },
      onFocus: () => {
        scheduleOpen(0)
      },
      onKeyDown: event => {
        if (event.defaultPrevented || event.nativeEvent.isComposing) return

        if (event.key === 'Escape' && isOpen) {
          event.preventDefault()

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

export const useThemeToggle = (defaultTheme = 'light') => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') ??
        (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
      )
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

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const isTouchDevice = window.matchMedia(
      '(hover: none) and (pointer: coarse)'
    ).matches

    if (prefersReducedMotion || isTouchDevice || !event) {
      setTheme(newTheme)

      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.round(rect.left + rect.width / 2)
    const y = Math.round(rect.top + rect.height / 2)

    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)
    )

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
        overlay.style.transition =
          'clip-path 580ms cubic-bezier(0.4, 0, 0.2, 1)'

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

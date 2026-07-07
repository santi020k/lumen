import {
  coerceThemeBuilderExportFormat,
  coerceThemeBuilderMode,
  coerceThemeBuilderScheme,
  composeClassName,
  createThemeBuilderTokens,
  exportThemeBuilderValue,
  getVirtualRange,
  type LumenComponentName,
  lumenComponentNames,
  type LumenThemeBuilderExportFormat,
  type LumenThemeBuilderScheme,
  type LumenThemeTokens,
  normalizeThemeBuilderHex} from '@santi020k/lumen-core'

type AttributeClassMap = Record<string, Record<string, string>>

type ToastPlacement =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right'

type ToastVariant = string

type DataTableSortDirection = 'ascending' | 'descending' | 'none'

type NativeFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

export interface ToastAction {
  event?: string
  label?: string
  onClick?: (event: MouseEvent, toast: HTMLElement) => void
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

export interface ToastApi {
  create: (detail: ToastDetail) => string
  dismiss: (id?: string) => void
  update: (id: string, detail: ToastDetail) => void
}

interface LumenElementConfig {
  attributeClasses?: AttributeClassMap
  baseClassName: string
  defaults?: Record<string, string>
  role?: string
  tagName: string
}

const registry = new Set<string>()
const appliedClassNames = new WeakMap<HTMLElement, string[]>()

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

// cspell:ignore spinbutton
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

const formControlSelector = [
  'input:not([type="hidden"])',
  'select',
  'textarea'
].join(',')

const selectOptionSelector = '[data-ui-select-option]'
const defaultToastDuration = 5000
const defaultToastMax = 5
const toastCloseDelay = 240

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

const toastTimers = new WeakMap<HTMLElement, {
  cleanup: (() => void) | undefined
  remaining: number
  startedAt: number
  timer: ReturnType<typeof globalThis.setTimeout> | undefined
}>()

const mergeClassNames = (...classNames: (boolean | string | null | undefined)[]) =>
  composeClassName(...classNames).split(/\s+/).filter(Boolean)

const glassAttributeClasses = (className: string) => ({
  glass: {
    strong: `${className} ui-glass-strong`,
    subtle: `${className} ui-glass-subtle`,
    true: className
  },
  surface: { glass: className }
})

const elementConfigs = {
  Accordion: { baseClassName: 'ui-accordion', tagName: 'lumen-accordion' },
  Alert: {
    attributeClasses: {
      glass: { strong: 'ui-alert--glass ui-glass-strong', subtle: 'ui-alert--glass ui-glass-subtle', true: 'ui-alert--glass' },
      variant: {
        destructive: 'ui-alert--destructive',
        success: 'ui-alert--success',
        warning: 'ui-alert--warning'
      }
    },
    baseClassName: 'ui-alert',
    defaults: { variant: 'default' },
    tagName: 'lumen-alert'
  },
  AlertDialog: {
    attributeClasses: {
      glass: { strong: 'ui-dialog--glass ui-glass-strong', subtle: 'ui-dialog--glass ui-glass-subtle', true: 'ui-dialog--glass' },
      surface: { glass: 'ui-dialog--glass' }
    },
    baseClassName: 'ui-dialog ui-alert-dialog',
    defaults: { 'data-ui-alert-dialog': '', surface: 'default' },
    tagName: 'lumen-alert-dialog'
  },
  Agenda: { attributeClasses: glassAttributeClasses('ui-agenda--glass'), baseClassName: 'ui-agenda', tagName: 'lumen-agenda' },
  AspectRatio: { baseClassName: 'ui-aspect-ratio', tagName: 'lumen-aspect-ratio' },
  Attachment: { attributeClasses: glassAttributeClasses('ui-attachment--glass'), baseClassName: 'ui-attachment', tagName: 'lumen-attachment' },
  Autocomplete: { baseClassName: 'ui-input ui-autocomplete', defaults: { role: 'combobox', type: 'search' }, tagName: 'lumen-autocomplete' },
  Avatar: { baseClassName: 'ui-avatar', tagName: 'lumen-avatar' },
  Badge: {
    attributeClasses: {
      variant: {
        default: 'ui-badge--default',
        destructive: 'ui-badge--destructive',
        outline: 'ui-badge--outline',
        secondary: 'ui-badge--secondary',
        success: 'ui-badge--success',
        warning: 'ui-badge--warning'
      }
    },
    baseClassName: 'ui-badge',
    defaults: { variant: 'default' },
    tagName: 'lumen-badge'
  },
  Breadcrumb: { baseClassName: 'ui-breadcrumb', defaults: { 'aria-label': 'Breadcrumb' }, tagName: 'lumen-breadcrumb' },
  Bubble: {
    attributeClasses: { from: { user: 'ui-bubble--user' }, ...glassAttributeClasses('ui-bubble--glass') },
    baseClassName: 'ui-bubble',
    defaults: { from: 'assistant' },
    tagName: 'lumen-bubble'
  },
  Button: {
    attributeClasses: {
      variant: {
        default: 'ui-button--default',
        destructive: 'ui-button--destructive',
        ghost: 'ui-button--ghost',
        link: 'ui-button--link',
        outline: 'ui-button--outline',
        secondary: 'ui-button--secondary'
      },
      size: {
        default: 'ui-button--default-size',
        icon: 'ui-button--icon',
        lg: 'ui-button--lg',
        sm: 'ui-button--sm'
      },
      disabled: { true: 'ui-button--disabled' },
      loading: { true: 'ui-button--loading' }
    },
    baseClassName: 'ui-button',
    defaults: { role: 'button', size: 'default', tabindex: '0', variant: 'default' },
    role: 'button',
    tagName: 'lumen-button'
  },
  ButtonGroup: { baseClassName: 'ui-button-group', tagName: 'lumen-button-group' },
  Calendar: { attributeClasses: glassAttributeClasses('ui-calendar--glass'), baseClassName: 'ui-calendar', tagName: 'lumen-calendar' },
  Card: {
    attributeClasses: {
      glass: {
        strong: 'ui-card--glass ui-glass-strong',
        subtle: 'ui-card--glass ui-glass-subtle',
        true: 'ui-card--glass'
      },
      variant: {
        glass: 'ui-card--glass',
        interactive: 'ui-card--interactive',
        muted: 'ui-card--muted'
      }
    },
    baseClassName: 'ui-card',
    defaults: { variant: 'default' },
    tagName: 'lumen-card'
  },
  Carousel: { attributeClasses: glassAttributeClasses('ui-carousel--glass'), baseClassName: 'ui-carousel', defaults: { 'data-ui-carousel': '' }, tagName: 'lumen-carousel' },
  Chart: { attributeClasses: glassAttributeClasses('ui-chart--glass'), baseClassName: 'ui-chart', tagName: 'lumen-chart' },
  Checkbox: { baseClassName: 'ui-checkbox', defaults: { type: 'checkbox' }, tagName: 'lumen-checkbox' },
  Collapsible: { baseClassName: 'ui-collapsible', defaults: { 'data-ui-collapsible': '' }, tagName: 'lumen-collapsible' },
  Code: {
    attributeClasses: {
      variant: {
        block: 'ui-code--block',
        inline: 'ui-code--inline'
      }
    },
    baseClassName: 'ui-code',
    defaults: { 'data-code-theme': 'auto', variant: 'inline' },
    tagName: 'lumen-code'
  },
  Combobox: { baseClassName: 'ui-combobox', defaults: { 'data-ui-combobox': '' }, tagName: 'lumen-combobox' },
  Command: { attributeClasses: glassAttributeClasses('ui-command--glass'), baseClassName: 'ui-command', defaults: { 'data-ui-command': '' }, tagName: 'lumen-command' },
  ColorPicker: { baseClassName: 'ui-color-picker', defaults: { type: 'color' }, tagName: 'lumen-color-picker' },
  ContextMenu: {
    attributeClasses: {
      glass: { strong: 'ui-menu--glass ui-glass-strong', subtle: 'ui-menu--glass ui-glass-subtle', true: 'ui-menu--glass' },
      surface: { glass: 'ui-menu--glass' }
    },
    baseClassName: 'ui-menu',
    defaults: { surface: 'default' },
    tagName: 'lumen-context-menu'
  },
  DataTable: { attributeClasses: glassAttributeClasses('ui-data-table--glass'), baseClassName: 'ui-data-table', defaults: { 'data-ui-datatable': '' }, tagName: 'lumen-data-table' },
  DatePicker: { baseClassName: 'ui-input ui-date-picker', defaults: { type: 'date' }, tagName: 'lumen-date-picker' },
  DateRangePicker: { baseClassName: 'ui-date-range-picker', defaults: { 'data-ui-date-range-picker': '' }, tagName: 'lumen-date-range-picker' },
  Dialog: {
    attributeClasses: {
      glass: { strong: 'ui-dialog--glass ui-glass-strong', subtle: 'ui-dialog--glass ui-glass-subtle', true: 'ui-dialog--glass' },
      surface: { glass: 'ui-dialog--glass' }
    },
    baseClassName: 'ui-dialog',
    defaults: { 'data-ui-dialog': '', surface: 'default' },
    tagName: 'lumen-dialog'
  },
  Direction: { baseClassName: 'ui-direction', defaults: { dir: 'ltr' }, tagName: 'lumen-direction' },
  Drawer: {
    attributeClasses: {
      glass: { strong: 'ui-drawer--glass ui-glass-strong', subtle: 'ui-drawer--glass ui-glass-subtle', true: 'ui-drawer--glass' },
      surface: { glass: 'ui-drawer--glass' }
    },
    baseClassName: 'ui-drawer',
    defaults: { 'data-ui-drawer': '', surface: 'default' },
    tagName: 'lumen-drawer'
  },
  DropdownMenu: {
    attributeClasses: {
      glass: { strong: 'ui-menu--glass ui-glass-strong', subtle: 'ui-menu--glass ui-glass-subtle', true: 'ui-menu--glass' },
      surface: { glass: 'ui-menu--glass' }
    },
    baseClassName: 'ui-menu',
    defaults: { 'data-ui-dropdown-menu': '', surface: 'default' },
    tagName: 'lumen-dropdown-menu'
  },
  Empty: { attributeClasses: glassAttributeClasses('ui-empty--glass'), baseClassName: 'ui-empty', tagName: 'lumen-empty' },
  Field: { attributeClasses: glassAttributeClasses('ui-field--glass'), baseClassName: 'ui-field', defaults: { 'data-ui-field': '' }, tagName: 'lumen-field' },
  HoverCard: {
    attributeClasses: {
      glass: { strong: 'ui-hover-card--glass ui-glass-strong', subtle: 'ui-hover-card--glass ui-glass-subtle', true: 'ui-hover-card--glass' },
      surface: { glass: 'ui-hover-card--glass' }
    },
    baseClassName: 'ui-hover-card',
    defaults: { 'data-ui-hover-card': '', surface: 'default' },
    tagName: 'lumen-hover-card'
  },
  Input: { attributeClasses: { size: { lg: 'ui-input--lg', sm: 'ui-input--sm' } }, baseClassName: 'ui-input', defaults: { type: 'text' }, tagName: 'lumen-input' },
  InputGroup: { baseClassName: 'ui-input-group', tagName: 'lumen-input-group' },
  InputOTP: { baseClassName: 'ui-input-otp', defaults: { inputmode: 'numeric', maxlength: '6', pattern: '[0-9]*', type: 'text' }, tagName: 'lumen-input-otp' },
  NumberField: { baseClassName: 'ui-input ui-number-field', defaults: { type: 'number' }, tagName: 'lumen-number-field' },
  Item: { attributeClasses: glassAttributeClasses('ui-item--glass'), baseClassName: 'ui-item', tagName: 'lumen-item' },
  Kbd: { baseClassName: 'ui-kbd', tagName: 'lumen-kbd' },
  Label: { baseClassName: 'ui-label', tagName: 'lumen-label' },
  Marker: {
    attributeClasses: {
      variant: {
        danger: 'ui-marker--danger',
        success: 'ui-marker--success',
        warning: 'ui-marker--warning'
      }
    },
    baseClassName: 'ui-marker',
    defaults: { variant: 'default' },
    tagName: 'lumen-marker'
  },
  Menubar: {
    attributeClasses: {
      glass: { strong: 'ui-menubar--glass ui-glass-strong', subtle: 'ui-menubar--glass ui-glass-subtle', true: 'ui-menubar--glass' },
      surface: { glass: 'ui-menubar--glass' }
    },
    baseClassName: 'ui-menubar',
    defaults: { 'data-ui-menubar': '', surface: 'default' },
    tagName: 'lumen-menubar'
  },
  Message: {
    attributeClasses: {
      from: {
        assistant: 'ui-message--assistant',
        user: 'ui-message--user'
      }
    },
    baseClassName: 'ui-message',
    defaults: { from: 'assistant' },
    tagName: 'lumen-message'
  },
  MessageScroller: { attributeClasses: glassAttributeClasses('ui-message-scroller--glass'), baseClassName: 'ui-message-scroller', tagName: 'lumen-message-scroller' },
  NativeSelect: { attributeClasses: { size: { lg: 'ui-select--lg', sm: 'ui-select--sm' } }, baseClassName: 'ui-select', tagName: 'lumen-native-select' },
  NavigationMenu: {
    attributeClasses: {
      glass: { strong: 'ui-navigation-menu--glass ui-glass-strong', subtle: 'ui-navigation-menu--glass ui-glass-subtle', true: 'ui-navigation-menu--glass' },
      surface: { glass: 'ui-navigation-menu--glass' }
    },
    baseClassName: 'ui-navigation-menu',
    defaults: { 'data-ui-navigation-menu': '', surface: 'default' },
    tagName: 'lumen-navigation-menu'
  },
  Pagination: { baseClassName: 'ui-pagination', defaults: { 'aria-label': 'Pagination' }, tagName: 'lumen-pagination' },
  Popover: {
    attributeClasses: {
      glass: { strong: 'ui-popover--glass ui-glass-strong', subtle: 'ui-popover--glass ui-glass-subtle', true: 'ui-popover--glass' },
      surface: { glass: 'ui-popover--glass' }
    },
    baseClassName: 'ui-popover',
    defaults: { 'data-ui-popover': '', surface: 'default' },
    tagName: 'lumen-popover'
  },
  Progress: { baseClassName: 'ui-progress', defaults: { role: 'progressbar' }, tagName: 'lumen-progress' },
  RadioGroup: { baseClassName: 'ui-radio-group', defaults: { 'data-ui-radio-group': '' }, tagName: 'lumen-radio-group' },
  Resizable: { baseClassName: 'ui-resizable', tagName: 'lumen-resizable' },
  RichTextEditor: { attributeClasses: glassAttributeClasses('ui-rich-text-editor--glass'), baseClassName: 'ui-rich-text-editor', defaults: { 'data-ui-rich-text-editor': '' }, tagName: 'lumen-rich-text-editor' },
  ScrollArea: { attributeClasses: glassAttributeClasses('ui-scroll-area--glass'), baseClassName: 'ui-scroll-area', tagName: 'lumen-scroll-area' },
  Schedule: { attributeClasses: glassAttributeClasses('ui-schedule--glass'), baseClassName: 'ui-schedule', defaults: { 'data-ui-schedule': '' }, tagName: 'lumen-schedule' },
  SearchField: { baseClassName: 'ui-input ui-search-field', defaults: { type: 'search' }, tagName: 'lumen-search-field' },
  Select: { attributeClasses: { size: { lg: 'ui-select--lg', sm: 'ui-select--sm' } }, baseClassName: 'ui-select', tagName: 'lumen-select' },
  Separator: {
    attributeClasses: {
      orientation: {
        horizontal: 'ui-separator--horizontal',
        vertical: 'ui-separator--vertical'
      }
    },
    baseClassName: 'ui-separator',
    defaults: { orientation: 'horizontal' },
    tagName: 'lumen-separator'
  },
  Sheet: {
    attributeClasses: {
      glass: { strong: 'ui-sheet--glass ui-glass-strong', subtle: 'ui-sheet--glass ui-glass-subtle', true: 'ui-sheet--glass' },
      surface: { glass: 'ui-sheet--glass' }
    },
    baseClassName: 'ui-sheet',
    defaults: { 'data-ui-sheet': '', surface: 'default' },
    tagName: 'lumen-sheet'
  },
  Sidebar: {
    attributeClasses: {
      glass: { strong: 'ui-sidebar--glass ui-glass-strong', subtle: 'ui-sidebar--glass ui-glass-subtle', true: 'ui-sidebar--glass' },
      surface: { glass: 'ui-sidebar--glass' }
    },
    baseClassName: 'ui-sidebar',
    defaults: { surface: 'default' },
    tagName: 'lumen-sidebar'
  },
  Skeleton: { baseClassName: 'ui-skeleton', tagName: 'lumen-skeleton' },
  Slider: { baseClassName: 'ui-slider', defaults: { type: 'range' }, tagName: 'lumen-slider' },
  Sonner: { baseClassName: 'ui-sonner', defaults: { 'data-ui-sonner': '' }, tagName: 'lumen-sonner' },
  Spinner: { baseClassName: 'ui-spinner', tagName: 'lumen-spinner' },
  Switch: { baseClassName: 'ui-switch', defaults: { role: 'switch', type: 'checkbox' }, tagName: 'lumen-switch' },
  Table: { attributeClasses: glassAttributeClasses('ui-table-wrap--glass'), baseClassName: 'ui-table-wrap', tagName: 'lumen-table' },
  Tabs: { attributeClasses: glassAttributeClasses('ui-tabs--glass'), baseClassName: 'ui-tabs', defaults: { 'data-ui-tabs': '' }, tagName: 'lumen-tabs' },
  TagGroup: { baseClassName: 'ui-tag-group', defaults: { role: 'list' }, tagName: 'lumen-tag-group' },
  Textarea: { baseClassName: 'ui-textarea', defaults: { rows: '4' }, tagName: 'lumen-textarea' },
  ThemeBuilder: { attributeClasses: glassAttributeClasses('ui-theme-builder--glass'), baseClassName: 'ui-theme-builder', defaults: { 'data-ui-theme-builder': '' }, tagName: 'lumen-theme-builder' },
  TimeField: { baseClassName: 'ui-input ui-time-field', defaults: { type: 'time' }, tagName: 'lumen-time-field' },
  Toast: {
    attributeClasses: {
      glass: {
        true: 'ui-toast--glass'
      },
      surface: {
        glass: 'ui-toast--glass'
      },
      variant: {
        destructive: 'ui-toast--destructive',
        success: 'ui-toast--success',
        warning: 'ui-toast--warning'
      }
    },
    baseClassName: 'ui-toast',
    defaults: { surface: 'default', variant: 'default' },
    tagName: 'lumen-toast'
  },
  Toggle: {
    attributeClasses: { pressed: { true: 'ui-toggle--pressed' } },
    baseClassName: 'ui-toggle',
    defaults: { 'aria-pressed': 'false', 'data-ui-toggle': '', role: 'button', tabindex: '0' },
    role: 'button',
    tagName: 'lumen-toggle'
  },
  ToggleGroup: { baseClassName: 'ui-toggle-group', defaults: { 'data-ui-toggle-group': '' }, tagName: 'lumen-toggle-group' },
  Tooltip: { baseClassName: 'ui-tooltip', tagName: 'lumen-tooltip' },
  Tree: { attributeClasses: glassAttributeClasses('ui-tree--glass'), baseClassName: 'ui-tree', defaults: { role: 'tree' }, tagName: 'lumen-tree' },
  TreeGrid: { attributeClasses: glassAttributeClasses('ui-tree-grid--glass'), baseClassName: 'ui-tree-grid', defaults: { role: 'treegrid' }, tagName: 'lumen-tree-grid' },
  Typography: { baseClassName: 'ui-typography', tagName: 'lumen-typography' },
  VirtualList: { attributeClasses: glassAttributeClasses('ui-virtual-list--glass'), baseClassName: 'ui-virtual-list', defaults: { 'data-ui-virtual-list': '' }, tagName: 'lumen-virtual-list' }
} as const satisfies Record<(typeof lumenComponentNames)[number], LumenElementConfig>

const observedAttributeNames = [
  'disabled',
  'from',
  'glass',
  'orientation',
  'pressed',
  'size',
  'surface',
  'variant'
]

const hasDocument = (): boolean => typeof document !== 'undefined'

const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2)}`
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

const getOwnedTarget = (event: Event): Node | null =>
  event.target instanceof Node ? event.target : null

const getScopedElements = <ScopedElement extends Element>(
  scope: ParentNode,
  selector: string
): ScopedElement[] => {
  const elements = [...scope.querySelectorAll<ScopedElement>(selector)]

  if (scope instanceof Element && scope.matches(selector)) {
    elements.unshift(scope as ScopedElement)
  }

  return elements
}

const isNativeFormControl = (element: EventTarget | null): element is NativeFormControl =>
  element instanceof HTMLInputElement ||
  element instanceof HTMLSelectElement ||
  element instanceof HTMLTextAreaElement

const getFieldControl = (root: HTMLElement): HTMLElement | null => {
  const controlId = root.dataset.uiFieldControl

  if (controlId && hasDocument()) {
    const control = document.getElementById(controlId)

    if (control instanceof HTMLElement) return control
  }

  return root.querySelector<HTMLElement>(fieldControlSelector)
}

const getFieldDescriptionId = (element: HTMLElement): string => {
  if (!element.id) {
    element.id = createId('ui-field-description')
  }

  return element.id
}

const getFieldRoot = (control: HTMLElement): HTMLElement | null =>
  control.closest<HTMLElement>('.ui-field, [data-ui-field]')

const getValidationMessage = (control: NativeFormControl, field: HTMLElement | null): string => {
  for (const [validityKey, attributeName] of validityMessageAttributes) {
    if (!control.validity[validityKey]) continue

    return control.getAttribute(attributeName) ??
      field?.getAttribute(attributeName) ??
      control.validationMessage
  }

  return control.validationMessage
}

const setFieldValidity = (
  control: NativeFormControl,
  invalid: boolean,
  message = ''
): void => {
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
}

const validateControl = (control: NativeFormControl, form: HTMLFormElement): boolean => {
  form.dispatchEvent(new CustomEvent('ui:validate', {
    bubbles: true,
    detail: { control, form, value: control.value }
  }))

  const invalid = !control.validity.valid
  const message = invalid ? getValidationMessage(control, getFieldRoot(control)) : ''

  setFieldValidity(control, invalid, message)

  return !invalid
}

const getFormControls = (form: HTMLFormElement): NativeFormControl[] =>
  [...form.querySelectorAll<NativeFormControl>(formControlSelector)]
    .filter(control => control.form === form && !control.disabled)

const validateForm = (form: HTMLFormElement): NativeFormControl[] =>
  getFormControls(form).filter(control => !validateControl(control, form))

const initLumenFields = (scope: ParentNode): void => {
  for (const root of getScopedElements<HTMLElement>(scope, '.ui-field, [data-ui-field]')) {
    if (root.dataset.uiFieldBound === 'true') continue

    const control = getFieldControl(root)

    if (!control) continue

    root.dataset.uiFieldBound = 'true'

    const existingIds = control.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []
    const configuredIds = root.dataset.uiFieldDescribedby?.trim().split(/\s+/) ?? []

    const descriptionIds = [...root.querySelectorAll<HTMLElement>(fieldDescriptionSelector)]
      .map(element => getFieldDescriptionId(element))

    const describedBy = [...new Set([...existingIds, ...configuredIds, ...descriptionIds].filter(Boolean))]

    if (describedBy.length) {
      control.setAttribute('aria-describedby', describedBy.join(' '))
    }
  }
}

const initLumenForms = (scope: ParentNode): void => {
  for (const form of getScopedElements<HTMLFormElement>(scope, 'form[data-ui-form]')) {
    if (form.dataset.uiFormBound === 'true') continue

    form.dataset.uiFormBound = 'true'

    form.noValidate = true

    form.addEventListener('focusout', event => {
      if (!isNativeFormControl(event.target) || event.target.form !== form) return

      const valid = validateControl(event.target, form)

      form.dispatchEvent(new CustomEvent(valid ? 'ui:valid' : 'ui:invalid', {
        bubbles: true,
        detail: valid
          ? { control: event.target, form }
          : { control: event.target, controls: [event.target], form }
      }))
    })

    form.addEventListener('submit', event => {
      const invalidControls = validateForm(form)

      if (invalidControls.length) {
        event.preventDefault()

        const firstInvalid = invalidControls[0]

        if (!firstInvalid) return

        form.dispatchEvent(new CustomEvent('ui:invalid', {
          bubbles: true,
          detail: { control: firstInvalid, controls: invalidControls, form }
        }))

        firstInvalid.focus({ preventScroll: true })

        firstInvalid.reportValidity()

        return
      }

      form.dispatchEvent(new CustomEvent('ui:valid', {
        bubbles: true,
        detail: { controls: getFormControls(form), form }
      }))
    })
  }
}

export const enhanceLumenForms = (
  scope: ParentNode = document
): void => {
  initLumenFields(scope)

  initLumenForms(scope)
}

const installFormController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsFormsBound === 'true') return

  document.documentElement.dataset.uiElementsFormsBound = 'true'

  enhanceLumenForms(document)

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenForms(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
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

const getDataTableSortValue = (cell: HTMLTableCellElement | undefined): string => {
  if (!cell) return ''

  return cell.dataset.sortValue ?? cell.textContent.trim()
}

const compareDataTableValues = (value: string, other: string, sortType: string | undefined): number => {
  const numericValue = Number(value.replaceAll(',', ''))
  const numericOther = Number(other.replaceAll(',', ''))

  const useNumeric = sortType === 'number' || (
    sortType !== 'string' &&
    value.trim() !== '' &&
    other.trim() !== '' &&
    Number.isFinite(numericValue) &&
    Number.isFinite(numericOther)
  )

  if (useNumeric) {
    return numericValue - numericOther
  }

  return value.localeCompare(other, undefined, { numeric: true, sensitivity: 'base' })
}

const getDataTableRows = (table: HTMLTableElement): HTMLTableRowElement[] =>
  [...(table.tBodies[0]?.rows ?? [])]

const getDataTableRowValue = (row: HTMLTableRowElement, index: number): string =>
  row.dataset.value || row.id || String(index)

const getNextDataTableSortDirection = (
  currentColumn: string | undefined,
  columnIndex: number,
  currentDirection: string | null
): DataTableSortDirection => {
  if (currentColumn !== String(columnIndex) || currentDirection === 'none') return 'ascending'

  if (currentDirection === 'ascending') return 'descending'

  return 'none'
}

const getControlledPanel = (trigger: HTMLElement): HTMLElement | null => {
  const controls = trigger.getAttribute('aria-controls')

  if (controls && hasDocument()) {
    return document.getElementById(controls)
  }

  return trigger.nextElementSibling instanceof HTMLElement ? trigger.nextElementSibling : null
}

const setDisclosureOpen = (trigger: HTMLElement, panel: HTMLElement, open: boolean): void => {
  trigger.setAttribute('aria-expanded', String(open))

  panel.hidden = !open

  panel.dataset.state = open ? 'open' : 'closed'
}

const isPrintableKey = (event: KeyboardEvent): boolean =>
  event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey

const escapeCssIdentifier = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value.replaceAll(/["#.:?[\\\]]/g, '\\$&')
}

const isToastPlacement = (placement: string | undefined): placement is ToastPlacement =>
  placement === 'top-left' ||
  placement === 'top-center' ||
  placement === 'top-right' ||
  placement === 'bottom-left' ||
  placement === 'bottom-center' ||
  placement === 'bottom-right'

const getToastPlacement = (placement: string | undefined): ToastPlacement =>
  isToastPlacement(placement) ? placement : 'bottom-right'

const getToastVariantClass = (variant: ToastVariant): string | false => {
  if (variant === 'success') return 'ui-toast--success'

  if (variant === 'warning') return 'ui-toast--warning'

  if (variant === 'destructive') return 'ui-toast--destructive'

  return false
}

const normalizeToastViewport = (viewport: HTMLElement, placement?: string): void => {
  viewport.classList.add('ui-sonner')

  viewport.dataset.uiSonner = ''

  viewport.dataset.placement = getToastPlacement(placement ?? viewport.dataset.placement)

  viewport.setAttribute('aria-live', viewport.getAttribute('aria-live') ?? 'polite')

  viewport.setAttribute('aria-atomic', viewport.getAttribute('aria-atomic') ?? 'false')

  viewport.setAttribute('aria-label', viewport.getAttribute('aria-label') ?? 'Notifications')
}

const getToastViewport = (placement: string | undefined): HTMLElement | null => {
  if (!hasDocument()) return null

  const resolvedPlacement = getToastPlacement(placement)
  const shouldUseAnyViewport = placement === undefined

  const existing = document.querySelector<HTMLElement>(`[data-ui-sonner][data-placement="${resolvedPlacement}"]`) ??
    (shouldUseAnyViewport ? document.querySelector<HTMLElement>('[data-ui-sonner]') : null)

  if (existing) {
    normalizeToastViewport(existing, existing.dataset.placement ?? resolvedPlacement)

    return existing
  }

  const tagName = typeof customElements !== 'undefined' && customElements.get('lumen-sonner')
    ? 'lumen-sonner'
    : 'div'

  const viewport = document.createElement(tagName)

  normalizeToastViewport(viewport, resolvedPlacement)

  document.body.append(viewport)

  return viewport
}

const clearToastTimer = (toast: HTMLElement): void => {
  const timer = toastTimers.get(toast)

  if (!timer) return

  if (timer.timer) {
    globalThis.clearTimeout(timer.timer)
  }

  timer.cleanup?.()

  toastTimers.delete(toast)
}

const dismissToastElement = (toast: HTMLElement): void => {
  clearToastTimer(toast)

  toast.dataset.state = 'closed'

  globalThis.setTimeout(() => { toast.remove(); }, toastCloseDelay)
}

const scheduleToastDismiss = (toast: HTMLElement, duration: number): void => {
  clearToastTimer(toast)

  if (!Number.isFinite(duration) || duration <= 0) return

  const timerState: {
    cleanup: (() => void) | undefined
    remaining: number
    startedAt: number
    timer: ReturnType<typeof globalThis.setTimeout> | undefined
  } = {
    cleanup: undefined,
    remaining: duration,
    startedAt: Date.now(),
    timer: undefined as ReturnType<typeof globalThis.setTimeout> | undefined
  }

  const start = (): void => {
    timerState.startedAt = Date.now()

    timerState.timer = globalThis.setTimeout(() => { dismissToastElement(toast); }, timerState.remaining)
  }

  const pause = (): void => {
    if (timerState.timer) {
      globalThis.clearTimeout(timerState.timer)
    }

    timerState.remaining = Math.max(0, timerState.remaining - (Date.now() - timerState.startedAt))
  }

  const resume = (): void => {
    if (timerState.remaining > 0) start()
  }

  timerState.cleanup = () => {
    toast.removeEventListener('mouseenter', pause)

    toast.removeEventListener('mouseleave', resume)

    toast.removeEventListener('focusin', pause)

    toast.removeEventListener('focusout', resume)
  }

  toast.addEventListener('mouseenter', pause)

  toast.addEventListener('mouseleave', resume)

  toast.addEventListener('focusin', pause)

  toast.addEventListener('focusout', resume)

  toastTimers.set(toast, timerState)

  start()
}

const setToastContent = (toast: HTMLElement, detail: ToastDetail): void => {
  const title = detail.title ?? toast.dataset.title ?? 'Notification'
  const description = detail.description ?? toast.dataset.description ?? ''
  const variant = detail.variant ?? toast.dataset.variant ?? 'default'
  const variantClass = getToastVariantClass(variant)

  toast.className = variantClass ? `ui-toast ${variantClass}` : 'ui-toast'

  toast.dataset.uiToast = ''

  toast.dataset.variant = variant

  toast.dataset.title = title

  toast.dataset.description = description

  toast.setAttribute('variant', variant)

  toast.setAttribute('role', variant === 'destructive' ? 'alert' : 'status')

  toast.setAttribute('aria-live', variant === 'destructive' ? 'assertive' : 'polite')

  toast.replaceChildren()

  const body = document.createElement('div')
  const heading = document.createElement('strong')

  body.className = 'ui-toast__body'

  heading.textContent = title

  body.append(heading)

  if (description) {
    const text = document.createElement('p')

    text.textContent = description

    body.append(text)
  }

  toast.append(body)

  if (detail.action?.label) {
    const action = document.createElement('button')

    action.className = 'ui-button ui-button--secondary ui-button--sm ui-toast__action'

    action.type = 'button'

    action.textContent = detail.action.label

    action.addEventListener('click', event => {
      detail.action?.onClick?.(event, toast)

      toast.dispatchEvent(new CustomEvent(detail.action?.event ?? 'ui:toast-action', {
        bubbles: true,
        detail: { id: toast.id, value: detail.action?.value }
      }))

      dismissToastElement(toast)
    })

    toast.append(action)
  }

  const dismiss = document.createElement('button')

  dismiss.className = 'ui-toast__dismiss'

  dismiss.type = 'button'

  dismiss.setAttribute('aria-label', 'Dismiss notification')

  dismiss.textContent = 'Dismiss'

  dismiss.addEventListener('click', () => { dismissToastElement(toast); })

  toast.append(dismiss)
}

export const LumenToast: ToastApi = {
  create(detail) {
    const viewport = getToastViewport(detail.placement)

    if (!viewport) return detail.id ?? createId('ui-toast')

    const id = detail.id ?? createId('ui-toast')
    const duration = detail.duration ?? defaultToastDuration
    const max = detail.max ?? Number(viewport.dataset.uiToastMax ?? defaultToastMax)
    const existingToast = document.getElementById(id)

    if (existingToast instanceof HTMLElement && existingToast.hasAttribute('data-ui-toast')) {
      existingToast.dataset.state = 'open'

      setToastContent(existingToast, detail)

      viewport.append(existingToast)

      scheduleToastDismiss(existingToast, duration)

      return id
    }

    const tagName = typeof customElements !== 'undefined' && customElements.get('lumen-toast')
      ? 'lumen-toast'
      : 'aside'

    const toast = document.createElement(tagName)

    toast.id = id

    toast.dataset.state = 'open'

    toast.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return

      event.preventDefault()

      dismissToastElement(toast)
    })

    setToastContent(toast, detail)

    viewport.append(toast)

    scheduleToastDismiss(toast, duration)

    const toasts = [...viewport.querySelectorAll<HTMLElement>('[data-ui-toast]')]

    for (const staleToast of toasts.slice(0, Math.max(0, toasts.length - max))) {
      dismissToastElement(staleToast)
    }

    return id
  },
  dismiss(id) {
    if (!hasDocument()) return

    const selector = id ? `#${escapeCssIdentifier(id)}` : '[data-ui-toast]'

    for (const toast of document.querySelectorAll<HTMLElement>(selector)) {
      if (toast.hasAttribute('data-ui-toast')) {
        dismissToastElement(toast)
      }
    }
  },
  update(id, detail) {
    if (!hasDocument()) return

    const toast = document.getElementById(id)

    if (!(toast instanceof HTMLElement) || !toast.hasAttribute('data-ui-toast')) return

    setToastContent(toast, { ...detail, id })

    if (detail.duration !== undefined) {
      scheduleToastDismiss(toast, detail.duration)
    }
  }
}

const installToastController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsToastsBound === 'true') return

  document.documentElement.dataset.uiElementsToastsBound = 'true'

  ;(globalThis as typeof globalThis & { LumenToast?: ToastApi }).LumenToast = LumenToast

  for (const viewport of document.querySelectorAll<HTMLElement>('[data-ui-sonner]')) {
    normalizeToastViewport(viewport)
  }

  document.addEventListener('ui:toast', event => {
    LumenToast.create(event instanceof CustomEvent ? event.detail as ToastDetail : {})
  })

  document.addEventListener('ui:toast-update', event => {
    const detail = event instanceof CustomEvent ? event.detail as ToastDetail : {}

    if (detail.id) {
      LumenToast.update(detail.id, detail)
    }
  })

  document.addEventListener('ui:toast-dismiss', event => {
    const detail = event instanceof CustomEvent ? event.detail as { id?: string } : {}

    LumenToast.dismiss(detail.id)
  })
}

export class LumenElement extends HTMLElement {
  static config: LumenElementConfig

  static get observedAttributes() {
    return observedAttributeNames
  }

  connectedCallback() {
    this.applyDefaults()

    this.applyClassNames()
  }

  disconnectedCallback() {
    /* Subclasses clean up behavior listeners when needed. */
  }

  attributeChangedCallback() {
    this.applyClassNames()
  }

  protected get config() {
    return (this.constructor as typeof LumenElement).config
  }

  private applyDefaults() {
    for (const [name, value] of Object.entries(this.config.defaults ?? {})) {
      if (!this.hasAttribute(name)) {
        this.setAttribute(name, value)
      }
    }

    if (this.config.role && !this.hasAttribute('role')) {
      this.setAttribute('role', this.config.role)
    }
  }

  private applyClassNames() {
    const previousClassNames = appliedClassNames.get(this) ?? []

    for (const className of previousClassNames) {
      this.classList.remove(className)
    }

    const classNames = mergeClassNames(this.config.baseClassName)

    for (const [attributeName, classMap] of Object.entries(this.config.attributeClasses ?? {})) {
      const attributeValue = this.hasAttribute(attributeName)
        ? this.getAttribute(attributeName) || 'true'
        : this.config.defaults?.[attributeName]

      const className = attributeValue ? classMap[attributeValue] : undefined

      if (className) {
        classNames.push(...mergeClassNames(className))
      }
    }

    this.classList.add(...classNames)

    appliedClassNames.set(this, classNames)
  }
}

class LumenDialogBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private lastTrigger: HTMLElement | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupDialog(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }

  show(trigger?: HTMLElement): void {
    this.openDialog(trigger)
  }

  close(): void {
    this.closeDialog()
  }

  private get isAlertDialog(): boolean {
    return this.hasAttribute('data-ui-alert-dialog') || this.tagName.toLowerCase() === 'lumen-alert-dialog'
  }

  private get nativeDialog(): HTMLDialogElement | null {
    const dialog = this.querySelector('dialog')

    return dialog instanceof HTMLDialogElement ? dialog : null
  }

  private get dialogRoot(): HTMLElement {
    return this.nativeDialog ?? this
  }

  private setupDialog(signal: AbortSignal): void {
    const dialog = this.dialogRoot
    const initiallyOpen = this.hasAttribute('open') || this.nativeDialog?.open === true

    dialog.setAttribute('aria-modal', 'true')

    dialog.setAttribute('role', this.isAlertDialog ? 'alertdialog' : 'dialog')

    if (!this.nativeDialog) {
      this.hidden = !initiallyOpen

      this.dataset.state = initiallyOpen ? 'open' : 'closed'
    }

    this.nativeDialog?.addEventListener('click', event => {
      if (event.target === this.nativeDialog && !this.isAlertDialog) {
        this.closeDialog()
      }
    }, { signal })

    this.nativeDialog?.addEventListener('close', () => { this.returnFocus(); }, { signal })

    this.addEventListener('click', event => {
      const target = getOwnedTarget(event)

      const closeButton = target instanceof Element
        ? target.closest('[data-ui-dialog-close], [data-ui-alert-dialog-close]')
        : null

      if (closeButton) {
        this.closeDialog()
      }
    }, { signal })

    this.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault()

        this.closeDialog()

        return
      }

      if (event.key !== 'Tab') return

      this.trapFocus(event)
    }, { signal })

    document.addEventListener('click', event => {
      const target = getOwnedTarget(event)

      const trigger = target instanceof Element
        ? target.closest<HTMLElement>('[data-ui-dialog-trigger], [data-ui-alert-dialog-trigger]')
        : null

      const targetId = trigger?.dataset.uiDialogTrigger ?? trigger?.dataset.uiAlertDialogTrigger

      if (!trigger || targetId !== this.id) return

      this.openDialog(trigger)
    }, { signal })

    document.addEventListener('pointerdown', event => {
      if (!this.isOpen() || this.isAlertDialog) return

      const target = getOwnedTarget(event)

      if (!target || this.contains(target)) return

      this.closeDialog()
    }, { signal })
  }

  private isOpen(): boolean {
    return this.nativeDialog?.open === true || this.hasAttribute('open') || this.dataset.state === 'open'
  }

  private openDialog(trigger?: HTMLElement): void {
    if (trigger) {
      if (!trigger.id) {
        trigger.id = createId('ui-trigger')
      }

      this.lastTrigger = trigger
    }

    const dialog = this.nativeDialog

    if (dialog) {
      if (typeof dialog.showModal === 'function' && !dialog.open) {
        dialog.showModal()
      } else {
        dialog.setAttribute('open', '')
      }
    } else {
      this.hidden = false

      this.setAttribute('open', '')

      this.dataset.state = 'open'
    }

    getFocusable(this.dialogRoot)[0]?.focus({ preventScroll: true })
  }

  private closeDialog(): void {
    const dialog = this.nativeDialog

    if (dialog?.open) {
      dialog.close()

      return
    }

    if (!dialog) {
      this.hidden = true

      this.removeAttribute('open')

      this.dataset.state = 'closed'

      this.returnFocus()
    }
  }

  private returnFocus(): void {
    this.lastTrigger?.focus({ preventScroll: true })
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusable = getFocusable(this.dialogRoot)

    if (!focusable.length) return

    const first = focusable[0]
    const last = focusable.at(-1)

    if (!first || !last) return

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()

      last.focus()

      return
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()

      first.focus()
    }
  }
}

class LumenDisclosureBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupDisclosure(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }

  private setupDisclosure(signal: AbortSignal): void {
    const trigger = this.querySelector<HTMLElement>('[data-ui-trigger]')

    if (!trigger) return

    const panel = getControlledPanel(trigger)

    if (!panel) return

    trigger.setAttribute('aria-haspopup', trigger.getAttribute('aria-haspopup') ?? 'menu')

    setDisclosureOpen(trigger, panel, trigger.getAttribute('aria-expanded') === 'true')

    const close = (): void => { setDisclosureOpen(trigger, panel, false); }

    const open = (): void => { setDisclosureOpen(trigger, panel, true); }

    trigger.addEventListener('click', () => {
      setDisclosureOpen(trigger, panel, trigger.getAttribute('aria-expanded') !== 'true')
    }, { signal })

    trigger.addEventListener('keydown', event => {
      if (event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') return

      event.preventDefault()

      open()

      getFocusable(panel)[0]?.focus()
    }, { signal })

    panel.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault()

        close()

        trigger.focus({ preventScroll: true })

        return
      }

      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']

      if (!keys.includes(event.key)) return

      const items = getFocusable(panel)

      if (!items.length) return

      event.preventDefault()

      const currentIndex = items.indexOf(document.activeElement as HTMLElement)
      const nextItem = items[getLoopedIndex(event.key, Math.max(0, currentIndex), items.length, ['ArrowDown'])]

      nextItem?.focus()
    }, { signal })

    document.addEventListener('pointerdown', event => {
      if (trigger.getAttribute('aria-expanded') !== 'true') return

      const target = getOwnedTarget(event)

      if (!target || this.contains(target) || panel.contains(target)) return

      close()
    }, { signal })
  }
}

class LumenTabsBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupTabs(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }

  private setupTabs(signal: AbortSignal): void {
    const tabs = [...this.querySelectorAll<HTMLElement>('[role="tab"]')]
    const panels = [...this.querySelectorAll<HTMLElement>('[role="tabpanel"]')]

    if (!tabs.length || !panels.length) return

    const activate = (tab: HTMLElement): void => {
      for (const item of tabs) {
        const selected = item === tab
        const panelId = item.getAttribute('aria-controls')
        const panel = panelId ? document.getElementById(panelId) : null

        item.setAttribute('aria-selected', String(selected))

        item.tabIndex = selected ? 0 : -1

        if (panel) {
          panel.hidden = !selected
        }
      }
    }

    activate(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') ?? tabs[0]!)

    for (const tab of tabs) {
      tab.addEventListener('click', () => { activate(tab); }, { signal })

      tab.addEventListener('keydown', event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']

        if (!keys.includes(event.key)) return

        event.preventDefault()

        const currentIndex = tabs.indexOf(tab)
        const nextTab = tabs[getLoopedIndex(event.key, Math.max(0, currentIndex), tabs.length, ['ArrowRight'])]

        if (nextTab) {
          activate(nextTab)

          nextTab.focus()
        }
      }, { signal })
    }
  }
}

class LumenSelectBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private typeahead = ''
  private typeaheadTimer: ReturnType<typeof globalThis.setTimeout> | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.dataset.uiSelect = ''

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupSelect(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    if (this.typeaheadTimer) {
      globalThis.clearTimeout(this.typeaheadTimer)

      this.typeaheadTimer = undefined
    }
  }

  private setupSelect(signal: AbortSignal): void {
    const select = this.ensureNativeSelect()
    const control = this.ensureControl(select)
    const trigger = control.querySelector<HTMLButtonElement>('[data-ui-select-trigger]')
    const listbox = control.querySelector<HTMLElement>('[data-ui-select-list]')

    if (!trigger || !listbox) return

    this.renderOptions(select, listbox)

    control.hidden = false

    select.dataset.uiEnhanced = 'true'

    select.dataset.uiSelectNative = ''

    select.tabIndex = -1

    select.setAttribute('aria-hidden', 'true')

    trigger.disabled = select.disabled

    trigger.setAttribute('aria-haspopup', 'listbox')

    trigger.setAttribute('role', 'combobox')

    for (const attribute of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-invalid']) {
      const value = select.getAttribute(attribute)

      if (value) {
        trigger.setAttribute(attribute, value)
      }
    }

    if (select.required) {
      trigger.setAttribute('aria-required', 'true')
    }

    if (!trigger.hasAttribute('aria-label') && !trigger.hasAttribute('aria-labelledby')) {
      const label = [...select.labels].find(item => item.textContent.trim())

      if (label?.textContent) {
        trigger.setAttribute('aria-label', label.textContent.trim())
      }
    }

    for (const label of select.labels) {
      label.addEventListener('click', event => {
        event.preventDefault()

        trigger.focus({ preventScroll: true })
      }, { signal })
    }

    this.syncValue(select, trigger)

    this.closeSelect(trigger, listbox)

    trigger.addEventListener('click', () => {
      if (trigger.getAttribute('aria-expanded') === 'true') {
        this.closeSelect(trigger, listbox)
      } else {
        this.openSelect(trigger, listbox)
      }
    }, { signal })

    trigger.addEventListener('keydown', event => {
      if (this.handleTypeahead(event)) return

      if (event.key === 'Escape') {
        this.closeSelect(trigger, listbox)

        return
      }

      const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ']

      if (!keys.includes(event.key)) return

      event.preventDefault()

      this.openSelect(trigger, listbox)

      if (event.key === 'Enter' || event.key === ' ') {
        ;

(this.getSelectedItem() ?? this.getEnabledItems()[0])?.focus()

        return
      }

      this.focusOption(event.key)
    }, { signal })

    select.addEventListener('change', () => { this.syncValue(select, trigger); }, { signal })

    select.form?.addEventListener('reset', () => {
      globalThis.setTimeout(() => { this.syncValue(select, trigger); })
    }, { signal })

    for (const item of this.getItems()) {
      item.tabIndex = -1

      item.addEventListener('click', () => { this.selectOption(select, trigger, listbox, item); }, { signal })

      item.addEventListener('keydown', event => {
        if (this.handleTypeahead(event, item)) return

        if (event.key === 'Escape') {
          this.closeSelect(trigger, listbox)

          trigger.focus({ preventScroll: true })

          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()

          this.selectOption(select, trigger, listbox, item)

          return
        }

        const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']

        if (!keys.includes(event.key)) return

        event.preventDefault()

        this.focusOption(event.key, item)
      }, { signal })
    }

    document.addEventListener('pointerdown', event => {
      if (trigger.getAttribute('aria-expanded') !== 'true') return

      const target = getOwnedTarget(event)

      if (!target || this.contains(target)) return

      this.closeSelect(trigger, listbox)
    }, { signal })
  }

  private ensureNativeSelect(): HTMLSelectElement {
    const existing = this.querySelector<HTMLSelectElement>('[data-ui-select-native], select')

    if (existing) return existing

    const select = document.createElement('select')
    const directOptions = [...this.children].filter((child): child is HTMLOptionElement => child instanceof HTMLOptionElement)

    select.className = 'ui-select ui-select__native'

    select.dataset.uiSelectNative = ''

    for (const attribute of ['id', 'name', 'required', 'disabled', 'value']) {
      const value = this.getAttribute(attribute)

      if (value !== null) {
        select.setAttribute(attribute, value)
      }
    }

    for (const option of directOptions) {
      select.append(option)
    }

    this.prepend(select)

    return select
  }

  private ensureControl(select: HTMLSelectElement): HTMLElement {
    const existing = this.querySelector<HTMLElement>('[data-ui-select-control]')

    if (existing) return existing

    const control = document.createElement('div')
    const trigger = document.createElement('button')
    const value = document.createElement('span')
    const listbox = document.createElement('div')
    const selectId = select.id || createId('ui-select')

    select.id = selectId

    control.className = 'ui-select__control'

    control.dataset.uiSelectControl = ''

    control.hidden = true

    trigger.className = 'ui-select ui-select__trigger'

    trigger.dataset.uiSelectTrigger = ''

    trigger.id = `${selectId}-trigger`

    trigger.type = 'button'

    trigger.setAttribute('aria-controls', `${selectId}-listbox`)

    trigger.setAttribute('aria-expanded', 'false')

    trigger.setAttribute('aria-haspopup', 'listbox')

    value.dataset.uiSelectValue = ''

    listbox.className = 'ui-select__list'

    listbox.dataset.uiSelectList = ''

    listbox.dataset.state = 'closed'

    listbox.hidden = true

    listbox.id = `${selectId}-listbox`

    listbox.setAttribute('role', 'listbox')

    trigger.append(value)

    control.append(trigger, listbox)

    select.after(control)

    return control
  }

  private renderOptions(select: HTMLSelectElement, listbox: HTMLElement): void {
    const items = [...select.options]
      .filter(option => !option.hasAttribute('data-ui-select-placeholder'))
      .map(option => {
        const item = document.createElement('button')

        item.type = 'button'

        item.setAttribute('role', 'option')

        item.dataset.uiSelectOption = ''

        item.dataset.value = option.value

        item.textContent = option.label

        if (option.disabled) {
          item.disabled = true

          item.setAttribute('aria-disabled', 'true')
        }

        return item
      })

    listbox.replaceChildren(...items)
  }

  private syncValue(select: HTMLSelectElement, trigger: HTMLElement): void {
    const value = this.querySelector<HTMLElement>('[data-ui-select-value]')

    if (!value) return

    const selectedOption = select.selectedOptions[0]
    const placeholder = select.querySelector<HTMLOptionElement>('[data-ui-select-placeholder]')
    const hasSelection = Boolean(selectedOption && !selectedOption.hasAttribute('data-ui-select-placeholder'))
    const selectedLabel = hasSelection && selectedOption ? selectedOption.label : ''

    value.textContent = hasSelection
      ? selectedLabel
      : placeholder?.textContent.trim() || 'Select an option'

    this.dataset.placeholder = hasSelection ? 'false' : 'true'

    trigger.setAttribute('aria-expanded', trigger.getAttribute('aria-expanded') ?? 'false')

    for (const item of this.getItems()) {
      item.setAttribute('aria-selected', String(hasSelection && item.dataset.value === select.value))
    }
  }

  private openSelect(trigger: HTMLElement, listbox: HTMLElement): void {
    trigger.setAttribute('aria-expanded', 'true')

    listbox.hidden = false

    listbox.dataset.state = 'open'
  }

  private closeSelect(trigger: HTMLElement, listbox: HTMLElement): void {
    trigger.setAttribute('aria-expanded', 'false')

    listbox.hidden = true

    listbox.dataset.state = 'closed'
  }

  private getItems(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(selectOptionSelector)]
  }

  private getEnabledItems(): HTMLElement[] {
    return this.getItems().filter(item => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true')
  }

  private getSelectedItem(): HTMLElement | undefined {
    return this.getEnabledItems().find(item => item.getAttribute('aria-selected') === 'true')
  }

  private selectOption(select: HTMLSelectElement, trigger: HTMLElement, listbox: HTMLElement, item: HTMLElement): void {
    if (item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true') return

    select.value = item.dataset.value ?? ''

    select.dispatchEvent(new Event('input', { bubbles: true }))

    select.dispatchEvent(new Event('change', { bubbles: true }))

    this.syncValue(select, trigger)

    this.closeSelect(trigger, listbox)

    trigger.focus({ preventScroll: true })
  }

  private focusOption(key: string, currentItem?: HTMLElement): void {
    const items = this.getEnabledItems()

    if (!items.length) return

    const current = currentItem ?? this.getSelectedItem() ?? items[0]

    if (!current) return

    const currentIndex = items.indexOf(current)
    const nextItem = items[getLoopedIndex(key, Math.max(0, currentIndex), items.length, ['ArrowDown'])]

    nextItem?.focus()
  }

  private handleTypeahead(event: KeyboardEvent, currentItem?: HTMLElement): boolean {
    if (!isPrintableKey(event)) return false

    event.preventDefault()

    this.typeahead += event.key.toLowerCase()

    if (this.typeaheadTimer) {
      globalThis.clearTimeout(this.typeaheadTimer)
    }

    this.typeaheadTimer = globalThis.setTimeout(() => {
      this.typeahead = ''
    }, 700)

    const trigger = this.querySelector<HTMLElement>('[data-ui-select-trigger]')
    const listbox = this.querySelector<HTMLElement>('[data-ui-select-list]')

    if (trigger && listbox) {
      this.openSelect(trigger, listbox)
    }

    this.focusTypeaheadOption(currentItem)

    return true
  }

  private focusTypeaheadOption(currentItem?: HTMLElement): void {
    const items = this.getEnabledItems()

    if (!items.length || !this.typeahead) return

    const current = currentItem ?? this.getSelectedItem() ?? items[0]

    if (!current) return

    const currentIndex = items.indexOf(current)
    const startIndex = Math.max(0, currentIndex + 1)
    const orderedItems = [...items.slice(startIndex), ...items.slice(0, startIndex)]
    const nextItem = orderedItems.find(item => item.textContent.trim().toLowerCase().startsWith(this.typeahead))

    nextItem?.focus()
  }
}

class LumenDataTableBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    if (this.hasAttribute('selectable') && this.dataset.uiDatatableSelectable !== 'true') {
      this.dataset.uiDatatableSelectable = 'true'
    }

    if (this.hasAttribute('name') && !this.dataset.uiDatatableName) {
      this.dataset.uiDatatableName = this.getAttribute('name') ?? ''
    }

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupDataTable(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }

  private setupDataTable(signal: AbortSignal): void {
    const table = this.querySelector<HTMLTableElement>('table')

    if (!table) return

    this.setupSelection(table, signal)

    this.setupSorting(table, signal)
  }

  private setupSorting(table: HTMLTableElement, signal: AbortSignal): void {
    const body = table.tBodies[0]

    if (!body) return

    for (const [index, row] of [...body.rows].entries()) {
      row.dataset.uiDatatableIndex = row.dataset.uiDatatableIndex ?? String(index)
    }

    const headers = [...table.querySelectorAll<HTMLTableCellElement>('thead th')].filter(header =>
      header.dataset.uiDatatableSortable === 'true' ||
      header.dataset.sortable === 'true' ||
      header.hasAttribute('data-sortable')
    )

    for (const header of headers) {
      const row = header.parentElement
      const columnIndex = row ? [...row.children].indexOf(header) : -1

      if (columnIndex < 0) continue

      header.dataset.uiDatatableColumn = String(columnIndex)

      header.setAttribute('aria-sort', header.getAttribute('aria-sort') ?? 'none')

      const button = this.ensureSortButton(header)

      button.addEventListener('click', () => {
        const nextDirection = getNextDataTableSortDirection(
          this.dataset.uiDatatableSortColumn,
          columnIndex,
          header.getAttribute('aria-sort')
        )

        this.updateSort(table, header, nextDirection)

        this.sortRows(table, header, columnIndex, nextDirection)
      }, { signal })
    }
  }

  private ensureSortButton(header: HTMLTableCellElement): HTMLButtonElement {
    const existing = header.querySelector<HTMLButtonElement>('[data-ui-datatable-sort]')

    if (existing) return existing

    const button = document.createElement('button')

    button.type = 'button'

    button.className = 'ui-data-table__sort'

    button.dataset.uiDatatableSort = ''

    while (header.firstChild) {
      button.append(header.firstChild)
    }

    header.append(button)

    return button
  }

  private updateSort(
    table: HTMLTableElement,
    header: HTMLTableCellElement,
    direction: DataTableSortDirection
  ): void {
    for (const item of table.querySelectorAll<HTMLTableCellElement>('thead th[aria-sort]')) {
      item.setAttribute('aria-sort', item === header ? direction : 'none')

      item.dataset.sort = item === header ? direction : 'none'
    }

    this.dataset.uiDatatableSortDirection = direction

    if (direction === 'none') {
      delete this.dataset.uiDatatableSortColumn
    } else {
      this.dataset.uiDatatableSortColumn = header.dataset.uiDatatableColumn ?? ''
    }
  }

  private sortRows(
    table: HTMLTableElement,
    header: HTMLTableCellElement,
    columnIndex: number,
    direction: DataTableSortDirection
  ): void {
    const body = table.tBodies[0]

    if (!body) return

    const rows = [...body.rows]
    const sortType = header.dataset.uiDatatableSortType

    rows.sort((row, other) => {
      if (direction === 'none') {
        return Number(row.dataset.uiDatatableIndex ?? '0') - Number(other.dataset.uiDatatableIndex ?? '0')
      }

      const result = compareDataTableValues(
        getDataTableSortValue(row.cells[columnIndex]),
        getDataTableSortValue(other.cells[columnIndex]),
        sortType
      )

      return (direction === 'ascending' ? result : -result) ||
        Number(row.dataset.uiDatatableIndex ?? '0') - Number(other.dataset.uiDatatableIndex ?? '0')
    })

    for (const row of rows) {
      body.append(row)
    }
  }

  private setupSelection(table: HTMLTableElement, signal: AbortSignal): void {
    const selectable = this.dataset.uiDatatableSelectable === 'true' || this.hasAttribute('selectable')

    if (!selectable) return

    const headRow = table.tHead?.rows[0]
    const body = table.tBodies[0]

    if (!headRow || !body) return

    const selectAll = this.ensureSelectAll(headRow)

    for (const [index, row] of getDataTableRows(table).entries()) {
      const checkbox = this.ensureRowSelect(row, index)

      checkbox.addEventListener('change', () => { this.syncSelection(table, selectAll, true); }, { signal })
    }

    selectAll.addEventListener('change', () => {
      for (const checkbox of table.querySelectorAll<HTMLInputElement>('[data-ui-datatable-row-select]')) {
        checkbox.checked = selectAll.checked
      }

      this.syncSelection(table, selectAll, true)
    }, { signal })

    this.closest('form')?.addEventListener('reset', () => {
      globalThis.setTimeout(() => { this.syncSelection(table, selectAll, true); })
    }, { signal })

    this.syncSelection(table, selectAll)
  }

  private ensureSelectAll(headRow: HTMLTableRowElement): HTMLInputElement {
    const existing = headRow.querySelector<HTMLInputElement>('[data-ui-datatable-select-all]')

    if (existing) return existing

    const headerCell = document.createElement('th')
    const selectAll = document.createElement('input')

    headerCell.className = 'ui-data-table__selection'

    headerCell.scope = 'col'

    selectAll.type = 'checkbox'

    selectAll.className = 'ui-data-table__checkbox'

    selectAll.dataset.uiDatatableSelectAll = ''

    selectAll.setAttribute('aria-label', 'Select all rows')

    headerCell.append(selectAll)

    headRow.prepend(headerCell)

    return selectAll
  }

  private ensureRowSelect(row: HTMLTableRowElement, index: number): HTMLInputElement {
    const existing = row.querySelector<HTMLInputElement>('[data-ui-datatable-row-select]')

    row.dataset.uiDatatableRow = ''

    row.dataset.value = getDataTableRowValue(row, index)

    if (existing) return existing

    const cell = document.createElement('td')
    const checkbox = document.createElement('input')
    const selected = row.dataset.state === 'selected' || row.getAttribute('aria-selected') === 'true'

    cell.className = 'ui-data-table__selection'

    checkbox.type = 'checkbox'

    checkbox.className = 'ui-data-table__checkbox'

    checkbox.dataset.uiDatatableRowSelect = ''

    checkbox.checked = selected

    checkbox.defaultChecked = selected

    checkbox.setAttribute('aria-label', `Select row ${index + 1}`)

    cell.append(checkbox)

    row.prepend(cell)

    return checkbox
  }

  private syncSelection(
    table: HTMLTableElement,
    selectAll: HTMLInputElement,
    dispatch = false
  ): void {
    const rows = getDataTableRows(table)
    const selectedValues: string[] = []

    for (const [index, row] of rows.entries()) {
      const checkbox = row.querySelector<HTMLInputElement>('[data-ui-datatable-row-select]')
      const selected = checkbox?.checked === true

      row.setAttribute('aria-selected', String(selected))

      if (selected) {
        row.dataset.state = 'selected'

        selectedValues.push(getDataTableRowValue(row, index))
      } else {
        delete row.dataset.state
      }
    }

    selectAll.checked = rows.length > 0 && selectedValues.length === rows.length

    selectAll.indeterminate = selectedValues.length > 0 && selectedValues.length < rows.length

    this.syncSelectionInputs(selectedValues)

    if (dispatch) {
      this.dispatchEvent(new CustomEvent('ui-datatable-selectionchange', {
        bubbles: true,
        detail: { values: selectedValues }
      }))
    }
  }

  private syncSelectionInputs(selectedValues: string[]): void {
    const name = this.dataset.uiDatatableName
    let inputs = this.querySelector<HTMLElement>('[data-ui-datatable-inputs]')

    if (name) {
      if (!inputs) {
        inputs = document.createElement('div')

        inputs.hidden = true

        inputs.dataset.uiDatatableInputs = ''

        this.append(inputs)
      }

      inputs.replaceChildren(...selectedValues.map(value => {
        const input = document.createElement('input')

        input.type = 'hidden'

        input.name = name

        input.value = value

        return input
      }))
    } else {
      inputs?.replaceChildren()
    }
  }
}

class LumenVirtualListBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupVirtualList(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }

  private setupVirtualList(signal: AbortSignal): void {
    const items = [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement)

    if (!items.length) return

    const update = (): void => {
      const overscan = this.getNumberAttribute('data-ui-overscan', 'overscan', 4, 0)
      const itemSize = this.getNumberAttribute('data-ui-item-size', 'item-size', 44)
      const range = getVirtualRange(this.scrollTop, this.clientHeight, itemSize, items.length, overscan)

      for (const [index, item] of items.entries()) {
        item.hidden = index < range.startIndex || index > range.endIndex
      }

      this.dispatchEvent(new CustomEvent('ui:virtual-list-range', {
        bubbles: true,
        detail: range
      }))
    }

    this.addEventListener('scroll', update, { passive: true, signal })

    update()
  }

  private getNumberAttribute(dataAttribute: string, attribute: string, fallback: number, minimum = 1): number {
    const value = Number(this.getAttribute(dataAttribute) ?? this.getAttribute(attribute) ?? fallback)

    return Number.isFinite(value) && value >= minimum ? value : fallback
  }
}

class LumenThemeBuilderBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private currentExportFormat: LumenThemeBuilderExportFormat = 'css'
  private currentExportValue = ''
  private currentScheme: LumenThemeBuilderScheme = 'light'
  private currentTokens: LumenThemeTokens | null = null

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupThemeBuilder(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }

  private setupThemeBuilder(signal: AbortSignal): void {
    const brandHue = this.querySelector<HTMLInputElement>('[data-ui-theme-brand-hue], [data-ui-theme-hue]')
    const brandHueNumber = this.querySelector<HTMLInputElement>('[data-ui-theme-brand-hue-number]')
    const accentHue = this.querySelector<HTMLInputElement>('[data-ui-theme-accent-hue]')
    const accentHueNumber = this.querySelector<HTMLInputElement>('[data-ui-theme-accent-hue-number]')
    const primaryColor = this.querySelector<HTMLInputElement>('[data-ui-theme-primary-color]')
    const primaryHex = this.querySelector<HTMLInputElement>('[data-ui-theme-primary-hex]')
    const secondaryColor = this.querySelector<HTMLInputElement>('[data-ui-theme-secondary-color]')
    const secondaryHex = this.querySelector<HTMLInputElement>('[data-ui-theme-secondary-hex]')
    const exportButton = this.querySelector<HTMLButtonElement>('[data-ui-theme-export]')
    const output = this.querySelector<HTMLTextAreaElement | HTMLOutputElement>('[data-ui-theme-output]')
    const exportFormatButtons = [...this.querySelectorAll<HTMLButtonElement>('[data-ui-theme-export-format]')]
    const modeButtons = [...this.querySelectorAll<HTMLButtonElement>('[data-ui-theme-mode]')]
    const schemeButtons = [...this.querySelectorAll<HTMLButtonElement>('[data-ui-theme-scheme]')]

    this.currentExportFormat = coerceThemeBuilderExportFormat(
      this.getButtonValue(exportFormatButtons, 'data-ui-theme-export-format', 'css')
    )

    this.currentScheme = coerceThemeBuilderScheme(
      this.getButtonValue(schemeButtons, 'data-ui-theme-scheme', this.getDefaultScheme())
    )

    const update = (dispatch = true): void => {
      const result = createThemeBuilderTokens({
        accentHue: accentHue?.value ?? accentHueNumber?.value ?? this.getAttribute('data-ui-theme-accent-hue') ?? null,
        hue: brandHue?.value ?? brandHueNumber?.value ?? this.getAttribute('data-ui-theme-brand-hue') ?? this.getAttribute('data-ui-theme-hue') ?? null,
        mode: this.getButtonValue(modeButtons, 'data-ui-theme-mode', 'generated'),
        primaryColor: primaryHex?.value ?? primaryColor?.value ?? null,
        scheme: this.currentScheme,
        secondaryColor: secondaryHex?.value ?? secondaryColor?.value ?? null
      })

      this.currentScheme = result.scheme

      this.currentTokens = result.tokens

      const target = this.getTarget()

      if (target) {
        this.applyTokens(target, result.tokens, result.scheme)
      }

      this.writeExport(output)

      if (dispatch) {
        this.dispatchEvent(new CustomEvent('ui:theme-change', {
          bubbles: true,
          detail: result
        }))
      }
    }

    this.bindHueInputs(brandHue, brandHueNumber, update, signal)

    this.bindHueInputs(accentHue, accentHueNumber, update, signal)

    this.bindHexInputs(primaryColor, primaryHex, update, signal)

    this.bindHexInputs(secondaryColor, secondaryHex, update, signal)

    for (const button of exportFormatButtons) {
      button.addEventListener('click', () => {
        this.currentExportFormat = coerceThemeBuilderExportFormat(button.getAttribute('data-ui-theme-export-format'))

        this.setPressedState(exportFormatButtons, 'data-ui-theme-export-format', this.currentExportFormat)

        this.writeExport(output)
      }, { signal })
    }

    for (const button of modeButtons) {
      button.addEventListener('click', () => {
        this.setPressedState(modeButtons, 'data-ui-theme-mode', coerceThemeBuilderMode(button.getAttribute('data-ui-theme-mode')))

        update()
      }, { signal })
    }

    for (const button of schemeButtons) {
      button.addEventListener('click', () => {
        this.currentScheme = coerceThemeBuilderScheme(button.getAttribute('data-ui-theme-scheme'))

        this.setPressedState(schemeButtons, 'data-ui-theme-scheme', this.currentScheme)

        update()
      }, { signal })
    }

    exportButton?.addEventListener('click', () => {
      if (this.currentTokens) {
        this.writeExport(output)
      } else {
        update(false)
      }

      const value = output?.value || this.currentExportValue

      navigator.clipboard.writeText(value).catch(() => null)

      this.dispatchEvent(new CustomEvent('ui:theme-export', {
        bubbles: true,
        detail: {
          css: this.currentExportFormat === 'css' ? value : undefined,
          format: this.currentExportFormat,
          tokens: this.currentTokens,
          value
        }
      }))
    }, { signal })

    update(false)
  }

  private getDefaultScheme(): LumenThemeBuilderScheme {
    return document.documentElement.dataset.theme?.includes('dark') ? 'dark' : 'light'
  }

  private getTarget(): HTMLElement | null {
    const selector = this.dataset.uiThemeTarget

    if (!selector) return document.documentElement

    try {
      return document.querySelector<HTMLElement>(selector)
    } catch {
      return null
    }
  }

  private getButtonValue(buttons: HTMLButtonElement[], attribute: string, fallback: string): string {
    const activeButton = buttons.find(button =>
      button.getAttribute('aria-selected') === 'true' ||
      button.getAttribute('aria-pressed') === 'true'
    )

    return activeButton?.getAttribute(attribute) ?? this.getAttribute(attribute) ?? fallback
  }

  private setPressedState(buttons: HTMLButtonElement[], attribute: string, value: string): void {
    for (const button of buttons) {
      const isPressed = button.getAttribute(attribute) === value

      if (button.hasAttribute('aria-pressed')) {
        button.setAttribute('aria-pressed', String(isPressed))
      }

      button.classList.toggle('ui-button--secondary', isPressed)

      button.classList.toggle('ui-button--outline', !isPressed)
    }
  }

  private bindHueInputs(
    range: HTMLInputElement | null,
    number: HTMLInputElement | null,
    onChange: () => void,
    signal: AbortSignal
  ): void {
    const sync = (source: HTMLInputElement, target: HTMLInputElement | null): void => {
      if (target) {
        target.value = source.value
      }

      onChange()
    }

    range?.addEventListener('input', () => { sync(range, number); }, { signal })

    number?.addEventListener('input', () => { sync(number, range); }, { signal })
  }

  private bindHexInputs(
    color: HTMLInputElement | null,
    text: HTMLInputElement | null,
    onChange: () => void,
    signal: AbortSignal
  ): void {
    color?.addEventListener('input', () => {
      if (text) {
        text.value = color.value

        text.removeAttribute('aria-invalid')
      }

      onChange()
    }, { signal })

    text?.addEventListener('input', () => {
      const normalized = normalizeThemeBuilderHex(text.value)

      if (normalized) {
        if (color) color.value = normalized

        text.removeAttribute('aria-invalid')

        onChange()
      } else {
        text.setAttribute('aria-invalid', 'true')
      }
    }, { signal })
  }

  private applyTokens(
    target: HTMLElement,
    tokens: LumenThemeTokens,
    scheme: LumenThemeBuilderScheme
  ): void {
    target.style.colorScheme = scheme

    for (const [token, value] of Object.entries(tokens)) {
      target.style.setProperty(`--${token}`, value)
    }
  }

  private writeExport(output: HTMLTextAreaElement | HTMLOutputElement | null): void {
    if (!this.currentTokens) return

    this.currentExportValue = exportThemeBuilderValue(
      this.currentTokens,
      this.currentScheme,
      this.currentExportFormat
    )

    if (output) {
      output.value = this.currentExportValue
    }
  }
}

class LumenTooltipBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private showTimer: ReturnType<typeof globalThis.setTimeout> | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.setupTooltip(this.abortController.signal)
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    this.clearTimer()
  }

  private setupTooltip(signal: AbortSignal): void {
    const tip = this.querySelector<HTMLElement>('[role="tooltip"]')
    const trigger = this.querySelector<HTMLElement>('[data-ui-tooltip-trigger], [data-ui-trigger], button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])')

    if (!tip) return

    if (trigger && !trigger.closest('[role="tooltip"]')) {
      if (!tip.id) {
        tip.id = createId('ui-tooltip')
      }

      const describedBy = new Set((trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean))

      describedBy.add(tip.id)

      trigger.setAttribute('aria-describedby', [...describedBy].join(' '))
    }

    const show = (delay: number): void => {
      this.clearTimer()

      this.showTimer = globalThis.setTimeout(() => {
        tip.style.removeProperty('visibility')
      }, delay)
    }

    const hide = (): void => {
      this.clearTimer()

      tip.style.visibility = 'hidden'
    }

    this.addEventListener('mouseenter', () => { show(250); }, { signal })

    this.addEventListener('mouseleave', hide, { signal })

    this.addEventListener('focusin', () => { show(0); }, { signal })

    this.addEventListener('focusout', hide, { signal })

    this.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        hide()
      }
    }, { signal })
  }

  private clearTimer(): void {
    if (!this.showTimer) return

    globalThis.clearTimeout(this.showTimer)

    this.showTimer = undefined
  }
}

class LumenSonnerBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    normalizeToastViewport(this)

    installToastController()
  }
}

class LumenToastBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.dataset.uiToast = ''

    this.setAttribute('role', this.getAttribute('role') ?? (this.getAttribute('variant') === 'destructive' ? 'alert' : 'status'))

    this.setAttribute('aria-live', this.getAttribute('aria-live') ?? (this.getAttribute('variant') === 'destructive' ? 'assertive' : 'polite'))

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return

      event.preventDefault()

      dismissToastElement(this)
    }, { signal: this.abortController.signal })
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    clearToastTimer(this)
  }
}

const createLumenElementClass = (config: LumenElementConfig) =>
  class extends LumenElement {
    static override config = config
  }

const createLumenBehaviorElementClass = (
  BaseElement: typeof LumenElement,
  config: LumenElementConfig
) =>
  class extends BaseElement {
    static override config = config
  }

const behaviorElementClasses: Partial<Record<LumenComponentName, typeof LumenElement>> = {
  AlertDialog: LumenDialogBehaviorElement,
  DataTable: LumenDataTableBehaviorElement,
  Dialog: LumenDialogBehaviorElement,
  DropdownMenu: LumenDisclosureBehaviorElement,
  Popover: LumenDisclosureBehaviorElement,
  Select: LumenSelectBehaviorElement,
  Sonner: LumenSonnerBehaviorElement,
  Tabs: LumenTabsBehaviorElement,
  ThemeBuilder: LumenThemeBuilderBehaviorElement,
  Toast: LumenToastBehaviorElement,
  Tooltip: LumenTooltipBehaviorElement,
  VirtualList: LumenVirtualListBehaviorElement
}

const elementClasses = Object.fromEntries(
  lumenComponentNames.map(componentName => {
    const behaviorClass = behaviorElementClasses[componentName]

    if (behaviorClass) {
      return [componentName, createLumenBehaviorElementClass(behaviorClass, elementConfigs[componentName])]
    }

    return [componentName, createLumenElementClass(elementConfigs[componentName])]
  })
) as Record<LumenComponentName, typeof LumenElement>

const elementDefinitions = lumenComponentNames.map(componentName => {
  const config = elementConfigs[componentName]

  return [config.tagName, elementClasses[componentName]] as const
})

export const defineLumenElements = (
  customElementsRegistry: CustomElementRegistry | undefined = typeof customElements === 'undefined'
    ? undefined
    : customElements
) => {
  if (!customElementsRegistry) return

  for (const [name, element] of elementDefinitions) {
    if (!registry.has(name) && !customElementsRegistry.get(name)) {
      customElementsRegistry.define(name, element)

      registry.add(name)
    }
  }

  installToastController()

  installFormController()
}

export const lumenElementDefinitions = elementDefinitions

export const LumenAccordionElement = elementClasses.Accordion
export const LumenAlertElement = elementClasses.Alert
export const LumenAlertDialogElement = elementClasses.AlertDialog
export const LumenAgendaElement = elementClasses.Agenda
export const LumenAspectRatioElement = elementClasses.AspectRatio
export const LumenAttachmentElement = elementClasses.Attachment
export const LumenAutocompleteElement = elementClasses.Autocomplete
export const LumenAvatarElement = elementClasses.Avatar
export const LumenBadgeElement = elementClasses.Badge
export const LumenBreadcrumbElement = elementClasses.Breadcrumb
export const LumenBubbleElement = elementClasses.Bubble
export const LumenButtonElement = elementClasses.Button
export const LumenButtonGroupElement = elementClasses.ButtonGroup
export const LumenCalendarElement = elementClasses.Calendar
export const LumenCardElement = elementClasses.Card
export const LumenCarouselElement = elementClasses.Carousel
export const LumenChartElement = elementClasses.Chart
export const LumenCheckboxElement = elementClasses.Checkbox
export const LumenCollapsibleElement = elementClasses.Collapsible
export const LumenCodeElement = elementClasses.Code
export const LumenComboboxElement = elementClasses.Combobox
export const LumenCommandElement = elementClasses.Command
export const LumenColorPickerElement = elementClasses.ColorPicker
export const LumenContextMenuElement = elementClasses.ContextMenu
export const LumenDataTableElement = elementClasses.DataTable
export const LumenDatePickerElement = elementClasses.DatePicker
export const LumenDateRangePickerElement = elementClasses.DateRangePicker
export const LumenDialogElement = elementClasses.Dialog
export const LumenDirectionElement = elementClasses.Direction
export const LumenDrawerElement = elementClasses.Drawer
export const LumenDropdownMenuElement = elementClasses.DropdownMenu
export const LumenEmptyElement = elementClasses.Empty
export const LumenFieldElement = elementClasses.Field
export const LumenHoverCardElement = elementClasses.HoverCard
export const LumenInputElement = elementClasses.Input
export const LumenInputGroupElement = elementClasses.InputGroup
export const LumenInputOTPElement = elementClasses.InputOTP
export const LumenNumberFieldElement = elementClasses.NumberField
export const LumenItemElement = elementClasses.Item
export const LumenKbdElement = elementClasses.Kbd
export const LumenLabelElement = elementClasses.Label
export const LumenMarkerElement = elementClasses.Marker
export const LumenMenubarElement = elementClasses.Menubar
export const LumenMessageElement = elementClasses.Message
export const LumenMessageScrollerElement = elementClasses.MessageScroller
export const LumenNativeSelectElement = elementClasses.NativeSelect
export const LumenNavigationMenuElement = elementClasses.NavigationMenu
export const LumenPaginationElement = elementClasses.Pagination
export const LumenPopoverElement = elementClasses.Popover
export const LumenProgressElement = elementClasses.Progress
export const LumenRadioGroupElement = elementClasses.RadioGroup
export const LumenResizableElement = elementClasses.Resizable
export const LumenRichTextEditorElement = elementClasses.RichTextEditor
export const LumenScrollAreaElement = elementClasses.ScrollArea
export const LumenScheduleElement = elementClasses.Schedule
export const LumenSearchFieldElement = elementClasses.SearchField
export const LumenSelectElement = elementClasses.Select
export const LumenSeparatorElement = elementClasses.Separator
export const LumenSheetElement = elementClasses.Sheet
export const LumenSidebarElement = elementClasses.Sidebar
export const LumenSkeletonElement = elementClasses.Skeleton
export const LumenSliderElement = elementClasses.Slider
export const LumenSonnerElement = elementClasses.Sonner
export const LumenSpinnerElement = elementClasses.Spinner
export const LumenSwitchElement = elementClasses.Switch
export const LumenTableElement = elementClasses.Table
export const LumenTabsElement = elementClasses.Tabs
export const LumenTagGroupElement = elementClasses.TagGroup
export const LumenTextareaElement = elementClasses.Textarea
export const LumenThemeBuilderElement = elementClasses.ThemeBuilder
export const LumenTimeFieldElement = elementClasses.TimeField
export const LumenToastElement = elementClasses.Toast
export const LumenToggleElement = elementClasses.Toggle
export const LumenToggleGroupElement = elementClasses.ToggleGroup
export const LumenTooltipElement = elementClasses.Tooltip
export const LumenTreeElement = elementClasses.Tree
export const LumenTreeGridElement = elementClasses.TreeGrid
export const LumenTypographyElement = elementClasses.Typography
export const LumenVirtualListElement = elementClasses.VirtualList

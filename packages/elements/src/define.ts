/* eslint-disable complexity, @typescript-eslint/no-non-null-assertion */

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
  normalizeThemeBuilderHex,
  parseThemeCss,
  renderLumenIconSvg,
  scoreThemeContrast,
  tuneThemeContrast} from '@santi020k/lumen-core'

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

interface RichTextCommandDocument {
  execCommand?: (command: string) => boolean
}

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
const richTextEditorSelector = '[data-ui-rich-text-editor]'
const richTextEditorCommandSelector = '[data-ui-editor-command]'
const scheduleSelector = '[data-ui-schedule]'
const scheduleEventSelector = '[data-ui-schedule-event]'
const scheduleSlotSelector = '[data-ui-schedule-slot]'
const resizableSelector = '[data-ui-resizable]'
const resizableHandleSelector = '[data-ui-resizable-handle]'
const resizableHandleTemplateSelector = '[data-ui-resizable-handle-template]'
const contextMenuSelector = '[data-ui-context-menu]'
const contextMenuTriggerSelector = '[data-ui-context-menu-trigger]'
const dateRangePickerSelector = '[data-ui-date-range-picker]'
const dateRangePickerInputSelector = 'input[type="date"]'
const inputOtpSelector = '[data-ui-input-otp], lumen-input-otp'
const inputOtpNativeSelector = '[data-ui-input-otp-native]'
const inputOtpSegmentSelector = '[data-ui-input-otp-segment]'
const inputOtpSegmentsSelector = '[data-ui-input-otp-segments]'
const calendarSelector = '[data-ui-calendar], lumen-calendar'
const calendarInputSelector = '[data-ui-calendar-input]'
const calendarLabelSelector = '[data-ui-calendar-label]'
const calendarGridSelector = '[data-ui-calendar-grid]'
const calendarDaySelector = '[data-ui-calendar-day]'

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
  BackToTop: { baseClassName: 'ui-back-to-top', tagName: 'lumen-back-to-top' },
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
  Calendar: { attributeClasses: glassAttributeClasses('ui-calendar--glass'), baseClassName: 'ui-calendar', defaults: { 'data-ui-calendar': '' }, tagName: 'lumen-calendar' },
  Callout: { baseClassName: 'ui-callout', tagName: 'lumen-callout' },
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
    defaults: { 'data-ui-context-menu': '', role: 'menu', surface: 'default' },
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
  Eyebrow: { baseClassName: 'ui-eyebrow', tagName: 'lumen-eyebrow' },
  Field: { attributeClasses: glassAttributeClasses('ui-field--glass'), baseClassName: 'ui-field', defaults: { 'data-ui-field': '' }, tagName: 'lumen-field' },
  FloatingBadge: { baseClassName: 'ui-floating-badge', tagName: 'lumen-floating-badge' },
  FormattedDate: { baseClassName: 'ui-formatted-date', tagName: 'lumen-formatted-date' },
  HoverCard: {
    attributeClasses: {
      glass: { strong: 'ui-hover-card--glass ui-glass-strong', subtle: 'ui-hover-card--glass ui-glass-subtle', true: 'ui-hover-card--glass' },
      surface: { glass: 'ui-hover-card--glass' }
    },
    baseClassName: 'ui-hover-card',
    defaults: { 'data-ui-hover-card': '', surface: 'default' },
    tagName: 'lumen-hover-card'
  },
  Icon: {
    attributeClasses: {
      size: {
        lg: 'ui-icon--lg',
        sm: 'ui-icon--sm',
        xl: 'ui-icon--xl'
      }
    },
    baseClassName: 'ui-icon',
    defaults: { size: 'default' },
    tagName: 'lumen-icon'
  },
  Image: { baseClassName: 'ui-image', tagName: 'lumen-image' },
  Input: { attributeClasses: { size: { lg: 'ui-input--lg', sm: 'ui-input--sm' } }, baseClassName: 'ui-input', defaults: { type: 'text' }, tagName: 'lumen-input' },
  InputGroup: { baseClassName: 'ui-input-group', tagName: 'lumen-input-group' },
  InputOTP: { baseClassName: 'ui-input-otp-field', defaults: { 'data-ui-input-otp': '', 'data-ui-input-otp-length': '6' }, tagName: 'lumen-input-otp' },
  NumberField: { baseClassName: 'ui-input ui-number-field', defaults: { type: 'number' }, tagName: 'lumen-number-field' },
  Item: { attributeClasses: glassAttributeClasses('ui-item--glass'), baseClassName: 'ui-item', tagName: 'lumen-item' },
  Kbd: { baseClassName: 'ui-kbd', tagName: 'lumen-kbd' },
  Label: { baseClassName: 'ui-label', tagName: 'lumen-label' },
  Link: { baseClassName: 'ui-link', tagName: 'lumen-link' },
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
  Pill: { baseClassName: 'ui-pill', tagName: 'lumen-pill' },
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
  Prose: { baseClassName: 'ui-prose', tagName: 'lumen-prose' },
  RadioGroup: { baseClassName: 'ui-radio-group', defaults: { 'data-ui-radio-group': '' }, tagName: 'lumen-radio-group' },
  Resizable: {
    attributeClasses: { 'data-orientation': { vertical: 'ui-resizable--vertical' } },
    baseClassName: 'ui-resizable',
    defaults: { 'data-orientation': 'horizontal', 'data-ui-resizable': '', 'data-ui-resizable-reset': 'true' },
    tagName: 'lumen-resizable'
  },
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
  SkipLink: { baseClassName: 'ui-skip-link', tagName: 'lumen-skip-link' },
  Slider: { baseClassName: 'ui-slider', defaults: { type: 'range' }, tagName: 'lumen-slider' },
  Sonner: { baseClassName: 'ui-sonner', defaults: { 'data-ui-sonner': '' }, tagName: 'lumen-sonner' },
  Spinner: { baseClassName: 'ui-spinner', tagName: 'lumen-spinner' },
  Switch: { baseClassName: 'ui-switch', defaults: { role: 'switch', type: 'checkbox' }, tagName: 'lumen-switch' },
  Table: { attributeClasses: glassAttributeClasses('ui-table-wrap--glass'), baseClassName: 'ui-table-wrap', tagName: 'lumen-table' },
  Tabs: { attributeClasses: glassAttributeClasses('ui-tabs--glass'), baseClassName: 'ui-tabs', defaults: { 'data-ui-tabs': '' }, tagName: 'lumen-tabs' },
  TagGroup: { baseClassName: 'ui-tag-group', defaults: { role: 'list' }, tagName: 'lumen-tag-group' },
  Textarea: { baseClassName: 'ui-textarea', defaults: { rows: '4' }, tagName: 'lumen-textarea' },
  ThemeBuilder: { attributeClasses: glassAttributeClasses('ui-theme-builder--glass'), baseClassName: 'ui-theme-builder', defaults: { 'data-ui-theme-builder': '' }, tagName: 'lumen-theme-builder' },
  ThemeToggle: { baseClassName: 'ui-theme-toggle', tagName: 'lumen-theme-toggle' },
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
  'decorative',
  'disabled',
  'from',
  'glass',
  'label',
  'name',
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

const getClosestScopedElement = (
  scope: ParentNode,
  selector: string
): Element | null =>
  scope instanceof Element ? scope.closest(selector) : null

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

const executeRichTextCommand = (root: HTMLElement, command: string): void => {
  if (!command) return

  const commandDocument = document as unknown as RichTextCommandDocument

  if (typeof commandDocument.execCommand === 'function') {
    commandDocument.execCommand(command)
  }

  root.dispatchEvent(new CustomEvent('ui:editor-command', {
    bubbles: true,
    detail: { command }
  }))
}

const initRichTextEditors = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, richTextEditorSelector)
  const roots = getScopedElements<HTMLElement>(scope, richTextEditorSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    root.dataset.uiEditorBound = 'true'

    for (const control of root.querySelectorAll<HTMLElement>(richTextEditorCommandSelector)) {
      if (control.dataset.uiEditorCommandBound === 'true') continue

      control.dataset.uiEditorCommandBound = 'true'

      control.addEventListener('click', () => {
        executeRichTextCommand(root, control.dataset.uiEditorCommand ?? '')
      })
    }
  }
}

export const enhanceLumenRichTextEditors = (
  scope: ParentNode = document
): void => {
  initRichTextEditors(scope)
}

const installRichTextEditorController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsRichTextEditorsBound === 'true') return

  document.documentElement.dataset.uiElementsRichTextEditorsBound = 'true'

  enhanceLumenRichTextEditors(document)

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenRichTextEditors(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}

const getScheduleTransferValue = (event: HTMLElement): string =>
  event.id || event.textContent.trim()

const initSchedules = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, scheduleSelector)
  const roots = getScopedElements<HTMLElement>(scope, scheduleSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    root.dataset.uiScheduleBound = 'true'

    for (const scheduleEvent of root.querySelectorAll<HTMLElement>(scheduleEventSelector)) {
      if (scheduleEvent.dataset.uiScheduleEventBound === 'true') continue

      scheduleEvent.dataset.uiScheduleEventBound = 'true'

      scheduleEvent.draggable = scheduleEvent.draggable || scheduleEvent.dataset.uiDraggable === 'true'

      scheduleEvent.addEventListener('dragstart', event => {
        event.dataTransfer?.setData('text/plain', getScheduleTransferValue(scheduleEvent))

        root.dataset.uiDragging = 'true'
      })

      scheduleEvent.addEventListener('dragend', () => {
        delete root.dataset.uiDragging
      })
    }

    for (const slot of root.querySelectorAll<HTMLElement>(scheduleSlotSelector)) {
      if (slot.dataset.uiScheduleSlotBound === 'true') continue

      slot.dataset.uiScheduleSlotBound = 'true'

      slot.addEventListener('dragover', event => {
        event.preventDefault()

        slot.dataset.state = 'drag-over'
      })

      slot.addEventListener('dragleave', () => {
        delete slot.dataset.state
      })

      slot.addEventListener('drop', event => {
        event.preventDefault()

        delete slot.dataset.state

        const draggedId = event.dataTransfer?.getData('text/plain')
        const dragged = draggedId ? document.getElementById(draggedId) : null

        if (dragged instanceof HTMLElement) {
          slot.append(dragged)
        }

        root.dispatchEvent(new CustomEvent('ui:schedule-change', {
          bubbles: true,
          detail: {
            ...(draggedId ? { eventId: draggedId } : {}),
            ...(slot.dataset.uiScheduleSlot ? { slot: slot.dataset.uiScheduleSlot } : {})
          }
        }))
      })
    }
  }
}

export const enhanceLumenSchedules = (
  scope: ParentNode = document
): void => {
  initSchedules(scope)
}

const installScheduleController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsSchedulesBound === 'true') return

  document.documentElement.dataset.uiElementsSchedulesBound = 'true'

  enhanceLumenSchedules(document)

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenSchedules(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}

/* cspell:ignore valuenow */
/* eslint-disable @stylistic/padding-line-between-statements -- Resizable mirrors Astro's compact pane sizing runtime. */
const parseResizableNumberList = (value: string | undefined, count: number, fallback: number): number[] => {
  const values = (value ?? '')
    .split(',')
    .map(item => Number.parseFloat(item.trim()))
    .filter(Number.isFinite)

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

const getResizablePanes = (root: HTMLElement): HTMLElement[] =>
  [...root.children].filter((child): child is HTMLElement =>
    child instanceof HTMLElement &&
    !child.hasAttribute('data-ui-resizable-handle') &&
    !child.hasAttribute('data-ui-resizable-handle-template'))

const applyResizableSizes = (
  root: HTMLElement,
  panes: HTMLElement[],
  handles: HTMLElement[],
  sizes: number[],
  minSizes: number[],
  maxSizes: number[]
): void => {
  for (const [index, pane] of panes.entries()) {
    pane.dataset.uiResizablePanel = ''
    pane.style.setProperty('--ui-resizable-size', `${sizes[index] ?? 0}%`)
  }

  for (const handle of handles) {
    const index = Number.parseInt(handle.dataset.index ?? '0', 10)

    handle.setAttribute('aria-valuemin', String(Math.round(minSizes[index] ?? 0)))
    handle.setAttribute('aria-valuemax', String(Math.round(maxSizes[index] ?? 100)))
    handle.setAttribute('aria-valuenow', String(Math.round(sizes[index] ?? 0)))
  }
}

const resizeResizablePair = (
  sizes: number[],
  minSizes: number[],
  maxSizes: number[],
  index: number,
  nextSize: number
): void => {
  const nextIndex = index + 1
  const total = (sizes[index] ?? 0) + (sizes[nextIndex] ?? 0)
  const min = Math.max(minSizes[index] ?? 0, total - (maxSizes[nextIndex] ?? 100))
  const max = Math.min(maxSizes[index] ?? 100, total - (minSizes[nextIndex] ?? 0))
  const paneSize = Math.min(max, Math.max(min, nextSize))

  sizes[index] = paneSize
  sizes[nextIndex] = total - paneSize
}

const createResizableHandle = (
  root: HTMLElement,
  index: number,
  separatorOrientation: 'horizontal' | 'vertical'
): HTMLButtonElement => {
  const template = root.querySelector<HTMLTemplateElement>(`:scope > ${resizableHandleTemplateSelector}`)
  const handleFromTemplate = template?.content
    .querySelector<HTMLButtonElement>(resizableHandleSelector)
    ?.cloneNode(true)
  const handle = handleFromTemplate instanceof HTMLButtonElement
    ? handleFromTemplate
    : document.createElement('button')

  handle.type = 'button'
  handle.className = 'ui-resizable__handle'
  handle.dataset.uiResizableHandle = ''
  handle.dataset.index = String(index)
  handle.tabIndex = 0
  handle.setAttribute('aria-label', `Resize panel ${index + 1}`)
  handle.setAttribute('role', 'separator')
  handle.setAttribute('aria-orientation', separatorOrientation)

  return handle
}

const initResizableGroups = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, resizableSelector)
  const roots = getScopedElements<HTMLElement>(scope, resizableSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    if (root.dataset.uiBound === 'true') continue

    if (root.getAttribute('direction') === 'vertical') {
      root.dataset.orientation = 'vertical'
    }

    const panes = getResizablePanes(root)

    if (panes.length < 2) continue

    root.dataset.uiBound = 'true'
    root.dataset.uiResizableEnhanced = 'true'
    root.classList.toggle('ui-resizable--vertical', root.dataset.orientation === 'vertical')

    const direction = root.dataset.orientation === 'vertical' ? 'vertical' : 'horizontal'
    const separatorOrientation = direction === 'horizontal' ? 'vertical' : 'horizontal'
    const axis = direction === 'horizontal' ? 'clientX' : 'clientY'
    const sizeProperty = direction === 'horizontal' ? 'width' : 'height'
    const minSizes = parseResizableNumberList(root.dataset.uiResizableMinSize, panes.length, 12)
    const maxSizes = parseResizableNumberList(root.dataset.uiResizableMaxSize, panes.length, 88)
    const initialSizes = normalizeResizableSizes(
      parseResizableNumberList(root.dataset.uiResizableDefaultSizes, panes.length, 100 / panes.length),
      panes.length
    )
    let sizes = [...initialSizes]
    const handles: HTMLElement[] = []

    for (const [index, pane] of panes.entries()) {
      pane.dataset.uiResizablePanel = ''

      if (index >= panes.length - 1) continue

      const existingHandle = pane.nextElementSibling instanceof HTMLElement &&
        pane.nextElementSibling.matches(resizableHandleSelector)
        ? pane.nextElementSibling as HTMLButtonElement
        : null
      const handle = existingHandle ?? createResizableHandle(root, index, separatorOrientation)

      if (!existingHandle) {
        pane.after(handle)
      }

      handles.push(handle)

      let startPosition = 0
      let startSize = 0
      let containerSize = 1

      const applySizes = (): void => {
        applyResizableSizes(root, panes, handles, sizes, minSizes, maxSizes)
      }

      const resizePair = (nextSize: number): void => {
        resizeResizablePair(sizes, minSizes, maxSizes, index, nextSize)
        applySizes()
      }

      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0) return

        event.preventDefault()

        startPosition = event[axis]
        startSize = sizes[index] ?? 0
        containerSize = Math.max(1, root.getBoundingClientRect()[sizeProperty])
        root.dataset.resizing = 'true'
        handle.dataset.active = 'true'
        handle.setPointerCapture(event.pointerId)
      })

      handle.addEventListener('pointermove', event => {
        if (handle.dataset.active !== 'true') return

        const delta = ((event[axis] - startPosition) / containerSize) * 100

        resizePair(startSize + delta)
      })

      handle.addEventListener('pointerup', event => {
        if (handle.dataset.active !== 'true') return

        delete handle.dataset.active
        delete root.dataset.resizing
        handle.releasePointerCapture(event.pointerId)
      })

      handle.addEventListener('dblclick', () => {
        if (root.dataset.uiResizableReset !== 'true') return

        sizes = [...initialSizes]
        applySizes()
      })

      handle.addEventListener('keydown', event => {
        const step = event.shiftKey ? 10 : 2
        const keyDeltas: Record<string, number> = direction === 'horizontal'
          ? { ArrowLeft: -step, ArrowRight: step }
          : { ArrowDown: step, ArrowUp: -step }

        if (event.key === 'Home') {
          event.preventDefault()

          resizePair(minSizes[index] ?? 0)

          return
        }

        if (event.key === 'End') {
          event.preventDefault()

          resizePair(maxSizes[index] ?? 100)

          return
        }

        const delta = keyDeltas[event.key]

        if (delta === undefined) return

        event.preventDefault()

        resizePair((sizes[index] ?? 0) + delta)
      })
    }

    applyResizableSizes(root, panes, handles, sizes, minSizes, maxSizes)
  }
}

export const enhanceLumenResizable = (
  scope: ParentNode = document
): void => {
  initResizableGroups(scope)
}

const installResizableController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsResizableBound === 'true') return

  document.documentElement.dataset.uiElementsResizableBound = 'true'

  enhanceLumenResizable(document)

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenResizable(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}
/* eslint-enable @stylistic/padding-line-between-statements */

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

const syncDateRangePicker = (root: HTMLElement): void => {
  const inputs = [...root.querySelectorAll<HTMLInputElement>(dateRangePickerInputSelector)]
  const start = inputs[0]
  const end = inputs.at(-1)

  if (!start || !end || start === end) return

  if (start.value) {
    end.min = start.value
  } else {
    end.removeAttribute('min')
  }

  if (end.value) {
    start.max = end.value
  } else {
    start.removeAttribute('max')
  }

  if (start.value && end.value && end.value < start.value) {
    end.value = start.value
  }
}

const initDateRangePickers = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, dateRangePickerSelector)
  const roots = getScopedElements<HTMLElement>(scope, dateRangePickerSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    for (const input of root.querySelectorAll<HTMLInputElement>(dateRangePickerInputSelector)) {
      if (input.dataset.uiDateRangeInputBound === 'true') continue

      input.dataset.uiDateRangeInputBound = 'true'

      input.addEventListener('change', () => {
        syncDateRangePicker(root)
      })
    }

    syncDateRangePicker(root)
  }
}

export const enhanceLumenDateRangePickers = (
  scope: ParentNode = document
): void => {
  initDateRangePickers(scope)
}

const installDateRangePickerController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsDateRangePickersBound === 'true') return

  document.documentElement.dataset.uiElementsDateRangePickersBound = 'true'

  enhanceLumenDateRangePickers(document)

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenDateRangePickers(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}

/* eslint-disable @stylistic/padding-line-between-statements, unicorn/consistent-function-scoping -- InputOTP mirrors Astro's compact DOM synchronization runtime. */
const defaultInputOtpLength = 6
const defaultInputOtpPattern = '[0-9]*'

const normalizeInputOtpLength = (value: string | null | undefined): number =>
  Math.max(1, Number.parseInt(value ?? '', 10) || defaultInputOtpLength)

const getInputOtpLength = (root: HTMLElement): number =>
  normalizeInputOtpLength(
    root.getAttribute('length') ?? root.getAttribute('maxlength') ?? root.dataset.uiInputOtpLength
  )

const sanitizeInputOtpValue = (input: HTMLInputElement, value: string, length: number): string => {
  const numericOnly = input.inputMode === 'numeric' || input.getAttribute('pattern') === defaultInputOtpPattern
  const normalized = numericOnly ? value.replaceAll(/\D/g, '') : value.replaceAll(/\s/g, '')

  return normalized.slice(0, length)
}

const createInputOtpSegment = (index: number): HTMLButtonElement => {
  const segment = document.createElement('button')
  const char = document.createElement('span')

  segment.ariaHidden = 'true'
  segment.className = 'ui-input-otp__segment'
  segment.dataset.index = String(index)
  segment.dataset.uiInputOtpSegment = ''
  segment.tabIndex = -1
  segment.type = 'button'

  char.dataset.uiInputOtpChar = ''
  char.textContent = '\u00a0'

  segment.append(char)

  return segment
}

const copyInputOtpAttribute = (
  root: HTMLElement,
  input: HTMLInputElement,
  name: string
): void => {
  if (!root.hasAttribute(name) || input.hasAttribute(name)) return

  input.setAttribute(name, root.getAttribute(name) ?? '')
}

const ensureInputOtpNativeInput = (
  root: HTMLElement,
  length: number
): HTMLInputElement => {
  let input = root.querySelector<HTMLInputElement>(inputOtpNativeSelector)
  const created = !input

  if (!input) {
    input = document.createElement('input')

    root.prepend(input)
  }

  input.classList.add('ui-input-otp', 'ui-input-otp__native')
  input.dataset.uiInputOtpNative = ''

  if (!input.hasAttribute('autocomplete')) {
    input.setAttribute('autocomplete', root.getAttribute('autocomplete') ?? 'one-time-code')
  }

  if (!input.hasAttribute('inputmode')) {
    input.setAttribute('inputmode', root.getAttribute('inputmode') ?? 'numeric')
  }

  if (!input.hasAttribute('maxlength')) {
    input.setAttribute('maxlength', root.getAttribute('maxlength') ?? root.getAttribute('length') ?? String(length))
  }

  if (!input.hasAttribute('pattern')) {
    input.setAttribute('pattern', root.getAttribute('pattern') ?? defaultInputOtpPattern)
  }

  if (!input.hasAttribute('type')) {
    input.setAttribute('type', 'text')
  }

  for (const name of ['aria-describedby', 'aria-label', 'name', 'placeholder']) {
    copyInputOtpAttribute(root, input, name)
  }

  input.disabled = root.hasAttribute('disabled') || input.disabled
  input.required = root.hasAttribute('required') || input.required

  if (root.hasAttribute('aria-invalid') && !input.hasAttribute('aria-invalid')) {
    input.setAttribute('aria-invalid', root.getAttribute('aria-invalid') ?? 'true')
  }

  if (created && root.hasAttribute('value')) {
    input.value = root.getAttribute('value') ?? ''
  }

  return input
}

const ensureInputOtpSegmentsRoot = (root: HTMLElement): HTMLElement => {
  let segmentsRoot = root.querySelector<HTMLElement>(inputOtpSegmentsSelector)

  if (!segmentsRoot) {
    segmentsRoot = document.createElement('div')

    root.append(segmentsRoot)
  }

  segmentsRoot.classList.add('ui-input-otp__segments')
  segmentsRoot.dataset.uiInputOtpSegments = ''

  return segmentsRoot
}

const ensureInputOtpSegments = (
  segmentsRoot: HTMLElement,
  length: number
): HTMLButtonElement[] => {
  const segments = [...segmentsRoot.querySelectorAll<HTMLButtonElement>(inputOtpSegmentSelector)]

  for (let index = segments.length; index < length; index += 1) {
    const segment = createInputOtpSegment(index)

    segmentsRoot.append(segment)

    segments.push(segment)
  }

  for (const segment of segments.splice(length)) {
    segment.remove()
  }

  for (const [index, segment] of segments.entries()) {
    segment.classList.add('ui-input-otp__segment')
    segment.dataset.index = String(index)
    segment.dataset.uiInputOtpSegment = ''
    segment.setAttribute('aria-hidden', 'true')
    segment.tabIndex = -1
    segment.type = 'button'

    if (!segment.querySelector('[data-ui-input-otp-char]')) {
      const char = document.createElement('span')

      char.dataset.uiInputOtpChar = ''

      segment.append(char)
    }
  }

  return segments
}

const syncInputOtpSegments = (
  root: HTMLElement,
  input: HTMLInputElement,
  segments: HTMLButtonElement[],
  length: number
): void => {
  const value = sanitizeInputOtpValue(input, input.value, length)

  if (input.value !== value) {
    input.value = value
  }

  const activeIndex = Math.min(length - 1, Math.max(0, input.selectionStart ?? value.length))

  root.dataset.disabled = input.disabled ? 'true' : 'false'
  root.dataset.invalid = input.getAttribute('aria-invalid') === 'true' ? 'true' : 'false'

  for (const [index, segment] of segments.entries()) {
    const char = segment.querySelector<HTMLElement>('[data-ui-input-otp-char]')

    segment.disabled = input.disabled
    segment.dataset.active = String(document.activeElement === input && index === activeIndex)

    if (char) {
      char.textContent = value[index] ?? '\u00a0'
    }
  }
}

const initInputOtpFields = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, inputOtpSelector)
  const roots = getScopedElements<HTMLElement>(scope, inputOtpSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    if (root.dataset.uiBound === 'true') continue

    const length = getInputOtpLength(root)
    const input = ensureInputOtpNativeInput(root, length)
    const segmentsRoot = ensureInputOtpSegmentsRoot(root)
    const segments = ensureInputOtpSegments(segmentsRoot, length)

    root.dataset.uiBound = 'true'
    root.dataset.uiInputOtpLength = String(length)
    input.dataset.uiEnhanced = 'true'
    segmentsRoot.hidden = false

    const syncSegments = (): void => {
      syncInputOtpSegments(root, input, segments, length)
    }

    const setSelection = (index: number): void => {
      const position = Math.min(input.value.length, Math.max(0, index))

      input.focus({ preventScroll: true })

      input.setSelectionRange(position, position)

      syncSegments()
    }

    const setValue = (value: string): void => {
      input.value = sanitizeInputOtpValue(input, value, length)

      input.setSelectionRange(input.value.length, input.value.length)

      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))

      syncSegments()
    }

    syncSegments()

    input.addEventListener('input', syncSegments)
    input.addEventListener('change', syncSegments)
    input.addEventListener('focus', syncSegments)
    input.addEventListener('blur', syncSegments)
    input.addEventListener('click', syncSegments)
    input.addEventListener('keyup', syncSegments)
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()

        setSelection((input.selectionStart ?? input.value.length) - 1)

        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()

        setSelection((input.selectionStart ?? input.value.length) + 1)

        return
      }

      if (event.key === 'Home') {
        event.preventDefault()

        setSelection(0)

        return
      }

      if (event.key === 'End') {
        event.preventDefault()

        setSelection(input.value.length)
      }
    })
    input.addEventListener('paste', event => {
      const pasted = event.clipboardData?.getData('text') ?? ''

      if (!pasted) return

      event.preventDefault()

      setValue(pasted)
    })
    input.form?.addEventListener('reset', () => {
      globalThis.setTimeout(syncSegments)
    })

    for (const [index, segment] of segments.entries()) {
      segment.addEventListener('click', () => {
        setSelection(index)
      })
    }
  }
}

export const enhanceLumenInputOTPs = (
  scope: ParentNode = document
): void => {
  initInputOtpFields(scope)
}

const installInputOtpController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsInputOtpBound === 'true') return

  document.documentElement.dataset.uiElementsInputOtpBound = 'true'

  enhanceLumenInputOTPs(document)

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenInputOTPs(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}
/* eslint-enable @stylistic/padding-line-between-statements, unicorn/consistent-function-scoping */

/* cspell:ignore lsaquo rsaquo */
/* eslint-disable @stylistic/padding-line-between-statements -- Calendar mirrors Astro's UTC date grid runtime. */
const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/
const calendarMonthPattern = /^\d{4}-\d{2}$/

const parseCalendarDate = (value: string | null | undefined): Date | null => {
  if (!value || !calendarDatePattern.test(value)) return null

  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null
}

const parseCalendarMonth = (value: string | null | undefined): Date | null => {
  if (!value || !calendarMonthPattern.test(value)) return null

  const [year = Number.NaN, month = Number.NaN] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 ? date : null
}

const formatCalendarDate = (date: Date): string => date.toISOString().slice(0, 10)
const formatCalendarMonth = (date: Date): string => date.toISOString().slice(0, 7)
const addCalendarDays = (date: Date, days: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days))
const getCalendarDaysInMonth = (date: Date): number =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
const addCalendarMonths = (date: Date, months: number): Date => {
  const targetMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))

  return new Date(Date.UTC(
    targetMonth.getUTCFullYear(),
    targetMonth.getUTCMonth(),
    Math.min(date.getUTCDate(), getCalendarDaysInMonth(targetMonth))
  ))
}
const compareCalendarDates = (date: Date, other: Date | null): number =>
  other ? formatCalendarDate(date).localeCompare(formatCalendarDate(other)) : 0
const getCalendarToday = (): Date => {
  const today = new Date()

  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
}
const getCalendarGridStart = (month: Date): Date =>
  addCalendarDays(month, -((month.getUTCDay() + 6) % 7))
const getCalendarLocale = (): string =>
  document.documentElement.lang || navigator.language || 'en'

const isCalendarDateDisabled = (
  root: HTMLElement,
  date: Date,
  min: Date | null,
  max: Date | null
): boolean =>
  root.dataset.disabled === 'true' ||
  compareCalendarDates(date, min) < 0 ||
  compareCalendarDates(date, max) > 0

const clampCalendarDate = (date: Date, min: Date | null, max: Date | null): Date => {
  if (min && compareCalendarDates(date, min) < 0) return min
  if (max && compareCalendarDates(date, max) > 0) return max

  return date
}

const getCalendarFocusDate = (
  root: HTMLElement,
  month: Date,
  min: Date | null,
  max: Date | null,
  requestedDate?: Date | null
): Date => {
  const selectedDate = parseCalendarDate(root.dataset.uiCalendarValue)
  const today = getCalendarToday()
  const candidates = [requestedDate, selectedDate, today, month]

  for (const candidate of candidates) {
    if (
      candidate &&
      formatCalendarMonth(candidate) === formatCalendarMonth(month) &&
      !isCalendarDateDisabled(root, candidate, min, max)
    ) {
      return candidate
    }
  }

  for (let index = 0; index < getCalendarDaysInMonth(month); index += 1) {
    const date = addCalendarDays(month, index)

    if (!isCalendarDateDisabled(root, date, min, max)) return date
  }

  return month
}

const ensureCalendarStructure = (root: HTMLElement): void => {
  root.id ||= createId('ui-calendar')

  const labelId = `${root.id}-label`
  const selectedDate = parseCalendarDate(root.getAttribute('value') ?? root.dataset.uiCalendarValue)
  const minDate = parseCalendarDate(root.getAttribute('min') ?? root.dataset.uiCalendarMin)
  const maxDate = parseCalendarDate(root.getAttribute('max') ?? root.dataset.uiCalendarMax)
  const monthDate = parseCalendarMonth(root.getAttribute('month') ?? root.dataset.uiCalendarMonth) ??
    (selectedDate ? new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1)) : null) ??
    new Date(Date.UTC(getCalendarToday().getUTCFullYear(), getCalendarToday().getUTCMonth(), 1))
  let input = root.querySelector<HTMLInputElement>(calendarInputSelector)

  root.dataset.uiCalendarInitialMonth ??= formatCalendarMonth(monthDate)
  root.dataset.uiCalendarMonth ||= formatCalendarMonth(monthDate)

  if (minDate) root.dataset.uiCalendarMin = formatCalendarDate(minDate)
  if (maxDate) root.dataset.uiCalendarMax = formatCalendarDate(maxDate)
  if (selectedDate) root.dataset.uiCalendarValue = formatCalendarDate(selectedDate)
  if (root.hasAttribute('disabled')) root.dataset.disabled = 'true'

  if (!input) {
    input = document.createElement('input')
    input.type = 'hidden'
    input.dataset.uiCalendarInput = ''
    root.prepend(input)
  }

  input.disabled = root.dataset.disabled === 'true'
  input.value = root.dataset.uiCalendarValue ?? ''

  if (root.hasAttribute('name') && !input.name) {
    input.name = root.getAttribute('name') ?? ''
  }

  if (!root.querySelector('[data-ui-calendar-prev]')) {
    const header = document.createElement('div')
    const previous = document.createElement('button')
    const label = document.createElement('strong')
    const next = document.createElement('button')

    header.className = 'ui-calendar__header'
    previous.type = 'button'
    previous.className = 'ui-calendar__nav'
    previous.dataset.uiCalendarPrev = ''
    previous.setAttribute('aria-label', 'Previous month')
    previous.innerHTML = '<span aria-hidden="true">&lsaquo;</span>'
    label.className = 'ui-calendar__label'
    label.dataset.uiCalendarLabel = ''
    label.id = labelId
    next.type = 'button'
    next.className = 'ui-calendar__nav'
    next.dataset.uiCalendarNext = ''
    next.setAttribute('aria-label', 'Next month')
    next.innerHTML = '<span aria-hidden="true">&rsaquo;</span>'
    header.append(previous, label, next)
    input.after(header)
  }

  const label = root.querySelector<HTMLElement>(calendarLabelSelector)

  if (label) {
    label.id ||= labelId
  }

  if (!root.querySelector(calendarGridSelector)) {
    const table = document.createElement('table')

    table.className = 'ui-calendar__grid'
    table.dataset.uiCalendarGrid = ''
    table.role = 'grid'
    table.setAttribute('aria-labelledby', label?.id ?? labelId)
    root.append(table)
  }
}

const syncCalendarNavigation = (
  root: HTMLElement,
  month: Date,
  min: Date | null,
  max: Date | null
): void => {
  const previous = root.querySelector<HTMLButtonElement>('[data-ui-calendar-prev]')
  const next = root.querySelector<HTMLButtonElement>('[data-ui-calendar-next]')
  const disabled = root.dataset.disabled === 'true'
  const previousMonthLastDay = addCalendarDays(month, -1)
  const nextMonthFirstDay = addCalendarMonths(month, 1)

  if (previous) previous.disabled = disabled || compareCalendarDates(previousMonthLastDay, min) < 0
  if (next) next.disabled = disabled || compareCalendarDates(nextMonthFirstDay, max) > 0
}

const renderCalendar = (
  root: HTMLElement,
  requestedFocusDate?: Date | null,
  shouldFocus = false
): void => {
  const label = root.querySelector<HTMLElement>(calendarLabelSelector)
  const grid = root.querySelector<HTMLElement>(calendarGridSelector)

  if (!label || !grid) return

  const locale = getCalendarLocale()
  const min = parseCalendarDate(root.dataset.uiCalendarMin)
  const max = parseCalendarDate(root.dataset.uiCalendarMax)
  const selectedDate = parseCalendarDate(root.dataset.uiCalendarValue)
  const todayIso = formatCalendarDate(getCalendarToday())
  const month = parseCalendarMonth(root.dataset.uiCalendarMonth) ??
    (selectedDate ? new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1)) : null) ??
    getCalendarToday()
  const visibleMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))
  const focusDate = getCalendarFocusDate(root, visibleMonth, min, max, requestedFocusDate)
  const focusIso = formatCalendarDate(focusDate)
  const selectedIso = selectedDate ? formatCalendarDate(selectedDate) : ''
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC', year: 'numeric' }).format(visibleMonth)
  const dayLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'UTC', weekday: 'long', year: 'numeric' })
  const weekdayLabel = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'short' })
  const header = document.createElement('thead')
  const headerRow = document.createElement('tr')
  const body = document.createElement('tbody')
  const firstCell = getCalendarGridStart(visibleMonth)

  root.dataset.uiCalendarMonth = formatCalendarMonth(visibleMonth)
  label.textContent = monthLabel
  syncCalendarNavigation(root, visibleMonth, min, max)
  headerRow.role = 'row'

  for (let index = 0; index < 7; index += 1) {
    const cell = document.createElement('th')

    cell.scope = 'col'
    cell.role = 'columnheader'
    cell.textContent = weekdayLabel.format(new Date(Date.UTC(2026, 0, 5 + index)))
    headerRow.append(cell)
  }

  header.append(headerRow)

  for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
    const row = document.createElement('tr')

    row.role = 'row'

    for (let columnIndex = 0; columnIndex < 7; columnIndex += 1) {
      const date = addCalendarDays(firstCell, rowIndex * 7 + columnIndex)
      const dateIso = formatCalendarDate(date)
      const cell = document.createElement('td')
      const unavailable = isCalendarDateDisabled(root, date, min, max)

      cell.role = 'gridcell'
      cell.tabIndex = !unavailable && dateIso === focusIso ? 0 : -1
      cell.textContent = String(date.getUTCDate())
      cell.dataset.date = dateIso
      cell.dataset.uiCalendarDay = ''
      cell.setAttribute('aria-label', dayLabel.format(date))
      cell.setAttribute('aria-selected', String(selectedIso === dateIso))

      if (unavailable) cell.setAttribute('aria-disabled', 'true')
      if (formatCalendarMonth(date) !== formatCalendarMonth(visibleMonth)) cell.dataset.outside = 'true'
      if (dateIso === todayIso) cell.dataset.today = 'true'
      if (selectedIso === dateIso) cell.dataset.selected = 'true'

      row.append(cell)
    }

    body.append(row)
  }

  grid.replaceChildren(header, body)

  if (shouldFocus) {
    root.querySelector<HTMLElement>(`${calendarDaySelector}[data-date="${focusIso}"]`)?.focus({ preventScroll: true })
  }
}

const selectCalendarDate = (root: HTMLElement, date: Date): void => {
  const input = root.querySelector<HTMLInputElement>(calendarInputSelector)

  if (!input || root.dataset.disabled === 'true') return

  const min = parseCalendarDate(root.dataset.uiCalendarMin)
  const max = parseCalendarDate(root.dataset.uiCalendarMax)
  const nextDate = clampCalendarDate(date, min, max)

  if (isCalendarDateDisabled(root, nextDate, min, max)) return

  input.value = formatCalendarDate(nextDate)
  root.dataset.uiCalendarValue = input.value
  root.dataset.uiCalendarMonth = formatCalendarMonth(nextDate)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  renderCalendar(root, nextDate, true)
}

const focusCalendarDate = (root: HTMLElement, date: Date): void => {
  const min = parseCalendarDate(root.dataset.uiCalendarMin)
  const max = parseCalendarDate(root.dataset.uiCalendarMax)
  const nextDate = clampCalendarDate(date, min, max)

  root.dataset.uiCalendarMonth = formatCalendarMonth(nextDate)
  renderCalendar(root, nextDate, true)
}

const moveCalendarFocus = (root: HTMLElement, currentDate: Date, key: string): void => {
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
    focusCalendarDate(root, addCalendarMonths(currentDate, key === 'PageDown' ? 1 : -1))

    return
  }

  const offset = keyOffsets[key]

  if (offset !== undefined) {
    focusCalendarDate(root, addCalendarDays(currentDate, offset))
  }
}

const initCalendars = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, calendarSelector)
  const roots = getScopedElements<HTMLElement>(scope, calendarSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    if (root.dataset.uiBound === 'true') continue

    ensureCalendarStructure(root)

    const input = root.querySelector<HTMLInputElement>(calendarInputSelector)

    if (!input) continue

    root.dataset.uiBound = 'true'
    renderCalendar(root)
    root.querySelector<HTMLButtonElement>('[data-ui-calendar-prev]')?.addEventListener('click', () => {
      const month = parseCalendarMonth(root.dataset.uiCalendarMonth)

      if (!month) return

      const nextMonth = addCalendarMonths(month, -1)

      root.dataset.uiCalendarMonth = formatCalendarMonth(nextMonth)
      renderCalendar(root, nextMonth, true)
    })
    root.querySelector<HTMLButtonElement>('[data-ui-calendar-next]')?.addEventListener('click', () => {
      const month = parseCalendarMonth(root.dataset.uiCalendarMonth)

      if (!month) return

      const nextMonth = addCalendarMonths(month, 1)

      root.dataset.uiCalendarMonth = formatCalendarMonth(nextMonth)
      renderCalendar(root, nextMonth, true)
    })
    root.addEventListener('click', event => {
      const target = event.target

      if (!(target instanceof Element)) return

      const cell = target.closest<HTMLElement>(calendarDaySelector)

      if (!cell || !root.contains(cell) || cell.getAttribute('aria-disabled') === 'true') return

      const date = parseCalendarDate(cell.dataset.date)

      if (date) selectCalendarDate(root, date)
    })
    root.addEventListener('keydown', event => {
      const target = event.target

      if (!(target instanceof HTMLElement) || !target.hasAttribute('data-ui-calendar-day')) return

      const date = parseCalendarDate(target.dataset.date)

      if (!date) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        selectCalendarDate(root, date)

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

      event.preventDefault()
      moveCalendarFocus(root, date, event.key)
    })
    input.form?.addEventListener('reset', () => {
      globalThis.setTimeout(() => {
        root.dataset.uiCalendarValue = input.value
        root.dataset.uiCalendarMonth = root.dataset.uiCalendarInitialMonth ?? root.dataset.uiCalendarMonth
        renderCalendar(root)
      })
    })
  }
}

export const enhanceLumenCalendars = (
  scope: ParentNode = document
): void => {
  initCalendars(scope)
}

const installCalendarController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsCalendarsBound === 'true') return

  document.documentElement.dataset.uiElementsCalendarsBound = 'true'
  enhanceLumenCalendars(document)

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenCalendars(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
}
/* eslint-enable @stylistic/padding-line-between-statements */

const closeContextMenu = (menu: HTMLElement): void => {
  if (menu.dataset.state !== 'open') return

  menu.dataset.state = 'closed'

  menu.hidden = true
}

const closeOpenContextMenus = (except?: HTMLElement): void => {
  if (!hasDocument()) return

  for (const menu of document.querySelectorAll<HTMLElement>(`${contextMenuSelector}[data-state="open"]`)) {
    if (menu !== except) {
      closeContextMenu(menu)
    }
  }
}

const openContextMenuAt = (
  menu: HTMLElement,
  x: number,
  y: number
): void => {
  closeOpenContextMenus(menu)

  menu.hidden = false

  menu.style.position = 'fixed'

  menu.style.zIndex = '60'

  menu.dataset.state = 'open'

  const rect = menu.getBoundingClientRect()
  const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8))
  const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8))

  menu.style.left = `${left}px`

  menu.style.top = `${top}px`

  getFocusable(menu)[0]?.focus()
}

const initContextMenus = (scope: ParentNode): void => {
  for (const trigger of getScopedElements<HTMLElement>(scope, contextMenuTriggerSelector)) {
    if (trigger.dataset.uiContextMenuBound === 'true') continue

    const menuId = trigger.getAttribute('data-ui-context-menu-trigger')
    const menu = menuId && hasDocument() ? document.getElementById(menuId) : null

    if (!(menu instanceof HTMLElement)) continue

    trigger.dataset.uiContextMenuBound = 'true'

    menu.hidden = true

    menu.dataset.state = 'closed'

    trigger.addEventListener('contextmenu', event => {
      event.preventDefault()

      openContextMenuAt(menu, event.clientX, event.clientY)
    })

    trigger.addEventListener('keydown', event => {
      if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return

      event.preventDefault()

      const rect = trigger.getBoundingClientRect()

      openContextMenuAt(menu, rect.left + 16, rect.top + 16)
    })

    if (menu.dataset.uiContextMenuMenuBound === 'true') continue

    menu.dataset.uiContextMenuMenuBound = 'true'

    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault()

        closeContextMenu(menu)

        trigger.focus({ preventScroll: true })

        return
      }

      if (!['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(event.key)) return

      const items = getFocusable(menu)

      if (items.length === 0) return

      event.preventDefault()

      const currentIndex = items.indexOf(document.activeElement as HTMLElement)

      items[getLoopedIndex(event.key, currentIndex, items.length, ['ArrowDown'])]?.focus()
    })

    menu.addEventListener('click', event => {
      if (event.target instanceof HTMLElement && event.target.closest('[role="menuitem"]')) {
        closeContextMenu(menu)
      }
    })
  }
}

export const enhanceLumenContextMenus = (
  scope: ParentNode = document
): void => {
  initContextMenus(scope)
}

const installContextMenuController = (): void => {
  if (!hasDocument() || document.documentElement.dataset.uiElementsContextMenusBound === 'true') return

  document.documentElement.dataset.uiElementsContextMenusBound = 'true'

  enhanceLumenContextMenus(document)

  document.addEventListener('pointerdown', event => {
    const target = getOwnedTarget(event)

    if (!target) return

    for (const menu of document.querySelectorAll<HTMLElement>(`${contextMenuSelector}[data-state="open"]`)) {
      if (!menu.contains(target)) {
        closeContextMenu(menu)
      }
    }
  })

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeOpenContextMenus()
    }
  })

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenContextMenus(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
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

class LumenIconBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    this.renderIcon()
  }

  override attributeChangedCallback() {
    super.attributeChangedCallback()

    this.renderIcon()
  }

  private renderIcon() {
    const name = this.getAttribute('name')
    const label = this.getAttribute('label') ?? this.getAttribute('aria-label')
    const isDecorative = this.hasAttribute('decorative') || !label

    if (name) {
      const svg = renderLumenIconSvg(name)

      if (svg !== this.innerHTML) {
        this.innerHTML = svg
      }
    }

    if (isDecorative) {
      this.setAttribute('aria-hidden', 'true')

      this.removeAttribute('aria-label')

      this.removeAttribute('role')
    } else {
      this.removeAttribute('aria-hidden')

      this.setAttribute('aria-label', label)

      this.setAttribute('role', 'img')
    }
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
      this.dispatchEvent(new CustomEvent('ui:datatable-selection-change', {
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
    const importButton = this.querySelector<HTMLButtonElement>('[data-ui-theme-import]')
    const checkContrastButton = this.querySelector<HTMLButtonElement>('[data-ui-theme-check-contrast]')
    const scoreElement = this.querySelector<HTMLElement>('[data-ui-theme-contrast-score]')
    const statusElement = this.querySelector<HTMLElement>('[data-ui-theme-contrast-status]')

    this.currentExportFormat = coerceThemeBuilderExportFormat(
      this.getButtonValue(exportFormatButtons, 'data-ui-theme-export-format', 'css')
    )

    this.currentScheme = coerceThemeBuilderScheme(
      this.getButtonValue(schemeButtons, 'data-ui-theme-scheme', this.getDefaultScheme())
    )

    const updateContrastUi = (tokens: LumenThemeTokens) => {
      if (!scoreElement && !statusElement) return

      const score = scoreThemeContrast(tokens, 'ink', 'canvas')

      if (scoreElement) scoreElement.textContent = String(score.ratio)

      if (statusElement) {
        statusElement.textContent = score.wcagAA ? 'Passes WCAG AA' : 'Fails WCAG AA'

        statusElement.dataset.status = score.wcagAA ? 'pass' : 'fail'
      }
    }

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

      updateContrastUi(result.tokens)

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

    importButton?.addEventListener('click', () => {
      const value = output?.value || ''

      if (!value) return
      
      const parsed = parseThemeCss(value)

      if (Object.keys(parsed).length === 0) return
      
      this.currentTokens = parsed

      const target = this.getTarget()

      if (target) {
        this.applyTokens(target, this.currentTokens, this.currentScheme)
      }

      this.writeExport(output)

      updateContrastUi(this.currentTokens)

      this.dispatchEvent(new CustomEvent('ui:theme-change', {
        bubbles: true,
        detail: {
          accentHue: 0,
          hue: 0,
          mode: 'manual',
          scheme: this.currentScheme,
          tokens: this.currentTokens
        }
      }))
    }, { signal })

    checkContrastButton?.addEventListener('click', () => {
      if (!this.currentTokens) return

      this.currentTokens = tuneThemeContrast(this.currentTokens, 'ink', 'canvas')

      const target = this.getTarget()

      if (target) {
        this.applyTokens(target, this.currentTokens, this.currentScheme)
      }

      this.writeExport(output)

      updateContrastUi(this.currentTokens)

      this.dispatchEvent(new CustomEvent('ui:theme-change', {
        bubbles: true,
        detail: {
          accentHue: 0,
          hue: 0,
          mode: 'manual',
          scheme: this.currentScheme,
          tokens: this.currentTokens
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
  Icon: LumenIconBehaviorElement,
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

  installRichTextEditorController()

  installScheduleController()

  installResizableController()

  installContextMenuController()

  installDateRangePickerController()

  installInputOtpController()

  installCalendarController()
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
export const LumenIconElement = elementClasses.Icon
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

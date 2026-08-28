/* eslint-disable complexity, @typescript-eslint/no-non-null-assertion */

import {
  alignLumenChartSeries,
  coerceThemeBuilderExportFormat,
  coerceThemeBuilderMode,
  coerceThemeBuilderScheme,
  createLumenBarGeometry,
  createLumenHeatmapGeometry,
  createLumenKanbanMoveDetail,
  createLumenLineGeometry,
  createLumenPieGeometry,
  createLumenRangeGeometry,
  createLumenScatterGeometry,
  createThemeBuilderTokens,
  exportThemeBuilderValue,
  formatLumenChartSummary,
  formatLumenLanguageLabel,
  getLumenChartCategories,
  getLumenChartDomain,
  getLumenChartTicks,
  getLumenLocalePair,
  getLumenPhoneCountries,
  getLumenPhoneCountry,
  getLumenRichTextShortcut,
  getVirtualRange,
  hasLumenChartData,
  hasLumenPieData,
  isLumenRichTextToggleCommand,
  type LumenChartSeries,
  type LumenChartTone,
  lumenChartTones,
  type LumenComboSeries,
  type LumenComponentName,
  lumenComponentNames,
  type LumenHeatmapDatum,
  type LumenIllustrationName,
  type LumenKanbanMoveDetail,
  type LumenLocaleOption,
  type LumenPieGeometrySlice,
  type LumenRangeDatum,
  type LumenRichTextChangeDetail,
  type LumenRichTextCommandDetail,
  type LumenScatterGeometryPoint,
  type LumenTabsChangeDetail,
  type LumenThemeBuilderExportFormat,
  type LumenThemeBuilderScheme,
  type LumenThemeTokens,
  normalizeLumenLocales,
  normalizeThemeBuilderHex,
  parseThemeCss,
  renderLumenIconSvg,
  renderLumenIllustrationSvg,
  resolveLumenChartTone,
  resolveLumenPhoneNumber,
  scaleLumenChartValue,
  scoreThemeContrast,
  scrollLumenTabIntoView,
  tuneThemeContrast
} from '@santi020k/lumen-core'

import {
  LumenBadgeElement as GranularLumenBadgeElement,
  lumenBadgeElementConfig
} from './components/badge.js'
import {
  LumenButtonElement as GranularLumenButtonElement,
  lumenButtonElementConfig
} from './components/button.js'
import {
  LumenCardElement as GranularLumenCardElement,
  lumenCardElementConfig
} from './components/card.js'
import {
  LumenComboboxElement as GranularLumenComboboxElement,
  lumenComboboxElementConfig
} from './components/combobox.js'
import {
  LumenCardContentElement as GranularLumenCardContentElement,
  lumenCardContentElementConfig,
  LumenCardDescriptionElement as GranularLumenCardDescriptionElement,
  lumenCardDescriptionElementConfig,
  LumenCardFooterElement as GranularLumenCardFooterElement,
  lumenCardFooterElementConfig,
  LumenCardHeaderElement as GranularLumenCardHeaderElement,
  lumenCardHeaderElementConfig,
  LumenCardTitleElement as GranularLumenCardTitleElement,
  lumenCardTitleElementConfig,
  LumenContainerElement as GranularLumenContainerElement,
  lumenContainerElementConfig,
  LumenDirectionElement as GranularLumenDirectionElement,
  lumenDirectionElementConfig,
  LumenGridElement as GranularLumenGridElement,
  lumenGridElementConfig,
  LumenLabelElement as GranularLumenLabelElement,
  lumenLabelElementConfig,
  LumenSeparatorElement as GranularLumenSeparatorElement,
  lumenSeparatorElementConfig,
  LumenSkeletonElement as GranularLumenSkeletonElement,
  lumenSkeletonElementConfig,
  LumenSpinnerElement as GranularLumenSpinnerElement,
  lumenSpinnerElementConfig,
  LumenStackElement as GranularLumenStackElement,
  lumenStackElementConfig,
  LumenTypographyElement as GranularLumenTypographyElement,
  lumenTypographyElementConfig,
  LumenVisuallyHiddenElement as GranularLumenVisuallyHiddenElement,
  lumenVisuallyHiddenElementConfig
} from './components/foundations.js'
import {
  createLumenElementClass as createStandaloneLumenElementClass,
  LumenElement,
  type LumenElementConfig,
  type LumenElementConstructor
} from './element-base.js'

export { LumenElement } from './element-base.js'

type ToastPlacement =
  | 'bottom-center' |
  'bottom-left' |
  'bottom-right' |
  'top-center' |
  'top-left' |
  'top-right'

type ToastVariant = string

type DataTableSortDirection = 'ascending' | 'descending' | 'none'

type NativeFormControl =
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

interface RichTextCommandDocument {
  execCommand?: (command: string, showUi?: boolean, value?: string) => boolean
  queryCommandState?: (command: string) => boolean
  queryCommandValue?: (command: string) => string
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

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

// cspell:ignore activedescendant multiselectable spinbutton
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
const richTextEditorSelector = '[data-ui-rich-text-editor]'
const richTextEditorCommandSelector = '[data-ui-editor-command]'

const richTextEditorContentSelector =
  '[data-ui-rich-text-editable], [contenteditable="true"]'

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
const datePickerSelector = '[data-ui-date-picker], lumen-date-picker'
const datePickerNativeSelector = '[data-ui-date-picker-native]'
const datePickerControlSelector = '[data-ui-date-picker-control]'
const datePickerTriggerSelector = '[data-ui-date-picker-trigger]'
const datePickerValueSelector = '[data-ui-date-picker-value]'
const datePickerPopoverSelector = '[data-ui-date-picker-popover]'

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

const toastTimers = new WeakMap<
  HTMLElement,
  {
    cleanup: (() => void) | undefined
    remaining: number
    startedAt: number
    timer: ReturnType<typeof globalThis.setTimeout> | undefined
  }
>()

const glassAttributeClasses = (className: string) => ({
  glass: {
    strong: `${className} ui-glass-strong`,
    subtle: `${className} ui-glass-subtle`,
    true: className
  }
})

const elementConfigs = {
  Accordion: {
    attributeClasses: {
      variant: { flush: 'ui-accordion--flush' }
    },
    baseClassName: 'ui-accordion',
    defaults: { variant: 'default' },
    tagName: 'lumen-accordion'
  },
  Alert: {
    attributeClasses: {
      glass: {
        strong: 'ui-alert--glass ui-glass-strong',
        subtle: 'ui-alert--glass ui-glass-subtle',
        true: 'ui-alert--glass'
      },
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
      glass: {
        strong: 'ui-dialog--glass ui-glass-strong',
        subtle: 'ui-dialog--glass ui-glass-subtle',
        true: 'ui-dialog--glass'
      }
    },
    baseClassName: 'ui-dialog ui-alert-dialog',
    defaults: { 'data-ui-alert-dialog': '' },
    tagName: 'lumen-alert-dialog'
  },
  Agenda: {
    attributeClasses: glassAttributeClasses('ui-agenda--glass'),
    baseClassName: 'ui-agenda',
    tagName: 'lumen-agenda'
  },
  AspectRatio: {
    baseClassName: 'ui-aspect-ratio',
    tagName: 'lumen-aspect-ratio'
  },
  Attachment: {
    attributeClasses: glassAttributeClasses('ui-attachment--glass'),
    baseClassName: 'ui-attachment',
    tagName: 'lumen-attachment'
  },
  Autocomplete: {
    baseClassName: 'ui-input ui-autocomplete',
    defaults: { role: 'combobox', type: 'search' },
    tagName: 'lumen-autocomplete'
  },
  Avatar: { baseClassName: 'ui-avatar', tagName: 'lumen-avatar' },
  BackToTop: { baseClassName: 'ui-back-to-top', tagName: 'lumen-back-to-top' },
  Badge: lumenBadgeElementConfig,
  BarChart: {
    attributeClasses: {
      ...glassAttributeClasses('ui-chart--glass'),
      presentation: { bare: 'ui-chart--bare' }
    },
    baseClassName: 'ui-chart ui-bar-chart',
    defaults: { layout: 'grouped', orientation: 'vertical' },
    role: 'figure',
    tagName: 'lumen-bar-chart'
  },
  Breadcrumb: {
    baseClassName: 'ui-breadcrumb',
    defaults: { 'aria-label': 'Breadcrumb' },
    tagName: 'lumen-breadcrumb'
  },
  Bubble: {
    attributeClasses: {
      from: { user: 'ui-bubble--user' },
      ...glassAttributeClasses('ui-bubble--glass')
    },
    baseClassName: 'ui-bubble',
    defaults: { from: 'assistant' },
    tagName: 'lumen-bubble'
  },
  Button: lumenButtonElementConfig,
  ButtonGroup: {
    baseClassName: 'ui-button-group',
    tagName: 'lumen-button-group'
  },
  Calendar: {
    attributeClasses: glassAttributeClasses('ui-calendar--glass'),
    baseClassName: 'ui-calendar',
    defaults: { 'data-ui-calendar': '' },
    tagName: 'lumen-calendar'
  },
  Callout: { baseClassName: 'ui-callout', tagName: 'lumen-callout' },
  Card: lumenCardElementConfig,
  CardContent: lumenCardContentElementConfig,
  CardDescription: lumenCardDescriptionElementConfig,
  CardFooter: lumenCardFooterElementConfig,
  CardHeader: lumenCardHeaderElementConfig,
  CardTitle: lumenCardTitleElementConfig,
  Carousel: {
    attributeClasses: glassAttributeClasses('ui-carousel--glass'),
    baseClassName: 'ui-carousel',
    defaults: { 'data-ui-carousel': '' },
    tagName: 'lumen-carousel'
  },
  Chart: {
    attributeClasses: {
      ...glassAttributeClasses('ui-chart--glass'),
      presentation: { bare: 'ui-chart--bare' }
    },
    baseClassName: 'ui-chart',
    tagName: 'lumen-chart'
  },
  ComboChart: {
    baseClassName: 'ui-chart ui-combo-chart',
    role: 'figure',
    tagName: 'lumen-combo-chart'
  },
  Checkbox: {
    baseClassName: 'ui-checkbox',
    defaults: { type: 'checkbox' },
    tagName: 'lumen-checkbox'
  },
  CheckboxGroup: {
    attributeClasses: {
      orientation: {
        horizontal: 'ui-checkbox-group--horizontal',
        vertical: 'ui-checkbox-group--vertical'
      }
    },
    baseClassName: 'ui-checkbox-group',
    defaults: {
      'data-ui-checkbox-group': '',
      orientation: 'vertical',
      role: 'group'
    },
    tagName: 'lumen-checkbox-group'
  },
  Collapsible: {
    baseClassName: 'ui-collapsible',
    defaults: { 'data-ui-collapsible': '' },
    tagName: 'lumen-collapsible'
  },
  Code: {
    attributeClasses: {
      variant: {
        block: 'ui-code--block',
        inline: 'ui-code--inline'
      },
      wrap: {
        true: 'ui-code--wrap'
      }
    },
    baseClassName: 'ui-code',
    defaults: {
      'data-code-theme': 'auto',
      'data-slot': 'code',
      variant: 'inline'
    },
    tagName: 'lumen-code'
  },
  CodeTabs: {
    baseClassName: 'ui-code-tabs',
    defaults: { 'data-slot': 'code-tabs', 'data-ui-tabs': '' },
    tagName: 'lumen-code-tabs'
  },
  Combobox: lumenComboboxElementConfig,
  Container: lumenContainerElementConfig,
  CopyButton: {
    baseClassName: 'ui-button ui-button--outline ui-copy-button',
    defaults: {
      'aria-label': 'Copy to clipboard',
      'data-state': 'idle',
      'data-ui-copy-button': '',
      role: 'button',
      tabindex: '0'
    },
    tagName: 'lumen-copy-button'
  },
  Command: {
    attributeClasses: glassAttributeClasses('ui-command--glass'),
    baseClassName: 'ui-command',
    defaults: { 'data-ui-command': '' },
    tagName: 'lumen-command'
  },
  ContextNavigation: {
    attributeClasses: {
      variant: { unstyled: 'ui-context-navigation--unstyled' }
    },
    baseClassName: 'ui-context-navigation',
    defaults: { 'data-slot': 'context-navigation' },
    tagName: 'lumen-context-navigation'
  },
  ColorPicker: {
    baseClassName: 'ui-color-picker',
    defaults: { type: 'color' },
    tagName: 'lumen-color-picker'
  },
  ContextMenu: {
    attributeClasses: {
      glass: {
        strong: 'ui-menu--glass ui-glass-strong',
        subtle: 'ui-menu--glass ui-glass-subtle',
        true: 'ui-menu--glass'
      }
    },
    baseClassName: 'ui-menu',
    defaults: { 'data-ui-context-menu': '', role: 'menu' },
    tagName: 'lumen-context-menu'
  },
  DataTable: {
    attributeClasses: glassAttributeClasses('ui-data-table--glass'),
    baseClassName: 'ui-data-table',
    defaults: { 'data-ui-datatable': '' },
    tagName: 'lumen-data-table'
  },
  DatePicker: {
    attributeClasses: glassAttributeClasses('ui-date-picker-field--glass'),
    baseClassName: 'ui-input ui-date-picker',
    defaults: { type: 'date' },
    tagName: 'lumen-date-picker'
  },
  DateRangePicker: {
    baseClassName: 'ui-date-range-picker',
    defaults: { 'data-ui-date-range-picker': '' },
    tagName: 'lumen-date-range-picker'
  },
  Dialog: {
    attributeClasses: {
      glass: {
        strong: 'ui-dialog--glass ui-glass-strong',
        subtle: 'ui-dialog--glass ui-glass-subtle',
        true: 'ui-dialog--glass'
      },
      layout: { fullscreen: 'ui-dialog--fullscreen' }
    },
    baseClassName: 'ui-dialog',
    defaults: { 'data-ui-dialog': '', layout: 'centered' },
    tagName: 'lumen-dialog'
  },
  Direction: lumenDirectionElementConfig,
  Drawer: {
    attributeClasses: {
      glass: {
        strong: 'ui-drawer--glass ui-glass-strong',
        subtle: 'ui-drawer--glass ui-glass-subtle',
        true: 'ui-drawer--glass'
      }
    },
    baseClassName: 'ui-drawer',
    defaults: { 'data-ui-drawer': '' },
    tagName: 'lumen-drawer'
  },
  DropdownMenu: {
    attributeClasses: {
      glass: {
        strong: 'ui-menu--glass ui-glass-strong',
        subtle: 'ui-menu--glass ui-glass-subtle',
        true: 'ui-menu--glass'
      }
    },
    baseClassName: 'ui-menu',
    defaults: { 'data-ui-dropdown-menu': '' },
    tagName: 'lumen-dropdown-menu'
  },
  Empty: {
    attributeClasses: {
      ...glassAttributeClasses('ui-empty--glass'),
      variant: { compact: 'ui-empty--compact' }
    },
    baseClassName: 'ui-empty',
    defaults: { variant: 'default' },
    tagName: 'lumen-empty'
  },
  ErrorState: {
    attributeClasses: {
      kind: {
        error: 'ui-error-state--error',
        offline: 'ui-error-state--offline'
      },
      layout: {
        compact: 'ui-error-state--compact',
        default: 'ui-error-state--default',
        page: 'ui-error-state--page'
      }
    },
    baseClassName: 'ui-error-state',
    defaults: {
      'data-ui-error-state': '',
      kind: 'error',
      layout: 'default'
    },
    tagName: 'lumen-error-state'
  },
  ErrorSummary: {
    baseClassName: 'ui-error-summary',
    defaults: { 'data-ui-error-summary': '', tabindex: '-1' },
    tagName: 'lumen-error-summary'
  },
  Eyebrow: { baseClassName: 'ui-eyebrow', tagName: 'lumen-eyebrow' },
  Field: {
    attributeClasses: glassAttributeClasses('ui-field--glass'),
    baseClassName: 'ui-field',
    defaults: { 'data-ui-field': '' },
    tagName: 'lumen-field'
  },
  FieldError: {
    baseClassName: 'ui-field-error',
    defaults: { 'data-ui-field-error': '' },
    tagName: 'lumen-field-error'
  },
  FloatingBadge: {
    baseClassName: 'ui-floating-badge',
    tagName: 'lumen-floating-badge'
  },
  Form: {
    baseClassName: 'ui-form',
    defaults: { 'data-ui-form': '' },
    tagName: 'lumen-form'
  },
  FormattedDate: {
    baseClassName: 'ui-formatted-date',
    tagName: 'lumen-formatted-date'
  },
  Grid: lumenGridElementConfig,
  HoverCard: {
    attributeClasses: {
      glass: {
        strong: 'ui-hover-card--glass ui-glass-strong',
        subtle: 'ui-hover-card--glass ui-glass-subtle',
        true: 'ui-hover-card--glass'
      }
    },
    baseClassName: 'ui-hover-card',
    defaults: { 'data-ui-hover-card': '' },
    tagName: 'lumen-hover-card'
  },
  Heatmap: {
    baseClassName: 'ui-chart ui-heatmap',
    role: 'figure',
    tagName: 'lumen-heatmap'
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
  Image: {
    attributeClasses: {
      fit: {
        contain: 'ui-image--fit-contain',
        cover: 'ui-image--fit-cover'
      },
      radius: {
        full: 'ui-image--radius-full',
        lg: 'ui-image--radius-lg',
        md: 'ui-image--radius-md',
        none: 'ui-image--radius-none',
        sm: 'ui-image--radius-sm'
      },
      'invert-on-dark': { true: 'ui-image--invert-dark' }
    },
    baseClassName: 'ui-image',
    defaults: { fit: 'cover', radius: 'lg' },
    tagName: 'lumen-image'
  },
  Input: {
    attributeClassAliases: { size: 'visual-size' },
    attributeClasses: {
      size: { lg: 'ui-input--lg', sm: 'ui-input--sm' },
      'visual-size': { lg: 'ui-input--lg', sm: 'ui-input--sm' }
    },
    baseClassName: 'ui-input',
    defaults: { type: 'text' },
    tagName: 'lumen-input'
  },
  InputGroup: { baseClassName: 'ui-input-group', tagName: 'lumen-input-group' },
  InputOTP: {
    baseClassName: 'ui-input-otp-field',
    defaults: { 'data-ui-input-otp': '', 'data-ui-input-otp-length': '6' },
    tagName: 'lumen-input-otp'
  },
  NumberField: {
    baseClassName: 'ui-input ui-number-field',
    defaults: { type: 'number' },
    tagName: 'lumen-number-field'
  },
  Item: {
    attributeClasses: glassAttributeClasses('ui-item--glass'),
    baseClassName: 'ui-item',
    defaults: { 'data-slot': 'item' },
    tagName: 'lumen-item'
  },
  KanbanBoard: {
    baseClassName: 'ui-kanban-board ui-kanban',
    defaults: {
      'aria-orientation': 'horizontal',
      'data-ui-kanban': '',
      tabindex: '0'
    },
    tagName: 'lumen-kanban-board'
  },
  KanbanColumn: {
    baseClassName: 'ui-kanban__column',
    tagName: 'lumen-kanban-column'
  },
  Kbd: { baseClassName: 'ui-kbd', tagName: 'lumen-kbd' },
  Label: lumenLabelElementConfig,
  Link: {
    attributeClasses: { variant: { inherit: 'ui-link--inherit' } },
    baseClassName: 'ui-link',
    defaults: { 'data-slot': 'link' },
    tagName: 'lumen-link'
  },
  LineChart: {
    attributeClasses: {
      ...glassAttributeClasses('ui-chart--glass'),
      presentation: { bare: 'ui-chart--bare' }
    },
    baseClassName: 'ui-chart ui-line-chart',
    role: 'figure',
    tagName: 'lumen-line-chart'
  },
  ListBox: {
    baseClassName: 'ui-list-box',
    defaults: { 'data-ui-list-box': '' },
    tagName: 'lumen-list-box'
  },
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
      glass: {
        strong: 'ui-menubar--glass ui-glass-strong',
        subtle: 'ui-menubar--glass ui-glass-subtle',
        true: 'ui-menubar--glass'
      }
    },
    baseClassName: 'ui-menubar',
    defaults: { 'data-ui-menubar': '' },
    tagName: 'lumen-menubar'
  },
  PieChart: {
    attributeClasses: {
      ...glassAttributeClasses('ui-chart--glass'),
      variant: {
        donut: 'ui-pie-chart--donut',
        pie: 'ui-pie-chart--pie'
      }
    },
    baseClassName: 'ui-chart ui-pie-chart',
    defaults: { variant: 'donut' },
    role: 'figure',
    tagName: 'lumen-pie-chart'
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
  MessageScroller: {
    attributeClasses: glassAttributeClasses('ui-message-scroller--glass'),
    baseClassName: 'ui-message-scroller',
    tagName: 'lumen-message-scroller'
  },
  NativeSelect: {
    attributeClassAliases: { size: 'visual-size' },
    attributeClasses: {
      size: { lg: 'ui-select--lg', sm: 'ui-select--sm' },
      'visual-size': { lg: 'ui-select--lg', sm: 'ui-select--sm' }
    },
    baseClassName: 'ui-select',
    tagName: 'lumen-native-select'
  },
  NavigationMenu: {
    attributeClasses: {
      glass: {
        strong: 'ui-navigation-menu--glass ui-glass-strong',
        subtle: 'ui-navigation-menu--glass ui-glass-subtle',
        true: 'ui-navigation-menu--glass'
      },
      variant: { unstyled: 'ui-navigation-menu--unstyled' }
    },
    baseClassName: 'ui-navigation-menu',
    defaults: {
      'data-slot': 'navigation-menu',
      'data-ui-navigation-menu': ''
    },
    tagName: 'lumen-navigation-menu'
  },
  Pagination: {
    baseClassName: 'ui-pagination',
    defaults: { 'aria-label': 'Pagination' },
    tagName: 'lumen-pagination'
  },
  PasswordField: {
    baseClassName: 'ui-password-field',
    defaults: { 'data-ui-password-field': '' },
    tagName: 'lumen-password-field'
  },
  PhoneInput: {
    baseClassName: 'ui-phone-input ui-input-group',
    tagName: 'lumen-phone-input'
  },
  Pill: {
    attributeClasses: {
      variant: {
        brand: 'ui-pill--brand',
        outline: 'ui-pill--outline'
      }
    },
    baseClassName: 'ui-pill',
    defaults: { variant: 'neutral' },
    tagName: 'lumen-pill'
  },
  Popover: {
    attributeClasses: {
      glass: {
        strong: 'ui-popover--glass ui-glass-strong',
        subtle: 'ui-popover--glass ui-glass-subtle',
        true: 'ui-popover--glass'
      }
    },
    baseClassName: 'ui-popover',
    defaults: { 'data-ui-popover': '' },
    tagName: 'lumen-popover'
  },
  Progress: {
    baseClassName: 'ui-progress',
    defaults: {
      'aria-valuemax': '100',
      'aria-valuemin': '0',
      'aria-valuenow': '0',
      'data-ui-progress': '',
      max: '100',
      role: 'progressbar',
      value: '0'
    },
    tagName: 'lumen-progress'
  },
  Prose: { baseClassName: 'ui-prose', tagName: 'lumen-prose' },
  RadioGroup: {
    baseClassName: 'ui-radio-group',
    defaults: { 'data-ui-radio-group': '' },
    tagName: 'lumen-radio-group'
  },
  RangeChart: {
    baseClassName: 'ui-chart ui-range-chart',
    role: 'figure',
    tagName: 'lumen-range-chart'
  },
  Resizable: {
    attributeClasses: {
      'data-orientation': { vertical: 'ui-resizable--vertical' }
    },
    baseClassName: 'ui-resizable',
    defaults: {
      'data-orientation': 'horizontal',
      'data-ui-resizable': '',
      'data-ui-resizable-reset': 'true'
    },
    tagName: 'lumen-resizable'
  },
  RichTextEditor: {
    attributeClasses: glassAttributeClasses('ui-rich-text-editor--glass'),
    baseClassName: 'ui-rich-text-editor',
    defaults: { 'data-ui-rich-text-editor': '' },
    tagName: 'lumen-rich-text-editor'
  },
  ScrollArea: {
    attributeClasses: glassAttributeClasses('ui-scroll-area--glass'),
    baseClassName: 'ui-scroll-area',
    tagName: 'lumen-scroll-area'
  },
  ScrollProgress: {
    attributeClasses: {
      position: { bottom: 'ui-scroll-progress--bottom' }
    },
    baseClassName: 'ui-scroll-progress',
    defaults: {
      'aria-label': 'Reading progress',
      'aria-valuemax': '100',
      'aria-valuemin': '0',
      'aria-valuenow': '0',
      'data-ui-scroll-progress': '',
      position: 'top',
      role: 'progressbar'
    },
    tagName: 'lumen-scroll-progress'
  },
  Schedule: {
    attributeClasses: glassAttributeClasses('ui-schedule--glass'),
    baseClassName: 'ui-schedule',
    defaults: { 'data-ui-schedule': '' },
    tagName: 'lumen-schedule'
  },
  SearchField: {
    baseClassName: 'ui-input ui-search-field',
    defaults: { type: 'search' },
    tagName: 'lumen-search-field'
  },
  Select: {
    attributeClasses: {
      ...glassAttributeClasses('ui-select-field--glass'),
      size: { lg: 'ui-select--lg', sm: 'ui-select--sm' }
    },
    baseClassName: 'ui-select',
    tagName: 'lumen-select'
  },
  Separator: lumenSeparatorElementConfig,
  Sheet: {
    attributeClasses: {
      glass: {
        strong: 'ui-sheet--glass ui-glass-strong',
        subtle: 'ui-sheet--glass ui-glass-subtle',
        true: 'ui-sheet--glass'
      }
    },
    baseClassName: 'ui-sheet',
    defaults: { 'data-ui-sheet': '' },
    tagName: 'lumen-sheet'
  },
  Sidebar: {
    attributeClasses: {
      glass: {
        strong: 'ui-sidebar--glass ui-glass-strong',
        subtle: 'ui-sidebar--glass ui-glass-subtle',
        true: 'ui-sidebar--glass'
      },
      variant: { unstyled: 'ui-sidebar--unstyled' }
    },
    baseClassName: 'ui-sidebar',
    defaults: { 'data-slot': 'sidebar' },
    tagName: 'lumen-sidebar'
  },
  Skeleton: lumenSkeletonElementConfig,
  SkipLink: { baseClassName: 'ui-skip-link', tagName: 'lumen-skip-link' },
  Slider: {
    baseClassName: 'ui-slider',
    defaults: { type: 'range' },
    tagName: 'lumen-slider'
  },
  Sparkline: { baseClassName: 'ui-sparkline', tagName: 'lumen-sparkline' },
  Spinner: lumenSpinnerElementConfig,
  Switch: {
    baseClassName: 'ui-switch',
    defaults: { role: 'switch', type: 'checkbox' },
    tagName: 'lumen-switch'
  },
  Table: {
    attributeClasses: glassAttributeClasses('ui-table-wrap--glass'),
    baseClassName: 'ui-table-wrap',
    defaults: { 'data-slot': 'table' },
    tagName: 'lumen-table'
  },
  Tabs: {
    attributeClasses: glassAttributeClasses('ui-tabs--glass'),
    baseClassName: 'ui-tabs',
    defaults: { 'data-ui-tabs': '' },
    tagName: 'lumen-tabs'
  },
  TagGroup: {
    baseClassName: 'ui-tag-group',
    defaults: { role: 'list' },
    tagName: 'lumen-tag-group'
  },
  Textarea: {
    baseClassName: 'ui-textarea',
    defaults: { rows: '4' },
    tagName: 'lumen-textarea'
  },
  ThemeBuilder: {
    attributeClasses: glassAttributeClasses('ui-theme-builder--glass'),
    baseClassName: 'ui-theme-builder',
    defaults: { 'data-ui-theme-builder': '' },
    tagName: 'lumen-theme-builder'
  },
  ThemeToggle: {
    baseClassName: 'ui-theme-toggle',
    defaults: { 'data-slot': 'theme-toggle' },
    tagName: 'lumen-theme-toggle'
  },
  TimeField: {
    baseClassName: 'ui-input ui-time-field',
    defaults: { type: 'time' },
    tagName: 'lumen-time-field'
  },
  Toast: {
    attributeClasses: {
      glass: {
        true: 'ui-toast--glass'
      },
      variant: {
        destructive: 'ui-toast--destructive',
        success: 'ui-toast--success',
        warning: 'ui-toast--warning'
      }
    },
    baseClassName: 'ui-toast',
    defaults: { variant: 'default' },
    tagName: 'lumen-toast'
  },
  ToastViewport: {
    baseClassName: 'ui-tvp',
    defaults: { 'data-ui-toast-viewport': '' },
    tagName: 'lumen-toast-viewport'
  },
  Toggle: {
    baseClassName: 'ui-toggle',
    defaults: {
      'aria-pressed': 'false',
      'data-ui-toggle': '',
      role: 'button',
      tabindex: '0'
    },
    role: 'button',
    tagName: 'lumen-toggle'
  },
  ToggleGroup: {
    baseClassName: 'ui-toggle-group',
    defaults: { 'data-ui-toggle-group': '' },
    tagName: 'lumen-toggle-group'
  },
  Tooltip: { baseClassName: 'ui-tooltip', tagName: 'lumen-tooltip' },
  Tree: {
    attributeClasses: glassAttributeClasses('ui-tree--glass'),
    baseClassName: 'ui-tree',
    defaults: { role: 'tree' },
    tagName: 'lumen-tree'
  },
  TreeGrid: {
    attributeClasses: glassAttributeClasses('ui-tree-grid--glass'),
    baseClassName: 'ui-tree-grid',
    defaults: { role: 'treegrid' },
    tagName: 'lumen-tree-grid'
  },
  Typography: lumenTypographyElementConfig,
  VirtualList: {
    attributeClasses: glassAttributeClasses('ui-virtual-list--glass'),
    baseClassName: 'ui-virtual-list',
    defaults: { 'data-ui-virtual-list': '' },
    tagName: 'lumen-virtual-list'
  },
  VisuallyHidden: lumenVisuallyHiddenElementConfig,
  LanguageToggle: {
    baseClassName: 'ui-language-toggle',
    defaults: { 'data-ui-language-toggle': '' },
    tagName: 'lumen-language-toggle'
  },
  Particles: { baseClassName: 'ui-particles', tagName: 'lumen-particles' },
  AnimatedNumber: {
    attributeClasses: {
      duration: {
        fast: 'ui-motion-duration-fast',
        slow: 'ui-motion-duration-slow',
        standard: 'ui-motion-duration-standard'
      }
    },
    baseClassName: 'ui-animated-number',
    defaults: { duration: 'slow', from: '0' },
    tagName: 'lumen-animated-number'
  },
  RevealGroup: {
    attributeClasses: {
      animation: {
        fade: 'ui-reveal-group-fade',
        scale: 'ui-reveal-group-scale',
        'slide-up': 'ui-reveal-group-slide-up'
      },
      duration: {
        fast: 'ui-motion-duration-fast',
        slow: 'ui-motion-duration-slow',
        standard: 'ui-motion-duration-standard'
      }
    },
    baseClassName: 'ui-reveal-group',
    defaults: {
      animation: 'slide-up',
      duration: 'slow',
      once: 'true',
      threshold: '0.15'
    },
    tagName: 'lumen-reveal-group'
  },
  ScrollReveal: {
    attributeClasses: {
      animation: {
        fade: 'ui-scroll-reveal-fade',
        scale: 'ui-scroll-reveal-scale',
        'slide-up': 'ui-scroll-reveal-slide-up'
      },
      duration: {
        fast: 'ui-motion-duration-fast',
        slow: 'ui-motion-duration-slow',
        standard: 'ui-motion-duration-standard'
      }
    },
    baseClassName: 'ui-scroll-reveal',
    defaults: {
      animation: 'fade',
      duration: 'slow',
      once: 'true',
      threshold: '0.15'
    },
    tagName: 'lumen-scroll-reveal'
  },
  ScatterChart: {
    baseClassName: 'ui-chart ui-scatter-chart',
    role: 'figure',
    tagName: 'lumen-scatter-chart'
  },
  Stat: {
    attributeClasses: {
      variant: {
        accent: 'ui-stat--accent',
        bare: 'ui-stat--bare',
        glass: 'ui-stat--glass'
      }
    },
    baseClassName: 'ui-stat',
    defaults: { 'data-slot': 'stat', variant: 'default' },
    tagName: 'lumen-stat'
  },
  StatDescription: {
    baseClassName: 'ui-stat-description',
    defaults: { 'data-slot': 'stat-description' },
    tagName: 'lumen-stat-description'
  },
  StatIcon: {
    baseClassName: 'ui-stat-icon',
    defaults: { 'data-slot': 'stat-icon' },
    tagName: 'lumen-stat-icon'
  },
  StatLabel: {
    baseClassName: 'ui-stat-label',
    defaults: { 'data-slot': 'stat-label' },
    tagName: 'lumen-stat-label'
  },
  StatTrend: {
    attributeClasses: {
      tone: {
        danger: 'ui-stat-trend--danger',
        neutral: 'ui-stat-trend--neutral',
        success: 'ui-stat-trend--success',
        warning: 'ui-stat-trend--warning'
      }
    },
    baseClassName: 'ui-stat-trend',
    defaults: { 'data-slot': 'stat-trend', tone: 'neutral' },
    tagName: 'lumen-stat-trend'
  },
  StatValue: {
    baseClassName: 'ui-stat-value',
    defaults: { 'data-slot': 'stat-value' },
    tagName: 'lumen-stat-value'
  },
  Stack: lumenStackElementConfig,
  Meter: { baseClassName: 'ui-meter', tagName: 'lumen-meter' },
  Note: {
    attributeClasses: {
      'border-position': {
        left: 'ui-note--border-left',
        none: 'ui-note--border-none',
        right: 'ui-note--border-right'
      }
    },
    baseClassName: 'ui-note',
    defaults: { 'border-position': 'left' },
    tagName: 'lumen-note'
  },
  Rating: { baseClassName: 'ui-rating', tagName: 'lumen-rating' },
  Timeline: { baseClassName: 'ui-timeline', tagName: 'lumen-timeline' },
  AnimatedLogo: {
    baseClassName: 'ui-animated-logo',
    tagName: 'lumen-animated-logo'
  },
  AnimatedPortrait: {
    baseClassName: 'ui-animated-portrait',
    tagName: 'lumen-animated-portrait'
  },
  ButtonLink: {
    attributeClasses: {
      shape: { icon: 'ui-button-link--icon' },
      variant: { unstyled: 'ui-button-link--unstyled' }
    },
    baseClassName: 'ui-button-link',
    defaults: { 'data-slot': 'button-link' },
    tagName: 'lumen-button-link'
  },
  CoverImage: {
    attributeClasses: { hover: { true: 'ui-cover-image--hover' } },
    baseClassName: 'ui-cover-image',
    tagName: 'lumen-cover-image'
  },
  GradientDivider: {
    baseClassName: 'ui-gradient-divider',
    tagName: 'lumen-gradient-divider'
  },
  Graphic: {
    attributeClasses: {
      size: {
        lg: 'ui-graphic--lg',
        md: 'ui-graphic--md',
        sm: 'ui-graphic--sm'
      },
      tone: {
        accent: 'ui-graphic--accent',
        brand: 'ui-graphic--brand',
        neutral: 'ui-graphic--neutral'
      },
      variant: {
        glow: 'ui-graphic--glow',
        grid: 'ui-graphic--grid',
        orbit: 'ui-graphic--orbit'
      }
    },
    baseClassName: 'ui-graphic',
    defaults: { size: 'md', tone: 'brand', variant: 'orbit' },
    tagName: 'lumen-graphic'
  },
  Backdrop: {
    attributeClasses: {
      intensity: {
        medium: 'ui-backdrop--medium',
        strong: 'ui-backdrop--strong',
        subtle: 'ui-backdrop--subtle'
      },
      tone: {
        accent: 'ui-backdrop--accent',
        brand: 'ui-backdrop--brand',
        neutral: 'ui-backdrop--neutral'
      },
      variant: {
        aurora: 'ui-backdrop--aurora',
        dots: 'ui-backdrop--dots',
        grid: 'ui-backdrop--grid',
        rays: 'ui-backdrop--rays'
      }
    },
    baseClassName: 'ui-backdrop',
    defaults: { intensity: 'medium', tone: 'brand', variant: 'aurora' },
    tagName: 'lumen-backdrop'
  },
  Illustration: {
    attributeClasses: {
      size: {
        lg: 'ui-illustration--lg',
        md: 'ui-illustration--md',
        sm: 'ui-illustration--sm'
      },
      tone: {
        accent: 'ui-illustration--accent',
        auto: 'ui-illustration--auto',
        brand: 'ui-illustration--brand',
        neutral: 'ui-illustration--neutral'
      },
      variant: {
        empty: 'ui-illustration--empty',
        error: 'ui-illustration--error',
        offline: 'ui-illustration--offline',
        success: 'ui-illustration--success'
      }
    },
    baseClassName: 'ui-illustration',
    defaults: { size: 'md', tone: 'auto', variant: 'empty' },
    tagName: 'lumen-illustration'
  },
  Stepper: {
    attributeClasses: { orientation: { vertical: 'ui-stepper--vertical' } },
    baseClassName: 'ui-stepper',
    defaults: { orientation: 'horizontal' },
    tagName: 'lumen-stepper'
  },
  FileUpload: {
    baseClassName: 'ui-file-upload',
    defaults: { 'data-ui-file-upload': '' },
    tagName: 'lumen-file-upload'
  },
  Tour: {
    baseClassName: 'ui-tour',
    defaults: { 'data-ui-tour': '' },
    tagName: 'lumen-tour'
  },
  Anchor: {
    baseClassName: 'ui-anchor',
    defaults: {
      'aria-label': 'On this page',
      'activation-offset': '96',
      'data-ui-anchor': '',
      'data-ui-anchor-offset': '96'
    },
    tagName: 'lumen-anchor'
  },
  Segmented: {
    attributeClasses: {
      size: { lg: 'ui-segmented--lg', sm: 'ui-segmented--sm' }
    },
    baseClassName: 'ui-segmented',
    defaults: { role: 'group' },
    tagName: 'lumen-segmented'
  },
  Toolbar: {
    attributeClasses: { orientation: { vertical: 'ui-toolbar--vertical' } },
    baseClassName: 'ui-toolbar',
    defaults: {
      'aria-label': 'Toolbar',
      'data-ui-toolbar': '',
      orientation: 'horizontal',
      role: 'toolbar'
    },
    tagName: 'lumen-toolbar'
  },
  Descriptions: {
    baseClassName: 'ui-descriptions',
    tagName: 'lumen-descriptions'
  },
  Popconfirm: {
    baseClassName: 'ui-popover ui-popconfirm',
    defaults: { 'data-ui-popconfirm': '', 'data-ui-popover': '' },
    tagName: 'lumen-popconfirm'
  },
  Transfer: {
    baseClassName: 'ui-transfer',
    defaults: { 'data-ui-transfer': '' },
    tagName: 'lumen-transfer'
  },
  Cascader: {
    baseClassName: 'ui-cascader',
    defaults: { 'data-ui-cascader': '' },
    tagName: 'lumen-cascader'
  },
  TreeSelect: {
    baseClassName: 'ui-tree-select',
    defaults: { 'data-ui-tree-select': '' },
    tagName: 'lumen-tree-select'
  },
  Mentions: {
    baseClassName: 'ui-mentions',
    defaults: { 'data-ui-mentions': '' },
    tagName: 'lumen-mentions'
  },
  QRCode: { baseClassName: 'ui-qr-code', tagName: 'lumen-qr-code' },
  Watermark: {
    baseClassName: 'ui-watermark',
    defaults: { 'data-ui-watermark': '' },
    tagName: 'lumen-watermark'
  },
  Affix: {
    attributeClasses: { position: { bottom: 'ui-affix--bottom' } },
    baseClassName: 'ui-affix',
    defaults: { position: 'top' },
    tagName: 'lumen-affix'
  },
  SpeedDial: {
    attributeClasses: {
      direction: {
        down: 'ui-speed-dial--down',
        left: 'ui-speed-dial--left',
        right: 'ui-speed-dial--right',
        up: 'ui-speed-dial--up'
      }
    },
    baseClassName: 'ui-speed-dial',
    defaults: { 'data-ui-speed-dial': '', direction: 'up' },
    tagName: 'lumen-speed-dial'
  }
} as const satisfies Record<
  (typeof lumenComponentNames)[number],
  LumenElementConfig
>

const observedAttributeNames = [
  'activation-offset',
  'animation',
  'area',
  'autocomplete',
  'border-position',
  'caption',
  'center-label',
  'center-value',
  'checked',
  'columns',
  'country',
  'country-name',
  'decimals',
  'data',
  'default-value',
  'delay',
  'decorative',
  'direction',
  'disabled',
  'duration',
  'from',
  'form',
  'gap',
  'glass',
  'heading',
  'hover',
  'intensity',
  'label',
  'label-template',
  'locale',
  'locales',
  'layout',
  'markers',
  'max',
  'maxlength',
  'min',
  'minlength',
  'multiple',
  'name',
  'orientation',
  'pattern',
  'position',
  'placeholder',
  'readonly',
  'required',
  'rows',
  'prefix',
  'pressed',
  'reference-value',
  'series',
  'shape',
  'show-endpoint',
  'show-legend',
  'show-table',
  'size',
  'surface',
  'stagger',
  'summary',
  'step',
  'storage-key',
  'suffix',
  'threshold',
  'tone',
  'type',
  'value',
  'values',
  'variant',
  'visual-size'
]

const hasDocument = (): boolean => typeof document !== 'undefined'

const parseMotionDuration = (value: string): number => {
  const parsedDuration = Number.parseFloat(value)

  if (!Number.isFinite(parsedDuration)) return 300

  return value.endsWith('ms') ? parsedDuration : parsedDuration * 1000
}

const createId = (prefix: string): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
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

  return [...root.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    element => !element.hasAttribute('hidden') && isElementVisible(element)
  )
}

const getOwnedTarget = (event: Event): Node | null => event.target instanceof Node ? event.target : null

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
): Element | null => scope instanceof Element ? scope.closest(selector) : null

const isNativeFormControl = (
  element: EventTarget | null
): element is NativeFormControl => element instanceof HTMLInputElement ||
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

const validateControl = (
  control: NativeFormControl,
  form: HTMLFormElement
): boolean => {
  form.dispatchEvent(
    new CustomEvent('ui:validate', {
      bubbles: true,
      detail: { control, form, value: control.value }
    })
  )

  const invalid = !control.validity.valid

  const message = invalid ?
    getValidationMessage(control, getFieldRoot(control)) :
    ''

  setFieldValidity(control, invalid, message)

  return !invalid
}

const getFormControls = (form: HTMLFormElement): NativeFormControl[] => [
  ...form.querySelectorAll<NativeFormControl>(formControlSelector)
].filter(control => control.form === form && !control.disabled)

const validateForm = (form: HTMLFormElement): NativeFormControl[] => (
  getFormControls(form).filter(control => !validateControl(control, form))
)

const initLumenFields = (scope: ParentNode): void => {
  for (const root of getScopedElements<HTMLElement>(
    scope, '.ui-field, [data-ui-field]'
  )) {
    if (root.dataset.uiFieldBound === 'true') continue

    const control = getFieldControl(root)

    if (!control) continue

    root.dataset.uiFieldBound = 'true'

    const existingIds =
      control.getAttribute('aria-describedby')?.trim().split(/\s+/) ?? []

    const configuredIds =
      root.dataset.uiFieldDescribedby?.trim().split(/\s+/) ?? []

    const descriptionIds = [
      ...root.querySelectorAll<HTMLElement>(fieldDescriptionSelector)
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
}

const initLumenForms = (scope: ParentNode): void => {
  for (const form of getScopedElements<HTMLFormElement>(
    scope, 'form[data-ui-form]'
  )) {
    if (form.dataset.uiFormBound === 'true') continue

    form.dataset.uiFormBound = 'true'

    form.noValidate = true

    const setStatus = (status: 'error' | 'idle' | 'submitting'): void => {
      form.dataset.status = status

      if (status === 'submitting') form.setAttribute('aria-busy', 'true')
      else form.removeAttribute('aria-busy')
    }

    form.addEventListener('click', event => {
      const target = event.target

      if (!(target instanceof Element)) return

      const link = target.closest<HTMLAnchorElement>(
        '[data-ui-error-summary] a[href^="#"]'
      )

      const controlId = link?.hash.slice(1)
      const control = controlId ? document.getElementById(controlId) : null

      if (!link || !(control instanceof HTMLElement) || !form.contains(control))
        return

      event.preventDefault()

      control.focus({ preventScroll: true })

      control.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })

    form.addEventListener('focusout', event => {
      if (!isNativeFormControl(event.target) || event.target.form !== form)
        return

      const valid = validateControl(event.target, form)

      form.dispatchEvent(
        new CustomEvent(valid ? 'ui:valid' : 'ui:invalid', {
          bubbles: true,
          detail: valid ?
            { control: event.target, form } :
            { control: event.target, controls: [event.target], form }
        })
      )
    })

    form.addEventListener('submit', event => {
      if (form.dataset.status === 'submitting') {
        event.preventDefault()

        return
      }

      const invalidControls = validateForm(form)

      if (invalidControls.length) {
        event.preventDefault()

        setStatus('error')

        const firstInvalid = invalidControls[0]

        const errorSummary = form.querySelector<HTMLElement>(
          '[data-ui-error-summary]:not([hidden])'
        )

        if (!firstInvalid) return

        form.dispatchEvent(
          new CustomEvent('ui:invalid', {
            bubbles: true,
            detail: { control: firstInvalid, controls: invalidControls, form }
          })
        )

        if (errorSummary) {
          errorSummary.focus({ preventScroll: true })
        } else {
          firstInvalid.focus({ preventScroll: true })

          firstInvalid.reportValidity()
        }

        return
      }

      form.dispatchEvent(
        new CustomEvent('ui:valid', {
          bubbles: true,
          detail: { controls: getFormControls(form), form }
        })
      )

      setStatus('submitting')

      queueMicrotask(() => {
        if (event.defaultPrevented) setStatus('idle')
      })
    })

    form.addEventListener('reset', () => {
      setStatus('idle')
    })
  }
}

export const enhanceLumenPasswordFields = (
  scope: ParentNode = document
): void => {
  for (const root of getScopedElements<HTMLElement>(
    scope, 'lumen-password-field, [data-ui-password-field]'
  )) {
    if (root.dataset.uiPasswordBound === 'true') continue

    let input = root.querySelector<HTMLInputElement>(
      'input[data-ui-password-input], input[type="password"]'
    )

    if (!input && root.localName === 'lumen-password-field') {
      input = document.createElement('input')

      input.className = 'ui-input'

      input.dataset.uiPasswordInput = ''

      input.type = 'password'

      for (const attribute of [
        'autocomplete',
        'disabled',
        'form',
        'id',
        'maxlength',
        'minlength',
        'name',
        'pattern',
        'placeholder',
        'readonly',
        'required',
        'value'
      ]) {
        const attributeValue = root.getAttribute(attribute)

        if (attributeValue !== null)
          input.setAttribute(attribute, attributeValue)
      }

      root.append(input)
    }

    if (!input) continue

    let toggle = root.querySelector<HTMLButtonElement>(
      '[data-ui-password-toggle]'
    )

    if (!toggle) {
      toggle = document.createElement('button')

      toggle.className = 'ui-button ui-button--ghost ui-button--icon'

      toggle.dataset.uiPasswordToggle = ''

      toggle.type = 'button'

      toggle.innerHTML = '<span aria-hidden="true">Show</span>'

      root.append(toggle)
    }

    root.dataset.uiPasswordBound = 'true'

    const showLabel = root.dataset.showLabel ?? 'Show password'
    const hideLabel = root.dataset.hideLabel ?? 'Hide password'
    const visibleLabel = toggle.querySelector<HTMLElement>('span')

    const setVisible = (visible: boolean): void => {
      input.type = visible ? 'text' : 'password'

      toggle.setAttribute('aria-controls', input.id)

      toggle.setAttribute('aria-label', visible ? hideLabel : showLabel)

      toggle.setAttribute('aria-pressed', String(visible))

      if (visibleLabel) visibleLabel.textContent = visible ? 'Hide' : 'Show'
    }

    toggle.addEventListener('click', () => {
      setVisible(input.type === 'password')

      input.focus({ preventScroll: true })
    })

    input.form?.addEventListener('reset', () => {
      setVisible(false)
    })

    const form = input.form

    if (form && typeof MutationObserver !== 'undefined') {
      const hideAfterSuccess = (): void => {
        if (form.dataset.status === 'success') setVisible(false)
      }

      const observer = new MutationObserver(hideAfterSuccess)

      observer.observe(form, {
        attributeFilter: ['data-status'],
        attributes: true
      })

      hideAfterSuccess()
    }

    setVisible(false)
  }
}

const getListBoxSelectedValues = (select: HTMLSelectElement): string[] => [
  ...select.selectedOptions
].map(option => option.value)

const getListBoxGroup = (
  list: HTMLElement,
  nativeGroup: HTMLOptGroupElement,
  nativeGroups: Map<HTMLOptGroupElement, HTMLElement>,
  select: HTMLSelectElement
): HTMLElement => {
  const existing = nativeGroups.get(nativeGroup)

  if (existing) return existing

  const group = document.createElement('div')
  const label = document.createElement('div')
  const labelId = `${select.id || 'ui-list-box'}-group-${nativeGroups.size}`

  group.setAttribute('aria-labelledby', labelId)

  group.setAttribute('role', 'group')

  label.className = 'ui-list-box__section'

  label.id = labelId

  label.textContent = nativeGroup.label

  group.append(label)

  nativeGroups.set(nativeGroup, group)

  list.append(group)

  return group
}

export const enhanceLumenListBoxes = (scope: ParentNode = document): void => {
  for (const root of getScopedElements<HTMLElement>(
    scope, 'lumen-list-box, [data-ui-list-box]'
  )) {
    if (root.dataset.uiListBoxBound === 'true') continue

    let select = root.querySelector<HTMLSelectElement>(
      '[data-ui-list-box-native], select'
    )

    if (!select && root.localName === 'lumen-list-box') {
      select = document.createElement('select')

      select.dataset.uiListBoxNative = ''

      for (const attribute of [
        'disabled',
        'form',
        'id',
        'multiple',
        'name',
        'required',
        'size'
      ]) {
        const attributeValue = root.getAttribute(attribute)

        if (attributeValue !== null)
          select.setAttribute(attribute, attributeValue)
      }

      const optionNodes = [...root.children].filter(
        child => child instanceof HTMLOptionElement ||
          child instanceof HTMLOptGroupElement
      )

      select.append(...optionNodes)

      root.prepend(select)
    }

    if (!select) continue

    select.dataset.uiListBoxNative = ''

    select.dataset.uiListBoxEnhanced = 'true'

    const loading =
      root.hasAttribute('loading') || root.dataset.loading === 'true'

    if (loading) select.disabled = true

    let list = root.querySelector<HTMLElement>('[data-ui-list-box-list]')

    if (!list) {
      list = document.createElement('div')

      list.className = 'ui-list-box__list'

      list.dataset.uiListBoxList = ''

      list.setAttribute('role', 'listbox')

      list.tabIndex = select.disabled ? -1 : 0

      list.toggleAttribute('aria-multiselectable', select.multiple)

      const nativeGroups = new Map<HTMLOptGroupElement, HTMLElement>()

      for (const nativeOption of select.options) {
        const option = document.createElement('div')

        option.className = 'ui-list-box__option'

        option.dataset.uiListBoxOption = ''

        option.dataset.value = nativeOption.value

        option.textContent = nativeOption.textContent

        option.setAttribute('role', 'option')

        if (nativeOption.disabled) option.setAttribute('aria-disabled', 'true')

        const nativeGroup = nativeOption.parentElement

        if (nativeGroup instanceof HTMLOptGroupElement) {
          getListBoxGroup(list, nativeGroup, nativeGroups, select).append(option)
        } else {
          list.append(option)
        }
      }

      root.append(list)
    }

    const options = [
      ...list.querySelectorAll<HTMLElement>('[data-ui-list-box-option]')
    ]

    list.toggleAttribute('aria-busy', loading)

    if (!options.length) {
      const message = document.createElement('div')

      message.className = loading ?
        'ui-list-box__status' :
        'ui-list-box__empty'

      message.setAttribute('role', loading ? 'status' : 'option')

      if (!loading) message.setAttribute('aria-disabled', 'true')

      message.textContent = loading ?
        (root.getAttribute('loading-message') ?? 'Loading options') :
        (root.getAttribute('empty-message') ?? 'No options available')

      list.append(message)

      root.dataset.uiListBoxBound = 'true'

      continue
    }

    root.dataset.uiListBoxBound = 'true'

    let activeIndex = Math.max(
      0, options.findIndex(
        option => option.getAttribute('aria-disabled') !== 'true'
      )
    )

    let typeahead = ''
    let typeaheadTimer: ReturnType<typeof globalThis.setTimeout> | undefined

    const syncActive = (): void => {
      options.forEach((option, index) => {
        option.id ||= `${select.id || 'ui-list-box'}-option-${index}`

        option.dataset.active = index === activeIndex ? 'true' : 'false'
      })

      const activeOption = options[activeIndex]

      if (activeOption)
        list.setAttribute('aria-activedescendant', activeOption.id)
    }

    const syncSelected = (): void => {
      const selectedValues = new Set(getListBoxSelectedValues(select))

      options.forEach(option => {
        option.setAttribute(
          'aria-selected', String(selectedValues.has(option.dataset.value ?? ''))
        )
      })
    }

    const commitOption = (index: number): void => {
      const option = options[index]

      if (
        !option ||
        option.getAttribute('aria-disabled') === 'true' ||
        select.disabled
      )
        return

      const nativeOption = [...select.options].find(
        item => item.value === option.dataset.value
      )

      if (!nativeOption) return

      if (select.multiple) nativeOption.selected = !nativeOption.selected
      else select.value = nativeOption.value

      syncSelected()

      select.dispatchEvent(
        new Event('input', { bubbles: true, composed: true })
      )

      select.dispatchEvent(
        new Event('change', { bubbles: true, composed: true })
      )

      root.dispatchEvent(
        new CustomEvent('ui:list-box-change', {
          bubbles: true,
          composed: true,
          detail: { values: getListBoxSelectedValues(select) }
        })
      )
    }

    const moveActive = (direction: 1 | -1): void => {
      let nextIndex = activeIndex

      for (const _option of options) {
        nextIndex = (nextIndex + direction + options.length) % options.length

        if (options[nextIndex]?.getAttribute('aria-disabled') !== 'true') {
          activeIndex = nextIndex

          syncActive()

          if (root.dataset.selectionFollowsFocus === 'true')
            commitOption(activeIndex)

          return
        }
      }
    }

    list.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()

        moveActive(1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()

        moveActive(-1)
      } else if (event.key === 'Home') {
        event.preventDefault()

        activeIndex = Math.max(
          0, options.findIndex(
            option => option.getAttribute('aria-disabled') !== 'true'
          )
        )

        syncActive()

        if (root.dataset.selectionFollowsFocus === 'true')
          commitOption(activeIndex)
      } else if (event.key === 'End') {
        event.preventDefault()

        for (let index = options.length - 1; index >= 0; index -= 1) {
          if (options[index]?.getAttribute('aria-disabled') !== 'true') {
            activeIndex = index

            break
          }
        }

        syncActive()

        if (root.dataset.selectionFollowsFocus === 'true')
          commitOption(activeIndex)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()

        commitOption(activeIndex)
      } else if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        typeahead += event.key.toLowerCase()

        if (typeaheadTimer) globalThis.clearTimeout(typeaheadTimer)

        typeaheadTimer = globalThis.setTimeout(() => {
          typeahead = ''
        }, 700)

        const nextIndex = options.findIndex(
          option => option.getAttribute('aria-disabled') !== 'true' &&
            option.textContent.trim().toLowerCase().startsWith(typeahead)
        )

        if (nextIndex >= 0) {
          activeIndex = nextIndex

          syncActive()

          if (root.dataset.selectionFollowsFocus === 'true')
            commitOption(activeIndex)
        }
      }
    })

    options.forEach((option, index) => {
      option.addEventListener('click', () => {
        activeIndex = index

        syncActive()

        commitOption(index)
      })
    })

    select.addEventListener('change', syncSelected)

    select.form?.addEventListener('reset', () => {
      globalThis.setTimeout(() => {
        syncSelected()

        activeIndex = Math.max(
          0, options.findIndex(
            option => option.getAttribute('aria-selected') === 'true'
          )
        )

        syncActive()
      })
    })

    syncSelected()

    syncActive()
  }
}

export const enhanceLumenForms = (scope: ParentNode = document): void => {
  initLumenFields(scope)

  initLumenForms(scope)
}

const installFormController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsFormsBound === 'true'
  )
    return

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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}

const getRichTextCommandValue = (control: HTMLElement): string | undefined => {
  if (control.dataset.uiEditorValue !== undefined)
    return control.dataset.uiEditorValue

  if (
    control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement ||
    control instanceof HTMLTextAreaElement
  )
    return control.value

  return undefined
}

const syncRichTextCommandStates = (root: HTMLElement): void => {
  const commandDocument = document as unknown as RichTextCommandDocument

  for (const control of root.querySelectorAll<HTMLElement>(
    richTextEditorCommandSelector
  )) {
    const command = control.dataset.uiEditorCommand ?? ''
    const value = getRichTextCommandValue(control)
    let active = false

    if (isLumenRichTextToggleCommand(command)) {
      active = commandDocument.queryCommandState?.(command) ?? false

      control.setAttribute('aria-pressed', String(active))
    } else if (command === 'formatBlock' && value) {
      const currentValue = commandDocument
        .queryCommandValue?.(command)
        .replaceAll(/[<>]/g, '')
        .toLowerCase()

      active = currentValue === value.replaceAll(/[<>]/g, '').toLowerCase()
    }

    control.dataset.state = active ? 'on' : 'off'
  }
}

const dispatchRichTextChange = (root: HTMLElement): void => {
  const editable = root.querySelector<HTMLElement>(
    richTextEditorContentSelector
  )

  if (!editable) return

  const detail: LumenRichTextChangeDetail = {
    html: editable.innerHTML,
    text: editable.textContent
  }

  root.dispatchEvent(
    new CustomEvent<LumenRichTextChangeDetail>('ui:editor-change', {
      bubbles: true,
      detail
    })
  )
}

const executeRichTextCommand = (
  root: HTMLElement,
  command: string,
  value?: string
): boolean => {
  if (!command) return false

  const commandDocument = document as unknown as RichTextCommandDocument
  let executed = false

  if (typeof commandDocument.execCommand === 'function') {
    executed =
      value === undefined ?
        commandDocument.execCommand(command) :
        commandDocument.execCommand(command, false, value)
  }

  const detail: LumenRichTextCommandDetail = {
    command,
    executed,
    ...(value === undefined ? {} : { value })
  }

  root.dispatchEvent(
    new CustomEvent<LumenRichTextCommandDetail>('ui:editor-command', {
      bubbles: true,
      detail
    })
  )

  syncRichTextCommandStates(root)

  dispatchRichTextChange(root)

  return executed
}

const initRichTextEditors = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, richTextEditorSelector)
  const roots = getScopedElements<HTMLElement>(scope, richTextEditorSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    if (root.dataset.uiEditorBound === 'true') continue

    root.dataset.uiEditorBound = 'true'

    for (const control of root.querySelectorAll<HTMLElement>(
      richTextEditorCommandSelector
    )) {
      control.dataset.uiEditorCommandBound = 'true'

      const execute = () => {
        executeRichTextCommand(
          root, control.dataset.uiEditorCommand ?? '', getRichTextCommandValue(control)
        )
      }

      if (control instanceof HTMLSelectElement)
        control.addEventListener('change', execute)
      else control.addEventListener('click', execute)
    }

    root.addEventListener('keydown', event => {
      if (
        !(event.target instanceof HTMLElement) ||
        !event.target.closest(richTextEditorContentSelector)
      )
        return

      const command = getLumenRichTextShortcut(event)

      if (!command) return

      event.preventDefault()

      executeRichTextCommand(root, command)
    })

    root.addEventListener('input', event => {
      if (
        !(event.target instanceof HTMLElement) ||
        !event.target.closest(richTextEditorContentSelector)
      )
        return

      syncRichTextCommandStates(root)

      dispatchRichTextChange(root)
    })

    root.addEventListener('keyup', () => {
      syncRichTextCommandStates(root)
    })

    root.addEventListener('mouseup', () => {
      syncRichTextCommandStates(root)
    })

    syncRichTextCommandStates(root)
  }
}

export const enhanceLumenRichTextEditors = (
  scope: ParentNode = document
): void => {
  initRichTextEditors(scope)
}

const installRichTextEditorController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsRichTextEditorsBound === 'true'
  )
    return

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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}

const getScheduleTransferValue = (event: HTMLElement): string => event.id || event.textContent.trim()

const initSchedules = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, scheduleSelector)
  const roots = getScopedElements<HTMLElement>(scope, scheduleSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    root.dataset.uiScheduleBound = 'true'

    for (const scheduleEvent of root.querySelectorAll<HTMLElement>(
      scheduleEventSelector
    )) {
      if (scheduleEvent.dataset.uiScheduleEventBound === 'true') continue

      scheduleEvent.dataset.uiScheduleEventBound = 'true'

      scheduleEvent.draggable =
        scheduleEvent.draggable || scheduleEvent.dataset.uiDraggable === 'true'

      scheduleEvent.addEventListener('dragstart', event => {
        event.dataTransfer?.setData(
          'text/plain', getScheduleTransferValue(scheduleEvent)
        )

        root.dataset.uiDragging = 'true'
      })

      scheduleEvent.addEventListener('dragend', () => {
        delete root.dataset.uiDragging
      })
    }

    for (const slot of root.querySelectorAll<HTMLElement>(
      scheduleSlotSelector
    )) {
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

        root.dispatchEvent(
          new CustomEvent('ui:schedule-change', {
            bubbles: true,
            detail: {
              ...(draggedId ? { eventId: draggedId } : {}),
              ...(slot.dataset.uiScheduleSlot ?
                { slot: slot.dataset.uiScheduleSlot } :
                {})
            }
          })
        )
      })
    }
  }
}

export const enhanceLumenSchedules = (scope: ParentNode = document): void => {
  initSchedules(scope)
}

const installScheduleController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsSchedulesBound === 'true'
  )
    return

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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}

/* cspell:ignore valuenow */
/* eslint-disable @stylistic/padding-line-between-statements -- Resizable mirrors Astro's compact pane sizing runtime. */
const parseResizableNumberList = (
  value: string | undefined,
  count: number,
  fallback: number
): number[] => {
  const values = (value ?? '')
    .split(',')
    .map(item => Number.parseFloat(item.trim()))
    .filter(Number.isFinite)

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

const getResizablePanes = (root: HTMLElement): HTMLElement[] => [...root.children].filter(
  (child): child is HTMLElement => child instanceof HTMLElement &&
    !child.hasAttribute('data-ui-resizable-handle') &&
    !child.hasAttribute('data-ui-resizable-handle-template')
)

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

    handle.setAttribute(
      'aria-valuemin', String(Math.round(minSizes[index] ?? 0))
    )
    handle.setAttribute(
      'aria-valuemax', String(Math.round(maxSizes[index] ?? 100))
    )
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
  const min = Math.max(
    minSizes[index] ?? 0, total - (maxSizes[nextIndex] ?? 100)
  )
  const max = Math.min(
    maxSizes[index] ?? 100, total - (minSizes[nextIndex] ?? 0)
  )
  const paneSize = Math.min(max, Math.max(min, nextSize))

  sizes[index] = paneSize
  sizes[nextIndex] = total - paneSize
}

const createResizableHandle = (
  root: HTMLElement,
  index: number,
  separatorOrientation: 'horizontal' | 'vertical'
): HTMLButtonElement => {
  const template = root.querySelector<HTMLTemplateElement>(
    `:scope > ${resizableHandleTemplateSelector}`
  )
  const handleFromTemplate = template?.content
    .querySelector<HTMLButtonElement>(resizableHandleSelector)
    ?.cloneNode(true)
  const handle =
    handleFromTemplate instanceof HTMLButtonElement ?
      handleFromTemplate :
      document.createElement('button')

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
    root.classList.toggle(
      'ui-resizable--vertical', root.dataset.orientation === 'vertical'
    )

    const direction =
      root.dataset.orientation === 'vertical' ? 'vertical' : 'horizontal'
    const separatorOrientation =
      direction === 'horizontal' ? 'vertical' : 'horizontal'
    const axis = direction === 'horizontal' ? 'clientX' : 'clientY'
    const sizeProperty = direction === 'horizontal' ? 'width' : 'height'
    const minSizes = parseResizableNumberList(
      root.dataset.uiResizableMinSize, panes.length, 12
    )
    const maxSizes = parseResizableNumberList(
      root.dataset.uiResizableMaxSize, panes.length, 88
    )
    const initialSizes = normalizeResizableSizes(
      parseResizableNumberList(
        root.dataset.uiResizableDefaultSizes, panes.length, 100 / panes.length
      ), panes.length
    )
    let sizes = [...initialSizes]
    const handles: HTMLElement[] = []

    for (const [index, pane] of panes.entries()) {
      pane.dataset.uiResizablePanel = ''

      if (index >= panes.length - 1) continue

      const existingHandle =
        pane.nextElementSibling instanceof HTMLElement &&
        pane.nextElementSibling.matches(resizableHandleSelector) ?
          (pane.nextElementSibling as HTMLButtonElement) :
          null
      const handle =
        existingHandle ??
        createResizableHandle(root, index, separatorOrientation)

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
        const keyDeltas: Record<string, number> =
          direction === 'horizontal' ?
            { ArrowLeft: -step, ArrowRight: step } :
            { ArrowDown: step, ArrowUp: -step }

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

export const enhanceLumenResizable = (scope: ParentNode = document): void => {
  initResizableGroups(scope)
}

const installResizableController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsResizableBound === 'true'
  )
    return

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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
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
  const inputs = [
    ...root.querySelectorAll<HTMLInputElement>(dateRangePickerInputSelector)
  ]

  const start = inputs[0]
  const end = inputs.at(-1)

  if (!start || !end || start === end) return

  const datePickers = root.querySelectorAll<HTMLElement>(datePickerSelector)

  datePickers[0]?.setAttribute('data-range-part', 'start')

  datePickers[datePickers.length - 1]?.setAttribute('data-range-part', 'end')

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

    end.dispatchEvent(new Event('change', { bubbles: true }))
  }

  let rangeState = 'empty'

  if (start.value && end.value) {
    rangeState = 'complete'
  } else if (start.value) {
    rangeState = 'selecting-end'
  }

  root.dataset.rangeState = rangeState
}

const initDateRangePickers = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, dateRangePickerSelector)
  const roots = getScopedElements<HTMLElement>(scope, dateRangePickerSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    for (const input of root.querySelectorAll<HTMLInputElement>(
      dateRangePickerInputSelector
    )) {
      if (input.dataset.uiDateRangeInputBound === 'true') continue

      input.dataset.uiDateRangeInputBound = 'true'

      input.addEventListener('change', () => {
        syncDateRangePicker(root)
      })
    }

    syncDateRangePicker(root)
  }
}

const initDatePickers = (scope: ParentNode): void => {
  const closestRoot = getClosestScopedElement(scope, datePickerSelector)
  const roots = getScopedElements<HTMLElement>(scope, datePickerSelector)

  if (closestRoot instanceof HTMLElement && !roots.includes(closestRoot)) {
    roots.unshift(closestRoot)
  }

  for (const root of roots) {
    if (root.dataset.uiBound === 'true') continue

    const native = root.querySelector<HTMLInputElement>(
      datePickerNativeSelector
    )

    const control = root.querySelector<HTMLElement>(datePickerControlSelector)
    const trigger = root.querySelector<HTMLElement>(datePickerTriggerSelector)
    const valueEl = root.querySelector<HTMLElement>(datePickerValueSelector)
    const popover = root.querySelector<HTMLElement>(datePickerPopoverSelector)
    const calendar = root.querySelector<HTMLElement>(calendarSelector)

    if (!native || !control || !trigger || !popover) continue

    root.dataset.uiBound = 'true'

    native.dataset.uiEnhanced = 'true'

    control.hidden = false

    const closePopover = (): void => {
      popover.hidden = true

      popover.dataset.state = 'closed'

      trigger.setAttribute('aria-expanded', 'false')

      // eslint-disable-next-line no-use-before-define -- the paired callbacks reference each other.
      document.removeEventListener('click', handleOutsideClick)
    }

    const handleOutsideClick = (event: MouseEvent): void => {
      if (!(event.target instanceof Node)) return

      if (!popover.contains(event.target) && !trigger.contains(event.target)) {
        closePopover()
      }
    }

    const openPopover = (): void => {
      if (calendar) {
        if (native.min) calendar.dataset.uiCalendarMin = native.min
        else delete calendar.dataset.uiCalendarMin

        if (native.max) calendar.dataset.uiCalendarMax = native.max
        else delete calendar.dataset.uiCalendarMax
      }

      popover.hidden = false

      popover.dataset.state = 'open'

      trigger.setAttribute('aria-expanded', 'true')

      globalThis.setTimeout(() => {
        document.addEventListener('click', handleOutsideClick)
      })
    }

    trigger.addEventListener('click', () => {
      if (popover.hidden) {
        openPopover()
      } else {
        closePopover()
      }
    })

    popover.addEventListener('change', event => {
      const target = event.target

      if (
        target instanceof HTMLInputElement &&
        target.hasAttribute('data-ui-calendar-input')
      ) {
        const newDate = target.value

        native.value = newDate

        if (valueEl) valueEl.textContent = newDate || 'mm/dd/yyyy'

        native.dispatchEvent(
          new Event('change', { bubbles: true, cancelable: true })
        )

        closePopover()
      }
    })
  }
}

export const enhanceLumenDateRangePickers = (
  scope: ParentNode = document
): void => {
  initDateRangePickers(scope)
}

const installDateRangePickerController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsDateRangePickersBound === 'true'
  )
    return

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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}

export const enhanceLumenDatePickers = (scope: ParentNode = document): void => {
  initDatePickers(scope)
}

const installDatePickerController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsDatePickersBound === 'true'
  )
    return

  document.documentElement.dataset.uiElementsDatePickersBound = 'true'

  enhanceLumenDatePickers(document)

  if (typeof MutationObserver === 'undefined') return

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          enhanceLumenDatePickers(node)
        }
      }
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}

/* eslint-disable @stylistic/padding-line-between-statements -- InputOTP mirrors Astro's compact DOM synchronization runtime. */
const defaultInputOtpLength = 6
const defaultInputOtpPattern = '[0-9]*'

const normalizeInputOtpLength = (value: string | null | undefined): number => Math.max(1, Number.parseInt(value ?? '', 10) || defaultInputOtpLength)

const getInputOtpLength = (root: HTMLElement): number => normalizeInputOtpLength(
  root.getAttribute('length') ??
  root.getAttribute('maxlength') ??
  root.dataset.uiInputOtpLength
)

const sanitizeInputOtpValue = (
  input: HTMLInputElement,
  value: string,
  length: number
): string => {
  const numericOnly =
    input.inputMode === 'numeric' ||
    input.getAttribute('pattern') === defaultInputOtpPattern
  const normalized = numericOnly ?
    value.replaceAll(/\D/g, '') :
    value.replaceAll(/\s/g, '')

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
    input.setAttribute(
      'autocomplete', root.getAttribute('autocomplete') ?? 'one-time-code'
    )
  }

  if (!input.hasAttribute('inputmode')) {
    input.setAttribute(
      'inputmode', root.getAttribute('inputmode') ?? 'numeric'
    )
  }

  if (!input.hasAttribute('maxlength')) {
    input.setAttribute(
      'maxlength', root.getAttribute('maxlength') ??
      root.getAttribute('length') ??
      String(length)
    )
  }

  if (!input.hasAttribute('pattern')) {
    input.setAttribute(
      'pattern', root.getAttribute('pattern') ?? defaultInputOtpPattern
    )
  }

  if (!input.hasAttribute('type')) {
    input.setAttribute('type', 'text')
  }

  for (const name of [
    'aria-describedby',
    'aria-label',
    'name',
    'placeholder'
  ]) {
    copyInputOtpAttribute(root, input, name)
  }

  input.disabled = root.hasAttribute('disabled') || input.disabled
  input.required = root.hasAttribute('required') || input.required

  if (
    root.hasAttribute('aria-invalid') &&
    !input.hasAttribute('aria-invalid')
  ) {
    input.setAttribute(
      'aria-invalid', root.getAttribute('aria-invalid') ?? 'true'
    )
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
  const segments = [
    ...segmentsRoot.querySelectorAll<HTMLButtonElement>(
      inputOtpSegmentSelector
    )
  ]

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

  const activeIndex = Math.min(
    length - 1, Math.max(0, input.selectionStart ?? value.length)
  )

  root.dataset.disabled = input.disabled ? 'true' : 'false'
  root.dataset.invalid =
    input.getAttribute('aria-invalid') === 'true' ? 'true' : 'false'

  for (const [index, segment] of segments.entries()) {
    const char = segment.querySelector<HTMLElement>('[data-ui-input-otp-char]')

    segment.disabled = input.disabled
    segment.dataset.active = String(
      document.activeElement === input && index === activeIndex
    )

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

export const enhanceLumenInputOTPs = (scope: ParentNode = document): void => {
  initInputOtpFields(scope)
}

const installInputOtpController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsInputOtpBound === 'true'
  )
    return

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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}
/* eslint-enable @stylistic/padding-line-between-statements */

/* cspell:ignore lsaquo rsaquo */
/* eslint-disable @stylistic/padding-line-between-statements -- Calendar mirrors Astro's UTC date grid runtime. */
const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/
const calendarMonthPattern = /^\d{4}-\d{2}$/

const parseCalendarDate = (value: string | null | undefined): Date | null => {
  if (!value || !calendarDatePattern.test(value)) return null

  const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = value
    .split('-')
    .map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day ?
    date :
    null
}

const parseCalendarMonth = (value: string | null | undefined): Date | null => {
  if (!value || !calendarMonthPattern.test(value)) return null

  const [year = Number.NaN, month = Number.NaN] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 ?
    date :
    null
}

const formatCalendarDate = (date: Date): string => date.toISOString().slice(0, 10)
const formatCalendarMonth = (date: Date): string => date.toISOString().slice(0, 7)
const addCalendarDays = (date: Date, days: number): Date => new Date(
  Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days
  )
)
const getCalendarDaysInMonth = (date: Date): number => new Date(
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
).getUTCDate()
const addCalendarMonths = (date: Date, months: number): Date => {
  const targetMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  )
  const day = Math.min(date.getUTCDate(), getCalendarDaysInMonth(targetMonth))

  return new Date(
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), day)
  )
}
const compareCalendarDates = (date: Date, other: Date | null): number => (
  other ? formatCalendarDate(date).localeCompare(formatCalendarDate(other)) : 0
)
const getCalendarToday = (): Date => {
  const today = new Date()

  return new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  )
}
const getCalendarGridStart = (month: Date): Date => addCalendarDays(month, -((month.getUTCDay() + 6) % 7))
const getCalendarLocale = (): string => document.documentElement.lang || navigator.language || 'en'

const isCalendarDateDisabled = (
  root: HTMLElement,
  date: Date,
  min: Date | null,
  max: Date | null
): boolean => root.dataset.disabled === 'true' ||
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
  const selectedDate = parseCalendarDate(
    root.getAttribute('value') ?? root.dataset.uiCalendarValue
  )
  const minDate = parseCalendarDate(
    root.getAttribute('min') ?? root.dataset.uiCalendarMin
  )
  const maxDate = parseCalendarDate(
    root.getAttribute('max') ?? root.dataset.uiCalendarMax
  )
  const monthDate =
    parseCalendarMonth(
      root.getAttribute('month') ?? root.dataset.uiCalendarMonth
    ) ??
    (selectedDate ?
      new Date(
        Date.UTC(
          selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1
        )
      ) :
      null) ??
      new Date(
        Date.UTC(
          getCalendarToday().getUTCFullYear(), getCalendarToday().getUTCMonth(), 1
        )
      )
  let input = root.querySelector<HTMLInputElement>(calendarInputSelector)

  root.dataset.uiCalendarInitialMonth ??= formatCalendarMonth(monthDate)
  root.dataset.uiCalendarMonth ||= formatCalendarMonth(monthDate)

  if (minDate) root.dataset.uiCalendarMin = formatCalendarDate(minDate)
  if (maxDate) root.dataset.uiCalendarMax = formatCalendarDate(maxDate)
  if (selectedDate)
    root.dataset.uiCalendarValue = formatCalendarDate(selectedDate)
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
  const previous = root.querySelector<HTMLButtonElement>(
    '[data-ui-calendar-prev]'
  )
  const next = root.querySelector<HTMLButtonElement>('[data-ui-calendar-next]')
  const disabled = root.dataset.disabled === 'true'
  const previousMonthLastDay = addCalendarDays(month, -1)
  const nextMonthFirstDay = addCalendarMonths(month, 1)

  if (previous)
    previous.disabled =
      disabled || compareCalendarDates(previousMonthLastDay, min) < 0
  if (next)
    next.disabled =
      disabled || compareCalendarDates(nextMonthFirstDay, max) > 0
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
  const month =
    parseCalendarMonth(root.dataset.uiCalendarMonth) ??
    (selectedDate ?
      new Date(
        Date.UTC(
          selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1
        )
      ) :
      null) ??
      getCalendarToday()
  const visibleMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1)
  )
  const focusDate = getCalendarFocusDate(
    root, visibleMonth, min, max, requestedFocusDate
  )
  const focusIso = formatCalendarDate(focusDate)
  const selectedIso = selectedDate ? formatCalendarDate(selectedDate) : ''
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(visibleMonth)
  const dayLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric'
  })
  const weekdayLabel = new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    weekday: 'short'
  })
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
    cell.textContent = weekdayLabel.format(
      new Date(Date.UTC(2026, 0, 5 + index))
    )
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
      if (formatCalendarMonth(date) !== formatCalendarMonth(visibleMonth))
        cell.dataset.outside = 'true'
      if (dateIso === todayIso) cell.dataset.today = 'true'
      if (selectedIso === dateIso) cell.dataset.selected = 'true'

      row.append(cell)
    }

    body.append(row)
  }

  grid.replaceChildren(header, body)

  if (shouldFocus) {
    root
      .querySelector<HTMLElement>(
        `${calendarDaySelector}[data-date="${focusIso}"]`
      )
      ?.focus({ preventScroll: true })
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

const moveCalendarFocus = (
  root: HTMLElement,
  currentDate: Date,
  key: string
): void => {
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
      root, addCalendarMonths(currentDate, key === 'PageDown' ? 1 : -1)
    )

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
    root
      .querySelector<HTMLButtonElement>('[data-ui-calendar-prev]')
      ?.addEventListener('click', () => {
        const month = parseCalendarMonth(root.dataset.uiCalendarMonth)

        if (!month) return

        const nextMonth = addCalendarMonths(month, -1)

        root.dataset.uiCalendarMonth = formatCalendarMonth(nextMonth)
        renderCalendar(root, nextMonth, true)
      })
    root
      .querySelector<HTMLButtonElement>('[data-ui-calendar-next]')
      ?.addEventListener('click', () => {
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

      if (
        !cell ||
        !root.contains(cell) ||
        cell.getAttribute('aria-disabled') === 'true'
      )
        return

      const date = parseCalendarDate(cell.dataset.date)

      if (date) selectCalendarDate(root, date)
    })
    root.addEventListener('keydown', event => {
      const target = event.target

      if (
        !(target instanceof HTMLElement) ||
        !target.hasAttribute('data-ui-calendar-day')
      )
        return

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
        root.dataset.uiCalendarMonth =
          root.dataset.uiCalendarInitialMonth ?? root.dataset.uiCalendarMonth
        renderCalendar(root)
      })
    })
  }
}

export const enhanceLumenCalendars = (scope: ParentNode = document): void => {
  initCalendars(scope)
}

const installCalendarController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsCalendarsBound === 'true'
  )
    return

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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}
/* eslint-enable @stylistic/padding-line-between-statements */

const closeContextMenu = (menu: HTMLElement): void => {
  if (menu.dataset.state !== 'open') return

  menu.dataset.state = 'closed'

  menu.hidden = true
}

const closeOpenContextMenus = (except?: HTMLElement): void => {
  if (!hasDocument()) return

  for (const menu of document.querySelectorAll<HTMLElement>(
    `${contextMenuSelector}[data-state="open"]`
  )) {
    if (menu !== except) {
      closeContextMenu(menu)
    }
  }
}

const openContextMenuAt = (menu: HTMLElement, x: number, y: number): void => {
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
  for (const trigger of getScopedElements<HTMLElement>(
    scope, contextMenuTriggerSelector
  )) {
    if (trigger.dataset.uiContextMenuBound === 'true') continue

    const menuId = trigger.getAttribute('data-ui-context-menu-trigger')

    const menu =
      menuId && hasDocument() ? document.getElementById(menuId) : null

    if (!(menu instanceof HTMLElement)) continue

    trigger.dataset.uiContextMenuBound = 'true'

    menu.hidden = true

    menu.dataset.state = 'closed'

    trigger.addEventListener('contextmenu', event => {
      event.preventDefault()

      openContextMenuAt(menu, event.clientX, event.clientY)
    })

    trigger.addEventListener('keydown', event => {
      if (
        event.key !== 'ContextMenu' &&
        !(event.shiftKey && event.key === 'F10')
      )
        return

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

      items[
        getLoopedIndex(event.key, currentIndex, items.length, ['ArrowDown'])
      ]?.focus()
    })

    menu.addEventListener('click', event => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[role="menuitem"]')
      ) {
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
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsContextMenusBound === 'true'
  )
    return

  document.documentElement.dataset.uiElementsContextMenusBound = 'true'

  enhanceLumenContextMenus(document)

  document.addEventListener('pointerdown', event => {
    const target = getOwnedTarget(event)

    if (!target) return

    for (const menu of document.querySelectorAll<HTMLElement>(
      `${contextMenuSelector}[data-state="open"]`
    )) {
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

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}

const getDataTableSortValue = (
  cell: HTMLTableCellElement | undefined
): string => {
  if (!cell) return ''

  return cell.dataset.sortValue ?? cell.textContent.trim()
}

const compareDataTableValues = (
  value: string,
  other: string,
  sortType: string | undefined
): number => {
  const numericValue = Number(value.replaceAll(',', ''))
  const numericOther = Number(other.replaceAll(',', ''))

  const useNumeric =
    sortType === 'number' ||
    (sortType !== 'string' &&
      value.trim() !== '' &&
      other.trim() !== '' &&
      Number.isFinite(numericValue) &&
      Number.isFinite(numericOther))

  if (useNumeric) {
    return numericValue - numericOther
  }

  return value.localeCompare(other, undefined, {
    numeric: true,
    sensitivity: 'base'
  })
}

const getDataTableRows = (table: HTMLTableElement): HTMLTableRowElement[] => [
  ...(table.tBodies[0]?.rows ?? [])
]

const getDataTableRowValue = (
  row: HTMLTableRowElement,
  index: number
): string => row.dataset.value || row.id || String(index)

const getNextDataTableSortDirection = (
  currentColumn: string | undefined,
  columnIndex: number,
  currentDirection: string | null
): DataTableSortDirection => {
  if (currentColumn !== String(columnIndex) || currentDirection === 'none')
    return 'ascending'

  if (currentDirection === 'ascending') return 'descending'

  return 'none'
}

const getControlledPanel = (trigger: HTMLElement): HTMLElement | null => {
  const controls = trigger.getAttribute('aria-controls')

  if (controls && hasDocument()) {
    return document.getElementById(controls)
  }

  return trigger.nextElementSibling instanceof HTMLElement ?
    trigger.nextElementSibling :
    null
}

const setDisclosureOpen = (
  trigger: HTMLElement,
  panel: HTMLElement,
  open: boolean
): void => {
  trigger.setAttribute('aria-expanded', String(open))

  panel.hidden = !open

  panel.dataset.state = open ? 'open' : 'closed'
}

const isPrintableKey = (event: KeyboardEvent): boolean => (
  event.key.length === 1 &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey
)

const escapeCssIdentifier = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value.replaceAll(/["#.:?[\\\]]/g, '\\$&')
}

const isToastPlacement = (
  placement: string | undefined
): placement is ToastPlacement => placement === 'top-left' ||
  placement === 'top-center' ||
  placement === 'top-right' ||
  placement === 'bottom-left' ||
  placement === 'bottom-center' ||
  placement === 'bottom-right'

const getToastPlacement = (placement: string | undefined): ToastPlacement => isToastPlacement(placement) ? placement : 'bottom-right'

const getToastVariantClass = (variant: ToastVariant): string | false => {
  if (variant === 'success') return 'ui-toast--success'

  if (variant === 'warning') return 'ui-toast--warning'

  if (variant === 'destructive') return 'ui-toast--destructive'

  return false
}

const normalizeToastViewport = (
  viewport: HTMLElement,
  placement?: string
): void => {
  viewport.classList.add('ui-sonner', 'ui-tvp')

  viewport.dataset.uiSonner = ''

  viewport.dataset.uiToastViewport = ''

  viewport.dataset.placement = getToastPlacement(
    placement ?? viewport.dataset.placement
  )

  viewport.setAttribute(
    'aria-live', viewport.getAttribute('aria-live') ?? 'polite'
  )

  viewport.setAttribute(
    'aria-atomic', viewport.getAttribute('aria-atomic') ?? 'false'
  )

  viewport.setAttribute(
    'aria-label', viewport.getAttribute('aria-label') ?? 'Notifications'
  )
}

const getToastViewport = (
  placement: string | undefined
): HTMLElement | null => {
  if (!hasDocument()) return null

  const resolvedPlacement = getToastPlacement(placement)
  const shouldUseAnyViewport = placement === undefined

  const existing = document.querySelector<HTMLElement>(
    `[data-ui-toast-viewport][data-placement="${resolvedPlacement}"], ` +
    `[data-ui-sonner][data-placement="${resolvedPlacement}"]`
  ) ?? (shouldUseAnyViewport ?
    document.querySelector<HTMLElement>(
      '[data-ui-toast-viewport], [data-ui-sonner]'
    ) :
    null)

  if (existing) {
    normalizeToastViewport(
      existing, existing.dataset.placement ?? resolvedPlacement
    )

    return existing
  }

  let tagName = 'div'

  if (typeof customElements !== 'undefined') {
    if (customElements.get('lumen-toast-viewport')) {
      tagName = 'lumen-toast-viewport'
    }
  }

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

  globalThis.setTimeout(() => {
    toast.remove()
  }, toastCloseDelay)
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

    timerState.timer = globalThis.setTimeout(() => {
      dismissToastElement(toast)
    }, timerState.remaining)
  }

  const pause = (): void => {
    if (timerState.timer) {
      globalThis.clearTimeout(timerState.timer)
    }

    timerState.remaining = Math.max(
      0, timerState.remaining - (Date.now() - timerState.startedAt)
    )
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

  toast.setAttribute(
    'aria-live', variant === 'destructive' ? 'assertive' : 'polite'
  )

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

    action.className =
      'ui-button ui-button--secondary ui-button--sm ui-toast__action'

    action.type = 'button'

    action.textContent = detail.action.label

    action.addEventListener('click', event => {
      detail.action?.onClick?.(event, toast)

      toast.dispatchEvent(
        new CustomEvent(detail.action?.event ?? 'ui:toast-action', {
          bubbles: true,
          detail: { id: toast.id, value: detail.action?.value }
        })
      )

      dismissToastElement(toast)
    })

    toast.append(action)
  }

  const dismiss = document.createElement('button')

  dismiss.className = 'ui-toast__dismiss'

  dismiss.type = 'button'

  dismiss.setAttribute('aria-label', 'Dismiss notification')

  dismiss.textContent = 'Dismiss'

  dismiss.addEventListener('click', () => {
    dismissToastElement(toast)
  })

  toast.append(dismiss)
}

export const LumenToast: ToastApi = {
  create(detail) {
    const viewport = getToastViewport(detail.placement)

    if (!viewport) return detail.id ?? createId('ui-toast')

    const id = detail.id ?? createId('ui-toast')
    const duration = detail.duration ?? defaultToastDuration

    const max =
      detail.max ?? Number(viewport.dataset.uiToastMax ?? defaultToastMax)

    const existingToast = document.getElementById(id)

    if (
      existingToast instanceof HTMLElement &&
      existingToast.hasAttribute('data-ui-toast')
    ) {
      existingToast.dataset.state = 'open'

      setToastContent(existingToast, detail)

      viewport.append(existingToast)

      scheduleToastDismiss(existingToast, duration)

      return id
    }

    const tagName =
      typeof customElements !== 'undefined' && customElements.get('lumen-toast') ?
        'lumen-toast' :
        'aside'

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

    const toasts = [
      ...viewport.querySelectorAll<HTMLElement>('[data-ui-toast]')
    ]

    for (const staleToast of toasts.slice(
      0, Math.max(0, toasts.length - max)
    )) {
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

    if (!(toast instanceof HTMLElement) || !toast.hasAttribute('data-ui-toast'))
      return

    setToastContent(toast, { ...detail, id })

    if (detail.duration !== undefined) {
      scheduleToastDismiss(toast, detail.duration)
    }
  }
}

const installToastController = (): void => {
  if (
    !hasDocument() ||
    document.documentElement.dataset.uiElementsToastsBound === 'true'
  )
    return

  document.documentElement.dataset.uiElementsToastsBound = 'true';

  (globalThis as typeof globalThis & { LumenToast?: ToastApi }).LumenToast =
    LumenToast

  for (const viewport of document.querySelectorAll<HTMLElement>(
    '[data-ui-toast-viewport], [data-ui-sonner]'
  )) {
    normalizeToastViewport(viewport)
  }

  document.addEventListener('ui:toast', event => {
    LumenToast.create(
      event instanceof CustomEvent ? (event.detail as ToastDetail) : {}
    )
  })

  document.addEventListener('ui:toast-update', event => {
    const detail =
      event instanceof CustomEvent ? (event.detail as ToastDetail) : {}

    if (detail.id) {
      LumenToast.update(detail.id, detail)
    }
  })

  document.addEventListener('ui:toast-dismiss', event => {
    const detail =
      event instanceof CustomEvent ? (event.detail as { id?: string }) : {}

    LumenToast.dismiss(detail.id)
  })
}

type LumenScalarNativeControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const scalarControlAttributes = [
  'accept',
  'aria-describedby',
  'aria-label',
  'aria-labelledby',
  'autocomplete',
  'disabled',
  'form',
  'inputmode',
  'max',
  'maxlength',
  'min',
  'minlength',
  'multiple',
  'pattern',
  'placeholder',
  'readonly',
  'required',
  'rows',
  'size',
  'step'
] as const

const getValidityFlags = (validity: ValidityState): ValidityStateFlags => ({
  badInput: validity.badInput,
  customError: validity.customError,
  patternMismatch: validity.patternMismatch,
  rangeOverflow: validity.rangeOverflow,
  rangeUnderflow: validity.rangeUnderflow,
  stepMismatch: validity.stepMismatch,
  tooLong: validity.tooLong,
  tooShort: validity.tooShort,
  typeMismatch: validity.typeMismatch,
  valueMissing: validity.valueMissing
})

class LumenScalarFormControlElement extends LumenElement {
  static formAssociated = true
  static nativeTagName: 'input' | 'select' | 'textarea' = 'input'

  private control: LumenScalarNativeControl | undefined
  private defaultCheckedState = false
  private defaultValueState = ''
  private eventController: AbortController | undefined
  private internals: ElementInternals | undefined

  constructor() {
    super()

    if (typeof this.attachInternals === 'function') {
      const internals = this.attachInternals()

      if (
        typeof internals.setFormValue === 'function' &&
        typeof internals.setValidity === 'function'
      ) {
        this.internals = internals
      }
    }
  }

  get checked(): boolean {
    return this.control instanceof HTMLInputElement && this.control.checked
  }

  set checked(checked: boolean) {
    if (this.control instanceof HTMLInputElement) {
      this.control.checked = checked

      this.syncFormState()
    }

    this.toggleAttribute('checked', checked)
  }

  get defaultChecked(): boolean {
    return this.defaultCheckedState
  }

  set defaultChecked(checked: boolean) {
    this.defaultCheckedState = checked

    this.toggleAttribute('checked', checked)
  }

  get defaultValue(): string {
    return this.defaultValueState
  }

  set defaultValue(value: string) {
    this.defaultValueState = value

    this.setAttribute('value', value)
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled')
  }

  set disabled(disabled: boolean) {
    this.toggleAttribute('disabled', disabled)
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.control?.form ?? null
  }

  get labels(): NodeList | null {
    return this.internals?.labels ?? null
  }

  get name(): string {
    return this.getAttribute('name') ?? ''
  }

  set name(name: string) {
    this.setAttribute('name', name)
  }

  get type(): string {
    if (this.control instanceof HTMLInputElement ||
      this.control instanceof HTMLSelectElement) return this.control.type

    return 'textarea'
  }

  get validationMessage(): string {
    return (
      this.internals?.validationMessage ?? this.control?.validationMessage ?? ''
    )
  }

  get validity(): ValidityState {
    return (
      this.internals?.validity ??
      this.control?.validity ??
      ({} as ValidityState)
    )
  }

  get value(): string {
    return this.control?.value ?? this.getAttribute('value') ?? ''
  }

  set value(value: string) {
    if (this.control) {
      this.control.value = value

      this.syncFormState()

      return
    }

    this.setAttribute('value', value)
  }

  get willValidate(): boolean {
    return this.internals?.willValidate ?? this.control?.willValidate ?? false
  }

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    const Constructor = this
      .constructor as typeof LumenScalarFormControlElement

    this.defaultValueState = this.getAttribute('value') ??
      (Constructor.nativeTagName === 'textarea' ? this.textContent : '')

    this.defaultCheckedState = this.hasAttribute('checked')

    this.ensureControl()

    if (this.control instanceof HTMLSelectElement &&
      !this.hasAttribute('value')) this.defaultValueState = this.control.value

    this.syncControlAttributes()

    this.syncFormState()
  }

  override disconnectedCallback() {
    this.eventController?.abort()

    this.eventController = undefined
  }

  override attributeChangedCallback(
    name: string,
    previousValue: string | null,
    value: string | null
  ) {
    super.attributeChangedCallback()

    if (previousValue === value || !this.control) return

    this.syncControlAttributes()

    if (name === 'value') {
      this.defaultValueState = value ?? ''

      this.control.value = this.defaultValueState
    }

    if (name === 'checked' && this.control instanceof HTMLInputElement) {
      this.defaultCheckedState = value !== null

      this.control.checked = this.defaultCheckedState
    }

    this.syncFormState()
  }

  checkValidity(): boolean {
    const valid = this.control?.checkValidity() ?? true

    this.syncFormState()

    return valid
  }

  override focus(options?: FocusOptions): void {
    this.control?.focus(options)
  }

  formDisabledCallback(disabled: boolean): void {
    if (this.control) this.control.disabled = disabled || this.disabled
  }

  formResetCallback(): void {
    if (!this.control) return

    this.control.value = this.defaultValueState

    if (this.control instanceof HTMLInputElement) {
      this.control.checked = this.defaultCheckedState
    }

    this.syncFormState()
  }

  formStateRestoreCallback(state: File | FormData | string | null): void {
    if (typeof state === 'string') this.value = state
  }

  reportValidity(): boolean {
    const valid = this.control?.reportValidity() ?? true

    this.syncFormState()

    return valid
  }

  setCustomValidity(message: string): void {
    this.control?.setCustomValidity(message)

    this.syncFormState()
  }

  private ensureControl(): void {
    const existingControl = this.querySelector<LumenScalarNativeControl>(
      '[data-ui-element-control]'
    )

    if (existingControl) {
      this.control = existingControl

      return
    }

    const Constructor = this
      .constructor as typeof LumenScalarFormControlElement

    const control = document.createElement(Constructor.nativeTagName)

    control.dataset.uiElementControl = ''

    control.className = this.className

    if (control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement) {
      control.defaultValue = this.defaultValueState
    }

    if (control instanceof HTMLSelectElement) {
      control.append(...[...this.children].filter(child => child instanceof HTMLOptionElement ||
        child instanceof HTMLOptGroupElement))
    }

    if (this.defaultValueState) control.value = this.defaultValueState

    if (control instanceof HTMLInputElement) {
      control.defaultChecked = this.defaultCheckedState

      control.checked = this.defaultCheckedState
    }

    this.style.display = 'contents'

    this.replaceChildren(control)

    this.control = control

    this.eventController?.abort()

    this.eventController = new AbortController()

    for (const eventName of ['change', 'input'] as const) {
      control.addEventListener(
        eventName, event => {
          event.stopPropagation()

          this.syncFormState()

          this.dispatchEvent(
            new Event(eventName, { bubbles: true, composed: true })
          )
        }, { signal: this.eventController.signal }
      )
    }
  }

  private syncControlAttributes(): void {
    const control = this.control

    if (!control) return

    control.className = this.className

    for (const name of scalarControlAttributes) {
      const value = this.getAttribute(name)

      if (value === null || (name === 'form' && this.internals)) {
        control.removeAttribute(name)
      } else {
        control.setAttribute(name, value)
      }
    }

    if (control instanceof HTMLInputElement) {
      control.type =
        this.getAttribute('type') ?? this.config.defaults?.type ?? 'text'
    }

    if (this.id) control.id = `${this.id}-control`

    if (this.internals) {
      control.removeAttribute('name')
    } else if (this.name) {
      control.name = this.name
    } else {
      control.removeAttribute('name')
    }
  }

  private syncFormState(): void {
    const control = this.control

    if (!control) return

    const checkedControl =
      control instanceof HTMLInputElement &&
      ['checkbox', 'radio'].includes(control.type)

    const submittedValue =
      checkedControl && !control.checked ? null : control.value

    if (this.internals) {
      this.internals.setFormValue(submittedValue, control.value)

      if (control.validity.valid) {
        this.internals.setValidity({})
      } else {
        this.internals.setValidity(
          getValidityFlags(control.validity), control.validationMessage, control
        )
      }
    }

    if (control.validity.valid) {
      this.removeAttribute('aria-invalid')
    } else {
      this.setAttribute('aria-invalid', 'true')
    }
  }
}

class LumenTextareaFormControlElement extends LumenScalarFormControlElement {
  static override nativeTagName = 'textarea' as const
}

class LumenNativeSelectFormControlElement extends LumenScalarFormControlElement {
  static override nativeTagName = 'select' as const
}

class LumenPasswordFieldBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    if (hasDocument()) enhanceLumenPasswordFields(this)
  }
}

class LumenListBoxBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    if (hasDocument()) enhanceLumenListBoxes(this)
  }
}

const escapeChartHtml = (value: number | string): string => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&#39;')

const chartBooleanAttribute = (
  element: HTMLElement,
  name: string,
  defaultValue: boolean
): boolean => {
  if (!element.hasAttribute(name)) return defaultValue

  return element.getAttribute(name) !== 'false'
}

const parseChartSeriesCandidate = (
  candidate: unknown,
  seriesIndex: number
): LumenChartSeries | undefined => {
  if (typeof candidate !== 'object' || candidate === null) return undefined

  const record = candidate as Record<string, unknown>

  if (!Array.isArray(record.data)) return undefined

  const data = record.data.flatMap(datum => {
    if (
      typeof datum !== 'object' ||
      datum === null ||
      !('x' in datum) ||
      !('y' in datum)
    ) return []

    const point = datum as Record<string, unknown>

    if (
      (typeof point.x !== 'string' && typeof point.x !== 'number') ||
      (point.y !== null &&
        (typeof point.y !== 'number' || !Number.isFinite(point.y)))
    ) return []

    return [
      {
        ...(typeof point.id === 'string' ? { id: point.id } : {}),
        ...(typeof point.label === 'string' ? { label: point.label } : {}),
        ...(typeof point.size === 'number' && Number.isFinite(point.size) ?
          { size: point.size } :
          {}),
        ...(typeof point.tone === 'string' &&
          lumenChartTones.includes(point.tone as LumenChartTone) ?
          { tone: point.tone as LumenChartTone } :
          {}),
        x: point.x,
        ...(typeof point.xLabel === 'string' ? { xLabel: point.xLabel } : {}),
        y: point.y
      }
    ]
  })

  const tone =
    typeof record.tone === 'string' &&
    lumenChartTones.includes(record.tone as LumenChartTone) ?
      (record.tone as LumenChartTone) :
      undefined

  return {
    data,
    id:
      typeof record.id === 'string' ?
        record.id :
        `series-${seriesIndex + 1}`,
    label:
      typeof record.label === 'string' ?
        record.label :
        `Series ${seriesIndex + 1}`,
    ...(tone ? { tone } : {})
  }
}

const parseChartSeries = (value: string | null): LumenChartSeries[] => {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((candidate: unknown, seriesIndex) => {
      const series = parseChartSeriesCandidate(candidate, seriesIndex)

      return series ? [series] : []
    })
  } catch {
    return []
  }
}

const parseComboChartSeries = (value: string | null): LumenComboSeries[] => {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((candidate: unknown, seriesIndex) => {
      const item = parseChartSeriesCandidate(candidate, seriesIndex)

      if (!item) return []

      const mark = typeof candidate === 'object' && candidate !== null && 'mark' in candidate &&
        (candidate.mark === 'area' || candidate.mark === 'bar' || candidate.mark === 'line') ?
        candidate.mark :
        'line'

      return { ...item, mark }
    })
  } catch {
    return []
  }
}

const parseHeatmapData = (value: string | null): LumenHeatmapDatum[] => {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) return []

    return parsed.flatMap(candidate => {
      if (typeof candidate !== 'object' || candidate === null) return []

      const record = candidate as Record<string, unknown>

      if (
        (typeof record.x !== 'string' && typeof record.x !== 'number') ||
        (typeof record.y !== 'string' && typeof record.y !== 'number') ||
        (record.value !== null &&
          (typeof record.value !== 'number' || !Number.isFinite(record.value)))
      ) return []

      return [{
        ...(typeof record.id === 'string' ? { id: record.id } : {}),
        ...(typeof record.label === 'string' ? { label: record.label } : {}),
        value: record.value,
        x: record.x,
        ...(typeof record.xLabel === 'string' ? { xLabel: record.xLabel } : {}),
        y: record.y,
        ...(typeof record.yLabel === 'string' ? { yLabel: record.yLabel } : {})
      }]
    })
  } catch {
    return []
  }
}

const parseRangeData = (value: string | null): LumenRangeDatum[] => {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) return []

    return parsed.flatMap(candidate => {
      if (typeof candidate !== 'object' || candidate === null) return []

      const record = candidate as Record<string, unknown>
      const validBound = (bound: unknown): bound is number | null => bound === null || (typeof bound === 'number' && Number.isFinite(bound))

      if (
        (typeof record.x !== 'string' && typeof record.x !== 'number') ||
        !validBound(record.low) ||
        !validBound(record.high)
      ) return []

      return [{
        high: record.high,
        ...(typeof record.id === 'string' ? { id: record.id } : {}),
        ...(typeof record.label === 'string' ? { label: record.label } : {}),
        low: record.low,
        x: record.x,
        ...(typeof record.xLabel === 'string' ? { xLabel: record.xLabel } : {})
      }]
    })
  } catch {
    return []
  }
}

const chartHeaderHtml = (element: HTMLElement): string => {
  const heading = element.getAttribute('heading')
  const description = element.getAttribute('description')
  const value = element.getAttribute('value')

  if (!heading && !description && !value) return ''

  return `<header><div class="ui-chart__heading">${heading ? `<h3>${escapeChartHtml(heading)}</h3>` : ''}${description ? `<p>${escapeChartHtml(description)}</p>` : ''}</div>${value ? `<strong data-ui-chart-value>${escapeChartHtml(value)}</strong>` : ''}</header>`
}

const chartCaptionHtml = (element: HTMLElement): string => {
  const caption = element.getAttribute('caption')

  return caption ? `<figcaption>${escapeChartHtml(caption)}</figcaption>` : ''
}

const chartSummaryHtml = (
  element: HTMLElement,
  series: readonly LumenChartSeries[]
): string => {
  const summary = element.getAttribute('summary') ?? formatLumenChartSummary(series)

  return `<p class="ui-sr-only" data-ui-chart-summary>${escapeChartHtml(summary)}</p>`
}

const chartLegendHtml = (series: readonly LumenChartSeries[]): string => `<ul class="ui-chart__legend" aria-label="Chart legend">${series.map((item, index) => `<li class="ui-chart-tone--${resolveLumenChartTone(item.tone, index)}"><span aria-hidden="true"></span>${escapeChartHtml(item.label)}</li>`).join('')}</ul>`

const chartDataTableHtml = (
  categories: readonly (number | string)[],
  series: readonly LumenChartSeries[],
  formatCategory: (category: number | string) => string = String,
  formatValue: (value: number) => string = String
): string => {
  const headers = series
    .map(item => `<th scope="col">${escapeChartHtml(item.label)}</th>`)
    .join('')

  const rows = categories
    .map(category => {
      const cells = series
        .map(item => {
          const datum = item.data.find(candidate => candidate.x === category)

          const value =
            datum?.label ??
            (datum?.y === undefined || datum.y === null || !Number.isFinite(datum.y) ?
              'Not available' :
              formatValue(datum.y))

          return `<td>${escapeChartHtml(value)}</td>`
        })
        .join('')

      const label =
        series
          .flatMap(item => item.data)
          .find(datum => datum.x === category)?.xLabel ??
          formatCategory(category)

      return `<tr><th scope="row">${escapeChartHtml(label)}</th>${cells}</tr>`
    })
    .join('')

  return [
    '<details class="ui-chart__data"><summary>View chart data</summary>',
    '<div><table><thead><tr><th scope="col">Category</th>',
    `${headers}</tr></thead><tbody>${rows}</tbody></table></div></details>`
  ].join('')
}

const scatterDataTableHtml = (
  points: readonly LumenScatterGeometryPoint[],
  formatCategory: (category: number | string) => string = String,
  formatValue: (value: number) => string = String
): string => {
  const rows = points
    .map(point => [
      `<tr><th scope="row">${escapeChartHtml(point.xLabel ?? formatCategory(point.x))}</th>`,
      `<td>${escapeChartHtml(point.seriesLabel)}</td>`,
      `<td>${escapeChartHtml(point.label ?? formatValue(point.y ?? 0))}</td>`,
      `<td>${escapeChartHtml(point.size === undefined || point.size === null || !Number.isFinite(point.size) ? 'Not available' : formatValue(point.size))}</td></tr>`
    ].join(''))
    .join('')

  return [
    '<details class="ui-chart__data"><summary>View chart data</summary>',
    '<div><table><thead><tr><th scope="col">X</th>',
    '<th scope="col">Series</th><th scope="col">Value</th>',
    '<th scope="col">Size</th></tr></thead>',
    `<tbody>${rows}</tbody></table></div></details>`
  ].join('')
}

const heatmapDataTableHtml = (data: readonly LumenHeatmapDatum[]): string => {
  const rows = data
    .map(cell => {
      const value =
        cell.label ??
        (cell.value === null || !Number.isFinite(cell.value) ?
          'Not available' :
          String(cell.value))

      return [
        `<tr><th scope="row">${escapeChartHtml(cell.xLabel ?? cell.x)}</th>`,
        `<td>${escapeChartHtml(cell.yLabel ?? cell.y)}</td>`,
        `<td>${escapeChartHtml(value)}</td></tr>`
      ].join('')
    })
    .join('')

  return [
    '<details class="ui-chart__data"><summary>View chart data</summary>',
    '<div><table><thead><tr><th scope="col">Column</th>',
    '<th scope="col">Row</th><th scope="col">Value</th></tr></thead>',
    `<tbody>${rows}</tbody></table></div></details>`
  ].join('')
}

const rangeDataTableHtml = (data: readonly LumenRangeDatum[]): string => {
  const rows = data
    .map(item => [
      `<tr><th scope="row">${escapeChartHtml(item.xLabel ?? item.x)}</th>`,
      `<td>${escapeChartHtml(item.low ?? 'Not available')}</td>`,
      `<td>${escapeChartHtml(item.high ?? 'Not available')}</td></tr>`
    ].join(''))
    .join('')

  return [
    '<details class="ui-chart__data"><summary>View chart data</summary>',
    '<div><table><thead><tr><th scope="col">Category</th>',
    '<th scope="col">Low</th><th scope="col">High</th></tr></thead>',
    `<tbody>${rows}</tbody></table></div></details>`
  ].join('')
}

const chartPercentage = (percentage: number): string => new Intl.NumberFormat(undefined, {
  maximumFractionDigits: percentage < 0.01 ? 1 : 0,
  style: 'percent'
}).format(percentage)

const chartEmptyStateHtml = (
  element: HTMLElement,
  label: string
): string => [
  chartHeaderHtml(element),
  `<p class="ui-sr-only" data-ui-chart-summary>${escapeChartHtml(element.getAttribute('summary') ?? label)}</p>`,
  `<p class="ui-chart__empty" role="status">${escapeChartHtml(label)}</p>`,
  chartCaptionHtml(element)
].join('')

abstract class LumenDataChartBehaviorElement extends LumenElement {
  #categoryFormatter: ((category: number | string) => string) | undefined
  #series: readonly LumenChartSeries[] | undefined
  #valueFormatter: ((value: number) => string) | undefined

  get categoryFormatter(): (category: number | string) => string {
    return this.#categoryFormatter ?? String
  }

  set categoryFormatter(value: (category: number | string) => string) {
    this.#categoryFormatter = value

    this.renderChart()
  }

  get series(): readonly LumenChartSeries[] {
    return this.#series ?? this.parseSeriesAttribute(this.getAttribute('series'))
  }

  set series(value: readonly LumenChartSeries[]) {
    this.#series = value

    this.renderChart()
  }

  get valueFormatter(): (value: number) => string {
    return this.#valueFormatter ?? String
  }

  set valueFormatter(value: (value: number) => string) {
    this.#valueFormatter = value

    this.renderChart()
  }

  override connectedCallback() {
    super.connectedCallback()

    this.renderChart()
  }

  override attributeChangedCallback() {
    super.attributeChangedCallback()

    if (this.isConnected) this.renderChart()
  }

  protected parseSeriesAttribute(value: string | null): readonly LumenChartSeries[] {
    return parseChartSeries(value)
  }

  protected abstract renderChart(): void
}

class LumenSparklineBehaviorElement extends LumenElement {
  #toneClass: string | undefined
  #values: readonly number[] | undefined

  get values(): readonly number[] {
    if (this.#values) return this.#values

    const source = this.getAttribute('values')

    if (!source) return []

    try {
      const parsed: unknown = JSON.parse(source)

      if (Array.isArray(parsed))
        return parsed.filter(
          (value): value is number => typeof value === 'number' && Number.isFinite(value)
        )
    } catch {
      return source
        .split(',')
        .map(value => Number(value.trim()))
        .filter(Number.isFinite)
    }

    return []
  }

  set values(value: readonly number[]) {
    this.#values = value

    this.renderSparkline()
  }

  override connectedCallback() {
    super.connectedCallback()

    this.renderSparkline()
  }

  override attributeChangedCallback() {
    super.attributeChangedCallback()

    if (this.isConnected) this.renderSparkline()
  }

  private renderSparkline() {
    const values = this.values

    if (values.length === 0) {
      const label = this.getAttribute('label') ?? 'No trend data available.'

      this.setAttribute('aria-label', label)

      this.setAttribute('role', 'img')

      this.innerHTML = `<span class="ui-sr-only">${escapeChartHtml(label)}</span>`

      return
    }

    const label = this.getAttribute('label') ?? 'Trend'
    const toneAttribute = this.getAttribute('tone')

    const tone = resolveLumenChartTone(
      toneAttribute && lumenChartTones.includes(toneAttribute as LumenChartTone) ?
        (toneAttribute as LumenChartTone) :
        undefined
    )

    const geometry = createLumenLineGeometry(
      values.map((value, index) => ({ x: index, y: value })), { height: 40, padding: 3, width: 120 }
    )

    const area = chartBooleanAttribute(this, 'area', false)
    const showEndpoint = chartBooleanAttribute(this, 'show-endpoint', true)
    const endpoint = geometry.points.at(-1)

    if (this.#toneClass) this.classList.remove(this.#toneClass)

    this.#toneClass = `ui-chart-tone--${tone}`

    this.classList.add(this.#toneClass)

    this.setAttribute('aria-label', label)

    this.setAttribute('role', 'img')

    this.innerHTML = `<svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 120 40">${area ? geometry.areaPaths.map(path => `<path class="ui-sparkline__area" d="${path}"></path>`).join('') : ''}<path class="ui-sparkline__line" d="${geometry.path}"></path>${showEndpoint && endpoint ? `<circle class="ui-sparkline__endpoint" cx="${endpoint.xCoordinate}" cy="${endpoint.yCoordinate}" r="2.5"></circle>` : ''}</svg><span class="ui-sr-only">${escapeChartHtml(label)}</span>`
  }
}

class LumenBarChartBehaviorElement extends LumenDataChartBehaviorElement {
  protected renderChart() {
    const series = this.series

    if (!hasLumenChartData(series)) {
      const emptyLabel =
        this.getAttribute('empty-label') ?? 'No chart data available.'

      this.innerHTML = chartEmptyStateHtml(this, emptyLabel)

      return
    }

    const orientation =
      this.getAttribute('orientation') === 'horizontal' ?
        'horizontal' :
        'vertical'

    const layout =
      this.getAttribute('layout') === 'stacked' ? 'stacked' : 'grouped'

    const categoryWidthValue = Number(this.getAttribute('category-width'))

    const categoryWidth =
      Number.isFinite(categoryWidthValue) && categoryWidthValue > 0 ?
        categoryWidthValue :
        undefined

    const geometry = createLumenBarGeometry(series, {
      ...(categoryWidth === undefined ? {} : { categoryWidth }),
      layout,
      orientation
    })

    const ticks = getLumenChartTicks(geometry.domain)

    const margin =
      orientation === 'horizontal' ?
        {
          bottom: 24,
          left: Math.max(64, Math.min(240, categoryWidth ?? 112)),
          right: 20,
          top: 16
        } :
        { bottom: 52, left: 52, right: 16, top: 16 }

    const grid = ticks
      .map(tick => {
        const coordinate =
          orientation === 'horizontal' ?
            scaleLumenChartValue(
              tick, geometry.domain, margin.left, geometry.width - margin.right
            ) :
            scaleLumenChartValue(
              tick, geometry.domain, geometry.height - margin.bottom, margin.top
            )

        return orientation === 'horizontal' ?
          [
            `<line x1="${coordinate}" x2="${coordinate}" y1="${margin.top}"`,
            ` y2="${geometry.height - margin.bottom}"></line>`
          ].join('') :
          [
            `<line x1="${margin.left}" x2="${geometry.width - margin.right}"`,
            ` y1="${coordinate}" y2="${coordinate}"></line>`
          ].join('')
      })
      .join('')

    const labels = geometry.categories
      .map(category => {
        const baseline = orientation === 'horizontal' ? 'middle' : 'auto'
        const anchor = orientation === 'horizontal' ? 'end' : 'middle'

        return [
          `<text dominant-baseline="${baseline}" text-anchor="${anchor}"`,
          ` x="${category.x}" y="${category.y}">`,
          `${escapeChartHtml(category.label)}</text>`
        ].join('')
      })
      .join('')

    const marks = geometry.marks
      .map(mark => {
        const datum = series
          .flatMap(item => item.data)
          .find(item => item.x === mark.category)

        const label = datum?.xLabel ?? this.categoryFormatter(mark.category)
        const title = `${label} · ${mark.seriesLabel}: ${this.valueFormatter(mark.value)}`

        return [
          `<rect class="ui-chart-tone--${mark.tone}" height="${mark.height}"`,
          ` rx="4" width="${mark.width}" x="${mark.x}" y="${mark.y}">`,
          `<title>${escapeChartHtml(title)}</title></rect>`
        ].join('')
      })
      .join('')

    const showLegend = chartBooleanAttribute(
      this, 'show-legend', series.length > 1
    )

    const showTable = chartBooleanAttribute(this, 'show-table', true)
    const categories = geometry.categories.map(category => category.category)

    this.innerHTML = `${chartHeaderHtml(this)}${chartSummaryHtml(this, series)}${showLegend ? chartLegendHtml(series) : ''}<div class="ui-chart__plot"><svg aria-hidden="true" preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${geometry.width} ${geometry.height}"><g class="ui-chart__grid">${grid}</g><g class="ui-chart__axis-labels">${labels}</g><g class="ui-bar-chart__marks">${marks}</g></svg></div>${showTable ? chartDataTableHtml(categories, series, this.categoryFormatter, this.valueFormatter) : ''}${chartCaptionHtml(this)}`
  }
}

class LumenLineChartBehaviorElement extends LumenDataChartBehaviorElement {
  protected renderChart() {
    const series = this.series

    if (!hasLumenChartData(series)) {
      const emptyLabel =
        this.getAttribute('empty-label') ?? 'No chart data available.'

      this.innerHTML = chartEmptyStateHtml(this, emptyLabel)

      return
    }

    const width = 640
    const height = 320
    const padding = 44
    const categories = getLumenChartCategories(series)
    const alignedSeries = series.map(item => alignLumenChartSeries(item, categories))
    const referenceAttribute = this.getAttribute('reference-value')

    const parsedReference =
      referenceAttribute === null ? undefined : Number(referenceAttribute)

    const referenceValue =
      parsedReference !== undefined && Number.isFinite(parsedReference) ?
        parsedReference :
        undefined

    const domain = getLumenChartDomain(
      [
        ...alignedSeries.flatMap(item => item.data.map(datum => datum.y)),
        referenceValue ?? null
      ], false
    )

    const geometries = alignedSeries.map(item => createLumenLineGeometry(item.data, {
      domain,
      height,
      includeZero: false,
      padding,
      width
    }))

    const ticks = getLumenChartTicks(domain)
    const labelStep = Math.max(1, Math.ceil(categories.length / 8))

    const grid = ticks
      .map(tick => {
        const y = scaleLumenChartValue(tick, domain, height - padding, padding)

        return [
          `<line x1="${padding}" x2="${width - padding}" y1="${y}" y2="${y}"></line>`,
          `<text x="${padding - 8}" y="${y}">`,
          `${escapeChartHtml(this.valueFormatter(tick))}</text>`
        ].join('')
      })
      .join('')

    const labels = categories
      .map((category, index) => {
        if (index % labelStep !== 0 && index !== categories.length - 1)
          return ''

        const denominator = Math.max(1, categories.length - 1)
        const x = padding + (index / denominator) * (width - padding * 2)

        const label =
          series
            .flatMap(item => item.data)
            .find(datum => datum.x === category)?.xLabel ??
            this.categoryFormatter(category)

        return `<text text-anchor="middle" x="${x}" y="${height - 14}">${escapeChartHtml(label)}</text>`
      })
      .join('')

    const area = chartBooleanAttribute(this, 'area', false)
    const markersAttribute = this.getAttribute('markers') ?? 'auto'
    const numericMarkerStep = Number(markersAttribute)
    let markerStep = 1

    if (markersAttribute === 'false' || markersAttribute === 'none') {
      markerStep = Number.POSITIVE_INFINITY
    } else if (Number.isFinite(numericMarkerStep) && numericMarkerStep > 0) {
      markerStep = Math.max(1, Math.round(numericMarkerStep))
    } else if (markersAttribute === 'auto') {
      markerStep = Math.max(1, Math.ceil(categories.length / 24))
    }

    const paths = geometries
      .map((geometry, index) => {
        const item = series[index]

        if (!item) return ''

        const tone = resolveLumenChartTone(item.tone, index)

        const areaPaths = area ?
          geometry.areaPaths
            .map(
              path => `<path class="ui-line-chart__area" d="${path}"></path>`
            )
            .join('') :
          ''

        const points = Number.isFinite(markerStep) ?
          geometry.points
            .map((point, pointIndex) => {
              if (pointIndex % markerStep !== 0) return ''

              const label = point.xLabel ?? this.categoryFormatter(point.x)
              const title = `${label} · ${item.label}: ${this.valueFormatter(point.y ?? 0)}`

              return [
                `<circle class="ui-line-chart__point" cx="${point.xCoordinate}"`,
                ` cy="${point.yCoordinate}" r="3">`,
                `<title>${escapeChartHtml(title)}</title></circle>`
              ].join('')
            })
            .join('') :
          ''

        return [
          `<g class="ui-line-chart__series ui-chart-tone--${tone}">${areaPaths}`,
          `<path class="ui-line-chart__line" d="${geometry.path}"></path>`,
          `${points}</g>`
        ].join('')
      })
      .join('')

    const referenceY = referenceValue === undefined ?
      undefined :
      scaleLumenChartValue(referenceValue, domain, height - padding, padding)

    const reference = referenceY === undefined ?
      '' :
      [
        `<line class="ui-chart__reference" x1="${padding}" x2="${width - padding}"`,
        ` y1="${referenceY}" y2="${referenceY}"></line>`
      ].join('')

    const showLegend = chartBooleanAttribute(
      this, 'show-legend', series.length > 1
    )

    const showTable = chartBooleanAttribute(this, 'show-table', true)

    this.innerHTML = [
      chartHeaderHtml(this),
      chartSummaryHtml(this, series),
      showLegend ? chartLegendHtml(series) : '',
      '<div class="ui-chart__plot"><svg aria-hidden="true"',
      ` preserveAspectRatio="xMidYMid meet" viewBox="0 0 ${width} ${height}">`,
      `<g class="ui-chart__grid">${grid}</g>`,
      `<g class="ui-chart__axis-labels">${labels}</g>`,
      `${reference}${paths}</svg></div>`,
      showTable ?
        chartDataTableHtml(categories, series, this.categoryFormatter, this.valueFormatter) :
        '',
      chartCaptionHtml(this)
    ].join('')
  }
}

class LumenPieChartBehaviorElement extends LumenDataChartBehaviorElement {
  protected renderChart() {
    const series = this.series[0]

    if (!series || !hasLumenPieData(series.data)) {
      this.innerHTML = chartEmptyStateHtml(this, 'No chart data available.')

      return
    }

    const variant = this.getAttribute('variant') === 'pie' ? 'pie' : 'donut'
    const geometry = createLumenPieGeometry(series.data, { variant })

    const renderedSeries = {
      ...series,
      data: series.data.filter(datum => datum.y !== null && Number.isFinite(datum.y) && datum.y > 0)
    }

    const showLegend = chartBooleanAttribute(this, 'show-legend', true)
    const showTable = chartBooleanAttribute(this, 'show-table', true)

    const legendItems = geometry.slices.map(slice => [
      `<li class="ui-chart-tone--${slice.tone}"><span aria-hidden="true"></span>`,
      `${escapeChartHtml(slice.label)}</li>`
    ].join('')).join('')

    const legend = showLegend ?
      `<ul class="ui-chart__legend" aria-label="Chart legend">${legendItems}</ul>` :
      ''

    const slices = geometry.slices
      .map(slice => {
        const title = [
          `${slice.label}: ${this.valueFormatter(slice.value)}`,
          `(${chartPercentage(slice.percentage)})`
        ].join(' ')

        return [
          `<path class="ui-chart-tone--${slice.tone}" d="${slice.path}"`,
          ` fill-rule="evenodd"><title>${escapeChartHtml(title)}</title></path>`
        ].join('')
      })
      .join('')

    const centerLabel = this.getAttribute('center-label')
    const centerValue = this.getAttribute('center-value')

    const center =
      variant === 'donut' && (centerLabel || centerValue) ?
        `<div class="ui-pie-chart__center" aria-hidden="true">${centerValue ? `<strong>${escapeChartHtml(centerValue)}</strong>` : ''}${centerLabel ? `<span>${escapeChartHtml(centerLabel)}</span>` : ''}</div>` :
        ''

    const table = showTable ? this.pieDataTable(geometry.slices) : ''

    this.innerHTML = [
      chartHeaderHtml(this),
      chartSummaryHtml(this, [renderedSeries]),
      legend,
      '<div class="ui-chart__plot ui-pie-chart__plot">',
      '<svg aria-hidden="true" preserveAspectRatio="xMidYMid meet"',
      ` viewBox="0 0 ${geometry.size} ${geometry.size}">`,
      `<g class="ui-pie-chart__slices">${slices}</g></svg>${center}</div>`,
      table,
      chartCaptionHtml(this)
    ].join('')
  }

  private pieDataTable(slices: readonly LumenPieGeometrySlice[]): string {
    const rows = slices
      .map(slice => [
        `<tr><th scope="row">${escapeChartHtml(slice.label)}</th>`,
        `<td>${escapeChartHtml(this.valueFormatter(slice.value))}</td>`,
        `<td>${escapeChartHtml(chartPercentage(slice.percentage))}</td></tr>`
      ].join(''))
      .join('')

    return [
      '<details class="ui-chart__data"><summary>View chart data</summary>',
      '<div><table><thead><tr><th scope="col">Category</th>',
      '<th scope="col">Value</th><th scope="col">Share</th></tr></thead>',
      `<tbody>${rows}</tbody></table></div></details>`
    ].join('')
  }
}

class LumenScatterChartBehaviorElement extends LumenDataChartBehaviorElement {
  protected renderChart() {
    const series = this.series
    const geometry = createLumenScatterGeometry(series)

    const renderedSeries = series.map(item => ({
      ...item,
      data: geometry.points.filter(point => point.seriesId === item.id)
    })).filter(item => item.data.length > 0)

    if (geometry.points.length === 0) {
      this.innerHTML = chartEmptyStateHtml(this, 'No chart data available.')

      return
    }

    const marks = geometry.points.map(point => [
      `<circle class="ui-chart-tone--${point.tone}" cx="${point.xCoordinate}"`,
      ` cy="${point.yCoordinate}" r="${point.radius}"><title>`,
      `${escapeChartHtml(point.xLabel ?? point.x)} · ${escapeChartHtml(point.seriesLabel)}: `,
      `${escapeChartHtml(point.label ?? this.valueFormatter(point.y ?? 0))}</title></circle>`
    ].join('')).join('')

    this.innerHTML = [
      chartHeaderHtml(this),
      chartSummaryHtml(this, renderedSeries),
      chartBooleanAttribute(this, 'show-legend', series.length > 1) ? chartLegendHtml(series) : '',
      `<div class="ui-chart__plot"><svg aria-hidden="true" viewBox="0 0 ${geometry.width} ${geometry.height}">`,
      `<g class="ui-scatter-chart__marks">${marks}</g></svg></div>`,
      chartBooleanAttribute(this, 'show-table', true) ?
        scatterDataTableHtml(
          geometry.points, this.categoryFormatter, this.valueFormatter
        ) :
        '',
      chartCaptionHtml(this)
    ].join('')
  }
}

class LumenComboChartBehaviorElement extends LumenDataChartBehaviorElement {
  protected renderChart() {
    const series = this.series.map(item => {
      const mark =
        'mark' in item &&
        (item.mark === 'area' || item.mark === 'bar' || item.mark === 'line') ?
          item.mark :
          'line'

      return { ...item, mark }
    })

    if (!hasLumenChartData(series)) {
      this.innerHTML = chartEmptyStateHtml(this, 'No chart data available.')

      return
    }

    const width = 640
    const height = 320
    const padding = 44
    const categories = getLumenChartCategories(series)

    const aligned = series.map(item => ({
      ...item,
      data: alignLumenChartSeries(item, categories).data
    }))

    const domain = getLumenChartDomain(
      aligned.flatMap(item => item.data.map(datum => datum.y))
    )

    const bars = aligned.filter(item => item.mark === 'bar')
    const lines = aligned.filter(item => item.mark !== 'bar')
    const barGeometry = createLumenBarGeometry(bars, { domain, height, width })

    const categoryPositions = new Map(
      barGeometry.categories.map(category => [
        `${typeof category.category}:${String(category.category)}`,
        category.x
      ])
    )

    const drawableWidth = width - padding * 2

    const alignComboLineDatum = (datum: LumenChartSeries['data'][number]) => {
      if (bars.length === 0) return datum

      return {
        ...datum,
        x:
          ((categoryPositions.get(`${typeof datum.x}:${String(datum.x)}`) ?? padding) - padding) /
          drawableWidth
      }
    }

    const lineGeometryOptions = {
      domain,
      height,
      padding,
      width,
      ...(bars.length === 0 ?
        {} :
        {
          xDomain: { max: 1, min: 0 },
          xScale: 'linear' as const
        })
    }

    const barMarks = barGeometry.marks.map(mark => [
      `<rect class="ui-chart-tone--${mark.tone}" height="${mark.height}"`,
      ` rx="4" width="${mark.width}" x="${mark.x}" y="${mark.y}">`,
      `<title>${escapeChartHtml(mark.seriesLabel)}: `,
      `${escapeChartHtml(this.valueFormatter(mark.value))}</title></rect>`
    ].join('')).join('')

    const lineMarks = lines.map((item, index) => {
      const geometry = createLumenLineGeometry(
        item.data.map(alignComboLineDatum), lineGeometryOptions
      )

      const tone = resolveLumenChartTone(item.tone, index + bars.length)

      const areas = item.mark === 'area' ?
        geometry.areaPaths.map(
          path => `<path class="ui-line-chart__area" d="${path}"></path>`
        ).join('') :
        ''

      return `<g class="ui-line-chart__series ui-chart-tone--${tone}">${areas}<path class="ui-line-chart__line" d="${geometry.path}"></path></g>`
    }).join('')

    this.innerHTML = [
      chartHeaderHtml(this),
      chartSummaryHtml(this, series),
      chartBooleanAttribute(this, 'show-legend', true) ? chartLegendHtml(series) : '',
      `<div class="ui-chart__plot"><svg aria-hidden="true" viewBox="0 0 ${width} ${height}">`,
      `<g class="ui-bar-chart__marks">${barMarks}</g>${lineMarks}</svg></div>`,
      chartBooleanAttribute(this, 'show-table', true) ?
        chartDataTableHtml(categories, series, this.categoryFormatter, this.valueFormatter) :
        '',
      chartCaptionHtml(this)
    ].join('')
  }

  protected override parseSeriesAttribute(value: string | null): readonly LumenComboSeries[] {
    return parseComboChartSeries(value)
  }
}

abstract class LumenStructuredChartBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    this.renderChart()
  }

  override attributeChangedCallback() {
    super.attributeChangedCallback()

    if (this.isConnected) this.renderChart()
  }

  protected abstract renderChart(): void
}

class LumenHeatmapBehaviorElement extends LumenStructuredChartBehaviorElement {
  protected renderChart() {
    const data = parseHeatmapData(this.getAttribute('data'))
    const geometry = createLumenHeatmapGeometry(data)

    const availableCells = geometry.cells.filter(
      cell => cell.value !== null && Number.isFinite(cell.value)
    )

    const cells = availableCells.map(cell => [
      `<rect height="${Math.max(0, cell.height - 2)}" opacity="${Math.max(0.12, cell.ratio)}"`,
      ` width="${Math.max(0, cell.width - 2)}" x="${cell.xCoordinate + 1}"`,
      ` y="${cell.yCoordinate + 1}"><title>${escapeChartHtml(cell.xLabel ?? cell.x)} · `,
      `${escapeChartHtml(cell.yLabel ?? cell.y)}: `,
      `${escapeChartHtml(cell.label ?? cell.value ?? 'Not available')}</title></rect>`
    ].join('')).join('')

    const summary =
      this.getAttribute('summary') ??
      `${availableCells.length} available heatmap cells.`

    const plot = availableCells.length === 0 ?
      '<p class="ui-chart__empty" role="status">No chart data available.</p>' :
      `<div class="ui-chart__plot"><svg aria-hidden="true" viewBox="0 0 ${geometry.width} ${geometry.height}"><g class="ui-heatmap__cells">${cells}</g></svg></div>`

    const table = chartBooleanAttribute(this, 'show-table', true) ?
      heatmapDataTableHtml(data) :
      ''

    this.innerHTML = `${chartHeaderHtml(this)}<p class="ui-sr-only" data-ui-chart-summary>${escapeChartHtml(summary)}</p>${plot}${table}${chartCaptionHtml(this)}`
  }
}

class LumenRangeChartBehaviorElement extends LumenStructuredChartBehaviorElement {
  protected renderChart() {
    const data = parseRangeData(this.getAttribute('data'))
    const geometry = createLumenRangeGeometry(data)

    const intervals = geometry.points.map(point => [
      `<line class="ui-range-chart__interval" x1="${point.xCoordinate}"`,
      ` x2="${point.xCoordinate}" y1="${point.highCoordinate}" y2="${point.lowCoordinate}">`,
      `<title>${escapeChartHtml(point.xLabel ?? point.x)}: `,
      `${escapeChartHtml(point.label ?? `${point.low ?? 0}–${point.high ?? 0}`)}</title></line>`
    ].join('')).join('')

    const summary = this.getAttribute('summary') ?? `${geometry.points.length} available ranges.`

    const plot = geometry.points.length === 0 ?
      '<p class="ui-chart__empty" role="status">No chart data available.</p>' :
      `<div class="ui-chart__plot"><svg aria-hidden="true" viewBox="0 0 640 320"><path class="ui-range-chart__area" d="${geometry.areaPath}"></path>${intervals}</svg></div>`

    const table = chartBooleanAttribute(this, 'show-table', true) ?
      rangeDataTableHtml(data) :
      ''

    this.innerHTML = `${chartHeaderHtml(this)}<p class="ui-sr-only" data-ui-chart-summary>${escapeChartHtml(summary)}</p>${plot}${table}${chartCaptionHtml(this)}`
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

class LumenGraphicBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    this.syncAccessibility()
  }

  override attributeChangedCallback() {
    super.attributeChangedCallback()

    this.syncAccessibility()
  }

  private syncAccessibility() {
    const label = this.getAttribute('label')

    if (label) {
      this.removeAttribute('aria-hidden')

      this.setAttribute('aria-label', label)

      this.setAttribute('role', 'img')
    } else {
      this.setAttribute('aria-hidden', 'true')

      this.removeAttribute('aria-label')

      this.removeAttribute('role')
    }
  }
}

class LumenIllustrationBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    this.renderIllustration()
  }

  override attributeChangedCallback() {
    super.attributeChangedCallback()

    this.renderIllustration()
  }

  private renderIllustration() {
    const label = this.getAttribute('label')
    const variant = this.getAttribute('variant')

    const name: LumenIllustrationName =
      variant === 'error' || variant === 'offline' || variant === 'success' ? variant : 'empty'

    const markup = renderLumenIllustrationSvg(name)

    if (this.innerHTML !== markup) this.innerHTML = markup

    if (label) {
      this.removeAttribute('aria-hidden')

      this.setAttribute('aria-label', label)

      this.setAttribute('role', 'img')
    } else {
      this.setAttribute('aria-hidden', 'true')

      this.removeAttribute('aria-label')

      this.removeAttribute('role')
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
    return (
      this.hasAttribute('data-ui-alert-dialog') ||
      this.tagName.toLowerCase() === 'lumen-alert-dialog'
    )
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

    const initiallyOpen =
      this.hasAttribute('open') || this.nativeDialog?.open === true

    dialog.setAttribute('aria-modal', 'true')

    dialog.setAttribute('role', this.isAlertDialog ? 'alertdialog' : 'dialog')

    if (!this.nativeDialog) {
      this.hidden = !initiallyOpen

      this.dataset.state = initiallyOpen ? 'open' : 'closed'
    }

    this.nativeDialog?.addEventListener(
      'click', event => {
        if (event.target === this.nativeDialog && !this.isAlertDialog) {
          this.closeDialog()
        }
      }, { signal }
    )

    this.nativeDialog?.addEventListener(
      'close', () => {
        this.returnFocus()
      }, { signal }
    )

    this.addEventListener(
      'click', event => {
        const target = getOwnedTarget(event)

        const closeButton =
          target instanceof Element ?
            target.closest(
              '[data-ui-dialog-close], [data-ui-alert-dialog-close]'
            ) :
            null

        if (closeButton) {
          this.closeDialog()
        }
      }, { signal }
    )

    this.addEventListener(
      'keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault()

          this.closeDialog()

          return
        }

        if (event.key !== 'Tab') return

        this.trapFocus(event)
      }, { signal }
    )

    document.addEventListener(
      'click', event => {
        const target = getOwnedTarget(event)

        const trigger =
          target instanceof Element ?
            target.closest<HTMLElement>(
              '[data-ui-dialog-trigger], [data-ui-alert-dialog-trigger]'
            ) :
            null

        const targetId =
          trigger?.dataset.uiDialogTrigger ??
          trigger?.dataset.uiAlertDialogTrigger

        if (!trigger || targetId !== this.id) return

        this.openDialog(trigger)
      }, { signal }
    )

    document.addEventListener(
      'pointerdown', event => {
        if (!this.isOpen() || this.isAlertDialog) return

        const target = getOwnedTarget(event)

        if (!target || this.contains(target)) return

        this.closeDialog()
      }, { signal }
    )
  }

  private isOpen(): boolean {
    return (
      this.nativeDialog?.open === true ||
      this.hasAttribute('open') ||
      this.dataset.state === 'open'
    )
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

    trigger.setAttribute(
      'aria-haspopup', trigger.getAttribute('aria-haspopup') ?? 'menu'
    )

    setDisclosureOpen(
      trigger, panel, trigger.getAttribute('aria-expanded') === 'true'
    )

    const close = (): void => {
      setDisclosureOpen(trigger, panel, false)
    }

    const open = (): void => {
      setDisclosureOpen(trigger, panel, true)
    }

    trigger.addEventListener(
      'click', () => {
        setDisclosureOpen(
          trigger, panel, trigger.getAttribute('aria-expanded') !== 'true'
        )
      }, { signal }
    )

    trigger.addEventListener(
      'keydown', event => {
        if (
          event.key !== 'ArrowDown' &&
          event.key !== 'Enter' &&
          event.key !== ' '
        )
          return

        event.preventDefault()

        open()

        getFocusable(panel)[0]?.focus()
      }, { signal }
    )

    panel.addEventListener(
      'keydown', event => {
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

        const currentIndex = items.indexOf(
          document.activeElement as HTMLElement
        )

        const nextItem =
          items[
            getLoopedIndex(event.key, Math.max(0, currentIndex), items.length, [
              'ArrowDown'
            ])
          ]

        nextItem?.focus()
      }, { signal }
    )

    document.addEventListener(
      'pointerdown', event => {
        if (trigger.getAttribute('aria-expanded') !== 'true') return

        const target = getOwnedTarget(event)

        if (!target || this.contains(target) || panel.contains(target)) return

        close()
      }, { signal }
    )
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
    const tabList = tabs[0]?.closest<HTMLElement>('[role="tablist"]')

    const orientation = tabList?.getAttribute('aria-orientation') === 'vertical' ?
      'vertical' :
      'horizontal'

    if (!tabs.length || !panels.length) return

    const activate = (tab: HTMLElement, emit = true): void => {
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

      if (!emit) return

      scrollLumenTabIntoView(tab)

      const detail: LumenTabsChangeDetail = {
        value: tab.dataset.value ?? tab.id
      }

      const storageKey = this.dataset.storageKey

      if (storageKey) detail.storageKey = storageKey

      this.dispatchEvent(new CustomEvent<LumenTabsChangeDetail>('ui:tabs-change', {
        bubbles: true,
        detail
      }))
    }

    activate(
      tabs.find(tab => tab.getAttribute('aria-selected') === 'true') ??
      tabs[0]!,
      false
    )

    for (const tab of tabs) {
      tab.addEventListener(
        'click', () => {
          activate(tab)
        }, { signal }
      )

      tab.addEventListener(
        'keydown', event => {
          const keys = orientation === 'vertical' ?
            ['ArrowUp', 'ArrowDown', 'Home', 'End'] :
            ['ArrowLeft', 'ArrowRight', 'Home', 'End']

          if (!keys.includes(event.key)) return

          event.preventDefault()

          const currentIndex = tabs.indexOf(tab)

          const nextTab =
            tabs[
              getLoopedIndex(
                event.key,
                Math.max(0, currentIndex),
                tabs.length,
                orientation === 'vertical' ? ['ArrowDown'] : ['ArrowRight']
              )
            ]

          if (nextTab) {
            activate(nextTab)

            nextTab.focus()
          }
        }, { signal }
      )
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

    const trigger = control.querySelector<HTMLButtonElement>(
      '[data-ui-select-trigger]'
    )

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

    for (const attribute of [
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'aria-invalid'
    ]) {
      const value = select.getAttribute(attribute)

      if (value) {
        trigger.setAttribute(attribute, value)
      }
    }

    if (select.required) {
      trigger.setAttribute('aria-required', 'true')
    }

    if (
      !trigger.hasAttribute('aria-label') &&
      !trigger.hasAttribute('aria-labelledby')
    ) {
      const label = [...select.labels].find(item => item.textContent.trim())

      if (label?.textContent) {
        trigger.setAttribute('aria-label', label.textContent.trim())
      }
    }

    for (const label of select.labels) {
      label.addEventListener(
        'click', event => {
          event.preventDefault()

          trigger.focus({ preventScroll: true })
        }, { signal }
      )
    }

    this.syncValue(select, trigger)

    this.closeSelect(trigger, listbox)

    trigger.addEventListener(
      'click', () => {
        if (trigger.getAttribute('aria-expanded') === 'true') {
          this.closeSelect(trigger, listbox)
        } else {
          this.openSelect(trigger, listbox)
        }
      }, { signal }
    )

    trigger.addEventListener(
      'keydown', event => {
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
          (this.getSelectedItem() ?? this.getEnabledItems()[0])?.focus()

          return
        }

        this.focusOption(event.key)
      }, { signal }
    )

    select.addEventListener(
      'change', () => {
        this.syncValue(select, trigger)
      }, { signal }
    )

    select.form?.addEventListener(
      'reset', () => {
        globalThis.setTimeout(() => {
          this.syncValue(select, trigger)
        })
      }, { signal }
    )

    for (const item of this.getItems()) {
      item.tabIndex = -1

      item.addEventListener(
        'click', () => {
          this.selectOption(select, trigger, listbox, item)
        }, { signal }
      )

      item.addEventListener(
        'keydown', event => {
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
        }, { signal }
      )
    }

    document.addEventListener(
      'pointerdown', event => {
        if (trigger.getAttribute('aria-expanded') !== 'true') return

        const target = getOwnedTarget(event)

        if (!target || this.contains(target)) return

        this.closeSelect(trigger, listbox)
      }, { signal }
    )
  }

  private ensureNativeSelect(): HTMLSelectElement {
    const existing = this.querySelector<HTMLSelectElement>(
      '[data-ui-select-native], select'
    )

    if (existing) return existing

    const select = document.createElement('select')

    const directOptions = [...this.children].filter(
      (child): child is HTMLOptionElement => child instanceof HTMLOptionElement
    )

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
    const existing = this.querySelector<HTMLElement>(
      '[data-ui-select-control]'
    )

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

    const placeholder = select.querySelector<HTMLOptionElement>(
      '[data-ui-select-placeholder]'
    )

    const hasSelection = Boolean(
      selectedOption &&
      !selectedOption.hasAttribute('data-ui-select-placeholder')
    )

    const selectedLabel =
      hasSelection && selectedOption ? selectedOption.label : ''

    value.textContent = hasSelection ?
      selectedLabel :
      placeholder?.textContent.trim() || 'Select an option'

    this.dataset.placeholder = hasSelection ? 'false' : 'true'

    trigger.setAttribute(
      'aria-expanded', trigger.getAttribute('aria-expanded') ?? 'false'
    )

    for (const item of this.getItems()) {
      item.setAttribute(
        'aria-selected', String(hasSelection && item.dataset.value === select.value)
      )
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
    return this.getItems().filter(
      item => !item.hasAttribute('disabled') &&
        item.getAttribute('aria-disabled') !== 'true'
    )
  }

  private getSelectedItem(): HTMLElement | undefined {
    return this.getEnabledItems().find(
      item => item.getAttribute('aria-selected') === 'true'
    )
  }

  private selectOption(
    select: HTMLSelectElement,
    trigger: HTMLElement,
    listbox: HTMLElement,
    item: HTMLElement
  ): void {
    if (
      item.hasAttribute('disabled') ||
      item.getAttribute('aria-disabled') === 'true'
    )
      return

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

    const nextItem =
      items[
        getLoopedIndex(key, Math.max(0, currentIndex), items.length, [
          'ArrowDown'
        ])
      ]

    nextItem?.focus()
  }

  private handleTypeahead(
    event: KeyboardEvent,
    currentItem?: HTMLElement
  ): boolean {
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

    const orderedItems = [
      ...items.slice(startIndex),
      ...items.slice(0, startIndex)
    ]

    const nextItem = orderedItems.find(item => item.textContent.trim().toLowerCase().startsWith(this.typeahead))

    nextItem?.focus()
  }
}

class LumenDataTableBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    if (
      this.hasAttribute('selectable') &&
      this.dataset.uiDatatableSelectable !== 'true'
    ) {
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
      row.dataset.uiDatatableIndex =
        row.dataset.uiDatatableIndex ?? String(index)
    }

    const headers = [
      ...table.querySelectorAll<HTMLTableCellElement>('thead th')
    ].filter(
      header => header.dataset.uiDatatableSortable === 'true' ||
        header.dataset.sortable === 'true' ||
        header.hasAttribute('data-sortable')
    )

    for (const header of headers) {
      const row = header.parentElement
      const columnIndex = row ? [...row.children].indexOf(header) : -1

      if (columnIndex < 0) continue

      header.dataset.uiDatatableColumn = String(columnIndex)

      header.setAttribute(
        'aria-sort', header.getAttribute('aria-sort') ?? 'none'
      )

      const button = this.ensureSortButton(header)

      button.addEventListener(
        'click', () => {
          const nextDirection = getNextDataTableSortDirection(
            this.dataset.uiDatatableSortColumn, columnIndex, header.getAttribute('aria-sort')
          )

          this.updateSort(table, header, nextDirection)

          this.sortRows(table, header, columnIndex, nextDirection)
        }, { signal }
      )
    }
  }

  private ensureSortButton(header: HTMLTableCellElement): HTMLButtonElement {
    const existing = header.querySelector<HTMLButtonElement>(
      '[data-ui-datatable-sort]'
    )

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
    for (const item of table.querySelectorAll<HTMLTableCellElement>(
      'thead th[aria-sort]'
    )) {
      item.setAttribute('aria-sort', item === header ? direction : 'none')

      item.dataset.sort = item === header ? direction : 'none'
    }

    this.dataset.uiDatatableSortDirection = direction

    if (direction === 'none') {
      delete this.dataset.uiDatatableSortColumn
    } else {
      this.dataset.uiDatatableSortColumn =
        header.dataset.uiDatatableColumn ?? ''
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
        return (
          Number(row.dataset.uiDatatableIndex ?? '0') -
          Number(other.dataset.uiDatatableIndex ?? '0')
        )
      }

      const result = compareDataTableValues(
        getDataTableSortValue(row.cells[columnIndex]), getDataTableSortValue(other.cells[columnIndex]), sortType
      )

      return (
        (direction === 'ascending' ? result : -result) ||
        Number(row.dataset.uiDatatableIndex ?? '0') -
        Number(other.dataset.uiDatatableIndex ?? '0')
      )
    })

    for (const row of rows) {
      body.append(row)
    }
  }

  private setupSelection(table: HTMLTableElement, signal: AbortSignal): void {
    const selectable =
      this.dataset.uiDatatableSelectable === 'true' ||
      this.hasAttribute('selectable')

    if (!selectable) return

    const headRow = table.tHead?.rows[0]
    const body = table.tBodies[0]

    if (!headRow || !body) return

    const selectAll = this.ensureSelectAll(headRow)

    for (const [index, row] of getDataTableRows(table).entries()) {
      const checkbox = this.ensureRowSelect(row, index)

      checkbox.addEventListener(
        'change', () => {
          this.syncSelection(table, selectAll, true)
        }, { signal }
      )
    }

    selectAll.addEventListener(
      'change', () => {
        for (const checkbox of table.querySelectorAll<HTMLInputElement>(
          '[data-ui-datatable-row-select]'
        )) {
          checkbox.checked = selectAll.checked
        }

        this.syncSelection(table, selectAll, true)
      }, { signal }
    )

    this.closest('form')?.addEventListener(
      'reset', () => {
        globalThis.setTimeout(() => {
          this.syncSelection(table, selectAll, true)
        })
      }, { signal }
    )

    this.syncSelection(table, selectAll)
  }

  private ensureSelectAll(headRow: HTMLTableRowElement): HTMLInputElement {
    const existing = headRow.querySelector<HTMLInputElement>(
      '[data-ui-datatable-select-all]'
    )

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

  private ensureRowSelect(
    row: HTMLTableRowElement,
    index: number
  ): HTMLInputElement {
    const existing = row.querySelector<HTMLInputElement>(
      '[data-ui-datatable-row-select]'
    )

    row.dataset.uiDatatableRow = ''

    row.dataset.value = getDataTableRowValue(row, index)

    if (existing) return existing

    const cell = document.createElement('td')
    const checkbox = document.createElement('input')

    const selected =
      row.dataset.state === 'selected' ||
      row.getAttribute('aria-selected') === 'true'

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
      const checkbox = row.querySelector<HTMLInputElement>(
        '[data-ui-datatable-row-select]'
      )

      const selected = checkbox?.checked === true

      row.setAttribute('aria-selected', String(selected))

      if (selected) {
        row.dataset.state = 'selected'

        selectedValues.push(getDataTableRowValue(row, index))
      } else {
        delete row.dataset.state
      }
    }

    selectAll.checked =
      rows.length > 0 && selectedValues.length === rows.length

    selectAll.indeterminate =
      selectedValues.length > 0 && selectedValues.length < rows.length

    this.syncSelectionInputs(selectedValues)

    if (dispatch) {
      const detail = { values: selectedValues }

      this.dispatchEvent(
        new CustomEvent('ui:data-table-selection-change', {
          bubbles: true,
          detail
        })
      )
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

      inputs.replaceChildren(
        ...selectedValues.map(value => {
          const input = document.createElement('input')

          input.type = 'hidden'

          input.name = name

          input.value = value

          return input
        })
      )
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
    const items = [...this.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    )

    if (!items.length) return

    const update = (): void => {
      const overscan = this.getNumberAttribute(
        'data-ui-overscan', 'overscan', 4, 0
      )

      const itemSize = this.getNumberAttribute(
        'data-ui-item-size', 'item-size', 44
      )

      const range = getVirtualRange(
        this.scrollTop, this.clientHeight, itemSize, items.length, overscan
      )

      for (const [index, item] of items.entries()) {
        item.hidden = index < range.startIndex || index > range.endIndex
      }

      this.dispatchEvent(
        new CustomEvent('ui:virtual-list-range', {
          bubbles: true,
          detail: range
        })
      )
    }

    this.addEventListener('scroll', update, { passive: true, signal })

    update()
  }

  private getNumberAttribute(
    dataAttribute: string,
    attribute: string,
    fallback: number,
    minimum = 1
  ): number {
    const value = Number(
      this.getAttribute(dataAttribute) ??
      this.getAttribute(attribute) ??
      fallback
    )

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
    const brandHue = this.querySelector<HTMLInputElement>(
      '[data-ui-theme-brand-hue], [data-ui-theme-hue]'
    )

    const brandHueNumber = this.querySelector<HTMLInputElement>(
      '[data-ui-theme-brand-hue-number]'
    )

    const accentHue = this.querySelector<HTMLInputElement>(
      '[data-ui-theme-accent-hue]'
    )

    const accentHueNumber = this.querySelector<HTMLInputElement>(
      '[data-ui-theme-accent-hue-number]'
    )

    const primaryColor = this.querySelector<HTMLInputElement>(
      '[data-ui-theme-primary-color]'
    )

    const primaryHex = this.querySelector<HTMLInputElement>(
      '[data-ui-theme-primary-hex]'
    )

    const secondaryColor = this.querySelector<HTMLInputElement>(
      '[data-ui-theme-secondary-color]'
    )

    const secondaryHex = this.querySelector<HTMLInputElement>(
      '[data-ui-theme-secondary-hex]'
    )

    const exportButton = this.querySelector<HTMLButtonElement>(
      '[data-ui-theme-export]'
    )

    const output = this.querySelector<HTMLTextAreaElement | HTMLOutputElement>(
      '[data-ui-theme-output]'
    )

    const exportFormatButtons = [
      ...this.querySelectorAll<HTMLButtonElement>(
        '[data-ui-theme-export-format]'
      )
    ]

    const modeButtons = [
      ...this.querySelectorAll<HTMLButtonElement>('[data-ui-theme-mode]')
    ]

    const schemeButtons = [
      ...this.querySelectorAll<HTMLButtonElement>('[data-ui-theme-scheme]')
    ]

    const importButton = this.querySelector<HTMLButtonElement>(
      '[data-ui-theme-import]'
    )

    const checkContrastButton = this.querySelector<HTMLButtonElement>(
      '[data-ui-theme-check-contrast]'
    )

    const scoreElement = this.querySelector<HTMLElement>(
      '[data-ui-theme-contrast-score]'
    )

    const statusElement = this.querySelector<HTMLElement>(
      '[data-ui-theme-contrast-status]'
    )

    this.currentExportFormat = coerceThemeBuilderExportFormat(
      this.getButtonValue(
        exportFormatButtons, 'data-ui-theme-export-format', 'css'
      )
    )

    this.currentScheme = coerceThemeBuilderScheme(
      this.getButtonValue(
        schemeButtons, 'data-ui-theme-scheme', this.getDefaultScheme()
      )
    )

    const updateContrastUi = (tokens: LumenThemeTokens) => {
      if (!scoreElement && !statusElement) return

      const score = scoreThemeContrast(tokens, 'ink', 'canvas')

      if (scoreElement) scoreElement.textContent = String(score.ratio)

      if (statusElement) {
        statusElement.textContent = score.wcagAA ?
          'Passes WCAG AA' :
          'Fails WCAG AA'

        statusElement.dataset.status = score.wcagAA ? 'pass' : 'fail'
      }
    }

    const update = (dispatch = true): void => {
      const result = createThemeBuilderTokens({
        accentHue:
          accentHue?.value ??
          accentHueNumber?.value ??
          this.getAttribute('data-ui-theme-accent-hue') ??
          null,
        hue:
          brandHue?.value ??
          brandHueNumber?.value ??
          this.getAttribute('data-ui-theme-brand-hue') ??
          this.getAttribute('data-ui-theme-hue') ??
          null,
        mode: this.getButtonValue(
          modeButtons, 'data-ui-theme-mode', 'generated'
        ),
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
        this.dispatchEvent(
          new CustomEvent('ui:theme-change', {
            bubbles: true,
            detail: result
          })
        )
      }
    }

    this.bindHueInputs(brandHue, brandHueNumber, update, signal)

    this.bindHueInputs(accentHue, accentHueNumber, update, signal)

    this.bindHexInputs(primaryColor, primaryHex, update, signal)

    this.bindHexInputs(secondaryColor, secondaryHex, update, signal)

    for (const button of exportFormatButtons) {
      button.addEventListener(
        'click', () => {
          this.currentExportFormat = coerceThemeBuilderExportFormat(
            button.getAttribute('data-ui-theme-export-format')
          )

          this.setPressedState(
            exportFormatButtons, 'data-ui-theme-export-format', this.currentExportFormat
          )

          this.writeExport(output)
        }, { signal }
      )
    }

    for (const button of modeButtons) {
      button.addEventListener(
        'click', () => {
          this.setPressedState(
            modeButtons, 'data-ui-theme-mode', coerceThemeBuilderMode(button.getAttribute('data-ui-theme-mode'))
          )

          update()
        }, { signal }
      )
    }

    for (const button of schemeButtons) {
      button.addEventListener(
        'click', () => {
          this.currentScheme = coerceThemeBuilderScheme(
            button.getAttribute('data-ui-theme-scheme')
          )

          this.setPressedState(
            schemeButtons, 'data-ui-theme-scheme', this.currentScheme
          )

          update()
        }, { signal }
      )
    }

    exportButton?.addEventListener(
      'click', () => {
        if (this.currentTokens) {
          this.writeExport(output)
        } else {
          update(false)
        }

        const value = output?.value || this.currentExportValue

        navigator.clipboard.writeText(value).catch(() => null)

        this.dispatchEvent(
          new CustomEvent('ui:theme-export', {
            bubbles: true,
            detail: {
              css: this.currentExportFormat === 'css' ? value : undefined,
              format: this.currentExportFormat,
              tokens: this.currentTokens,
              value
            }
          })
        )
      }, { signal }
    )

    importButton?.addEventListener(
      'click', () => {
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

        this.dispatchEvent(
          new CustomEvent('ui:theme-change', {
            bubbles: true,
            detail: {
              accentHue: 0,
              hue: 0,
              mode: 'manual',
              scheme: this.currentScheme,
              tokens: this.currentTokens
            }
          })
        )
      }, { signal }
    )

    checkContrastButton?.addEventListener(
      'click', () => {
        if (!this.currentTokens) return

        this.currentTokens = tuneThemeContrast(
          this.currentTokens, 'ink', 'canvas'
        )

        const target = this.getTarget()

        if (target) {
          this.applyTokens(target, this.currentTokens, this.currentScheme)
        }

        this.writeExport(output)

        updateContrastUi(this.currentTokens)

        this.dispatchEvent(
          new CustomEvent('ui:theme-change', {
            bubbles: true,
            detail: {
              accentHue: 0,
              hue: 0,
              mode: 'manual',
              scheme: this.currentScheme,
              tokens: this.currentTokens
            }
          })
        )
      }, { signal }
    )

    update(false)
  }

  private getDefaultScheme(): LumenThemeBuilderScheme {
    return document.documentElement.dataset.theme?.includes('dark') ?
      'dark' :
      'light'
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

  private getButtonValue(
    buttons: HTMLButtonElement[],
    attribute: string,
    fallback: string
  ): string {
    const activeButton = buttons.find(
      button => button.getAttribute('aria-selected') === 'true' ||
        button.getAttribute('aria-pressed') === 'true'
    )

    return (
      activeButton?.getAttribute(attribute) ??
      this.getAttribute(attribute) ??
      fallback
    )
  }

  private setPressedState(
    buttons: HTMLButtonElement[],
    attribute: string,
    value: string
  ): void {
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
    const sync = (
      source: HTMLInputElement,
      target: HTMLInputElement | null
    ): void => {
      if (target) {
        target.value = source.value
      }

      onChange()
    }

    range?.addEventListener(
      'input', () => {
        sync(range, number)
      }, { signal }
    )

    number?.addEventListener(
      'input', () => {
        sync(number, range)
      }, { signal }
    )
  }

  private bindHexInputs(
    color: HTMLInputElement | null,
    text: HTMLInputElement | null,
    onChange: () => void,
    signal: AbortSignal
  ): void {
    color?.addEventListener(
      'input', () => {
        if (text) {
          text.value = color.value

          text.removeAttribute('aria-invalid')
        }

        onChange()
      }, { signal }
    )

    text?.addEventListener(
      'input', () => {
        const normalized = normalizeThemeBuilderHex(text.value)

        if (normalized) {
          if (color) color.value = normalized

          text.removeAttribute('aria-invalid')

          onChange()
        } else {
          text.setAttribute('aria-invalid', 'true')
        }
      }, { signal }
    )
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

  private writeExport(
    output: HTMLTextAreaElement | HTMLOutputElement | null
  ): void {
    if (!this.currentTokens) return

    this.currentExportValue = exportThemeBuilderValue(
      this.currentTokens, this.currentScheme, this.currentExportFormat
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

    const trigger = this.querySelector<HTMLElement>(
      '[data-ui-tooltip-trigger], [data-ui-trigger], button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (!tip) return

    if (trigger && !trigger.closest('[role="tooltip"]')) {
      if (!tip.id) {
        tip.id = createId('ui-tooltip')
      }

      const describedBy = new Set(
        (trigger.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean)
      )

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

    this.addEventListener(
      'mouseenter', () => {
        show(250)
      }, { signal }
    )

    this.addEventListener('mouseleave', hide, { signal })

    this.addEventListener(
      'focusin', () => {
        show(0)
      }, { signal }
    )

    this.addEventListener('focusout', hide, { signal })

    this.addEventListener(
      'keydown', event => {
        if (event.key === 'Escape') {
          hide()
        }
      }, { signal }
    )
  }

  private clearTimer(): void {
    if (!this.showTimer) return

    globalThis.clearTimeout(this.showTimer)

    this.showTimer = undefined
  }
}

class LumenToastViewportBehaviorElement extends LumenElement {
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

    this.setAttribute(
      'role', this.getAttribute('role') ??
      (this.getAttribute('variant') === 'destructive' ? 'alert' : 'status')
    )

    this.setAttribute(
      'aria-live', this.getAttribute('aria-live') ??
      (this.getAttribute('variant') === 'destructive' ?
        'assertive' :
        'polite')
    )

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.addEventListener(
      'keydown', event => {
        if (event.key !== 'Escape') return

        event.preventDefault()

        dismissToastElement(this)
      }, { signal: this.abortController.signal }
    )
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    clearToastTimer(this)
  }
}

class LumenFileUploadBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    const input = this.querySelector<HTMLInputElement>(
      '[data-ui-file-upload-input]'
    )

    if (!input) return

    const files = this.querySelector<HTMLElement>(
      '[data-ui-file-upload-files]'
    )

    const renderFiles = (): void => {
      const selectedFiles = input.files ? [...input.files] : []

      this.dataset.state = selectedFiles.length > 0 ? 'selected' : 'idle'

      if (!files) return

      if (selectedFiles.length === 1) {
        files.textContent = selectedFiles[0]?.name ?? ''
      } else {
        files.textContent =
          selectedFiles.length > 1 ?
            `${selectedFiles.length} files selected` :
            ''
      }
    }

    input.addEventListener('change', renderFiles, {
      signal: this.abortController.signal
    })

    this.addEventListener(
      'dragover', event => {
        if (input.disabled) return

        event.preventDefault()

        this.dataset.state = 'drag-over'
      }, { signal: this.abortController.signal }
    )

    this.addEventListener(
      'dragleave', event => {
        if (
          event.relatedTarget instanceof Node &&
          this.contains(event.relatedTarget)
        )
          return

        this.dataset.state = input.files?.length ? 'selected' : 'idle'
      }, { signal: this.abortController.signal }
    )

    this.addEventListener(
      'drop', event => {
        if (input.disabled) return

        event.preventDefault()

        if (event.dataTransfer) {
          input.files = event.dataTransfer.files

          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }, { signal: this.abortController.signal }
    )

    renderFiles()
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }
}

class LumenProgressBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    this.update()
  }

  override attributeChangedCallback() {
    super.attributeChangedCallback()

    if (this.isConnected) this.update()
  }

  private update() {
    const parsedMax = Number(this.getAttribute('max'))
    const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 100
    const parsedValue = Number(this.getAttribute('value'))

    const value = Math.min(
      max, Math.max(0, Number.isFinite(parsedValue) ? parsedValue : 0)
    )

    let indicator = this.querySelector<HTMLElement>(
      '[data-slot="progress-indicator"]'
    )

    if (!indicator) {
      indicator = document.createElement('span')

      indicator.className = 'ui-progress__bar'

      indicator.dataset.slot = 'progress-indicator'

      this.append(indicator)
    }

    this.setAttribute('aria-valuemax', String(max))

    this.setAttribute('aria-valuenow', String(value))

    indicator.style.width = `${(value / max) * 100}%`
  }
}

class LumenCopyButtonBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    this.addEventListener('click', () => {
      this.copy().catch(() => undefined)
    }, {
      signal: this.abortController.signal
    })

    this.addEventListener('keydown', event => {
      if (event.key !== ' ' && event.key !== 'Enter') return

      event.preventDefault()

      this.click()
    }, { signal: this.abortController.signal })
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    globalThis.clearTimeout(this.resetTimer)
  }

  private copy = async () => {
    const label = this.getAttribute('label') ?? 'Copy to clipboard'

    const copiedLabel = this.getAttribute('copied-label') ??
      'Copied to clipboard'

    const errorLabel = this.getAttribute('error-label') ??
      'Could not copy to clipboard'

    try {
      const selector = this.getAttribute('target')
      const target = selector ? document.querySelector<HTMLElement>(selector) : null

      const targetValue =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ?
          target.value :
          target?.innerText ?? target?.textContent

      const value = this.hasAttribute('value') ?
        this.getAttribute('value') ?? '' :
        targetValue

      if (value === undefined) throw new Error(errorLabel)

      await navigator.clipboard.writeText(value)

      this.dataset.state = 'copied'

      this.setAttribute('aria-label', copiedLabel)

      this.dispatchEvent(new CustomEvent('ui:copy-success', {
        bubbles: true,
        detail: { value }
      }))

      if (this.hasAttribute('toast')) {
        document.dispatchEvent(new CustomEvent('ui:toast', {
          detail: { title: copiedLabel, variant: 'success' }
        }))
      }
    } catch (error) {
      this.dataset.state = 'error'

      this.setAttribute('aria-label', errorLabel)

      this.dispatchEvent(new CustomEvent('ui:copy-error', {
        bubbles: true,
        detail: { error }
      }))

      if (this.hasAttribute('toast')) {
        document.dispatchEvent(new CustomEvent('ui:toast', {
          detail: { title: errorLabel, variant: 'destructive' }
        }))
      }
    }

    globalThis.clearTimeout(this.resetTimer)

    const parsedResetAfter = Number(this.getAttribute('reset-after') ?? '2000')

    const resetAfter = Number.isFinite(parsedResetAfter) ?
      Math.max(0, parsedResetAfter) :
      2000

    this.resetTimer = globalThis.setTimeout(() => {
      this.dataset.state = 'idle'

      this.setAttribute('aria-label', label)
    }, resetAfter)
  }
}

class LumenAnchorBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private frame = 0

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    const links = [...this.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
    const targets: { link: HTMLAnchorElement, target: HTMLElement }[] = []

    for (const link of links) {
      const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '')
      const target = id ? document.getElementById(id) : null

      if (target) {
        targets.push({ link, target })
      }
    }

    if (!targets.length) return

    const setActive = (active: HTMLAnchorElement) => {
      for (const link of links) {
        const isActive = link === active

        link.dataset.active = String(isActive)

        if (isActive) {
          link.setAttribute('aria-current', 'location')
        } else {
          link.removeAttribute('aria-current')
        }
      }
    }

    const update = () => {
      this.frame = 0

      const scrollingElement =
        document.scrollingElement ?? document.documentElement

      const atEnd = scrollingElement.scrollTop + scrollingElement.clientHeight >=
        scrollingElement.scrollHeight - 1

      const offset = Number(
        this.getAttribute('activation-offset') ?? this.dataset.uiAnchorOffset
      ) || 0

      let active = targets[0]?.link

      if (atEnd) {
        active = targets.at(-1)?.link
      } else {
        for (const item of targets) {
          if (item.target.getBoundingClientRect().top > offset) break

          active = item.link
        }
      }

      if (active) setActive(active)
    }

    const requestUpdate = () => {
      if (this.frame) return

      this.frame = requestAnimationFrame(update)
    }

    for (const { link } of targets) {
      link.addEventListener('click', () => {
        setActive(link)
      }, {
        signal: this.abortController.signal
      })
    }

    window.addEventListener('resize', requestUpdate, {
      passive: true,
      signal: this.abortController.signal
    })

    window.addEventListener('scroll', requestUpdate, {
      passive: true,
      signal: this.abortController.signal
    })

    update()
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    if (this.frame) cancelAnimationFrame(this.frame)

    this.frame = 0
  }
}

class LumenScrollProgressBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private frame = 0

  private update = () => {
    this.frame = 0

    const scrollingElement =
      document.scrollingElement ?? document.documentElement

    const maximum =
      scrollingElement.scrollHeight - scrollingElement.clientHeight

    const percentage =
      maximum > 0 ?
        Math.min(
          100, Math.max(0, (scrollingElement.scrollTop / maximum) * 100)
        ) :
        0

    let bar = this.querySelector<HTMLElement>('.ui-scroll-progress__bar')

    if (!bar) {
      bar = document.createElement('span')

      bar.className = 'ui-scroll-progress__bar'

      this.append(bar)
    }

    this.setAttribute('aria-valuenow', `${Math.round(percentage)}`)

    bar.style.transform = `scaleX(${percentage / 100})`
  }

  private scheduleUpdate = () => {
    if (this.frame) return

    if (typeof requestAnimationFrame === 'undefined') {
      this.update()

      return
    }

    this.frame = requestAnimationFrame(this.update)
  }

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    window.addEventListener('resize', this.scheduleUpdate, {
      passive: true,
      signal: this.abortController.signal
    })

    window.addEventListener('scroll', this.scheduleUpdate, {
      passive: true,
      signal: this.abortController.signal
    })

    this.update()
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    if (this.frame && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.frame)
    }

    this.frame = 0
  }
}

class LumenTourBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private opener: HTMLElement | null = null

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    const popover = this.querySelector<HTMLElement>('[data-ui-tour-popover]')

    const steps = [
      ...this.querySelectorAll<HTMLElement>('[data-ui-tour-step]')
    ]

    if (!popover || !steps.length) return

    let index = 0

    const positionStep = (): void => {
      const step = steps[index]

      if (!step) return

      for (const [stepIndex, node] of steps.entries()) {
        node.hidden = stepIndex !== index
      }

      const target = step.dataset.target ?
        document.querySelector<HTMLElement>(step.dataset.target) :
        null

      if (target) {
        const rect = target.getBoundingClientRect()

        popover.style.top = `${rect.bottom + 8}px`

        popover.style.left = `${rect.left}px`
      }
    }

    const open = (): void => {
      this.hidden = false

      index = 0

      positionStep()
    }

    const close = (): void => {
      this.hidden = true
    }

    this.addEventListener(
      'click', event => {
        const target = event.target

        if (!(target instanceof HTMLElement)) return

        if (target.closest('[data-ui-tour-next]')) {
          if (index < steps.length - 1) {
            index += 1

            positionStep()
          } else {
            close()
          }
        } else if (target.closest('[data-ui-tour-prev]')) {
          if (index > 0) {
            index -= 1

            positionStep()
          }
        } else if (
          target.closest('[data-ui-tour-close]') ||
          target.hasAttribute('data-ui-tour-backdrop')
        ) {
          close()
        }
      }, { signal: this.abortController.signal }
    )

    this.opener = this.id ?
      document.querySelector<HTMLElement>(`[data-ui-tour-open="#${this.id}"]`) :
      null

    this.opener?.addEventListener('click', open, {
      signal: this.abortController.signal
    })

    const lumenWindow = window as Window & {
      LumenTours?: Record<string, () => void>
    }

    lumenWindow.LumenTours ??= {}

    if (this.id) lumenWindow.LumenTours[this.id] = open
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    this.opener = null

    const lumenWindow = window as Window & {
      LumenTours?: Record<string, () => void>
    }

    if (this.id && lumenWindow.LumenTours)
      Reflect.deleteProperty(lumenWindow.LumenTours, this.id)
  }
}

class LumenTransferBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    const lists = new Map<string, HTMLElement>()

    for (const list of this.querySelectorAll<HTMLElement>(
      '[data-ui-transfer-list]'
    )) {
      if (list.dataset.side) lists.set(list.dataset.side, list)
    }

    const move = (fromSide: string, toSide: string): void => {
      const from = lists.get(fromSide)
      const to = lists.get(toSide)

      if (!from || !to) return

      const moved: string[] = []

      for (const checkbox of from.querySelectorAll<HTMLInputElement>(
        '[data-ui-transfer-item]'
      )) {
        if (!checkbox.checked) continue

        const item = checkbox.closest<HTMLElement>('.ui-transfer__item')

        if (item) {
          checkbox.checked = false

          to.append(item)

          moved.push(checkbox.value)
        }
      }

      if (moved.length) {
        this.dispatchEvent(
          new CustomEvent('ui:transfer-change', {
            bubbles: true,
            detail: { from: fromSide, to: toSide, values: moved }
          })
        )
      }
    }

    for (const button of this.querySelectorAll<HTMLButtonElement>(
      '[data-ui-transfer-move]'
    )) {
      button.addEventListener(
        'click', () => {
          if (button.dataset.uiTransferMove === 'target') {
            move('source', 'target')
          } else if (button.dataset.uiTransferMove === 'source') {
            move('target', 'source')
          }
        }, { signal: this.abortController.signal }
      )
    }
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }
}

class LumenMentionsBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private closeTimer: ReturnType<typeof globalThis.setTimeout> | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    const input = this.querySelector<HTMLTextAreaElement>(
      '[data-ui-mentions-input]'
    )

    const list = this.querySelector<HTMLElement>('[data-ui-mentions-list]')

    if (!input || !list) return

    if (!list.id) list.id = `ui-mentions-${createId('list')}`

    input.setAttribute('aria-autocomplete', 'list')

    input.setAttribute('aria-controls', list.id)

    input.setAttribute('aria-expanded', 'false')

    input.setAttribute('aria-label', input.getAttribute('aria-label') ?? this.getAttribute('label') ?? 'Mentions')

    input.setAttribute('role', 'combobox')

    const trigger = this.dataset.uiMentionsTrigger ?? '@'
    const escapedTrigger = trigger.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const options = [
      ...list.querySelectorAll<HTMLButtonElement>('[data-ui-mentions-option]')
    ]

    let activeIndex = -1

    for (const [index, option] of options.entries()) {
      option.id ||= `${list.id}-option-${index}`

      option.setAttribute('aria-selected', 'false')
    }

    const setActive = (index: number): void => {
      const visibleOptions = options.filter(option => !option.hidden)

      activeIndex = visibleOptions.length && index >= 0 ?
        Math.min(index, visibleOptions.length - 1) :
        -1

      for (const option of options) {
        option.setAttribute('aria-selected', option === visibleOptions[activeIndex] ? 'true' : 'false')
      }

      const active = visibleOptions[activeIndex]

      if (active?.id) input.setAttribute('aria-activedescendant', active.id)
      else input.removeAttribute('aria-activedescendant')
    }

    const close = (): void => {
      list.hidden = true

      input.setAttribute('aria-expanded', 'false')

      setActive(-1)
    }

    const filter = (): void => {
      const caret = input.selectionStart

      const match = new RegExp(`${escapedTrigger}(\\w*)$`).exec(
        input.value.slice(0, caret)
      )

      if (!match) {
        close()

        return
      }

      const query = (match[1] ?? '').toLowerCase()
      let visibleCount = 0

      for (const option of options) {
        const visible = (option.dataset.value ?? '')
          .toLowerCase()
          .startsWith(query)

        option.hidden = !visible

        if (visible) visibleCount += 1
      }

      list.hidden = visibleCount === 0

      input.setAttribute('aria-expanded', visibleCount > 0 ? 'true' : 'false')

      setActive(0)
    }

    const insert = (value: string): void => {
      const caret = input.selectionStart

      const before = input.value
        .slice(0, caret)
        .replace(new RegExp(`${escapedTrigger}\\w*$`), `${trigger}${value} `)

      input.value = before + input.value.slice(caret)

      input.focus()

      input.setSelectionRange(before.length, before.length)

      close()

      input.dispatchEvent(new Event('input', { bubbles: true }))
    }

    input.addEventListener('input', filter, {
      signal: this.abortController.signal
    })

    input.addEventListener(
      'keydown', event => {
        const visibleOptions = options.filter(option => !option.hidden)

        if (event.key === 'Escape' && !list.hidden) {
          event.preventDefault()

          close()
        } else if (['ArrowDown', 'ArrowUp', 'End', 'Home'].includes(event.key) && visibleOptions.length) {
          event.preventDefault()

          const nextIndex = getLoopedIndex(
            event.key, activeIndex, visibleOptions.length, ['ArrowDown']
          )

          setActive(nextIndex)
        } else if (event.key === 'Enter' && activeIndex >= 0 && !list.hidden) {
          event.preventDefault()

          insert(visibleOptions[activeIndex]?.dataset.value ?? '')
        }
      }, { signal: this.abortController.signal }
    )

    input.addEventListener(
      'blur', () => {
        this.closeTimer = globalThis.setTimeout(close, 120)
      }, { signal: this.abortController.signal }
    )

    for (const option of options) {
      option.addEventListener(
        'mousedown', event => {
          event.preventDefault()
        }, { signal: this.abortController.signal }
      )

      option.addEventListener(
        'click', () => {
          insert(option.dataset.value ?? '')
        }, { signal: this.abortController.signal }
      )
    }
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    if (this.closeTimer) globalThis.clearTimeout(this.closeTimer)

    this.closeTimer = undefined
  }
}

const setupSelectionDisclosure = (
  root: HTMLElement,
  signal: AbortSignal,
  rovingPanel = true
):
  | { close: () => void, panel: HTMLElement, trigger: HTMLElement } |
  undefined => {
  const trigger = root.querySelector<HTMLElement>('[data-ui-trigger]')
  const panel = root.querySelector<HTMLElement>('[data-ui-panel]')

  if (!trigger || !panel) return undefined

  const close = (): void => {
    setDisclosureOpen(trigger, panel, false)
  }

  setDisclosureOpen(
    trigger, panel, trigger.getAttribute('aria-expanded') === 'true'
  )

  trigger.addEventListener(
    'click', () => {
      setDisclosureOpen(
        trigger, panel, trigger.getAttribute('aria-expanded') !== 'true'
      )
    }, { signal }
  )

  trigger.addEventListener(
    'keydown', event => {
      if (!['ArrowDown', 'Enter', ' '].includes(event.key)) return

      event.preventDefault()

      setDisclosureOpen(trigger, panel, true)

      getFocusable(panel)[0]?.focus()
    }, { signal }
  )

  panel.addEventListener(
    'keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault()

        close()

        trigger.focus({ preventScroll: true })

        return
      }

      if (
        !rovingPanel ||
        !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
      )
        return

      const items = getFocusable(panel)

      if (!items.length) return

      event.preventDefault()

      const currentIndex = Math.max(
        0, items.indexOf(document.activeElement as HTMLElement)
      )

      items[
        getLoopedIndex(event.key, currentIndex, items.length, ['ArrowDown'])
      ]?.focus()
    }, { signal }
  )

  document.addEventListener(
    'pointerdown', event => {
      const target = getOwnedTarget(event)

      if (!target || root.contains(target)) return

      close()
    }, { signal }
  )

  return { close, panel, trigger }
}

class LumenCascaderBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    const disclosure = setupSelectionDisclosure(
      this, this.abortController.signal, false
    )

    if (!disclosure) return

    const valueLabel = this.querySelector<HTMLElement>(
      '[data-ui-cascader-value]'
    )

    const input = this.querySelector<HTMLInputElement>(
      '[data-ui-cascader-input]'
    )

    const columns = [
      ...this.querySelectorAll<HTMLElement>('.ui-cascader__column')
    ]

    for (const option of this.querySelectorAll<HTMLButtonElement>(
      '[data-ui-cascader-option]'
    )) {
      option.addEventListener(
        'click', () => {
          const column = option.closest<HTMLElement>('.ui-cascader__column')

          if (column) {
            const columnIndex = columns.indexOf(column)

            for (const descendant of columns.slice(columnIndex + 1)) {
              descendant.hidden = true

              for (const descendantOption of descendant.querySelectorAll<HTMLElement>(
                '[data-ui-cascader-option]'
              )) {
                descendantOption.dataset.active = 'false'

                descendantOption.setAttribute('aria-selected', 'false')
              }
            }

            for (const sibling of column.querySelectorAll<HTMLElement>(
              '[data-ui-cascader-option]'
            )) {
              sibling.dataset.active = 'false'

              sibling.setAttribute('aria-selected', 'false')
            }
          }

          option.dataset.active = 'true'

          option.setAttribute('aria-selected', 'true')

          const next = option.dataset.uiCascaderNext ?
            this.querySelector<HTMLElement>(option.dataset.uiCascaderNext) :
            null

          if (next) {
            next.hidden = false

            return
          }

          const value = option.dataset.value ?? option.textContent.trim()

          if (valueLabel)
            valueLabel.textContent =
              option.dataset.label ?? option.textContent.trim()

          if (input) input.value = value

          disclosure.close()

          this.dispatchEvent(
            new CustomEvent('ui:cascader-change', {
              bubbles: true,
              detail: { value }
            })
          )
        }, { signal: this.abortController.signal }
      )
    }

    disclosure.panel.addEventListener(
      'keydown', event => {
        const target = event.target

        if (!(target instanceof HTMLElement)) return

        const option = target.closest<HTMLButtonElement>(
          '[data-ui-cascader-option]'
        )

        const column = option?.closest<HTMLElement>('.ui-cascader__column')

        if (!option || !column) return

        const columnIndex = columns.indexOf(column)

        const options = [
          ...column.querySelectorAll<HTMLButtonElement>(
            '[data-ui-cascader-option]'
          )
        ]

        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()

          options[
            getLoopedIndex(event.key, options.indexOf(option), options.length, [
              'ArrowDown'
            ])
          ]?.focus()
        } else if (event.key === 'ArrowRight') {
          const next = option.dataset.uiCascaderNext ?
            this.querySelector<HTMLElement>(option.dataset.uiCascaderNext) :
            null

          if (next) {
            event.preventDefault()

            option.click()

            next
              .querySelector<HTMLElement>('[data-ui-cascader-option]')
              ?.focus()
          }
        } else if (event.key === 'ArrowLeft' && columnIndex > 0) {
          event.preventDefault()

          for (const descendant of columns.slice(columnIndex))
            descendant.hidden = true

          columns
            .slice(0, columnIndex)
            .reverse()
            .find(candidate => !candidate.hidden)
            ?.querySelector<HTMLElement>(
              '[data-ui-cascader-option][data-active="true"]'
            )
            ?.focus()
        }
      }, { signal: this.abortController.signal }
    )
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }
}

class LumenTreeSelectBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.abortController?.abort()

    this.abortController = new AbortController()

    const disclosure = setupSelectionDisclosure(
      this, this.abortController.signal
    )

    if (!disclosure) return

    const valueLabel = this.querySelector<HTMLElement>(
      '[data-ui-tree-select-value]'
    )

    const input = this.querySelector<HTMLInputElement>(
      '[data-ui-tree-select-input]'
    )

    for (const item of this.querySelectorAll<HTMLElement>(
      '[data-ui-panel] [data-value]'
    )) {
      item.addEventListener(
        'click', () => {
          const value = item.dataset.value ?? ''

          if (valueLabel) valueLabel.textContent = item.textContent.trim()

          if (input) input.value = value

          disclosure.close()

          this.dispatchEvent(
            new CustomEvent('ui:tree-select-change', {
              bubbles: true,
              detail: { value }
            })
          )
        }, { signal: this.abortController.signal }
      )
    }
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined
  }
}

const kanbanColumnSelector = '[data-ui-kanban-column], lumen-kanban-column'
const getKanbanColumnValue = (column: HTMLElement): string => column.dataset.uiKanbanColumn ?? column.getAttribute('value') ?? ''

class LumenKanbanBoardBehaviorElement extends LumenElement {
  private abortController: AbortController | undefined
  private mutationObserver: MutationObserver | undefined
  private pointer: {
    active: boolean
    handle: HTMLElement
    item: HTMLElement
    pointerId: number
    startX: number
    startY: number
  } | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.abortController?.abort()

    this.abortController = new AbortController()

    const { signal } = this.abortController

    this.initializeHandles()

    this.mutationObserver?.disconnect()

    this.mutationObserver = new MutationObserver(() => {
      this.initializeHandles()
    })

    this.mutationObserver.observe(this, { childList: true, subtree: true })

    this.addEventListener('dragstart', event => {
      this.onDragStart(event)
    }, { signal })

    this.addEventListener('dragend', () => {
      this.clearDragState()
    }, { signal })

    this.addEventListener('dragover', event => {
      this.onDragOver(event)
    }, { signal })

    this.addEventListener('dragleave', event => {
      this.onDragLeave(event)
    }, { signal })

    this.addEventListener('drop', event => {
      this.onDrop(event)
    }, { signal })

    this.addEventListener('keydown', event => {
      this.onKeyDown(event)
    }, { signal })

    this.addEventListener('pointerdown', event => {
      this.onPointerDown(event)
    }, { signal })

    this.addEventListener('pointermove', event => {
      this.onPointerMove(event)
    }, { signal })

    this.addEventListener('pointerup', event => {
      this.onPointerUp(event)
    }, { signal })

    this.addEventListener('pointercancel', () => {
      this.clearDragState()
    }, { signal })
  }

  override disconnectedCallback() {
    this.abortController?.abort()

    this.abortController = undefined

    this.mutationObserver?.disconnect()

    this.mutationObserver = undefined

    this.clearDragState()
  }

  private initializeHandles(): void {
    for (const handle of this.querySelectorAll<HTMLElement>('[data-ui-kanban-handle]'))
      handle.draggable = true
  }

  private getItem(target: EventTarget | null): HTMLElement | null {
    const item = target instanceof Element ?
      target.closest<HTMLElement>('[data-ui-kanban-item]') :
      null

    return item?.closest<HTMLElement>('[data-ui-kanban], lumen-kanban-board') === this ?
      item :
      null
  }

  private getColumn(target: EventTarget | null): HTMLElement | null {
    const column = target instanceof Element ?
      target.closest<HTMLElement>(kanbanColumnSelector) :
      null

    return column?.closest<HTMLElement>('[data-ui-kanban], lumen-kanban-board') === this ?
      column :
      null
  }

  private requestMove(
    item: HTMLElement,
    targetColumn: HTMLElement,
    input: LumenKanbanMoveDetail['input']
  ): void {
    const fromColumnElement = item.closest<HTMLElement>(kanbanColumnSelector)

    const detail = createLumenKanbanMoveDetail({
      fromColumn: fromColumnElement ? getKanbanColumnValue(fromColumnElement) : '',
      input,
      itemId: item.dataset.uiKanbanItem ?? item.id,
      toColumn: getKanbanColumnValue(targetColumn)
    })

    if (!detail) return

    const accepted = this.dispatchEvent(new CustomEvent('ui:kanban-move-request', {
      bubbles: true,
      cancelable: true,
      detail
    }))

    if (accepted) this.announce(`Move requested to ${this.columnLabel(targetColumn)}.`)
  }

  private columnLabel(column: HTMLElement): string {
    return column.getAttribute('aria-label') ||
      column.querySelector('h2, h3, [data-ui-kanban-column-label]')?.textContent.trim() ||
      getKanbanColumnValue(column)
  }

  private announce(message: string): void {
    let live = this.querySelector<HTMLElement>('[data-ui-kanban-live]')

    if (!live) {
      live = document.createElement('span')

      live.className = 'ui-visually-hidden'

      live.dataset.uiKanbanLive = ''

      live.setAttribute('aria-live', 'polite')

      live.setAttribute('role', 'status')

      this.append(live)
    }

    live.textContent = message
  }

  private onDragStart(event: DragEvent): void {
    const handle = event.target instanceof Element ?
      event.target.closest<HTMLElement>('[data-ui-kanban-handle]') :
      null

    const item = this.getItem(handle)

    if (!handle || !item || item.getAttribute('aria-busy') === 'true') {
      event.preventDefault()

      return
    }

    event.dataTransfer?.setData('text/plain', item.dataset.uiKanbanItem ?? item.id)

    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'

    item.dataset.state = 'dragging'
  }

  private onDragOver(event: DragEvent): void {
    const column = this.getColumn(event.target)

    if (!column) return

    event.preventDefault()

    column.dataset.state = 'drop-target'

    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  }

  private onDragLeave(event: DragEvent): void {
    const column = this.getColumn(event.target)

    if (
      !column ||
      (event.relatedTarget instanceof Node && column.contains(event.relatedTarget))
    ) return

    delete column.dataset.state
  }

  private onDrop(event: DragEvent): void {
    const column = this.getColumn(event.target)
    const itemId = event.dataTransfer?.getData('text/plain') ?? ''

    const item = [...this.querySelectorAll<HTMLElement>('[data-ui-kanban-item]')]
      .find(candidate => (candidate.dataset.uiKanbanItem ?? candidate.id) === itemId)

    if (!column || !item) return

    event.preventDefault()

    this.requestMove(item, column, 'pointer')

    this.clearDragState()
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

    const handle = event.target instanceof Element ?
      event.target.closest<HTMLElement>('[data-ui-kanban-handle]') :
      null

    const item = this.getItem(handle)
    const currentColumn = this.getColumn(item)

    if (!handle || !item || !currentColumn || item.getAttribute('aria-busy') === 'true') return

    const columns = [...this.querySelectorAll<HTMLElement>(kanbanColumnSelector)]
    const currentIndex = columns.indexOf(currentColumn)
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const rtl = getComputedStyle(this).direction === 'rtl'
    const target = columns[currentIndex + (rtl ? -direction : direction)]

    if (!target) return

    event.preventDefault()

    this.requestMove(item, target, 'keyboard')
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') return

    const handle = event.target instanceof Element ?
      event.target.closest<HTMLElement>('[data-ui-kanban-handle]') :
      null

    const item = this.getItem(handle)

    if (!handle || !item || item.getAttribute('aria-busy') === 'true') return

    this.pointer = {
      active: false,
      handle,
      item,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if (this.pointer?.pointerId !== event.pointerId) return

    if (!this.pointer.active && Math.hypot(
      event.clientX - this.pointer.startX,
      event.clientY - this.pointer.startY
    ) < 8) return

    this.pointer.active = true

    this.pointer.handle.setPointerCapture(event.pointerId)

    this.pointer.item.dataset.state = 'dragging'

    const target = this.getColumn(document.elementFromPoint(event.clientX, event.clientY))

    for (const column of this.querySelectorAll<HTMLElement>(kanbanColumnSelector)) {
      if (column === target) column.dataset.state = 'drop-target'
      else delete column.dataset.state
    }
  }

  private onPointerUp(event: PointerEvent): void {
    const pointer = this.pointer

    if (pointer?.pointerId !== event.pointerId) return

    const target = this.getColumn(document.elementFromPoint(event.clientX, event.clientY))

    if (pointer.active && target) this.requestMove(pointer.item, target, 'pointer')

    this.clearDragState()
  }

  private clearDragState(): void {
    this.pointer = undefined

    for (const item of this.querySelectorAll<HTMLElement>('[data-ui-kanban-item]'))
      if (item.dataset.state === 'dragging') delete item.dataset.state

    for (const column of this.querySelectorAll<HTMLElement>(kanbanColumnSelector))
      if (column.dataset.state === 'drop-target') delete column.dataset.state
  }
}

class LumenBackToTopBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    this.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }
}

const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value)

const parseLanguageLocales = (value: string | null): readonly LumenLocaleOption[] => {
  if (!value) return normalizeLumenLocales(undefined)

  try {
    const parsed: unknown = JSON.parse(value)

    if (!isUnknownArray(parsed)) return normalizeLumenLocales(undefined)

    return normalizeLumenLocales(parsed.flatMap(item => {
      if (!item || typeof item !== 'object' || !('label' in item) || !('value' in item)) return []

      const { label, value: localeValue } = item

      return typeof label === 'string' && typeof localeValue === 'string' ?
        [{ label, value: localeValue }] :
        []
    }))
  } catch {
    return normalizeLumenLocales(undefined)
  }
}

class LumenLanguageToggleBehaviorElement extends LumenElement {
  private locales = normalizeLumenLocales(undefined)

  private readonly handleClick = () => {
    const { current, next } = getLumenLocalePair(
      this.locales,
      this.dataset.uiLanguageValue
    )

    if (!this.hasAttribute('value')) {
      document.documentElement.lang = next.value

      this.sync(next.value)

      const storageKey = this.getAttribute('storage-key')

      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next.value)
        } catch {
          // Storage can be unavailable in privacy modes.
        }
      }
    }

    this.dispatchEvent(new CustomEvent('ui:language-change', {
      bubbles: true,
      composed: true,
      detail: { previousValue: current.value, value: next.value }
    }))
  }

  override connectedCallback() {
    super.connectedCallback()

    this.initialize(true)

    this.addEventListener('click', this.handleClick)
  }

  override disconnectedCallback() {
    this.removeEventListener('click', this.handleClick)
  }

  override attributeChangedCallback(
    name?: string,
    previousValue?: string | null,
    value?: string | null
  ) {
    super.attributeChangedCallback(name, previousValue, value)

    if (
      this.isConnected &&
      name &&
      ['default-value', 'label-template', 'locales', 'value'].includes(name)
    ) this.initialize(false)
  }

  private initialize(readStorage: boolean): void {
    this.locales = parseLanguageLocales(this.getAttribute('locales'))

    const controlled = this.hasAttribute('value')
    let storedValue: string | null = null

    if (!controlled && readStorage) {
      const storageKey = this.getAttribute('storage-key')

      if (storageKey) {
        try {
          storedValue = localStorage.getItem(storageKey)
        } catch {
          // Storage can be unavailable in privacy modes.
        }
      }
    }

    const documentValue = document.documentElement.lang || undefined

    const requestedValue = controlled ?
      this.getAttribute('value') || undefined :
      storedValue ?? this.getAttribute('default-value') ?? documentValue

    const { current } = getLumenLocalePair(this.locales, requestedValue)

    this.sync(current.value)

    if (!controlled) document.documentElement.lang = current.value
  }

  private sync(value: string): void {
    const { current, next } = getLumenLocalePair(this.locales, value)

    const template = this.getAttribute('label-template') ??
      'Change language from {current} to {next}'

    let label = this.querySelector<HTMLElement>('[data-ui-language-label]')

    if (!label && !this.textContent.trim()) {
      label = document.createElement('span')

      label.dataset.uiLanguageLabel = ''

      this.append(label)
    }

    this.dataset.uiLanguageValue = current.value

    this.dataset.uiLanguageNextValue = next.value

    this.setAttribute('aria-label', formatLumenLanguageLabel(template, current, next))

    if (label) {
      label.lang = next.value

      label.textContent = next.label
    }
  }
}

class LumenParticlesBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    if (this.hasAttribute('data-ui-particles-initialized')) return

    this.setAttribute('data-ui-particles-initialized', '')

    type ParticleDensity = 'low' | 'medium' | 'high'

    const densityConfig: Record<ParticleDensity, number> = {
      low: 15,
      medium: 25,
      high: 40
    }

    const particleTones = [
      'var(--brand)',
      'var(--accent)',
      'var(--glow, var(--brand))'
    ]

    const density = (this.getAttribute('data-ui-particles') ||
      'medium') as ParticleDensity

    const count = densityConfig[density]

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span')
      const size = Math.random() * 12 + 8

      particle.className = 'ui-particles__particle'

      const particleStyles = {
        '--ui-particle-delay': `${Math.random() * 8}s`,
        '--ui-particle-duration': `${20 + Math.random() * 15}s`,
        '--ui-particle-left': `${Math.random() * 100}%`,
        '--ui-particle-size': `${size}px`,
        '--ui-particle-tone':
          particleTones[Math.floor(Math.random() * particleTones.length)] ??
          'var(--brand)',
        '--ui-particle-top': `${Math.random() * 100}%`
      }

      for (const [property, value] of Object.entries(particleStyles)) {
        particle.style.setProperty(property, value)
      }

      this.appendChild(particle)
    }
  }
}

class LumenRatingBehaviorElement extends LumenElement {
  override connectedCallback() {
    super.connectedCallback()

    this.addEventListener('click', e => {
      if (this.getAttribute('data-readonly') === 'true') return

      const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
        '.ui-rating__star'
      )

      if (!button) return

      const stars = [
        ...this.querySelectorAll<HTMLButtonElement>('.ui-rating__star')
      ]

      const index = stars.indexOf(button)

      if (index === -1) return

      const newValue = index + 1

      this.setAttribute('data-value', newValue.toString())

      for (const [i, star] of stars.entries()) {
        star.setAttribute('data-active', i < newValue ? 'true' : 'false')
      }

      this.dispatchEvent(
        new CustomEvent('change', { detail: { value: newValue } })
      )
    })
  }
}

class LumenScrollRevealBehaviorElement extends LumenElement {
  private observer: IntersectionObserver | undefined

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.dataset.uiScrollRevealBound = 'true'

    const delay = Math.max(0, Number(this.getAttribute('delay')) || 0)

    this.style.setProperty('--ui-reveal-delay', `${delay}ms`)

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      this.classList.add('is-revealed')

      return
    }

    const once = this.getAttribute('once') !== 'false'

    const threshold = Math.min(
      1, Math.max(0, Number(this.getAttribute('threshold')) || 0)
    )

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          entry.target.classList.toggle('is-revealed', entry.isIntersecting)

          if (entry.isIntersecting && once) {
            this.observer?.unobserve(entry.target)
          }
        }
      }, { threshold }
    )

    this.observer.observe(this)
  }

  override disconnectedCallback() {
    this.observer?.disconnect()

    this.observer = undefined
  }
}

class LumenRevealGroupBehaviorElement extends LumenScrollRevealBehaviorElement {
  override connectedCallback() {
    super.connectedCallback()

    const stagger = Math.max(0, Number(this.getAttribute('stagger')) || 80)

    this.style.setProperty('--ui-reveal-stagger', `${stagger}ms`)

    for (const [index, child] of [...this.children].entries()) {
      if (child instanceof HTMLElement) {
        child.style.setProperty('--ui-reveal-index', String(index))
      }
    }
  }
}

class LumenAnimatedNumberBehaviorElement extends LumenElement {
  private animationFrame: number | undefined
  private observer: IntersectionObserver | undefined

  override connectedCallback() {
    super.connectedCallback()

    this.animateValue()
  }

  override attributeChangedCallback() {
    super.attributeChangedCallback()

    if (this.isConnected) this.animateValue()
  }

  override disconnectedCallback() {
    this.observer?.disconnect()

    if (this.animationFrame !== undefined)
      cancelAnimationFrame(this.animationFrame)
  }

  private animateValue() {
    if (!hasDocument()) return

    this.observer?.disconnect()

    if (this.animationFrame !== undefined)
      cancelAnimationFrame(this.animationFrame)

    const from = Number(this.getAttribute('from'))
    const value = Number(this.getAttribute('value'))

    if (!Number.isFinite(from) || !Number.isFinite(value)) return

    const decimals = Math.max(
      0, Math.min(20, Number(this.getAttribute('decimals')) || 0)
    )

    const prefix = this.getAttribute('prefix') ?? ''
    const suffix = this.getAttribute('suffix') ?? ''

    const formatter = new Intl.NumberFormat(
      this.getAttribute('locale') || undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals
      }
    )

    const format = (current: number) => `${prefix}${formatter.format(current)}${suffix}`
    const finalValue = format(value)

    this.setAttribute('aria-label', finalValue)

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      this.textContent = finalValue

      return
    }

    this.textContent = format(from)

    this.observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return

        this.observer?.disconnect()

        const durationValue = getComputedStyle(this)
          .getPropertyValue('--ui-motion-duration')
          .trim()

        const duration = parseMotionDuration(durationValue)
        const startedAt = performance.now()

        const update = (now: number) => {
          const progress = Math.min(
            1, (now - startedAt) / Math.max(1, duration)
          )

          const eased = 1 - Math.pow(1 - progress, 3)

          this.textContent = format(from + (value - from) * eased)

          if (progress < 1) {
            this.animationFrame = requestAnimationFrame(update)
          } else {
            this.textContent = finalValue
          }
        }

        this.animationFrame = requestAnimationFrame(update)
      }, { threshold: 0.15 }
    )

    this.observer.observe(this)
  }
}

class LumenThemeToggleBehaviorElement extends LumenElement {
  #isAnimating = false

  override connectedCallback() {
    super.connectedCallback()

    this.setAttribute('role', 'switch')

    this.setAttribute('aria-checked', String(this.#rootInDarkMode()))

    this.addEventListener('click', () => {
      if (this.#isAnimating) return

      const isDark = this.#rootInDarkMode()
      const newTheme = isDark ? 'light' : 'dark'

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches

      if (prefersReducedMotion) {
        this.#dispatchChange(newTheme)

        return
      }

      this.#circularReveal(isDark, newTheme)
    })
  }

  #rootInDarkMode() {
    const doc = document.documentElement

    return (
      doc.getAttribute('data-theme') === 'dark' ||
      doc.classList.contains('dark')
    )
  }

  #dispatchChange(newTheme: string) {
    const doc = document.documentElement

    doc.setAttribute('data-theme', newTheme)

    if (newTheme === 'dark') {
      doc.classList.add('dark')
    } else {
      doc.classList.remove('dark')
    }

    localStorage.setItem('theme', newTheme)

    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }))

    this.setAttribute('aria-checked', String(this.#rootInDarkMode()))
  }

  #circularReveal(isDark: boolean, newTheme: string) {
    const isTouchDevice = window.matchMedia(
      '(hover: none) and (pointer: coarse)'
    ).matches

    if (isTouchDevice) {
      this.#dispatchChange(newTheme)

      return
    }

    this.#isAnimating = true

    const rect = this.getBoundingClientRect()
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

    this.#dispatchChange(newTheme)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition =
          'clip-path 580ms cubic-bezier(0.4, 0, 0.2, 1)'

        overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`

        const done = () => {
          overlay.remove()

          this.#isAnimating = false
        }

        overlay.addEventListener('transitionend', done, { once: true })

        setTimeout(done, 750)
      })
    })
  }
}

class LumenPhoneInputBehaviorElement extends LumenElement {
  private countrySelect: HTMLSelectElement | undefined
  private eventController: AbortController | undefined
  private numberInput: HTMLInputElement | undefined

  get e164(): string | null {
    return this.dataset.e164 || null
  }

  get valid(): boolean {
    return this.dataset.valid === 'true'
  }

  get value(): string {
    return this.numberInput?.value ?? this.getAttribute('value') ?? ''
  }

  set value(value: string) {
    this.setAttribute('value', value)
  }

  override attributeChangedCallback(
    name: string,
    previousValue: string | null,
    value: string | null
  ) {
    super.attributeChangedCallback(name, previousValue, value)

    if (previousValue === value || !this.numberInput || !this.countrySelect) return

    if (name === 'value') {
      this.numberInput.value = value ?? ''

      this.commit()
    }

    if (name === 'country' && value) {
      const countryOption = [...this.countrySelect.options].find(option => (
        option.value === value || option.textContent.includes(`(${value})`)
      ))

      if (countryOption) {
        this.countrySelect.value = countryOption.value

        this.commit()
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback()

    if (!hasDocument()) return

    this.ensureControls()

    this.bindControls()

    if (this.numberInput?.value) this.commit()
  }

  override disconnectedCallback() {
    this.eventController?.abort()

    this.eventController = undefined
  }

  private bindControls() {
    if (!this.countrySelect || !this.numberInput) return

    this.eventController?.abort()

    this.eventController = new AbortController()

    const options = { signal: this.eventController.signal }

    this.countrySelect.addEventListener('change', () => {
      this.commit()
    }, options)

    this.numberInput.addEventListener('input', () => {
      this.commit()
    }, options)
  }

  private commit() {
    if (!this.countrySelect || !this.numberInput) return

    const selectedOption = this.countrySelect.selectedOptions[0]
    const regionCode = selectedOption?.dataset.region ?? this.countrySelect.value
    const country = getLumenPhoneCountry(regionCode, this.phoneOptions)

    if (!country) return

    const phoneNumber = resolveLumenPhoneNumber(country, this.numberInput.value, this.phoneOptions)
    const hasInput = phoneNumber.nationalNumber.length > 0

    const invalidMessage = this.getAttribute('invalid-number-message') ??
      'Enter a complete phone number.'

    this.numberInput.value = phoneNumber.nationalNumber

    this.countrySelect.value = phoneNumber.country.regionCode

    this.numberInput.setCustomValidity(hasInput && !phoneNumber.isValid ? invalidMessage : '')

    this.numberInput.setAttribute('aria-invalid', String(hasInput && !phoneNumber.isValid))

    this.dataset.e164 = phoneNumber.e164 ?? ''

    this.dataset.valid = String(phoneNumber.isValid)

    this.dispatchEvent(new CustomEvent('ui:phone-change', {
      bubbles: true,
      detail: phoneNumber
    }))
  }

  private ensureControls() {
    this.countrySelect = this.querySelector<HTMLSelectElement>('.ui-phone-input__country') ?? undefined

    this.numberInput = this.querySelector<HTMLInputElement>('.ui-phone-input__number') ?? undefined

    if (!this.countrySelect) {
      this.countrySelect = document.createElement('select')

      this.countrySelect.className = 'ui-select ui-phone-input__country'

      this.append(this.countrySelect)
    }

    if (!this.numberInput) {
      this.numberInput = document.createElement('input')

      this.numberInput.className = 'ui-input ui-phone-input__number'

      this.append(this.numberInput)
    }

    this.populateCountries()

    this.countrySelect.setAttribute('aria-label', this.getAttribute('country-label') ?? 'Country code')

    this.countrySelect.name = this.getAttribute('country-name') ?? 'country'

    this.numberInput.autocomplete = 'tel'

    this.numberInput.inputMode = 'tel'

    this.numberInput.name = this.getAttribute('name') ?? 'phone'

    this.numberInput.placeholder = this.getAttribute('placeholder') ?? 'Phone number'

    this.numberInput.type = 'tel'

    this.numberInput.value = this.getAttribute('value') ?? this.numberInput.value
  }

  private get phoneOptions() {
    const locale = (this.getAttribute('locale') ?? this.lang) || document.documentElement.lang

    return locale ? { locale } : {}
  }

  private populateCountries() {
    if (!this.countrySelect || this.countrySelect.options.length > 0) return

    const countries = getLumenPhoneCountries(this.phoneOptions)
    const requestedCountry = this.getAttribute('country') ?? 'US'

    for (const country of countries) {
      const option = document.createElement('option')

      option.dataset.region = country.regionCode

      option.textContent = country.pickerLabel

      option.value = country.regionCode

      option.selected = country.regionCode === requestedCountry ||
        country.callingCode === requestedCountry

      this.countrySelect.append(option)
    }
  }
}

const withObservedAttributes = (
  config: LumenElementConfig
): LumenElementConfig => ({ ...config, observedAttributes: observedAttributeNames })

const createLumenElementClass = (
  config: LumenElementConfig
): LumenElementConstructor => createStandaloneLumenElementClass(
  withObservedAttributes(config)
)

const createLumenBehaviorElementClass = (
  BaseElement: typeof LumenElement,
  config: LumenElementConfig
) => class extends BaseElement {
  static override config = withObservedAttributes(config)
}

const behaviorElementClasses: Partial<
  Record<LumenComponentName, typeof LumenElement>
> = {
  AlertDialog: LumenDialogBehaviorElement,
  Anchor: LumenAnchorBehaviorElement,
  AnimatedNumber: LumenAnimatedNumberBehaviorElement,
  BackToTop: LumenBackToTopBehaviorElement,
  BarChart: LumenBarChartBehaviorElement,
  Cascader: LumenCascaderBehaviorElement,
  Checkbox: LumenScalarFormControlElement,
  CodeTabs: LumenTabsBehaviorElement,
  ColorPicker: LumenScalarFormControlElement,
  ComboChart: LumenComboChartBehaviorElement,
  CopyButton: LumenCopyButtonBehaviorElement,
  DataTable: LumenDataTableBehaviorElement,
  Dialog: LumenDialogBehaviorElement,
  DropdownMenu: LumenDisclosureBehaviorElement,
  FileUpload: LumenFileUploadBehaviorElement,
  Graphic: LumenGraphicBehaviorElement,
  Heatmap: LumenHeatmapBehaviorElement,
  Illustration: LumenIllustrationBehaviorElement,
  Icon: LumenIconBehaviorElement,
  Input: LumenScalarFormControlElement,
  KanbanBoard: LumenKanbanBoardBehaviorElement,
  LanguageToggle: LumenLanguageToggleBehaviorElement,
  LineChart: LumenLineChartBehaviorElement,
  ListBox: LumenListBoxBehaviorElement,
  Mentions: LumenMentionsBehaviorElement,
  NativeSelect: LumenNativeSelectFormControlElement,
  NumberField: LumenScalarFormControlElement,
  Particles: LumenParticlesBehaviorElement,
  PieChart: LumenPieChartBehaviorElement,
  PhoneInput: LumenPhoneInputBehaviorElement,
  Popover: LumenDisclosureBehaviorElement,
  Progress: LumenProgressBehaviorElement,
  PasswordField: LumenPasswordFieldBehaviorElement,
  Rating: LumenRatingBehaviorElement,
  RangeChart: LumenRangeChartBehaviorElement,
  RevealGroup: LumenRevealGroupBehaviorElement,
  ScrollProgress: LumenScrollProgressBehaviorElement,
  ScrollReveal: LumenScrollRevealBehaviorElement,
  ScatterChart: LumenScatterChartBehaviorElement,
  SearchField: LumenScalarFormControlElement,
  Select: LumenSelectBehaviorElement,
  Slider: LumenScalarFormControlElement,
  Sparkline: LumenSparklineBehaviorElement,
  Switch: LumenScalarFormControlElement,
  Tabs: LumenTabsBehaviorElement,
  Textarea: LumenTextareaFormControlElement,
  ThemeBuilder: LumenThemeBuilderBehaviorElement,
  ThemeToggle: LumenThemeToggleBehaviorElement,
  Toast: LumenToastBehaviorElement,
  ToastViewport: LumenToastViewportBehaviorElement,
  TimeField: LumenScalarFormControlElement,
  Tour: LumenTourBehaviorElement,
  Transfer: LumenTransferBehaviorElement,
  TreeSelect: LumenTreeSelectBehaviorElement,
  Tooltip: LumenTooltipBehaviorElement,
  VirtualList: LumenVirtualListBehaviorElement
}

const granularElementClasses: Partial<
  Record<LumenComponentName, LumenElementConstructor>
> = {
  Badge: GranularLumenBadgeElement,
  Button: GranularLumenButtonElement,
  Card: GranularLumenCardElement,
  CardContent: GranularLumenCardContentElement,
  CardDescription: GranularLumenCardDescriptionElement,
  CardFooter: GranularLumenCardFooterElement,
  CardHeader: GranularLumenCardHeaderElement,
  CardTitle: GranularLumenCardTitleElement,
  Combobox: GranularLumenComboboxElement,
  Container: GranularLumenContainerElement,
  Direction: GranularLumenDirectionElement,
  Grid: GranularLumenGridElement,
  Label: GranularLumenLabelElement,
  Separator: GranularLumenSeparatorElement,
  Skeleton: GranularLumenSkeletonElement,
  Spinner: GranularLumenSpinnerElement,
  Stack: GranularLumenStackElement,
  Typography: GranularLumenTypographyElement,
  VisuallyHidden: GranularLumenVisuallyHiddenElement
}

const elementClasses = Object.fromEntries(
  lumenComponentNames.map(componentName => {
    const granularClass = granularElementClasses[componentName]

    if (granularClass) return [componentName, granularClass]

    const behaviorClass = behaviorElementClasses[componentName]

    if (behaviorClass) {
      return [
        componentName,
        createLumenBehaviorElementClass(
          behaviorClass, elementConfigs[componentName]
        )
      ]
    }

    return [
      componentName,
      createLumenElementClass(elementConfigs[componentName])
    ]
  })
) as Record<LumenComponentName, LumenElementConstructor>

const elementDefinitions = lumenComponentNames.map(componentName => {
  const config = elementConfigs[componentName]

  return [config.tagName, elementClasses[componentName]] as const
})

const lumenSonnerElementConfig: LumenElementConfig = {
  baseClassName: 'ui-sonner',
  defaults: { 'data-ui-sonner': '' },
  tagName: 'lumen-sonner'
}

const LumenSonnerElementClass: LumenElementConstructor = createLumenBehaviorElementClass(
  LumenToastViewportBehaviorElement,
  lumenSonnerElementConfig
)

type LumenCustomElementRegistry = Pick<CustomElementRegistry, 'define' | 'get'>

const resolveCustomElementRegistry = (
  registry: LumenCustomElementRegistry | undefined
): LumenCustomElementRegistry | undefined => registry ?? (
  typeof customElements === 'undefined' ?
    undefined :
    customElements
)

const isComponentNameList = (
  value: LumenCustomElementRegistry | readonly LumenComponentName[] | undefined
): value is readonly LumenComponentName[] => Array.isArray(value)

export const enhanceLumenElements = (scope: ParentNode = document): void => {
  enhanceLumenDateRangePickers(scope)

  enhanceLumenDatePickers(scope)

  enhanceLumenInputOTPs(scope)

  initLumenFields(scope)

  initLumenForms(scope)

  enhanceLumenPasswordFields(scope)

  enhanceLumenListBoxes(scope)
}

export const defineLumenElements = (
  componentNamesOrRegistry?:
    LumenCustomElementRegistry | readonly LumenComponentName[],
  suppliedRegistry?: LumenCustomElementRegistry
): void => {
  const componentNames = isComponentNameList(componentNamesOrRegistry) ?
    componentNamesOrRegistry :
    lumenComponentNames

  const customElementsRegistry = resolveCustomElementRegistry(
    isComponentNameList(componentNamesOrRegistry) ?
      suppliedRegistry :
      componentNamesOrRegistry
  )

  if (!customElementsRegistry) return

  for (const componentName of new Set(componentNames)) {
    const config = (
      elementConfigs as Readonly<Record<string, LumenElementConfig>>
    )[componentName]

    const element = (
      elementClasses as Readonly<Record<string, LumenElementConstructor>>
    )[componentName]

    if (!config || !element) {
      throw new TypeError(`Unknown Lumen component name: ${componentName}`)
    }

    if (!customElementsRegistry.get(config.tagName)) {
      customElementsRegistry.define(config.tagName, element)
    }
  }

  if (
    componentNames.includes('ToastViewport') &&
    !customElementsRegistry.get(lumenSonnerElementConfig.tagName)
  ) {
    customElementsRegistry.define(
      lumenSonnerElementConfig.tagName,
      LumenSonnerElementClass
    )
  }

  installToastController()

  installFormController()

  installRichTextEditorController()

  installScheduleController()

  installResizableController()

  installContextMenuController()

  installDateRangePickerController()

  installDatePickerController()

  installInputOtpController()

  installCalendarController()
}

export const installLumenControllers = (): void => {
  installDateRangePickerController()

  installDatePickerController()

  installInputOtpController()
}

export const lumenElementDefinitions = [
  ...elementDefinitions,
  [lumenSonnerElementConfig.tagName, LumenSonnerElementClass] as const
]

export const LumenAccordionElement = elementClasses.Accordion
export const LumenAlertElement = elementClasses.Alert
export const LumenAlertDialogElement = elementClasses.AlertDialog
export const LumenAgendaElement = elementClasses.Agenda
export const LumenAspectRatioElement = elementClasses.AspectRatio
export const LumenAttachmentElement = elementClasses.Attachment
export const LumenAutocompleteElement = elementClasses.Autocomplete
export const LumenAvatarElement = elementClasses.Avatar
export const LumenBadgeElement = elementClasses.Badge
export const LumenBarChartElement = elementClasses.BarChart
export const LumenBreadcrumbElement = elementClasses.Breadcrumb
export const LumenBubbleElement = elementClasses.Bubble
export const LumenButtonElement = elementClasses.Button
export const LumenButtonGroupElement = elementClasses.ButtonGroup
export const LumenCalendarElement = elementClasses.Calendar
export const LumenCardElement = elementClasses.Card
export const LumenCardContentElement = elementClasses.CardContent
export const LumenCardDescriptionElement = elementClasses.CardDescription
export const LumenCardFooterElement = elementClasses.CardFooter
export const LumenCardHeaderElement = elementClasses.CardHeader
export const LumenCardTitleElement = elementClasses.CardTitle
export const LumenCarouselElement = elementClasses.Carousel
export const LumenChartElement = elementClasses.Chart
export const LumenCheckboxElement = elementClasses.Checkbox
export const LumenCollapsibleElement = elementClasses.Collapsible
export const LumenComboChartElement = elementClasses.ComboChart
export const LumenCodeElement = elementClasses.Code
export const LumenCodeTabsElement = elementClasses.CodeTabs
export const LumenComboboxElement = elementClasses.Combobox
export const LumenCommandElement = elementClasses.Command
export const LumenContextNavigationElement = elementClasses.ContextNavigation
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
export const LumenErrorStateElement = elementClasses.ErrorState
export const LumenFieldElement = elementClasses.Field
export const LumenHoverCardElement = elementClasses.HoverCard
export const LumenIconElement = elementClasses.Icon
export const LumenHeatmapElement = elementClasses.Heatmap
export const LumenInputElement = elementClasses.Input
export const LumenInputGroupElement = elementClasses.InputGroup
export const LumenInputOTPElement = elementClasses.InputOTP
export const LumenNumberFieldElement = elementClasses.NumberField
export const LumenItemElement = elementClasses.Item
export const LumenKanbanBoardElement = elementClasses.KanbanBoard
export const LumenKanbanColumnElement = elementClasses.KanbanColumn
export const LumenKbdElement = elementClasses.Kbd
export const LumenLabelElement = elementClasses.Label
export const LumenLineChartElement = elementClasses.LineChart
export const LumenMarkerElement = elementClasses.Marker
export const LumenMenubarElement = elementClasses.Menubar
export const LumenMessageElement = elementClasses.Message
export const LumenMessageScrollerElement = elementClasses.MessageScroller
export const LumenNativeSelectElement = elementClasses.NativeSelect
export const LumenNavigationMenuElement = elementClasses.NavigationMenu
export const LumenPaginationElement = elementClasses.Pagination
export const LumenPhoneInputElement = elementClasses.PhoneInput
export const LumenPieChartElement = elementClasses.PieChart
export const LumenPopoverElement = elementClasses.Popover
export const LumenProgressElement = elementClasses.Progress
export const LumenRangeChartElement = elementClasses.RangeChart
export const LumenRadioGroupElement = elementClasses.RadioGroup
export const LumenResizableElement = elementClasses.Resizable
export const LumenRichTextEditorElement = elementClasses.RichTextEditor
export const LumenScrollAreaElement = elementClasses.ScrollArea
export const LumenScrollProgressElement = elementClasses.ScrollProgress
export const LumenScatterChartElement = elementClasses.ScatterChart
export const LumenScheduleElement = elementClasses.Schedule
export const LumenSearchFieldElement = elementClasses.SearchField
export const LumenSelectElement = elementClasses.Select
export const LumenSeparatorElement = elementClasses.Separator
export const LumenSheetElement = elementClasses.Sheet
export const LumenSidebarElement = elementClasses.Sidebar
export const LumenSkeletonElement = elementClasses.Skeleton
export const LumenSliderElement = elementClasses.Slider
/** @deprecated Use LumenToastViewportElement instead. */
export const LumenSonnerElement = LumenSonnerElementClass
export const LumenSparklineElement = elementClasses.Sparkline
export const LumenSpinnerElement = elementClasses.Spinner
export const LumenSwitchElement = elementClasses.Switch
export const LumenTableElement = elementClasses.Table
export const LumenTabsElement = elementClasses.Tabs
export const LumenTagGroupElement = elementClasses.TagGroup
export const LumenTextareaElement = elementClasses.Textarea
export const LumenThemeBuilderElement = elementClasses.ThemeBuilder
export const LumenTimeFieldElement = elementClasses.TimeField
export const LumenToastElement = elementClasses.Toast
export const LumenToastViewportElement = elementClasses.ToastViewport
export const LumenToggleElement = elementClasses.Toggle
export const LumenToggleGroupElement = elementClasses.ToggleGroup
export const LumenTooltipElement = elementClasses.Tooltip
export const LumenTreeElement = elementClasses.Tree
export const LumenTreeGridElement = elementClasses.TreeGrid
export const LumenTypographyElement = elementClasses.Typography
export const LumenVirtualListElement = elementClasses.VirtualList
export const LumenLanguageToggleElement = elementClasses.LanguageToggle
export const LumenParticlesElement = elementClasses.Particles
export const LumenAnimatedNumberElement = elementClasses.AnimatedNumber
export const LumenRevealGroupElement = elementClasses.RevealGroup
export const LumenScrollRevealElement = elementClasses.ScrollReveal
export const LumenStatElement = elementClasses.Stat
export const LumenStatDescriptionElement = elementClasses.StatDescription
export const LumenStatIconElement = elementClasses.StatIcon
export const LumenStatLabelElement = elementClasses.StatLabel
export const LumenStatTrendElement = elementClasses.StatTrend
export const LumenStatValueElement = elementClasses.StatValue
export const LumenMeterElement = elementClasses.Meter
export const LumenNoteElement = elementClasses.Note
export const LumenRatingElement = elementClasses.Rating
export const LumenTimelineElement = elementClasses.Timeline
export const LumenAnimatedLogoElement = elementClasses.AnimatedLogo
export const LumenAnimatedPortraitElement = elementClasses.AnimatedPortrait
export const LumenButtonLinkElement = elementClasses.ButtonLink
export const LumenCoverImageElement = elementClasses.CoverImage
export const LumenGradientDividerElement = elementClasses.GradientDivider
export const LumenGraphicElement = elementClasses.Graphic
export const LumenBackdropElement = elementClasses.Backdrop
export const LumenIllustrationElement = elementClasses.Illustration
export const LumenCheckboxGroupElement = elementClasses.CheckboxGroup
export const LumenContainerElement = elementClasses.Container
export const LumenCopyButtonElement = elementClasses.CopyButton
export const LumenErrorSummaryElement = elementClasses.ErrorSummary
export const LumenFieldErrorElement = elementClasses.FieldError
export const LumenFormElement = elementClasses.Form
export const LumenGridElement = elementClasses.Grid
export const LumenListBoxElement = elementClasses.ListBox
export const LumenPasswordFieldElement = elementClasses.PasswordField
export const LumenStackElement = elementClasses.Stack
export const LumenVisuallyHiddenElement = elementClasses.VisuallyHidden
export const LumenBackToTopElement = elementClasses.BackToTop
export const LumenCalloutElement = elementClasses.Callout
export const LumenEyebrowElement = elementClasses.Eyebrow
export const LumenFloatingBadgeElement = elementClasses.FloatingBadge
export const LumenFormattedDateElement = elementClasses.FormattedDate
export const LumenImageElement = elementClasses.Image
export const LumenLinkElement = elementClasses.Link
export const LumenPillElement = elementClasses.Pill
export const LumenProseElement = elementClasses.Prose
export const LumenSkipLinkElement = elementClasses.SkipLink
export const LumenThemeToggleElement = elementClasses.ThemeToggle
export const LumenStepperElement = elementClasses.Stepper
export const LumenFileUploadElement = elementClasses.FileUpload
export const LumenTourElement = elementClasses.Tour
export const LumenAnchorElement = elementClasses.Anchor
export const LumenSegmentedElement = elementClasses.Segmented
export const LumenToolbarElement = elementClasses.Toolbar
export const LumenDescriptionsElement = elementClasses.Descriptions
export const LumenPopconfirmElement = elementClasses.Popconfirm
export const LumenTransferElement = elementClasses.Transfer
export const LumenCascaderElement = elementClasses.Cascader
export const LumenTreeSelectElement = elementClasses.TreeSelect
export const LumenMentionsElement = elementClasses.Mentions
export const LumenQRCodeElement = elementClasses.QRCode
export const LumenWatermarkElement = elementClasses.Watermark
export const LumenAffixElement = elementClasses.Affix
export const LumenSpeedDialElement = elementClasses.SpeedDial

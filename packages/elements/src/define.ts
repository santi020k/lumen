import {
  type LumenComponentName,
  lumenComponentNames
} from '@santi020k/lumen-core'

type AttributeClassMap = Record<string, Record<string, string>>

interface LumenElementConfig {
  attributeClasses?: AttributeClassMap
  baseClassName: string
  defaults?: Record<string, string>
  role?: string
  tagName: string
}

const registry = new Set<string>()
const appliedClassNames = new WeakMap<HTMLElement, string[]>()

const mergeClassNames = (...classNames: (boolean | string | null | undefined)[]) =>
  classNames.filter(Boolean).flatMap(className => String(className).split(/\s+/).filter(Boolean))

const elementConfigs = {
  Accordion: { baseClassName: 'ui-accordion space-y-2', tagName: 'lumen-accordion' },
  Alert: {
    attributeClasses: {
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
  AlertDialog: { baseClassName: 'ui-dialog ui-alert-dialog', defaults: { 'data-ui-alert-dialog': '' }, tagName: 'lumen-alert-dialog' },
  AspectRatio: { baseClassName: 'ui-aspect-ratio', tagName: 'lumen-aspect-ratio' },
  Attachment: { baseClassName: 'ui-attachment', tagName: 'lumen-attachment' },
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
    attributeClasses: { from: { user: 'ui-bubble--user' } },
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
      disabled: { true: 'ui-button--disabled' }
    },
    baseClassName: 'ui-button',
    defaults: { role: 'button', size: 'default', tabindex: '0', variant: 'default' },
    role: 'button',
    tagName: 'lumen-button'
  },
  ButtonGroup: { baseClassName: 'ui-button-group', tagName: 'lumen-button-group' },
  Calendar: { baseClassName: 'ui-calendar', tagName: 'lumen-calendar' },
  Card: {
    attributeClasses: {
      variant: {
        interactive: 'ui-card--interactive',
        muted: 'ui-card--muted'
      }
    },
    baseClassName: 'ui-card',
    defaults: { variant: 'default' },
    tagName: 'lumen-card'
  },
  Carousel: { baseClassName: 'ui-carousel', defaults: { 'data-ui-carousel': '' }, tagName: 'lumen-carousel' },
  Chart: { baseClassName: 'ui-chart', tagName: 'lumen-chart' },
  Checkbox: { baseClassName: 'ui-checkbox', defaults: { type: 'checkbox' }, tagName: 'lumen-checkbox' },
  Collapsible: { baseClassName: 'ui-collapsible', defaults: { 'data-ui-collapsible': '' }, tagName: 'lumen-collapsible' },
  Combobox: { baseClassName: 'ui-combobox', defaults: { 'data-ui-combobox': '' }, tagName: 'lumen-combobox' },
  Command: { baseClassName: 'ui-command', defaults: { 'data-ui-command': '' }, tagName: 'lumen-command' },
  ContextMenu: { baseClassName: 'ui-menu', tagName: 'lumen-context-menu' },
  DataTable: { baseClassName: 'ui-data-table', tagName: 'lumen-data-table' },
  DatePicker: { baseClassName: 'ui-input ui-date-picker', defaults: { type: 'date' }, tagName: 'lumen-date-picker' },
  Dialog: { baseClassName: 'ui-dialog', defaults: { 'data-ui-dialog': '' }, tagName: 'lumen-dialog' },
  Direction: { baseClassName: 'ui-direction', defaults: { dir: 'ltr' }, tagName: 'lumen-direction' },
  Drawer: { baseClassName: 'ui-drawer', defaults: { 'data-ui-drawer': '' }, tagName: 'lumen-drawer' },
  DropdownMenu: { baseClassName: 'ui-menu', defaults: { 'data-ui-dropdown-menu': '' }, tagName: 'lumen-dropdown-menu' },
  Empty: { baseClassName: 'ui-empty', tagName: 'lumen-empty' },
  Field: { baseClassName: 'ui-field', tagName: 'lumen-field' },
  HoverCard: { baseClassName: 'ui-hover-card', defaults: { 'data-ui-hover-card': '' }, tagName: 'lumen-hover-card' },
  Input: { baseClassName: 'ui-input', defaults: { type: 'text' }, tagName: 'lumen-input' },
  InputGroup: { baseClassName: 'ui-input-group', tagName: 'lumen-input-group' },
  InputOTP: { baseClassName: 'ui-input-otp', defaults: { inputmode: 'numeric', maxlength: '6', pattern: '[0-9]*', type: 'text' }, tagName: 'lumen-input-otp' },
  Item: { baseClassName: 'ui-item', tagName: 'lumen-item' },
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
  Menubar: { baseClassName: 'ui-menubar', defaults: { 'data-ui-menubar': '' }, tagName: 'lumen-menubar' },
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
  MessageScroller: { baseClassName: 'ui-message-scroller', tagName: 'lumen-message-scroller' },
  NativeSelect: { baseClassName: 'ui-select', tagName: 'lumen-native-select' },
  NavigationMenu: { baseClassName: 'ui-navigation-menu', defaults: { 'data-ui-navigation-menu': '' }, tagName: 'lumen-navigation-menu' },
  Pagination: { baseClassName: 'ui-pagination', defaults: { 'aria-label': 'Pagination' }, tagName: 'lumen-pagination' },
  Popover: { baseClassName: 'ui-popover', defaults: { 'data-ui-popover': '' }, tagName: 'lumen-popover' },
  Progress: { baseClassName: 'ui-progress', defaults: { role: 'progressbar' }, tagName: 'lumen-progress' },
  RadioGroup: { baseClassName: 'ui-radio-group', defaults: { 'data-ui-radio-group': '' }, tagName: 'lumen-radio-group' },
  Resizable: { baseClassName: 'ui-resizable', tagName: 'lumen-resizable' },
  ScrollArea: { baseClassName: 'ui-scroll-area', tagName: 'lumen-scroll-area' },
  Select: { baseClassName: 'ui-select', tagName: 'lumen-select' },
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
  Sheet: { baseClassName: 'ui-sheet', defaults: { 'data-ui-sheet': '' }, tagName: 'lumen-sheet' },
  Sidebar: { baseClassName: 'ui-sidebar', tagName: 'lumen-sidebar' },
  Skeleton: { baseClassName: 'ui-skeleton', tagName: 'lumen-skeleton' },
  Slider: { baseClassName: 'ui-slider', defaults: { type: 'range' }, tagName: 'lumen-slider' },
  Sonner: { baseClassName: 'ui-sonner', defaults: { 'data-ui-sonner': '' }, tagName: 'lumen-sonner' },
  Spinner: { baseClassName: 'ui-spinner', defaults: { 'aria-hidden': 'true' }, tagName: 'lumen-spinner' },
  Switch: { baseClassName: 'ui-switch', defaults: { role: 'switch', type: 'checkbox' }, tagName: 'lumen-switch' },
  Table: { baseClassName: 'ui-table-wrap', tagName: 'lumen-table' },
  Tabs: { baseClassName: 'ui-tabs', defaults: { 'data-ui-tabs': '' }, tagName: 'lumen-tabs' },
  Textarea: { baseClassName: 'ui-textarea', defaults: { rows: '4' }, tagName: 'lumen-textarea' },
  Toast: {
    attributeClasses: {
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
  Toggle: {
    attributeClasses: { pressed: { true: 'ui-toggle--pressed' } },
    baseClassName: 'ui-toggle',
    defaults: { 'aria-pressed': 'false', 'data-ui-toggle': '', role: 'button', tabindex: '0' },
    role: 'button',
    tagName: 'lumen-toggle'
  },
  ToggleGroup: { baseClassName: 'ui-toggle-group', defaults: { 'data-ui-toggle-group': '' }, tagName: 'lumen-toggle-group' },
  Tooltip: { baseClassName: 'ui-tooltip', tagName: 'lumen-tooltip' },
  Typography: { baseClassName: 'ui-typography', tagName: 'lumen-typography' }
} as const satisfies Record<(typeof lumenComponentNames)[number], LumenElementConfig>

const observedAttributeNames = [
  'disabled',
  'from',
  'orientation',
  'pressed',
  'size',
  'variant'
]

export class LumenElement extends HTMLElement {
  static config: LumenElementConfig

  static get observedAttributes() {
    return observedAttributeNames
  }

  connectedCallback() {
    this.applyDefaults()

    this.applyClassNames()
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

const createLumenElementClass = (config: LumenElementConfig) =>
  class extends LumenElement {
    static override config = config
  }

const elementClasses = Object.fromEntries(
  lumenComponentNames.map(componentName => [componentName, createLumenElementClass(elementConfigs[componentName])])
) as Record<LumenComponentName, typeof LumenElement>

const elementDefinitions = lumenComponentNames.map(componentName => {
  const config = elementConfigs[componentName]

  return [config.tagName, elementClasses[componentName]] as const
})

export const defineLumenElements = (customElementsRegistry: CustomElementRegistry = customElements) => {
  for (const [name, element] of elementDefinitions) {
    if (!registry.has(name) && !customElementsRegistry.get(name)) {
      customElementsRegistry.define(name, element)

      registry.add(name)
    }
  }
}

export const lumenElementDefinitions = elementDefinitions

export const LumenAccordionElement = elementClasses.Accordion
export const LumenAlertElement = elementClasses.Alert
export const LumenAlertDialogElement = elementClasses.AlertDialog
export const LumenAspectRatioElement = elementClasses.AspectRatio
export const LumenAttachmentElement = elementClasses.Attachment
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
export const LumenComboboxElement = elementClasses.Combobox
export const LumenCommandElement = elementClasses.Command
export const LumenContextMenuElement = elementClasses.ContextMenu
export const LumenDataTableElement = elementClasses.DataTable
export const LumenDatePickerElement = elementClasses.DatePicker
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
export const LumenScrollAreaElement = elementClasses.ScrollArea
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
export const LumenTextareaElement = elementClasses.Textarea
export const LumenToastElement = elementClasses.Toast
export const LumenToggleElement = elementClasses.Toggle
export const LumenToggleGroupElement = elementClasses.ToggleGroup
export const LumenTooltipElement = elementClasses.Tooltip
export const LumenTypographyElement = elementClasses.Typography

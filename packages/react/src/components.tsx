/* eslint-disable @eslint-react/no-context-provider, @eslint-react/no-use-context -- Lumen React keeps React 18 peer support, so React 19 context shorthand and use() are not available. */
import {
  composeClassName,
  getLumenIcon,
  type LumenCodeToken,
  lumenCodeTokenClassNames,
  type LumenIconData,
  type LumenIconName,
  type LumenIconNode,
  tokenizeLumenCode
} from '@santi020k/lumen-core'

import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactNode
} from 'react'
import {
  Children,
  cloneElement,
  createContext,
  createElement,
  Fragment,
  isValidElement,
  useContext,
  useMemo,
  useState
} from 'react'

import {
  type DialogOptions,
  type DropdownMenuController,
  type DropdownMenuOptions,
  type PopoverController,
  type PopoverOptions,
  type ResizableDirection,
  type SelectOptions,
  type TabsController,
  type TabsOptions,
  type TooltipController,
  type TooltipOptions,
  useCalendar,
  useDialog,
  useDropdownMenu,
  useInputOTP,
  usePopover,
  useResizable,
  useSelect,
  useTabs,
  useTooltip
} from './hooks.js'

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning'

type BadgeVariant = AlertVariant | 'outline' | 'secondary'

type ButtonSize = 'default' | 'icon' | 'lg' | 'sm'

type ButtonVariant = 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'

type CardVariant = 'default' | 'glass' | 'interactive' | 'muted'

type CodeTheme = 'auto' | 'lumen' | 'santi020k'

type CodeVariant = 'block' | 'inline'

type IconSize = 'default' | 'lg' | 'sm' | 'xl'

export type DataTableCell =
  | boolean
  | null
  | number
  | string
  | undefined
  | {
    label?: boolean | null | number | string
    sortValue?: boolean | null | number | string
    value?: boolean | null | number | string
  }

export interface DataTableColumn {
  header?: string
  key: string
  label?: string
  sort?: 'number' | 'string'
  sortable?: boolean
}

export type DataTableRow = Record<string, DataTableCell> & {
  id?: number | string
  rowValue?: number | string
  value?: number | string
}

type MessageFrom = 'assistant' | 'user'

type MarkerVariant = 'danger' | 'default' | 'success' | 'warning'

type Orientation = 'horizontal' | 'vertical'

type SurfaceVariant = 'default' | 'glass'

type EventHandler<Event> = (event: Event) => void

export type LumenGlassProp = boolean | 'subtle' | 'strong'

interface SurfaceProps {
  'data-surface'?: SurfaceVariant
  glass?: LumenGlassProp
  surface?: SurfaceVariant
}

export interface Option {
  disabled?: boolean
  label: string
  value: string
}

type SelectOption = Option | string

const emptyOptions: SelectOption[] = []
const emptyStringOptions: string[] = []
const emptyDataTableColumns: DataTableColumn[] = []
const emptyDataTableRows: DataTableRow[] = []

const variantClass = (base: string, variant: string, defaultVariant = 'default') =>
  variant === defaultVariant ? false : `${base}--${variant}`

const iconSizeClass = (size: IconSize) => size === 'default' ? undefined : `ui-icon--${size}`

const reactSvgAttributeNames: Record<string, string> = {
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-width': 'strokeWidth',
  tabindex: 'tabIndex'
}

const toReactSvgAttributes = (attributes: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(attributes).map(([name, value]) => [reactSvgAttributeNames[name] ?? name, value])
  )

const renderIconNode = ([tagName, attributes, children]: LumenIconNode, index: number): ReactNode =>
  createElement(
    tagName,
    {
      ...toReactSvgAttributes(attributes),
      key: attributes.key ?? index
    },
    children?.map(renderIconNode)
  )

interface IconAccessibilityOptions {
  ariaHidden: boolean | 'false' | 'true' | undefined
  ariaLabel: string | undefined
  decorative: boolean | undefined
  label: string | undefined
  role: string | undefined
}

const getIconAccessibility = ({
  ariaHidden,
  ariaLabel,
  decorative,
  label,
  role
}: IconAccessibilityOptions) => {
  const accessibleLabel = label ?? ariaLabel
  const isDecorative = decorative ?? !accessibleLabel

  if (isDecorative) {
    return {
      ariaHidden: ariaHidden ?? true,
      ariaLabel: undefined,
      role
    }
  }

  return {
    ariaHidden,
    ariaLabel: accessibleLabel,
    role: role ?? 'img'
  }
}

const renderIconSvg = (icon: LumenIconData, className: string) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    focusable="false"
    height="1em"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    {icon.node.map(renderIconNode)}
  </svg>
)

const renderNamedIcon = (icon: LumenIconData) => renderIconSvg(icon, `ui-icon__svg lucide-${icon.name}`)

const renderLucideIcon = (name: string, className: string) => {
  const icon = getLumenIcon(name)

  return icon ? renderIconSvg(icon, className) : null
}

const resolveSurface = (surface: SurfaceVariant, glass?: LumenGlassProp): SurfaceVariant =>
  glass || surface === 'glass' ? 'glass' : surface

const glassIntensityClass = (glass?: LumenGlassProp) =>
  glass === 'subtle' ? 'ui-glass-subtle' : glass === 'strong' && 'ui-glass-strong'

const glassSurfaceClass = (base: string, surface: SurfaceVariant, glass?: LumenGlassProp) =>
  resolveSurface(surface, glass) === 'glass' && composeClassName(`${base}--glass`, glassIntensityClass(glass))

const glassClass = (base: string, glass?: LumenGlassProp) =>
  Boolean(glass) && composeClassName(`${base}--glass`, glassIntensityClass(glass))

const normalizeOption = (option: SelectOption): Option =>
  typeof option === 'string' ? { label: option, value: option } : option

const isDataTableCellObject = (
  cell: DataTableCell
): cell is Exclude<DataTableCell, boolean | null | number | string | undefined> =>
  typeof cell === 'object' && cell !== null

const formatDataTableCell = (cell: DataTableCell): string => {
  const value = isDataTableCellObject(cell) ? cell.label ?? cell.value : cell

  return value === undefined || value === null ? '' : String(value)
}

const getDataTableSortValue = (cell: DataTableCell): string | undefined => {
  if (!isDataTableCellObject(cell) || cell.sortValue === undefined || cell.sortValue === null) return undefined

  return String(cell.sortValue)
}

const getDataTableRowValue = (row: DataTableRow, index: number): string =>
  String(row.rowValue ?? row.value ?? row.id ?? index)

const toInputValue = (value: ComponentPropsWithoutRef<'input'>['value']): string | undefined => {
  if (value === undefined) return undefined

  return String(value)
}

const composeHandlers = <Event,>(
  userHandler: EventHandler<Event> | undefined,
  lumenHandler: EventHandler<Event> | undefined
) => (event: Event) => {
  userHandler?.(event)

  lumenHandler?.(event)
}

type PrimitiveProps = ComponentPropsWithoutRef<'div'> & {
  [key: string]: unknown
  as?: ElementType
}

const Primitive = ({
  as,
  className,
  uiClassName,
  ...props
}: PrimitiveProps & { uiClassName: string }) => {
  const Tag = as ?? 'div'
  const safeClassName = typeof className === 'string' ? className : undefined

  return <Tag className={composeClassName(uiClassName, safeClassName)} {...props} />
}

const DropdownMenuContext = createContext<DropdownMenuController | null>(null)
const PopoverContext = createContext<PopoverController | null>(null)
const TabsContext = createContext<TabsController | null>(null)
const TooltipContext = createContext<TooltipController | null>(null)

const requireContext = <Value,>(context: Value | null, componentName: string): Value => {
  if (!context) {
    throw new Error(`${componentName} must be used inside its matching Lumen root component.`)
  }

  return context
}

export type AccordionProps = ComponentPropsWithoutRef<'div'>
export const Accordion = ({ className, ...props }: AccordionProps) => (
  <div className={composeClassName('ui-accordion', className)} {...props} />
)

export interface AlertProps extends ComponentPropsWithoutRef<'aside'> {
  glass?: LumenGlassProp
  variant?: AlertVariant
}

export const Alert = ({ className, glass = false, variant = 'default', ...props }: AlertProps) => (
  <aside
    className={composeClassName('ui-alert', variantClass('ui-alert', variant), glassClass('ui-alert', glass), className)}
    data-variant={variant}
    {...props}
  />
)

export type AlertDialogProps = Omit<ComponentPropsWithoutRef<'dialog'>, 'open'> & SurfaceProps & Omit<DialogOptions, 'id'>

export const AlertDialog = ({
  className,
  defaultOpen,
  glass = false,
  onClick,
  onClose,
  onOpenChange,
  open,
  surface = 'default',
  ...props
}: AlertDialogProps) => {
  const dialog = useDialog({ alert: true, defaultOpen, onOpenChange, open })

  return (
    <dialog
      {...dialog.dialogProps}
      {...props}
      className={composeClassName(
        'ui-dialog ui-alert-dialog',
        glassSurfaceClass('ui-dialog', surface, glass),
        className
      )}
      data-surface={resolveSurface(surface, glass)}
      onClick={composeHandlers(onClick, dialog.dialogProps.onClick)}
      onClose={composeHandlers(onClose, dialog.dialogProps.onClose)}
    />
  )
}

export interface AgendaProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const Agenda = ({ className, glass = false, ...props }: AgendaProps) => (
  <section className={composeClassName('ui-agenda', glassClass('ui-agenda', glass), className)} {...props} />
)

export interface AspectRatioProps extends ComponentPropsWithoutRef<'div'> {
  ratio?: string
}

export const AspectRatio = ({ className, ratio = '16 / 9', style, ...props }: AspectRatioProps) => (
  <div
    className={composeClassName('ui-aspect-ratio', className)}
    style={{ aspectRatio: ratio, ...style }}
    {...props}
  />
)

export interface AttachmentProps extends ComponentPropsWithoutRef<'article'> {
  glass?: LumenGlassProp
  href?: string
}

export interface AutocompleteProps extends ComponentPropsWithoutRef<'input'> {
  list: string
}

export const Autocomplete = ({ className, type = 'search', ...props }: AutocompleteProps) => (
  <input
    aria-autocomplete="list"
    className={composeClassName('ui-input ui-autocomplete', className)}
    role="combobox"
    type={type}
    {...props}
  />
)

export const Attachment = ({ className, glass = false, href, ...props }: AttachmentProps) => {
  const nextClassName = composeClassName('ui-attachment', glassClass('ui-attachment', glass), className)

  return href
    ? <a className={nextClassName} href={href} {...props} />
    : <article className={nextClassName} {...props} />
}

export interface AvatarProps extends ComponentPropsWithoutRef<'span'> {
  alt?: string
  fallback?: ReactNode
  src?: string
}

export const Avatar = ({ alt = '', children, className, fallback, src, ...props }: AvatarProps) => (
  <span className={composeClassName('ui-avatar', className)} {...props}>
    {src ? <img alt={alt} src={src} /> : <span>{fallback}</span>}
    {children}
  </span>
)

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: BadgeVariant
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => (
  <span
    className={composeClassName('ui-badge', `ui-badge--${variant}`, className)}
    data-variant={variant}
    {...props}
  />
)

export type BreadcrumbProps = ComponentPropsWithoutRef<'nav'>
export const Breadcrumb = ({ 'aria-label': ariaLabel = 'Breadcrumb', className, ...props }: BreadcrumbProps) => (
  <nav aria-label={ariaLabel} className={composeClassName('ui-breadcrumb', className)} {...props} />
)

export interface BubbleProps extends ComponentPropsWithoutRef<'article'> {
  from?: MessageFrom
  glass?: LumenGlassProp
}

export const Bubble = ({ className, from = 'assistant', glass = false, ...props }: BubbleProps) => (
  <article
    className={composeClassName('ui-bubble', from === 'user' && 'ui-bubble--user', glassClass('ui-bubble', glass), className)}
    data-from={from}
    {...props}
  />
)

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  loading?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

export const Button = ({
  children,
  className,
  disabled,
  loading = false,
  size = 'default',
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps) => (
  <button
    aria-busy={loading || undefined}
    className={composeClassName(
      'ui-button',
      `ui-button--${variant}`,
      size === 'default' ? 'ui-button--default-size' : `ui-button--${size}`,
      disabled && 'ui-button--disabled',
      loading && 'ui-button--loading',
      className
    )}
    disabled={disabled}
    type={type}
    {...props}
  >
    {loading && <span aria-hidden="true" className="ui-spinner" />}
    {children}
  </button>
)

export type ButtonGroupProps = ComponentPropsWithoutRef<'div'>
export const ButtonGroup = ({ className, ...props }: ButtonGroupProps) => (
  <div className={composeClassName('ui-button-group', className)} {...props} />
)

export interface CalendarProps extends ComponentPropsWithoutRef<'div'> {
  defaultValue?: string | undefined
  disabled?: boolean | undefined
  glass?: LumenGlassProp
  locale?: string | undefined
  max?: string | undefined
  min?: string | undefined
  month?: string | undefined
  name?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  value?: string | undefined
}
export const Calendar = ({
  className,
  defaultValue,
  disabled = false,
  glass = false,
  locale,
  max,
  min,
  month,
  name,
  onValueChange,
  value,
  ...props
}: CalendarProps) => {
  const calendar = useCalendar({
    defaultValue,
    disabled,
    locale,
    max,
    min,
    month,
    name,
    onValueChange,
    value
  })

  return (
    <div
      {...props}
      {...calendar.rootProps}
      className={composeClassName(calendar.rootProps.className, glassClass('ui-calendar', glass), className)}
      data-ui-glass-track={glass ? true : undefined}
    >
      <input {...calendar.inputProps} />
      <div className="ui-calendar__header">
        <button {...calendar.previousProps} type="button">
          <span aria-hidden="true">&lsaquo;</span>
        </button>
        <strong {...calendar.labelProps}>{calendar.label}</strong>
        <button {...calendar.nextProps} type="button">
          <span aria-hidden="true">&rsaquo;</span>
        </button>
      </div>
      <table {...calendar.gridProps}>
        <thead>
          <tr role="row">
            {calendar.weekdays.map(weekday => (
              <th key={weekday} role="columnheader" scope="col">{weekday}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendar.weeks.map(week => (
            <tr key={week[0]?.date ?? 'week'} role="row">
              {week.map(day => (
                <td key={day.date} {...calendar.getDayProps(day)}>
                  {day.day}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export type CardProps<T extends ElementType = 'div'> = PrimitiveProps & {
  'data-variant'?: CardVariant
  as?: T
  glass?: LumenGlassProp
  variant?: CardVariant
}

export const Card = <T extends ElementType = 'div'>({
  as,
  className,
  glass = false,
  variant = 'default',
  ...props
}: CardProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    className={composeClassName(
      variant === 'muted' && 'ui-card--muted',
      variant === 'interactive' && 'ui-card--interactive',
      (glass || variant === 'glass') && composeClassName('ui-card--glass', glassIntensityClass(glass)),
      className
    )}
    data-variant={variant}
    {...props}
    uiClassName="ui-card"
  />
)

export interface CarouselProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const Carousel = ({ className, glass = false, ...props }: CarouselProps) => (
  <section className={composeClassName('ui-carousel', glassClass('ui-carousel', glass), className)} data-ui-carousel {...props} />
)

export interface ChartProps extends ComponentPropsWithoutRef<'figure'> {
  glass?: LumenGlassProp
}
export const Chart = ({ className, glass = false, ...props }: ChartProps) => (
  <figure className={composeClassName('ui-chart', glassClass('ui-chart', glass), className)} {...props} />
)

export type CheckboxProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'>
export const Checkbox = ({ className, ...props }: CheckboxProps) => (
  <input className={composeClassName('ui-checkbox', className)} type="checkbox" {...props} />
)

export type CollapsibleProps = ComponentPropsWithoutRef<'details'>
export const Collapsible = ({ className, ...props }: CollapsibleProps) => (
  <details className={composeClassName('ui-collapsible', className)} data-ui-collapsible {...props} />
)

export interface CodeProps extends ComponentPropsWithoutRef<'figure'> {
  code?: string
  copy?: boolean
  highlighted?: boolean
  label?: ReactNode
  language?: string
  theme?: CodeTheme
  variant?: CodeVariant
}

const renderCodeToken = (token: LumenCodeToken) => {
  if (!token.kind) return token.value

  return (
    <span className={lumenCodeTokenClassNames[token.kind]} key={`${token.start}-${token.kind}`}>
      {token.value}
    </span>
  )
}

const renderCodeChildren = (code: string | undefined, children: ReactNode, language?: string) =>
  code === undefined ? children : tokenizeLumenCode(code, language).map(renderCodeToken)

const renderCodeCopyButton = () => (
  <button
    aria-label="Copy code to clipboard"
    className="ui-code__copy"
    data-ui-code-copy
    type="button"
  >
    {renderLucideIcon('copy', 'ui-code__copy-icon')}
    {renderLucideIcon('check', 'ui-code__check-icon')}
  </button>
)

interface CodeHeaderOptions {
  copy: boolean
  label: ReactNode
  language: string | undefined
}

const renderCodeHeader = ({
  copy,
  label,
  language
}: CodeHeaderOptions) => {
  if (!copy && !label && !language) return null

  return (
    <figcaption className="ui-code__header">
      <span aria-hidden="true" className="ui-code__dots">
        <span className="ui-code__dot ui-code__dot--red" />
        <span className="ui-code__dot ui-code__dot--yellow" />
        <span className="ui-code__dot ui-code__dot--green" />
      </span>
      <span className="ui-code__meta">
        {language && <span className="ui-code__language">{language}</span>}
        {label && <span className="ui-code__label">{label}</span>}
      </span>
      {copy && renderCodeCopyButton()}
    </figcaption>
  )
}

export const Code = ({
  children,
  className,
  code,
  copy = false,
  highlighted = false,
  label,
  language,
  theme = 'auto',
  variant = 'inline',
  ...props
}: CodeProps) => {
  const codeChildren = renderCodeChildren(code, children, language)

  if (variant === 'block') {
    return (
      <figure
        className={composeClassName('ui-code ui-code--block', className)}
        data-code-theme={theme}
        data-language={language}
        data-ui-code
        {...props}
      >
        {renderCodeHeader({ copy, label, language })}
        {highlighted ? children : <pre><code>{codeChildren}</code></pre>}
      </figure>
    )
  }

  return (
    <code
      className={composeClassName('ui-code ui-code--inline', className)}
      data-code-theme={theme}
      data-language={language}
      {...props}
    >
      {code ?? children}
    </code>
  )
}

export interface ComboboxProps extends ComponentPropsWithoutRef<'input'> {
  label?: ReactNode
  list: string
  options?: string[]
  wrapperClassName?: string
}

export const Combobox = ({
  className,
  defaultValue,
  id,
  label,
  list,
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  options = emptyStringOptions,
  type = 'text',
  value: valueProp,
  wrapperClassName,
  ...props
}: ComboboxProps) => {
  const inputId = id ?? `${list}-input`
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(() => String(defaultValue ?? ''))
  const renderedValue = valueProp ?? value
  const query = String(renderedValue).trim().toLowerCase()

  const visibleOptions = useMemo(
    () => options.filter(option => !query || option.toLowerCase().includes(query)),
    [options, query]
  )

  const selectOption = (option: string) => {
    if (valueProp === undefined) {
      setValue(option)
    }

    setOpen(false)
  }

  return (
    <div
      className={composeClassName('ui-combobox', wrapperClassName)}
      data-ui-combobox
      onBlur={event => {
        const nextTarget = event.relatedTarget

        if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
          setOpen(false)
        }
      }}
    >
      {label && <label className="ui-label" htmlFor={inputId}>{label}</label>}
      <input
        aria-autocomplete="list"
        aria-controls={list}
        aria-expanded={open}
        className={composeClassName('ui-input', className)}
        id={inputId}
        role="combobox"
        type={type}
        value={renderedValue}
        onBlur={onBlur}
        onChange={event => {
          if (valueProp === undefined) {
            setValue(event.currentTarget.value)
          }

          setOpen(true)

          onChange?.(event)
        }}
        onFocus={event => {
          setOpen(true)

          onFocus?.(event)
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            setOpen(false)
          }

          if (event.key === 'Enter' && visibleOptions[0]) {
            event.preventDefault()

            selectOption(visibleOptions[0])
          }

          onKeyDown?.(event)
        }}
        {...props}
      />
      <div className="ui-combobox__list" hidden={!open} id={list} role="listbox">
        {visibleOptions.map(option => (
          <button
            data-ui-combobox-option
            data-value={option}
            key={option}
            role="option"
            type="button"
            onClick={() => { selectOption(option); }}
            onMouseDown={event => { event.preventDefault(); }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface CommandProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const Command = ({ className, glass = false, ...props }: CommandProps) => (
  <div className={composeClassName('ui-command', glassClass('ui-command', glass), className)} data-ui-command {...props} />
)

export interface ContextMenuProps extends ComponentPropsWithoutRef<'menu'>, SurfaceProps {}

export const ContextMenu = ({ className, glass = false, surface = 'default', ...props }: ContextMenuProps) => (
  <menu
    className={composeClassName('ui-menu', glassSurfaceClass('ui-menu', surface, glass), className)}
    data-surface={resolveSurface(surface, glass)}
    data-ui-context-menu
    role={props.role ?? 'menu'}
    {...props}
  />
)

export type ColorPickerProps = ComponentPropsWithoutRef<'input'>
export const ColorPicker = ({ className, type = 'color', ...props }: ColorPickerProps) => (
  <input className={composeClassName('ui-color-picker', className)} type={type} {...props} />
)

export interface DataTableProps extends ComponentPropsWithoutRef<'div'> {
  columns?: DataTableColumn[]
  glass?: LumenGlassProp
  name?: string
  rows?: DataTableRow[]
  selectable?: boolean
}
export const DataTable = ({
  children,
  className,
  columns = emptyDataTableColumns,
  glass = false,
  name,
  rows = emptyDataTableRows,
  selectable = false,
  ...props
}: DataTableProps) => (
  <div
    className={composeClassName('ui-data-table', glassClass('ui-data-table', glass), className)}
    data-ui-datatable
    data-ui-datatable-name={name}
    data-ui-datatable-selectable={selectable ? 'true' : undefined}
    data-ui-glass-track={glass ? true : undefined}
    {...props}
  >
    {columns.length > 0
      ? (
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th
                  data-ui-datatable-sort-type={column.sort}
                  data-ui-datatable-sortable={column.sortable ? 'true' : undefined}
                  key={column.key}
                  scope="col"
                >
                  {column.header ?? column.label ?? column.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr data-ui-datatable-row data-value={getDataTableRowValue(row, rowIndex)} key={getDataTableRowValue(row, rowIndex)}>
                {columns.map(column => (
                  <td data-sort-value={getDataTableSortValue(row[column.key])} key={column.key}>
                    {formatDataTableCell(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
      : children}
  </div>
)

export type DatePickerProps = ComponentPropsWithoutRef<'input'>
export const DatePicker = ({ className, type = 'date', ...props }: DatePickerProps) => (
  <input className={composeClassName('ui-input ui-date-picker', className)} type={type} {...props} />
)

export type DateRangePickerProps = ComponentPropsWithoutRef<'div'>
export const DateRangePicker = ({ className, ...props }: DateRangePickerProps) => (
  <div className={composeClassName('ui-date-range-picker', className)} data-ui-date-range-picker {...props} />
)

export type DialogProps = Omit<ComponentPropsWithoutRef<'dialog'>, 'open'> & SurfaceProps & Omit<DialogOptions, 'id'>

export const Dialog = ({
  className,
  defaultOpen,
  glass = false,
  onClick,
  onClose,
  onOpenChange,
  open,
  surface = 'default',
  ...props
}: DialogProps) => {
  const dialog = useDialog({ defaultOpen, onOpenChange, open })

  return (
    <dialog
      {...dialog.dialogProps}
      {...props}
      className={composeClassName('ui-dialog', glassSurfaceClass('ui-dialog', surface, glass), className)}
      data-surface={resolveSurface(surface, glass)}
      onClick={composeHandlers(onClick, dialog.dialogProps.onClick)}
      onClose={composeHandlers(onClose, dialog.dialogProps.onClose)}
    />
  )
}

export type DirectionProps = ComponentPropsWithoutRef<'div'>
export const Direction = ({ className, dir = 'ltr', ...props }: DirectionProps) => (
  <div className={composeClassName('ui-direction', className)} dir={dir} {...props} />
)

export interface DrawerProps extends ComponentPropsWithoutRef<'dialog'>, SurfaceProps {}

export const Drawer = ({ className, glass = false, surface = 'default', ...props }: DrawerProps) => (
  <dialog
    className={composeClassName('ui-drawer', glassSurfaceClass('ui-drawer', surface, glass), className)}
    data-surface={resolveSurface(surface, glass)}
    data-ui-drawer
    {...props}
  />
)

export type DropdownMenuProps = ComponentPropsWithoutRef<'menu'> & SurfaceProps & Omit<DropdownMenuOptions, 'id'>

export const DropdownMenu = ({
  children,
  className,
  defaultOpen,
  glass = false,
  onOpenChange,
  open,
  surface = 'default',
  ...props
}: DropdownMenuProps) => {
  const menu = useDropdownMenu({ defaultOpen, onOpenChange, open })

  return (
    <DropdownMenuContext.Provider value={menu}>
      <menu
        {...menu.rootProps}
        {...props}
        className={composeClassName('ui-menu', glassSurfaceClass('ui-menu', surface, glass), className)}
        data-surface={resolveSurface(surface, glass)}
        data-ui-dropdown-menu
      >
        {children}
      </menu>
    </DropdownMenuContext.Provider>
  )
}

export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<'button'>
export const DropdownMenuTrigger = ({ onClick, onKeyDown, ...props }: DropdownMenuTriggerProps) => {
  const menu = requireContext(useContext(DropdownMenuContext), 'DropdownMenuTrigger')

  return (
    <button
      {...menu.triggerProps}
      {...props}
      onClick={composeHandlers(onClick, menu.triggerProps.onClick)}
      onKeyDown={composeHandlers(onKeyDown, menu.triggerProps.onKeyDown)}
      type={props.type ?? 'button'}
    />
  )
}

export type DropdownMenuContentProps = ComponentPropsWithoutRef<'div'>
export const DropdownMenuContent = ({ className, onKeyDown, ...props }: DropdownMenuContentProps) => {
  const menu = requireContext(useContext(DropdownMenuContext), 'DropdownMenuContent')

  return (
    <div
      {...menu.panelProps}
      {...props}
      className={composeClassName('ui-menu__content', className)}
      onKeyDown={composeHandlers(onKeyDown, menu.panelProps.onKeyDown)}
      role={props.role ?? 'menu'}
    />
  )
}

export interface EmptyProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const Empty = ({ className, glass = false, ...props }: EmptyProps) => (
  <section className={composeClassName('ui-empty', glassClass('ui-empty', glass), className)} {...props} />
)

export interface FieldProps extends ComponentPropsWithoutRef<'div'> {
  controlId?: string
  describedBy?: string
  glass?: LumenGlassProp
}
export const Field = ({
  'aria-describedby': ariaDescribedby,
  className,
  controlId,
  describedBy,
  glass = false,
  ...props
}: FieldProps) => {
  const fieldDescribedBy = [ariaDescribedby, describedBy].filter(Boolean).join(' ') || undefined

  return (
    <div
      aria-describedby={ariaDescribedby}
      className={composeClassName('ui-field', glassClass('ui-field', glass), className)}
      data-ui-field
      data-ui-field-control={controlId}
      data-ui-field-describedby={fieldDescribedBy}
      {...props}
    />
  )
}

export interface HoverCardProps extends ComponentPropsWithoutRef<'aside'>, SurfaceProps {}

export const HoverCard = ({ className, glass = false, surface = 'default', ...props }: HoverCardProps) => (
  <aside
    className={composeClassName('ui-hover-card', glassSurfaceClass('ui-hover-card', surface, glass), className)}
    data-surface={resolveSurface(surface, glass)}
    data-ui-hover-card
    {...props}
  />
)

export interface IconProps extends ComponentPropsWithoutRef<'span'> {
  decorative?: boolean
  label?: string
  name?: LumenIconName
  size?: IconSize
}

export const Icon = ({
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  children,
  className,
  decorative,
  label,
  name,
  role,
  size = 'default',
  ...props
}: IconProps) => {
  const icon = name ? getLumenIcon(name) : undefined
  const accessibility = getIconAccessibility({ ariaHidden, ariaLabel, decorative, label, role })

  return (
    <span
      aria-hidden={accessibility.ariaHidden}
      aria-label={accessibility.ariaLabel}
      className={composeClassName('ui-icon', iconSizeClass(size), className)}
      role={accessibility.role}
      {...props}
    >
      {icon ? renderNamedIcon(icon) : children}
    </span>
  )
}

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  size?: 'default' | 'lg' | 'sm'
}
export const Input = ({ className, size = 'default', type = 'text', ...props }: InputProps) => (
  <input
    className={composeClassName(
      'ui-input',
      size === 'sm' && 'ui-input--sm',
      size === 'lg' && 'ui-input--lg',
      className
    )}
    type={type}
    {...props}
  />
)

export type InputGroupProps = ComponentPropsWithoutRef<'div'>
export const InputGroup = ({ className, ...props }: InputGroupProps) => (
  <div className={composeClassName('ui-input-group', className)} {...props} />
)

export interface InputOTPProps extends Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'maxLength' | 'type'> {
  className?: string | undefined
  inputClassName?: string | undefined
  length?: number
  maxLength?: number
}

export const InputOTP = ({
  'aria-invalid': ariaInvalid,
  className,
  defaultValue,
  disabled = false,
  inputClassName,
  inputMode = 'numeric',
  length = 6,
  maxLength = length,
  pattern = '[0-9]*',
  value,
  ...props
}: InputOTPProps) => {
  const otp = useInputOTP({
    defaultValue: toInputValue(defaultValue),
    disabled,
    inputMode,
    invalid: ariaInvalid === true || ariaInvalid === 'true',
    length,
    pattern,
    value: toInputValue(value)
  })

  return (
    <div
      {...otp.rootProps}
      className={composeClassName(otp.rootProps.className, className)}
    >
      <input
        {...otp.getInputProps({
          ...props,
          'aria-invalid': ariaInvalid,
          className: inputClassName,
          disabled,
          inputMode,
          maxLength,
          pattern
        })}
      />
      <div {...otp.segmentsProps}>
        {otp.segmentIndexes.map(index => (
          <button key={index} {...otp.getSegmentProps(index)} type="button">
            <span data-ui-input-otp-char>{otp.getSegmentChar(index)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export type NumberFieldProps = ComponentPropsWithoutRef<'input'>
export const NumberField = ({ className, type = 'number', ...props }: NumberFieldProps) => (
  <input className={composeClassName('ui-input ui-number-field', className)} type={type} {...props} />
)

export interface ItemProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const Item = ({ className, glass = false, ...props }: ItemProps) => (
  <div className={composeClassName('ui-item', glassClass('ui-item', glass), className)} {...props} />
)

export type KbdProps = ComponentPropsWithoutRef<'kbd'>
export const Kbd = ({ className, ...props }: KbdProps) => (
  <kbd className={composeClassName('ui-kbd', className)} {...props} />
)

export type LabelProps = ComponentPropsWithoutRef<'label'>
export const Label = ({ className, ...props }: LabelProps) => (
  <label className={composeClassName('ui-label', className)} {...props} />
)

export interface MarkerProps extends ComponentPropsWithoutRef<'span'> {
  variant?: MarkerVariant
}

export const Marker = ({ className, variant = 'default', ...props }: MarkerProps) => (
  <span
    className={composeClassName('ui-marker', variantClass('ui-marker', variant), className)}
    data-variant={variant}
    {...props}
  />
)

export interface MenubarProps extends ComponentPropsWithoutRef<'nav'>, SurfaceProps {}

export const Menubar = ({ className, glass = false, surface = 'default', ...props }: MenubarProps) => (
  <nav
    className={composeClassName('ui-menubar', glassSurfaceClass('ui-menubar', surface, glass), className)}
    data-surface={resolveSurface(surface, glass)}
    data-ui-menubar
    {...props}
  />
)

export interface MessageProps extends ComponentPropsWithoutRef<'article'> {
  from?: MessageFrom
}

export const Message = ({ className, from = 'assistant', ...props }: MessageProps) => (
  <article
    className={composeClassName('ui-message', `ui-message--${from}`, className)}
    data-from={from}
    {...props}
  />
)

export interface MessageScrollerProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const MessageScroller = ({ className, glass = false, ...props }: MessageScrollerProps) => (
  <div className={composeClassName('ui-message-scroller', glassClass('ui-message-scroller', glass), className)} {...props} />
)

export interface NativeSelectProps extends ComponentPropsWithoutRef<'select'> {
  options?: SelectOption[]
  placeholder?: string
}

export const NativeSelect = ({
  children,
  className,
  defaultValue,
  options = emptyOptions,
  placeholder,
  value,
  ...props
}: NativeSelectProps) => {
  const placeholderDefaultValue = placeholder && value === undefined && defaultValue === undefined ? '' : undefined

  return (
    <select
      className={composeClassName('ui-select', className)}
      defaultValue={defaultValue ?? placeholderDefaultValue}
      value={value}
      {...props}
    >
      {placeholder && <option disabled value="">{placeholder}</option>}
      {children}
      {options.map(normalizeOption).map(option => (
        <option disabled={option.disabled} key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export interface PhoneInputProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue'> {
  countries?: SelectOption[]
  countryLabel?: string
  countryName?: string
  defaultCountryValue?: string
  defaultValue?: string
  name?: string
  placeholder?: string
  size?: 'default' | 'lg' | 'sm'
}

const phoneInputSizeModifiers = (size: 'default' | 'lg' | 'sm') => {
  if (size === 'sm') {
    return { inputClass: 'ui-input--sm', selectClass: 'ui-select--sm' }
  }

  if (size === 'lg') {
    return { inputClass: 'ui-input--lg', selectClass: 'ui-select--lg' }
  }

  return { inputClass: undefined, selectClass: undefined }
}

export const PhoneInput = ({
  className,
  countries = emptyOptions,
  countryLabel = 'Country code',
  countryName = 'country',
  defaultCountryValue,
  defaultValue,
  name = 'phone',
  placeholder = 'Phone number',
  size = 'default',
  ...props
}: PhoneInputProps) => {
  const { selectClass, inputClass } = phoneInputSizeModifiers(size)

  return (
    <div className={composeClassName('ui-phone-input ui-input-group', className)} {...props}>
      <select
        aria-label={countryLabel}
        className={composeClassName('ui-select ui-phone-input__country', selectClass)}
        defaultValue={defaultCountryValue}
        name={countryName}
      >
        {countries.map(normalizeOption).map(option => (
          <option disabled={option.disabled} key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        autoComplete="tel"
        className={composeClassName('ui-input ui-phone-input__number', inputClass)}
        defaultValue={defaultValue}
        inputMode="tel"
        name={name}
        placeholder={placeholder}
        type="tel"
      />
    </div>
  )
}

export interface NavigationMenuProps extends ComponentPropsWithoutRef<'nav'>, SurfaceProps {}

export const NavigationMenu = ({ className, glass = false, surface = 'default', ...props }: NavigationMenuProps) => (
  <nav
    className={composeClassName(
      'ui-navigation-menu',
      glassSurfaceClass('ui-navigation-menu', surface, glass),
      className
    )}
    data-surface={resolveSurface(surface, glass)}
    data-ui-navigation-menu
    {...props}
  />
)

export type PaginationProps = ComponentPropsWithoutRef<'nav'>
export const Pagination = ({ 'aria-label': ariaLabel = 'Pagination', className, ...props }: PaginationProps) => (
  <nav aria-label={ariaLabel} className={composeClassName('ui-pagination', className)} {...props} />
)

export type PopoverProps = ComponentPropsWithoutRef<'div'> & SurfaceProps & Omit<PopoverOptions, 'id'>

export const Popover = ({
  children,
  className,
  defaultOpen,
  glass = false,
  onOpenChange,
  open,
  surface = 'default',
  ...props
}: PopoverProps) => {
  const popover = usePopover({ defaultOpen, onOpenChange, open })

  return (
    <PopoverContext.Provider value={popover}>
      <div
        {...popover.rootProps}
        {...props}
        className={composeClassName('ui-popover', glassSurfaceClass('ui-popover', surface, glass), className)}
        data-surface={resolveSurface(surface, glass)}
        data-ui-popover
      >
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export type PopoverTriggerProps = ComponentPropsWithoutRef<'button'>
export const PopoverTrigger = ({ onClick, onKeyDown, ...props }: PopoverTriggerProps) => {
  const popover = requireContext(useContext(PopoverContext), 'PopoverTrigger')

  return (
    <button
      {...popover.triggerProps}
      {...props}
      onClick={composeHandlers(onClick, popover.triggerProps.onClick)}
      onKeyDown={composeHandlers(onKeyDown, popover.triggerProps.onKeyDown)}
      type={props.type ?? 'button'}
    />
  )
}

export type PopoverPanelProps = ComponentPropsWithoutRef<'div'>
export const PopoverPanel = ({ onKeyDown, ...props }: PopoverPanelProps) => {
  const popover = requireContext(useContext(PopoverContext), 'PopoverPanel')

  return (
    <div
      {...popover.panelProps}
      {...props}
      onKeyDown={composeHandlers(onKeyDown, popover.panelProps.onKeyDown)}
    />
  )
}

export interface ProgressProps extends ComponentPropsWithoutRef<'div'> {
  max?: number
  value?: number
}

export const Progress = ({ className, max = 100, value = 0, ...props }: ProgressProps) => {
  const safeMax = max > 0 ? max : 100
  const safeValue = Math.min(safeMax, Math.max(0, value))
  const percentage = (safeValue / safeMax) * 100

  return (
    <div
      aria-valuemax={safeMax}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      className={composeClassName('ui-progress', className)}
      role="progressbar"
      {...props}
    >
      <span className="ui-progress__bar" style={{ width: `${percentage}%` }} />
    </div>
  )
}

export type RadioGroupProps = ComponentPropsWithoutRef<'fieldset'>
export const RadioGroup = ({ className, ...props }: RadioGroupProps) => (
  <fieldset className={composeClassName('ui-radio-group', className)} data-ui-radio-group {...props} />
)

/* eslint-disable @stylistic/padding-line-between-statements, @eslint-react/no-array-index-key, @eslint-react/no-children-to-array, @eslint-react/no-clone-element -- Resizable preserves pane element tags while injecting pane sizing props and handles. */
interface ResizablePaneProps {
  className?: string | undefined
  style?: CSSProperties | undefined
}

export interface ResizableProps extends ComponentPropsWithoutRef<'div'> {
  defaultSizes?: number[] | undefined
  direction?: ResizableDirection | undefined
  maxSize?: number | number[] | undefined
  minSize?: number | number[] | undefined
  resetOnDoubleClick?: boolean | undefined
}

const renderResizablePane = (
  child: ReactNode,
  index: number,
  panelProps: ComponentPropsWithoutRef<'div'>
) => {
  if (isValidElement<ResizablePaneProps>(child)) {
    const childProps = child.props

    return cloneElement(child, {
      ...panelProps,
      className: composeClassName(childProps.className, panelProps.className),
      style: {
        ...childProps.style,
        ...panelProps.style
      }
    })
  }

  return <div {...panelProps}>{child}</div>
}

export const Resizable = ({
  children,
  className,
  defaultSizes,
  direction = 'horizontal',
  maxSize,
  minSize,
  resetOnDoubleClick = true,
  ...props
}: ResizableProps) => {
  const panes = Children.toArray(children)
  const resizable = useResizable({
    defaultSizes,
    direction,
    maxSize,
    minSize,
    panelCount: panes.length,
    resetOnDoubleClick
  })

  return (
    <div
      {...props}
      {...resizable.rootProps}
      className={composeClassName(resizable.rootProps.className, className)}
    >
      {panes.map((child, index) => (
        <Fragment key={index}>
          {renderResizablePane(child, index, resizable.getPanelProps(index))}
          {index < panes.length - 1 && (
            <button {...resizable.getHandleProps(index)} type="button" />
          )}
        </Fragment>
      ))}
    </div>
  )
}
/* eslint-enable @stylistic/padding-line-between-statements, @eslint-react/no-array-index-key, @eslint-react/no-children-to-array, @eslint-react/no-clone-element */

export interface RichTextEditorProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const RichTextEditor = ({ className, glass = false, ...props }: RichTextEditorProps) => (
  <section className={composeClassName('ui-rich-text-editor', glassClass('ui-rich-text-editor', glass), className)} data-ui-rich-text-editor {...props} />
)

export interface ScrollAreaProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const ScrollArea = ({ className, glass = false, ...props }: ScrollAreaProps) => (
  <div className={composeClassName('ui-scroll-area', glassClass('ui-scroll-area', glass), className)} {...props} />
)

export interface ScheduleProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const Schedule = ({ className, glass = false, ...props }: ScheduleProps) => (
  <section className={composeClassName('ui-schedule', glassClass('ui-schedule', glass), className)} data-ui-schedule {...props} />
)

export type SearchFieldProps = ComponentPropsWithoutRef<'input'>
export const SearchField = ({ className, type = 'search', ...props }: SearchFieldProps) => (
  <input className={composeClassName('ui-input ui-search-field', className)} type={type} {...props} />
)

export interface SelectProps extends Omit<
  NativeSelectProps,
  'defaultValue' | 'disabled' | 'id' | 'name' | 'onChange' | 'options' | 'placeholder' | 'required' | 'size' | 'value'
>, SelectOptions {
  glass?: LumenGlassProp
  onChange?: ComponentPropsWithoutRef<'select'>['onChange']
  size?: 'default' | 'lg' | 'md' | 'sm'
}

const getSelectSizeClass = (size: SelectProps['size']) => {
  if (size === 'sm') return 'ui-select--sm'

  if (size === 'lg') return 'ui-select--lg'

  return false
}

export const Select = ({
  children,
  className,
  defaultValue,
  disabled = false,
  glass = false,
  id,
  name,
  onChange,
  onValueChange,
  options = emptyOptions,
  placeholder,
  required = false,
  size = 'default',
  value,
  ...props
}: SelectProps) => {
  const select = useSelect({
    defaultValue,
    disabled,
    id,
    name,
    onValueChange,
    options,
    placeholder,
    required,
    value
  })

  const sizeClass = getSelectSizeClass(size)

  return (
    <div
      {...select.rootProps}
      className={composeClassName('ui-select-field', glassClass('ui-select-field', glass), className)}
      data-ui-glass-track={glass ? true : undefined}
    >
      <select
        {...select.nativeSelectProps}
        {...props}
        className={composeClassName('ui-select ui-select__native', sizeClass)}
        onChange={composeHandlers(onChange, select.nativeSelectProps.onChange)}
      >
        {placeholder && <option data-ui-select-placeholder disabled value="">{placeholder}</option>}
        {children}
        {select.options.map(option => (
          <option disabled={option.disabled} key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div {...select.controlProps} className="ui-select__control">
        <button
          {...select.triggerProps}
          className={composeClassName('ui-select ui-select__trigger', sizeClass)}
          type={select.triggerProps.type ?? 'button'}
        >
          <span data-ui-select-value>{select.triggerText}</span>
        </button>

        <div {...select.listProps} className="ui-select__list">
          {select.options.map(option => {
            const optionProps = select.getOptionProps(option)

            return (
              <button key={option.value} {...optionProps} type={optionProps.type ?? 'button'}>
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export interface SeparatorProps extends ComponentPropsWithoutRef<'hr'> {
  orientation?: Orientation
}

export const Separator = ({ className, orientation = 'horizontal', ...props }: SeparatorProps) => (
  <hr
    aria-orientation={orientation}
    className={composeClassName('ui-separator', `ui-separator--${orientation}`, className)}
    data-orientation={orientation}
    {...props}
  />
)

export interface SheetProps extends ComponentPropsWithoutRef<'dialog'>, SurfaceProps {}

export const Sheet = ({ className, glass = false, surface = 'default', ...props }: SheetProps) => (
  <dialog
    className={composeClassName('ui-sheet', glassSurfaceClass('ui-sheet', surface, glass), className)}
    data-surface={resolveSurface(surface, glass)}
    data-ui-sheet
    {...props}
  />
)

export interface SidebarProps extends ComponentPropsWithoutRef<'aside'>, SurfaceProps {}

export const Sidebar = ({ className, glass = false, surface = 'default', ...props }: SidebarProps) => (
  <aside
    className={composeClassName('ui-sidebar', glassSurfaceClass('ui-sidebar', surface, glass), className)}
    data-surface={resolveSurface(surface, glass)}
    {...props}
  />
)

export type SkeletonProps = ComponentPropsWithoutRef<'div'>
export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div className={composeClassName('ui-skeleton', className)} {...props} />
)

export type SliderProps = ComponentPropsWithoutRef<'input'>
export const Slider = ({ className, type = 'range', ...props }: SliderProps) => (
  <input className={composeClassName('ui-slider', className)} type={type} {...props} />
)

export type SonnerProps = ComponentPropsWithoutRef<'div'>
export const Sonner = ({ className, ...props }: SonnerProps) => (
  <div className={composeClassName('ui-sonner', className)} data-ui-sonner {...props} />
)

export type SpinnerProps = ComponentPropsWithoutRef<'span'>
export const Spinner = ({
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  role,
  ...props
}: SpinnerProps) => {
  const isAccessible = Boolean(ariaLabel || ariaLabelledby)

  return (
    <span
      aria-hidden={ariaHidden ?? (isAccessible ? undefined : true)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={composeClassName('ui-spinner', className)}
      role={role ?? (isAccessible ? 'status' : undefined)}
      {...props}
    />
  )
}

export type SwitchProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'>
export const Switch = ({ className, role = 'switch', ...props }: SwitchProps) => (
  <input className={composeClassName('ui-switch', className)} role={role} type="checkbox" {...props} />
)

export interface TableProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const Table = ({ className, glass = false, ...props }: TableProps) => (
  <div className={composeClassName('ui-table-wrap', glassClass('ui-table-wrap', glass), className)} {...props} />
)

export interface TabsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'id' | 'onChange'>, Omit<TabsOptions, 'id'> {
  glass?: LumenGlassProp
}
export const Tabs = ({
  children,
  className,
  defaultValue,
  glass = false,
  onValueChange,
  orientation,
  value,
  ...props
}: TabsProps) => {
  const tabs = useTabs({ defaultValue, onValueChange, orientation, value })

  return (
    <TabsContext.Provider value={tabs}>
      <div
        {...tabs.rootProps}
        {...props}
        className={composeClassName('ui-tabs', glassClass('ui-tabs', glass), className)}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export type TabsListProps = ComponentPropsWithoutRef<'div'>
export const TabsList = ({ ...props }: TabsListProps) => {
  const tabs = requireContext(useContext(TabsContext), 'TabsList')

  return <div {...tabs.listProps} {...props} />
}

export interface TabsTriggerProps extends ComponentPropsWithoutRef<'button'> {
  value: string
}
export const TabsTrigger = ({ onClick, onKeyDown, value, ...props }: TabsTriggerProps) => {
  const tabs = requireContext(useContext(TabsContext), 'TabsTrigger')

  return (
    <button
      {...tabs.getTriggerProps(value, props)}
      onClick={composeHandlers(onClick, tabs.getTriggerProps(value).onClick)}
      onKeyDown={composeHandlers(onKeyDown, tabs.getTriggerProps(value).onKeyDown)}
      type={props.type ?? 'button'}
    />
  )
}

export interface TabsPanelProps extends ComponentPropsWithoutRef<'div'> {
  value: string
}
export const TabsPanel = ({ value, ...props }: TabsPanelProps) => {
  const tabs = requireContext(useContext(TabsContext), 'TabsPanel')

  return <div {...tabs.getPanelProps(value, props)} />
}

export type TagGroupProps = ComponentPropsWithoutRef<'div'>
export const TagGroup = ({ className, role = 'list', ...props }: TagGroupProps) => (
  <div className={composeClassName('ui-tag-group', className)} role={role} {...props} />
)

export type TextareaProps = ComponentPropsWithoutRef<'textarea'>
export const Textarea = ({ className, rows = 4, ...props }: TextareaProps) => (
  <textarea className={composeClassName('ui-textarea', className)} rows={rows} {...props} />
)

export interface ThemeBuilderProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const ThemeBuilder = ({ className, glass = false, ...props }: ThemeBuilderProps) => (
  <section className={composeClassName('ui-theme-builder', glassClass('ui-theme-builder', glass), className)} data-ui-theme-builder {...props} />
)

export type TimeFieldProps = ComponentPropsWithoutRef<'input'>
export const TimeField = ({ className, type = 'time', ...props }: TimeFieldProps) => (
  <input className={composeClassName('ui-input ui-time-field', className)} type={type} {...props} />
)

export interface ToastProps extends ComponentPropsWithoutRef<'aside'>, SurfaceProps {
  variant?: AlertVariant
}

export const Toast = ({
  'aria-live': ariaLive,
  className,
  glass = false,
  role,
  surface = 'default',
  variant = 'default',
  ...props
}: ToastProps) => (
  <aside
    aria-live={ariaLive ?? (variant === 'destructive' ? 'assertive' : 'polite')}
    className={composeClassName(
      'ui-toast',
      variantClass('ui-toast', variant),
      glassSurfaceClass('ui-toast', surface, glass),
      className
    )}
    data-surface={resolveSurface(surface, glass)}
    data-ui-toast
    data-variant={variant}
    role={role ?? (variant === 'destructive' ? 'alert' : 'status')}
    {...props}
  />
)

export interface ToggleProps extends ComponentPropsWithoutRef<'button'> {
  pressed?: boolean
}

export const Toggle = ({ className, pressed = false, type = 'button', ...props }: ToggleProps) => (
  <button
    aria-pressed={pressed}
    className={composeClassName('ui-toggle', pressed && 'ui-toggle--pressed', className)}
    data-ui-toggle
    type={type}
    {...props}
  />
)

export type ToggleGroupProps = ComponentPropsWithoutRef<'div'>
export const ToggleGroup = ({ className, ...props }: ToggleGroupProps) => (
  <div className={composeClassName('ui-toggle-group', className)} data-ui-toggle-group {...props} />
)

export type TooltipProps = ComponentPropsWithoutRef<'span'> & Omit<TooltipOptions, 'id'>
export const Tooltip = ({
  children,
  className,
  defaultOpen,
  delay,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  onOpenChange,
  open,
  ...props
}: TooltipProps) => {
  const tooltip = useTooltip({ defaultOpen, delay, onOpenChange, open })

  return (
    <TooltipContext.Provider value={tooltip}>
      <span
        {...tooltip.rootProps}
        {...props}
        className={composeClassName('ui-tooltip', className)}
        onKeyDown={composeHandlers(onKeyDown, tooltip.rootProps.onKeyDown)}
        onMouseEnter={composeHandlers(onMouseEnter, tooltip.rootProps.onMouseEnter)}
        onMouseLeave={composeHandlers(onMouseLeave, tooltip.rootProps.onMouseLeave)}
      >
        {children}
      </span>
    </TooltipContext.Provider>
  )
}

export type TooltipContentProps = ComponentPropsWithoutRef<'span'>
export const TooltipContent = ({ ...props }: TooltipContentProps) => {
  const tooltip = requireContext(useContext(TooltipContext), 'TooltipContent')

  return <span {...tooltip.tooltipProps} {...props} />
}

export interface TreeProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const Tree = ({ className, glass = false, role = 'tree', ...props }: TreeProps) => (
  <div className={composeClassName('ui-tree', glassClass('ui-tree', glass), className)} role={role} {...props} />
)

export interface TreeGridProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const TreeGrid = ({ className, glass = false, role = 'treegrid', ...props }: TreeGridProps) => (
  <div className={composeClassName('ui-tree-grid', glassClass('ui-tree-grid', glass), className)} role={role} {...props} />
)

export type TypographyProps = ComponentPropsWithoutRef<'div'>
export const Typography = ({ className, ...props }: TypographyProps) => (
  <div className={composeClassName('ui-typography', className)} {...props} />
)

export interface VirtualListProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
  itemSize?: number | string
  overscan?: number | string
}
export const VirtualList = ({
  className,
  glass = false,
  itemSize,
  overscan,
  ...props
}: VirtualListProps) => (
  <div
    className={composeClassName('ui-virtual-list', glassClass('ui-virtual-list', glass), className)}
    data-ui-item-size={itemSize}
    data-ui-overscan={overscan}
    data-ui-virtual-list
    {...props}
  />
)

export type BackToTopProps = ComponentPropsWithoutRef<'button'>
export const BackToTop = ({ className, type = 'button', ...props }: BackToTopProps) => (
  <button className={composeClassName('ui-back-to-top', className)} type={type} {...props} />
)

export type CalloutProps = ComponentPropsWithoutRef<'aside'>
export const Callout = ({ className, ...props }: CalloutProps) => (
  <aside className={composeClassName('ui-callout', className)} {...props} />
)

export type EyebrowProps = ComponentPropsWithoutRef<'p'>
export const Eyebrow = ({ className, ...props }: EyebrowProps) => (
  <p className={composeClassName('ui-eyebrow', className)} {...props} />
)

export type FloatingBadgeProps = ComponentPropsWithoutRef<'span'>
export const FloatingBadge = ({ className, ...props }: FloatingBadgeProps) => (
  <span className={composeClassName('ui-floating-badge', className)} {...props} />
)

export type FormattedDateProps = ComponentPropsWithoutRef<'time'>
export const FormattedDate = ({ className, ...props }: FormattedDateProps) => (
  <time className={composeClassName('ui-formatted-date', className)} {...props} />
)

export type ImageProps = ComponentPropsWithoutRef<'img'>
export const Image = ({ className, loading = 'eager', ...props }: ImageProps) => (
  /* eslint-disable-next-line jsx-a11y/alt-text -- alt is provided by the consumer via spread props */
  <img className={composeClassName('ui-image', className)} loading={loading} {...props} />
)

export type LinkProps = ComponentPropsWithoutRef<'a'>
export const Link = ({ className, ...props }: LinkProps) => (
  <a className={composeClassName('ui-link', className)} {...props} />
)

export type PillProps = ComponentPropsWithoutRef<'span'> & {
  count?: number | string
}
export const Pill = ({ className, count, children, ...props }: PillProps) => (
  <span className={composeClassName('ui-pill', className)} {...props}>
    {children}
    {count !== undefined && <span className="ui-pill__count">{count}</span>}
  </span>
)

export type ProseProps = ComponentPropsWithoutRef<'div'>
export const Prose = ({ className, ...props }: ProseProps) => (
  <div className={composeClassName('ui-prose', className)} {...props} />
)

export type SkipLinkProps = ComponentPropsWithoutRef<'a'>
export const SkipLink = ({ className, ...props }: SkipLinkProps) => (
  <a className={composeClassName('ui-skip-link', className)} {...props} />
)

export type ThemeToggleProps = ComponentPropsWithoutRef<'button'>
export const ThemeToggle = ({ className, type = 'button', ...props }: ThemeToggleProps) => (
  <button className={composeClassName('ui-theme-toggle', className)} type={type} {...props}>
    <span className="ui-sr-only">Toggle color theme</span>
    <Icon className="ui-theme-toggle__sun" name="sun" />
    <Icon className="ui-theme-toggle__moon" name="moon" />
  </button>
)

export type LanguageToggleProps = ComponentPropsWithoutRef<'button'>
export const LanguageToggle = ({ className, type = 'button', ...props }: LanguageToggleProps) => (
  <button className={composeClassName('ui-language-toggle', className)} type={type} {...props} />
)

export interface ParticlesProps extends ComponentPropsWithoutRef<'div'> {
  density?: 'low' | 'medium' | 'high'
}
export const Particles = ({ className, density = 'medium', ...props }: ParticlesProps) => (
  <div aria-hidden="true" className={composeClassName('ui-particles', className)} data-ui-particles={density} {...props} />
)

export interface ScrollRevealProps extends ComponentPropsWithoutRef<'div'> {
  animation?: 'fade' | 'slide-up' | 'scale'
}
export const ScrollReveal = ({ className, animation = 'fade', ...props }: ScrollRevealProps) => (
  <div className={composeClassName('ui-scroll-reveal', `ui-scroll-reveal-${animation}`, className)} data-ui-scroll-reveal {...props} />
)

export interface StatProps extends ComponentPropsWithoutRef<'div'> {
  label?: string
  value?: string
}
export const Stat = ({ className, label, value, children, ...props }: StatProps) => (
  <div className={composeClassName('ui-stat', className)} {...props}>
    {label && <div className="ui-stat-label">{label}</div>}
    {value && <div className="ui-stat-value">{value}</div>}
    {children}
  </div>
)

export type MeterProps = ComponentPropsWithoutRef<'meter'>
export const Meter = ({ className, ...props }: MeterProps) => (
  <meter className={composeClassName('ui-meter', className)} {...props} />
)

export interface NoteProps extends ComponentPropsWithoutRef<'div'> {
  label?: string
  borderPosition?: 'left' | 'right' | 'none'
}
export const Note = ({ className, label, borderPosition = 'left', children, ...props }: NoteProps) => (
  <div className={composeClassName('ui-note', `ui-note--border-${borderPosition}`, className)} {...props}>
    {label && <p className="ui-note__label">{label}</p>}
    <div className="ui-note__content">{children}</div>
  </div>
)

export interface RatingProps extends ComponentPropsWithoutRef<'div'> {
  value?: number
  max?: number
  readonly?: boolean
}
export const Rating = ({ className, value = 0, max = 5, readonly = false, ...props }: RatingProps) => {
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div
      className={composeClassName('ui-rating', readonly && 'ui-rating--readonly', className)}
      data-ui-rating
      data-value={value}
      data-max={max}
      data-readonly={readonly ? 'true' : 'false'}
      {...props}
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className="ui-rating__star"
          data-active={star <= value ? 'true' : 'false'}
          disabled={readonly}
          aria-label={`Rate ${star} out of ${max}`}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="ui-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </button>
      ))}
    </div>
  )
}

export type TimelineProps = ComponentPropsWithoutRef<'ol'>
export const Timeline = ({ className, ...props }: TimelineProps) => (
  <ol className={composeClassName('ui-timeline', className)} {...props} />
)

export type AnimatedLogoProps = Omit<ComponentPropsWithoutRef<'svg'>, 'xmlns' | 'viewBox'> & {
  iconOnly?: boolean
  variant?: 'light' | 'dark'
}
export const AnimatedLogo = ({ className, iconOnly = false, variant = 'light', ...props }: AnimatedLogoProps) => {
  const isDark = variant === 'dark'
  const fillColor = isDark ? '#713bf7' : '#5a0fdb'
  const strokeColor = isDark ? '#110c1d' : '#FFFFFF'
  const textColor = isDark ? '#faf9fb' : '#332e38'
  const viewBox = iconOnly ? '0 0 80 80' : '0 0 504 80'

  return (
    <svg
      aria-label="Santi020k"
      className={composeClassName('ui-animated-logo', className)}
      role="img"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g data-logo-mark>
        <rect
          fill={fillColor}
          height="80"
          rx="18"
          style={{ transform: 'scale(0)', transformOrigin: '40px 40px', animation: 'ui-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
          width="80"
        />
        <path
          d="M 26 28 L 40 40 L 26 52"
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="8"
          style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: 'ui-draw 0.6s ease forwards', animationDelay: '0.3s' }}
        />
        <line
          stroke={strokeColor}
          strokeLinecap="round"
          strokeWidth="8"
          style={{ strokeDasharray: 60, strokeDashoffset: 60, animation: 'ui-draw 0.6s ease forwards', animationDelay: '0.5s' }}
          x1="48"
          x2="62"
          y1="52"
          y2="52"
        />
      </g>
      {!iconOnly && (
        <text
          dominantBaseline="central"
          fill={textColor}
          fontFamily="Montserrat, Inter, sans-serif"
          fontSize="48"
          fontWeight="800"
          letterSpacing="-0.04em"
          style={{ opacity: 0, transform: 'translateX(-10px)', animation: 'ui-fade-slide 0.5s ease forwards', animationDelay: '0.7s' }}
          x="100"
          y="40"
        >
          Santi<tspan fill={fillColor} fontWeight="600" letterSpacing="-0.02em">020k</tspan>
        </text>
      )}
    </svg>
  )
}

export type AnimatedPortraitProps = ComponentPropsWithoutRef<'div'>
export const AnimatedPortrait = ({ className, ...props }: AnimatedPortraitProps) => (
  <div className={composeClassName('ui-animated-portrait relative isolate w-full animate-reveal-lcp motion-reduce:animate-none', className)} {...props} />
)

export type ButtonLinkProps = ComponentPropsWithoutRef<'a'> & {
  shape?: 'default' | 'icon'
  variant?: 'ghost' | 'inline' | 'primary' | 'secondary'
}
export const ButtonLink = ({ className, shape = 'default', variant = 'primary', ...props }: ButtonLinkProps) => {
  const variantClass = variant === 'inline'
    ? 'ui-button ui-button--inline'
    : `ui-button ui-button--${variant} min-h-11 rounded-full border`

  const shapeClass = shape === 'icon' && variant !== 'inline' ? 'ui-button-link--icon' : undefined

  return (
    <a className={composeClassName('ui-button-link group inline-flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold tracking-[0.01em]', variantClass, shapeClass, className)} {...props} />
  )
}

export type CoverImageProps = ComponentPropsWithoutRef<'div'> & {
  hover?: boolean
  showBottomGradient?: boolean
}
export const CoverImage = ({ className, hover = false, showBottomGradient = false, children, ...props }: CoverImageProps) => (
  <div className={composeClassName('ui-cover-image relative overflow-hidden bg-surface-muted', hover && 'ui-cover-image--hover', className)} {...props}>
    {children}
    {showBottomGradient && <div aria-hidden="true" className="ui-cover-image__bottom-gradient" />}
  </div>
)

export type GradientDividerProps = ComponentPropsWithoutRef<'div'>
export const GradientDivider = ({ className, ...props }: GradientDividerProps) => (
  <div aria-hidden="true" className={composeClassName('ui-gradient-divider pointer-events-none flex justify-center', className)} {...props}>
    <div className="h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-brand/40 to-transparent"></div>
  </div>
)

export type StepItem = string | { description?: string; title: string }
export interface StepperProps extends ComponentPropsWithoutRef<'ol'> {
  currentStep?: number
  orientation?: Orientation
  steps?: StepItem[]
}

const emptySteps: StepItem[] = []
const normalizeStep = (step: StepItem) => typeof step === 'string' ? { description: undefined, title: step } : step

export const Stepper = ({ children, className, currentStep = 0, orientation = 'horizontal', steps = emptySteps, ...props }: StepperProps) => (
  <ol
    className={composeClassName('ui-stepper', orientation === 'vertical' && 'ui-stepper--vertical', className)}
    data-orientation={orientation}
    {...props}
  >
    {steps.map(normalizeStep).map((step, index) => {
      let state: 'complete' | 'current' | 'upcoming' = 'upcoming'

      if (index < currentStep) {
        state = 'complete'
      } else if (index === currentStep) {
        state = 'current'
      }

      return (
        <li aria-current={state === 'current' ? 'step' : undefined} className="ui-stepper__step" data-state={state} key={step.title}>
          <span className="ui-stepper__marker">{index + 1}</span>
          <span className="ui-stepper__content">
            <span className="ui-stepper__title">{step.title}</span>
            {step.description && <span className="ui-stepper__description">{step.description}</span>}
          </span>
        </li>
      )
    })}
    {children}
  </ol>
)

export interface FileUploadProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size'> {
  hint?: ReactNode
  inputClassName?: string
  label?: ReactNode
}
export const FileUpload = ({ children, className, hint, id, inputClassName, label = 'Choose a file or drag it here', ...props }: FileUploadProps) => {
  const inputId = id ?? 'ui-file-upload'

  return (
    <label className={composeClassName('ui-file-upload', className)} data-ui-file-upload htmlFor={inputId}>
      <input className={composeClassName('ui-file-upload__input', inputClassName)} data-ui-file-upload-input id={inputId} type="file" {...props} />
      <span aria-hidden="true" className="ui-file-upload__icon" />
      <span className="ui-file-upload__prompt">{children ?? label}</span>
      {hint && <span className="ui-file-upload__hint">{hint}</span>}
      <span aria-live="polite" className="ui-file-upload__files" data-ui-file-upload-files />
    </label>
  )
}

export interface TourStep {
  content: ReactNode
  target: string
  title?: ReactNode
}
export interface TourProps extends ComponentPropsWithoutRef<'div'> {
  closeLabel?: string
  nextLabel?: string
  steps?: TourStep[]
}

const emptyTourSteps: TourStep[] = []

export const Tour = ({ children, className, closeLabel = 'Done', hidden = true, nextLabel = 'Next', steps = emptyTourSteps, ...props }: TourProps) => (
  <div className={composeClassName('ui-tour', className)} data-ui-tour hidden={hidden} {...props}>
    <div aria-hidden="true" className="ui-tour__backdrop" data-ui-tour-backdrop />
    <div className="ui-tour__popover" data-ui-tour-popover role="dialog">
      {steps.map((step, index) => (
        <div className="ui-tour__step" data-target={step.target} data-ui-tour-step hidden={index !== 0} key={step.target}>
          {step.title && <p className="ui-tour__title">{step.title}</p>}
          <p className="ui-tour__content">{step.content}</p>
          <div className="ui-tour__actions">
            <button className="ui-button ui-button--ghost ui-button--sm" data-ui-tour-close type="button">{closeLabel}</button>
            {index < steps.length - 1 && (
              <button className="ui-button ui-button--default ui-button--sm" data-ui-tour-next type="button">{nextLabel}</button>
            )}
          </div>
        </div>
      ))}
      {children}
    </div>
  </div>
)

export interface AnchorLink {
  href: string
  label: ReactNode
}
export interface AnchorProps extends ComponentPropsWithoutRef<'nav'> {
  items?: AnchorLink[]
}

const emptyAnchorLinks: AnchorLink[] = []

export const Anchor = ({ 'aria-label': ariaLabel = 'On this page', children, className, items = emptyAnchorLinks, ...props }: AnchorProps) => (
  <nav aria-label={ariaLabel} className={composeClassName('ui-anchor', className)} data-ui-anchor {...props}>
    {items.length > 0 && (
      <ol>
        {items.map((item, index) => (
          <li key={item.href}>
            <a data-active={index === 0 ? 'true' : 'false'} href={item.href}>{item.label}</a>
          </li>
        ))}
      </ol>
    )}
    {children}
  </nav>
)

export interface SegmentedProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  defaultValue?: string
  name?: string
  onValueChange?: (value: string) => void
  options?: SelectOption[]
  size?: 'default' | 'lg' | 'sm'
  value?: string
}
export const Segmented = ({ children, className, defaultValue, name = 'segmented', onValueChange, options = emptyOptions, size = 'default', value = defaultValue, ...props }: SegmentedProps) => (
  <div
    className={composeClassName('ui-segmented', size === 'sm' && 'ui-segmented--sm', size === 'lg' && 'ui-segmented--lg', className)}
    role="group"
    {...props}
  >
    {options.map(normalizeOption).map(option => (
      <label className="ui-segmented__option" key={option.value}>
        <input
          defaultChecked={value === option.value}
          className="ui-segmented__input"
          disabled={option.disabled}
          name={name}
          type="radio"
          value={option.value}
          onChange={() => onValueChange?.(option.value)}
        />
        <span className="ui-segmented__label">{option.label}</span>
      </label>
    ))}
    {children}
  </div>
)

export interface ToolbarProps extends ComponentPropsWithoutRef<'div'> {
  orientation?: Orientation
}
export const Toolbar = ({ 'aria-label': ariaLabel = 'Toolbar', className, orientation = 'horizontal', ...props }: ToolbarProps) => (
  <div
    aria-label={ariaLabel}
    aria-orientation={orientation}
    className={composeClassName('ui-toolbar', orientation === 'vertical' && 'ui-toolbar--vertical', className)}
    data-orientation={orientation}
    data-ui-toolbar
    role="toolbar"
    {...props}
  />
)

export interface DescriptionsItem {
  label: ReactNode
  value: ReactNode
}
export interface DescriptionsProps extends ComponentPropsWithoutRef<'dl'> {
  columns?: number
  items?: DescriptionsItem[]
}

const emptyDescriptionsItems: DescriptionsItem[] = []

export const Descriptions = ({ children, className, columns = 1, items = emptyDescriptionsItems, style, ...props }: DescriptionsProps) => (
  <dl
    className={composeClassName('ui-descriptions', className)}
    data-columns={columns}
    style={{ ['--ui-descriptions-columns' as string]: columns, ...style }}
    {...props}
  >
    {items.map((item, index) => (
      // eslint-disable-next-line @eslint-react/no-array-index-key -- Descriptions rows are static and order-stable.
      <div className="ui-descriptions__item" key={index}>
        <dt className="ui-descriptions__term">{item.label}</dt>
        <dd className="ui-descriptions__detail">{item.value}</dd>
      </div>
    ))}
    {children}
  </dl>
)

export interface PopconfirmProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  cancelLabel?: string
  confirmLabel?: string
  title?: ReactNode
}
export const Popconfirm = ({ cancelLabel = 'Cancel', children, className, confirmLabel = 'Confirm', title = 'Are you sure?', ...props }: PopconfirmProps) => (
  <div className={composeClassName('ui-popover ui-popconfirm', className)} data-surface="default" data-ui-popconfirm data-ui-popover {...props}>
    <span aria-expanded="false" aria-haspopup="dialog" className="ui-popconfirm__trigger" data-ui-trigger>
      {children}
    </span>
    <div className="ui-popover__panel ui-popconfirm__panel" data-ui-panel hidden role="dialog">
      <p className="ui-popconfirm__message">{title}</p>
      <div className="ui-popconfirm__actions">
        <button className="ui-button ui-button--ghost ui-button--sm" data-ui-popconfirm-cancel type="button">{cancelLabel}</button>
        <button className="ui-button ui-button--destructive ui-button--sm" data-ui-popconfirm-confirm type="button">{confirmLabel}</button>
      </div>
    </div>
  </div>
)

export interface TransferItem {
  key: string
  label: ReactNode
}
export interface TransferProps extends ComponentPropsWithoutRef<'div'> {
  items?: TransferItem[]
  name?: string
  sourceTitle?: string
  targetItems?: TransferItem[]
  targetTitle?: string
}

const emptyTransferItems: TransferItem[] = []

const renderTransferItems = (items: TransferItem[]) => items.map(item => (
  <li className="ui-transfer__item" key={item.key}>
    <label className="ui-transfer__option">
      <input className="ui-checkbox" data-ui-transfer-item type="checkbox" value={item.key} />
      <span>{item.label}</span>
    </label>
  </li>
))

export const Transfer = ({ className, items = emptyTransferItems, name, sourceTitle = 'Available', targetItems = emptyTransferItems, targetTitle = 'Selected', ...props }: TransferProps) => (
  <div className={composeClassName('ui-transfer', className)} data-ui-transfer data-ui-transfer-name={name} {...props}>
    <div className="ui-transfer__panel">
      <p className="ui-transfer__title">{sourceTitle}</p>
      <ul className="ui-transfer__list" data-side="source" data-ui-transfer-list>{renderTransferItems(items)}</ul>
    </div>
    <div className="ui-transfer__controls">
      <button aria-label={`Move to ${targetTitle}`} className="ui-button ui-button--outline ui-button--icon" data-ui-transfer-move="target" type="button">&rsaquo;</button>
      <button aria-label={`Move to ${sourceTitle}`} className="ui-button ui-button--outline ui-button--icon" data-ui-transfer-move="source" type="button">&lsaquo;</button>
    </div>
    <div className="ui-transfer__panel">
      <p className="ui-transfer__title">{targetTitle}</p>
      <ul className="ui-transfer__list" data-side="target" data-ui-transfer-list>{renderTransferItems(targetItems)}</ul>
    </div>
  </div>
)

export interface CascaderOption {
  children?: CascaderOption[]
  label: ReactNode
  value: string
}
export interface CascaderProps extends ComponentPropsWithoutRef<'div'> {
  name?: string
  options?: CascaderOption[]
  placeholder?: string
}

interface CascaderColumn {
  id: string
  options: { label: ReactNode; nextId?: string | undefined; value: string }[]
  root: boolean
}

const buildCascaderColumns = (options: CascaderOption[]): CascaderColumn[] => {
  const columns: CascaderColumn[] = []
  let count = 0

  const build = (items: CascaderOption[], root: boolean): string => {
    count += 1

    const id = `ui-cascader-col-${count}`

    const rendered = items.map(item => ({
      label: item.label,
      nextId: item.children && item.children.length > 0 ? build(item.children, false) : undefined,
      value: item.value
    }))

    columns.push({ id, options: rendered, root })

    return id
  }

  if (options.length > 0) build(options, true)

  return columns
}

const emptyCascaderOptions: CascaderOption[] = []

export const Cascader = ({ children, className, name, options = emptyCascaderOptions, placeholder = 'Select…', ...props }: CascaderProps) => {
  const columns = buildCascaderColumns(options)

  return (
    <div className={composeClassName('ui-cascader', className)} data-surface="default" data-ui-cascader data-ui-popover {...props}>
      <button aria-expanded="false" aria-haspopup="listbox" className="ui-select ui-select__trigger ui-cascader__trigger" data-ui-trigger type="button">
        <span data-ui-cascader-placeholder={placeholder} data-ui-cascader-value>{placeholder}</span>
      </button>
      <div className="ui-cascader__panel" data-ui-panel hidden>
        {columns.map(column => (
          <ol className="ui-cascader__column" hidden={!column.root} id={column.id} key={column.id}>
            {column.options.map(option => (
              <li key={option.value}>
                <button
                  className="ui-cascader__option"
                  data-ui-cascader-next={option.nextId ? `#${option.nextId}` : undefined}
                  data-ui-cascader-option
                  data-value={option.value}
                  type="button"
                >
                  <span>{option.label}</span>
                  {option.nextId && <span aria-hidden="true">&rsaquo;</span>}
                </button>
              </li>
            ))}
          </ol>
        ))}
        {children}
      </div>
      {name && <input data-ui-cascader-input name={name} type="hidden" />}
    </div>
  )
}

export interface TreeSelectNode {
  children?: TreeSelectNode[]
  label: ReactNode
  value: string
}
export interface TreeSelectProps extends ComponentPropsWithoutRef<'div'> {
  name?: string
  placeholder?: string
  treeData?: TreeSelectNode[]
}

const flattenTreeSelect = (nodes: TreeSelectNode[], depth = 0, acc: { depth: number; label: ReactNode; value: string }[] = []) => {
  for (const node of nodes) {
    acc.push({ depth, label: node.label, value: node.value })

    if (node.children && node.children.length > 0) flattenTreeSelect(node.children, depth + 1, acc)
  }

  return acc
}

const emptyTreeSelectNodes: TreeSelectNode[] = []

export const TreeSelect = ({ children, className, name, placeholder = 'Select…', treeData = emptyTreeSelectNodes, ...props }: TreeSelectProps) => (
  <div className={composeClassName('ui-tree-select', className)} data-surface="default" data-ui-popover data-ui-tree-select {...props}>
    <button aria-expanded="false" aria-haspopup="tree" className="ui-select ui-select__trigger ui-tree-select__trigger" data-ui-trigger type="button">
      <span data-ui-tree-select-placeholder={placeholder} data-ui-tree-select-value>{placeholder}</span>
    </button>
    <div className="ui-tree-select__panel" data-ui-panel hidden>
      <div className="ui-tree-select__tree" role="tree">
        {flattenTreeSelect(treeData).map(row => (
          <button
            className="ui-tree-select__option"
            data-value={row.value}
            key={row.value}
            role="treeitem"
            style={{ ['--ui-tree-depth' as string]: row.depth }}
            type="button"
          >
            {row.label}
          </button>
        ))}
      </div>
      {children}
    </div>
    {name && <input data-ui-tree-select-input name={name} type="hidden" />}
  </div>
)

export interface MentionsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  name?: string
  options?: SelectOption[]
  placeholder?: string
  trigger?: string
}
export const Mentions = ({ className, name, options = emptyOptions, placeholder, trigger = '@', ...props }: MentionsProps) => (
  <div className={composeClassName('ui-mentions', className)} data-ui-mentions data-ui-mentions-trigger={trigger} {...props}>
    <textarea className="ui-textarea ui-mentions__input" data-ui-mentions-input name={name} placeholder={placeholder} rows={3} />
    <ul className="ui-mentions__list" data-ui-mentions-list hidden role="listbox">
      {options.map(normalizeOption).map(option => (
        <li key={option.value}>
          <button className="ui-mentions__option" data-ui-mentions-option data-value={option.value} role="option" type="button">
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  </div>
)

export interface QRCodeProps extends ComponentPropsWithoutRef<'figure'> {
  size?: number
  src?: string
  value?: string
}
export const QRCode = ({ children, className, size = 160, src, style, value, ...props }: QRCodeProps) => (
  <figure
    className={composeClassName('ui-qr-code', className)}
    data-ui-qr-code
    style={{ ['--ui-qr-code-size' as string]: `${size}px`, ...style }}
    {...props}
  >
    <div className="ui-qr-code__frame">
      {src
        ? <img alt={value ? `QR code for ${value}` : 'QR code'} className="ui-qr-code__image" height={size} src={src} width={size} />
        : children}
    </div>
    {value && <figcaption className="ui-qr-code__value">{value}</figcaption>}
  </figure>
)

export interface WatermarkProps extends ComponentPropsWithoutRef<'div'> {
  content?: string
  gap?: number
  rotate?: number
  text?: string
}
export const Watermark = ({ children, className, content, gap = 120, rotate = -22, style, text = 'Confidential', ...props }: WatermarkProps) => (
  <div
    className={composeClassName('ui-watermark', className)}
    data-ui-watermark
    style={{ ['--ui-watermark-gap' as string]: `${gap}px`, ['--ui-watermark-rotate' as string]: `${rotate}deg`, ...style }}
    {...props}
  >
    {children}
    <div aria-hidden="true" className="ui-watermark__overlay" data-text={content ?? text} />
  </div>
)

export interface AffixProps extends ComponentPropsWithoutRef<'div'> {
  offset?: number
  offsetBottom?: number
  offsetTop?: number
  position?: 'bottom' | 'top'
}
export const Affix = ({ className, offset = 0, offsetBottom, offsetTop, position: positionProp, style, ...props }: AffixProps) => {
  const position = positionProp ?? (offsetBottom === undefined ? 'top' : 'bottom')
  const resolvedOffset = offsetBottom ?? offsetTop ?? offset

  return (
    <div
      className={composeClassName('ui-affix', position === 'bottom' && 'ui-affix--bottom', className)}
      data-position={position}
      style={{ ['--ui-affix-offset' as string]: `${resolvedOffset}px`, ...style }}
      {...props}
    />
  )
}

export interface SpeedDialAction {
  icon?: string
  label: string
  value?: string
}
export interface SpeedDialProps extends ComponentPropsWithoutRef<'div'> {
  actions?: SpeedDialAction[]
  direction?: 'down' | 'left' | 'right' | 'up'
  label?: string
}

const emptySpeedDialActions: SpeedDialAction[] = []

export const SpeedDial = ({ actions = emptySpeedDialActions, children, className, direction = 'up', label = 'Actions', ...props }: SpeedDialProps) => (
  <div className={composeClassName('ui-speed-dial', `ui-speed-dial--${direction}`, className)} data-direction={direction} data-ui-speed-dial {...props}>
    <button aria-expanded="false" aria-label={label} className="ui-speed-dial__trigger" data-ui-speed-dial-trigger type="button">
      <span aria-hidden="true" className="ui-speed-dial__icon" />
    </button>
    <menu className="ui-speed-dial__actions" data-ui-speed-dial-actions>
      {actions.map(action => (
        <li key={action.value ?? action.label}>
          <button aria-label={action.label} className="ui-speed-dial__action" data-icon={action.icon} data-value={action.value ?? action.label} type="button">
            <span className="ui-speed-dial__action-label">{action.label}</span>
          </button>
        </li>
      ))}
      {children}
    </menu>
  </div>
)


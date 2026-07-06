/* eslint-disable @eslint-react/no-context-provider, @eslint-react/no-use-context -- Lumen React keeps React 18 peer support, so React 19 context shorthand and use() are not available. */
import {
  composeClassName,
  type LumenCodeToken,
  lumenCodeTokenClassNames,
  tokenizeLumenCode
} from '@santi020k/lumen-core'

import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode
} from 'react'
import {
  createContext,
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
  type SelectOptions,
  type TabsController,
  type TabsOptions,
  type TooltipController,
  type TooltipOptions,
  useDialog,
  useDropdownMenu,
  usePopover,
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

type DataTableCell =
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

interface DataTableColumn {
  header?: string
  key: string
  label?: string
  sort?: 'number' | 'string'
  sortable?: boolean
}

type DataTableRow = Record<string, DataTableCell> & {
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

const variantClass = (base: string, variant: string, defaultVariant = 'default') =>
  variant === defaultVariant ? false : `${base}--${variant}`

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
  glass?: LumenGlassProp
}
export const Calendar = ({ className, glass = false, ...props }: CalendarProps) => (
  <div className={composeClassName('ui-calendar', glassClass('ui-calendar', glass), className)} {...props} />
)

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
    <svg
      aria-hidden="true"
      className="ui-code__copy-icon"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
    <svg
      aria-hidden="true"
      className="ui-code__check-icon"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
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
  columns = [],
  glass = false,
  name,
  rows = [],
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
  glass?: LumenGlassProp
}
export const Field = ({ className, glass = false, ...props }: FieldProps) => (
  <div className={composeClassName('ui-field', glassClass('ui-field', glass), className)} {...props} />
)

export interface HoverCardProps extends ComponentPropsWithoutRef<'aside'>, SurfaceProps {}

export const HoverCard = ({ className, glass = false, surface = 'default', ...props }: HoverCardProps) => (
  <aside
    className={composeClassName('ui-hover-card', glassSurfaceClass('ui-hover-card', surface, glass), className)}
    data-surface={resolveSurface(surface, glass)}
    data-ui-hover-card
    {...props}
  />
)

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

export interface InputOTPProps extends Omit<ComponentPropsWithoutRef<'input'>, 'maxLength' | 'type'> {
  length?: number
  maxLength?: number
}

export const InputOTP = ({
  className,
  inputMode = 'numeric',
  length = 6,
  maxLength = length,
  ...props
}: InputOTPProps) => (
  <input
    className={composeClassName('ui-input-otp', className)}
    inputMode={inputMode}
    maxLength={maxLength}
    pattern="[0-9]*"
    type="text"
    {...props}
  />
)

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

export type ResizableProps = ComponentPropsWithoutRef<'div'>
export const Resizable = ({ className, ...props }: ResizableProps) => (
  <div className={composeClassName('ui-resizable', className)} {...props} />
)

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

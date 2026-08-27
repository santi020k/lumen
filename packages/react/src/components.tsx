'use client'

/* eslint-disable @eslint-react/no-children-only, @eslint-react/no-context-provider, @eslint-react/no-use-context */
/* React 19 ref props and context providers stay explicit; polymorphic composition clones one child. */
import type {
  ChangeEvent,
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  CSSProperties,
  ElementType,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  Ref,
  RefObject
} from 'react'
import {
  Children,
  cloneElement,
  createContext,
  createElement,
  Fragment,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  alignLumenChartSeries,
  composeClassName,
  createLumenBarGeometry,
  createLumenHeatmapGeometry,
  createLumenLineGeometry,
  createLumenPieGeometry,
  createLumenRangeGeometry,
  createLumenScatterGeometry,
  formatLumenChartSummary,
  formatLumenLanguageLabel,
  getLumenChartCategories,
  getLumenChartDomain,
  getLumenChartTicks,
  getLumenChartToneClassName,
  getLumenIcon,
  getLumenPhoneCountries,
  getLumenPieChartVariantClassName,
  hasLumenChartData,
  hasLumenPieData,
  type LumenBarChartLayout,
  type LumenChartDatum,
  type LumenChartOrientation,
  type LumenChartScaleType,
  type LumenChartSeries,
  type LumenChartTone,
  type LumenCodeToken,
  lumenCodeTokenClassNames,
  type LumenComboSeries,
  type LumenFormErrorInput,
  type LumenFormStatus,
  type LumenHeatmapDatum,
  type LumenIconData,
  type LumenIconName,
  type LumenIconNode,
  type LumenIllustrationElement,
  lumenIllustrations,
  type LumenPhoneCountry,
  type LumenPhoneCountryOptions,
  type LumenPhoneNumber,
  type LumenPieChartVariant,
  type LumenRangeDatum,
  normalizeLumenFormErrors,
  resolveLumenChartTone,
  resolveLumenPhoneNumber,
  scaleLumenChartValue,
  tokenizeLumenCode
} from '@santi020k/lumen-core'
import { renderSVG } from 'uqr'

import { formatReactChartTableValue } from './chart-recipes.js'
import {
  type DialogOptions,
  type DropdownMenuController,
  type DropdownMenuOptions,
  type LanguageToggleOptions,
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
  useLanguageToggle,
  usePopover,
  useResizable,
  useSelect,
  useTabs,
  useTooltip
} from './hooks.js'
import {
  resolveReactPhoneInputCountry,
  resolveReactPhoneInputValue
} from './phone-recipes.js'
import {
  Input,
  type InputProps,
  Label
} from './server-components.js'

export {
  Badge,
  type BadgeProps,
  Input,
  type InputProps,
  Label,
  type LabelProps,
  Progress,
  type ProgressProps,
  Skeleton,
  type SkeletonProps,
  Spinner,
  type SpinnerProps,
  Textarea,
  type TextareaProps
} from './server-components.js'

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning'

type AccordionVariant = 'default' | 'flush'

type ButtonSize = 'default' | 'icon' | 'lg' | 'sm'

type ButtonVariant =
  'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'

type CardVariant = 'default' | 'glass' | 'interactive' | 'muted' | 'unstyled'

type CodeTheme = 'auto' | 'lumen' | 'santi020k'

type CodeVariant = 'block' | 'inline'

type IconSize = 'default' | 'lg' | 'sm' | 'xl'

const getChartCategoryKey = (value: number | string): string => `${typeof value}:${String(value)}`

export type DataTableCell =
  | boolean |
  null |
  number |
  string |
  undefined |
  {
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

export type LumenGlassProp = boolean | 'subtle' | 'strong'

interface SurfaceProps {
  'data-surface'?: SurfaceVariant
  glass?: LumenGlassProp
}

export interface Option {
  disabled?: boolean
  label: string
  section?: string
  value: string
}

type SelectOption = Option | string

const emptyOptions: SelectOption[] = []
const emptyStringOptions: string[] = []
const emptyDataTableColumns: DataTableColumn[] = []
const emptyDataTableRows: DataTableRow[] = []
const emptyChartSeries: LumenChartSeries[] = []
const emptyHeatmapData: LumenHeatmapDatum[] = []
const emptyRangeData: LumenRangeDatum[] = []
const emptyComboSeries: LumenComboSeries[] = []

const emptyPieSeries: LumenChartSeries = {
  data: [],
  id: 'pie',
  label: 'Values'
}

const emptyChartValues: number[] = []

const variantClass = (
  base: string,
  variant: string,
  defaultVariant = 'default'
) => (variant === defaultVariant ? false : `${base}--${variant}`)

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

const toReactSvgAttributes = (attributes: Record<string, string>) => Object.fromEntries(
  Object.entries(attributes).map(([name, value]) => [
    reactSvgAttributeNames[name] ?? name,
    value
  ])
)

const renderIconNode = (
  [tagName, attributes, children]: LumenIconNode,
  index: number
): ReactNode => createElement(
  tagName, {
    ...toReactSvgAttributes(attributes),
    key: attributes.key ?? index
  }, children?.map(renderIconNode)
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

const renderIconSvg = (icon: LumenIconData, className: string) => {
  const width = 'size' in icon ? icon.size : icon.width
  const height = 'size' in icon ? icon.size : icon.height

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill={icon.style === 'fill' ? 'currentColor' : 'none'}
      focusable="false"
      height="1em"
      stroke={icon.style === 'fill' ? 'none' : 'currentColor'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={icon.style === 'fill' ? '0' : '2'}
      viewBox={`0 0 ${width} ${height}`}
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      {icon.node.map(renderIconNode)}
    </svg>
  )
}

const renderNamedIcon = (icon: LumenIconData) => renderIconSvg(icon, `ui-icon__svg ${icon.source ?? 'lucide'}-${icon.name}`)

const renderLucideIcon = (name: string, className: string) => {
  const icon = getLumenIcon(name)

  return icon ? renderIconSvg(icon, className) : null
}

const resolveSurface = (glass?: LumenGlassProp): SurfaceVariant => glass ? 'glass' : 'default'

const glassIntensityClass = (glass?: LumenGlassProp) => glass === 'subtle' ?
  'ui-glass-subtle' :
  glass === 'strong' && 'ui-glass-strong'

const glassSurfaceClass = (
  base: string,
  glass?: LumenGlassProp
) => resolveSurface(glass) === 'glass' &&
  composeClassName(`${base}--glass`, glassIntensityClass(glass))

const glassClass = (base: string, glass?: LumenGlassProp) => Boolean(glass) &&
  composeClassName(`${base}--glass`, glassIntensityClass(glass))

const normalizeOption = (option: SelectOption): Option => typeof option === 'string' ? { label: option, value: option } : option

const isDataTableCellObject = (
  cell: DataTableCell
): cell is Exclude<
  DataTableCell,
  boolean | null | number | string | undefined
> => typeof cell === 'object' && cell !== null

const formatDataTableCell = (cell: DataTableCell): string => {
  const value = isDataTableCellObject(cell) ? (cell.label ?? cell.value) : cell

  return value === undefined || value === null ? '' : String(value)
}

const getDataTableSortValue = (cell: DataTableCell): string | undefined => {
  if (
    !isDataTableCellObject(cell) ||
    cell.sortValue === undefined ||
    cell.sortValue === null
  )
    return undefined

  return String(cell.sortValue)
}

const getDataTableRowValue = (
  row: DataTableRow,
  index: number
): string => String(row.rowValue ?? row.value ?? row.id ?? index)

const toInputValue = (
  value: ComponentPropsWithoutRef<'input'>['value']
): string | undefined => {
  if (value === undefined) return undefined

  return String(value)
}

const composeHandlers =
  <Event,>(
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

export type LumenPrimitiveProps<T extends ElementType = 'div'> = {
  as?: T
} & Omit<ComponentPropsWithRef<T>, 'as'>

const Primitive = ({
  as,
  className,
  uiClassName,
  ...props
}: PrimitiveProps & { uiClassName: string }) => {
  const Tag = as ?? 'div'
  const safeClassName = typeof className === 'string' ? className : undefined

  return (
    <Tag className={composeClassName(uiClassName, safeClassName)} {...props} />
  )
}

const DropdownMenuContext = createContext<DropdownMenuController | null>(null)
const PopoverContext = createContext<PopoverController | null>(null)
const TabsContext = createContext<TabsController | null>(null)
const TooltipContext = createContext<TooltipController | null>(null)

const requireContext = <Value,>(
  context: Value | null,
  componentName: string
): Value => {
  if (!context) {
    throw new Error(
      `${componentName} must be used inside its matching Lumen root component.`
    )
  }

  return context
}

export interface AccordionProps extends ComponentPropsWithoutRef<'div'> {
  variant?: AccordionVariant
}

export const Accordion = ({
  className,
  variant = 'default',
  ...props
}: AccordionProps) => (
  <div
    className={composeClassName(
      'ui-accordion', variant === 'flush' && 'ui-accordion--flush', className
    )}
    data-variant={variant}
    {...props}
  />
)

export interface AlertProps extends ComponentPropsWithoutRef<'aside'> {
  glass?: LumenGlassProp
  variant?: AlertVariant
}

export const Alert = ({
  className,
  glass = false,
  variant = 'default',
  ...props
}: AlertProps) => (
  <aside
    className={composeClassName(
      'ui-alert', variantClass('ui-alert', variant), glassClass('ui-alert', glass), className
    )}
    data-variant={variant}
    {...props}
  />
)

export type AlertDialogProps = Omit<
  ComponentPropsWithoutRef<'dialog'>,
  'open'
> &
SurfaceProps &
Omit<DialogOptions, 'id'>

export const AlertDialog = ({
  className,
  defaultOpen,
  glass = false,
  onClick,
  onClose,
  onOpenChange,
  open,
  ...props
}: AlertDialogProps) => {
  const dialog = useDialog({ alert: true, defaultOpen, onOpenChange, open })

  return (
    <dialog
      {...dialog.dialogProps}
      {...props}
      className={composeClassName(
        'ui-dialog ui-alert-dialog', glassSurfaceClass('ui-dialog', glass), className
      )}
      data-surface={resolveSurface(glass)}
      onClick={composeHandlers(onClick, dialog.dialogProps.onClick)}
      onClose={composeHandlers(onClose, dialog.dialogProps.onClose)}
    />
  )
}

export interface AgendaProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const Agenda = ({ className, glass = false, ...props }: AgendaProps) => (
  <section
    className={composeClassName(
      'ui-agenda', glassClass('ui-agenda', glass), className
    )}
    {...props}
  />
)

export interface AspectRatioProps extends ComponentPropsWithoutRef<'div'> {
  ratio?: string
}

export const AspectRatio = ({
  className,
  ratio = '16 / 9',
  style,
  ...props
}: AspectRatioProps) => (
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

export const Autocomplete = ({
  className,
  type = 'search',
  ...props
}: AutocompleteProps) => (
  <input
    aria-autocomplete="list"
    className={composeClassName('ui-input ui-autocomplete', className)}
    role="combobox"
    type={type}
    {...props}
  />
)

export const Attachment = ({
  className,
  glass = false,
  href,
  ...props
}: AttachmentProps) => {
  const nextClassName = composeClassName(
    'ui-attachment', glassClass('ui-attachment', glass), className
  )

  return href ?
    (
      <a className={nextClassName} href={href} {...props} />
    ) :
    (
      <article className={nextClassName} {...props} />
    )
}

export interface AvatarProps extends ComponentPropsWithRef<'span'> {
  alt?: string
  fallback?: ReactNode
  src?: string
}

export const Avatar = ({
  alt = '',
  children,
  className,
  fallback,
  src,
  ...props
}: AvatarProps) => (
  <span className={composeClassName('ui-avatar', className)} {...props}>
    {src ? <img alt={alt} src={src} /> : <span>{fallback}</span>}
    {children}
  </span>
)

export type BreadcrumbProps = ComponentPropsWithoutRef<'nav'>
export const Breadcrumb = ({
  'aria-label': ariaLabel = 'Breadcrumb',
  className,
  ...props
}: BreadcrumbProps) => (
  <nav
    aria-label={ariaLabel}
    className={composeClassName('ui-breadcrumb', className)}
    {...props}
  />
)

export interface BubbleProps extends ComponentPropsWithoutRef<'article'> {
  from?: MessageFrom
  glass?: LumenGlassProp
}

export const Bubble = ({
  className,
  from = 'assistant',
  glass = false,
  ...props
}: BubbleProps) => (
  <article
    className={composeClassName(
      'ui-bubble', from === 'user' && 'ui-bubble--user', glassClass('ui-bubble', glass), className
    )}
    data-from={from}
    {...props}
  />
)

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  asChild?: boolean
  loading?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

interface ButtonChildProps extends HTMLAttributes<HTMLElement> {
  'data-slot'?: string
  ref?: Ref<HTMLElement> | undefined
}

/* eslint-disable complexity -- The compatibility path resolves native, slotted, loading, size, and disabled states in one public component. */
export const Button = ({
  asChild = false,
  children,
  className,
  disabled,
  loading = false,
  ref,
  size = 'default',
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps) => {
  const buttonClassName = composeClassName(
    'ui-button', `ui-button--${variant}`, size === 'default' ? 'ui-button--default-size' : `ui-button--${size}`, disabled && 'ui-button--disabled', loading && 'ui-button--loading', className
  )

  if (asChild) {
    const child = Children.only(children)

    if (!isValidElement<ButtonChildProps>(child)) {
      throw new TypeError(
        'Button with asChild requires exactly one React element child.'
      )
    }

    const ChildComponent = child.type

    return (
      <ChildComponent
        {...child.props}
        {...props}
        aria-busy={loading ? true : undefined}
        aria-disabled={disabled ? true : undefined}
        className={composeClassName(buttonClassName, child.props.className)}
        data-slot="button"
        ref={ref as Ref<HTMLElement>}
      >
        {loading && <span aria-hidden="true" className="ui-spinner" />}
        {child.props.children}
      </ChildComponent>
    )
  }

  return (
    <button
      aria-busy={loading || undefined}
      className={buttonClassName}
      data-slot="button"
      disabled={disabled}
      ref={ref}
      type={type}
      {...props}
    >
      {loading && <span aria-hidden="true" className="ui-spinner" />}
      {children}
    </button>
  )
}
/* eslint-enable complexity */

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
      className={composeClassName(
        calendar.rootProps.className, glassClass('ui-calendar', glass), className
      )}
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
              <th key={weekday} role="columnheader" scope="col">
                {weekday}
              </th>
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

export type CardProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T> & {
    'data-variant'?: CardVariant
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
      variant === 'muted' && 'ui-card--muted', variant === 'interactive' && 'ui-card--interactive', variant === 'unstyled' && 'ui-card--unstyled', (glass || variant === 'glass') &&
      composeClassName('ui-card--glass', glassIntensityClass(glass)), className
    )}
    data-slot="card"
    data-variant={variant}
    {...props}
    uiClassName="ui-card"
  />
)

export type CardHeaderProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T>
export const CardHeader = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardHeaderProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-header"
    {...props}
    uiClassName="ui-card__header"
  />
)

export type CardTitleProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T>
export const CardTitle = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardTitleProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-title"
    {...props}
    uiClassName="ui-card__title"
  />
)

export type CardDescriptionProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T>
export const CardDescription = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardDescriptionProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-description"
    {...props}
    uiClassName="ui-card__description"
  />
)

export type CardContentProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T>
export const CardContent = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardContentProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-content"
    {...props}
    uiClassName="ui-card__content"
  />
)

export type CardFooterProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T>
export const CardFooter = <T extends ElementType = 'div'>({
  as,
  ...props
}: CardFooterProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="card-footer"
    {...props}
    uiClassName="ui-card__footer"
  />
)

export interface CarouselProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const Carousel = ({
  className,
  glass = false,
  ...props
}: CarouselProps) => (
  <section
    className={composeClassName(
      'ui-carousel', glassClass('ui-carousel', glass), className
    )}
    data-ui-carousel
    {...props}
  />
)

export interface ChartProps extends ComponentPropsWithoutRef<'figure'> {
  caption?: ReactNode
  description?: ReactNode
  glass?: LumenGlassProp
  heading?: ReactNode
  presentation?: 'bare' | 'default'
  summary?: ReactNode
  value?: ReactNode
}

const ChartHeader = ({
  description,
  heading,
  value
}: Pick<ChartProps, 'description' | 'heading' | 'value'>) => {
  if (!heading && !description && !value) return null

  return (
    <header>
      <div className="ui-chart__heading">
        {heading && <h3>{heading}</h3>}
        {description && <p>{description}</p>}
      </div>
      {value && <strong data-ui-chart-value>{value}</strong>}
    </header>
  )
}

export const Chart = ({
  caption,
  children,
  className,
  description,
  glass = false,
  heading,
  presentation = 'default',
  summary,
  value,
  ...props
}: ChartProps) => (
  <figure
    className={composeClassName(
      'ui-chart', presentation === 'bare' && 'ui-chart--bare', glassClass('ui-chart', glass), className
    )}
    {...props}
  >
    <ChartHeader description={description} heading={heading} value={value} />
    {summary && <p className="ui-sr-only" data-ui-chart-summary>{summary}</p>}
    {children}
    {caption && <figcaption>{caption}</figcaption>}
  </figure>
)

interface ChartLegendProps {
  series: readonly LumenChartSeries[]
}

const ChartLegend = ({ series }: ChartLegendProps) => (
  <ul aria-label="Chart legend" className="ui-chart__legend">
    {series.map((item, index) => (
      <li
        className={getLumenChartToneClassName(item.tone, index)}
        key={item.id}
      >
        <span aria-hidden="true" />
        {item.label}
      </li>
    ))}
  </ul>
)

interface ChartDataTableProps {
  categories: readonly (number | string)[]
  formatCategory?: (category: number | string) => string
  formatValue?: (value: number) => string
  series: readonly LumenChartSeries[]
}

const ChartDataTable = ({
  categories,
  formatCategory = String,
  formatValue = String,
  series
}: ChartDataTableProps) => (
  <details className="ui-chart__data">
    <summary>View chart data</summary>
    <div>
      <table>
        <thead>
          <tr>
            <th scope="col">Category</th>
            {series.map(item => (
              <th key={item.id} scope="col">
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map(category => (
            <tr key={getChartCategoryKey(category)}>
              <th scope="row">
                {series
                  .flatMap(item => item.data)
                  .find(datum => datum.x === category)?.xLabel ??
                  formatCategory(category)}
              </th>
              {series.map(item => {
                const datum = item.data.find(
                  candidate => candidate.x === category
                )

                return (
                  <td key={item.id}>
                    {datum?.label ?? formatReactChartTableValue(datum?.y, formatValue)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
)

const formatChartPercentage = (percentage: number) => new Intl.NumberFormat(undefined, {
  maximumFractionDigits: percentage < 0.01 ? 1 : 0,
  style: 'percent'
}).format(percentage)

export interface SparklineProps extends Omit<
  ComponentPropsWithoutRef<'span'>,
  'children'
> {
  area?: boolean
  label?: string
  showEndpoint?: boolean
  tone?: LumenChartTone
  values?: readonly number[]
}

export const Sparkline = ({
  area = false,
  className,
  label = 'Trend',
  showEndpoint = true,
  tone,
  values = emptyChartValues,
  ...props
}: SparklineProps) => {
  const geometry = createLumenLineGeometry(
    values.map((value, index) => ({ x: index, y: value })), { height: 40, padding: 3, width: 120 }
  )

  const resolvedTone = resolveLumenChartTone(tone)
  const endpoint = geometry.points.at(-1)

  return (
    <span
      aria-label={label}
      className={composeClassName(
        'ui-sparkline', `ui-chart-tone--${resolvedTone}`, className
      )}
      role="img"
      {...props}
    >
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 120 40">
        {area &&
          geometry.areaPaths.map(path => (
            <path className="ui-sparkline__area" d={path} key={path} />
          ))}
        <path className="ui-sparkline__line" d={geometry.path} />
        {showEndpoint && endpoint && (
          <circle
            className="ui-sparkline__endpoint"
            cx={endpoint.xCoordinate}
            cy={endpoint.yCoordinate}
            r="2.5"
          />
        )}
      </svg>
      <span className="ui-sr-only">{label}</span>
    </span>
  )
}

export interface BarChartProps extends Omit<ChartProps, 'children'> {
  categoryWidth?: number
  emptyLabel?: ReactNode
  formatCategory?: (category: number | string) => string
  formatValue?: (value: number) => string
  layout?: LumenBarChartLayout
  orientation?: LumenChartOrientation
  series?: readonly LumenChartSeries[]
  showLegend?: boolean
  showTable?: boolean
}

/* eslint-disable complexity -- Chart renderers keep optional semantic and SVG layers colocated. */
export const BarChart = ({
  categoryWidth,
  className,
  emptyLabel = 'No chart data available.',
  formatCategory = String,
  formatValue = String,
  layout = 'grouped',
  orientation = 'vertical',
  series = emptyChartSeries,
  showLegend = series.length > 1,
  showTable = true,
  summary,
  ...props
}: BarChartProps) => {
  const geometry = createLumenBarGeometry(series, {
    ...(categoryWidth === undefined ? {} : { categoryWidth }),
    layout,
    orientation
  })

  const hasData = hasLumenChartData(series)
  const ticks = getLumenChartTicks(geometry.domain)
  const categories = geometry.categories.map(category => category.category)

  const margin =
    orientation === 'horizontal' ?
      {
        bottom: 24,
        left: Math.max(64, Math.min(240, categoryWidth ?? 112)),
        right: 20,
        top: 16
      } :
      { bottom: 52, left: 52, right: 16, top: 16 }

  return (
    <Chart
      className={composeClassName('ui-bar-chart', className)}
      summary={summary ?? formatLumenChartSummary(series, formatValue)}
      {...props}
    >
      {showLegend && hasData && <ChartLegend series={series} />}
      {!hasData && (
        <p className="ui-chart__empty" role="status">
          {emptyLabel}
        </p>
      )}
      <div className="ui-chart__plot" hidden={!hasData}>
        <svg
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        >
          <g className="ui-chart__grid">
            {ticks.map(tick => {
              const coordinate =
                orientation === 'horizontal' ?
                  scaleLumenChartValue(
                    tick, geometry.domain, margin.left, geometry.width - margin.right
                  ) :
                  scaleLumenChartValue(
                    tick, geometry.domain, geometry.height - margin.bottom, margin.top
                  )

              return orientation === 'horizontal' ?
                (
                  <line
                    key={tick}
                    x1={coordinate}
                    x2={coordinate}
                    y1={margin.top}
                    y2={geometry.height - margin.bottom}
                  />
                ) :
                (
                  <line
                    key={tick}
                    x1={margin.left}
                    x2={geometry.width - margin.right}
                    y1={coordinate}
                    y2={coordinate}
                  />
                )
            })}
          </g>
          <g className="ui-chart__axis-labels">
            {geometry.categories.map(category => (
              <text
                dominantBaseline={
                  orientation === 'horizontal' ? 'middle' : undefined
                }
                key={getChartCategoryKey(category.label)}
                textAnchor={orientation === 'horizontal' ? 'end' : 'middle'}
                x={category.x}
                y={category.y}
              >
                {String(category.label)}
              </text>
            ))}
          </g>
          <g className="ui-bar-chart__marks">
            {geometry.marks.map(mark => (
              <rect
                className={getLumenChartToneClassName(mark.tone)}
                height={mark.height}
                key={`${mark.seriesId}:${getChartCategoryKey(mark.category)}`}
                rx="4"
                width={mark.width}
                x={mark.x}
                y={mark.y}
              >
                <title>
                  {`${
                    series
                      .flatMap(item => item.data)
                      .find(datum => datum.x === mark.category)?.xLabel ??
                      formatCategory(mark.category)
                  } · ${mark.seriesLabel}: ${formatValue(mark.value)}`}
                </title>
              </rect>
            ))}
          </g>
        </svg>
      </div>
      {showTable && hasData && (
        <ChartDataTable
          categories={categories}
          formatCategory={formatCategory}
          formatValue={formatValue}
          series={series}
        />
      )}
    </Chart>
  )
}

export interface LineChartProps extends Omit<ChartProps, 'children'> {
  area?: boolean
  emptyLabel?: ReactNode
  formatCategory?: (category: number | string) => string
  formatValue?: (value: number) => string
  markers?: 'all' | 'auto' | 'none' | boolean | number
  referenceValue?: number
  series?: readonly LumenChartSeries[]
  showLegend?: boolean
  showTable?: boolean
}

const getLineChartMarkerStep = (
  markers: LineChartProps['markers'],
  categoryCount: number
): number => {
  if (markers === false || markers === 'none') return Number.POSITIVE_INFINITY

  if (typeof markers === 'number') return Math.max(1, Math.round(markers))

  if (markers === 'auto') return Math.max(1, Math.ceil(categoryCount / 24))

  return 1
}

export const LineChart = ({
  area = false,
  className,
  emptyLabel = 'No chart data available.',
  formatCategory = String,
  formatValue = String,
  markers = 'auto',
  referenceValue,
  series = emptyChartSeries,
  showLegend = series.length > 1,
  showTable = true,
  summary,
  ...props
}: LineChartProps) => {
  const width = 640
  const height = 320
  const padding = 44
  const categories = getLumenChartCategories(series)
  const hasData = hasLumenChartData(series)

  const alignedSeries = series.map(item => ({
    ...item,
    data: alignLumenChartSeries(item, categories).data
  }))

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
  const markerStep = getLineChartMarkerStep(markers, categories.length)

  const referenceY =
    referenceValue === undefined ?
      undefined :
      scaleLumenChartValue(referenceValue, domain, height - padding, padding)

  return (
    <Chart
      className={composeClassName('ui-line-chart', className)}
      summary={summary ?? formatLumenChartSummary(series, formatValue)}
      {...props}
    >
      {showLegend && hasData && <ChartLegend series={series} />}
      {!hasData && (
        <p className="ui-chart__empty" role="status">
          {emptyLabel}
        </p>
      )}
      <div className="ui-chart__plot" hidden={!hasData}>
        <svg
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${width} ${height}`}
        >
          <g className="ui-chart__grid">
            {ticks.map(tick => {
              const y = scaleLumenChartValue(
                tick, domain, height - padding, padding
              )

              return (
                <Fragment key={tick}>
                  <line x1={padding} x2={width - padding} y1={y} y2={y} />
                  <text x={padding - 8} y={y}>
                    {formatValue(tick)}
                  </text>
                </Fragment>
              )
            })}
          </g>
          <g className="ui-chart__axis-labels">
            {categories.map((category, index) => {
              if (index % labelStep !== 0 && index !== categories.length - 1)
                return null

              const denominator = Math.max(1, categories.length - 1)
              const x = padding + (index / denominator) * (width - padding * 2)

              return (
                <text
                  key={getChartCategoryKey(category)}
                  textAnchor="middle"
                  x={x}
                  y={height - 14}
                >
                  {series
                    .flatMap(item => item.data)
                    .find(datum => datum.x === category)?.xLabel ??
                    formatCategory(category)}
                </text>
              )
            })}
          </g>
          {referenceY !== undefined && (
            <line
              className="ui-chart__reference"
              x1={padding}
              x2={width - padding}
              y1={referenceY}
              y2={referenceY}
            />
          )}
          {geometries.map((geometry, index) => {
            const item = series[index]

            if (!item) return null

            const tone = resolveLumenChartTone(item.tone, index)

            return (
              <g
                className={composeClassName(
                  'ui-line-chart__series', getLumenChartToneClassName(tone)
                )}
                key={item.id}
              >
                {area &&
                  geometry.areaPaths.map(path => (
                    <path className="ui-line-chart__area" d={path} key={path} />
                  ))}
                <path className="ui-line-chart__line" d={geometry.path} />
                {Number.isFinite(markerStep) &&
                  geometry.points.map(
                    (point, pointIndex) => pointIndex % markerStep === 0 && (
                      <circle
                        className="ui-line-chart__point"
                        cx={point.xCoordinate}
                        cy={point.yCoordinate}
                        key={getChartCategoryKey(point.x)}
                        r="3"
                      >
                        <title>
                          {`${point.xLabel ?? formatCategory(point.x)} · ${item.label}: ${formatValue(point.y ?? 0)}`}
                        </title>
                      </circle>
                    )
                  )}
              </g>
            )
          })}
        </svg>
      </div>
      {showTable && hasData && (
        <ChartDataTable
          categories={categories}
          formatCategory={formatCategory}
          formatValue={formatValue}
          series={series}
        />
      )}
    </Chart>
  )
}

export interface PieChartProps extends Omit<ChartProps, 'children'> {
  centerLabel?: ReactNode
  centerValue?: ReactNode
  series?: LumenChartSeries
  showLegend?: boolean
  showTable?: boolean
  valueFormatter?: (value: number) => string
  variant?: LumenPieChartVariant
}

export const PieChart = ({
  centerLabel,
  centerValue,
  className,
  series = emptyPieSeries,
  showLegend = true,
  showTable = true,
  summary,
  valueFormatter = String,
  variant = 'donut',
  ...props
}: PieChartProps) => {
  const geometry = createLumenPieGeometry(series.data, { variant })
  const hasData = hasLumenPieData(series.data)

  const renderedSeries = {
    ...series,
    data: series.data.filter(datum => datum.y !== null && Number.isFinite(datum.y) && datum.y > 0)
  }

  const hasCenterLabel = centerLabel !== null && centerLabel !== undefined
  const hasCenterValue = centerValue !== null && centerValue !== undefined

  return (
    <Chart
      className={composeClassName(
        'ui-pie-chart', getLumenPieChartVariantClassName(variant), className
      )}
      summary={summary ?? formatLumenChartSummary([renderedSeries], valueFormatter)}
      {...props}
    >
      {showLegend && hasData && (
        <ul aria-label="Chart legend" className="ui-chart__legend">
          {geometry.slices.map(slice => (
            <li
              className={getLumenChartToneClassName(slice.tone)}
              key={`${typeof slice.x}:${String(slice.x)}`}
            >
              <span aria-hidden="true" />
              {slice.label}
            </li>
          ))}
        </ul>
      )}
      {!hasData && (
        <p className="ui-chart__empty" role="status">
          No chart data available.
        </p>
      )}
      <div className="ui-chart__plot ui-pie-chart__plot" hidden={!hasData}>
        <svg
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${geometry.size} ${geometry.size}`}
        >
          <g className="ui-pie-chart__slices">
            {geometry.slices.map(slice => (
              <path
                className={getLumenChartToneClassName(slice.tone)}
                d={slice.path}
                fillRule="evenodd"
                key={`${typeof slice.x}:${String(slice.x)}`}
              >
                <title>
                  {`${slice.label}: ${valueFormatter(slice.value)} (${formatChartPercentage(slice.percentage)})`}
                </title>
              </path>
            ))}
          </g>
        </svg>
        {variant === 'donut' && (hasCenterLabel || hasCenterValue) && (
          <>
            <div aria-hidden="true" className="ui-pie-chart__center">
              {hasCenterValue && <strong>{centerValue}</strong>}
              {hasCenterLabel && <span>{centerLabel}</span>}
            </div>
            <div className="ui-sr-only">
              {centerValue}
              {' '}
              {centerLabel}
            </div>
          </>
        )}
      </div>
      {showTable && hasData && (
        <details className="ui-chart__data">
          <summary>View chart data</summary>
          <div>
            <table>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Value</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                {geometry.slices.map(slice => (
                  <tr key={`${typeof slice.x}:${String(slice.x)}`}>
                    <th scope="row">{slice.label}</th>
                    <td>{valueFormatter(slice.value)}</td>
                    <td>{formatChartPercentage(slice.percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </Chart>
  )
}

export interface ScatterChartProps extends Omit<ChartProps, 'children'> {
  formatValue?: (value: number) => string
  series?: readonly LumenChartSeries[]
  showLegend?: boolean
  showTable?: boolean
  xScale?: Exclude<LumenChartScaleType, 'categorical'>
}

export const ScatterChart = ({
  className,
  formatValue = String,
  series = emptyChartSeries,
  showLegend = series.length > 1,
  showTable = true,
  summary,
  xScale = 'linear',
  ...props
}: ScatterChartProps) => {
  const geometry = createLumenScatterGeometry(series, { xScale })

  const renderedSeries = series.map(item => ({
    ...item,
    data: geometry.points.filter(point => point.seriesId === item.id)
  })).filter(item => item.data.length > 0)

  const hasData = geometry.points.length > 0

  return (
    <Chart className={composeClassName('ui-scatter-chart', className)} summary={summary ?? formatLumenChartSummary(renderedSeries, formatValue)} {...props}>
      {showLegend && hasData && <ChartLegend series={series} />}
      {!hasData && <p className="ui-chart__empty" role="status">No chart data available.</p>}
      <div className="ui-chart__plot" hidden={!hasData}>
        <svg aria-hidden="true" viewBox={`0 0 ${geometry.width} ${geometry.height}`}>
          <g className="ui-scatter-chart__marks">
            {geometry.points.map((point, pointIndex) => (
              <circle className={getLumenChartToneClassName(point.tone)} cx={point.xCoordinate} cy={point.yCoordinate} key={`${point.seriesId}:${point.id ?? `${getChartCategoryKey(point.x)}:${pointIndex}`}`} r={point.radius}>
                <title>{`${point.xLabel ?? point.x} · ${point.seriesLabel}: ${point.label ?? formatValue(point.y ?? 0)}`}</title>
              </circle>
            ))}
          </g>
        </svg>
      </div>
      {showTable && hasData && (
        <details className="ui-chart__data">
          <summary>View chart data</summary>
          <div>
            <table>
              <thead>
                <tr>
                  <th scope="col">X</th>
                  <th scope="col">Series</th>
                  <th scope="col">Value</th>
                  <th scope="col">Size</th>
                </tr>
              </thead>
              <tbody>
                {geometry.points.map((point, pointIndex) => (
                  <tr key={`${point.seriesId}:${point.id ?? `${getChartCategoryKey(point.x)}:${pointIndex}`}`}>
                    <th scope="row">{point.xLabel ?? point.x}</th>
                    <td>{point.seriesLabel}</td>
                    <td>{point.label ?? formatValue(point.y ?? 0)}</td>
                    <td>
                      {formatReactChartTableValue(point.size, formatValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </Chart>
  )
}

export interface HeatmapProps extends Omit<ChartProps, 'children'> {
  data?: readonly LumenHeatmapDatum[]
  formatValue?: (value: number) => string
  showTable?: boolean
}

export const Heatmap = ({
  className,
  data = emptyHeatmapData,
  formatValue = String,
  showTable = true,
  summary,
  ...props
}: HeatmapProps) => {
  const geometry = createLumenHeatmapGeometry(data)
  const availableCells = geometry.cells.filter(cell => cell.value !== null && Number.isFinite(cell.value))
  const hasData = availableCells.length > 0

  return (
    <Chart className={composeClassName('ui-heatmap', className)} summary={summary ?? `${availableCells.length} available heatmap cells.`} {...props}>
      {!hasData && <p className="ui-chart__empty" role="status">No chart data available.</p>}
      <div className="ui-chart__plot" hidden={!hasData}>
        <svg aria-hidden="true" viewBox={`0 0 ${geometry.width} ${geometry.height}`}>
          <g className="ui-heatmap__cells">
            {availableCells.map(cell => <rect height={Math.max(0, cell.height - 2)} key={cell.id ?? `${getChartCategoryKey(cell.x)}:${getChartCategoryKey(cell.y)}`} opacity={Math.max(0.12, cell.ratio)} width={Math.max(0, cell.width - 2)} x={cell.xCoordinate + 1} y={cell.yCoordinate + 1}><title>{`${cell.xLabel ?? cell.x} · ${cell.yLabel ?? cell.y}: ${cell.label ?? formatValue(cell.value ?? 0)}`}</title></rect>)}
          </g>
        </svg>
      </div>
      {showTable && (
        <details className="ui-chart__data">
          <summary>View chart data</summary>
          <div>
            <table>
              <thead>
                <tr>
                  <th scope="col">Column</th>
                  <th scope="col">Row</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map(cell => (
                  <tr key={cell.id ?? `${getChartCategoryKey(cell.x)}:${getChartCategoryKey(cell.y)}`}>
                    <th scope="row">{cell.xLabel ?? cell.x}</th>
                    <td>{cell.yLabel ?? cell.y}</td>
                    <td>{cell.label ?? (cell.value === null || !Number.isFinite(cell.value) ? 'Not available' : formatValue(cell.value))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </Chart>
  )
}

export interface RangeChartProps extends Omit<ChartProps, 'children'> {
  data?: readonly LumenRangeDatum[]
  formatValue?: (value: number) => string
  showTable?: boolean
  tone?: LumenChartTone
}

export const RangeChart = ({
  className,
  data = emptyRangeData,
  formatValue = String,
  showTable = true,
  summary,
  tone = 'series-1',
  ...props
}: RangeChartProps) => {
  const width = 640
  const height = 320
  const padding = 44
  const geometry = createLumenRangeGeometry(data, { height, padding, width })

  return (
    <Chart className={composeClassName('ui-range-chart', getLumenChartToneClassName(tone), className)} summary={summary ?? (geometry.points.length === 0 ? 'No chart data available.' : `${geometry.points.length} available ranges.`)} {...props}>
      {geometry.points.length === 0 && <p className="ui-chart__empty" role="status">No chart data available.</p>}
      <div className="ui-chart__plot" hidden={geometry.points.length === 0}>
        <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`}>
          <path className="ui-range-chart__area" d={geometry.areaPath} />
          {geometry.points.map(point => (
            <line
              className="ui-range-chart__interval"
              key={point.id ?? String(point.x)}
              x1={point.xCoordinate}
              x2={point.xCoordinate}
              y1={point.highCoordinate}
              y2={point.lowCoordinate}
            >
              <title>{`${point.xLabel ?? point.x}: ${point.label ?? `${formatValue(point.low ?? 0)}–${formatValue(point.high ?? 0)}`}`}</title>
            </line>
          ))}
        </svg>
      </div>
      {showTable && (
        <details className="ui-chart__data">
          <summary>View chart data</summary>
          <div>
            <table>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Low</th>
                  <th scope="col">High</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id ?? String(item.x)}>
                    <th scope="row">{item.xLabel ?? item.x}</th>
                    <td>{item.low === null || !Number.isFinite(item.low) ? 'Not available' : formatValue(item.low)}</td>
                    <td>{item.high === null || !Number.isFinite(item.high) ? 'Not available' : formatValue(item.high)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </Chart>
  )
}

export interface ComboChartProps extends Omit<ChartProps, 'children'> {
  formatValue?: (value: number) => string
  series?: readonly LumenComboSeries[]
  showLegend?: boolean
  showTable?: boolean
}

export const ComboChart = ({
  className,
  formatValue = String,
  series = emptyComboSeries,
  showLegend = true,
  showTable = true,
  summary,
  ...props
}: ComboChartProps) => {
  const width = 640
  const height = 320
  const padding = 44
  const categories = getLumenChartCategories(series)

  const alignedSeries = series.map(item => ({
    ...item,
    data: alignLumenChartSeries(item, categories).data
  }))

  const domain = getLumenChartDomain(alignedSeries.flatMap(item => item.data.map(datum => datum.y)))
  const barSeries = alignedSeries.filter(item => item.mark === 'bar')
  const lineSeries = alignedSeries.filter(item => item.mark !== 'bar')
  const bars = createLumenBarGeometry(barSeries, { domain, height, width })

  const categoryPositions = new Map(
    bars.categories.map(category => [getChartCategoryKey(category.category), category.x])
  )

  const drawableWidth = width - padding * 2

  const alignComboLineDatum = (datum: LumenChartDatum): LumenChartDatum => {
    if (barSeries.length === 0) return datum

    return {
      ...datum,
      x: ((categoryPositions.get(`${typeof datum.x}:${String(datum.x)}`) ?? padding) - padding) / drawableWidth
    }
  }

  const lineGeometryOptions = {
    domain,
    height,
    padding,
    width,
    ...(barSeries.length === 0 ?
      {} :
      {
        xDomain: { max: 1, min: 0 },
        xScale: 'linear' as const
      })
  }

  const lines = lineSeries.map(item => createLumenLineGeometry(
    item.data.map(alignComboLineDatum),
    lineGeometryOptions
  ))

  const hasData = hasLumenChartData(series)

  return (
    <Chart className={composeClassName('ui-combo-chart', className)} summary={summary ?? formatLumenChartSummary(series, formatValue)} {...props}>
      {showLegend && hasData && <ChartLegend series={series} />}
      {!hasData && <p className="ui-chart__empty" role="status">No chart data available.</p>}
      <div className="ui-chart__plot" hidden={!hasData}>
        <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`}>
          <g className="ui-bar-chart__marks">{bars.marks.map(mark => <rect className={getLumenChartToneClassName(mark.tone)} height={mark.height} key={`${mark.seriesId}:${getChartCategoryKey(mark.category)}`} rx="4" width={mark.width} x={mark.x} y={mark.y}><title>{`${mark.seriesLabel}: ${formatValue(mark.value)}`}</title></rect>)}</g>
          {lines.map((geometry, index) => {
            const item = lineSeries[index]

            if (!item) return null

            const tone = resolveLumenChartTone(item.tone, index + barSeries.length)

            return (
              <g className={composeClassName('ui-line-chart__series', getLumenChartToneClassName(tone))} key={item.id}>
                {item.mark === 'area' && geometry.areaPaths.map(path => (
                  <path
                    className="ui-line-chart__area"
                    d={path}
                    key={path}
                  />
                ))}
                <path
                  className="ui-line-chart__line"
                  d={geometry.path}
                />
              </g>
            )
          })}
        </svg>
      </div>
      {showTable && hasData && <ChartDataTable categories={categories} formatValue={formatValue} series={series} />}
    </Chart>
  )
}
/* eslint-enable complexity */

export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type'>
export const Checkbox = ({ className, ref, ...props }: CheckboxProps) => (
  <input
    className={composeClassName('ui-checkbox', className)}
    ref={ref}
    type="checkbox"
    {...props}
  />
)

export interface CheckboxGroupProps extends ComponentPropsWithRef<'fieldset'> {
  invalid?: boolean
  legend?: ReactNode
  orientation?: Orientation
}

export const CheckboxGroup = ({
  children,
  className,
  invalid = false,
  legend,
  orientation = 'vertical',
  ...props
}: CheckboxGroupProps) => (
  <fieldset
    aria-invalid={invalid || undefined}
    className={composeClassName(
      'ui-checkbox-group', `ui-checkbox-group--${orientation}`, className
    )}
    data-invalid={invalid ? 'true' : undefined}
    data-orientation={orientation}
    data-ui-checkbox-group
    {...props}
  >
    {legend && <legend>{legend}</legend>}
    {children}
  </fieldset>
)

export type CollapsibleProps = ComponentPropsWithoutRef<'details'>
export const Collapsible = ({ className, ...props }: CollapsibleProps) => (
  <details
    className={composeClassName('ui-collapsible', className)}
    data-ui-collapsible
    {...props}
  />
)

export interface CodeProps extends ComponentPropsWithoutRef<'figure'> {
  code?: string
  copy?: boolean
  highlighted?: boolean
  label?: ReactNode
  language?: string
  theme?: CodeTheme
  variant?: CodeVariant
  wrap?: boolean
}

const renderCodeToken = (token: LumenCodeToken) => {
  if (!token.kind) return token.value

  return (
    <span
      className={lumenCodeTokenClassNames[token.kind]}
      key={`${token.start}-${token.kind}`}
    >
      {token.value}
    </span>
  )
}

const renderCodeChildren = (
  code: string | undefined,
  children: ReactNode,
  language?: string
) => code === undefined ?
  children :
  tokenizeLumenCode(code, language).map(renderCodeToken)

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

const renderCodeHeader = ({ copy, label, language }: CodeHeaderOptions) => {
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
  wrap = false,
  ...props
}: CodeProps) => {
  const codeChildren = renderCodeChildren(code, children, language)

  if (variant === 'block') {
    return (
      <figure
        className={composeClassName(
          'ui-code ui-code--block', wrap && 'ui-code--wrap', className
        )}
        data-code-theme={theme}
        data-language={language}
        data-slot="code"
        data-ui-code
        {...props}
      >
        {renderCodeHeader({ copy, label, language })}
        {highlighted ?
          (
            children
          ) :
          (
            <pre>
              <code>{codeChildren}</code>
            </pre>
          )}
      </figure>
    )
  }

  return (
    <code
      className={composeClassName('ui-code ui-code--inline', className)}
      data-code-theme={theme}
      data-language={language}
      data-slot="code"
      {...props}
    >
      {code ?? children}
    </code>
  )
}

export interface CopyButtonProps extends ComponentPropsWithoutRef<'button'> {
  copiedLabel?: string
  errorLabel?: string
  label?: string
  resetAfter?: number
  target?: string
  toast?: boolean
  value?: string
}

const dispatchCopyToast = (
  enabled: boolean,
  title: string,
  variant: 'destructive' | 'success'
): void => {
  if (!enabled) return

  document.dispatchEvent(new CustomEvent('ui:toast', {
    detail: { title, variant }
  }))
}

const getCopyButtonLabel = (
  state: 'copied' | 'error' | 'idle',
  copiedLabel: string,
  errorLabel: string,
  label: string
): string => ({ copied: copiedLabel, error: errorLabel, idle: label })[state]

export const CopyButton = ({
  children = 'Copy',
  className,
  copiedLabel = 'Copied to clipboard',
  errorLabel = 'Could not copy to clipboard',
  label = 'Copy to clipboard',
  onClick,
  resetAfter = 2000,
  target,
  toast = false,
  type = 'button',
  value,
  ...props
}: CopyButtonProps) => {
  const [state, setState] = useState<'copied' | 'error' | 'idle'>('idle')
  const resetTimerRef = useRef<ReturnType<typeof globalThis.setTimeout>>(undefined)

  useEffect(() => () => {
    globalThis.clearTimeout(resetTimerRef.current)
  }, [])

  const handleClick = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(event)

    if (event.defaultPrevented) return

    const button = event.currentTarget
    const targetElement = target ? document.querySelector<HTMLElement>(target) : null
    const text = value ?? targetElement?.innerText ?? targetElement?.textContent

    try {
      if (text === undefined) throw new Error(errorLabel)

      await navigator.clipboard.writeText(text)

      setState('copied')

      button.dispatchEvent(new CustomEvent('ui:copy-success', {
        bubbles: true,
        detail: { value: text }
      }))

      dispatchCopyToast(toast, copiedLabel, 'success')
    } catch (error) {
      setState('error')

      button.dispatchEvent(new CustomEvent('ui:copy-error', {
        bubbles: true,
        detail: { error }
      }))

      dispatchCopyToast(toast, errorLabel, 'destructive')
    }

    globalThis.clearTimeout(resetTimerRef.current)

    resetTimerRef.current = globalThis.setTimeout(() => {
      setState('idle')
    }, resetAfter)
  }

  const accessibleLabel = getCopyButtonLabel(
    state, copiedLabel, errorLabel, label
  )

  return (
    <button
      aria-label={accessibleLabel}
      className={composeClassName(
        'ui-button ui-button--outline ui-copy-button', className
      )}
      data-state={state}
      data-ui-copy-button
      onClick={handleClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

export interface CodeTabItem {
  code: string
  label: string
  language?: string
  value: string
}

export interface CodeTabsProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'defaultValue'
> {
  ariaLabel?: string
  copy?: boolean
  initialValue?: string
  items?: readonly CodeTabItem[]
  storageKey?: string
  theme?: CodeTheme
  wrap?: boolean
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
    () => options.filter(
      option => !query || option.toLowerCase().includes(query)
    ), [options, query]
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
      {label && (
        <label className="ui-label" htmlFor={inputId}>
          {label}
        </label>
      )}
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
      <div
        className="ui-combobox__list"
        hidden={!open}
        id={list}
        role="listbox"
      >
        {visibleOptions.map(option => (
          <button
            data-ui-combobox-option
            data-value={option}
            key={option}
            role="option"
            type="button"
            onClick={() => {
              selectOption(option)
            }}
            onMouseDown={event => {
              event.preventDefault()
            }}
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
export const Command = ({
  className,
  glass = false,
  ...props
}: CommandProps) => (
  <div
    className={composeClassName(
      'ui-command', glassClass('ui-command', glass), className
    )}
    data-ui-command
    {...props}
  />
)

export interface ContextMenuProps
  extends ComponentPropsWithoutRef<'menu'>, SurfaceProps {}

export const ContextMenu = ({
  className,
  glass = false,
  ...props
}: ContextMenuProps) => (
  <menu
    className={composeClassName(
      'ui-menu', glassSurfaceClass('ui-menu', glass), className
    )}
    data-surface={resolveSurface(glass)}
    data-ui-context-menu
    role={props.role ?? 'menu'}
    {...props}
  />
)

export type ColorPickerProps = ComponentPropsWithoutRef<'input'>
export const ColorPicker = ({
  className,
  type = 'color',
  ...props
}: ColorPickerProps) => (
  <input
    className={composeClassName('ui-color-picker', className)}
    type={type}
    {...props}
  />
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
    className={composeClassName(
      'ui-data-table', glassClass('ui-data-table', glass), className
    )}
    data-ui-datatable
    data-ui-datatable-name={name}
    data-ui-datatable-selectable={selectable ? 'true' : undefined}
    data-ui-glass-track={glass ? true : undefined}
    {...props}
  >
    {columns.length > 0 ?
      (
        <table>
          <thead>
            <tr>
              {columns.map(column => (
                <th
                  data-ui-datatable-sort-type={column.sort}
                  data-ui-datatable-sortable={
                    column.sortable ? 'true' : undefined
                  }
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
              <tr
                data-ui-datatable-row
                data-value={getDataTableRowValue(row, rowIndex)}
                key={getDataTableRowValue(row, rowIndex)}
              >
                {columns.map(column => (
                  <td
                    data-sort-value={getDataTableSortValue(row[column.key])}
                    key={column.key}
                  >
                    {formatDataTableCell(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) :
      (
        children
      )}
  </div>
)

export type DatePickerProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'defaultValue' | 'type' | 'value'
> &
SurfaceProps & {
  defaultValue?: string
  inputRef?: Ref<HTMLInputElement>
  onValueChange?: (value: string) => void
  placeholder?: string
  value?: string
}

const formatDatePickerDisplayValue = (
  value: string | undefined,
  placeholder: string
): string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return placeholder

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.getTime())) return placeholder

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(date)
}

const stringifyDatePickerConstraint = (
  value: number | string | undefined
): string | undefined => (value === undefined ? undefined : String(value))

/* eslint-disable complexity -- DatePicker coordinates controlled input, disclosure, Calendar, and native form contracts. */
export const DatePicker = ({
  className,
  defaultValue,
  disabled,
  glass = false,
  id,
  inputRef,
  max,
  min,
  name,
  onChange,
  onInvalid,
  onValueChange,
  placeholder,
  required,
  value,
  ...props
}: DatePickerProps) => {
  const generatedId = useId()
  const datePickerId = id ?? generatedId
  const triggerId = `${datePickerId}-trigger`
  const popoverId = `${datePickerId}-popover`
  const rootRef = useRef<HTMLDivElement | null>(null)
  const nativeInputRef = useRef<HTMLInputElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const [open, setOpen] = useState(false)
  const selectedValue = value ?? internalValue
  const hasSelectedValue = selectedValue !== ''
  const placeholderText = placeholder ?? 'Choose a date'
  const maxStr = stringifyDatePickerConstraint(max)
  const minStr = stringifyDatePickerConstraint(min)
  const accessibleLabel = props['aria-label']

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        setOpen(false)
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setOpen(false)

      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)

      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const selectDate = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue)

    onValueChange?.(nextValue)

    if (nativeInputRef.current) {
      nativeInputRef.current.value = nextValue

      nativeInputRef.current.dispatchEvent(
        new Event('input', { bubbles: true })
      )

      nativeInputRef.current.dispatchEvent(
        new Event('change', { bubbles: true })
      )
    }

    setOpen(false)

    globalThis.setTimeout(() => triggerRef.current?.focus())
  }

  return (
    <div
      className={composeClassName(
        'ui-date-picker-field', glass && 'ui-date-picker-field--glass', glass === 'subtle' && 'ui-glass-subtle', glass === 'strong' && 'ui-glass-strong', className
      )}
      data-placeholder={hasSelectedValue ? undefined : 'true'}
      data-ui-date-picker
      data-ui-glass-track={glass ? true : undefined}
      ref={rootRef}
    >
      <input
        aria-hidden="true"
        className="ui-date-picker ui-date-picker__native"
        data-ui-date-picker-native
        data-ui-enhanced="true"
        disabled={disabled}
        id={datePickerId}
        max={max}
        min={min}
        name={name}
        onChange={event => {
          if (value === undefined) setInternalValue(event.currentTarget.value)

          onChange?.(event)
        }}
        onInvalid={event => {
          event.preventDefault()

          triggerRef.current?.setAttribute('aria-invalid', 'true')

          triggerRef.current?.focus()

          onInvalid?.(event)
        }}
        ref={node => {
          nativeInputRef.current = node

          setRefValue(inputRef, node)
        }}
        required={required}
        tabIndex={-1}
        type="date"
        value={selectedValue}
        {...props}
      />
      <div className="ui-date-picker__control" data-ui-date-picker-control>
        <button
          aria-controls={popoverId}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={accessibleLabel}
          aria-required={required ?? undefined}
          className="ui-input ui-date-picker ui-date-picker__trigger"
          data-ui-date-picker-trigger
          disabled={disabled}
          id={triggerId}
          onClick={() => {
            setOpen(current => !current)
          }}
          onKeyDown={event => {
            if (event.key !== 'ArrowDown') return

            event.preventDefault()

            setOpen(true)
          }}
          ref={triggerRef}
          type="button"
        >
          <span data-ui-date-picker-value>
            {formatDatePickerDisplayValue(selectedValue, placeholderText)}
          </span>
          <svg
            aria-hidden="true"
            className="ui-date-picker__icon"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path d="M7 2v3M17 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          </svg>
        </button>
        <div
          aria-label="Choose date"
          className="ui-date-picker__popover"
          data-state={open ? 'open' : 'closed'}
          data-ui-date-picker-popover
          hidden={!open}
          id={popoverId}
          role="dialog"
        >
          <Calendar
            disabled={disabled}
            max={maxStr}
            min={minStr}
            onValueChange={selectDate}
            value={selectedValue}
          />
        </div>
      </div>
    </div>
  )
}
/* eslint-enable complexity */

export type DateRangePickerProps = ComponentPropsWithoutRef<'div'> & {
  onRangeChange?: (range: { end?: string, start?: string }) => void
}

const setDateRangeConstraint = (
  input: HTMLInputElement,
  property: 'max' | 'min',
  value: string
): void => {
  if (value) input[property] = value
  else input.removeAttribute(property)
}

const getDateRangeState = (start: string, end: string): string => {
  if (!start) return 'empty'

  return end ? 'complete' : 'selecting-end'
}

const syncDateRangePickerElement = (
  root: HTMLDivElement
): { end?: string, start?: string } => {
  const inputs = [
    ...root.querySelectorAll<HTMLInputElement>('[data-ui-date-picker-native]')
  ]

  const start = inputs[0]
  const end = inputs.at(-1)

  if (!(start && end) || start === end) return {}

  const datePickers = root.querySelectorAll<HTMLElement>(
    '[data-ui-date-picker]'
  )

  datePickers[0]?.setAttribute('data-range-part', 'start')

  datePickers[datePickers.length - 1]?.setAttribute('data-range-part', 'end')

  setDateRangeConstraint(end, 'min', start.value)

  setDateRangeConstraint(start, 'max', end.value)

  root.dataset.rangeState = getDateRangeState(start.value, end.value)

  const range: { end?: string, start?: string } = {}

  if (end.value) range.end = end.value

  if (start.value) range.start = start.value

  return range
}

export const DateRangePicker = ({
  className,
  onInput,
  onRangeChange,
  ...props
}: DateRangePickerProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (rootRef.current) syncDateRangePickerElement(rootRef.current)
  })

  return (
    <div
      className={composeClassName('ui-date-range-picker', className)}
      data-ui-date-range-picker
      onInput={event => {
        onInput?.(event)

        onRangeChange?.(syncDateRangePickerElement(event.currentTarget))
      }}
      ref={rootRef}
      {...props}
    />
  )
}

export type DialogProps = Omit<ComponentPropsWithoutRef<'dialog'>, 'open'> &
  SurfaceProps &
  Omit<DialogOptions, 'id'> & {
    layout?: 'centered' | 'fullscreen'
  }

export const Dialog = ({
  className,
  defaultOpen,
  glass = false,
  layout = 'centered',
  onClick,
  onClose,
  onOpenChange,
  open,
  ...props
}: DialogProps) => {
  const dialog = useDialog({ defaultOpen, onOpenChange, open })

  return (
    <dialog
      {...dialog.dialogProps}
      {...props}
      className={composeClassName(
        'ui-dialog', layout === 'fullscreen' && 'ui-dialog--fullscreen', glassSurfaceClass('ui-dialog', glass), className
      )}
      data-layout={layout}
      data-surface={resolveSurface(glass)}
      onClick={composeHandlers(onClick, dialog.dialogProps.onClick)}
      onClose={composeHandlers(onClose, dialog.dialogProps.onClose)}
    />
  )
}

export type DirectionProps = ComponentPropsWithoutRef<'div'>
export const Direction = ({
  className,
  dir = 'ltr',
  ...props
}: DirectionProps) => (
  <div
    className={composeClassName('ui-direction', className)}
    dir={dir}
    {...props}
  />
)

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  as?: ElementType
  size?: 'full' | 'lg' | 'md' | 'sm'
}

export const Container = ({
  as = 'div',
  className,
  size = 'lg',
  ...props
}: ContainerProps) => createElement(as, {
  className: composeClassName(
    'ui-container', `ui-container--${size}`, className
  ),
  'data-size': size,
  'data-ui-container': true,
  ...props
})

export interface GridProps extends ComponentPropsWithRef<'div'> {
  as?: ElementType
  columns?: 1 | 2 | 3 | 4 | 6 | 12 | 'auto'
  gap?: 'lg' | 'md' | 'none' | 'sm' | 'xl'
  minItemWidth?: string
}

type LumenCSSProperties = CSSProperties &
  Record<`--ui-${string}`, number | string | undefined>

export const Grid = ({
  as = 'div',
  className,
  columns = 'auto',
  gap = 'md',
  minItemWidth,
  style,
  ...props
}: GridProps) => {
  const gridStyle: LumenCSSProperties = {
    ...style,
    '--ui-grid-min': minItemWidth
  }

  return createElement(as, {
    className: composeClassName(
      'ui-grid', `ui-grid--columns-${columns}`, `ui-grid--gap-${gap}`, className
    ),
    'data-columns': columns,
    'data-ui-grid': true,
    style: gridStyle,
    ...props
  })
}

export interface StackProps extends ComponentPropsWithRef<'div'> {
  align?: 'center' | 'end' | 'start' | 'stretch'
  as?: ElementType
  direction?: Orientation
  gap?: 'lg' | 'md' | 'none' | 'sm' | 'xl'
  justify?: 'between' | 'center' | 'end' | 'start'
  wrap?: boolean
}

export const Stack = ({
  align = 'stretch',
  as = 'div',
  className,
  direction = 'vertical',
  gap = 'md',
  justify = 'start',
  wrap = false,
  ...props
}: StackProps) => createElement(as, {
  className: composeClassName(
    'ui-stack', `ui-stack--${direction}`, `ui-stack--gap-${gap}`, `ui-stack--align-${align}`, `ui-stack--justify-${justify}`, wrap && 'ui-stack--wrap', className
  ),
  'data-direction': direction,
  'data-ui-stack': true,
  ...props
})

export interface VisuallyHiddenProps extends ComponentPropsWithRef<'span'> {
  focusable?: boolean
}

export const VisuallyHidden = ({
  className,
  focusable = false,
  ...props
}: VisuallyHiddenProps) => (
  <span
    className={composeClassName(
      'ui-visually-hidden', focusable && 'ui-visually-hidden--focusable', className
    )}
    data-ui-visually-hidden
    {...props}
  />
)

export interface DrawerProps
  extends ComponentPropsWithoutRef<'dialog'>, SurfaceProps {}

export const Drawer = ({
  className,
  glass = false,
  ...props
}: DrawerProps) => (
  <dialog
    className={composeClassName(
      'ui-drawer', glassSurfaceClass('ui-drawer', glass), className
    )}
    data-surface={resolveSurface(glass)}
    data-ui-drawer
    {...props}
  />
)

export type DropdownMenuProps = ComponentPropsWithoutRef<'menu'> &
  SurfaceProps &
  Omit<DropdownMenuOptions, 'id'>

export const DropdownMenu = ({
  children,
  className,
  defaultOpen,
  glass = false,
  onOpenChange,
  open,
  ...props
}: DropdownMenuProps) => {
  const menu = useDropdownMenu({ defaultOpen, onOpenChange, open })

  return (
    <DropdownMenuContext.Provider value={menu}>
      <menu
        {...menu.rootProps}
        {...props}
        className={composeClassName(
          'ui-menu', glassSurfaceClass('ui-menu', glass), className
        )}
        data-surface={resolveSurface(glass)}
        data-ui-dropdown-menu
      >
        {children}
      </menu>
    </DropdownMenuContext.Provider>
  )
}

export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<'button'>
export const DropdownMenuTrigger = ({
  onClick,
  onKeyDown,
  ...props
}: DropdownMenuTriggerProps) => {
  const menu = requireContext(
    useContext(DropdownMenuContext), 'DropdownMenuTrigger'
  )

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
export const DropdownMenuContent = ({
  className,
  onKeyDown,
  ...props
}: DropdownMenuContentProps) => {
  const menu = requireContext(
    useContext(DropdownMenuContext), 'DropdownMenuContent'
  )

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

export interface DropdownMenuItemProps extends ComponentPropsWithoutRef<'button'> {
  status?: string | undefined
}

export const DropdownMenuItem = ({
  children,
  className,
  disabled = false,
  onClick,
  status,
  ...props
}: DropdownMenuItemProps) => {
  const menu = requireContext(
    useContext(DropdownMenuContext), 'DropdownMenuItem'
  )

  return (
    <button
      {...props}
      aria-disabled={disabled || undefined}
      className={composeClassName('ui-menu__item', className)}
      disabled={disabled}
      onClick={event => {
        onClick?.(event)

        if (!event.defaultPrevented && !disabled) menu.close()
      }}
      role={props.role ?? 'menuitem'}
      type={props.type ?? 'button'}
    >
      <span className="ui-menu__item-label">{children}</span>
      {status && <span className="ui-menu__item-status">{status}</span>}
    </button>
  )
}

export type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<'div'>
export const DropdownMenuSeparator = ({
  className,
  ...props
}: DropdownMenuSeparatorProps) => (
  <div
    className={composeClassName('ui-menu__separator', className)}
    role={props.role ?? 'separator'}
    {...props}
  />
)

export interface EmptyProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
  variant?: 'compact' | 'default'
}
export const Empty = ({
  className,
  glass = false,
  variant = 'default',
  ...props
}: EmptyProps) => (
  <section
    className={composeClassName(
      'ui-empty',
      variant === 'compact' && 'ui-empty--compact',
      glassClass('ui-empty', glass),
      className
    )}
    data-variant={variant}
    {...props}
  />
)

export type KanbanBoardProps = ComponentPropsWithoutRef<'section'>
export const KanbanBoard = ({ className, tabIndex = 0, ...props }: KanbanBoardProps) => (
  <section
    aria-orientation="horizontal"
    className={composeClassName('ui-kanban-board ui-kanban', className)}
    data-ui-kanban
    tabIndex={tabIndex}
    {...props}
  />
)

export interface KanbanColumnProps extends ComponentPropsWithoutRef<'section'> {
  value: string
}
export const KanbanColumn = ({
  className,
  value,
  ...props
}: KanbanColumnProps) => (
  <section
    className={composeClassName('ui-kanban__column', className)}
    data-ui-kanban-column={value}
    {...props}
  />
)

export interface ErrorSummaryProps extends ComponentPropsWithoutRef<'section'> {
  errors?: LumenFormErrorInput
  heading?: ReactNode
}

export const ErrorSummary = ({
  className,
  errors,
  heading = 'There is a problem',
  id = 'ui-error-summary',
  ...props
}: ErrorSummaryProps) => {
  const normalizedErrors = normalizeLumenFormErrors(errors)

  const allErrors: { controlId?: string, message: string, name?: string }[] = [
    ...normalizedErrors.form.map(message => ({ message })),
    ...normalizedErrors.fields
  ]

  const headingId = `${id}-heading`

  return (
    <section
      aria-labelledby={headingId}
      className={composeClassName('ui-error-summary', className)}
      data-ui-error-summary
      hidden={allErrors.length === 0}
      id={id}
      tabIndex={-1}
      {...props}
    >
      <h2 id={headingId}>{heading}</h2>
      <ul>
        {allErrors.map(error => (
          <li
            key={`${error.name ?? 'form'}:${error.controlId ?? ''}:${error.message}`}
          >
            {error.controlId ?
              (
                <a href={`#${error.controlId}`}>{error.message}</a>
              ) :
              (
                error.message
              )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export interface FieldProps extends ComponentPropsWithoutRef<'div'> {
  controlId?: string
  describedBy?: string
  glass?: LumenGlassProp
  invalid?: boolean
}
export const Field = ({
  'aria-describedby': ariaDescribedby,
  className,
  controlId,
  describedBy,
  glass = false,
  invalid = false,
  ...props
}: FieldProps) => {
  const fieldDescribedBy =
    [ariaDescribedby, describedBy].filter(Boolean).join(' ') || undefined

  return (
    <div
      aria-describedby={ariaDescribedby}
      className={composeClassName(
        'ui-field', glassClass('ui-field', glass), className
      )}
      data-invalid={invalid ? 'true' : undefined}
      data-ui-field
      data-ui-field-control={controlId}
      data-ui-field-describedby={fieldDescribedBy}
      {...props}
    />
  )
}

export interface FieldErrorProps extends ComponentPropsWithoutRef<'p'> {
  message?: ReactNode
}

export const FieldError = ({
  children,
  className,
  hidden,
  message,
  ...props
}: FieldErrorProps) => {
  const content = message ?? children

  return (
    <p
      className={composeClassName('ui-field-error', className)}
      data-ui-field-error
      hidden={hidden ?? !content}
      {...props}
    >
      {content}
    </p>
  )
}

export interface FormProps extends ComponentPropsWithRef<'form'> {
  enhance?: boolean
  status?: LumenFormStatus
}

export const Form = ({
  'aria-busy': ariaBusy,
  className,
  enhance = false,
  status = 'idle',
  ...props
}: FormProps) => (
  <form
    aria-busy={ariaBusy ?? (status === 'submitting' ? true : undefined)}
    className={composeClassName('ui-form', className)}
    data-status={status}
    data-ui-form={enhance ? true : undefined}
    {...props}
  />
)

export interface HoverCardProps
  extends ComponentPropsWithoutRef<'aside'>, SurfaceProps {}

export const HoverCard = ({
  className,
  glass = false,
  ...props
}: HoverCardProps) => (
  <aside
    className={composeClassName(
      'ui-hover-card', glassSurfaceClass('ui-hover-card', glass), className
    )}
    data-surface={resolveSurface(glass)}
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

  const accessibility = getIconAccessibility({
    ariaHidden,
    ariaLabel,
    decorative,
    label,
    role
  })

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

export interface PasswordFieldProps extends Omit<
  InputProps,
  'type' | 'visualSize'
> {
  error?: ReactNode
  hideLabel?: string
  hint?: ReactNode
  label?: ReactNode
  showLabel?: string
}

const getPasswordFieldDescribedBy = (
  ariaDescribedBy: string | undefined,
  hintId: string | undefined,
  errorId: string | undefined
): string | undefined => [ariaDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined

const usePasswordVisibility = (
  inputRef: RefObject<HTMLInputElement | null>
) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const form = inputRef.current?.form

    if (!form) return

    const handleReset = () => {
      setVisible(false)
    }

    const hideAfterSuccess = () => {
      if (form.dataset.status === 'success') setVisible(false)
    }

    form.addEventListener('reset', handleReset)

    const observer = new MutationObserver(hideAfterSuccess)

    observer.observe(form, {
      attributeFilter: ['data-status'],
      attributes: true
    })

    return () => {
      form.removeEventListener('reset', handleReset)

      observer.disconnect()
    }
  }, [inputRef])

  const toggleVisibility = () => {
    setVisible(current => !current)

    inputRef.current?.focus({ preventScroll: true })
  }

  return { toggleVisibility, visible }
}

interface PasswordFieldControlProps {
  controlId: string
  describedBy: string | undefined
  error: ReactNode
  forwardedRef: Ref<HTMLInputElement> | undefined
  hideLabel: string
  inputProps: Omit<
    InputProps,
    'aria-describedby' | 'className' | 'id' | 'name' | 'ref' | 'type'
  >
  inputRef: RefObject<HTMLInputElement | null>
  name: string | undefined
  showLabel: string
  toggleVisibility: () => void
  visible: boolean
}

const PasswordFieldControl = ({
  controlId,
  describedBy,
  error,
  forwardedRef,
  hideLabel,
  inputProps,
  inputRef,
  name,
  showLabel,
  toggleVisibility,
  visible
}: PasswordFieldControlProps) => (
  <div className="ui-password-field__control" data-ui-password-field>
    <Input
      {...inputProps}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      id={controlId}
      name={name}
      ref={node => {
        inputRef.current = node

        setRefValue(forwardedRef, node)
      }}
      type={visible ? 'text' : 'password'}
    />
    <Button
      aria-controls={controlId}
      aria-label={visible ? hideLabel : showLabel}
      aria-pressed={visible}
      data-ui-password-toggle
      onClick={toggleVisibility}
      size="icon"
      type="button"
      variant="ghost"
    >
      <span aria-hidden="true">{visible ? 'Hide' : 'Show'}</span>
    </Button>
  </div>
)

interface PasswordFieldMessagesProps {
  error: ReactNode
  errorId: string
  hint: ReactNode
  hintId: string | undefined
}

const PasswordFieldMessages = ({
  error,
  errorId,
  hint,
  hintId
}: PasswordFieldMessagesProps) => (
  <>
    {hint && (
      <p className="ui-field__hint" data-ui-field-hint id={hintId}>
        {hint}
      </p>
    )}
    <FieldError id={errorId} message={error} />
  </>
)

export const PasswordField = ({
  'aria-describedby': ariaDescribedby,
  className,
  error,
  hideLabel = 'Hide password',
  hint,
  id,
  label = 'Password',
  name,
  ref,
  showLabel = 'Show password',
  ...props
}: PasswordFieldProps) => {
  const generatedId = useId()
  const controlId = id ?? `ui-password-${generatedId}`
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = `${controlId}-error`

  const describedBy = getPasswordFieldDescribedBy(
    ariaDescribedby, hintId, error ? errorId : undefined
  )

  const inputRef = useRef<HTMLInputElement | null>(null)
  const { toggleVisibility, visible } = usePasswordVisibility(inputRef)

  return (
    <Field
      className={composeClassName('ui-password-field', className)}
      controlId={controlId}
      invalid={Boolean(error)}
      {...(describedBy ? { describedBy } : {})}
    >
      <Label htmlFor={controlId}>{label}</Label>
      <PasswordFieldControl
        controlId={controlId}
        describedBy={describedBy}
        error={error}
        forwardedRef={ref}
        hideLabel={hideLabel}
        inputProps={props}
        inputRef={inputRef}
        name={name}
        showLabel={showLabel}
        toggleVisibility={toggleVisibility}
        visible={visible}
      />
      <PasswordFieldMessages
        error={error}
        errorId={errorId}
        hint={hint}
        hintId={hintId}
      />
    </Field>
  )
}

export type InputGroupProps = ComponentPropsWithoutRef<'div'>
export const InputGroup = ({ className, ...props }: InputGroupProps) => (
  <div className={composeClassName('ui-input-group', className)} {...props} />
)

export interface InputOTPProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'className' | 'maxLength' | 'type'
> {
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
  ref,
  value,
  ...props
}: InputOTPProps) => {
  const otp = useInputOTP({
    defaultValue: toInputValue(defaultValue),
    disabled,
    inputMode,
    inputRef: ref,
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

export type NumberFieldProps = ComponentPropsWithRef<'input'>
export const NumberField = ({
  className,
  ref,
  type = 'number',
  ...props
}: NumberFieldProps) => (
  <input
    className={composeClassName('ui-input ui-number-field', className)}
    ref={ref}
    type={type}
    {...props}
  />
)

export interface ItemProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'div' | 'li' | 'section'
  glass?: LumenGlassProp
}
export const Item = ({ as = 'div', className, glass = false, ...props }: ItemProps) => createElement(as, {
  className: composeClassName(
    'ui-item', glassClass('ui-item', glass), className
  ),
  'data-slot': 'item',
  ...props
})

export type KbdProps = ComponentPropsWithoutRef<'kbd'>
export const Kbd = ({ className, ...props }: KbdProps) => (
  <kbd className={composeClassName('ui-kbd', className)} {...props} />
)

export interface MarkerProps extends ComponentPropsWithoutRef<'span'> {
  variant?: MarkerVariant
}

export const Marker = ({
  className,
  variant = 'default',
  ...props
}: MarkerProps) => (
  <span
    className={composeClassName(
      'ui-marker', variantClass('ui-marker', variant), className
    )}
    data-variant={variant}
    {...props}
  />
)

export interface MenubarProps
  extends ComponentPropsWithoutRef<'nav'>, SurfaceProps {}

export const Menubar = ({
  className,
  glass = false,
  ...props
}: MenubarProps) => (
  <nav
    className={composeClassName(
      'ui-menubar', glassSurfaceClass('ui-menubar', glass), className
    )}
    data-surface={resolveSurface(glass)}
    data-ui-menubar
    {...props}
  />
)

export interface MessageProps extends ComponentPropsWithoutRef<'article'> {
  from?: MessageFrom
}

export const Message = ({
  className,
  from = 'assistant',
  ...props
}: MessageProps) => (
  <article
    className={composeClassName('ui-message', `ui-message--${from}`, className)}
    data-from={from}
    {...props}
  />
)

export interface MessageScrollerProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const MessageScroller = ({
  className,
  glass = false,
  ...props
}: MessageScrollerProps) => (
  <div
    className={composeClassName(
      'ui-message-scroller', glassClass('ui-message-scroller', glass), className
    )}
    {...props}
  />
)

export interface NativeSelectProps extends ComponentPropsWithRef<'select'> {
  options?: SelectOption[]
  placeholder?: string
  visualSize?: 'default' | 'lg' | 'sm'
}

export const NativeSelect = ({
  children,
  className,
  defaultValue,
  options = emptyOptions,
  placeholder,
  ref,
  value,
  visualSize = 'default',
  ...props
}: NativeSelectProps) => {
  const placeholderDefaultValue =
    placeholder && value === undefined && defaultValue === undefined ?
      '' :
      undefined

  return (
    <select
      className={composeClassName(
        'ui-select', visualSize === 'sm' && 'ui-select--sm', visualSize === 'lg' && 'ui-select--lg', className
      )}
      defaultValue={defaultValue ?? placeholderDefaultValue}
      ref={ref}
      value={value}
      {...props}
    >
      {placeholder && (
        <option disabled value="">
          {placeholder}
        </option>
      )}
      {children}
      {options.map(normalizeOption).map(option => (
        <option
          disabled={option.disabled}
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
}

export interface PhoneInputProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'defaultValue'
> {
  countries?: SelectOption[]
  countryOptions?: readonly LumenPhoneCountry[]
  countryLabel?: string
  countryName?: string
  defaultCountryValue?: string
  defaultValue?: string
  invalidNumberMessage?: string
  locale?: LumenPhoneCountryOptions['locale']
  name?: string
  onValueChange?: (value: LumenPhoneNumber) => void
  placeholder?: string
  showValidationError?: boolean
  size?: 'default' | 'lg' | 'sm'
  value?: LumenPhoneNumber
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

interface ResolvedMetadataPhoneInputProps extends Omit<PhoneInputProps, 'countries'> {
  countryLabel: string
  countryName: string
  defaultCountryValue: string
  invalidNumberMessage: string
  name: string
  placeholder: string
  showValidationError: boolean
  size: 'default' | 'lg' | 'sm'
}

const getPhoneInputOptions = (
  locale: LumenPhoneCountryOptions['locale']
): LumenPhoneCountryOptions => locale === undefined ? {} : { locale }

const getBooleanAttribute = (value: boolean): true | undefined => value ? true : undefined

const getPhoneErrorId = (invalid: boolean, name: string): string | undefined => (
  invalid ? `${name}-error` : undefined
)

const PhoneInputError = ({
  invalid,
  message,
  name
}: {
  invalid: boolean
  message: string
  name: string
}) => invalid ?
  (
    <span className="ui-visually-hidden" id={`${name}-error`} role="alert">
      {message}
    </span>
  ) :
  null

const MetadataPhoneInput = ({
  className,
  countryOptions,
  countryLabel,
  countryName,
  defaultCountryValue,
  defaultValue,
  invalidNumberMessage,
  locale,
  name,
  onValueChange,
  placeholder,
  showValidationError,
  size,
  value,
  ...props
}: ResolvedMetadataPhoneInputProps) => {
  const { selectClass, inputClass } = phoneInputSizeModifiers(size)
  const phoneOptions = useMemo(() => getPhoneInputOptions(locale), [locale])

  const metadataCountries = useMemo(
    () => countryOptions ?? getLumenPhoneCountries(phoneOptions),
    [countryOptions, phoneOptions]
  )

  const initialCountry = useMemo(
    () => resolveReactPhoneInputCountry(metadataCountries, defaultCountryValue, locale, value),
    [defaultCountryValue, locale, metadataCountries, value]
  )

  const [internalValue, setInternalValue] = useState<LumenPhoneNumber>(() => (
    defaultValue ?
      resolveReactPhoneInputValue(
        metadataCountries,
        initialCountry,
        defaultValue,
        phoneOptions
      ) :
      { country: initialCountry, e164: null, isValid: false, nationalNumber: '' }
  ))

  const phoneValue = value === undefined || value.country.regionCode === initialCountry.regionCode ?
    value ?? internalValue :
    resolveReactPhoneInputValue(
      metadataCountries,
      initialCountry,
      value.nationalNumber,
      phoneOptions
    )

  const resolvedOptions = metadataCountries.map(country => ({
    disabled: false,
    label: country.pickerLabel,
    value: country.regionCode
  }))

  const commitValue = (nextValue: LumenPhoneNumber): void => {
    if (value === undefined) setInternalValue(nextValue)

    onValueChange?.(nextValue)
  }

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const selectedCountry = metadataCountries.find(country => (
      country.regionCode === event.currentTarget.value ||
      country.callingCode === event.currentTarget.value
    ))

    if (selectedCountry) {
      commitValue(resolveLumenPhoneNumber(
        selectedCountry,
        phoneValue.nationalNumber,
        phoneOptions
      ))
    }
  }

  const handleNumberChange = (event: ChangeEvent<HTMLInputElement>): void => {
    commitValue(resolveReactPhoneInputValue(
      metadataCountries,
      phoneValue.country,
      event.currentTarget.value,
      phoneOptions
    ))
  }

  const invalid = showValidationError && phoneValue.nationalNumber.length > 0 && !phoneValue.isValid

  return (
    <div
      className={composeClassName('ui-phone-input ui-input-group', className)}
      data-invalid={getBooleanAttribute(invalid)}
      {...props}
    >
      <select
        aria-label={countryLabel}
        className={composeClassName(
          'ui-select ui-phone-input__country', selectClass
        )}
        name={countryName}
        onChange={handleCountryChange}
        value={phoneValue.country.regionCode}
      >
        {resolvedOptions.map(option => (
          <option
            disabled={option.disabled}
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
      <input
        autoComplete="tel"
        aria-errormessage={getPhoneErrorId(invalid, name)}
        aria-invalid={getBooleanAttribute(invalid)}
        className={composeClassName(
          'ui-input ui-phone-input__number', inputClass
        )}
        inputMode="tel"
        name={name}
        onChange={handleNumberChange}
        placeholder={placeholder}
        type="tel"
        value={phoneValue.nationalNumber}
      />
      <PhoneInputError invalid={invalid} message={invalidNumberMessage} name={name} />
    </div>
  )
}

const LegacyPhoneInput = ({
  className,
  countries,
  countryOptions: _countryOptions,
  countryLabel = 'Country code',
  countryName = 'country',
  defaultCountryValue,
  defaultValue,
  invalidNumberMessage: _invalidNumberMessage,
  locale: _locale,
  name = 'phone',
  onValueChange: _onValueChange,
  placeholder = 'Phone number',
  showValidationError: _showValidationError,
  size = 'default',
  value: _value,
  ...props
}: PhoneInputProps & { countries: SelectOption[] }) => {
  const { inputClass, selectClass } = phoneInputSizeModifiers(size)

  return (
    <div
      className={composeClassName('ui-phone-input ui-input-group', className)}
      {...props}
    >
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

export const PhoneInput = (props: PhoneInputProps) => {
  if (props.countries) {
    return <LegacyPhoneInput {...props} countries={props.countries} />
  }

  return (
    <MetadataPhoneInput
      {...props}
      countryLabel={props.countryLabel ?? 'Country code'}
      countryName={props.countryName ?? 'country'}
      defaultCountryValue={props.defaultCountryValue ?? 'US'}
      invalidNumberMessage={props.invalidNumberMessage ?? 'Enter a complete phone number.'}
      name={props.name ?? 'phone'}
      placeholder={props.placeholder ?? 'Phone number'}
      showValidationError={props.showValidationError ?? true}
      size={props.size ?? 'default'}
    />
  )
}

export interface NavigationMenuProps
  extends ComponentPropsWithoutRef<'nav'>, SurfaceProps {
  variant?: 'default' | 'unstyled'
}

export const NavigationMenu = ({
  className,
  glass = false,
  variant = 'default',
  ...props
}: NavigationMenuProps) => (
  <nav
    className={composeClassName(
      'ui-navigation-menu', variant === 'unstyled' && 'ui-navigation-menu--unstyled', glassSurfaceClass('ui-navigation-menu', glass), className
    )}
    data-slot="navigation-menu"
    data-surface={resolveSurface(glass)}
    data-ui-navigation-menu
    data-variant={variant}
    {...props}
  />
)

export interface ContextNavigationProps
  extends ComponentPropsWithoutRef<'div'> {
  context?: ReactNode
  variant?: 'default' | 'unstyled'
}

export const ContextNavigation = ({
  children,
  className,
  context,
  variant = 'default',
  ...props
}: ContextNavigationProps) => (
  <div
    className={composeClassName(
      'ui-context-navigation',
      variant === 'unstyled' && 'ui-context-navigation--unstyled',
      className
    )}
    data-slot="context-navigation"
    data-variant={variant}
    {...props}
  >
    {context && (
      <div
        className="ui-context-navigation__context"
        data-slot="context-navigation-context"
      >
        {context}
      </div>
    )}
    {children}
  </div>
)

export type PaginationProps = ComponentPropsWithoutRef<'nav'>
export const Pagination = ({
  'aria-label': ariaLabel = 'Pagination',
  className,
  ...props
}: PaginationProps) => (
  <nav
    aria-label={ariaLabel}
    className={composeClassName('ui-pagination', className)}
    {...props}
  />
)

export type PopoverProps = ComponentPropsWithoutRef<'div'> &
  SurfaceProps &
  Omit<PopoverOptions, 'id'>

export const Popover = ({
  children,
  className,
  defaultOpen,
  glass = false,
  onOpenChange,
  open,
  ...props
}: PopoverProps) => {
  const popover = usePopover({ defaultOpen, onOpenChange, open })

  return (
    <PopoverContext.Provider value={popover}>
      <div
        {...popover.rootProps}
        {...props}
        className={composeClassName(
          'ui-popover', glassSurfaceClass('ui-popover', glass), className
        )}
        data-surface={resolveSurface(glass)}
        data-ui-popover
      >
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export type PopoverTriggerProps = ComponentPropsWithoutRef<'button'>
export const PopoverTrigger = ({
  onClick,
  onKeyDown,
  ...props
}: PopoverTriggerProps) => {
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

export type RadioGroupProps = ComponentPropsWithoutRef<'fieldset'>
export const RadioGroup = ({ className, ...props }: RadioGroupProps) => (
  <fieldset
    className={composeClassName('ui-radio-group', className)}
    data-ui-radio-group
    {...props}
  />
)

/* eslint-disable @stylistic/padding-line-between-statements, @eslint-react/no-array-index-key */
/* eslint-disable @eslint-react/no-children-to-array, @eslint-react/no-clone-element */
/* Resizable preserves pane element tags while injecting pane sizing props and handles. */
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
export const RichTextEditor = ({
  className,
  glass = false,
  ...props
}: RichTextEditorProps) => (
  <section
    className={composeClassName(
      'ui-rich-text-editor', glassClass('ui-rich-text-editor', glass), className
    )}
    data-ui-rich-text-editor
    {...props}
  />
)

export interface ScrollAreaProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const ScrollArea = ({
  className,
  glass = false,
  ...props
}: ScrollAreaProps) => (
  <div
    className={composeClassName(
      'ui-scroll-area', glassClass('ui-scroll-area', glass), className
    )}
    {...props}
  />
)

export interface ScrollProgressProps extends ComponentPropsWithoutRef<'div'> {
  position?: 'bottom' | 'top'
}
export const ScrollProgress = ({
  'aria-label': ariaLabel = 'Reading progress',
  className,
  position = 'top',
  ...props
}: ScrollProgressProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    let frame = 0

    const update = () => {
      frame = 0

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

      const bar = root.querySelector<HTMLElement>('.ui-scroll-progress__bar')

      root.setAttribute('aria-valuenow', `${Math.round(percentage)}`)

      if (bar) bar.style.transform = `scaleX(${percentage / 100})`
    }

    const scheduleUpdate = () => {
      if (frame) return

      frame = window.requestAnimationFrame(update)
    }

    scheduleUpdate()

    window.addEventListener('resize', scheduleUpdate, { passive: true })

    window.addEventListener('scroll', scheduleUpdate, { passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)

      window.removeEventListener('resize', scheduleUpdate)

      window.removeEventListener('scroll', scheduleUpdate)
    }
  }, [])

  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={0}
      className={composeClassName(
        'ui-scroll-progress', position === 'bottom' && 'ui-scroll-progress--bottom', className
      )}
      data-position={position}
      data-ui-scroll-progress
      ref={rootRef}
      role="progressbar"
      {...props}
    >
      <span className="ui-scroll-progress__bar" />
    </div>
  )
}

export interface ScheduleProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const Schedule = ({
  className,
  glass = false,
  ...props
}: ScheduleProps) => (
  <section
    className={composeClassName(
      'ui-schedule', glassClass('ui-schedule', glass), className
    )}
    data-ui-schedule
    {...props}
  />
)

export type SearchFieldProps = ComponentPropsWithRef<'input'>
export const SearchField = ({
  className,
  ref,
  type = 'search',
  ...props
}: SearchFieldProps) => (
  <input
    className={composeClassName('ui-input ui-search-field', className)}
    ref={ref}
    type={type}
    {...props}
  />
)

export interface SelectProps
  extends
  Omit<
    NativeSelectProps,
    | 'defaultValue' |
    'disabled' |
    'id' |
    'name' |
    'onChange' |
    'options' |
    'placeholder' |
    'required' |
    'size' |
    'value'
  >,
  SelectOptions {
  glass?: LumenGlassProp
  inputRef?: Ref<HTMLSelectElement>
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
  inputRef,
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
      className={composeClassName(
        'ui-select-field', glassClass('ui-select-field', glass), className
      )}
      data-ui-glass-track={glass ? true : undefined}
    >
      <select
        {...select.nativeSelectProps}
        {...props}
        className={composeClassName('ui-select ui-select__native', sizeClass)}
        onChange={composeHandlers(onChange, select.nativeSelectProps.onChange)}
        ref={inputRef}
      >
        {placeholder && (
          <option data-ui-select-placeholder disabled value="">
            {placeholder}
          </option>
        )}
        {children}
        {select.options.map(option => (
          <option
            disabled={option.disabled}
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <div {...select.controlProps} className="ui-select__control">
        <button
          {...select.triggerProps}
          className={composeClassName(
            'ui-select ui-select__trigger', sizeClass
          )}
          type={select.triggerProps.type ?? 'button'}
        >
          <span data-ui-select-value>{select.triggerText}</span>
        </button>

        <div {...select.listProps} className="ui-select__list">
          {select.options.map(option => {
            const optionProps = select.getOptionProps(option)

            return (
              <button
                key={option.value}
                {...optionProps}
                type={optionProps.type ?? 'button'}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export interface ListBoxProps extends Omit<
  ComponentPropsWithRef<'select'>,
  'children' | 'defaultValue' | 'onChange' | 'size' | 'value'
> {
  defaultValue?: string | string[]
  emptyMessage?: ReactNode
  label?: ReactNode
  loading?: boolean
  loadingMessage?: ReactNode
  onValueChange?: (values: string[]) => void
  options?: SelectOption[]
  selectionFollowsFocus?: boolean
  value?: string | string[]
}

interface ListBoxOptionGroup {
  label?: string
  options: (Option & { index: number })[]
}

const groupListBoxOptions = (options: Option[]): ListBoxOptionGroup[] => {
  const groups: ListBoxOptionGroup[] = []

  options.forEach((option, index) => {
    const currentGroup = groups.at(-1)

    if (!currentGroup || currentGroup.label !== option.section) {
      groups.push({
        ...(option.section ? { label: option.section } : {}),
        options: [{ ...option, index }]
      })

      return
    }

    currentGroup.options.push({ ...option, index })
  })

  return groups
}

const getListBoxGroupKey = (group: ListBoxOptionGroup): string => {
  const values = group.options.map(option => option.value).join('|')

  return group.label ? `${group.label}:${values}` : values
}

const optionalTrue = (value: boolean | undefined): true | undefined => value ? true : undefined

const ListBoxNativeOptions = ({
  groups
}: {
  groups: ListBoxOptionGroup[]
}) => groups.map(group => {
  const options = group.options.map(option => (
    <option disabled={option.disabled} key={option.value} value={option.value}>
      {option.label}
    </option>
  ))

  return group.label ?
    (
      <optgroup key={getListBoxGroupKey(group)} label={group.label}>
        {options}
      </optgroup>
    ) :
    (
      <Fragment key={getListBoxGroupKey(group)}>{options}</Fragment>
    )
})

interface ListBoxVisibleOptionsProps {
  activeIndex: number
  controlId: string
  emptyMessage: ReactNode
  groups: ListBoxOptionGroup[]
  loading: boolean
  onSelect: (index: number) => void
  selectedValues: ReadonlySet<string>
}

const ListBoxVisibleOptions = ({
  activeIndex,
  controlId,
  emptyMessage,
  groups,
  loading,
  onSelect,
  selectedValues
}: ListBoxVisibleOptionsProps) => {
  if (loading) return null

  if (!groups.length) {
    return (
      <div aria-disabled="true" className="ui-list-box__empty" role="option">
        {emptyMessage}
      </div>
    )
  }

  return groups.map(group => {
    const groupKey = getListBoxGroupKey(group)
    const safeGroupKey = groupKey.replaceAll(/[^a-zA-Z0-9_-]/g, '-')
    const groupLabelId = group.label ? `${controlId}-group-${safeGroupKey}` : undefined

    const options = group.options.map(option => (
      <div
        aria-disabled={option.disabled ? true : undefined}
        aria-selected={selectedValues.has(option.value)}
        className={composeClassName(
          'ui-list-box__option', option.index === activeIndex && 'ui-list-box__option--active'
        )}
        data-active={option.index === activeIndex ? 'true' : undefined}
        data-ui-list-box-option
        data-value={option.value}
        key={option.value}
        onClick={() => {
          onSelect(option.index)
        }}
        role="option"
      >
        {option.label}
      </div>
    ))

    if (!group.label) return <Fragment key={groupKey}>{options}</Fragment>

    return (
      <div aria-labelledby={groupLabelId} key={groupKey} role="group">
        <div className="ui-list-box__section" id={groupLabelId}>
          {group.label}
        </div>
        {options}
      </div>
    )
  })
}

const normalizeListBoxValues = (
  value: string | string[] | undefined
): string[] => {
  if (value === undefined) return []

  return Array.isArray(value) ? value : [value]
}

const findLastEnabledOptionIndex = (options: readonly Option[]): number => {
  let lastEnabledIndex = -1

  for (const [index, option] of options.entries()) {
    if (!option.disabled) lastEnabledIndex = index
  }

  return lastEnabledIndex
}

const getListBoxSelectedValues = (
  controlledValue: string | string[] | undefined,
  internalValues: string[]
): string[] => controlledValue === undefined ?
  internalValues :
  normalizeListBoxValues(controlledValue)

const getListBoxSelectValue = (
  multiple: boolean,
  selectedValues: string[]
): string | string[] => (multiple ? selectedValues : (selectedValues[0] ?? ''))

const ListBoxLabel = ({
  controlId,
  label
}: {
  controlId: string
  label: ReactNode
}) => label ?
  (
    <label className="ui-label" htmlFor={controlId}>
      {label}
    </label>
  ) :
  null

const normalizeListBoxProps = ({
  disabled = false,
  emptyMessage = 'No options available',
  loading = false,
  loadingMessage = 'Loading options',
  multiple = false,
  options = emptyOptions,
  required = false,
  selectionFollowsFocus = false,
  ...props
}: ListBoxProps) => ({
  disabled,
  emptyMessage,
  loading,
  loadingMessage,
  multiple,
  options,
  required,
  selectionFollowsFocus,
  ...props
})

export const ListBox = (inputProps: ListBoxProps) => {
  const {
    className,
    defaultValue,
    disabled,
    emptyMessage,
    id,
    label,
    loading,
    loadingMessage,
    multiple,
    name,
    onValueChange,
    options,
    ref,
    required,
    selectionFollowsFocus,
    value,
    ...props
  } = normalizeListBoxProps(inputProps)

  const generatedId = useId()
  const controlId = id ?? `ui-list-box-${generatedId}`

  const normalizedOptions = options.map(
    option => typeof option === 'string' ? { label: option, value: option } : option
  )

  const optionGroups = groupListBoxOptions(normalizedOptions)
  const [internalValues, setInternalValues] = useState(() => normalizeListBoxValues(defaultValue))
  const selectedValues = getListBoxSelectedValues(value, internalValues)
  const selectedSet = new Set(selectedValues)

  const firstEnabledIndex = Math.max(
    0, normalizedOptions.findIndex(option => !option.disabled)
  )

  const [activeIndex, setActiveIndex] = useState(firstEnabledIndex)
  const selectRef = useRef<HTMLSelectElement | null>(null)
  const typeaheadRef = useRef('')

  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const commitValues = (nextValues: string[]) => {
    if (value === undefined) {
      setInternalValues(nextValues)
    }

    onValueChange?.(nextValues)

    const select = selectRef.current

    if (!select) return

    for (const option of select.options) {
      option.selected = nextValues.includes(option.value)
    }

    select.dispatchEvent(new Event('input', { bubbles: true }))

    select.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const selectOption = (index: number) => {
    const option = normalizedOptions[index]

    if (!option || option.disabled || disabled || loading) return

    const optionValue = option.value
    let nextValues: string[]

    if (!multiple) {
      nextValues = [optionValue]
    } else if (selectedSet.has(optionValue)) {
      nextValues = selectedValues.filter(
        selectedValue => selectedValue !== optionValue
      )
    } else {
      nextValues = [...selectedValues, optionValue]
    }

    commitValues(nextValues)
  }

  const moveActive = (direction: 1 | -1) => {
    if (!normalizedOptions.length || loading) return

    let nextIndex = activeIndex

    for (const _option of normalizedOptions) {
      nextIndex =
        (nextIndex + direction + normalizedOptions.length) %
        normalizedOptions.length

      if (!normalizedOptions[nextIndex]?.disabled) {
        setActiveIndex(nextIndex)

        if (selectionFollowsFocus) selectOption(nextIndex)

        return
      }
    }
  }

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current)
    }, []
  )

  useEffect(() => {
    const select = selectRef.current
    const form = select?.form

    if (!form || value !== undefined) return

    const handleReset = () => {
      setInternalValues(normalizeListBoxValues(defaultValue))

      setActiveIndex(firstEnabledIndex)
    }

    form.addEventListener('reset', handleReset)

    return () => {
      form.removeEventListener('reset', handleReset)
    }
  }, [defaultValue, firstEnabledIndex, value])

  const handleNavigationKey = (key: string): boolean => {
    if (key === 'ArrowDown') moveActive(1)
    else if (key === 'ArrowUp') moveActive(-1)
    else if (key === 'Home') {
      setActiveIndex(firstEnabledIndex)

      if (selectionFollowsFocus) selectOption(firstEnabledIndex)
    } else if (key === 'End') {
      const lastEnabledIndex = findLastEnabledOptionIndex(normalizedOptions)

      if (lastEnabledIndex >= 0) {
        setActiveIndex(lastEnabledIndex)

        if (selectionFollowsFocus) selectOption(lastEnabledIndex)
      }
    } else if (key === 'Enter' || key === ' ') selectOption(activeIndex)
    else return false

    return true
  }

  const handleTypeaheadKey = (event: KeyboardEvent<HTMLDivElement>): boolean => {
    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) return false

    typeaheadRef.current += event.key.toLowerCase()

    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current)

    typeaheadTimerRef.current = setTimeout(() => {
      typeaheadRef.current = ''
    }, 700)

    const nextIndex = normalizedOptions.findIndex(
      option => !option.disabled &&
        option.label.toLowerCase().startsWith(typeaheadRef.current)
    )

    if (nextIndex >= 0) {
      setActiveIndex(nextIndex)

      if (selectionFollowsFocus) selectOption(nextIndex)
    }

    return true
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (handleNavigationKey(event.key) || handleTypeaheadKey(event)) event.preventDefault()
  }

  return (
    <div
      className={composeClassName('ui-list-box', className)}
      data-multiple={multiple ? 'true' : undefined}
      data-ui-list-box
    >
      <ListBoxLabel controlId={controlId} label={label} />
      <select
        {...props}
        className="ui-list-box__native"
        data-ui-enhanced
        data-ui-list-box-native
        disabled={disabled || loading}
        id={controlId}
        multiple={multiple}
        name={name}
        ref={node => {
          selectRef.current = node

          setRefValue(ref, node)
        }}
        required={required}
        value={getListBoxSelectValue(multiple, selectedValues)}
      >
        <ListBoxNativeOptions groups={optionGroups} />
      </select>
      <div
        aria-busy={optionalTrue(loading)}
        aria-disabled={optionalTrue(disabled || loading)}
        aria-multiselectable={optionalTrue(multiple)}
        className="ui-list-box__list"
        data-ui-list-box-list
        onKeyDown={handleListKeyDown}
        role="listbox"
        tabIndex={disabled || loading ? undefined : 0}
      >
        <ListBoxVisibleOptions
          activeIndex={activeIndex}
          controlId={controlId}
          emptyMessage={emptyMessage}
          groups={optionGroups}
          loading={loading}
          onSelect={index => {
            setActiveIndex(index)

            selectOption(index)
          }}
          selectedValues={selectedSet}
        />
      </div>
      {loading ?
        (
          <p className="ui-list-box__status" role="status">
            {loadingMessage}
          </p>
        ) :
        null}
    </div>
  )
}

export interface SeparatorProps extends ComponentPropsWithRef<'hr'> {
  orientation?: Orientation
}

export const Separator = ({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) => (
  <hr
    aria-orientation={orientation}
    className={composeClassName(
      'ui-separator', `ui-separator--${orientation}`, className
    )}
    data-orientation={orientation}
    {...props}
  />
)

export interface SheetProps
  extends ComponentPropsWithoutRef<'dialog'>, SurfaceProps {}

export const Sheet = ({
  className,
  glass = false,
  ...props
}: SheetProps) => (
  <dialog
    className={composeClassName(
      'ui-sheet', glassSurfaceClass('ui-sheet', glass), className
    )}
    data-surface={resolveSurface(glass)}
    data-ui-sheet
    {...props}
  />
)

export interface SidebarProps
  extends ComponentPropsWithoutRef<'aside'>, SurfaceProps {
  variant?: 'default' | 'unstyled'
}

export const Sidebar = ({
  className,
  glass = false,
  variant = 'default',
  ...props
}: SidebarProps) => (
  <aside
    className={composeClassName(
      'ui-sidebar', variant === 'unstyled' && 'ui-sidebar--unstyled', glassSurfaceClass('ui-sidebar', glass), className
    )}
    data-slot="sidebar"
    data-surface={resolveSurface(glass)}
    data-variant={variant}
    {...props}
  />
)

export type SliderProps = ComponentPropsWithRef<'input'>
export const Slider = ({
  className,
  ref,
  type = 'range',
  ...props
}: SliderProps) => (
  <input
    className={composeClassName('ui-slider', className)}
    ref={ref}
    type={type}
    {...props}
  />
)

export type SonnerProps = ComponentPropsWithoutRef<'div'>
export const Sonner = ({ className, ...props }: SonnerProps) => (
  <div
    className={composeClassName('ui-sonner', className)}
    data-ui-sonner
    {...props}
  />
)

export type SwitchProps = Omit<ComponentPropsWithRef<'input'>, 'type'>
export const Switch = ({
  className,
  ref,
  role = 'switch',
  ...props
}: SwitchProps) => (
  <input
    className={composeClassName('ui-switch', className)}
    ref={ref}
    role={role}
    type="checkbox"
    {...props}
  />
)

export interface TableProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const Table = ({ className, glass = false, ...props }: TableProps) => (
  <div
    className={composeClassName(
      'ui-table-wrap', glassClass('ui-table-wrap', glass), className
    )}
    data-slot="table"
    {...props}
  />
)

export interface TabsProps
  extends
  Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'id' | 'onChange'>,
  Omit<TabsOptions, 'id'> {
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
        className={composeClassName(
          'ui-tabs', glassClass('ui-tabs', glass), className
        )}
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
export const TabsTrigger = ({
  onClick,
  onKeyDown,
  value,
  ...props
}: TabsTriggerProps) => {
  const tabs = requireContext(useContext(TabsContext), 'TabsTrigger')

  return (
    <button
      {...tabs.getTriggerProps(value, props)}
      onClick={composeHandlers(onClick, tabs.getTriggerProps(value).onClick)}
      onKeyDown={composeHandlers(
        onKeyDown, tabs.getTriggerProps(value).onKeyDown
      )}
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

const emptyCodeTabItems: readonly CodeTabItem[] = []

export const CodeTabs = ({
  ariaLabel = 'Code examples',
  className,
  copy = true,
  initialValue,
  items = emptyCodeTabItems,
  storageKey,
  theme = 'auto',
  wrap = true,
  ...props
}: CodeTabsProps) => {
  const selectedValue = initialValue ?? items[0]?.value

  const [value, setValue] = useState(() => {
    let storedValue: string | null = null

    if (storageKey && typeof localStorage !== 'undefined') {
      try {
        storedValue = localStorage.getItem(storageKey)
      } catch {
        // Storage can be unavailable in privacy modes; tab selection should still work.
      }
    }

    return storedValue && items.some(item => item.value === storedValue) ?
      storedValue :
      (selectedValue ?? '')
  })

  useEffect(() => {
    const synchronize = (event: Event) => {
      const detail = (
        event as CustomEvent<{ storageKey?: string, value?: string }>
      ).detail

      if (
        storageKey &&
        detail.storageKey === storageKey &&
        detail.value &&
        items.some(item => item.value === detail.value)
      ) {
        setValue(detail.value)
      }
    }

    document.addEventListener('ui:tabs-change', synchronize)

    return () => {
      document.removeEventListener('ui:tabs-change', synchronize)
    }
  }, [items, storageKey])

  const selectValue = (nextValue: string) => {
    setValue(nextValue)

    if (storageKey) {
      try {
        localStorage.setItem(storageKey, nextValue)
      } catch {
        // Storage can be unavailable in privacy modes; tab selection should still work.
      }
    }

    document.dispatchEvent(
      new CustomEvent('ui:tabs-change', {
        detail: { storageKey, value: nextValue }
      })
    )
  }

  return (
    <Tabs
      className={composeClassName('ui-code-tabs', className)}
      data-slot="code-tabs"
      data-storage-key={storageKey}
      onValueChange={selectValue}
      value={value}
      {...props}
    >
      <TabsList aria-label={ariaLabel} className="ui-code-tabs__list">
        {items.map(item => (
          <TabsTrigger
            className="ui-code-tabs__tab"
            key={item.value}
            value={item.value}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map(item => (
        <TabsPanel
          className="ui-code-tabs__panel"
          key={item.value}
          value={item.value}
        >
          <Code
            code={item.code}
            copy={copy}
            {...(item.language === undefined ?
              {} :
              { language: item.language })}
            theme={theme}
            variant="block"
            wrap={wrap}
          />
        </TabsPanel>
      ))}
    </Tabs>
  )
}

export type TagGroupProps = ComponentPropsWithoutRef<'div'>
export const TagGroup = ({
  className,
  role = 'list',
  ...props
}: TagGroupProps) => (
  <div
    className={composeClassName('ui-tag-group', className)}
    role={role}
    {...props}
  />
)

export interface ThemeBuilderProps extends ComponentPropsWithoutRef<'section'> {
  glass?: LumenGlassProp
}
export const ThemeBuilder = ({
  className,
  glass = false,
  ...props
}: ThemeBuilderProps) => (
  <section
    className={composeClassName(
      'ui-theme-builder', glassClass('ui-theme-builder', glass), className
    )}
    data-ui-theme-builder
    {...props}
  />
)

export type TimeFieldProps = ComponentPropsWithRef<'input'>
export const TimeField = ({
  className,
  ref,
  type = 'time',
  ...props
}: TimeFieldProps) => (
  <input
    className={composeClassName('ui-input ui-time-field', className)}
    ref={ref}
    type={type}
    {...props}
  />
)

export interface ToastProps
  extends ComponentPropsWithoutRef<'aside'>, SurfaceProps {
  variant?: AlertVariant
}

export const Toast = ({
  'aria-live': ariaLive,
  className,
  glass = false,
  role,
  variant = 'default',
  ...props
}: ToastProps) => (
  <aside
    aria-live={ariaLive ?? (variant === 'destructive' ? 'assertive' : 'polite')}
    className={composeClassName(
      'ui-toast', variantClass('ui-toast', variant), glassSurfaceClass('ui-toast', glass), className
    )}
    data-surface={resolveSurface(glass)}
    data-ui-toast
    data-variant={variant}
    role={role ?? (variant === 'destructive' ? 'alert' : 'status')}
    {...props}
  />
)

export interface ToggleProps extends ComponentPropsWithoutRef<'button'> {
  controlled?: boolean
  pressed?: boolean
}

export const Toggle = ({
  className,
  controlled = false,
  pressed = false,
  type = 'button',
  ...props
}: ToggleProps) => (
  <button
    aria-pressed={pressed}
    className={composeClassName('ui-toggle', className)}
    data-ui-controlled={controlled || undefined}
    data-ui-toggle
    type={type}
    {...props}
  />
)

export type ToggleGroupProps = ComponentPropsWithoutRef<'div'>
export const ToggleGroup = ({ className, ...props }: ToggleGroupProps) => (
  <div
    className={composeClassName('ui-toggle-group', className)}
    data-ui-toggle-group
    {...props}
  />
)

export type TooltipProps = ComponentPropsWithoutRef<'span'> &
  Omit<TooltipOptions, 'id'>
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
        onMouseEnter={composeHandlers(
          onMouseEnter, tooltip.rootProps.onMouseEnter
        )}
        onMouseLeave={composeHandlers(
          onMouseLeave, tooltip.rootProps.onMouseLeave
        )}
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
export const Tree = ({
  className,
  glass = false,
  role = 'tree',
  ...props
}: TreeProps) => (
  <div
    className={composeClassName(
      'ui-tree', glassClass('ui-tree', glass), className
    )}
    role={role}
    {...props}
  />
)

export interface TreeGridProps extends ComponentPropsWithoutRef<'div'> {
  glass?: LumenGlassProp
}
export const TreeGrid = ({
  className,
  glass = false,
  role = 'treegrid',
  ...props
}: TreeGridProps) => (
  <div
    className={composeClassName(
      'ui-tree-grid', glassClass('ui-tree-grid', glass), className
    )}
    role={role}
    {...props}
  />
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
    className={composeClassName(
      'ui-virtual-list', glassClass('ui-virtual-list', glass), className
    )}
    data-ui-item-size={itemSize}
    data-ui-overscan={overscan}
    data-ui-virtual-list
    {...props}
  />
)

export type BackToTopProps = ComponentPropsWithoutRef<'button'>
export const BackToTop = ({
  className,
  type = 'button',
  ...props
}: BackToTopProps) => (
  <button
    className={composeClassName('ui-back-to-top', className)}
    type={type}
    {...props}
  />
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
  <span
    className={composeClassName('ui-floating-badge', className)}
    {...props}
  />
)

export type FormattedDateProps = ComponentPropsWithoutRef<'time'>
export const FormattedDate = ({ className, ...props }: FormattedDateProps) => (
  <time
    className={composeClassName('ui-formatted-date', className)}
    {...props}
  />
)

export type ImageProps<T extends ElementType = 'img'> = {
  as?: T
  className?: string
  fit?: 'contain' | 'cover'
  invertOnDark?: boolean
  loading?: 'eager' | 'lazy'
  radius?: 'full' | 'lg' | 'md' | 'none' | 'sm'
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'fit' | 'loading' | 'radius'>

export const Image = <T extends ElementType = 'img'>({
  as,
  className,
  fit = 'cover',
  invertOnDark = false,
  loading,
  radius = 'lg',
  ...props
}: ImageProps<T>) => {
  const Component = as ?? 'img'
  const resolvedLoading = loading ?? (as ? undefined : 'lazy')

  return createElement(Component, {
    ...props,
    className: composeClassName(
      'ui-image',
      invertOnDark && 'ui-image--invert-dark',
      `ui-image--fit-${fit}`,
      `ui-image--radius-${radius}`,
      className
    ),
    ...(resolvedLoading ? { loading: resolvedLoading } : {})
  })
}

export type LinkProps = ComponentPropsWithRef<'a'> & {
  newTab?: boolean
  variant?: 'default' | 'inherit'
}
export const Link = ({
  className,
  newTab = false,
  ref,
  rel,
  target,
  variant = 'default',
  ...props
}: LinkProps) => (
  <a
    className={composeClassName(
      'ui-link', variant === 'inherit' && 'ui-link--inherit', className
    )}
    data-slot="link"
    data-variant={variant}
    ref={ref}
    rel={
      newTab ?
        [
          ...new Set(`${rel ?? ''} noopener noreferrer`.trim().split(/\s+/))
        ].join(' ') :
        rel
    }
    target={newTab ? '_blank' : target}
    {...props}
  />
)

export type PillProps = ComponentPropsWithoutRef<'span'> & {
  count?: number | string
  href?: string
  variant?: 'brand' | 'neutral' | 'outline'
}
export const Pill = ({
  className,
  count,
  children,
  href,
  variant = 'neutral',
  ...props
}: PillProps) => {
  const content = (
    <>
      {children}
      {count !== undefined && <span className="ui-pill__count">{count}</span>}
    </>
  )

  return href ?
    (
      <a
        className={composeClassName(
          'ui-pill', variantClass('ui-pill', variant, 'neutral'), className
        )}
        data-variant={variant}
        href={href}
        {...props}
      >
        {content}
      </a>
    ) :
    (
      <span
        className={composeClassName(
          'ui-pill', variantClass('ui-pill', variant, 'neutral'), className
        )}
        data-variant={variant}
        {...props}
      >
        {content}
      </span>
    )
}

export type ProseProps = ComponentPropsWithoutRef<'div'>
export const Prose = ({ className, ...props }: ProseProps) => (
  <div className={composeClassName('ui-prose', className)} {...props} />
)

export type SkipLinkProps = ComponentPropsWithoutRef<'a'>
export const SkipLink = ({ className, ...props }: SkipLinkProps) => (
  <a className={composeClassName('ui-skip-link', className)} {...props} />
)

export type ThemeToggleProps = ComponentPropsWithoutRef<'button'>
export const ThemeToggle = ({
  className,
  type = 'button',
  ...props
}: ThemeToggleProps) => (
  <button
    className={composeClassName('ui-theme-toggle', className)}
    data-slot="theme-toggle"
    type={type}
    {...props}
  >
    <span className="ui-sr-only">Toggle color theme</span>
    <Icon className="ui-theme-toggle__sun" name="sun" />
    <Icon className="ui-theme-toggle__moon" name="moon" />
  </button>
)

export interface LanguageToggleProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'defaultValue' | 'value'>,
  LanguageToggleOptions {
  labelTemplate?: string | undefined
}

export const LanguageToggle = ({
  children,
  className,
  defaultValue,
  labelTemplate = 'Change language from {current} to {next}',
  locales,
  onClick,
  onValueChange,
  storageKey,
  type = 'button',
  value,
  ...props
}: LanguageToggleProps) => {
  const language = useLanguageToggle({
    defaultValue,
    locales,
    onValueChange,
    storageKey,
    value
  })

  const accessibleLabel = formatLumenLanguageLabel(
    labelTemplate,
    language.currentLocale,
    language.nextLocale
  )

  return (
    <button
      aria-label={accessibleLabel}
      className={composeClassName('ui-language-toggle', className)}
      data-ui-language-next-value={language.nextLocale.value}
      data-ui-language-toggle
      data-ui-language-value={language.value}
      onClick={event => {
        onClick?.(event)

        if (event.defaultPrevented) return

        language.selectNext()

        event.currentTarget.dispatchEvent(new CustomEvent('ui:language-change', {
          bubbles: true,
          detail: {
            previousValue: language.currentLocale.value,
            value: language.nextLocale.value
          }
        }))
      }}
      type={type}
      {...props}
    >
      {children ?? (
        <span lang={language.nextLocale.value}>
          {language.nextLocale.label}
        </span>
      )}
    </button>
  )
}

export interface ParticlesProps extends ComponentPropsWithoutRef<'div'> {
  density?: 'low' | 'medium' | 'high'
}

interface ParticleItem {
  id: string
  style: CSSProperties
}

const particleDensityConfig = { high: 40, low: 15, medium: 25 } as const

const particleTones = [
  'var(--brand)',
  'var(--accent)',
  'var(--glow, var(--brand))'
]

const createParticles = (
  density: NonNullable<ParticlesProps['density']>
): ParticleItem[] => Array.from({ length: particleDensityConfig[density] }, (_, index) => {
  const size = Math.random() * 12 + 8
  const left = Math.random() * 100
  const top = Math.random() * 100

  return {
    id: `${index}-${left}-${top}`,
    style: {
      '--ui-particle-delay': `${Math.random() * 8}s`,
      '--ui-particle-duration': `${20 + Math.random() * 15}s`,
      '--ui-particle-left': `${left}%`,
      '--ui-particle-size': `${size}px`,
      '--ui-particle-tone':
          particleTones[Math.floor(Math.random() * particleTones.length)],
      '--ui-particle-top': `${top}%`
    } as CSSProperties
  }
})

export const Particles = ({
  children,
  className,
  density = 'medium',
  ...props
}: ParticlesProps) => {
  const [particles, setParticles] = useState<ParticleItem[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Particle geometry is client-only to keep SSR output stable while retaining per-load variation.
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setParticles(createParticles(density))
  }, [density])

  return (
    <div
      aria-hidden="true"
      className={composeClassName('ui-particles', className)}
      data-ui-particles={density}
      {...props}
    >
      {children}
      {particles.map(particle => (
        <span
          className="ui-particles__particle"
          key={particle.id}
          style={particle.style}
        />
      ))}
    </div>
  )
}

type MotionAnimation = 'fade' | 'scale' | 'slide-up'

type MotionDuration = 'fast' | 'slow' | 'standard'

const parseMotionDuration = (value: string): number => {
  const parsedDuration = Number.parseFloat(value)

  if (!Number.isFinite(parsedDuration)) return 300

  return value.endsWith('ms') ? parsedDuration : parsedDuration * 1000
}

export interface ScrollRevealProps extends ComponentPropsWithoutRef<'div'> {
  animation?: MotionAnimation
  delay?: number
  duration?: MotionDuration
  once?: boolean
  threshold?: number
}
export const ScrollReveal = ({
  animation = 'fade',
  className,
  delay = 0,
  duration = 'slow',
  once = true,
  style,
  threshold = 0.15,
  ...props
}: ScrollRevealProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    root.dataset.uiScrollRevealBound = 'true'

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      root.classList.add('is-revealed')

      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        root.classList.toggle('is-revealed', entry.isIntersecting)

        if (entry.isIntersecting && once) observer.disconnect()
      }, { threshold: Math.min(1, Math.max(0, threshold)) }
    )

    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [once, threshold])

  return (
    <div
      className={composeClassName(
        'ui-scroll-reveal', `ui-scroll-reveal-${animation}`, `ui-motion-duration-${duration}`, className
      )}
      data-ui-reveal-once={String(once)}
      data-ui-reveal-threshold={Math.min(1, Math.max(0, threshold))}
      data-ui-scroll-reveal
      ref={rootRef}
      style={
        {
          ...style,
          '--ui-reveal-delay': `${Math.max(0, delay)}ms`
        } as CSSProperties
      }
      {...props}
    />
  )
}

export interface RevealGroupProps extends ComponentPropsWithoutRef<'div'> {
  animation?: MotionAnimation
  delay?: number
  duration?: MotionDuration
  once?: boolean
  stagger?: number
  threshold?: number
}
export const RevealGroup = ({
  animation = 'slide-up',
  className,
  delay = 0,
  duration = 'slow',
  once = true,
  stagger = 80,
  style,
  threshold = 0.15,
  ...props
}: RevealGroupProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    root.dataset.uiScrollRevealBound = 'true'

    for (const [index, child] of [...root.children].entries()) {
      if (child instanceof HTMLElement) {
        child.style.setProperty('--ui-reveal-index', String(index))
      }
    }

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      root.classList.add('is-revealed')

      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        root.classList.toggle('is-revealed', entry.isIntersecting)

        if (entry.isIntersecting && once) observer.disconnect()
      }, { threshold: Math.min(1, Math.max(0, threshold)) }
    )

    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [once, threshold])

  return (
    <div
      className={composeClassName(
        'ui-reveal-group', `ui-reveal-group-${animation}`, `ui-motion-duration-${duration}`, className
      )}
      data-ui-reveal-group
      data-ui-reveal-once={String(once)}
      data-ui-reveal-threshold={Math.min(1, Math.max(0, threshold))}
      ref={rootRef}
      style={
        {
          ...style,
          '--ui-reveal-delay': `${Math.max(0, delay)}ms`,
          '--ui-reveal-stagger': `${Math.max(0, stagger)}ms`
        } as CSSProperties
      }
      {...props}
    />
  )
}

export interface AnimatedNumberProps extends Omit<
  ComponentPropsWithoutRef<'span'>,
  'prefix'
> {
  decimals?: number
  duration?: MotionDuration
  from?: number
  locale?: string
  prefix?: string
  suffix?: string
  value: number
}
export const AnimatedNumber = ({
  className,
  decimals = 0,
  duration = 'slow',
  from = 0,
  locale,
  prefix = '',
  suffix = '',
  value,
  ...props
}: AnimatedNumberProps) => {
  const outputRef = useRef<HTMLSpanElement>(null)
  const safeDecimals = Math.max(0, Math.min(20, Math.floor(decimals)))

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, {
      maximumFractionDigits: safeDecimals,
      minimumFractionDigits: safeDecimals
    }), [locale, safeDecimals]
  )

  const formattedValue = `${prefix}${formatter.format(value)}${suffix}`

  useEffect(() => {
    const output = outputRef.current

    if (!output) return

    const format = (current: number) => `${prefix}${formatter.format(current)}${suffix}`

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      output.textContent = format(value)

      return
    }

    output.textContent = format(from)

    const root = output.parentElement

    if (!root) return

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return

        observer.disconnect()

        const durationValue = getComputedStyle(root)
          .getPropertyValue('--ui-motion-duration')
          .trim()

        const durationMs = parseMotionDuration(durationValue)
        const startedAt = performance.now()

        const update = (now: number) => {
          const progress = Math.min(
            1, (now - startedAt) / Math.max(1, durationMs)
          )

          const eased = 1 - Math.pow(1 - progress, 3)

          output.textContent = format(from + (value - from) * eased)

          if (progress < 1) {
            requestAnimationFrame(update)
          } else {
            output.textContent = format(value)
          }
        }

        requestAnimationFrame(update)
      }, { threshold: 0.15 }
    )

    observer.observe(root)

    return () => {
      observer.disconnect()
    }
  }, [formatter, from, prefix, suffix, value])

  return (
    <span
      className={composeClassName(
        'ui-animated-number', `ui-motion-duration-${duration}`, className
      )}
      data-ui-animated-number
      {...props}
    >
      <span aria-hidden="true" data-ui-animated-number-output ref={outputRef}>
        {formattedValue}
      </span>
      <span className="ui-sr-only">{formattedValue}</span>
    </span>
  )
}

export type StatProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T> & {
    label?: string
    value?: string
    variant?: 'accent' | 'bare' | 'default' | 'glass'
  }
export const Stat = <T extends ElementType = 'div'>({
  as,
  className,
  label,
  value,
  variant = 'default',
  children,
  ...props
}: StatProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    className={composeClassName(
      variant !== 'default' && `ui-stat--${variant}`, className
    )}
    data-slot="stat"
    data-variant={variant}
    {...props}
    uiClassName="ui-stat"
  >
    {label && (
      <div className="ui-stat-label" data-slot="stat-label">
        {label}
      </div>
    )}
    {value && (
      <div className="ui-stat-value" data-slot="stat-value">
        {value}
      </div>
    )}
    {children}
  </Primitive>
)

export type StatLabelProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T>
export const StatLabel = <T extends ElementType = 'div'>({
  as,
  ...props
}: StatLabelProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="stat-label"
    {...props}
    uiClassName="ui-stat-label"
  />
)

export type StatValueProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T>
export const StatValue = <T extends ElementType = 'div'>({
  as,
  ...props
}: StatValueProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="stat-value"
    {...props}
    uiClassName="ui-stat-value"
  />
)

export type StatDescriptionProps<T extends ElementType = 'div'> =
  LumenPrimitiveProps<T>
export const StatDescription = <T extends ElementType = 'div'>({
  as,
  ...props
}: StatDescriptionProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    data-slot="stat-description"
    {...props}
    uiClassName="ui-stat-description"
  />
)

export type StatIconProps = ComponentPropsWithRef<'span'>
export const StatIcon = ({ className, ...props }: StatIconProps) => (
  <span
    className={composeClassName('ui-stat-icon', className)}
    data-slot="stat-icon"
    {...props}
  />
)

type StatTrendTone = 'danger' | 'neutral' | 'success' | 'warning'

export type StatTrendProps = ComponentPropsWithRef<'span'> & {
  tone?: StatTrendTone
}
export const StatTrend = ({
  className,
  tone = 'neutral',
  ...props
}: StatTrendProps) => (
  <span
    className={composeClassName(
      'ui-stat-trend', `ui-stat-trend--${tone}`, className
    )}
    data-slot="stat-trend"
    data-tone={tone}
    {...props}
  />
)

export type MeterProps = ComponentPropsWithoutRef<'meter'>
export const Meter = ({ className, ...props }: MeterProps) => (
  <meter className={composeClassName('ui-meter', className)} {...props} />
)

export interface NoteProps extends ComponentPropsWithoutRef<'div'> {
  label?: string
  borderPosition?: 'left' | 'right' | 'none'
}
export const Note = ({
  className,
  label,
  borderPosition = 'left',
  children,
  ...props
}: NoteProps) => (
  <div
    className={composeClassName(
      'ui-note', `ui-note--border-${borderPosition}`, className
    )}
    {...props}
  >
    {label && <p className="ui-note__label">{label}</p>}
    <div className="ui-note__content">{children}</div>
  </div>
)

export interface RatingProps extends ComponentPropsWithoutRef<'div'> {
  value?: number
  max?: number
  readonly?: boolean
}
export const Rating = ({
  className,
  value = 0,
  max = 5,
  readonly = false,
  ...props
}: RatingProps) => {
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div
      className={composeClassName(
        'ui-rating', readonly && 'ui-rating--readonly', className
      )}
      data-ui-rating
      data-value={value}
      data-max={max}
      data-readonly={readonly ? 'true' : 'false'}
      {...props}
    >
      {stars.map(star => (
        <button
          key={star}
          type="button"
          className="ui-rating__star"
          data-active={star <= value ? 'true' : 'false'}
          disabled={readonly}
          aria-label={`Rate ${star} out of ${max}`}
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ui-icon"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export type TimelineProps = ComponentPropsWithoutRef<'ol'>
export const Timeline = ({ className, ...props }: TimelineProps) => (
  <ol className={composeClassName('ui-timeline', className)} {...props} />
)

export type TimelineItemProps = ComponentPropsWithoutRef<'li'> & {
  dot?: React.ReactNode
}
export const TimelineItem = ({
  className,
  children,
  dot,
  ...props
}: TimelineItemProps) => (
  <li className={composeClassName('ui-timeline-item', className)} {...props}>
    <div className="ui-timeline-item__tail" />
    <div className="ui-timeline-item__dot">{dot}</div>
    <div className="ui-timeline-item__content">{children}</div>
  </li>
)

export type AnimatedLogoProps = ComponentPropsWithoutRef<'span'> & {
  animation?: 'reveal' | 'sequence'
}
export const AnimatedLogo = ({
  animation = 'reveal',
  className,
  ...props
}: AnimatedLogoProps) => (
  <span
    className={composeClassName('ui-animated-logo', className)}
    data-animation={animation}
    data-ui-animated-logo
    {...props}
  />
)

export interface GraphicProps extends ComponentPropsWithoutRef<'div'> {
  label?: string
  size?: 'lg' | 'md' | 'sm'
  tone?: 'accent' | 'brand' | 'neutral'
  variant?: 'glow' | 'grid' | 'orbit'
}

export const Graphic = ({
  children,
  className,
  label,
  size = 'md',
  tone = 'brand',
  variant = 'orbit',
  ...props
}: GraphicProps) => (
  <div
    aria-hidden={label ? undefined : true}
    aria-label={label}
    className={composeClassName(
      'ui-graphic',
      `ui-graphic--${variant}`,
      `ui-graphic--${tone}`,
      `ui-graphic--${size}`,
      className
    )}
    role={label ? 'img' : undefined}
    {...props}
  >
    <div className="ui-graphic__content">{children}</div>
  </div>
)

export interface BackdropProps extends ComponentPropsWithoutRef<'div'> {
  intensity?: 'medium' | 'strong' | 'subtle'
  tone?: 'accent' | 'brand' | 'neutral'
  variant?: 'aurora' | 'dots' | 'grid' | 'rays'
}

export const Backdrop = ({
  children,
  className,
  intensity = 'medium',
  tone = 'brand',
  variant = 'aurora',
  ...props
}: BackdropProps) => (
  <div
    className={composeClassName(
      'ui-backdrop',
      `ui-backdrop--${variant}`,
      `ui-backdrop--${tone}`,
      `ui-backdrop--${intensity}`,
      className
    )}
    {...props}
  >
    <div className="ui-backdrop__content">{children}</div>
  </div>
)

export interface IllustrationProps extends ComponentPropsWithoutRef<'span'> {
  label?: string
  size?: 'lg' | 'md' | 'sm'
  tone?: 'accent' | 'auto' | 'brand' | 'neutral'
  variant?: 'empty' | 'error' | 'offline' | 'success'
}

const renderIllustrationElement = (
  element: LumenIllustrationElement,
  index: number
): ReactNode => {
  if (element.kind === 'circle') {
    return <circle key={index} cx={element.cx} cy={element.cy} r={element.r} />
  }

  if (element.kind === 'rounded-rect') {
    return (
      <rect
        key={index}
        height={element.height}
        rx={element.radius}
        width={element.width}
        x={element.x}
        y={element.y}
      />
    )
  }

  const pointPairs: string[] = []

  for (let index = 0; index < element.points.length; index += 2) {
    const x = element.points[index]
    const y = element.points[index + 1]

    if (x === undefined || y === undefined) break

    pointPairs.push(`${x},${y}`)
  }

  return createElement(element.kind, { key: index, points: pointPairs.join(' ') })
}

export const Illustration = ({
  className,
  label,
  size = 'md',
  tone = 'auto',
  variant = 'empty',
  ...props
}: IllustrationProps) => (
  <span
    aria-hidden={label ? undefined : true}
    aria-label={label}
    className={composeClassName(
      'ui-illustration',
      `ui-illustration--${variant}`,
      `ui-illustration--${tone}`,
      `ui-illustration--${size}`,
      className
    )}
    role={label ? 'img' : undefined}
    {...props}
  >
    <svg aria-hidden="true" fill="none" viewBox="0 0 120 120">
      <circle className="ui-illustration__wash" cx="60" cy="60" r="48" />
      {lumenIllustrations[variant].elements.map(
        renderIllustrationElement
      )}
    </svg>
  </span>
)

export type AnimatedPortraitProps = ComponentPropsWithoutRef<'div'>
export const AnimatedPortrait = ({
  className,
  ...props
}: AnimatedPortraitProps) => (
  <div
    className={composeClassName(
      'ui-animated-portrait relative isolate w-full animate-reveal-lcp motion-reduce:animate-none', className
    )}
    {...props}
  />
)

export type ButtonLinkProps = ComponentPropsWithRef<'a'> & {
  asChild?: boolean
  shape?: 'default' | 'icon'
  variant?: 'ghost' | 'inline' | 'primary' | 'secondary' | 'unstyled'
}

const getButtonLinkVariantClass = (
  variant: NonNullable<ButtonLinkProps['variant']>
): string => {
  if (variant === 'unstyled') return 'ui-button-link--unstyled'

  if (variant === 'inline') return 'ui-button ui-button--inline'

  return `ui-button ui-button--${variant} min-h-11 rounded-full border`
}

export const ButtonLink = ({
  asChild = false,
  children,
  className,
  ref,
  shape = 'default',
  variant = 'primary',
  ...props
}: ButtonLinkProps) => {
  const variantClass = getButtonLinkVariantClass(variant)

  const shapeClass =
    shape === 'icon' && variant !== 'inline' ?
      'ui-button-link--icon' :
      undefined

  const buttonLinkClassName = composeClassName(
    'ui-button-link', variant !== 'unstyled' &&
    'group inline-flex cursor-pointer items-center justify-center gap-2 text-sm font-semibold tracking-[0.01em]', variantClass, shapeClass, className
  )

  if (asChild) {
    const child = Children.only(children)

    if (!isValidElement<ButtonChildProps>(child)) {
      throw new Error(
        'ButtonLink with asChild requires exactly one valid React element child.'
      )
    }

    const ChildComponent = child.type

    return (
      <ChildComponent
        {...child.props}
        {...props}
        className={composeClassName(buttonLinkClassName, child.props.className)}
        data-slot="button-link"
        ref={ref as Ref<HTMLElement>}
      >
        {child.props.children}
      </ChildComponent>
    )
  }

  return (
    <a
      className={buttonLinkClassName}
      data-slot="button-link"
      ref={ref}
      {...props}
    >
      {children}
    </a>
  )
}

export type CoverImageProps = ComponentPropsWithoutRef<'div'> & {
  hover?: boolean
  showBottomGradient?: boolean
}
export const CoverImage = ({
  className,
  hover = false,
  showBottomGradient = false,
  children,
  ...props
}: CoverImageProps) => (
  <div
    className={composeClassName(
      'ui-cover-image relative overflow-hidden bg-surface-muted', hover && 'ui-cover-image--hover', className
    )}
    {...props}
  >
    {children}
    {showBottomGradient && (
      <div aria-hidden="true" className="ui-cover-image__bottom-gradient" />
    )}
  </div>
)

export type GradientDividerProps = ComponentPropsWithoutRef<'div'>
export const GradientDivider = ({
  className,
  ...props
}: GradientDividerProps) => (
  <div
    aria-hidden="true"
    className={composeClassName(
      'ui-gradient-divider pointer-events-none flex justify-center', className
    )}
    {...props}
  >
    <div
      className="
        via-brand/40 h-px w-full max-w-5xl bg-linear-to-r from-transparent
        to-transparent
      "
    >
    </div>
  </div>
)

export type StepItem = string | { description?: string, title: string }
export interface StepperProps extends ComponentPropsWithoutRef<'ol'> {
  currentStep?: number
  orientation?: Orientation
  steps?: StepItem[]
}

const emptySteps: StepItem[] = []
const normalizeStep = (step: StepItem) => typeof step === 'string' ? { description: undefined, title: step } : step

export const Stepper = ({
  children,
  className,
  currentStep = 0,
  orientation = 'horizontal',
  steps = emptySteps,
  ...props
}: StepperProps) => (
  <ol
    className={composeClassName(
      'ui-stepper', orientation === 'vertical' && 'ui-stepper--vertical', className
    )}
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
        <li
          aria-current={state === 'current' ? 'step' : undefined}
          className="ui-stepper__step"
          data-state={state}
          key={step.title}
        >
          <span className="ui-stepper__marker">{index + 1}</span>
          <span className="ui-stepper__content">
            <span className="ui-stepper__title">{step.title}</span>
            {step.description && (
              <span className="ui-stepper__description">
                {step.description}
              </span>
            )}
          </span>
        </li>
      )
    })}
    {children}
  </ol>
)

export interface FileUploadProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size'
> {
  hint?: ReactNode
  inputClassName?: string
  label?: ReactNode
}
export const FileUpload = ({
  children,
  className,
  hint,
  id,
  inputClassName,
  label = 'Choose a file or drag it here',
  onChange,
  ref,
  ...props
}: FileUploadProps) => {
  const generatedId = useId()
  const inputId = id ?? `ui-file-upload-${generatedId.replaceAll(':', '')}`
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const selectedFileText =
    selectedFiles.length > 1 ?
      `${selectedFiles.length} files selected` :
      (selectedFiles[0] ?? '')

  return (
    <label
      className={composeClassName('ui-file-upload', className)}
      data-state={selectedFiles.length > 0 ? 'selected' : 'idle'}
      data-ui-file-upload
      htmlFor={inputId}
    >
      <input
        className={composeClassName('ui-file-upload__input', inputClassName)}
        data-ui-file-upload-input
        id={inputId}
        onChange={event => {
          setSelectedFiles(
            [...(event.currentTarget.files ?? [])].map(file => file.name)
          )

          onChange?.(event)
        }}
        ref={ref}
        type="file"
        {...props}
      />
      <svg
        aria-hidden="true"
        className="ui-file-upload__icon"
        fill="none"
        focusable="false"
        viewBox="0 0 24 24"
      >
        <path d="M12 16V4m0 0L8 8m4-4 4 4" />
        <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
      </svg>
      <span className="ui-file-upload__prompt">{children ?? label}</span>
      {hint && <span className="ui-file-upload__hint">{hint}</span>}
      <span
        aria-live="polite"
        className="ui-file-upload__files"
        data-ui-file-upload-files
      >
        {selectedFileText}
      </span>
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

export const Tour = ({
  children,
  className,
  closeLabel = 'Done',
  hidden = true,
  nextLabel = 'Next',
  steps = emptyTourSteps,
  ...props
}: TourProps) => (
  <div
    className={composeClassName('ui-tour', className)}
    data-ui-tour
    hidden={hidden}
    {...props}
  >
    <div
      aria-hidden="true"
      className="ui-tour__backdrop"
      data-ui-tour-backdrop
    />
    <div className="ui-tour__popover" data-ui-tour-popover role="dialog">
      {steps.map((step, index) => (
        <div
          className="ui-tour__step"
          data-target={step.target}
          data-ui-tour-step
          hidden={index !== 0}
          key={step.target}
        >
          {step.title && <p className="ui-tour__title">{step.title}</p>}
          <p className="ui-tour__content">{step.content}</p>
          <div className="ui-tour__actions">
            <button
              className="ui-button ui-button--ghost ui-button--sm"
              data-ui-tour-close
              type="button"
            >
              {closeLabel}
            </button>
            {index < steps.length - 1 && (
              <button
                className="ui-button ui-button--default ui-button--sm"
                data-ui-tour-next
                type="button"
              >
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      ))}
      {children}
    </div>
  </div>
)

export interface AnchorLink {
  description?: ReactNode
  depth?: 1 | 2 | 3 | 4 | 5 | 6
  href: string
  index?: ReactNode
  label: ReactNode
}
export interface AnchorProps extends ComponentPropsWithoutRef<'nav'> {
  activationOffset?: number
  items?: AnchorLink[]
}

const emptyAnchorLinks: AnchorLink[] = []

const createAnchorRef = () => {
  let cleanup: (() => void) | undefined

  return (root: HTMLElement | null) => {
    cleanup?.()

    cleanup = undefined

    if (!root) return

    const links = [...root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]

    const targets = links.flatMap(link => {
      const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '')
      const target = id ? document.getElementById(id) : null

      return target ? [{ link, target }] : []
    })

    if (!targets.length) return

    const abortController = new AbortController()
    let frame = 0

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
      frame = 0

      const scrollingElement =
        document.scrollingElement ?? document.documentElement

      const atEnd = scrollingElement.scrollTop + scrollingElement.clientHeight >=
        scrollingElement.scrollHeight - 1

      const offset = Number(root.dataset.uiAnchorOffset) || 0
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
      if (frame) return

      frame = requestAnimationFrame(update)
    }

    for (const { link } of targets) {
      link.addEventListener('click', () => {
        setActive(link)
      }, {
        signal: abortController.signal
      })
    }

    window.addEventListener('resize', requestUpdate, {
      passive: true,
      signal: abortController.signal
    })

    window.addEventListener('scroll', requestUpdate, {
      passive: true,
      signal: abortController.signal
    })

    update()

    cleanup = () => {
      abortController.abort()

      if (frame) cancelAnimationFrame(frame)
    }
  }
}

export const Anchor = ({
  'aria-label': ariaLabel = 'On this page',
  activationOffset = 96,
  children,
  className,
  items = emptyAnchorLinks,
  ...props
}: AnchorProps) => {
  const anchorRef = createAnchorRef()

  return (
    <nav
      aria-label={ariaLabel}
      className={composeClassName('ui-anchor', className)}
      data-ui-anchor
      data-ui-anchor-offset={Math.max(0, activationOffset)}
      ref={anchorRef}
      {...props}
    >
      {items.length > 0 && (
        <ol>
          {items.map((item, index) => (
            <li key={item.href}>
              <a
                aria-current={index === 0 ? 'location' : undefined}
                data-active={index === 0 ? 'true' : 'false'}
                data-depth={item.depth}
                href={item.href}
              >
                {item.index !== undefined && (
                  <span className="ui-anchor__index">{item.index}</span>
                )}
                <span className="ui-anchor__content">
                  <span className="ui-anchor__label">{item.label}</span>
                  {item.description && (
                    <span className="ui-anchor__description">{item.description}</span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
      {children}
    </nav>
  )
}

export interface SegmentedProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'onChange'
> {
  defaultValue?: string
  name?: string
  onValueChange?: (value: string) => void
  options?: SelectOption[]
  size?: 'default' | 'lg' | 'sm'
  value?: string
}
export const Segmented = ({
  children,
  className,
  defaultValue,
  name = 'segmented',
  onValueChange,
  options = emptyOptions,
  size = 'default',
  value = defaultValue,
  ...props
}: SegmentedProps) => (
  <div
    className={composeClassName(
      'ui-segmented', size === 'sm' && 'ui-segmented--sm', size === 'lg' && 'ui-segmented--lg', className
    )}
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
export const Toolbar = ({
  'aria-label': ariaLabel = 'Toolbar',
  className,
  orientation = 'horizontal',
  ...props
}: ToolbarProps) => (
  <div
    aria-label={ariaLabel}
    aria-orientation={orientation}
    className={composeClassName(
      'ui-toolbar', orientation === 'vertical' && 'ui-toolbar--vertical', className
    )}
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

export const Descriptions = ({
  children,
  className,
  columns = 1,
  items = emptyDescriptionsItems,
  style,
  ...props
}: DescriptionsProps) => (
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

export interface PopconfirmProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'title'
> {
  cancelLabel?: string
  confirmLabel?: string
  title?: ReactNode
}
export const Popconfirm = ({
  cancelLabel = 'Cancel',
  children,
  className,
  confirmLabel = 'Confirm',
  title = 'Are you sure?',
  ...props
}: PopconfirmProps) => (
  <div
    className={composeClassName('ui-popover ui-popconfirm', className)}
    data-surface="default"
    data-ui-popconfirm
    data-ui-popover
    {...props}
  >
    <span
      aria-expanded="false"
      aria-haspopup="dialog"
      className="ui-popconfirm__trigger"
      data-ui-trigger
    >
      {children}
    </span>
    <div
      className="ui-popover__panel ui-popconfirm__panel"
      data-ui-panel
      hidden
      role="dialog"
    >
      <p className="ui-popconfirm__message">{title}</p>
      <div className="ui-popconfirm__actions">
        <button
          className="ui-button ui-button--ghost ui-button--sm"
          data-ui-popconfirm-cancel
          type="button"
        >
          {cancelLabel}
        </button>
        <button
          className="ui-button ui-button--destructive ui-button--sm"
          data-ui-popconfirm-confirm
          type="button"
        >
          {confirmLabel}
        </button>
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
      <input
        className="ui-checkbox"
        data-ui-transfer-item
        type="checkbox"
        value={item.key}
      />
      <span>{item.label}</span>
    </label>
  </li>
))

export const Transfer = ({
  className,
  items = emptyTransferItems,
  name,
  sourceTitle = 'Available',
  targetItems = emptyTransferItems,
  targetTitle = 'Selected',
  ...props
}: TransferProps) => (
  <div
    className={composeClassName('ui-transfer', className)}
    data-ui-transfer
    data-ui-transfer-name={name}
    {...props}
  >
    <div className="ui-transfer__panel">
      <p className="ui-transfer__title">{sourceTitle}</p>
      <ul
        className="ui-transfer__list"
        data-side="source"
        data-ui-transfer-list
      >
        {renderTransferItems(items)}
      </ul>
    </div>
    <div className="ui-transfer__controls">
      <button
        aria-label={`Move to ${targetTitle}`}
        className="ui-button ui-button--outline ui-button--icon"
        data-ui-transfer-move="target"
        type="button"
      >
        <Icon name="chevron-right" />
      </button>
      <button
        aria-label={`Move to ${sourceTitle}`}
        className="ui-button ui-button--outline ui-button--icon"
        data-ui-transfer-move="source"
        type="button"
      >
        <Icon name="chevron-left" />
      </button>
    </div>
    <div className="ui-transfer__panel">
      <p className="ui-transfer__title">{targetTitle}</p>
      <ul
        className="ui-transfer__list"
        data-side="target"
        data-ui-transfer-list
      >
        {renderTransferItems(targetItems)}
      </ul>
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
  options: { label: ReactNode, nextId?: string | undefined, value: string }[]
  root: boolean
}

const buildCascaderColumns = (
  options: CascaderOption[],
  idPrefix: string
): CascaderColumn[] => {
  const columns: CascaderColumn[] = []
  let count = 0

  const build = (items: CascaderOption[], root: boolean): string => {
    count += 1

    const id = `${idPrefix}-column-${count}`

    const rendered: CascaderColumn['options'] = items.map(item => ({
      label: item.label,
      value: item.value
    }))

    columns.push({ id, options: rendered, root })

    for (const [index, item] of items.entries()) {
      const renderedOption = rendered[index]

      if (item.children && item.children.length > 0 && renderedOption) {
        renderedOption.nextId = build(item.children, false)
      }
    }

    return id
  }

  if (options.length > 0) build(options, true)

  return columns
}

const emptyCascaderOptions: CascaderOption[] = []

export const Cascader = ({
  children,
  className,
  id,
  name,
  options = emptyCascaderOptions,
  placeholder = 'Select…',
  ...props
}: CascaderProps) => {
  const generatedId = useId().replaceAll(':', '')
  const cascaderId = id ?? `ui-cascader-${generatedId}`
  const panelId = `${cascaderId}-panel`
  const columns = buildCascaderColumns(options, cascaderId)

  return (
    <div
      className={composeClassName('ui-cascader', className)}
      data-surface="default"
      data-ui-cascader
      data-ui-popover
      id={id}
      {...props}
    >
      <button
        aria-controls={panelId}
        aria-expanded="false"
        aria-haspopup="listbox"
        className="ui-select ui-select__trigger ui-cascader__trigger"
        data-ui-trigger
        role="combobox"
        type="button"
      >
        <span data-ui-cascader-placeholder={placeholder} data-ui-cascader-value>
          {placeholder}
        </span>
      </button>
      <div className="ui-cascader__panel" data-ui-panel hidden id={panelId}>
        {columns.map(column => (
          <ol
            aria-label={column.root ? 'Options' : 'Sub-options'}
            className="ui-cascader__column"
            hidden={!column.root}
            id={column.id}
            key={column.id}
            role="listbox"
          >
            {column.options.map(option => (
              <li key={option.value} role="presentation">
                <button
                  aria-selected="false"
                  className="ui-cascader__option"
                  data-ui-cascader-next={
                    option.nextId ? `#${option.nextId}` : undefined
                  }
                  data-ui-cascader-option
                  data-value={option.value}
                  role="option"
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

const flattenTreeSelect = (
  nodes: TreeSelectNode[],
  depth = 0,
  acc: { depth: number, label: ReactNode, value: string }[] = []
) => {
  for (const node of nodes) {
    acc.push({ depth, label: node.label, value: node.value })

    if (node.children && node.children.length > 0)
      flattenTreeSelect(node.children, depth + 1, acc)
  }

  return acc
}

const emptyTreeSelectNodes: TreeSelectNode[] = []

export const TreeSelect = ({
  children,
  className,
  name,
  placeholder = 'Select…',
  treeData = emptyTreeSelectNodes,
  ...props
}: TreeSelectProps) => (
  <div
    className={composeClassName('ui-tree-select', className)}
    data-surface="default"
    data-ui-popover
    data-ui-tree-select
    {...props}
  >
    <button
      aria-expanded="false"
      aria-haspopup="tree"
      className="ui-select ui-select__trigger ui-tree-select__trigger"
      data-ui-trigger
      type="button"
    >
      <span
        data-ui-tree-select-placeholder={placeholder}
        data-ui-tree-select-value
      >
        {placeholder}
      </span>
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

export interface MentionsProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'defaultValue' | 'onChange'
> {
  defaultValue?: string
  label?: string
  name?: string
  onValueChange?: (value: string) => void
  options?: SelectOption[]
  placeholder?: string
  trigger?: string
  value?: string
}
export const Mentions = ({
  className,
  defaultValue = '',
  label = 'Mentions',
  name,
  onValueChange,
  options = emptyOptions,
  placeholder,
  trigger = '@',
  value,
  ...props
}: MentionsProps) => {
  const generatedId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [query, setQuery] = useState<string | null>(null)
  const currentValue = value ?? internalValue
  const listId = `ui-mentions-${generatedId}-list`
  const escapedTrigger = trigger.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const normalizedOptions = options.map(normalizeOption)

  const visibleOptions = query === null ?
    [] :
    normalizedOptions.filter(option => option.value.toLowerCase().startsWith(query))

  const expanded = visibleOptions.length > 0

  const resolvedActiveIndex = expanded ?
    Math.min(Math.max(activeIndex, 0), visibleOptions.length - 1) :
    -1

  const activeOption = visibleOptions[resolvedActiveIndex]

  const setNextValue = (nextValue: string): void => {
    if (value === undefined) setInternalValue(nextValue)

    onValueChange?.(nextValue)
  }

  const closeList = (): void => {
    setQuery(null)

    setActiveIndex(-1)
  }

  const insertMention = (mention: string): void => {
    const caret = inputRef.current?.selectionStart ?? currentValue.length

    const before = currentValue
      .slice(0, caret)
      .replace(new RegExp(`${escapedTrigger}\\w*$`), `${trigger}${mention} `)

    const nextValue = before + currentValue.slice(caret)

    setNextValue(nextValue)

    closeList()

    requestAnimationFrame(() => {
      inputRef.current?.focus()

      inputRef.current?.setSelectionRange(before.length, before.length)
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault()

      closeList()

      return
    }

    if (expanded && (
      event.key === 'ArrowDown' || event.key === 'ArrowUp' ||
      event.key === 'End' || event.key === 'Home'
    )) {
      event.preventDefault()

      setActiveIndex(current => {
        if (event.key === 'Home') return 0

        if (event.key === 'End') return visibleOptions.length - 1

        if (event.key === 'ArrowDown') return (current + 1) % visibleOptions.length

        return (current - 1 + visibleOptions.length) % visibleOptions.length
      })

      return
    }

    if (event.key === 'Enter' && activeOption) {
      event.preventDefault()

      insertMention(activeOption.value)
    }
  }

  return (
    <div
      className={composeClassName('ui-mentions', className)}
      data-ui-mentions
      data-ui-mentions-trigger={trigger}
      {...props}
    >
      <textarea
        aria-activedescendant={activeOption ? `${listId}-option-${resolvedActiveIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={expanded}
        aria-label={label}
        className="ui-textarea ui-mentions__input"
        data-ui-mentions-input
        name={name}
        onBlur={closeList}
        onChange={event => {
          const nextValue = event.currentTarget.value

          const match = new RegExp(`${escapedTrigger}(\\w*)$`)
            .exec(nextValue.slice(0, event.currentTarget.selectionStart))

          const nextQuery = match ? (match[1] ?? '').toLowerCase() : null

          setNextValue(nextValue)

          setQuery(nextQuery)

          setActiveIndex(nextQuery === null ? -1 : 0)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        role="combobox"
        rows={3}
        value={currentValue}
      />
      <ul
        className="ui-mentions__list"
        data-ui-mentions-list
        hidden={!expanded}
        id={listId}
        role="listbox"
      >
        {visibleOptions.map((option, index) => (
          <li key={option.value}>
            <button
              aria-selected={index === resolvedActiveIndex}
              className="ui-mentions__option"
              data-ui-mentions-option
              data-value={option.value}
              id={`${listId}-option-${index}`}
              onClick={() => {
                insertMention(option.value)
              }}
              onMouseDown={event => {
                event.preventDefault()
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface QRCodeProps extends ComponentPropsWithoutRef<'figure'> {
  size?: number
  src?: string
  value?: string
}
export const QRCode = ({
  children,
  className,
  size = 160,
  src,
  style,
  value,
  ...props
}: QRCodeProps) => {
  const qrSvg = !src && value ? renderSVG(value) : null

  const qrSrc = qrSvg ?
    `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}` :
    src

  return (
    <figure
      className={composeClassName('ui-qr-code', className)}
      data-ui-qr-code
      style={{ ['--ui-qr-code-size' as string]: `${size}px`, ...style }}
      {...props}
    >
      <div className="ui-qr-code__frame">
        {qrSrc ?
          (
            <img
              alt={value ? `QR code for ${value}` : 'QR code'}
              className="ui-qr-code__image"
              height={size}
              src={qrSrc}
              width={size}
            />
          ) :
          (
            children
          )}
      </div>
      {value && <figcaption className="ui-qr-code__value">{value}</figcaption>}
    </figure>
  )
}

export interface WatermarkProps extends ComponentPropsWithoutRef<'div'> {
  content?: string
  gap?: number
  rotate?: number
  text?: string
}
export const Watermark = ({
  children,
  className,
  content,
  gap = 120,
  rotate = -22,
  style,
  text = 'Confidential',
  ...props
}: WatermarkProps) => {
  const watermarkText = content ?? text
  const tileSize = Math.max(1, gap)

  const watermarkXmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&apos;'
  }

  const escapedWatermarkText = watermarkText.replaceAll(
    /[&<>"']/g, character => watermarkXmlEntities[character] ?? character
  )

  const watermarkSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg"',
    ` width="${tileSize}" height="${tileSize}" viewBox="0 0 ${tileSize} ${tileSize}">`,
    `<text x="${tileSize / 2}" y="${tileSize / 2}" dominant-baseline="middle" text-anchor="middle"`,
    ` transform="rotate(${rotate} ${tileSize / 2} ${tileSize / 2})"`,
    ' fill="black" font-family="Montserrat, Avenir Next, Segoe UI, sans-serif" font-size="16" font-weight="500" letter-spacing="1.6">',
    `${escapedWatermarkText}</text></svg>`
  ].join('')

  const watermarkImage = `url("data:image/svg+xml,${encodeURIComponent(watermarkSvg)}")`

  return (
    <div
      className={composeClassName('ui-watermark', className)}
      data-ui-watermark
      style={{
        ['--ui-watermark-gap' as string]: `${tileSize}px`,
        ['--ui-watermark-image' as string]: watermarkImage,
        ...style
      }}
      {...props}
    >
      {children}
      <div
        aria-hidden="true"
        className="ui-watermark__overlay"
        data-text={watermarkText}
      />
    </div>
  )
}

export interface AffixProps extends ComponentPropsWithoutRef<'div'> {
  offset?: number
  offsetBottom?: number
  offsetTop?: number
  position?: 'bottom' | 'top'
}
export const Affix = ({
  className,
  offset = 0,
  offsetBottom,
  offsetTop,
  position: positionProp,
  style,
  ...props
}: AffixProps) => {
  const position =
    positionProp ?? (offsetBottom === undefined ? 'top' : 'bottom')

  const resolvedOffset = offsetBottom ?? offsetTop ?? offset

  return (
    <div
      className={composeClassName(
        'ui-affix', position === 'bottom' && 'ui-affix--bottom', className
      )}
      data-position={position}
      style={{
        ['--ui-affix-offset' as string]: `${resolvedOffset}px`,
        ...style
      }}
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
  defaultOpen?: boolean
  direction?: 'down' | 'left' | 'right' | 'up'
  label?: string
}

const emptySpeedDialActions: SpeedDialAction[] = []

const speedDialNavigationKeys = [
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Home'
]

const getSpeedDialNavigationIndex = (
  key: string,
  currentIndex: number,
  itemCount: number
) => {
  if (key === 'Home') return 0

  if (key === 'End') return itemCount - 1

  if (key === 'ArrowDown' || key === 'ArrowRight')
    return (currentIndex + 1) % itemCount

  return (currentIndex - 1 + itemCount) % itemCount
}

export const SpeedDial = ({
  actions = emptySpeedDialActions,
  children,
  className,
  defaultOpen = false,
  direction = 'up',
  label = 'Actions',
  onBlur,
  ...props
}: SpeedDialProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const menuRef = useRef<HTMLMenuElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = (restoreFocus = false) => {
    setIsOpen(false)

    if (restoreFocus) triggerRef.current?.focus()
  }

  const focusAction = (position: 'first' | 'last') => {
    setIsOpen(true)

    requestAnimationFrame(() => {
      const items = menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"], button:not([disabled]), a[href]'
      )

      const target =
        position === 'first' ? items?.[0] : items?.[items.length - 1]

      target?.focus()
    })
  }

  return (
    <div
      className={composeClassName(
        'ui-speed-dial', `ui-speed-dial--${direction}`, className
      )}
      {...props}
      data-direction={direction}
      data-state={isOpen ? 'open' : 'closed'}
      data-ui-bound="true"
      data-ui-speed-dial
      onBlur={event => {
        onBlur?.(event)

        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={label}
        className="ui-speed-dial__trigger"
        data-ui-speed-dial-trigger
        onClick={() => {
          setIsOpen(open => !open)
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') close()

          if (['ArrowDown', 'ArrowRight'].includes(event.key)) {
            event.preventDefault()

            focusAction('first')

            return
          }

          if (['ArrowLeft', 'ArrowUp'].includes(event.key)) {
            event.preventDefault()

            focusAction('last')
          }
        }}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true" className="ui-speed-dial__icon" />
      </button>
      <menu
        aria-label={label}
        className="ui-speed-dial__actions"
        data-ui-speed-dial-actions
        onClick={event => {
          if (
            (event.target as HTMLElement).closest(
              '[role="menuitem"], button, a'
            )
          )
            close()
        }}
        onKeyDown={event => {
          const items = [
            ...(menuRef.current?.querySelectorAll<HTMLElement>(
              '[role="menuitem"], button:not([disabled]), a[href]'
            ) ?? [])
          ]

          if (event.key === 'Escape') {
            event.preventDefault()

            close(true)

            return
          }

          if (!speedDialNavigationKeys.includes(event.key)) return

          const currentIndex = items.indexOf(
            document.activeElement as HTMLElement
          )

          const targetIndex = getSpeedDialNavigationIndex(
            event.key, currentIndex, items.length
          )

          event.preventDefault()

          items[targetIndex]?.focus()
        }}
        ref={menuRef}
        role="menu"
      >
        {actions.map((action, index) => (
          <li
            key={action.value ?? action.label}
            role="presentation"
            style={{ '--ui-speed-dial-index': index } as CSSProperties}
          >
            <button
              aria-label={action.label}
              className="ui-speed-dial__action"
              data-icon={action.icon}
              data-value={action.value ?? action.label}
              role="menuitem"
              type="button"
            >
              {action.icon && (
                <span
                  aria-hidden="true"
                  className="ui-speed-dial__action-icon ui-icon"
                >
                  {renderLucideIcon(
                    action.icon, `ui-icon__svg lucide-${action.icon}`
                  )}
                </span>
              )}
              <span className="ui-speed-dial__action-label">
                {action.label}
              </span>
            </button>
          </li>
        ))}
        {children}
      </menu>
    </div>
  )
}

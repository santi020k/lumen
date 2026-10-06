'use client'

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
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  alignLumenChartSeries,
  composeClassName,
  createLumenBarGeometry,
  createLumenChartDatumActivation,
  createLumenHeatmapDatumActivation,
  createLumenHeatmapModel,
  createLumenLineChartModel,
  createLumenLineGeometry,
  createLumenMessageScrollerController,
  createLumenPieGeometry,
  createLumenRangeDatumActivation,
  createLumenRangeGeometry,
  createLumenScatterGeometry,
  createLumenScatterReferences,
  formatLumenChartSummary,
  formatLumenLanguageLabel,
  formatLumenPhoneNumber,
  getLumenChartCategories,
  getLumenChartCategoryLabel,
  getLumenChartCategoryTicks,
  getLumenChartDomain,
  getLumenChartTicks,
  getLumenChartToneClassName,
  getLumenHeatmapColor,
  getLumenIcon,
  getLumenPhoneCountries,
  getLumenPhoneFlagSource,
  getLumenPieChartVariantClassName,
  hasLumenChartData,
  hasLumenPieData,
  type LumenBarChartLayout,
  type LumenChartDatum,
  type LumenChartDatumActivationDetail,
  type LumenChartDomain,
  type LumenChartLabels,
  type LumenChartOrientation,
  type LumenChartSeries,
  type LumenChartTone,
  type LumenCodeToken,
  lumenCodeTokenClassNames,
  type LumenComboSeries,
  type LumenControlVisualSize,
  type LumenErrorStateAnnouncement,
  type LumenErrorStateKind,
  type LumenErrorStateLayout,
  type LumenFormErrorInput,
  type LumenFormStatus,
  type LumenHeatmapDatum,
  type LumenHeatmapOptions,
  type LumenIconName,
  type LumenIllustrationElement,
  lumenIllustrations,
  type LumenLineChartOptions,
  type LumenPhoneCountry,
  type LumenPhoneCountryOptions,
  type LumenPhoneNumber,
  type LumenPieChartVariant,
  type LumenRangeDatum,
  type LumenScatterReference,
  type LumenScatterScaleType,
  type LumenTabsChangeDetail,
  normalizeLumenFormErrors,
  resolveLumenChartLabels,
  resolveLumenChartTone,
  resolveLumenPhoneNumber,
  scaleLumenChartValue,
  tokenizeLumenCode
} from '@santi020k/lumen-core'
import { parseLumenDate as parseCalendarDate, resolveLumenDateLabels as resolveDateControlLabels, resolveLumenDateLocale as getCalendarLocale } from '@santi020k/lumen-core'
import { renderSVG } from 'uqr'

import { ChartInspection } from './chart-inspection.js'
import { ChartInteraction, type ChartInteractionProps } from './chart-interaction.js'
import { getChartPlotLabel } from './chart-label.js'
import { createReactChartDatumAction, formatReactChartTableValue, type ReactChartDatumAction, readReactChartDatumActivation } from './chart-recipes.js'
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
  type ToastPlacement,
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
import { renderIconSvg } from './icon-svg.js'
import { IconView } from './icon-view.js'
import {
  resolveReactPhoneInputCountry,
  resolveReactPhoneInputValue
} from './phone-recipes.js'
import {
  Input,
  type InputProps,
  Label
} from './server-components.js'
import { useCopyFeedback } from './use-copy-feedback.js'

export {
  Badge,
  type BadgeProps,
  Card,
  CardContent,
  type CardContentProps,
  CardDescription,
  type CardDescriptionProps,
  CardFooter,
  type CardFooterProps,
  CardHeader,
  type CardHeaderProps,
  type CardProps,
  CardTitle,
  type CardTitleProps,
  Container,
  type ContainerProps,
  Direction,
  type DirectionProps,
  Grid,
  type GridProps,
  Input,
  type InputProps,
  Label,
  type LabelProps,
  Progress,
  type ProgressProps,
  Separator,
  type SeparatorProps,
  Skeleton,
  type SkeletonProps,
  Spinner,
  type SpinnerProps,
  Stack,
  type StackProps,
  Textarea,
  type TextareaProps,
  Typography,
  type TypographyProps,
  VisuallyHidden,
  type VisuallyHiddenProps
} from './server-components.js'

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning'

type AccordionVariant = 'default' | 'flush'

type ButtonSize = 'default' | 'icon' | 'lg' | 'sm'

type ButtonVariant =
  'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'

type CodeTheme = 'auto' | 'lumen' | 'santi020k'

type CodeVariant = 'block' | 'inline'

type IconSize = 'default' | 'lg' | 'sm' | 'xl'

const getChartCategoryKey = (value: number | string): string => `${typeof value}:${String(value)}`

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
  dismissOnEscape,
  dismissOnOutsidePress,
  glass = false,
  onCancel,
  onClick,
  onClose,
  onOpenChange,
  onPointerDown,
  open,
  ...props
}: AlertDialogProps) => {
  const dialog = useDialog({ alert: true, defaultOpen, dismissOnEscape, dismissOnOutsidePress, onOpenChange, open })

  return (
    <dialog
      {...dialog.dialogProps}
      {...props}
      className={composeClassName(
        'ui-dialog ui-alert-dialog', glassSurfaceClass('ui-dialog', glass), className
      )}
      data-surface={resolveSurface(glass)}
      onCancel={composeHandlers(onCancel, dialog.dialogProps.onCancel)}
      onPointerDown={composeHandlers(onPointerDown, dialog.dialogProps.onPointerDown)}
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
  const isDisabled = disabled === true || loading

  const buttonClassName = composeClassName(
    'ui-button', `ui-button--${variant}`, size === 'default' ? 'ui-button--default-size' : `ui-button--${size}`, isDisabled && 'ui-button--disabled', loading && 'ui-button--loading', className
  )

  if (asChild) {
    const child = children

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
        aria-disabled={isDisabled ? true : undefined}
        className={composeClassName(buttonClassName, child.props.className)}
        data-slot="button"
        onClickCapture={isDisabled ?
          (event: ReactMouseEvent<HTMLElement>) => {
            event.preventDefault()

            event.stopPropagation()
          } :
          props.onClickCapture ?? child.props.onClickCapture}
        onKeyDownCapture={isDisabled ?
          (event: KeyboardEvent<HTMLElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()

              event.stopPropagation()
            }
          } :
          props.onKeyDownCapture ?? child.props.onKeyDownCapture}
        ref={ref as Ref<HTMLElement>}
        tabIndex={isDisabled ? -1 : props.tabIndex ?? child.props.tabIndex}
      >
        {loading && <span aria-hidden="true" className="ui-spinner" />}
        <span className="ui-button__content">{child.props.children}</span>
      </ChildComponent>
    )
  }

  return (
    <button
      aria-busy={loading || undefined}
      className={buttonClassName}
      data-slot="button"
      disabled={isDisabled}
      ref={ref}
      type={type}
      {...props}
    >
      {loading && <span aria-hidden="true" className="ui-spinner" />}
      <span className="ui-button__content">{children}</span>
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
  labels?: { previousMonth?: string, nextMonth?: string } | undefined
  locale?: string | undefined
  max?: string | undefined
  min?: string | undefined
  month?: string | undefined
  name?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  readOnly?: boolean | undefined
  value?: string | undefined
}
export const Calendar = ({
  className,
  defaultValue,
  disabled = false,
  glass = false,
  labels,
  locale,
  max,
  min,
  month,
  name,
  onValueChange,
  readOnly,
  value,
  ...props
}: CalendarProps) => {
  const calendar = useCalendar({
    defaultValue,
    disabled,
    labels,
    locale,
    max,
    min,
    month,
    name,
    onValueChange,
    readOnly,
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

interface DatumChartProps extends ChartProps {
  onDatumActivate: ((detail: LumenChartDatumActivationDetail) => void) | undefined
}

const DatumChart = ({ onClick, onDatumActivate, ...props }: DatumChartProps) => (
  <Chart
    {...props}
    data-ui-chart-activation={onDatumActivate ? true : undefined}
    data-ui-chart-adapter={onDatumActivate ? 'react' : undefined}
    onClick={event => {
      onClick?.(event)

      if (event.defaultPrevented || event.button !== 0 || !onDatumActivate) return

      const detail = readReactChartDatumActivation(event.currentTarget, event.target)

      if (detail) onDatumActivate(detail)
    }}
  />
)

const ChartDatumActions = ({ actions, label }: {
  actions: readonly (ReactChartDatumAction | null)[]
  label: string
}) => {
  const available = actions.filter(action => action !== null)

  if (available.length === 0) return null

  return (
    <details className="ui-chart__actions" data-ui-chart-actions>
      <summary>{label}</summary>
      <ul>
        {available.map(action => (
          <li key={action.key}><Button variant="ghost" data-ui-chart-datum={action.serialized}>{action.label}</Button></li>
        ))}
      </ul>
    </details>
  )
}

interface ChartLegendProps {
  label?: string
  series: readonly LumenChartSeries[]
}

const ChartLegend = ({ label = 'Chart legend', series }: ChartLegendProps) => (
  <ul aria-label={label} className="ui-chart__legend">
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
  labels?: Partial<LumenChartLabels>
  series: readonly LumenChartSeries[]
}

const ChartDataTable = ({
  categories,
  formatCategory,
  formatValue = String,
  labels,
  series
}: ChartDataTableProps) => {
  const resolvedLabels = resolveLumenChartLabels(labels)
  const alignedSeries = series.map(item => alignLumenChartSeries(item, categories))

  return (
    <details className="ui-chart__data">
      <summary>{resolvedLabels.viewData}</summary>
      <div aria-label={resolvedLabels.chartData} role="group" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th scope="col">{resolvedLabels.category}</th>
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
                  {getLumenChartCategoryLabel(alignedSeries, category, formatCategory, 'detail')}
                </th>
                {alignedSeries.map(item => {
                  const datum = item.data.find(
                    candidate => candidate.x === category
                  )

                  return (
                    <td key={item.id}>
                      {datum?.label ?? formatReactChartTableValue(datum?.y, formatValue, resolvedLabels.notAvailable)}
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
}

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
      </svg>
      {showEndpoint && endpoint && (
        <span
          aria-hidden="true"
          className="ui-sparkline__endpoint"
          style={{ left: `${endpoint.xCoordinate / 120 * 100}%`, top: `${endpoint.yCoordinate / 40 * 100}%` }}
        />
      )}
      <span className="ui-sr-only">{label}</span>
    </span>
  )
}

export interface BarChartProps extends Omit<ChartProps, 'children'> {
  onDatumActivate?: (detail: LumenChartDatumActivationDetail) => void
  categoryWidth?: number
  emptyLabel?: ReactNode
  formatCategory?: (category: number | string) => string
  formatValue?: (value: number) => string
  layout?: LumenBarChartLayout
  labels?: Partial<LumenChartLabels>
  orientation?: LumenChartOrientation
  series?: readonly LumenChartSeries[]
  showLegend?: boolean
  showTable?: boolean
}

/* eslint-disable complexity -- Chart renderers keep optional semantic and SVG layers colocated. */
export const BarChart = ({
  categoryWidth,
  className,
  onDatumActivate,
  emptyLabel,
  formatCategory,
  formatValue = String,
  layout = 'grouped',
  labels,
  orientation = 'vertical',
  series = emptyChartSeries,
  showLegend = series.length > 1,
  showTable = true,
  summary,
  ...props
}: BarChartProps) => {
  const resolvedLabels = resolveLumenChartLabels(labels)
  const categories = getLumenChartCategories(series)
  const alignedSeries = series.map(item => alignLumenChartSeries(item, categories))

  const geometry = createLumenBarGeometry(alignedSeries, {
    width: 480,
    height: 240,
    categoryWidth: categoryWidth ?? 160,
    ...(formatCategory === undefined ? {} : { formatCategory }),
    formatValue,
    layout,
    orientation
  })

  const hasData = hasLumenChartData(alignedSeries)
  const ticks = getLumenChartTicks(geometry.domain)
  const margin = geometry.margin

  const categoryTicks = getLumenChartCategoryTicks(geometry.categories.map(category => String(category.label)), {
    end: geometry.width - margin.right,
    positions: geometry.categories.map(category => category.x),
    start: margin.left
  })

  const valueTicks = getLumenChartCategoryTicks(ticks.map(tick => formatValue(tick)), {
    end: geometry.width - margin.right,
    minimumGap: 48,
    positions: ticks.map(tick => scaleLumenChartValue(
      tick, geometry.domain, margin.left, geometry.width - margin.right
    )),
    start: margin.left
  })

  const datumActions = onDatumActivate ?
    geometry.marks.map(mark => {
      const item = alignedSeries.find(candidate => candidate.id === mark.seriesId)
      const datum = item?.data.find(candidate => candidate.x === mark.category)

      return item && datum ?
        createReactChartDatumAction(
          createLumenChartDatumActivation(item.id, datum),
          `${getLumenChartCategoryLabel(alignedSeries, mark.category, formatCategory, 'detail')} · ${mark.seriesLabel}: ${formatValue(mark.value)}`,
          resolvedLabels
        ) :
        null
    }) :
    []

  return (
    <DatumChart
      onDatumActivate={onDatumActivate}
      className={composeClassName('ui-bar-chart', className)}
      summary={summary ?? formatLumenChartSummary(alignedSeries, formatValue, resolvedLabels)}
      {...props}
    >
      {showLegend && hasData && <ChartLegend label={resolvedLabels.chartLegend} series={series} />}
      {!hasData && (
        <p className="ui-chart__empty" role="status">
          {emptyLabel ?? resolvedLabels.empty}
        </p>
      )}
      <div aria-label={resolvedLabels.chartData} className="ui-chart__plot" role="region" tabIndex={0} hidden={!hasData}>
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
                  <Fragment key={tick}>
                    <line x1={margin.left} x2={geometry.width - margin.right} y1={coordinate} y2={coordinate} />
                    <text x={margin.left - 8} y={coordinate}>{formatValue(tick)}</text>
                  </Fragment>
                )
            })}
          </g>
          <g className="ui-chart__axis-labels">
            {orientation === 'horizontal' ?
              geometry.categories.map(category => (
                <text
                  dominantBaseline="middle"
                  key={getChartCategoryKey(category.category)}
                  textAnchor="end"
                  x={category.x}
                  y={category.y}
                >
                  {getLumenChartCategoryTicks([String(category.label)], { end: margin.left - 16, start: 0 })[0]?.label}
                </text>
              )) :
              categoryTicks.map(tick => (
                <text key={tick.index} textAnchor={tick.textAnchor} x={tick.position} y={geometry.height - 20}>
                  {tick.label}
                </text>
              ))}
          </g>
          {orientation === 'horizontal' && (
            <g className="ui-chart__axis-labels">
              {valueTicks.map(tick => (
                <text key={tick.index} textAnchor={tick.textAnchor} x={tick.position} y={geometry.height - 6}>
                  {tick.label}
                </text>
              ))}
            </g>
          )}
          <g className="ui-bar-chart__marks">
            {geometry.marks.map((mark, index) => (
              <rect
                className={getLumenChartToneClassName(mark.tone)}
                data-ui-chart-datum={datumActions[index]?.serialized}
                height={mark.height}
                key={`${mark.seriesId}:${getChartCategoryKey(mark.category)}`}
                rx="4"
                width={mark.width}
                x={mark.x}
                y={mark.y}
              >
                <title>
                  {`${getLumenChartCategoryLabel(alignedSeries, mark.category, formatCategory, 'detail')} · ${mark.seriesLabel}: ${formatValue(mark.value)}`}
                </title>
              </rect>
            ))}
            {onDatumActivate && geometry.marks.map((mark, index) => (
              <rect
                className="ui-chart__datum-hit"
                key={`${mark.seriesId}:${getChartCategoryKey(mark.category)}`}
                width={Math.max(12, mark.width)}
                height={Math.max(12, mark.height)}
                x={mark.x - Math.max(0, 12 - mark.width) / 2}
                y={mark.y - Math.max(0, 12 - mark.height) / 2}
                data-ui-chart-datum={datumActions[index]?.serialized}
              />
            ))}
          </g>
        </svg>
      </div>
      {showTable && hasData && (
        <ChartDataTable
          categories={categories}
          {...(formatCategory === undefined ? {} : { formatCategory })}
          formatValue={formatValue}
          labels={resolvedLabels}
          series={series}
        />
      )}
      {onDatumActivate && <ChartDatumActions actions={datumActions} label={resolvedLabels.exploreData} />}
    </DatumChart>
  )
}

export interface LineChartProps extends Omit<ChartProps, 'children'>, LumenLineChartOptions, ChartInteractionProps {
  onDatumActivate?: (detail: LumenChartDatumActivationDetail) => void
  area?: boolean
  emptyLabel?: ReactNode
  formatCategory?: (category: number | string) => string
  formatValue?: (value: number) => string
  labels?: Partial<LumenChartLabels>
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
  onDatumActivate,
  annotations,
  domain: requestedDomain,
  height: requestedHeight,
  width: requestedWidth,
  xDomain,
  xScale = 'categorical',
  interactive = false,
  syncGroup,
  cursor,
  onCursorChange,
  className,
  emptyLabel,
  formatCategory,
  formatValue = String,
  labels,
  markers = 'auto',
  referenceValue,
  series = emptyChartSeries,
  showLegend = series.length > 1,
  showTable = true,
  summary,
  ...props
}: LineChartProps) => {
  const resolvedLabels = resolveLumenChartLabels(labels)

  const model = createLumenLineChartModel(series, {
    xScale,
    formatValue,
    ...(annotations ? { annotations } : {}),
    ...(requestedDomain ? { domain: requestedDomain } : {}),
    ...(requestedHeight === undefined ? {} : { height: requestedHeight }),
    ...(requestedWidth === undefined ? {} : { width: requestedWidth }),
    ...(xDomain ? { xDomain } : {}),
    ...(referenceValue === undefined ? {} : { referenceValue }),
    ...(formatCategory ? { formatCategory } : {})
  })

  const {
    width, height, padding, paddingLeft, categories, categoryTicks, domain, geometries, ticks, series: alignedSeries
  } = model

  const hasData = hasLumenChartData(alignedSeries)
  const markerStep = getLineChartMarkerStep(markers, categories.length)

  const pointActions = onDatumActivate ?
    geometries.map((geometry, index) => {
      const item = alignedSeries[index]

      if (!item) return []

      return geometry.points.map(point => createReactChartDatumAction(
        createLumenChartDatumActivation(item.id, point),
        `${getLumenChartCategoryLabel(alignedSeries, point.x, formatCategory, 'detail')} · ${item.label}: ${formatValue(point.y ?? 0)}`,
        resolvedLabels
      ))
    }) :
    []

  const datumActions = pointActions.flat()

  const referenceY =
    referenceValue === undefined ?
      undefined :
      scaleLumenChartValue(referenceValue, domain, height - padding, padding)

  return (
    <DatumChart
      onDatumActivate={onDatumActivate}
      className={composeClassName('ui-line-chart', className)}
      summary={summary ?? formatLumenChartSummary(alignedSeries, formatValue, resolvedLabels)}
      {...props}
    >
      <ChartInteraction
        interactive={interactive}
        model={model}
        showLegend={showLegend}
        {...(syncGroup ? { syncGroup } : {})}
        {...(cursor === undefined ? {} : { cursor })}
        {...(onCursorChange ? { onCursorChange } : {})}
      >
        {showLegend && hasData && (interactive ?
          (
            <ul
              className="ui-chart__legend"
              aria-label={resolvedLabels.chartLegend}
            >
              {series.map((item, index) => <li key={item.id} className={getLumenChartToneClassName(item.tone, index)}><Button aria-pressed="true" data-ui-chart-toggle={item.id} disabled size="sm" variant="ghost">{item.label}</Button></li>)}
            </ul>
          ) :
          <ChartLegend label={resolvedLabels.chartLegend} series={series} />)}
        {!hasData && (
          <p className="ui-chart__empty" role="status">
            {emptyLabel ?? resolvedLabels.empty}
          </p>
        )}
        <div
          aria-label={getChartPlotLabel(props['aria-label'], props.heading, resolvedLabels.chartData)}
          className="ui-chart__plot"
          data-ui-chart-interaction-plot={interactive || undefined}
          role="region"
          tabIndex={0}
          hidden={!hasData}
        >
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
                    <line x1={paddingLeft} x2={width - padding} y1={y} y2={y} />
                    <text x={paddingLeft - 8} y={y}>
                      {formatValue(tick)}
                    </text>
                  </Fragment>
                )
              })}
            </g>
            <g className="ui-chart__axis-labels">
              {categoryTicks.map(tick => (
                <text key={tick.index} textAnchor={tick.textAnchor} x={tick.position} y={height - 14}>
                  {tick.label}
                </text>
              ))}
            </g>
            <svg
              x={paddingLeft}
              y={padding}
              width={width - padding - paddingLeft}
              height={height - 2 * padding}
              viewBox={`${paddingLeft} ${padding} ${width - padding - paddingLeft} ${height - 2 * padding}`}
              overflow="hidden"
            >
              {referenceY !== undefined && (
                <line
                  className="ui-chart__reference"
                  x1={paddingLeft}
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
                    data-ui-chart-series={item.id}
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
                            data-ui-chart-datum={pointActions[index]?.[pointIndex]?.serialized}
                            className="ui-line-chart__point"
                            cx={point.xCoordinate}
                            cy={point.yCoordinate}
                            key={getChartCategoryKey(point.x)}
                            r="3"
                          >
                            <title>
                              {`${getLumenChartCategoryLabel(alignedSeries, point.x, formatCategory, 'detail')} · ${item.label}: ${formatValue(point.y ?? 0)}`}
                            </title>
                          </circle>
                        )
                      )}
                    {onDatumActivate && geometry.points.map((point, pointIndex) => (
                      <circle
                        className="ui-chart__datum-hit"
                        key={point.id ?? getChartCategoryKey(point.x)}
                        cx={point.xCoordinate}
                        cy={point.yCoordinate}
                        r="10"
                        data-ui-chart-datum={pointActions[index]?.[pointIndex]?.serialized}
                      />
                    ))}
                  </g>
                )
              })}
            </svg>
            {model.annotationMarks.map(mark => (
              <g key={mark.id} className={composeClassName('ui-chart__annotation', getLumenChartToneClassName(mark.tone))}>
                {mark.axis === 'x' ?
                  (
                    <>
                      <line x1={mark.coordinate} x2={mark.coordinate} y1={padding} y2={height - padding} />
                      <text x={mark.coordinate + 4} y={padding - 8}>{mark.label}</text>
                    </>
                  ) :
                  (
                    <>
                      <line x1={paddingLeft} x2={width - padding} y1={mark.coordinate} y2={mark.coordinate} />
                      <text textAnchor="end" x={width - padding} y={mark.coordinate - 8}>{mark.label}</text>
                    </>
                  )}
              </g>
            ))}
            {interactive && <line className="ui-chart__crosshair" data-ui-chart-crosshair style={{ display: 'none' }} y1={padding} y2={height - padding} />}
          </svg>
        </div>
        {model.annotationMarks.length > 0 && (
          <ul className="ui-sr-only">
            {model.annotationMarks.map(mark => (
              <li key={mark.id}>
                {mark.label}
                :
                {' '}
                {mark.axis === 'x' ? getLumenChartCategoryLabel(alignedSeries, mark.value, formatCategory, 'detail') : formatValue(Number(mark.value))}
              </li>
            ))}
          </ul>
        )}
        {interactive && hasData && (
          <ChartInspection
            model={model}
            {...(formatCategory ? { formatCategory } : {})}
            formatValue={formatValue}
            labels={resolvedLabels}
          />
        )}
      </ChartInteraction>
      {showTable && hasData && (
        <ChartDataTable
          categories={categories}
          {...(formatCategory === undefined ? {} : { formatCategory })}
          formatValue={formatValue}
          labels={resolvedLabels}
          series={series}
        />
      )}
      {onDatumActivate && <ChartDatumActions actions={datumActions} label={resolvedLabels.exploreData} />}
    </DatumChart>
  )
}

export interface PieChartProps extends Omit<ChartProps, 'children'> {
  onDatumActivate?: (detail: LumenChartDatumActivationDetail) => void
  centerLabel?: ReactNode
  centerValue?: ReactNode
  labels?: Partial<LumenChartLabels>
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
  onDatumActivate,
  labels,
  series = emptyPieSeries,
  showLegend = true,
  showTable = true,
  summary,
  valueFormatter = String,
  variant = 'donut',
  ...props
}: PieChartProps) => {
  const resolvedLabels = resolveLumenChartLabels(labels)
  const geometry = createLumenPieGeometry(series.data, { variant })
  const hasData = hasLumenPieData(series.data)

  const renderedSeries = {
    ...series,
    data: series.data.filter(datum => datum.y !== null && Number.isFinite(datum.y) && datum.y > 0)
  }

  const hasCenterLabel = centerLabel !== null && centerLabel !== undefined
  const hasCenterValue = centerValue !== null && centerValue !== undefined

  const datumActions = onDatumActivate ?
    geometry.slices.map((slice, index) => {
      const datum = renderedSeries.data[index]

      return datum ?
        createReactChartDatumAction(
          createLumenChartDatumActivation(series.id, datum),
          `${slice.label} · ${series.label}: ${valueFormatter(slice.value)}`,
          resolvedLabels
        ) :
        null
    }) :
    []

  return (
    <DatumChart
      onDatumActivate={onDatumActivate}
      className={composeClassName(
        'ui-pie-chart', getLumenPieChartVariantClassName(variant), className
      )}
      summary={summary ?? formatLumenChartSummary([renderedSeries], valueFormatter, resolvedLabels)}
      {...props}
    >
      {showLegend && hasData && (
        <ul aria-label={resolvedLabels.chartLegend} className="ui-chart__legend">
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
          {resolvedLabels.empty}
        </p>
      )}
      <div className="ui-chart__plot ui-pie-chart__plot" hidden={!hasData}>
        <svg
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${geometry.size} ${geometry.size}`}
        >
          <g className="ui-pie-chart__slices">
            {geometry.slices.map((slice, index) => (
              <path
                className={getLumenChartToneClassName(slice.tone)}
                data-ui-chart-datum={datumActions[index]?.serialized}
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
          <summary>{resolvedLabels.viewData}</summary>
          <div aria-label={resolvedLabels.chartData} role="group" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{resolvedLabels.category}</th>
                  <th scope="col">{resolvedLabels.value}</th>
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
      {onDatumActivate && <ChartDatumActions actions={datumActions} label={resolvedLabels.exploreData} />}
    </DatumChart>
  )
}

const emptyScatterReferences: readonly LumenScatterReference[] = []

export interface ScatterChartProps extends Omit<ChartProps, 'children'> {
  onDatumActivate?: (detail: LumenChartDatumActivationDetail) => void
  formatValue?: (value: number) => string
  formatX?: (value: number | string) => string
  formatY?: (value: number) => string
  xDomain?: Partial<LumenChartDomain>
  domain?: Partial<LumenChartDomain>
  references?: readonly LumenScatterReference[]
  labels?: Partial<LumenChartLabels>
  series?: readonly LumenChartSeries[]
  showLegend?: boolean
  showTable?: boolean
  xScale?: LumenScatterScaleType
}

const ScatterPlotClip = ({ children, width, height }: { children: ReactNode, width: number, height: number }) => {
  const plotId = useId()

  return (
    <>
      <defs><clipPath id={plotId}><rect x="44" y="44" width={width - 88} height={height - 88} /></clipPath></defs>
      <g clipPath={`url(#${plotId})`}>{children}</g>
    </>
  )
}

export const ScatterChart = ({
  className,
  onDatumActivate,
  formatValue = String,
  formatX = String,
  formatY = formatValue,
  xDomain,
  domain,
  references = emptyScatterReferences,
  labels,
  series = emptyChartSeries,
  showLegend = series.length > 1,
  showTable = true,
  summary,
  xScale = 'linear',
  ...props
}: ScatterChartProps) => {
  const resolvedLabels = resolveLumenChartLabels(labels)

  const geometry = createLumenScatterGeometry(series, {
    xScale, ...(xDomain ? { xDomain } : {}), ...(domain ? { domain } : {})
  })

  const referenceGeometry = createLumenScatterReferences(references, geometry, xScale)

  const renderedSeries = series.map(item => ({
    ...item,
    data: geometry.points.filter(point => point.seriesId === item.id)
  })).filter(item => item.data.length > 0)

  const hasData = geometry.points.length > 0

  const datumActions = onDatumActivate ?
    geometry.points.map(point => createReactChartDatumAction(
      createLumenChartDatumActivation(point.seriesId, point),
      `${point.xLabel ?? formatX(point.x)} · ${point.seriesLabel}: ${point.label ?? formatY(point.y ?? 0)}`,
      resolvedLabels
    )) :
    []

  return (
    <DatumChart onDatumActivate={onDatumActivate} className={composeClassName('ui-scatter-chart', className)} summary={summary ?? formatLumenChartSummary(renderedSeries, formatY, resolvedLabels)} {...props}>
      {showLegend && hasData && <ChartLegend label={resolvedLabels.chartLegend} series={series} />}
      {!hasData && <p className="ui-chart__empty" role="status">{resolvedLabels.empty}</p>}
      <div aria-label={resolvedLabels.chartData} className="ui-chart__plot" role="region" tabIndex={0} hidden={!hasData}>
        <svg aria-hidden="true" viewBox={`0 0 ${geometry.width} ${geometry.height}`}>
          <ScatterPlotClip width={geometry.width} height={geometry.height}>
            <g className="ui-scatter-chart__references">
              {referenceGeometry.map(reference => reference.region ?
                (
                  <rect
                    key={reference.id}
                    x={Math.min(reference.x1, reference.x2)}
                    y={Math.min(reference.y1, reference.y2)}
                    width={Math.abs(reference.x2 - reference.x1)}
                    height={Math.abs(reference.y2 - reference.y1)}
                  >
                    <title>{reference.label}</title>
                  </rect>
                ) :
                (
                  <line key={reference.id} x1={reference.x1} x2={reference.x2} y1={reference.y1} y2={reference.y2}>
                    <title>{reference.label}</title>
                  </line>
                ))}
            </g>
            <g className="ui-scatter-chart__marks">
              {geometry.points.map((point, pointIndex) => (
                <circle data-ui-chart-datum={datumActions[pointIndex]?.serialized} className={getLumenChartToneClassName(point.tone)} cx={point.xCoordinate} cy={point.yCoordinate} key={`${point.seriesId}:${point.id ?? `${getChartCategoryKey(point.x)}:${pointIndex}`}`} r={point.radius}>
                  <title>{`${point.xLabel ?? formatX(point.x)} · ${point.seriesLabel}: ${point.label ?? formatY(point.y ?? 0)}`}</title>
                </circle>
              ))}
            </g>
          </ScatterPlotClip>
          {onDatumActivate && geometry.points.map((point, index) => {
            const visible = point.xCoordinate >= 44 && point.xCoordinate <= geometry.width - 44 &&
              point.yCoordinate >= 44 && point.yCoordinate <= geometry.height - 44

            return visible ?
              (
                <circle
                  className="ui-chart__datum-hit"
                  key={`${point.seriesId}:${point.id ?? getChartCategoryKey(point.x)}`}
                  cx={point.xCoordinate}
                  cy={point.yCoordinate}
                  r={Math.max(10, point.radius)}
                  data-ui-chart-datum={datumActions[index]?.serialized}
                />
              ) :
              null
          })}
        </svg>
      </div>
      {referenceGeometry.length > 0 && (
        <ul className="ui-scatter-chart__reference-labels">
          {referenceGeometry.map(reference => <li key={reference.id}>{reference.label}</li>)}
        </ul>
      )}
      {showTable && hasData && (
        <details className="ui-chart__data">
          <summary>{resolvedLabels.viewData}</summary>
          <div aria-label={resolvedLabels.chartData} role="group" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{resolvedLabels.x}</th>
                  <th scope="col">{resolvedLabels.series}</th>
                  <th scope="col">{resolvedLabels.value}</th>
                  <th scope="col">{resolvedLabels.size}</th>
                </tr>
              </thead>
              <tbody>
                {geometry.points.map((point, pointIndex) => (
                  <tr key={`${point.seriesId}:${point.id ?? `${getChartCategoryKey(point.x)}:${pointIndex}`}`}>
                    <th scope="row">{point.xLabel ?? formatX(point.x)}</th>
                    <td>{point.seriesLabel}</td>
                    <td>{point.label ?? formatY(point.y ?? 0)}</td>
                    <td>
                      {formatReactChartTableValue(point.size, formatValue, resolvedLabels.notAvailable)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {onDatumActivate && <ChartDatumActions actions={datumActions} label={resolvedLabels.exploreData} />}
    </DatumChart>
  )
}

export interface HeatmapProps extends Omit<ChartProps, 'children'>, LumenHeatmapOptions {
  onDatumActivate?: (detail: LumenChartDatumActivationDetail) => void
  showLegend?: boolean
  data?: readonly LumenHeatmapDatum[]
  formatValue?: (value: number) => string
  labels?: Partial<LumenChartLabels>
  showTable?: boolean
}

export const Heatmap = ({
  onDatumActivate,
  colorScale = 'sequential',
  midpoint = 0,
  domain,
  showLegend = true,
  className,
  data = emptyHeatmapData,
  formatValue = String,
  labels,
  showTable = true,
  summary,
  ...props
}: HeatmapProps) => {
  const resolvedLabels = resolveLumenChartLabels(labels)
  const geometry = createLumenHeatmapModel(data, { colorScale, midpoint, ...(domain ? { domain } : {}) })
  const availableCells = geometry.cells.filter(cell => cell.value !== null && Number.isFinite(cell.value))
  const hasData = availableCells.length > 0

  const datumActions = onDatumActivate ?
    availableCells.map(cell => createReactChartDatumAction(
      createLumenHeatmapDatumActivation(cell),
      `${cell.xLabel ?? cell.x} · ${cell.yLabel ?? cell.y}: ${cell.label ?? formatValue(cell.value ?? 0)}`,
      resolvedLabels
    )) :
    []

  const datumActionByCell = new Map(availableCells.map((cell, index) => [cell, datumActions[index]]))

  return (
    <DatumChart onDatumActivate={onDatumActivate} className={composeClassName('ui-heatmap', className)} summary={summary ?? resolvedLabels.formatHeatmapSummary(availableCells.length)} {...props}>
      {!hasData && <p className="ui-chart__empty" role="status">{resolvedLabels.empty}</p>}
      <div
        aria-label={getChartPlotLabel(props['aria-label'], props.heading, resolvedLabels.chartData)}
        className="ui-chart__plot"
        role="region"
        tabIndex={0}
        hidden={geometry.cells.length === 0}
      >
        <svg aria-hidden="true" viewBox={`0 0 ${geometry.width} ${geometry.height}`}>
          <g className="ui-chart__axis-labels">
            {geometry.xTicks.map(tick => <text key={tick.index} textAnchor={tick.textAnchor} x={tick.position} y="298">{tick.label}</text>)}
            {geometry.yTicks.map(tick => <text className="ui-heatmap__row-label" key={getChartCategoryKey(tick.value)} textAnchor="end" dominantBaseline="middle" x="108" y={tick.position}>{tick.label}</text>)}
          </g>
          <g className="ui-heatmap__cells">
            {geometry.cells.map(cell => {
              const missing = cell.value === null || !Number.isFinite(cell.value)

              return (
                <g key={JSON.stringify([cell.x, cell.y])}>
                  <rect
                    data-ui-chart-datum={datumActionByCell.get(cell)?.serialized}
                    height={Math.max(0, cell.height - 2)}
                    width={Math.max(0, cell.width - 2)}
                    x={cell.xCoordinate + 1}
                    y={cell.yCoordinate + 1}
                    style={{ fill: getLumenHeatmapColor(cell.value, geometry.domain, colorScale, geometry.midpoint) }}
                  >

                    <title>{`${cell.xLabel ?? cell.x} · ${cell.yLabel ?? cell.y}: ${missing ? resolvedLabels.notAvailable : cell.label ?? formatValue(cell.value ?? 0)}`}</title>
                  </rect>
                  {missing && <text className="ui-heatmap__missing" textAnchor="middle" dominantBaseline="middle" x={cell.xCoordinate + cell.width / 2} y={cell.yCoordinate + cell.height / 2}>×</text>}
                </g>
              )
            })}
          </g>
        </svg>
      </div>
      {showLegend && geometry.cells.length > 0 && (
        <div className="ui-heatmap__legend" aria-label={resolvedLabels.chartLegend}>
          <span>{formatValue(geometry.domain.min)}</span>
          <span
            style={{ background: geometry.legendBackground }}
            className="ui-heatmap__scale"
          >
            {colorScale === 'diverging' && <span style={{ left: `${geometry.midpointPercent}%` }}>{formatValue(geometry.midpoint)}</span>}
          </span>
          <span>{formatValue(geometry.domain.max)}</span>
          <span>
            ×
            {resolvedLabels.notAvailable}
          </span>
        </div>
      )}
      {showTable && (
        <details className="ui-chart__data">
          <summary>{resolvedLabels.viewData}</summary>
          <div aria-label={resolvedLabels.chartData} role="group" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{resolvedLabels.column}</th>
                  <th scope="col">{resolvedLabels.row}</th>
                  <th scope="col">{resolvedLabels.value}</th>
                </tr>
              </thead>
              <tbody>
                {geometry.cells.map(cell => (
                  <tr key={cell.id ?? `${getChartCategoryKey(cell.x)}:${getChartCategoryKey(cell.y)}`}>
                    <th scope="row">{cell.xLabel ?? cell.x}</th>
                    <td>{cell.yLabel ?? cell.y}</td>
                    <td>
                      {cell.label ?? (
                        cell.value === null || !Number.isFinite(cell.value) ?
                          resolvedLabels.notAvailable :
                          formatValue(cell.value)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {onDatumActivate && <ChartDatumActions actions={datumActions} label={resolvedLabels.exploreData} />}
    </DatumChart>
  )
}

export interface RangeChartProps extends Omit<ChartProps, 'children'> {
  onDatumActivate?: (detail: LumenChartDatumActivationDetail) => void
  data?: readonly LumenRangeDatum[]
  formatValue?: (value: number) => string
  labels?: Partial<LumenChartLabels>
  showTable?: boolean
  tone?: LumenChartTone
}

export const RangeChart = ({
  className,
  onDatumActivate,
  data = emptyRangeData,
  formatValue = String,
  labels,
  showTable = true,
  summary,
  tone = 'series-1',
  ...props
}: RangeChartProps) => {
  const resolvedLabels = resolveLumenChartLabels(labels)
  const width = 640
  const height = 320
  const padding = 44
  const geometry = createLumenRangeGeometry(data, { height, padding, width })

  const categoryTicks = getLumenChartCategoryTicks(geometry.points.map(point => String(point.xLabel ?? point.x)), {
    start: padding,
    end: width - padding,
    positions: geometry.points.map(point => point.xCoordinate)
  })

  const ticks = getLumenChartTicks(geometry.domain)

  const datumActions = onDatumActivate ?
    geometry.points.map(point => createReactChartDatumAction(
      createLumenRangeDatumActivation(point),
      `${point.xLabel ?? point.x}: ${point.label ?? `${formatValue(point.low ?? 0)}–${formatValue(point.high ?? 0)}`}`,
      resolvedLabels
    )) :
    []

  return (
    <DatumChart onDatumActivate={onDatumActivate} className={composeClassName('ui-range-chart', getLumenChartToneClassName(tone), className)} summary={summary ?? resolvedLabels.formatRangeSummary(geometry.points.length)} {...props}>
      {geometry.points.length === 0 && <p className="ui-chart__empty" role="status">{resolvedLabels.empty}</p>}
      <div aria-label={resolvedLabels.chartData} className="ui-chart__plot" role="region" tabIndex={0} hidden={geometry.points.length === 0}>
        <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`}>
          <g className="ui-chart__grid">
            {ticks.map(tick => {
              const y = scaleLumenChartValue(tick, geometry.domain, height - padding, padding)

              return (
                <g key={tick}>
                  <line x1={padding} x2={width - padding} y1={y} y2={y} />
                  <text x={padding - 8} y={y}>{formatValue(tick)}</text>
                </g>
              )
            })}
          </g>
          <g className="ui-chart__axis-labels">{categoryTicks.map(tick => <text key={tick.index} x={tick.position} y={height - 12} textAnchor={tick.textAnchor}>{tick.label}</text>)}</g>
          <path className="ui-range-chart__area" d={geometry.areaPath} />
          {geometry.points.map((point, index) => (
            <line
              data-ui-chart-datum={datumActions[index]?.serialized}
              className="ui-range-chart__interval"
              key={point.id ?? getChartCategoryKey(point.x)}
              x1={point.xCoordinate}
              x2={point.xCoordinate}
              y1={point.highCoordinate}
              y2={point.lowCoordinate}
            >
              <title>{`${point.xLabel ?? point.x}: ${point.label ?? `${formatValue(point.low ?? 0)}–${formatValue(point.high ?? 0)}`}`}</title>
            </line>
          ))}
          {onDatumActivate && geometry.points.map((point, index) => (
            <rect
              className="ui-chart__datum-hit"
              key={point.id ?? getChartCategoryKey(point.x)}
              x={point.xCoordinate - 10}
              y={Math.min(point.highCoordinate, point.lowCoordinate) -
                Math.max(0, 20 - Math.abs(point.highCoordinate - point.lowCoordinate)) / 2}
              width="20"
              height={Math.max(20, Math.abs(point.highCoordinate - point.lowCoordinate))}
              data-ui-chart-datum={datumActions[index]?.serialized}
            />
          ))}
        </svg>
      </div>
      {showTable && (
        <details className="ui-chart__data">
          <summary>{resolvedLabels.viewData}</summary>
          <div aria-label={resolvedLabels.chartData} role="group" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{resolvedLabels.category}</th>
                  <th scope="col">{resolvedLabels.low}</th>
                  <th scope="col">{resolvedLabels.high}</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id ?? getChartCategoryKey(item.x)}>
                    <th scope="row">{item.xLabel ?? item.x}</th>
                    <td>
                      {item.low === null || !Number.isFinite(item.low) ?
                        resolvedLabels.notAvailable :
                        formatValue(item.low)}
                    </td>
                    <td>
                      {item.high === null || !Number.isFinite(item.high) ?
                        resolvedLabels.notAvailable :
                        formatValue(item.high)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {onDatumActivate && <ChartDatumActions actions={datumActions} label={resolvedLabels.exploreData} />}
    </DatumChart>
  )
}

export interface ComboChartProps extends Omit<ChartProps, 'children'> {
  onDatumActivate?: (detail: LumenChartDatumActivationDetail) => void
  formatValue?: (value: number) => string
  labels?: Partial<LumenChartLabels>
  series?: readonly LumenComboSeries[]
  showLegend?: boolean
  showTable?: boolean
}

export const ComboChart = ({
  className,
  onDatumActivate,
  formatValue = String,
  labels,
  series = emptyComboSeries,
  showLegend = true,
  showTable = true,
  summary,
  ...props
}: ComboChartProps) => {
  const resolvedLabels = resolveLumenChartLabels(labels)
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
        paddingBottom: bars.margin.bottom,
        paddingTop: bars.margin.top,
        xDomain: { max: 1, min: 0 },
        xScale: 'linear' as const
      })
  }

  const lines = lineSeries.map(item => createLumenLineGeometry(
    item.data.map(alignComboLineDatum),
    lineGeometryOptions
  ))

  const hasData = hasLumenChartData(series)

  const barActions = onDatumActivate ?
    bars.marks.map(mark => {
      const item = barSeries.find(candidate => candidate.id === mark.seriesId)
      const datum = item?.data.find(candidate => candidate.x === mark.category)

      return item && datum ?
        createReactChartDatumAction(
          createLumenChartDatumActivation(item.id, datum),
          `${datum.xLabel ?? datum.x} · ${item.label}: ${datum.label ?? formatValue(mark.value)}`,
          resolvedLabels
        ) :
        null
    }) :
    []

  const pointActions = onDatumActivate ?
    lines.map((geometry, index) => {
      const item = lineSeries[index]

      return geometry.points.map(point => {
        const datum = item?.data.find(candidate => alignComboLineDatum(candidate).x === point.x)

        return item && datum ?
          createReactChartDatumAction(
            createLumenChartDatumActivation(item.id, datum),
            `${datum.xLabel ?? datum.x} · ${item.label}: ${datum.label ?? formatValue(point.y ?? 0)}`,
            resolvedLabels
          ) :
          null
      })
    }) :
    []

  const plotTop = barSeries.length > 0 ? bars.margin.top : padding
  const plotBottom = height - (barSeries.length > 0 ? bars.margin.bottom : padding)
  const plotLeft = barSeries.length > 0 ? bars.margin.left : padding
  const plotRight = width - (barSeries.length > 0 ? bars.margin.right : padding)
  const ticks = getLumenChartTicks(domain)
  const categoryLabels = categories.map(category => getLumenChartCategoryLabel(series, category))

  const categoryTicks = getLumenChartCategoryTicks(categoryLabels, {
    start: plotLeft,
    end: plotRight,
    ...(barSeries.length > 0 ? { positions: bars.categories.map(category => category.x) } : {})
  })

  const datumActions = [...barActions, ...pointActions.flat()]

  return (
    <DatumChart onDatumActivate={onDatumActivate} className={composeClassName('ui-combo-chart', className)} summary={summary ?? formatLumenChartSummary(series, formatValue, resolvedLabels)} {...props}>
      {showLegend && hasData && <ChartLegend label={resolvedLabels.chartLegend} series={series} />}
      {!hasData && <p className="ui-chart__empty" role="status">{resolvedLabels.empty}</p>}
      <div aria-label={resolvedLabels.chartData} className="ui-chart__plot" role="region" tabIndex={0} hidden={!hasData}>
        <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`}>
          <g className="ui-chart__grid">
            {ticks.map(tick => {
              const y = scaleLumenChartValue(tick, domain, plotBottom, plotTop)

              return (
                <g key={tick}>
                  <line x1={plotLeft} x2={plotRight} y1={y} y2={y} />
                  <text x={plotLeft - 8} y={y}>{formatValue(tick)}</text>
                </g>
              )
            })}
          </g>
          <g className="ui-chart__axis-labels">{categoryTicks.map(tick => <text key={tick.index} x={tick.position} y={height - 12} textAnchor={tick.textAnchor}>{tick.label}</text>)}</g>
          <g className="ui-bar-chart__marks">
            {bars.marks.map((mark, index) => <rect data-ui-chart-datum={barActions[index]?.serialized} className={getLumenChartToneClassName(mark.tone)} height={mark.height} key={`${mark.seriesId}:${getChartCategoryKey(mark.category)}`} rx="4" width={mark.width} x={mark.x} y={mark.y}><title>{`${mark.seriesLabel}: ${formatValue(mark.value)}`}</title></rect>)}
            {onDatumActivate && bars.marks.map((mark, index) => (
              <rect
                className="ui-chart__datum-hit"
                key={`${mark.seriesId}:${getChartCategoryKey(mark.category)}`}
                width={Math.max(12, mark.width)}
                height={Math.max(12, mark.height)}
                x={mark.x - Math.max(0, 12 - mark.width) / 2}
                y={mark.y - Math.max(0, 12 - mark.height) / 2}
                data-ui-chart-datum={barActions[index]?.serialized}
              />
            ))}
          </g>
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
                {geometry.points.map(point => (
                  <circle
                    key={point.id ?? getChartCategoryKey(point.x)}
                    className="ui-line-chart__point"
                    cx={point.xCoordinate}
                    cy={point.yCoordinate}
                    r="3.5"
                  />
                ))}
                {onDatumActivate && geometry.points.map((point, pointIndex) => (
                  <circle
                    className="ui-chart__datum-hit"
                    key={point.id ?? getChartCategoryKey(point.x)}
                    cx={point.xCoordinate}
                    cy={point.yCoordinate}
                    r="10"
                    data-ui-chart-datum={pointActions[index]?.[pointIndex]?.serialized}
                  />
                ))}
              </g>
            )
          })}
        </svg>
      </div>
      {showTable && hasData && (
        <ChartDataTable
          categories={categories}
          formatValue={formatValue}
          labels={resolvedLabels}
          series={series}
        />
      )}
      {onDatumActivate && <ChartDatumActions actions={datumActions} label={resolvedLabels.exploreData} />}
    </DatumChart>
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
  codeLabel?: string
  copyLabel?: string
  copiedLabel?: string
  errorLabel?: string
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

interface CodeCopyLabels {
  code: string | undefined
  copyLabel: string
  copiedLabel: string
  errorLabel: string
}

const CodeCopyButton = ({ code, copyLabel, copiedLabel, errorLabel }: CodeCopyLabels) => {
  const { accessibleLabel, handleClick, state } = useCopyFeedback({
    copiedLabel,
    errorLabel,
    getValue: button => {
      if (code !== undefined) return code

      const content = button.closest('[data-ui-code]')?.querySelector<HTMLElement>('pre code, code')

      return content?.innerText ?? content?.textContent ?? undefined
    },
    label: copyLabel
  })

  return (
    <>
      <button
        aria-label={accessibleLabel}
        className={composeClassName('ui-code__copy', state === 'copied' && 'ui-code__copy--copied')}
        data-state={state}
        data-ui-code-copy
        onClick={handleClick}
        title={accessibleLabel}
        type="button"
      >
        {renderLucideIcon('copy', 'ui-code__copy-icon')}
        {renderLucideIcon('check', 'ui-code__check-icon')}
      </button>
      <span aria-live="polite" className="ui-sr-only" role="status">
        {state === 'idle' ? '' : accessibleLabel}
      </span>
    </>
  )
}

const codeRegionProps = (wrap: boolean, codeLabel: string) => wrap ?
  {} :
  {
    'aria-label': codeLabel,
    role: 'region',
    tabIndex: 0
  }

const decorateCodeRegion = (pre: HTMLPreElement, codeLabel: string): (() => void) => {
  const generated = new Map<string, string>()
  const attributes: Record<string, string> = { tabindex: '0', role: 'region' }

  if (!pre.hasAttribute('aria-labelledby')) attributes['aria-label'] = codeLabel

  for (const [name, value] of Object.entries(attributes)) {
    if (pre.hasAttribute(name)) continue

    pre.setAttribute(name, value)

    generated.set(name, value)
  }

  const releaseOwnership = (records: readonly MutationRecord[]): void => {
    for (const record of records) {
      if (record.attributeName) generated.delete(record.attributeName)
    }
  }

  const Observer = pre.ownerDocument.defaultView?.MutationObserver
  const observer = Observer ? new Observer(releaseOwnership) : undefined

  observer?.observe(pre, { attributes: true, attributeFilter: [...generated.keys()] })

  return () => {
    // Drain pending consumer writes before deciding which attributes are still ours.
    releaseOwnership(observer?.takeRecords() ?? [])

    observer?.disconnect()

    for (const [name, value] of generated) {
      if (pre.getAttribute(name) === value) pre.removeAttribute(name)
    }
  }
}

const HighlightedCode = ({ children, codeLabel, wrap }: { children: ReactNode, codeLabel: string, wrap: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (wrap || !containerRef.current) return

    const restore = [...containerRef.current.querySelectorAll('pre')].map(pre => decorateCodeRegion(pre, codeLabel))

    return () => {
      for (const cleanup of restore) cleanup()
    }
  }, [children, codeLabel, wrap])

  return <div ref={containerRef}>{children}</div>
}

const resolveCodeLabels = ({ codeLabel, copyLabel, copiedLabel, errorLabel }: Record<'codeLabel' | 'copyLabel' | 'copiedLabel' | 'errorLabel', string | undefined>) => ({
  codeLabel: codeLabel ?? 'Code example',
  copyLabel: copyLabel ?? 'Copy code to clipboard',
  copiedLabel: copiedLabel ?? 'Code copied to clipboard',
  errorLabel: errorLabel ?? 'Could not copy code. Select and copy it manually.'
})

interface CodeHeaderOptions extends CodeCopyLabels {
  copy: boolean
  label: ReactNode
  language: string | undefined
}

const renderCodeHeader = ({ code, copy, copyLabel, copiedLabel, errorLabel, label, language }: CodeHeaderOptions) => {
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
      {copy && <CodeCopyButton code={code} copiedLabel={copiedLabel} copyLabel={copyLabel} errorLabel={errorLabel} />}
    </figcaption>
  )
}

export const Code = ({
  children,
  className,
  code,
  copy = false,
  codeLabel,
  copyLabel,
  copiedLabel,
  errorLabel,
  highlighted = false,
  label,
  language,
  theme = 'auto',
  variant = 'inline',
  wrap = false,
  ...props
}: CodeProps) => {
  const labels = resolveCodeLabels({ codeLabel, copyLabel, copiedLabel, errorLabel })
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
        {renderCodeHeader({ code, copy, ...labels, label, language })}
        {highlighted ?
          (
            <HighlightedCode codeLabel={labels.codeLabel} wrap={wrap}>{children}</HighlightedCode>
          ) :
          (
            <pre {...codeRegionProps(wrap, labels.codeLabel)}>
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
  copiedContent?: ReactNode
  copiedLabel?: string
  errorContent?: ReactNode
  errorLabel?: string
  label?: string
  resetAfter?: number
  target?: string
  toast?: boolean
  value?: string
  variant?: 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'
  size?: 'default' | 'icon' | 'lg' | 'sm'
}

const resolveCopyText = (target: string | undefined, value: string | undefined): string | undefined => {
  if (value !== undefined) return value

  if (!target) return undefined

  const targetElement = document.querySelector<HTMLElement>(target)

  return targetElement?.innerText ?? targetElement?.textContent ?? undefined
}

const resolveCopyFeedback = (content: ReactNode | undefined, fallback: string): ReactNode => (
  content ?? fallback
)

export const CopyButton = ({
  children = 'Copy',
  className,
  copiedContent,
  copiedLabel = 'Copied to clipboard',
  errorContent,
  errorLabel = 'Could not copy to clipboard',
  label = 'Copy to clipboard',
  onClick,
  resetAfter = 2000,
  size = 'default',
  target,
  toast = false,
  value,
  variant = 'outline',
  ...props
}: CopyButtonProps) => {
  const { accessibleLabel, handleClick, state } = useCopyFeedback({
    copiedLabel,
    errorLabel,
    getValue: () => resolveCopyText(target, value),
    label,
    onClick,
    resetAfter,
    toast
  })

  return (
    <Button
      aria-label={accessibleLabel}
      className={composeClassName('ui-copy-button', className)}
      data-slot="copy-button"
      data-state={state}
      data-ui-copy-button
      onClick={handleClick}
      size={size}
      variant={variant}
      {...props}
    >
      <span aria-hidden="true" data-slot="copy-idle" hidden={state !== 'idle'}>{children}</span>
      <span aria-hidden="true" data-slot="copy-copied" hidden={state !== 'copied'}>
        {resolveCopyFeedback(copiedContent, copiedLabel)}
      </span>
      <span aria-hidden="true" data-slot="copy-error" hidden={state !== 'error'}>
        {resolveCopyFeedback(errorContent, errorLabel)}
      </span>
    </Button>
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
  codeLabel?: string
  copyLabel?: string
  copiedLabel?: string
  errorLabel?: string
  initialValue?: string
  items?: readonly CodeTabItem[]
  storageKey?: string
  theme?: CodeTheme
  wrap?: boolean
}

export { Combobox, type ComboboxProps } from './combobox.js'

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

export type DatePickerProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'defaultValue' | 'type' | 'value'
> &
SurfaceProps & {
  defaultValue?: string
  formatDate?: (value: string) => string
  inputRef?: Ref<HTMLInputElement>
  labels?: { chooseDate?: string, previousMonth?: string, nextMonth?: string }
  locale?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  value?: string
}

const formatDatePickerDisplayValue = (
  value: string | undefined,
  placeholder: string,
  locale?: string,
  formatDate?: (value: string) => string
): string => {
  const date = parseCalendarDate(value)

  if (!date || !value) return placeholder

  if (formatDate) return formatDate(value)

  return new Intl.DateTimeFormat(getCalendarLocale(locale || 'en'), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(date)
}

const stringifyDatePickerConstraint = (
  value: number | string | undefined
): string | undefined => (value === undefined ? undefined : String(value))

const useDatePickerDisclosure = (unavailable: boolean) => {
  const [state, setState] = useState({ unavailable, open: false })

  if (state.unavailable !== unavailable) {
    setState({ unavailable, open: false })
  }

  const setOpen = useCallback((open: boolean) => {
    setState({ unavailable, open: open && !unavailable })
  }, [unavailable])

  return { open: state.open && !unavailable, setOpen }
}

/* eslint-disable complexity -- DatePicker coordinates controlled input, disclosure, Calendar, and native form contracts. */
export const DatePicker = ({
  className,
  defaultValue,
  disabled,
  formatDate,
  glass = false,
  id,
  inputRef,
  labels,
  locale,
  max,
  min,
  name,
  onChange,
  onInvalid,
  onValueChange,
  placeholder,
  readOnly,
  required,
  value,
  ...props
}: DatePickerProps) => {
  const generatedId = useId()
  const datePickerId = id ?? generatedId
  const nativeInputId = `${datePickerId}-native`
  const popoverId = `${datePickerId}-popover`
  const rootRef = useRef<HTMLDivElement | null>(null)
  const nativeInputRef = useRef<HTMLInputElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const { open: isOpen, setOpen } = useDatePickerDisclosure(disabled === true || readOnly === true)
  const selectedValue = value ?? internalValue
  const hasSelectedValue = selectedValue !== ''
  const dateLabels = { ...resolveDateControlLabels(locale || 'en'), ...labels }
  const placeholderText = placeholder ?? dateLabels.chooseDate
  const maxStr = stringifyDatePickerConstraint(max)
  const minStr = stringifyDatePickerConstraint(min)
  const accessibleLabel = props['aria-label']

  useEffect(() => {
    const owner = nativeInputRef.current?.form
    let active = true
    let resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined

    const reset = (event: Event) => {
      globalThis.clearTimeout(resetTimer)

      resetTimer = globalThis.setTimeout(() => {
        if (!active || event.defaultPrevented || !nativeInputRef.current?.isConnected) return

        if (value === undefined) setInternalValue(defaultValue ?? '')

        setOpen(false)
      })
    }

    owner?.addEventListener('reset', reset)

    return () => {
      active = false

      globalThis.clearTimeout(resetTimer)

      owner?.removeEventListener('reset', reset)
    }
  }, [defaultValue, props.form, value, setOpen])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)

    rootRef.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus({ preventScroll: true })

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen, setOpen])

  const selectDate = (nextValue: string) => {
    if (disabled || readOnly) return

    if (value === undefined) setInternalValue(nextValue)

    onValueChange?.(nextValue)

    if (nativeInputRef.current) {
      // Use the native setter so React's change event observes the selected value.
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')

      descriptor?.set?.call(nativeInputRef.current, nextValue)

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
      onKeyDown={event => {
        if (!isOpen || event.key !== 'Escape') return

        event.preventDefault()

        event.stopPropagation()

        setOpen(false)

        triggerRef.current?.focus({ preventScroll: true })
      }}
    >
      <input
        aria-hidden="true"
        className="ui-date-picker ui-date-picker__native"
        data-ui-date-picker-native
        data-ui-enhanced="true"
        disabled={disabled}
        id={nativeInputId}
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
        readOnly={readOnly}
        tabIndex={-1}
        type="date"
        value={selectedValue}
        {...props}
      />
      <div className="ui-date-picker__control" data-ui-date-picker-control>
        <button
          aria-controls={popoverId}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={accessibleLabel}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={props['aria-describedby']}
          aria-disabled={readOnly ? true : undefined}
          aria-required={required ?? undefined}
          className="ui-input ui-date-picker ui-date-picker__trigger"
          data-ui-date-picker-trigger
          disabled={disabled}
          id={datePickerId}
          onClick={() => {
            if (disabled || readOnly) return

            setOpen(!isOpen)
          }}
          onKeyDown={event => {
            if (event.key !== 'ArrowDown' || disabled || readOnly) return

            event.preventDefault()

            setOpen(true)
          }}
          ref={triggerRef}
          type="button"
        >
          <span data-ui-date-picker-value>
            {formatDatePickerDisplayValue(selectedValue, placeholderText, locale, formatDate)}
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
          aria-label={dateLabels.chooseDate}
          className="ui-date-picker__popover"
          data-state={isOpen ? 'open' : 'closed'}
          data-ui-date-picker-popover
          hidden={!isOpen}
          id={popoverId}
          role="dialog"
        >
          <Calendar
            disabled={disabled}
            readOnly={readOnly}
            labels={dateLabels}
            locale={locale}
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

const DialogCloseContext = createContext<(() => void) | null>(null)

export type DialogHeaderProps = ComponentPropsWithRef<'header'>
export const DialogHeader = ({ className, ...props }: DialogHeaderProps) => (
  <header {...props} className={composeClassName('ui-dialog-header', className)} data-slot="dialog-header" />
)

export type DialogTitleProps = ComponentPropsWithRef<'h2'> & { as?: 'h2' | 'h3' | 'h4' }
export const DialogTitle = ({ as: Tag = 'h2', className, ...props }: DialogTitleProps) => (
  <Tag {...props} className={composeClassName('ui-dialog-title', className)} data-slot="dialog-title" />
)

export type DialogBodyProps = ComponentPropsWithRef<'div'>
export const DialogBody = ({ className, ...props }: DialogBodyProps) => (
  <div {...props} className={composeClassName('ui-dialog-body', className)} data-slot="dialog-body" />
)

export type DialogFooterProps = ComponentPropsWithRef<'footer'>
export const DialogFooter = ({ className, ...props }: DialogFooterProps) => (
  <footer {...props} className={composeClassName('ui-dialog-footer', className)} data-slot="dialog-footer" />
)

export type DialogCloseProps = ButtonProps
export const DialogClose = ({ className, onClick, ...props }: DialogCloseProps) => {
  const close = use(DialogCloseContext)

  return (
    <Button
      {...props}
      className={composeClassName('ui-dialog-close', className)}
      data-slot="dialog-close"
      onClick={event => {
        onClick?.(event)

        if (event.defaultPrevented) return

        if (close) close()
        else event.currentTarget.closest('dialog')?.close()
      }}
    />
  )
}

export const Dialog = ({
  children,
  className,
  defaultOpen,
  dismissOnEscape,
  dismissOnOutsidePress,
  glass = false,
  layout = 'centered',
  onCancel,
  onClick,
  onClose,
  onOpenChange,
  onPointerDown,
  open,
  ...props
}: DialogProps) => {
  const dialog = useDialog({ defaultOpen, dismissOnEscape, dismissOnOutsidePress, onOpenChange, open })

  return (
    <dialog
      {...dialog.dialogProps}
      {...props}
      className={composeClassName(
        'ui-dialog', layout === 'fullscreen' && 'ui-dialog--fullscreen', glassSurfaceClass('ui-dialog', glass), className
      )}
      data-layout={layout}
      data-surface={resolveSurface(glass)}
      onCancel={composeHandlers(onCancel, dialog.dialogProps.onCancel)}
      onPointerDown={composeHandlers(onPointerDown, dialog.dialogProps.onPointerDown)}
      onClick={composeHandlers(onClick, dialog.dialogProps.onClick)}
      onClose={composeHandlers(onClose, dialog.dialogProps.onClose)}
    >
      <DialogCloseContext value={dialog.close}>{children}</DialogCloseContext>
    </dialog>
  )
}

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
  collisionPadding,
  defaultOpen,
  glass = false,
  offset,
  onOpenChange,
  open,
  placement,
  positioning,
  ...props
}: DropdownMenuProps) => {
  const menu = useDropdownMenu({ collisionPadding, defaultOpen, offset, onOpenChange, open, placement, positioning })

  return (
    <DropdownMenuContext value={menu}>
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
    </DropdownMenuContext>
  )
}

export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<'button'>
export const DropdownMenuTrigger = ({
  onClick,
  onKeyDown,
  ...props
}: DropdownMenuTriggerProps) => {
  const menu = requireContext(
    use(DropdownMenuContext), 'DropdownMenuTrigger'
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
    use(DropdownMenuContext), 'DropdownMenuContent'
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
    use(DropdownMenuContext), 'DropdownMenuItem'
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

  for (let pointIndex = 0; pointIndex < element.points.length; pointIndex += 2) {
    const x = element.points[pointIndex]
    const y = element.points[pointIndex + 1]

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
      {lumenIllustrations[variant].elements.map(renderIllustrationElement)}
    </svg>
  </span>
)

type ErrorStateHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface ErrorStateProps
  extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  actions?: ReactNode
  announce?: LumenErrorStateAnnouncement
  description?: string
  graphic?: false | ReactNode
  headingLevel?: ErrorStateHeadingLevel
  kind?: LumenErrorStateKind
  layout?: LumenErrorStateLayout
  reference?: string
  referenceLabel?: string
  title: string
}

interface ErrorStateAnnouncementProps {
  'aria-live'?: 'assertive' | 'off' | 'polite'
  role?: ComponentPropsWithoutRef<'section'>['role']
}

const resolveErrorStateAnnouncement = (
  announce: LumenErrorStateAnnouncement,
  ariaLive: ErrorStateAnnouncementProps['aria-live'],
  role: ErrorStateAnnouncementProps['role']
): ErrorStateAnnouncementProps => {
  if (announce === 'assertive') {
    return { 'aria-live': ariaLive ?? 'assertive', role: role ?? 'alert' }
  }

  if (announce === 'polite') {
    return { 'aria-live': ariaLive ?? 'polite', role: role ?? 'status' }
  }

  return {
    ...(ariaLive ? { 'aria-live': ariaLive } : {}),
    ...(role ? { role } : {})
  }
}

interface ErrorStateGraphicProps {
  graphic: ErrorStateProps['graphic']
  kind: LumenErrorStateKind
  layout: LumenErrorStateLayout
}

const ErrorStateGraphic = ({ graphic, kind, layout }: ErrorStateGraphicProps) => {
  if (graphic === false) return null

  return (
    <div
      aria-hidden="true"
      className="ui-error-state__graphic"
      data-slot="error-state-graphic"
    >
      {graphic ?? (
        <Illustration size={layout === 'compact' ? 'sm' : 'md'} variant={kind} />
      )}
    </div>
  )
}

interface ErrorStateContentProps {
  children: ReactNode
  description: ErrorStateProps['description']
  headingLevel: ErrorStateHeadingLevel
  reference: ErrorStateProps['reference']
  referenceLabel: string
  title: string
  titleId: string | undefined
}

const ErrorStateContent = ({
  children,
  description,
  headingLevel,
  reference,
  referenceLabel,
  title,
  titleId
}: ErrorStateContentProps) => (
  <div className="ui-error-state__content" data-slot="error-state-content">
    {createElement(
      `h${headingLevel}`,
      {
        className: 'ui-error-state__title',
        'data-slot': 'error-state-title',
        id: titleId
      },
      title
    )}
    {description && (
      <p className="ui-error-state__description" data-slot="error-state-description">
        {description}
      </p>
    )}
    {children && (
      <div className="ui-error-state__details" data-slot="error-state-details">
        {children}
      </div>
    )}
    {reference && (
      <p className="ui-error-state__reference" data-slot="error-state-reference">
        <span>
          {referenceLabel}
          :
        </span>
        {' '}
        <code>{reference}</code>
      </p>
    )}
  </div>
)

const ErrorStateActions = ({ actions }: Pick<ErrorStateProps, 'actions'>) => actions ?
  (
    <div className="ui-error-state__actions" data-slot="error-state-actions">
      {actions}
    </div>
  ) :
  null

export const ErrorState = ({
  'aria-live': ariaLive,
  actions,
  announce,
  children,
  className,
  description,
  graphic,
  headingLevel,
  id,
  kind,
  layout,
  reference,
  referenceLabel,
  role,
  title,
  ...props
}: ErrorStateProps) => {
  const resolvedAnnounce = announce ?? 'off'
  const resolvedHeadingLevel = headingLevel ?? 2
  const resolvedKind = kind ?? 'error'
  const resolvedLayout = layout ?? 'default'
  const resolvedReferenceLabel = referenceLabel ?? 'Reference'
  const titleId = id ? `${id}-title` : undefined

  const announcementProps = resolveErrorStateAnnouncement(
    resolvedAnnounce,
    ariaLive,
    role
  )

  return (
    <section
      aria-label={titleId ? undefined : title}
      aria-labelledby={titleId}
      className={composeClassName(
        'ui-error-state',
        `ui-error-state--${resolvedKind}`,
        `ui-error-state--${resolvedLayout}`,
        className
      )}
      data-kind={resolvedKind}
      data-layout={resolvedLayout}
      data-ui-error-state
      id={id}
      {...announcementProps}
      {...props}
    >
      <ErrorStateGraphic graphic={graphic} kind={resolvedKind} layout={resolvedLayout} />
      <ErrorStateContent
        description={description}
        headingLevel={resolvedHeadingLevel}
        reference={reference}
        referenceLabel={resolvedReferenceLabel}
        title={title}
        titleId={titleId}
      >
        {children}
      </ErrorStateContent>
      <ErrorStateActions actions={actions} />
    </section>
  )
}

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

export const Icon = ({ name, ...props }: IconProps) => (
  <IconView {...props} icon={name ? getLumenIcon(name) : undefined} />
)

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
  autoScroll?: boolean
  scrollThreshold?: number
}
export const MessageScroller = ({
  className,
  glass = false,
  autoScroll = false,
  scrollThreshold = 32,
  ...props
}: MessageScrollerProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current

    if (!root || !autoScroll) return

    const controller = createLumenMessageScrollerController(root, { threshold: scrollThreshold })

    return controller.destroy
  }, [autoScroll, scrollThreshold])

  return (
    <div
      ref={rootRef}
      className={composeClassName(
        'ui-message-scroller', glassClass('ui-message-scroller', glass), className
      )}
      {...props}
    />
  )
}

export interface NativeSelectProps extends ComponentPropsWithRef<'select'> {
  options?: SelectOption[]
  placeholder?: string
  visualSize?: LumenControlVisualSize
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
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  errorMessage?: string
  inputProps?: Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'defaultValue' | 'onChange' | 'name' | 'type'>
  inputRef?: Ref<HTMLInputElement>
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
  visualSize?: LumenControlVisualSize
  value?: LumenPhoneNumber
}

const emptyPhoneInputProps: NonNullable<PhoneInputProps['inputProps']> = {}

const phoneInputSizeModifiers = (visualSize: LumenControlVisualSize) => {
  if (visualSize === 'sm') {
    return { inputClass: 'ui-input--sm', selectClass: 'ui-select--sm' }
  }

  if (visualSize === 'lg') {
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
  visualSize: LumenControlVisualSize
}

const getPhoneInputOptions = (
  locale: LumenPhoneCountryOptions['locale']
): LumenPhoneCountryOptions => locale === undefined ? {} : { locale }

const getBooleanAttribute = (value: boolean): true | undefined => value ? true : undefined

export interface CountryFlagProps extends ComponentPropsWithoutRef<'span'> {
  regionCode: string
  decorative?: boolean
}

export const CountryFlag = ({ regionCode, decorative = false, className, ...props }: CountryFlagProps) => {
  const source = getLumenPhoneFlagSource(regionCode)

  return (
    <span {...props} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : props['aria-label'] ?? regionCode.toUpperCase()} className={composeClassName('ui-country-flag', className)} data-slot="country-flag" role={decorative ? undefined : 'img'}>
      {source ? <img alt="" height={18} src={source} width={24} /> : regionCode.toUpperCase().slice(0, 2)}
    </span>
  )
}

export interface PhoneNumberProps extends ComponentPropsWithoutRef<'span'> {
  value: LumenPhoneNumber
  link?: boolean
}

export const PhoneNumber = ({ value, link = false, className, ...props }: PhoneNumberProps) => {
  const content = (
    <>
      <CountryFlag decorative regionCode={value.country.regionCode} />
      <span>{formatLumenPhoneNumber(value) || '—'}</span>
    </>
  )

  const classes = composeClassName('ui-phone-number', className)

  return link && value.isValid && value.e164 ? <a {...props} className={classes} href={`tel:${value.e164}`} title={value.country.displayName}>{content}</a> : <span {...props} className={classes} title={value.country.displayName}>{content}</span>
}

const resolvePhoneError = (
  errorMessage: string | undefined,
  showValidationError: boolean,
  value: LumenPhoneNumber,
  invalidNumberMessage: string
): string | undefined => {
  if (errorMessage) return errorMessage

  if (showValidationError && value.nationalNumber.length > 0 && !value.isValid) return invalidNumberMessage

  return undefined
}

interface PhoneNumberInputProps {
  controlId: string
  errorId: string
  hasExplicitId: boolean
  inputClass: string | undefined
  inputProps: NonNullable<PhoneInputProps['inputProps']>
  inputRef: Ref<HTMLInputElement> | undefined
  invalid: boolean
  isDisabled: boolean
  isReadOnly: boolean
  name: string
  numberRef: RefObject<HTMLInputElement | null>
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  phoneValue: LumenPhoneNumber
  placeholder: string
  required: boolean | undefined
}

const resolvePhoneAria = (inputProps: NonNullable<PhoneInputProps['inputProps']>, invalid: boolean, errorId: string) => ({
  'aria-describedby': [inputProps['aria-describedby'], invalid ? errorId : undefined].filter(Boolean).join(' ') || undefined,
  'aria-errormessage': invalid ? errorId : inputProps['aria-errormessage'],
  'aria-invalid': invalid ? true : inputProps['aria-invalid']
})

const PhoneNumberInput = ({
  controlId, errorId, hasExplicitId, inputClass, inputProps, inputRef, invalid,
  isDisabled, isReadOnly, name, numberRef, onChange, phoneValue, placeholder, required
}: PhoneNumberInputProps) => (
  <input
    {...inputProps}
    {...resolvePhoneAria(inputProps, invalid, errorId)}
    autoComplete={inputProps.autoComplete ?? 'tel-national'}
    aria-label={inputProps['aria-label'] ?? (hasExplicitId ? undefined : placeholder)}
    className={composeClassName('ui-input ui-phone-input__number', inputClass, inputProps.className)}
    disabled={isDisabled}
    id={controlId}
    inputMode="tel"
    name={name}
    onChange={onChange}
    placeholder={placeholder}
    readOnly={isReadOnly}
    ref={node => {
      numberRef.current = node

      setRefValue(inputRef, node)
    }}
    required={required ?? inputProps.required}
    type="tel"
    value={phoneValue.nationalNumber}
  />
)

const PhoneCountryValue = ({ disabled, readOnly, form, name, value }: {
  disabled: boolean
  readOnly: boolean
  form?: string | undefined
  name: string
  value: string
}) => readOnly && !disabled ? <input form={form} name={name} type="hidden" value={value} /> : null

const MetadataPhoneInput = ({
  className,
  countryOptions,
  countryLabel,
  countryName,
  disabled,
  readOnly,
  required,
  errorMessage,
  id,
  inputProps = emptyPhoneInputProps,
  inputRef,
  defaultCountryValue,
  defaultValue,
  invalidNumberMessage,
  locale,
  name,
  onValueChange,
  placeholder,
  showValidationError,
  visualSize,
  value,
  ...props
}: ResolvedMetadataPhoneInputProps) => {
  const { selectClass, inputClass } = phoneInputSizeModifiers(visualSize)
  const isDisabled = [disabled, inputProps.disabled].some(Boolean)
  const isReadOnly = [readOnly, inputProps.readOnly].some(Boolean)
  const generatedId = useId()
  const controlId = id ?? inputProps.id ?? generatedId
  const errorId = `${generatedId}-error`
  const numberRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
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
    label: `${country.displayName} (${country.callingCode})`,
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

  const effectiveError = resolvePhoneError(errorMessage, showValidationError, phoneValue, invalidNumberMessage)
  const invalid = Boolean(effectiveError)

  useEffect(() => {
    numberRef.current?.setCustomValidity(effectiveError ?? '')
  }, [effectiveError])

  useEffect(() => {
    const form = numberRef.current?.form
    let active = true
    let resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined

    const reset = (event: Event): void => {
      globalThis.clearTimeout(resetTimer)

      resetTimer = globalThis.setTimeout(() => {
        const input = numberRef.current

        if (!active || event.defaultPrevented || !input?.isConnected) return

        if (value === undefined) {
          const country = resolveReactPhoneInputCountry(metadataCountries, defaultCountryValue, locale, undefined)

          setInternalValue(resolveReactPhoneInputValue(metadataCountries, country, defaultValue ?? '', phoneOptions))

          return
        }

        // Keep the DOM controls aligned with the application-owned value after native reset.
        const select = selectRef.current

        if (select) select.value = phoneValue.country.regionCode

        input.value = phoneValue.nationalNumber
      })
    }

    form?.addEventListener('reset', reset)

    return () => {
      active = false

      globalThis.clearTimeout(resetTimer)

      form?.removeEventListener('reset', reset)
    }
  }, [defaultCountryValue, defaultValue, inputProps.form, locale, metadataCountries, phoneOptions, phoneValue, value])

  return (
    <>
      <div
        className={composeClassName('ui-phone-input ui-input-group', className)}
        data-disabled={getBooleanAttribute(isDisabled)}
        data-invalid={getBooleanAttribute(invalid)}
        data-phone-enhanced="true"
        data-readonly={getBooleanAttribute(isReadOnly)}
        data-size={visualSize}
        data-slot="phone-input"
        {...props}
      >
        <span className="ui-phone-input__picker" data-slot="phone-country">
          <span aria-hidden="true" className="ui-phone-input__selection">
            <CountryFlag decorative regionCode={phoneValue.country.regionCode} />
            <span>{phoneValue.country.callingCode}</span>
            <span className="ui-phone-input__chevron" />
          </span>
          <select
            aria-label={countryLabel}
            className={composeClassName('ui-select ui-phone-input__country', selectClass)}
            disabled={isDisabled || isReadOnly || metadataCountries.length === 0}
            form={inputProps.form}
            name={countryName}
            onChange={handleCountryChange}
            ref={selectRef}
            value={phoneValue.country.regionCode}
          >
            {resolvedOptions.map(option => (
              <option disabled={option.disabled} key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </span>
        <PhoneNumberInput
          controlId={controlId}
          errorId={errorId}
          hasExplicitId={[id, inputProps.id].some(Boolean)}
          inputClass={inputClass}
          inputProps={inputProps}
          inputRef={inputRef}
          invalid={invalid}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          name={name}
          numberRef={numberRef}
          onChange={handleNumberChange}
          phoneValue={phoneValue}
          placeholder={placeholder}
          required={required}
        />
        <PhoneCountryValue
          disabled={isDisabled}
          form={inputProps.form}
          name={countryName}
          readOnly={isReadOnly}
          value={phoneValue.country.regionCode}
        />
      </div>
      {effectiveError && <span className="ui-phone-input__error" id={errorId} role="alert">{effectiveError}</span>}
    </>
  )
}

const resolveLegacyPhoneAttributes = (
  inputProps: NonNullable<PhoneInputProps['inputProps']>,
  props: {
    disabled: boolean | undefined
    readOnly: boolean | undefined
    required: boolean | undefined
    id: string | undefined
  }
) => ({
  autoComplete: inputProps.autoComplete ?? 'tel-national',
  disabled: props.disabled ?? inputProps.disabled,
  id: props.id ?? inputProps.id,
  readOnly: props.readOnly ?? inputProps.readOnly,
  required: props.required ?? inputProps.required
})

const resolveLegacyPhoneCountry = (
  options: ReturnType<typeof normalizeOption>[], value: string | undefined
): string => options.find(option => option.value === value)?.value ??
  options.find(option => !option.disabled)?.value ?? ''

const useLegacyPhoneCountry = (
  countries: SelectOption[], defaultCountryValue: string | undefined, form: string | undefined
) => {
  const options = countries.map(normalizeOption)
  const [countryValue, setCountryValue] = useState(() => resolveLegacyPhoneCountry(options, defaultCountryValue))
  const submissionCountry = resolveLegacyPhoneCountry(options, countryValue)
  const countryRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    const form = countryRef.current?.form
    let active = true

    queueMicrotask(() => {
      if (active) setCountryValue(countryRef.current?.value ?? '')
    })

    const reset = (event: Event): void => {
      queueMicrotask(() => {
        if (active && !event.defaultPrevented) setCountryValue(countryRef.current?.value ?? '')
      })
    }

    form?.addEventListener('reset', reset)

    return () => {
      active = false

      form?.removeEventListener('reset', reset)
    }
  }, [countries, defaultCountryValue, form])

  return { countryRef, options, setCountryValue, submissionCountry }
}

const LegacyPhoneInput = ({
  className,
  countries,
  countryOptions: _countryOptions,
  disabled,
  readOnly,
  required,
  errorMessage: _errorMessage,
  id,
  inputProps = emptyPhoneInputProps,
  inputRef,
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
  visualSize = 'default',
  value: _value,
  ...props
}: PhoneInputProps & { countries: SelectOption[] }) => {
  const { inputClass, selectClass } = phoneInputSizeModifiers(visualSize)
  const numberAttributes = resolveLegacyPhoneAttributes(inputProps, { disabled, readOnly, required, id })

  const { countryRef, options, setCountryValue, submissionCountry } = useLegacyPhoneCountry(
    countries, defaultCountryValue, inputProps.form
  )

  return (
    <div
      className={composeClassName('ui-phone-input ui-input-group', className)}
      {...props}
      data-disabled={getBooleanAttribute([disabled, inputProps.disabled].some(Boolean))}
      data-readonly={getBooleanAttribute([readOnly, inputProps.readOnly].some(Boolean))}
      data-size={visualSize}
      data-slot="phone-input"
    >
      <span className="ui-phone-input__picker">
        <select
          aria-label={countryLabel}
          className={composeClassName('ui-select ui-phone-input__country', selectClass)}
          defaultValue={defaultCountryValue}
          disabled={[disabled, readOnly, inputProps.disabled, inputProps.readOnly].some(Boolean)}
          form={inputProps.form}
          name={countryName}
          onChange={event => {
            setCountryValue(event.currentTarget.value)
          }}
          ref={countryRef}
        >
          {options.map(option => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      <input
        {...inputProps}
        {...numberAttributes}
        ref={inputRef}
        className={composeClassName('ui-input ui-phone-input__number', inputClass)}
        defaultValue={defaultValue}
        inputMode="tel"
        name={name}
        placeholder={placeholder}
        type="tel"
      />
      <PhoneCountryValue
        disabled={[disabled, inputProps.disabled].some(Boolean)}
        form={inputProps.form}
        name={countryName}
        readOnly={[readOnly, inputProps.readOnly].some(Boolean)}
        value={submissionCountry}
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
      visualSize={props.visualSize ?? 'default'}
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
  collisionPadding,
  defaultOpen,
  glass = false,
  offset,
  onOpenChange,
  open,
  placement,
  positioning,
  ...props
}: PopoverProps) => {
  const popover = usePopover({ collisionPadding, defaultOpen, offset, onOpenChange, open, placement, positioning })

  return (
    <PopoverContext value={popover}>
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
    </PopoverContext>
  )
}

export type PopoverTriggerProps = ButtonProps
export const PopoverTrigger = ({
  onClick,
  onKeyDown,
  ...props
}: PopoverTriggerProps) => {
  const popover = requireContext(use(PopoverContext), 'PopoverTrigger')

  return (
    <Button
      {...popover.triggerProps}
      {...props}
      onClick={composeHandlers(onClick, popover.triggerProps.onClick)}
      onKeyDown={composeHandlers(onKeyDown, popover.triggerProps.onKeyDown)}
      type={props.type ?? 'button'}
    />
  )
}

export type PopoverPanelProps = ComponentPropsWithoutRef<'div'>
export const PopoverPanel = ({ className, onKeyDown, ...props }: PopoverPanelProps) => {
  const popover = requireContext(use(PopoverContext), 'PopoverPanel')

  return (
    <div
      {...popover.panelProps}
      {...props}
      className={composeClassName('ui-popover__panel', className)}
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

/* eslint-disable @eslint-react/no-array-index-key */
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
/* eslint-enable @eslint-react/no-array-index-key, @eslint-react/no-children-to-array, @eslint-react/no-clone-element */

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
    'value'
  >,
  SelectOptions {
  glass?: LumenGlassProp
  inputRef?: Ref<HTMLSelectElement>
  onChange?: ComponentPropsWithoutRef<'select'>['onChange']
  visualSize?: LumenControlVisualSize
}

const getSelectSizeClass = (size: SelectProps['visualSize']) => {
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
  visualSize = 'default',
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

  const sizeClass = getSelectSizeClass(visualSize)

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
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={props['aria-describedby']}
          aria-invalid={props['aria-invalid']}
          aria-errormessage={props['aria-errormessage']}
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

export interface ToastViewportProps extends ComponentPropsWithoutRef<'div'> {
  maxCount?: number
  placement?: ToastPlacement
}

export const ToastViewport = ({
  'aria-atomic': ariaAtomic = 'false',
  'aria-label': ariaLabel = 'Notifications',
  'aria-live': ariaLive = 'polite',
  className,
  maxCount = 3,
  placement = 'bottom-right',
  ...props
}: ToastViewportProps) => (
  <div
    aria-atomic={ariaAtomic}
    aria-label={ariaLabel}
    aria-live={ariaLive}
    className={composeClassName('ui-tvp', className)}
    data-placement={placement}
    data-ui-toast-viewport
    data-ui-toast-max={maxCount}
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
  layout?: 'records' | 'scroll'
}
export const Table = ({ className, glass = false, layout = 'scroll', ...props }: TableProps) => (
  <div
    className={composeClassName(
      'ui-table-wrap', glassClass('ui-table-wrap', glass), layout === 'records' && 'ui-table-wrap--records', className
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
    <TabsContext value={tabs}>
      <div
        {...tabs.rootProps}
        {...props}
        className={composeClassName(
          'ui-tabs', glassClass('ui-tabs', glass), className
        )}
      >
        {children}
      </div>
    </TabsContext>
  )
}

export type TabsListProps = ComponentPropsWithoutRef<'div'>
export const TabsList = ({ ...props }: TabsListProps) => {
  const tabs = requireContext(use(TabsContext), 'TabsList')

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
  const tabs = requireContext(use(TabsContext), 'TabsTrigger')

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
  const tabs = requireContext(use(TabsContext), 'TabsPanel')

  return <div {...tabs.getPanelProps(value, props)} />
}

const emptyCodeTabItems: readonly CodeTabItem[] = []

export const CodeTabs = ({
  ariaLabel = 'Code examples',
  className,
  copy = true,
  codeLabel,
  copyLabel,
  copiedLabel,
  errorLabel,
  initialValue,
  items = emptyCodeTabItems,
  storageKey,
  theme = 'auto',
  wrap = true,
  ...props
}: CodeTabsProps) => {
  const labels = resolveCodeLabels({ codeLabel, copyLabel, copiedLabel, errorLabel })
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
        event as CustomEvent<LumenTabsChangeDetail>
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
      new CustomEvent<LumenTabsChangeDetail>('ui:tabs-change', {
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
            {...labels}
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
    <TooltipContext value={tooltip}>
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
    </TooltipContext>
  )
}

export type TooltipContentProps = ComponentPropsWithoutRef<'span'>
export const TooltipContent = ({ ...props }: TooltipContentProps) => {
  const tooltip = requireContext(use(TooltipContext), 'TooltipContent')

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

export { VirtualList, type VirtualListDataProps, type VirtualListProps } from './virtual-list.js'

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
    const child = children

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
  'type' | 'size' | 'value' | 'defaultValue'
> {
  hint?: ReactNode
  inputClassName?: string
  label?: ReactNode
  selectedFilesLabel?: string
}
export const FileUpload = ({
  children,
  className,
  hint,
  id,
  inputClassName,
  label = 'Choose a file or drag it here',
  selectedFilesLabel = '{count} files selected',
  onChange,
  ref,
  ...props
}: FileUploadProps) => {
  const generatedId = useId()
  const inputId = id ?? `ui-file-upload-${generatedId.replaceAll(':', '')}`
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const owner = inputRef.current?.ownerDocument
    let active = true

    const reset = (event: Event): void => {
      if (event.target !== inputRef.current?.form) return

      queueMicrotask(() => {
        if (active && !event.defaultPrevented) setSelectedFiles([])
      })
    }

    owner?.addEventListener('reset', reset)

    return () => {
      active = false

      owner?.removeEventListener('reset', reset)
    }
  }, [props.form])

  const selectedFileText =
    selectedFiles.length > 1 ?
      selectedFilesLabel.replaceAll('{count}', String(selectedFiles.length)) :
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
        ref={element => {
          inputRef.current = element

          if (typeof ref === 'function') return ref(element)

          if (ref) ref.current = element
        }}
        type="file"
        {...props}
        defaultValue={undefined}
        value={undefined}
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
  visualSize?: LumenControlVisualSize
  value?: string
}
export const Segmented = ({
  children,
  className,
  defaultValue,
  name = 'segmented',
  onValueChange,
  options = emptyOptions,
  visualSize = 'default',
  value,
  ...props
}: SegmentedProps) => (
  <div
    className={composeClassName(
      'ui-segmented', visualSize === 'sm' && 'ui-segmented--sm', visualSize === 'lg' && 'ui-segmented--lg', className
    )}
    role="group"
    {...props}
  >
    {options.map(normalizeOption).map(option => (
      <label className="ui-segmented__option" key={option.value}>
        <input
          checked={value === undefined ? undefined : value === option.value}
          defaultChecked={value === undefined ? defaultValue === option.value : undefined}
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
  const pendingCaretRef = useRef<{ position: number, value: string } | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [query, setQuery] = useState<string | null>(null)
  const currentValue = value ?? internalValue

  useLayoutEffect(() => {
    const pending = pendingCaretRef.current
    const input = inputRef.current

    if (!pending) return

    pendingCaretRef.current = null

    if (!input || currentValue !== pending.value) return

    input.focus()

    input.setSelectionRange(pending.position, pending.position)
  }, [currentValue])

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

    pendingCaretRef.current = { position: before.length, value: nextValue }

    setNextValue(nextValue)

    closeList()
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
        onBlur={() => {
          pendingCaretRef.current = null

          closeList()
        }}
        onChange={event => {
          pendingCaretRef.current = null

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
              tabIndex={-1}
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

export type DescriptionItemProps = ComponentPropsWithRef<'div'>
export const DescriptionItem = ({ className, ...props }: DescriptionItemProps) => (
  <div {...props} className={composeClassName('ui-description-item', 'ui-descriptions__item', className)} data-slot="description-item" />
)

export type DescriptionTermProps = ComponentPropsWithRef<'dt'>
export const DescriptionTerm = ({ className, ...props }: DescriptionTermProps) => (
  <dt {...props} className={composeClassName('ui-description-term', 'ui-descriptions__term', className)} data-slot="description-term" />
)

export type DescriptionDetailProps = ComponentPropsWithRef<'dd'>
export const DescriptionDetail = ({ className, ...props }: DescriptionDetailProps) => (
  <dd {...props} className={composeClassName('ui-description-detail', 'ui-descriptions__detail', className)} data-slot="description-detail" />
)

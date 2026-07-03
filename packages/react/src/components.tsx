import { composeClassName } from '@santi020k/lumen-core'

import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode
} from 'react'

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning'

type BadgeVariant = AlertVariant | 'outline' | 'secondary'

type ButtonSize = 'default' | 'icon' | 'lg' | 'sm'

type ButtonVariant = 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'

type CardVariant = 'default' | 'interactive' | 'muted'

type MessageFrom = 'assistant' | 'user'

type MarkerVariant = 'danger' | 'default' | 'success' | 'warning'

type Orientation = 'horizontal' | 'vertical'

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

const normalizeOption = (option: SelectOption): Option =>
  typeof option === 'string' ? { label: option, value: option } : option

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

export type AccordionProps = ComponentPropsWithoutRef<'div'>
export const Accordion = ({ className, ...props }: AccordionProps) => (
  <div className={composeClassName('ui-accordion', className)} {...props} />
)

export interface AlertProps extends ComponentPropsWithoutRef<'aside'> {
  variant?: AlertVariant
}

export const Alert = ({ className, variant = 'default', ...props }: AlertProps) => (
  <aside
    className={composeClassName('ui-alert', variantClass('ui-alert', variant), className)}
    data-variant={variant}
    {...props}
  />
)

export type AlertDialogProps = ComponentPropsWithoutRef<'dialog'>
export const AlertDialog = ({ className, ...props }: AlertDialogProps) => (
  <dialog className={composeClassName('ui-dialog ui-alert-dialog', className)} data-ui-alert-dialog {...props} />
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
  href?: string
}

export const Attachment = ({ className, href, ...props }: AttachmentProps) => {
  const nextClassName = composeClassName('ui-attachment', className)

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
}

export const Bubble = ({ className, from = 'assistant', ...props }: BubbleProps) => (
  <article
    className={composeClassName('ui-bubble', from === 'user' && 'ui-bubble--user', className)}
    data-from={from}
    {...props}
  />
)

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  size?: ButtonSize
  variant?: ButtonVariant
}

export const Button = ({
  className,
  disabled,
  size = 'default',
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps) => (
  <button
    className={composeClassName(
      'ui-button',
      `ui-button--${variant}`,
      size === 'default' ? 'ui-button--default-size' : `ui-button--${size}`,
      disabled && 'ui-button--disabled',
      className
    )}
    disabled={disabled}
    type={type}
    {...props}
  />
)

export type ButtonGroupProps = ComponentPropsWithoutRef<'div'>
export const ButtonGroup = ({ className, ...props }: ButtonGroupProps) => (
  <div className={composeClassName('ui-button-group', className)} {...props} />
)

export type CalendarProps = ComponentPropsWithoutRef<'div'>
export const Calendar = ({ className, ...props }: CalendarProps) => (
  <div className={composeClassName('ui-calendar', className)} {...props} />
)

export type CardProps<T extends ElementType = 'div'> = PrimitiveProps & {
  'data-variant'?: CardVariant
  as?: T
  uiClassName?: string
  variant?: CardVariant
}

export const Card = <T extends ElementType = 'div'>({
  as,
  className,
  variant = 'default',
  ...props
}: CardProps<T>) => (
  <Primitive
    {...(as ? { as } : {})}
    className={composeClassName(
      variant === 'muted' && 'ui-card--muted',
      variant === 'interactive' && 'ui-card--interactive',
      className
    )}
    data-variant={variant}
    uiClassName="ui-card"
    {...props}
  />
)

export type CarouselProps = ComponentPropsWithoutRef<'section'>
export const Carousel = ({ className, ...props }: CarouselProps) => (
  <section className={composeClassName('ui-carousel', className)} data-ui-carousel {...props} />
)

export type ChartProps = ComponentPropsWithoutRef<'figure'>
export const Chart = ({ className, ...props }: ChartProps) => (
  <figure className={composeClassName('ui-chart', className)} {...props} />
)

export type CheckboxProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'>
export const Checkbox = ({ className, ...props }: CheckboxProps) => (
  <input className={composeClassName('ui-checkbox', className)} type="checkbox" {...props} />
)

export type CollapsibleProps = ComponentPropsWithoutRef<'details'>
export const Collapsible = ({ className, ...props }: CollapsibleProps) => (
  <details className={composeClassName('ui-collapsible', className)} data-ui-collapsible {...props} />
)

export interface ComboboxProps extends ComponentPropsWithoutRef<'input'> {
  label?: ReactNode
  list: string
  options?: string[]
  wrapperClassName?: string
}

export const Combobox = ({
  className,
  label,
  list,
  options = emptyStringOptions,
  type = 'text',
  wrapperClassName,
  ...props
}: ComboboxProps) => (
  <label className={composeClassName('ui-combobox', wrapperClassName)} data-ui-combobox>
    {label && <span className="ui-label">{label}</span>}
    <input className={composeClassName('ui-input', className)} list={list} type={type} {...props} />
    <datalist id={list}>
      {options.map(option => <option key={option} value={option} />)}
    </datalist>
  </label>
)

export type CommandProps = ComponentPropsWithoutRef<'div'>
export const Command = ({ className, ...props }: CommandProps) => (
  <div className={composeClassName('ui-command', className)} data-ui-command {...props} />
)

export type ContextMenuProps = ComponentPropsWithoutRef<'menu'>
export const ContextMenu = ({ className, ...props }: ContextMenuProps) => (
  <menu className={composeClassName('ui-menu', className)} {...props} />
)

export type DataTableProps = ComponentPropsWithoutRef<'div'>
export const DataTable = ({ className, ...props }: DataTableProps) => (
  <div className={composeClassName('ui-data-table', className)} {...props} />
)

export type DatePickerProps = ComponentPropsWithoutRef<'input'>
export const DatePicker = ({ className, type = 'date', ...props }: DatePickerProps) => (
  <input className={composeClassName('ui-input ui-date-picker', className)} type={type} {...props} />
)

export type DialogProps = ComponentPropsWithoutRef<'dialog'>
export const Dialog = ({ className, ...props }: DialogProps) => (
  <dialog className={composeClassName('ui-dialog', className)} data-ui-dialog {...props} />
)

export type DirectionProps = ComponentPropsWithoutRef<'div'>
export const Direction = ({ className, dir = 'ltr', ...props }: DirectionProps) => (
  <div className={composeClassName('ui-direction', className)} dir={dir} {...props} />
)

export type DrawerProps = ComponentPropsWithoutRef<'dialog'>
export const Drawer = ({ className, ...props }: DrawerProps) => (
  <dialog className={composeClassName('ui-drawer', className)} data-ui-drawer {...props} />
)

export type DropdownMenuProps = ComponentPropsWithoutRef<'menu'>
export const DropdownMenu = ({ className, ...props }: DropdownMenuProps) => (
  <menu className={composeClassName('ui-menu', className)} data-ui-dropdown-menu {...props} />
)

export type EmptyProps = ComponentPropsWithoutRef<'section'>
export const Empty = ({ className, ...props }: EmptyProps) => (
  <section className={composeClassName('ui-empty', className)} {...props} />
)

export type FieldProps = ComponentPropsWithoutRef<'div'>
export const Field = ({ className, ...props }: FieldProps) => (
  <div className={composeClassName('ui-field', className)} {...props} />
)

export type HoverCardProps = ComponentPropsWithoutRef<'aside'>
export const HoverCard = ({ className, ...props }: HoverCardProps) => (
  <aside className={composeClassName('ui-hover-card', className)} data-ui-hover-card {...props} />
)

export type InputProps = ComponentPropsWithoutRef<'input'>
export const Input = ({ className, type = 'text', ...props }: InputProps) => (
  <input className={composeClassName('ui-input', className)} type={type} {...props} />
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

export type ItemProps = ComponentPropsWithoutRef<'div'>
export const Item = ({ className, ...props }: ItemProps) => (
  <div className={composeClassName('ui-item', className)} {...props} />
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

export type MenubarProps = ComponentPropsWithoutRef<'nav'>
export const Menubar = ({ className, ...props }: MenubarProps) => (
  <nav className={composeClassName('ui-menubar', className)} data-ui-menubar {...props} />
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

export type MessageScrollerProps = ComponentPropsWithoutRef<'div'>
export const MessageScroller = ({ className, ...props }: MessageScrollerProps) => (
  <div className={composeClassName('ui-message-scroller', className)} {...props} />
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

export type NavigationMenuProps = ComponentPropsWithoutRef<'nav'>
export const NavigationMenu = ({ className, ...props }: NavigationMenuProps) => (
  <nav className={composeClassName('ui-navigation-menu', className)} data-ui-navigation-menu {...props} />
)

export type PaginationProps = ComponentPropsWithoutRef<'nav'>
export const Pagination = ({ 'aria-label': ariaLabel = 'Pagination', className, ...props }: PaginationProps) => (
  <nav aria-label={ariaLabel} className={composeClassName('ui-pagination', className)} {...props} />
)

export type PopoverProps = ComponentPropsWithoutRef<'div'>
export const Popover = ({ className, ...props }: PopoverProps) => (
  <div className={composeClassName('ui-popover', className)} data-ui-popover {...props} />
)

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

export type ScrollAreaProps = ComponentPropsWithoutRef<'div'>
export const ScrollArea = ({ className, ...props }: ScrollAreaProps) => (
  <div className={composeClassName('ui-scroll-area', className)} {...props} />
)

export type SelectProps = NativeSelectProps
export const Select = (props: SelectProps) => <NativeSelect {...props} />

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

export type SheetProps = ComponentPropsWithoutRef<'dialog'>
export const Sheet = ({ className, ...props }: SheetProps) => (
  <dialog className={composeClassName('ui-sheet', className)} data-ui-sheet {...props} />
)

export type SidebarProps = ComponentPropsWithoutRef<'aside'>
export const Sidebar = ({ className, ...props }: SidebarProps) => (
  <aside className={composeClassName('ui-sidebar', className)} {...props} />
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

export type TableProps = ComponentPropsWithoutRef<'div'>
export const Table = ({ className, ...props }: TableProps) => (
  <div className={composeClassName('ui-table-wrap', className)} {...props} />
)

export type TabsProps = ComponentPropsWithoutRef<'div'>
export const Tabs = ({ className, ...props }: TabsProps) => (
  <div className={composeClassName('ui-tabs', className)} data-ui-tabs {...props} />
)

export type TextareaProps = ComponentPropsWithoutRef<'textarea'>
export const Textarea = ({ className, rows = 4, ...props }: TextareaProps) => (
  <textarea className={composeClassName('ui-textarea', className)} rows={rows} {...props} />
)

export interface ToastProps extends ComponentPropsWithoutRef<'aside'> {
  variant?: AlertVariant
}

export const Toast = ({ className, variant = 'default', ...props }: ToastProps) => (
  <aside
    className={composeClassName('ui-toast', variantClass('ui-toast', variant), className)}
    data-variant={variant}
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

export type TooltipProps = ComponentPropsWithoutRef<'span'>
export const Tooltip = ({ className, ...props }: TooltipProps) => (
  <span className={composeClassName('ui-tooltip', className)} {...props} />
)

export type TypographyProps = ComponentPropsWithoutRef<'div'>
export const Typography = ({ className, ...props }: TypographyProps) => (
  <div className={composeClassName('ui-typography', className)} {...props} />
)

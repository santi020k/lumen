import type { ReactNode } from 'react'
import { useCallback, useId, useLayoutEffect, useState } from 'react'

import { Button, Icon } from './components.js'
import type { CalendarRange, DateRangeCalendarProps } from './date-range-calendar.js'
import { DateRangeCalendar } from './date-range-calendar.js'
import { usePopover } from './hooks.js'

const viewportBounds = () => {
  const viewport = window.visualViewport
  const left = (viewport?.offsetLeft ?? 0) + 8
  const top = (viewport?.offsetTop ?? 0) + 8

  return { left,
    top,
    right: left + (viewport?.width ?? window.innerWidth) - 16,
    bottom: top + (viewport?.height ?? window.innerHeight) - 16 }
}

const positionPanel = (panel: HTMLElement, control: HTMLElement) => {
  const { left, top, right, bottom } = viewportBounds()
  const anchor = control.getBoundingClientRect()

  panel.style.width = `${Math.min(816, right - left)}px`

  const body = panel.querySelector<HTMLElement>('.ui-range-input__body')
  const footer = panel.querySelector<HTMLElement>('.ui-range-input__actions')
  const preferredHeight = (body?.scrollHeight ?? panel.scrollHeight) + (footer?.offsetHeight ?? 0) + 2
  const below = Math.max(0, bottom - anchor.bottom - 8)
  const above = Math.max(0, anchor.top - top - 8)
  const placeBelow = below >= preferredHeight || below >= above
  const available = placeBelow ? below : above

  panel.style.maxHeight = `${Math.min(bottom - top, Math.max(120, available))}px`

  const bounds = panel.getBoundingClientRect()
  const y = placeBelow ? anchor.bottom + 8 : anchor.top - bounds.height - 8

  panel.style.left = `${Math.max(left, Math.min(anchor.left, right - bounds.width))}px`

  panel.style.top = `${Math.max(top, Math.min(y, bottom - bounds.height))}px`
}

const showPanel = (panel: HTMLElement) => {
  if (typeof panel.showPopover === 'function') panel.showPopover()
}

const hidePanel = (panel: HTMLElement) => {
  if (typeof panel.hidePopover === 'function' && panel.matches(':popover-open')) panel.hidePopover()
}

const isoDate = (date: string): string => date

const RangePopover = ({ open, onOpenChange, label, trigger, children, disabled }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  trigger: ReactNode
  children: ReactNode
  disabled: boolean
}) => {
  const { panelRef, triggerRef, rootRef, rootProps, panelProps, triggerProps } = usePopover({ open, onOpenChange })

  useLayoutEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const control = triggerRef.current

    if (!panel || !control) return

    if ((window.visualViewport?.width ?? window.innerWidth) <= 640) {
      control.scrollIntoView({ block: 'start', behavior: 'instant' })
    }

    showPanel(panel)

    const position = () => {
      positionPanel(panel, control)
    }

    position()

    panel.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })

    const closeOnFocusOutside = (event: FocusEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) onOpenChange(false)
    }

    document.addEventListener('focusin', closeOnFocusOutside)

    const positionOnScroll = (event: Event) => {
      if (event.target instanceof Node && panel.contains(event.target)) return

      position()
    }

    document.addEventListener('scroll', positionOnScroll, true)

    window.addEventListener('resize', position)

    window.visualViewport?.addEventListener('resize', position)

    window.visualViewport?.addEventListener('scroll', position)

    const observer = new ResizeObserver(position)

    observer.observe(control)

    observer.observe(panel)

    return () => {
      observer.disconnect()

      document.removeEventListener('focusin', closeOnFocusOutside)

      document.removeEventListener('scroll', positionOnScroll, true)

      window.removeEventListener('resize', position)

      window.visualViewport?.removeEventListener('resize', position)

      window.visualViewport?.removeEventListener('scroll', position)

      hidePanel(panel)
    }
  }, [open, onOpenChange, panelRef, rootRef, triggerRef])

  return (
    <div {...rootProps} className="ui-range-input">
      <Button {...triggerProps} disabled={disabled} variant="outline" aria-haspopup="dialog" aria-label={label}>
        {trigger}
      </Button>
      <div
        {...panelProps}
        popover="manual"
        role="dialog"
        aria-label={label}
        className="ui-range-input__panel"
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault()

            event.stopPropagation()

            onOpenChange(false)

            triggerRef.current?.focus({ preventScroll: true })
          }
        }}
        onClick={event => {
          if (event.target instanceof Element && event.target.closest('[data-range-close]')) {
            triggerRef.current?.focus({ preventScroll: true })
          }
        }}
      >
        {open && children}
      </div>
    </div>
  )
}

export interface DateRangeInputProps extends Pick<DateRangeCalendarProps, 'value' | 'onValueChange' | 'locale' | 'min' | 'max' | 'presets' | 'formatDate'> {
  /** Accessible trigger and non-modal dialog name. */
  label: string
  labels: DateRangeCalendarProps['labels'] & { apply: string, cancel: string }
  disabled?: boolean
  className?: string
  /** Optional native form entries containing the applied ISO endpoints. */
  name?: { start: string, end: string }
  /** Return a localized message to prevent applying an invalid draft. */
  validate?: (value: CalendarRange) => string | undefined
  /** Optional localized summary below the calendars. */
  renderSummary?: (value: CalendarRange) => ReactNode
}

/** Input-attached range editor. Only Apply publishes the draft to onValueChange. */
export const DateRangeInput = ({
  value, onValueChange, label, labels, disabled = false, className, name,
  validate, renderSummary, formatDate = isoDate, ...calendarProps
}: DateRangeInputProps) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const messageId = useId()
  const error = validate?.(draft)

  const changeOpen = useCallback((next: boolean) => {
    if (next) setDraft({ ...value })

    setOpen(next)
  }, [value])

  return (
    <div className={className}>
      {name && (
        <>
          <input type="hidden" name={name.start} value={value.start} disabled={disabled} />
          <input type="hidden" name={name.end} value={value.end} disabled={disabled} />
        </>
      )}
      <RangePopover
        open={open && !disabled}
        onOpenChange={changeOpen}
        label={label}
        disabled={disabled}
        trigger={(
          <>
            <span className="ui-range-input__value">
              <Icon name="calendar" size="sm" />
              <span>
                {formatDate(value.start)}
                {' '}
                –
                {' '}
                {formatDate(value.end)}
              </span>
            </span>
            <Icon name="chevron-down" size="sm" />
          </>
        )}
      >
        <div className="ui-range-input__body">
          <DateRangeCalendar
            {...calendarProps}
            value={draft}
            onValueChange={setDraft}
            labels={labels}
            formatDate={formatDate}
          />
          <div id={messageId} className="ui-range-input__summary" aria-live="polite" data-invalid={Boolean(error) || undefined}>{error ?? renderSummary?.(draft)}</div>
        </div>
        <div className="ui-range-input__actions">
          <Button
            variant="outline"
            data-range-close
            onClick={() => {
              changeOpen(false)
            }}
          >
            {labels.cancel}
          </Button>
          <Button
            disabled={Boolean(error)}
            aria-describedby={error ? messageId : undefined}
            data-range-close
            onClick={() => {
              onValueChange({ ...draft })

              changeOpen(false)
            }}
          >
            {labels.apply}
          </Button>
        </div>
      </RangePopover>
    </div>
  )
}

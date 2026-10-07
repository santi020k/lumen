'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { isLumenDateRangeValid as isCalendarRangeValid, parseLumenDate as parseCalendarDate, resolveLumenDateLabels as resolveDateControlLabels } from '@santi020k/lumen-core'

import { Button, Icon } from './components.js'
import type { CalendarRange, DateRangeCalendarProps } from './date-range-calendar.js'
import { DateRangeCalendar } from './date-range-calendar.js'
import { usePopover } from './hooks.js'

const viewportBounds = (view: Window) => {
  const viewport = view.visualViewport
  const left = (viewport?.offsetLeft ?? 0) + 8
  const top = (viewport?.offsetTop ?? 0) + 8

  return { left,
    top,
    right: left + (viewport?.width ?? view.innerWidth) - 16,
    bottom: top + (viewport?.height ?? view.innerHeight) - 16 }
}

const positionPanel = (panel: HTMLElement, control: HTMLElement, view: Window) => {
  const { left, top, right, bottom } = viewportBounds(view)
  const anchor = control.getBoundingClientRect()

  panel.style.width = `${Math.max(0, Math.min(816, right - left))}px`

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

const resolveRangeInputForm = (root: HTMLElement | null, formId: string | undefined): HTMLFormElement | null => {
  if (!root) return null

  if (formId !== undefined) {
    const owner = root.ownerDocument.getElementById(formId)
    const FormType = root.ownerDocument.defaultView?.HTMLFormElement

    return FormType && owner instanceof FormType ? owner : null
  }

  return root.closest('form')
}

const observePanelPosition = (panel: HTMLElement, control: HTMLElement, view: Window, position: () => void) => {
  const owner = panel.ownerDocument
  const NodeType = owner.defaultView?.Node
  const viewport = view.visualViewport

  const onScroll = (event: Event) => {
    if (NodeType && event.target instanceof NodeType && panel.contains(event.target)) return

    position()
  }

  const observer = new ResizeObserver(position)

  observer.observe(control)

  observer.observe(panel)

  owner.addEventListener('scroll', onScroll, true)

  view.addEventListener('resize', position)

  viewport?.addEventListener('resize', position)

  viewport?.addEventListener('scroll', position)

  return () => {
    observer.disconnect()

    owner.removeEventListener('scroll', onScroll, true)

    view.removeEventListener('resize', position)

    viewport?.removeEventListener('resize', position)

    viewport?.removeEventListener('scroll', position)
  }
}

const scrollSmallViewport = (control: HTMLElement, view: Window): void => {
  if ((view.visualViewport?.width ?? view.innerWidth) <= 640) {
    control.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
}

const RangePopover = ({ open, onOpenChange, label, trigger, children, disabled, readOnly }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  trigger: ReactNode
  children: ReactNode
  disabled: boolean
  readOnly: boolean
}) => {
  const { panelRef, triggerRef, rootRef, rootProps, panelProps, triggerProps } = usePopover({ open, onOpenChange, positioning: 'none' })

  useLayoutEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const control = triggerRef.current
    const view = panel?.ownerDocument.defaultView

    if (!panel || !control || !view) return

    scrollSmallViewport(control, view)

    showPanel(panel)

    const position = () => {
      positionPanel(panel, control, view)
    }

    position()

    const initialFocus = panel.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]') ??
      panel.querySelector<HTMLElement>('button:not(:disabled)')

    initialFocus?.focus({ preventScroll: true })

    const owner = panel.ownerDocument
    const NodeType = owner.defaultView?.Node

    const closeOnFocusOutside = (event: FocusEvent) => {
      if (NodeType && event.target instanceof NodeType && !rootRef.current?.contains(event.target)) onOpenChange(false)
    }

    owner.addEventListener('focusin', closeOnFocusOutside)

    const stopObserving = observePanelPosition(panel, control, view, position)

    return () => {
      stopObserving()

      owner.removeEventListener('focusin', closeOnFocusOutside)

      hidePanel(panel)
    }
  }, [open, onOpenChange, panelRef, rootRef, triggerRef])

  return (
    <div {...rootProps} className="ui-range-input">
      <Button {...triggerProps} disabled={disabled} aria-disabled={readOnly || undefined} variant="outline" aria-haspopup="dialog" aria-label={label}>
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
          const ElementType = event.currentTarget.ownerDocument.defaultView?.Element

          if (ElementType && event.target instanceof ElementType && event.target.closest('[data-range-close]')) {
            triggerRef.current?.focus({ preventScroll: true })
          }
        }}
      >
        {open && children}
      </div>
    </div>
  )
}

export interface DateRangeInputProps extends Pick<DateRangeCalendarProps, 'value' | 'onValueChange' | 'locale' | 'min' | 'max' | 'presets' | 'formatDate' | 'disabled' | 'readOnly'> {
  /** Accessible trigger and non-modal dialog name. */
  label: string
  labels: DateRangeCalendarProps['labels'] & { apply: string, cancel: string, invalidRange?: string }
  className?: string
  form?: string
  /** Optional native form entries containing the applied ISO endpoints. */
  name?: { start: string, end: string }
  /** Return a localized message to prevent applying an invalid draft. */
  validate?: (value: CalendarRange) => string | undefined
  /** Optional localized summary below the calendars. */
  renderSummary?: (value: CalendarRange) => ReactNode
}

const useRangeDraft = (value: CalendarRange, disabled: boolean, readOnly: boolean) => {
  const { start, end } = value
  const revision = JSON.stringify([start, end, disabled, readOnly])
  const [state, setState] = useState({ revision, open: false, draft: value })

  // External values and availability invalidate an editing session before it can commit.
  if (state.revision !== revision) {
    setState({ revision, open: false, draft: value })
  }

  const changeOpen = useCallback((next: boolean) => {
    if (next && (disabled || readOnly)) return

    setState(current => ({ revision, open: next, draft: next ? { start, end } : current.draft }))
  }, [disabled, readOnly, start, end, revision])

  const setDraft = (draft: CalendarRange) => {
    setState(current => ({ ...current, draft }))
  }

  return {
    open: state.revision === revision && state.open && !disabled && !readOnly,
    draft: state.draft,
    changeOpen,
    setDraft
  }
}

const rangeError = (
  draft: CalendarRange,
  props: Pick<DateRangeInputProps, 'min' | 'max' | 'locale' | 'labels'> & { validate: DateRangeInputProps['validate'] }
) => {
  if (!isCalendarRangeValid(draft, props.min, props.max)) {
    return props.labels.invalidRange ?? resolveDateControlLabels(props.locale || 'en').invalidRange
  }

  return props.validate?.(draft)
}

const displayRangeDate = (date: string, formatDate: (date: string) => string) => (
  parseCalendarDate(date) ? formatDate(date) : date
)

/** Input-attached range editor. Only Apply publishes the draft to onValueChange. */
export const DateRangeInput = ({
  value, onValueChange, label, labels, disabled = false, readOnly = false, className, name, form,
  validate, renderSummary, formatDate = isoDate, ...calendarProps
}: DateRangeInputProps) => {
  const { open, draft, changeOpen, setDraft } = useRangeDraft(value, disabled, readOnly)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const messageId = useId()
  const validDraft = isCalendarRangeValid(draft, calendarProps.min, calendarProps.max)
  const error = rangeError(draft, { ...calendarProps, labels, validate })

  useEffect(() => {
    const owner = wrapperRef.current?.ownerDocument
    let active = true
    let resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined

    const reset = (event: Event) => {
      if (event.target !== resolveRangeInputForm(wrapperRef.current, form)) return

      globalThis.clearTimeout(resetTimer)

      resetTimer = globalThis.setTimeout(() => {
        if (!active || event.defaultPrevented || !wrapperRef.current?.isConnected) return

        changeOpen(false)
      })
    }

    owner?.addEventListener('reset', reset)

    return () => {
      active = false

      globalThis.clearTimeout(resetTimer)

      owner?.removeEventListener('reset', reset)
    }
  }, [form, changeOpen])

  return (
    <div className={className} ref={wrapperRef}>
      {name && (
        <>
          <input type="hidden" name={name.start} form={form} value={value.start} disabled={disabled} />
          <input type="hidden" name={name.end} form={form} value={value.end} disabled={disabled} />
        </>
      )}
      <RangePopover
        open={open}
        onOpenChange={changeOpen}
        label={label}
        disabled={disabled}
        readOnly={readOnly}
        trigger={(
          <>
            <span className="ui-range-input__value">
              <Icon name="calendar" size="sm" />
              <span>
                {displayRangeDate(value.start, formatDate)}
                {' '}
                –
                {' '}
                {displayRangeDate(value.end, formatDate)}
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
            disabled={disabled}
            readOnly={readOnly}
          />
          <div id={messageId} className="ui-range-input__summary" aria-live="polite" data-invalid={Boolean(error) || undefined}>{error ?? (validDraft ? renderSummary?.(draft) : undefined)}</div>
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
              if (disabled || readOnly || !validDraft || error) return

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

'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { useEffect, useRef, useState } from 'react'

import { isLumenDateRangeValid as isCalendarRangeValid, parseLumenDate as parseCalendarDate } from '@santi020k/lumen-core'

import { Button, Icon } from './components.js'
import { useCalendar } from './hooks.js'

export interface CalendarRange {
  start: string
  end: string
}

export interface DateRangeCalendarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  value: CalendarRange
  onValueChange: (value: CalendarRange) => void
  locale?: string
  min?: string
  max?: string
  disabled?: boolean
  readOnly?: boolean
  labels: { start: string, end: string, presets: string, previousMonth?: string, nextMonth?: string }
  presets?: readonly { label: string, value: CalendarRange }[]
  formatDate?: (value: string) => string
}

const RangeMonth = ({ part, value, onValueChange, locale, min, max, label, labels, disabled, readOnly, formatDate }: {
  part: 'start' | 'end'
  value: CalendarRange
  onValueChange: (value: CalendarRange) => void
  locale: string | undefined
  min: string | undefined
  max: string | undefined
  label: string
  labels: DateRangeCalendarProps['labels']
  disabled: boolean
  readOnly: boolean
  formatDate: (value: string) => string
}) => {
  const { rootRef, ...calendar } = useCalendar({
    value: value[part],
    locale,
    min,
    max,
    labels,
    disabled,
    readOnly,
    onValueChange: next => {
      const range = part === 'start' ?
        { start: next, end: next > value.end ? next : value.end } :
        { start: next < value.start ? next : value.start, end: next }

      onValueChange(isCalendarRangeValid(range, min, max) ? range : { start: next, end: next })
    }
  })

  const selectedRef = useRef(value[part])
  const focusedDate = calendar.weeks.flat().find(day => day.tabIndex === 0)?.date

  useEffect(() => {
    if (selectedRef.current !== value[part]) {
      selectedRef.current = value[part]

      calendar.focusDate(value[part])
    }
  })

  useEffect(() => {
    if (rootRef.current?.contains(document.activeElement) && document.activeElement?.getAttribute('role') === 'gridcell') {
      rootRef.current.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus()
    }
  }, [focusedDate, rootRef])

  return (
    <section className="ui-range-calendar__month" aria-label={label}>
      <div className="ui-range-calendar__endpoint">
        <span>{label}</span>
        <strong>{parseCalendarDate(value[part]) ? formatDate(value[part]) : value[part]}</strong>
      </div>
      <div {...calendar.rootProps}>
        <div className="ui-calendar__header">
          <button {...calendar.previousProps} type="button"><Icon name="chevron-left" size="sm" /></button>
          <strong {...calendar.labelProps}>{calendar.label}</strong>
          <button {...calendar.nextProps} type="button"><Icon name="chevron-right" size="sm" /></button>
        </div>
        <table {...calendar.gridProps} aria-multiselectable="true">
          <thead><tr role="row">{calendar.weekdays.map(day => <th key={day} role="columnheader" scope="col">{day}</th>)}</tr></thead>
          <tbody>
            {calendar.weeks.map(week => (
              <tr key={week[0]?.date} role="row">
                {week.map(day => {
                  const inRange = isCalendarRangeValid(value, min, max) &&
                    day.date >= value.start && day.date <= value.end

                  const endpoint = inRange && (day.date === value.start || day.date === value.end)

                  return (
                    <td
                      key={day.date}
                      {...calendar.getDayProps(day)}
                      aria-selected={inRange}
                      data-selected={endpoint || undefined}
                      data-in-range={inRange || undefined}
                    >
                      {day.day}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const emptyPresets: NonNullable<DateRangeCalendarProps['presets']> = []
const isoDate = (value: string): string => value

/** Inline range editor. Consumers own draft state and Apply/Cancel actions. */
export const DateRangeCalendar = ({
  value, onValueChange, locale, min, max, labels, presets = emptyPresets,
  disabled = false, readOnly = false, formatDate = isoDate, className, ...props
}: DateRangeCalendarProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>()

  const matchesRange = (preset: { value: CalendarRange }): boolean => (
    preset.value.start === value.start && preset.value.end === value.end
  )

  const activePreset = presets.find(preset => preset.label === selectedPreset && matchesRange(preset)) ??
    presets.find(matchesRange)

  return (
    <div {...props} aria-disabled={disabled || undefined} className={['ui-range-calendar', className].filter(Boolean).join(' ')}>
      {presets.length > 0 && (
        <nav className="ui-range-calendar__presets" aria-label={labels.presets}>
          {presets.map(preset => (
            <Button
              key={preset.label}
              type="button"
              variant="ghost"
              disabled={disabled || readOnly || !isCalendarRangeValid(preset.value, min, max)}
              aria-pressed={preset === activePreset}
              onClick={() => {
                if (disabled || readOnly || !isCalendarRangeValid(preset.value, min, max)) return

                setSelectedPreset(preset.label)

                onValueChange({ ...preset.value })
              }}
            >
              {preset.label}
            </Button>
          ))}
        </nav>
      )}
      <div className="ui-range-calendar__months">
        {(['start', 'end'] as const).map(part => (
          <RangeMonth
            key={part}
            part={part}
            value={value}
            onValueChange={onValueChange}
            locale={locale}
            min={min}
            max={max}
            label={labels[part]}
            labels={labels}
            disabled={disabled}
            readOnly={readOnly}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  )
}

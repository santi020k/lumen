import { type ReactElement, useState } from 'react'
import { Pressable, ScrollView, View, type ViewProps } from 'react-native'

import { addLumenCalendarMonths, isLumenCalendarSelectable, type LumenCalendarDay, lumenCalendarDayKey, type LumenCalendarEvent, lumenCalendarEventsForDay, lumenCalendarGrid } from './calendar-recipes.js'
import { LumenText } from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenCalendarProps extends Pick<ViewProps, 'style' | 'testID' | 'onLayout'> {
  label: string
  visibleMonth: LumenCalendarDay
  onVisibleMonthChange: (month: LumenCalendarDay) => void
  selectedDay?: LumenCalendarDay | null
  onSelectedDayChange: (day: LumenCalendarDay) => void
  events?: readonly LumenCalendarEvent[]
  min?: LumenCalendarDay
  max?: LumenCalendarDay
  today?: LumenCalendarDay
  firstWeekday?: number
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  error?: string | null
  empty?: boolean
  loadingLabel?: string
  emptyLabel?: string
  invalidLabel?: string
  previousMonthLabel?: string
  nextMonthLabel?: string
  todayLabel?: string
  formatDay?: (day: LumenCalendarDay) => string
  formatMonth?: (month: LumenCalendarDay) => string
  weekdayLabels?: readonly string[]
}

const defaultEvents: readonly LumenCalendarEvent[] = []
const defaultWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarLocked = (
  disabled = false, readOnly = false, status: string | null
): boolean => disabled || readOnly || status !== null

const todayName = (day: LumenCalendarDay, today?: LumenCalendarDay, label = 'Today'): string => today && lumenCalendarDayKey(day) === lumenCalendarDayKey(today) ? label : ''
const defaultMonth = (day: LumenCalendarDay): string => lumenCalendarDayKey(day).slice(0, 7)

const statusMessage = (props: LumenCalendarProps, invalid: boolean): string | null => {
  if (props.error != null) return props.error

  if (props.loading) return props.loadingLabel ?? 'Loading'

  if (props.empty) return props.emptyLabel ?? 'No dates'

  if (invalid) return props.invalidLabel ?? 'Invalid calendar'

  return null
}

export const LumenCalendar = (input: LumenCalendarProps): ReactElement => {
  const resolved = {
    events: defaultEvents,
    firstWeekday: 1,
    formatDay: lumenCalendarDayKey,
    formatMonth: defaultMonth,
    weekdayLabels: defaultWeekdays,
    ...input
  }

  const {
    label, visibleMonth, onVisibleMonthChange, selectedDay, onSelectedDayChange,
    events, min, max, today, firstWeekday, disabled, readOnly,
    formatDay, formatMonth, weekdayLabels, style
  } = resolved

  const [gridWidth, setGridWidth] = useState(308)
  const theme = useLumenTheme()
  const cells = lumenCalendarGrid(visibleMonth, firstWeekday)
  const boundsValid = isLumenCalendarSelectable(min ?? max ?? visibleMonth, min, max)
  const status = statusMessage(input, cells.length === 0 || !boundsValid || weekdayLabels.length !== 7)
  const locked = calendarLocked(disabled, readOnly, status)

  const navigate = (amount: number): LumenCalendarDay | null => {
    const next = addLumenCalendarMonths({ ...visibleMonth, day: 1 }, amount)

    if (!next) return null

    const last = addLumenCalendarMonths(next, 1)

    if (max && lumenCalendarDayKey(next) > lumenCalendarDayKey(max)) return null

    if (min && last && lumenCalendarDayKey(last) <= lumenCalendarDayKey(min)) return null

    return next
  }

  return (
    <View
      style={style}
      accessibilityLabel={label}
      testID={input.testID}
      onLayout={event => {
        const width = event.nativeEvent.layout.width

        if (Number.isFinite(width) && width > 0) setGridWidth(Math.max(308, width))

        input.onLayout?.(event)
      }}
    >
      <LumenText>{label}</LumenText>
      {status !== null ?
        <LumenText accessibilityRole="text" accessibilityLiveRegion="polite">{status}</LumenText> :
        (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {[-1, 1].map(amount => (
                <Pressable
                  key={amount}
                  accessibilityRole="button"
                  accessibilityLabel={amount < 0 ? (input.previousMonthLabel ?? 'Previous month') : (input.nextMonthLabel ?? 'Next month')}
                  disabled={locked || !navigate(amount)}
                  accessibilityState={{ disabled: locked || !navigate(amount) }}
                  onPress={() => {
                    const next = navigate(amount)

                    if (!locked && next) onVisibleMonthChange(next)
                  }}
                  style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
                >
                  <LumenText>{amount < 0 ? '‹' : '›'}</LumenText>
                </Pressable>
              ))}
              <LumenText style={{ position: 'absolute', left: 44, right: 44, textAlign: 'center' }}>{formatMonth(visibleMonth)}</LumenText>
            </View>
            <ScrollView horizontal>
              <View style={{ width: gridWidth }}>
                <View style={{ flexDirection: 'row' }}>{Array.from({ length: 7 }, (_, index) => (firstWeekday + index) % 7).map(weekday => <View key={weekday} style={{ width: '14.285714%' }}><LumenText style={{ textAlign: 'center' }}>{weekdayLabels[weekday]}</LumenText></View>)}</View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {cells.map((day, index) => {
                    if (!day) return <View key={`blank-${String(index)}`} style={{ width: '14.285714%', minHeight: 44 }} />

                    const key = lumenCalendarDayKey(day)
                    const selected = selectedDay ? lumenCalendarDayKey(selectedDay) === key : false
                    const indicators = lumenCalendarEventsForDay(events, day)
                    const unavailable = locked || !isLumenCalendarSelectable(day, min, max)

                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityLabel={[formatDay(day), todayName(day, today, input.todayLabel), ...indicators.map(event => event.label)].filter(Boolean).join(', ')}
                        accessibilityState={{ selected, disabled: unavailable }}
                        disabled={unavailable}
                        onPress={() => {
                          if (!unavailable) onSelectedDayChange(day)
                        }}
                        style={{ width: '14.285714%', minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? theme.colors.brandSoft : undefined, opacity: unavailable || day.month !== visibleMonth.month ? 0.52 : 1 }}
                      >
                        <LumenText>{day.day}</LumenText>
                        {indicators.length > 0 && <LumenText accessibilityElementsHidden>•</LumenText>}
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            </ScrollView>
          </>
        )}
    </View>
  )
}

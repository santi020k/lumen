import { type ReactElement, useState } from 'react'
import { Pressable, ScrollView, View, type ViewProps } from 'react-native'

import { formatLumenAgendaMinute, type LumenAgendaEvent, type LumenAgendaSegment } from './agenda-recipes.js'
import { addLumenCalendarDays, type LumenCalendarDay, lumenCalendarDayKey } from './calendar-recipes.js'
import { LumenText } from './primitives.js'
import { type LumenScheduleDay, lumenScheduleLayout } from './schedule-recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenScheduleProps extends Pick<ViewProps, 'style' | 'testID'> {
  label: string
  selectedDay: LumenCalendarDay
  onSelectedDayChange: (day: LumenCalendarDay) => void
  events: readonly LumenAgendaEvent[]
  dayCount?: number
  startHour?: number
  endHour?: number
  onEventPress?: (event: LumenAgendaEvent, day: LumenCalendarDay) => void
  onEventMove?: (event: LumenAgendaEvent, targetDay: LumenCalendarDay) => void
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  error?: string | null
  loadingLabel?: string
  emptyLabel?: string
  invalidLabel?: string
  previousLabel?: string
  nextLabel?: string
  previousDayLabel?: string
  nextDayLabel?: string
  allDayLabel?: string
  formatDay?: (day: LumenCalendarDay) => string
  formatTime?: (minute: number) => string
}

const scheduleStatus = (input: LumenScheduleProps, invalid: boolean): string | null => {
  if (input.error != null) return input.error

  if (input.loading) return input.loadingLabel ?? 'Loading'

  if (invalid) return input.invalidLabel ?? 'Invalid schedule'

  return null
}

interface EventButtonProps {
  segment: LumenAgendaSegment
  day: LumenCalendarDay
  name: string
  disabled: boolean
  onPress: (event: LumenAgendaEvent, day: LumenCalendarDay) => void
}

const ScheduleEvent = ({ segment, day, name, disabled, onPress }: EventButtonProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={() => {
        if (!disabled) onPress(segment.event, day)
      }}
      style={{
        minWidth: 44,
        minHeight: 44,
        flex: 1,
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.brandSoft,
        overflow: 'hidden'
      }}
    >
      <LumenText numberOfLines={2}>{segment.event.event.label}</LumenText>
    </Pressable>
  )
}

const columnWidth = (day: LumenScheduleDay): number => {
  const widths = day.placements.map(item => item.laneCount * 100)

  return widths.reduce((width, value) => Math.max(width, value), 200)
}

const rangeDestination = (day: LumenCalendarDay, amount: number, count: number): LumenCalendarDay | null => {
  const next = addLumenCalendarDays(day, amount)

  return next && addLumenCalendarDays(next, count - 1) ? next : null
}

interface FocusedEvent { id: string, day: LumenCalendarDay }

const focusedEvent = (
  days: readonly LumenScheduleDay[], focused: FocusedEvent | null
): LumenAgendaEvent | undefined => {
  if (!focused) return undefined

  const day = days.find(group => lumenCalendarDayKey(group.day) === lumenCalendarDayKey(focused.day))

  if (!day) return undefined

  return [...day.allDay, ...day.placements.map(item => item.segment)]
    .find(segment => segment.event.event.id === focused.id)?.event
}

export const LumenSchedule = (input: LumenScheduleProps): ReactElement => {
  const props = {
    dayCount: 7,
    startHour: 8,
    endHour: 18,
    formatDay: lumenCalendarDayKey,
    formatTime: formatLumenAgendaMinute,
    emptyLabel: 'No events in this time range',
    allDayLabel: 'All day',
    previousLabel: 'Previous range',
    nextLabel: 'Next range',
    previousDayLabel: 'Move to previous day',
    nextDayLabel: 'Move to next day',
    ...input
  }

  const theme = useLumenTheme()
  const [focused, setFocused] = useState<FocusedEvent | null>(null)
  const days = lumenScheduleLayout(props.events, props.selectedDay, props.dayCount, props.startHour, props.endHour)
  const status = scheduleStatus(props, days.length === 0)
  const locked = props.disabled === true || props.readOnly === true || status !== null
  const move = props.onEventMove
  const noActions = !props.onEventPress && !move
  const active = focusedEvent(days, focused)

  const focus = (event: LumenAgendaEvent, day: LumenCalendarDay): void => {
    if (locked || event.event.disabled) return

    setFocused({ id: event.event.id, day })

    props.onEventPress?.(event, day)
  }

  const name = (segment: LumenAgendaSegment, day: LumenCalendarDay): string => {
    let time = props.allDayLabel

    if (segment.startMinute !== null) {
      time = `${props.formatTime(segment.startMinute)} – ${props.formatTime(segment.endMinute ?? 1440)}`
    }

    return [props.formatDay(day), time, segment.event.event.label, segment.event.event.detail].filter(Boolean).join(', ')
  }

  const allDayHeight = days.reduce((count, day) => Math.max(count, day.allDay.length), 1) * 48

  const hours = status === null ?
    Array.from({ length: props.endHour - props.startHour + 1 }, (_, index) => props.startHour + index) :
    []

  const navigation = [
    { id: 'previous', label: props.previousLabel, day: rangeDestination(props.selectedDay, -props.dayCount, props.dayCount) },
    { id: 'next', label: props.nextLabel, day: rangeDestination(props.selectedDay, props.dayCount, props.dayCount) }
  ]

  return (
    <View style={props.style} testID={props.testID} accessibilityLabel={props.label}>
      <LumenText accessibilityRole="header">{props.label}</LumenText>
      {status !== null ?
        <LumenText accessibilityLiveRegion="polite">{status}</LumenText> :
        (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {navigation.map(action => (
                <Pressable
                  key={action.id}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  disabled={locked || !action.day}
                  accessibilityState={{ disabled: locked || !action.day }}
                  style={{ minWidth: 44, minHeight: 44, flexShrink: 1, justifyContent: 'center' }}
                  onPress={() => {
                    if (!locked && action.day) props.onSelectedDayChange(action.day)
                  }}
                >
                  <LumenText>{action.label}</LumenText>
                </Pressable>
              ))}
            </View>
            {days.every(day => day.placements.length === 0 && day.allDay.length === 0) && (
              <LumenText>{props.emptyLabel}</LumenText>
            )}
            <ScrollView horizontal>
              <ScrollView style={{ maxHeight: 480 }} nestedScrollEnabled>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 64 }}>
                    <View style={{ height: 44 + allDayHeight }}><LumenText>{props.allDayLabel}</LumenText></View>
                    <View style={{ height: (props.endHour - props.startHour) * 60 }}>
                      {hours.map(hour => <View key={hour} style={{ position: 'absolute', top: Math.min((hour - props.startHour) * 60, (props.endHour - props.startHour) * 60 - 20) }}><LumenText>{props.formatTime(hour * 60)}</LumenText></View>)}
                    </View>
                  </View>
                  {days.map(day => {
                    const width = columnWidth(day)

                    return (
                      <View
                        key={lumenCalendarDayKey(day.day)}
                        style={{ width, borderLeftWidth: 1, borderColor: theme.colors.line }}
                      >
                        <View style={{ height: 44, justifyContent: 'center', padding: theme.spacing.xs }}><LumenText accessibilityRole="header">{props.formatDay(day.day)}</LumenText></View>
                        <View style={{ height: allDayHeight }}>
                          {day.allDay.map(segment => (
                            <View key={segment.event.event.id} style={{ height: 48 }}>
                              <ScheduleEvent
                                segment={segment}
                                day={day.day}
                                name={name(segment, day.day)}
                                disabled={locked || segment.event.event.disabled === true || noActions}
                                onPress={focus}
                              />
                            </View>
                          ))}
                        </View>
                        <View style={{ height: (props.endHour - props.startHour) * 60 }}>
                          {hours.slice(0, -1).map(hour => <View key={hour} style={{ position: 'absolute', top: (hour - props.startHour) * 60, left: 0, right: 0, borderTopWidth: 1, borderColor: theme.colors.line }} />)}
                          {day.placements.map(item => <View key={item.segment.event.event.id} style={{ position: 'absolute', top: item.top, height: item.height, left: item.lane * width / item.laneCount, width: width / item.laneCount, paddingHorizontal: 2 }}><ScheduleEvent segment={item.segment} day={day.day} name={name(item.segment, day.day)} disabled={locked || item.segment.event.event.disabled === true || noActions} onPress={focus} /></View>)}
                        </View>
                      </View>
                    )
                  })}
                </View>
              </ScrollView>
            </ScrollView>
            {move && active && focused && (
              <View>
                <LumenText>{active.event.label}</LumenText>
                {[-1, 1].map(direction => {
                  const target = addLumenCalendarDays(focused.day, direction)
                  const unavailable = locked || active.event.disabled === true || !target

                  return (
                    <Pressable
                      key={direction}
                      accessibilityRole="button"
                      accessibilityLabel={direction < 0 ? props.previousDayLabel : props.nextDayLabel}
                      disabled={unavailable}
                      accessibilityState={{ disabled: unavailable }}
                      style={{ minHeight: 44, minWidth: 44 }}
                      onPress={() => {
                        if (!unavailable) move(active, target)
                      }}
                    >
                      <LumenText>{direction < 0 ? props.previousDayLabel : props.nextDayLabel}</LumenText>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </>
        )}
    </View>
  )
}

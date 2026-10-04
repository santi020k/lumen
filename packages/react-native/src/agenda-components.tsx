import type { ReactElement } from 'react'
import { Pressable, View, type ViewProps } from 'react-native'

import { formatLumenAgendaMinute, type LumenAgendaEvent, lumenAgendaGroups } from './agenda-recipes.js'
import { addLumenCalendarDays, type LumenCalendarDay, lumenCalendarDayKey } from './calendar-recipes.js'
import { LumenText } from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenAgendaProps extends Pick<ViewProps, 'style' | 'testID' | 'onLayout'> {
  label: string
  selectedDay: LumenCalendarDay
  onSelectedDayChange: (day: LumenCalendarDay) => void
  events: readonly LumenAgendaEvent[]
  dayCount?: number
  onEventPress?: (event: LumenAgendaEvent, day: LumenCalendarDay) => void
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  error?: string | null
  loadingLabel?: string
  emptyLabel?: string
  invalidLabel?: string
  previousLabel?: string
  nextLabel?: string
  allDayLabel?: string
  formatDay?: (day: LumenCalendarDay) => string
  formatTime?: (minute: number) => string
}

const agendaStatus = (props: LumenAgendaProps, invalid: boolean): string | null => {
  if (props.error != null) return props.error

  if (props.loading) return props.loadingLabel ?? 'Loading'

  if (invalid) return props.invalidLabel ?? 'Invalid agenda'

  return null
}

const navigationDestination = (day: LumenCalendarDay, amount: number, count: number): LumenCalendarDay | null => {
  const next = addLumenCalendarDays(day, amount)

  return next && addLumenCalendarDays(next, count - 1) ? next : null
}

interface AgendaRowProps {
  input: LumenAgendaEvent
  day: LumenCalendarDay
  time: string
  dayLabel: string
  locked: boolean
  onEventPress: LumenAgendaProps['onEventPress']
}

const AgendaRow = ({ input, day, time, dayLabel, locked, onEventPress }: AgendaRowProps): ReactElement => {
  const theme = useLumenTheme()
  const unavailable = locked || input.event.disabled === true
  const name = [dayLabel, time, input.event.label, input.event.detail].filter(Boolean).join(', ')

  const content = (
    <>
      <LumenText>{input.event.label}</LumenText>
      <LumenText>{time}</LumenText>
      {input.event.detail && <LumenText>{input.event.detail}</LumenText>}
    </>
  )

  const style = { minHeight: 44, paddingVertical: theme.spacing.sm }

  if (!onEventPress) return <View accessible accessibilityLabel={name} style={style}>{content}</View>

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled: unavailable }}
      disabled={unavailable}
      style={style}
      onPress={() => {
        if (!unavailable) onEventPress(input, day)
      }}
    >
      {content}
    </Pressable>
  )
}

export const LumenAgenda = (input: LumenAgendaProps): ReactElement => {
  const props = {
    dayCount: 7,
    formatDay: lumenCalendarDayKey,
    formatTime: formatLumenAgendaMinute,
    allDayLabel: 'All day',
    emptyLabel: 'No events',
    previousLabel: 'Previous days',
    nextLabel: 'Next days',
    ...input
  }

  const { label, selectedDay, onSelectedDayChange, events, dayCount, formatDay, formatTime } = props
  const theme = useLumenTheme()
  const groups = lumenAgendaGroups(events, selectedDay, dayCount)
  const status = agendaStatus(props, groups.length === 0)
  const locked = props.disabled === true || props.readOnly === true || status !== null

  const actions = [
    { day: navigationDestination(selectedDay, -dayCount, dayCount), label: props.previousLabel, id: 'previous' },
    { day: navigationDestination(selectedDay, dayCount, dayCount), label: props.nextLabel, id: 'next' }
  ]

  return (
    <View style={props.style} testID={props.testID} onLayout={props.onLayout} accessibilityLabel={label}>
      <LumenText accessibilityRole="header">{label}</LumenText>
      {status !== null ?
        <LumenText accessibilityLiveRegion="polite">{status}</LumenText> :
        (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {actions.map(action => (
                <Pressable
                  key={action.id}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  accessibilityState={{ disabled: locked || !action.day }}
                  disabled={locked || !action.day}
                  onPress={() => {
                    if (!locked && action.day) onSelectedDayChange(action.day)
                  }}
                  style={{ minWidth: 44, minHeight: 44, padding: theme.spacing.sm, justifyContent: 'center', flexShrink: 1 }}
                >
                  <LumenText>{action.label}</LumenText>
                </Pressable>
              ))}
            </View>
            {groups.map(group => (
              <View
                key={lumenCalendarDayKey(group.day)}
                style={{ padding: theme.spacing.sm, borderBottomWidth: 1, borderColor: theme.colors.line }}
              >
                <LumenText accessibilityRole="header">{formatDay(group.day)}</LumenText>
                {group.segments.length === 0 && <LumenText>{props.emptyLabel}</LumenText>}
                {group.segments.map(segment => (
                  <AgendaRow
                    key={segment.event.event.id}
                    input={segment.event}
                    day={group.day}
                    dayLabel={formatDay(group.day)}
                    locked={locked}
                    onEventPress={props.onEventPress}
                    time={segment.startMinute === null ?
                      props.allDayLabel :
                      `${formatTime(segment.startMinute)} – ${formatTime(segment.endMinute ?? 1440)}`}
                  />
                ))}
              </View>
            ))}
          </>
        )}
    </View>
  )
}

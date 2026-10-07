import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { addLumenCalendarDays, type LumenAgendaEvent, type LumenCalendarDay, lumenCalendarOrdinal, LumenCheckbox, LumenSchedule, LumenText } from '@santi020k/lumen-react-native'

const startDay = { year: 2026, month: 3, day: 8 }

const initialEvents: LumenAgendaEvent[] = [
  { event: { id: 'planning', label: 'Planning', startDay }, startMinute: 600, endMinute: 660 },
  { event: { id: 'review', label: 'Review', startDay }, startMinute: 630, endMinute: 720 },
  { event: { id: 'ship', label: 'Ship', startDay }, startMinute: 840, endMinute: 845 },
  { event: { id: 'launch', label: 'Launch week', startDay, endDay: { ...startDay, day: 10 } } },
  { event: { id: 'handoff', label: 'Overnight handoff', startDay, endDay: { ...startDay, day: 9 } }, startMinute: 1020, endMinute: 570 }
]

export const ScheduleParityExample = (): ReactElement => {
  const [day, setDay] = useState<LumenCalendarDay>(startDay)
  const [events, setEvents] = useState(initialEvents)
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [dayView, setDayView] = useState(false)
  const [message, setMessage] = useState('Select an event to move it')

  const move = (input: LumenAgendaEvent, targetDay: LumenCalendarDay): void => {
    const first = lumenCalendarOrdinal(input.event.startDay)
    const duration = lumenCalendarOrdinal(input.event.endDay ?? input.event.startDay) - first
    const endDay = addLumenCalendarDays(targetDay, duration)

    if (!endDay) return

    setEvents(current => current.map(item => item.event.id === input.event.id ?
      { ...item, event: { ...item.event, startDay: targetDay, endDay } } :
      item))

    setMessage(`Moved ${input.event.label} to ${targetDay.day}`)
  }

  return (
    <View>
      <LumenCheckbox label="Day view" checked={dayView} onCheckedChange={setDayView} />
      <LumenCheckbox label="Read only" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenCheckbox label="Empty" checked={empty} onCheckedChange={setEmpty} />
      <LumenSchedule
        label="Launch schedule"
        selectedDay={day}
        onSelectedDayChange={setDay}
        events={empty ? [] : events}
        dayCount={dayView ? 1 : 7}
        readOnly={readOnly}
        loading={loading}
        error={error ? 'Schedule unavailable' : null}
        onEventPress={event => {
          setMessage(`Selected ${event.event.label}`)
        }}
        onEventMove={move}
      />
      <LumenText>{message}</LumenText>
    </View>
  )
}

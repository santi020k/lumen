import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenCalendar, type LumenCalendarDay, LumenCheckbox, LumenText } from '@santi020k/lumen-react-native'

export const CalendarParityExample = (): ReactElement => {
  const [month, setMonth] = useState<LumenCalendarDay>({ year: 2026, month: 3, day: 1 })
  const [day, setDay] = useState<LumenCalendarDay | null>({ year: 2026, month: 3, day: 8 })
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  return (
    <View>
      <LumenCheckbox label="Read only" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenCalendar label="Project calendar" visibleMonth={month} onVisibleMonthChange={setMonth} selectedDay={day} onSelectedDayChange={setDay} readOnly={readOnly} loading={loading} error={error ? 'Calendar unavailable' : null} min={{ year: 2026, month: 3, day: 5 }} max={{ year: 2026, month: 4, day: 20 }} events={[{ id: 'review', label: 'Design review', startDay: { year: 2026, month: 3, day: 10 } }]} />
      <LumenText>{day ? `Selected: ${day.year}-${day.month}-${day.day}` : 'No selected day'}</LumenText>
    </View>
  )
}

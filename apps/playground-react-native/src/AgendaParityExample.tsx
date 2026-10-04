import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenAgenda, type LumenCalendarDay, LumenCheckbox, LumenText } from '@santi020k/lumen-react-native'

export const AgendaParityExample = (): ReactElement => {
  const [day, setDay] = useState<LumenCalendarDay>({ year: 2026, month: 3, day: 8 })
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [message, setMessage] = useState('Choose an event')
  const startDay = { year: 2026, month: 3, day: 8 }

  return (
    <View>
      <LumenCheckbox label="Read only" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenCheckbox label="Empty" checked={empty} onCheckedChange={setEmpty} />
      <LumenAgenda
        label="Project agenda"
        selectedDay={day}
        onSelectedDayChange={setDay}
        dayCount={3}
        readOnly={readOnly}
        loading={loading}
        error={error ? 'Agenda unavailable' : null}
        events={empty ?
          [] :
          [
            { event: { id: 'review', label: 'Design review', startDay }, startMinute: 600, endMinute: 660 },
            { event: { id: 'release', label: 'Release preparation', startDay, endDay: { ...startDay, day: 10 }, detail: 'All-day work' } },
            { event: { id: 'handoff', label: 'Overnight handoff', startDay, endDay: { ...startDay, day: 9 } }, startMinute: 1380, endMinute: 60 }
          ]}
        onEventPress={(input, date) => {
          setMessage(`${input.event.label}: ${date.day}`)
        }}
      />
      <LumenText>{message}</LumenText>
    </View>
  )
}

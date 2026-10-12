import { useState, useSyncExternalStore } from 'react'

import { Button, Calendar, DatePicker, Field, InputOTP, Label, Stack, Typography } from '@santi020k/lumen-react'

const subscribe = () => () => undefined

export const MixedAdapterIsland = () => {
  const ready = useSyncExternalStore(subscribe, () => true, () => false)
  const [date, setDate] = useState('2026-09-10')
  const [day, setDay] = useState('2026-09-10')
  const [code, setCode] = useState('123456')

  return (
    <Stack gap="group">
      <Typography><p data-react-status>{ready ? 'React hydrated' : 'React server rendered'}</p></Typography>
      <Field>
        <Label htmlFor="island-date">Island appointment</Label>
        <DatePicker id="island-date" locale="en" value={date} onValueChange={setDate} />
      </Field>
      <Button onClick={() => {
        setDate('2024-03-12')
      }}
      >
        Load island date
      </Button>
      <Typography><p data-island-date>{date}</p></Typography>
      <Calendar id="island-calendar" locale="en" value={day} onValueChange={setDay} />
      <Typography><p data-island-day>{day}</p></Typography>
      <InputOTP
        aria-label="Island verification code"
        value={code}
        onChange={event => {
          setCode(event.currentTarget.value)
        }}
      />
      <Typography><p data-island-code>{code}</p></Typography>
    </Stack>
  )
}

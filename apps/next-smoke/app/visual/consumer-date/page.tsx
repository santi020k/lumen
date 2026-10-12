'use client'

import { useRef, useState } from 'react'

import { Button, DatePicker, Field, FieldError, Label, Stack, Typography } from '@santi020k/lumen-react'

export default function ConsumerDatePage() {
  const [appointment, setAppointment] = useState('2026-09-10')
  const [requiredDate, setRequiredDate] = useState('')
  const [applicationError, setApplicationError] = useState<'grammar' | undefined>()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Stack as="main" className="visual-host" gap="section">
      <Typography><h1>Consumer date feedback</h1></Typography>
      <Field>
        <Label htmlFor="saved-appointment">Saved appointment</Label>
        <DatePicker id="saved-appointment" locale="en" value={appointment} onValueChange={setAppointment} />
      </Field>
      <Button onClick={() => {
        setAppointment('2024-03-12')
      }}
      >
        Load saved appointment
      </Button>
      <Field>
        <Label htmlFor="required-date">Required date</Label>
        <DatePicker
          id="required-date"
          inputRef={inputRef}
          locale="en"
          required
          value={requiredDate}
          onValueChange={setRequiredDate}
          aria-invalid={applicationError}
          aria-describedby="date-feedback"
          aria-errormessage="date-error"
        />
        <Typography><p id="date-feedback">Application validation belongs to the consumer.</p></Typography>
        <FieldError id="date-error" hidden={!applicationError}>Check the saved date.</FieldError>
      </Field>
      <Stack direction="horizontal" gap="related" wrap>
        <Button onClick={() => {
          inputRef.current?.checkValidity()
        }}
        >
          Check required date
        </Button>
        <Button onClick={() => {
          setRequiredDate('2026-09-10')
        }}
        >
          Fill valid date
        </Button>
        <Button onClick={() => {
          setApplicationError('grammar')
        }}
        >
          Set application error
        </Button>
        <Button onClick={() => {
          setApplicationError(undefined)
        }}
        >
          Clear application error
        </Button>
      </Stack>
    </Stack>
  )
}

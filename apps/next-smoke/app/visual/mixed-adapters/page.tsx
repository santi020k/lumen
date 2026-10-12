'use client'

import { createElement, useState } from 'react'

import { Alert, Button, DatePicker, Field, Label, Stack, Typography } from '@santi020k/lumen-react'

export default function MixedAdaptersPage() {
  const [visible, setVisible] = useState(true)
  const [value, setValue] = useState('2026-09-10')
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  const registerElements = async () => {
    try {
      const { defineLumenElements } = await import('@santi020k/lumen-elements/define')

      defineLumenElements(['DatePicker', 'Calendar'])

      setReady(true)
    } catch {
      setFailed(true)
    }
  }

  return (
    <Stack as="main" className="visual-host" gap="section">
      <Typography><h1>Mixed adapter date controls</h1></Typography>
      {failed && <Alert role="alert">Elements registration failed</Alert>}
      <Button onClick={() => {
        void registerElements()
      }}
      >
        Register Elements
      </Button>
      <Typography><p role="status">{ready ? 'Elements ready' : 'Elements not registered'}</p></Typography>
      <Button onClick={() => {
        setVisible(current => !current)
      }}
      >
        Toggle React picker
      </Button>
      <Button onClick={() => {
        setValue('2024-03-12')
      }}
      >
        Load saved date
      </Button>
      {visible && (
        <Field data-mixed-react>
          <Label htmlFor="mixed-date">React appointment</Label>
          <DatePicker id="mixed-date" locale="en" value={value} onValueChange={setValue} />
        </Field>
      )}
      <Typography><p data-selected-date>{value}</p></Typography>
      {createElement('lumen-calendar', { value: '2026-09-10', locale: 'en', 'aria-label': 'Elements calendar' })}
    </Stack>
  )
}

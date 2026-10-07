'use client'

import { useState } from 'react'

import { Button, Combobox, DatePicker, DateRangeInput, Field, Form, Input, Label, PhoneInput, Stack, Typography } from '@santi020k/lumen-react'
import { useLumenFormWorkflow } from '@santi020k/lumen-react/forms'

export default function FormBehaviorPage() {
  const [cancelReset, setCancelReset] = useState(false)
  const [nativeChanges, setNativeChanges] = useState(0)
  const [valueChanges, setValueChanges] = useState(0)
  const [period, setPeriod] = useState({ start: '2026-09-10', end: '2026-09-15' })
  const workflow = useLumenFormWorkflow()

  return (
    <Stack as="main" className="visual-host" gap="section">
      <Typography><h1>Native form behavior</h1></Typography>
      <Button onClick={() => {
        setCancelReset(current => !current)
      }}
      >
        {cancelReset ? 'Allow reset' : 'Cancel reset'}
      </Button>
      <Form
        aria-label="Editable fields"
        onReset={event => {
          if (cancelReset) event.preventDefault()
        }}
      >
        <Stack gap="group">
          <Combobox label="Framework" list="framework-options" name="framework" defaultValue="Astro" options={['Astro', 'React', 'Elements']} />
          <Field>
            <Label htmlFor="contact">Contact phone</Label>
            <PhoneInput id="contact" name="contact" countryLabel="Contact country" defaultCountryValue="CO" defaultValue="6015550123" />
          </Field>
          <DateRangeInput label="Period" value={period} onValueChange={setPeriod} labels={{ start: 'From', end: 'To', presets: 'Ranges', apply: 'Apply', cancel: 'Cancel' }} />
          <Field>
            <Label htmlFor="appointment">Appointment</Label>
            <DatePicker
              id="appointment"
              name="appointment"
              defaultValue="2026-09-10"
              onChange={() => {
                setNativeChanges(count => count + 1)
              }}
              onValueChange={() => {
                setValueChanges(count => count + 1)
              }}
            />
          </Field>
          <Button type="reset">Reset fields</Button>
          <Typography>
            <p>{`Native changes: ${nativeChanges}`}</p>
            <p>{`Value changes: ${valueChanges}`}</p>
          </Typography>
        </Stack>
      </Form>
      <Form
        {...workflow.formProps}
        aria-label="Workflow draft"
        enhance={false}
        onReset={event => {
          if (cancelReset) event.preventDefault()

          workflow.formProps.onReset(event)
        }}
      >
        <Label htmlFor="workflow-value">Workflow value</Label>
        <Input id="workflow-value" name="value" defaultValue="Saved" />
        <Button type="reset">Reset workflow</Button>
        <Typography><p role="status" aria-label="Workflow dirty">{workflow.dirty ? 'Draft changed' : 'Draft saved'}</p></Typography>
      </Form>
    </Stack>
  )
}

'use client'

import { useState } from 'react'

import { Button, Form, ListBox, Stack, Typography } from '@santi020k/lumen-react'

const reviewers = [
  { label: 'Amina', value: 'amina' },
  { label: 'Bruno', value: 'bruno' },
  { label: 'Chen', value: 'chen' }
]

// Focus order, naming, validation, and reset contracts for the React ListBox.
export default function ListBoxPage() {
  const [submitted, setSubmitted] = useState('')
  const [focusLog, setFocusLog] = useState<string[]>([])

  return (
    <main>
      <Form
        noValidate={false}
        onSubmit={event => {
          event.preventDefault()

          const reviewer = new FormData(event.currentTarget).get('reviewer')

          setSubmitted(typeof reviewer === 'string' ? reviewer : '')
        }}
      >
        <Stack gap="group">
          <Button variant="outline">Before</Button>
          <ListBox
            label="Reviewer"
            name="reviewer"
            onBlur={event => {
              const { name } = event.currentTarget

              setFocusLog(log => [...log, `blur:${name}`])
            }}
            onFocus={event => {
              const { name } = event.currentTarget

              setFocusLog(log => [...log, `focus:${name}`])
            }}
            options={reviewers}
            required
          />
          <ListBox aria-label="Backup reviewer" defaultValue="bruno" name="backup" options={reviewers} />
          <ListBox disabled label="Locked reviewer" name="locked" options={reviewers} />
          <Button tabIndex={0} type="submit">Submit</Button>
          <Button type="reset" variant="outline">Reset</Button>
          <Typography data-list-box-submitted><p>{submitted}</p></Typography>
          <Typography data-list-box-focus-log><p>{focusLog.join(' ')}</p></Typography>
        </Stack>
      </Form>
    </main>
  )
}

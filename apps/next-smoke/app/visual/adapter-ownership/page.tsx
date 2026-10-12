'use client'

import { useEffect, useState } from 'react'

import { Alert, Button, Calendar, Card, DatePicker, InputOTP, Label, ListBox, Stack, Typography } from '@santi020k/lumen-react'

const Islands = ({ prefix }: { prefix: string }) => {
  const [date, setDate] = useState('2026-09-10')
  const [calendarValue, setCalendarValue] = useState('2026-09-10')
  const [code, setCode] = useState('')
  const [reviewers, setReviewers] = useState<string[]>([])
  const [reviewerChanges, setReviewerChanges] = useState(0)
  const [reviewerInputs, setReviewerInputs] = useState(0)

  return (
    <Card
      data-ownership-island={prefix}
      onInputCapture={event => {
        if (event.target instanceof HTMLSelectElement && event.target.name === `${prefix}-reviewers`) {
          setReviewerInputs(count => count + 1)
        }
      }}
    >
      <Stack gap="group">
        <Stack gap="related">
          <Label htmlFor={`${prefix}-due`}>{`${prefix} due date`}</Label>
          <DatePicker id={`${prefix}-due`} locale="en" onValueChange={setDate} value={date} />
          <Button
            onClick={() => {
              setDate('2024-03-12')
            }}
            variant="outline"
          >
            {`${prefix} set March`}
          </Button>
        </Stack>
        <Calendar aria-label={`${prefix} delivery`} locale="en" onValueChange={setCalendarValue} value={calendarValue} />
        <Typography data-ownership-calendar-value><p>{calendarValue}</p></Typography>
        <InputOTP
          aria-label={`${prefix} code`}
          length={4}
          onChange={event => {
            setCode(event.currentTarget.value)
          }}
          value={code}
        />
        <Typography data-ownership-code><p>{code || 'empty'}</p></Typography>
        <ListBox
          label={`${prefix} reviewers`}
          multiple
          name={`${prefix}-reviewers`}
          onValueChange={values => {
            setReviewers(values)

            setReviewerChanges(count => count + 1)
          }}
          options={['Amina', 'Bruno', 'Chen']}
          value={reviewers}
        />
        <Typography data-ownership-reviewers><p>{reviewers.join(',') || 'empty'}</p></Typography>
        <Typography data-ownership-reviewer-changes><p>{reviewerChanges}</p></Typography>
        <Typography data-ownership-reviewer-inputs><p>{reviewerInputs}</p></Typography>
      </Stack>
    </Card>
  )
}

export default function AdapterOwnershipPage() {
  const [registered, setRegistered] = useState(false)
  const [lateIslands, setLateIslands] = useState(false)
  const [enhanced, setEnhanced] = useState(false)
  const [elementsError, setElementsError] = useState(false)

  useEffect(() => {
    void import('@santi020k/lumen-elements/define').then(({ defineLumenElements }) => {
      defineLumenElements(['DatePicker', 'Calendar', 'InputOTP', 'ListBox'])

      setRegistered(true)

      return true
    }).catch(() => {
      setElementsError(true)
    })
  }, [])

  return (
    <Stack as="main" className="visual-host" gap="section" data-elements-enhanced={enhanced} data-elements-registered={registered}>
      <Typography><h1>Adapter ownership</h1></Typography>
      {elementsError && <Alert role="alert">Elements registration failed</Alert>}
      <Islands prefix="early" />
      <Button
        disabled={!registered}
        onClick={() => {
          setLateIslands(true)
        }}
      >
        Mount late islands
      </Button>
      {lateIslands && <Islands prefix="late" />}
      <Button
        onClick={() => {
          void import('@santi020k/lumen-elements/define').then(({ enhanceLumenElements }) => {
            enhanceLumenElements(document)

            setEnhanced(true)

            return true
          }).catch(() => {
            setElementsError(true)
          })
        }}
      >
        Enhance controls
      </Button>
    </Stack>
  )
}

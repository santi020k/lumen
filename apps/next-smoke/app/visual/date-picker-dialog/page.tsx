'use client'

import { useState } from 'react'

import { Button, DatePicker, Dialog, DialogBody, DialogClose, Label, Stack, Typography } from '@santi020k/lumen-react'

// A short, scrolling modal mirrors consumer form dialogs that must not clip the calendar.
const ScrollingDialog = ({ dir }: { dir: 'ltr' | 'rtl' }) => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('2026-09-10')

  return (
    <div data-picker-dialog={dir} dir={dir}>
      <Button
        onClick={() => {
          setOpen(true)
        }}
      >
        {`Open ${dir} form`}
      </Button>
      <Typography data-picker-dialog-value><p>{date}</p></Typography>
      <Dialog
        aria-label={`${dir} form`}
        onOpenChange={setOpen}
        open={open}
        style={{ height: 150, width: 280 }}
      >
        <DialogBody>
          <Stack gap="related">
            <Label htmlFor={`${dir}-dialog-due`}>{`${dir} due date`}</Label>
            <DatePicker id={`${dir}-dialog-due`} locale="en" name="due" onValueChange={setDate} required value={date} />
            <Typography><p>Scrolling form content keeps the dialog shorter than its fields.</p></Typography>
            <DialogClose variant="outline">{`Close ${dir} form`}</DialogClose>
          </Stack>
        </DialogBody>
      </Dialog>
    </div>
  )
}

export default function DatePickerDialogPage() {
  return (
    <main>
      <Stack gap="section">
        <ScrollingDialog dir="ltr" />
        <ScrollingDialog dir="rtl" />
      </Stack>
    </main>
  )
}

import { useState } from 'react'

import {
  Button,
  type CalendarRange,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DateRangeInput,
  Dialog,
  LineChart
} from '@santi020k/lumen-react'

const initialRange = { start: '2026-09-01', end: '2026-09-30' }

const fullDate = (value: string | number) => new Intl.DateTimeFormat('en', {
  dateStyle: 'long', timeZone: 'UTC'
}).format(new Date(String(value)))

const observations = Array.from({ length: 30 }, (_, index) => ({
  x: `2026-09-${String(index + 1).padStart(2, '0')}`,
  xLabel: String(index + 1),
  y: index === 14 ? null : 24 + ((index * 7) % 19)
}))

export const ReactReportingDemo = () => {
  const [range, setRange] = useState<CalendarRange>(initialRange)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const rangeControl = (label: string) => (
    <DateRangeInput
      label={label}
      value={range}
      onValueChange={setRange}
      min="2026-09-01"
      max="2026-09-30"
      formatDate={value => new Intl.DateTimeFormat('en', {
        month: 'short', day: 'numeric', timeZone: 'UTC'
      }).format(new Date(value))}
      labels={{ start: 'From', end: 'To', presets: 'Quick ranges', apply: 'Apply period', cancel: 'Cancel' }}
      presets={[
        { label: 'September', value: initialRange },
        { label: 'Last seven days', value: { start: '2026-09-24', end: '2026-09-30' } },
        { label: 'One day', value: { start: '2026-09-30', end: '2026-09-30' } }
      ]}
      renderSummary={draft => `${fullDate(draft.start)} to ${fullDate(draft.end)}`}
    />
  )

  return (
    <div className="reporting-demo" data-reporting-demo>
      <Card>
        <CardHeader>
          <CardTitle>Team activity</CardTitle>
          <CardDescription>Synthetic observations · September 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="reporting-demo__controls">
            {rangeControl('Reporting period')}
            <Button
              variant="outline"
              onClick={() => {
                setSettingsOpen(true)
              }}
            >
              Open report settings
            </Button>
          </div>
          <output className="reporting-demo__period" aria-live="polite" data-applied-period>
            {range.start}
            {' to '}
            {range.end}
          </output>
          <LineChart
            presentation="bare"
            aria-label="Completed items per day"
            series={[{ id: 'completed', label: 'Completed items', data: observations.filter(point => point.x >= range.start && point.x <= range.end) }]}
            formatCategory={fullDate}
            formatValue={value => `${value} items`}
          />
        </CardContent>
      </Card>
      <Dialog aria-labelledby="report-settings-title" open={settingsOpen} onOpenChange={setSettingsOpen}>
        <div className="reporting-demo__dialog">
          <h2 id="report-settings-title">Report settings</h2>
          <p>The range editor stays above the dialog and inside the viewport.</p>
          {rangeControl('Dialog reporting period')}
          <div className="reporting-demo__actions">
            <Button
              variant="outline"
              onClick={() => {
                setSettingsOpen(false)
              }}
            >
              Close settings
            </Button>
            <Button
              loading={saving}
              onClick={() => {
                setSaving(true)
              }}
            >
              Save report
            </Button>
            {saving && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSaving(false)
                }}
              >
                Reset demo
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}

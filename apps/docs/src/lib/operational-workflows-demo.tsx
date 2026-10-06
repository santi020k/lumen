import { useState } from 'react'

import '@santi020k/lumen-react/styles/data-table-view.css'

import { AmountField, Badge, Button, Card, Checkbox, DataTable, type DataTableCell, type DataTableSavedView, DataTableSavedViews, DataTableView, type DataTableViewState, Field, FieldError, Input, Label, type LumenFormIssue, NativeSelect, Stack } from '@santi020k/lumen-react'

import { ImportReviewRecipe } from '../../../../packages/lumen/templates/react/import-review/src/lumen/import-review'
import { RecordWorkspaceRecipe } from '../../../../packages/lumen/templates/react/record-workspace/src/lumen/record-workspace'
import { ReviewWorkflowRecipe } from '../../../../packages/lumen/templates/react/review-workflow/src/lumen/review-workflow'

const initialView: DataTableViewState = { search: '', filters: [], visibility: {}, pagination: { pageIndex: 0, pageSize: 10 }, sorting: [], density: 'comfortable' }
const initialSavedViews: DataTableSavedView[] = [{ id: 'due', label: 'Due records', state: { ...initialView, filters: [{ id: 'status', value: 'due' }] } }]

const records = [
  { id: 'example-1', name: 'Example record A', amount: 100000, due: '2026-10-06', status: 'due' },
  { id: 'example-2', name: 'Example record B', amount: 250000, due: '2026-10-12', status: 'due' },
  { id: 'example-3', name: 'Example record C', amount: 0, due: '2026-10-01', status: 'settled' }
]

const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
const changeLabels = { before: 'Before', after: 'After', changed: 'Changed', unchanged: 'Unchanged' }

const RecordViewsDemo = () => {
  const [state, setState] = useState(initialView)
  const [views, setViews] = useState(initialSavedViews)
  const [activeId, setActiveId] = useState<string | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [exportPreview, setExportPreview] = useState('')

  return (
    <Card>
      <h2>Saved views and selected records</h2>
      <p>Synthetic records. Preferences stay in memory in this example; selection is never part of a saved view.</p>
      <DataTableSavedViews
        views={views}
        state={state}
        activeId={activeId}
        resetState={initialView}
        onApply={(next, id) => {
          setState(next)

          setActiveId(id)
        }}
        onSave={(label, next) => {
          const id = crypto.randomUUID()

          setViews(previous => [...previous, { id, label, state: next }])

          setActiveId(id)
        }}
        onUpdate={(id, next) => {
          setViews(previous => previous.map(view => view.id === id ? { ...view, state: next } : view))
        }}
        onRemove={id => {
          setViews(previous => previous.filter(view => view.id !== id))

          setActiveId(undefined)
        }}
      />
      <DataTableView
        label="Operational record controls"
        rows={records}
        getRowId={row => row.id}
        state={state}
        onStateChange={setState}
        columns={[
          { key: 'name', label: 'Record', value: row => row.name, canHide: false, sortable: true },
          { key: 'amount', label: 'Amount COP', value: row => row.amount, rangeFilter: 'number', sortable: true },
          { key: 'due', label: 'Due date', value: row => row.due, rangeFilter: 'date', sortable: true },
          { key: 'status', label: 'Record status', value: row => row.status, filterOptions: [{ value: 'due', label: 'Due' }, { value: 'settled', label: 'Settled' }] }
        ]}
        selection={{ selectedIds,
          onChange: setSelectedIds,
          unavailableReason: row => row.status === 'settled' ? 'Settled records cannot be selected for this action.' : undefined,
          actions: selection => (
            <Button
              type="button"
              disabled={selection.selectedIds.length === 0}
              onClick={() => {
                setExportPreview(selection.selectedIds.join(', '))
              }}
            >
              Preview selected export
            </Button>
          ) }}
      >
        {view => (
          <Stack gap="related">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                view.toggleSort('amount')
              }}
            >
              Sort by amount
            </Button>
            <DataTable
              role="region"
              tabIndex={0}
              aria-label="Operational example records"
              layout="records"
              rows={[...view.rows]}
              columns={[
                { key: 'name', header: 'Record' },
                ...(view.isColumnVisible('amount') ? [{ key: 'amount', header: 'Amount COP', render: (cell: DataTableCell) => typeof cell === 'number' ? money(cell) : 'Unavailable' }] : []),
                ...(view.isColumnVisible('due') ? [{ key: 'due', header: 'Due date' }] : []),
                ...(view.isColumnVisible('status') ? [{ key: 'status', header: 'Status' }] : []),
                { key: 'selection',
                  header: 'Select',
                  render: (_cell, row) => {
                    const record = records.find(item => item.id === row.id)

                    if (!record || !view.selection) return null

                    const selection = view.selection
                    const reason = selection.unavailableReason(record)

                    return (
                      <Stack gap="related">
                        <Label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ui-space-related, 0.75rem)' }}>
                          <Checkbox
                            aria-label={`Select ${record.name}`}
                            checked={selection.isSelected(record)}
                            disabled={reason !== undefined}
                            onChange={() => {
                              selection.toggle(record)
                            }}
                          />
                          Select
                        </Label>
                        {reason && <small>{reason}</small>}
                      </Stack>
                    )
                  } }
              ]}
            />
          </Stack>
        )}
      </DataTableView>
      <output aria-label="Selected export preview">{exportPreview}</output>
    </Card>
  )
}

const ReviewDemo = () => {
  const [outcome, setOutcome] = useState('success')
  const [saved, setSaved] = useState('')

  return (
    <Card>
      <h2>Review an exact amount and date</h2>
      <Field>
        <Label htmlFor="review-outcome">Simulated save result</Label>
        <NativeSelect
          id="review-outcome"
          value={outcome}
          onChange={event => {
            setOutcome(event.currentTarget.value)
          }}
        >
          <option value="success">Confirmed success</option>
          <option value="failure">Confirmed failure</option>
          <option value="uncertain">Unknown outcome</option>
        </NativeSelect>
      </Field>
      <ReviewWorkflowRecipe
        label="Reviewed example change"
        revision="example-record-v1"
        labels={{ ...changeLabels, errors: 'Check the fields', review: 'Review proposed change', confirm: 'Confirm reviewed change', edit: 'Keep editing', success: 'Change confirmed.', uncertain: 'The result is unknown. Check its status before trying again.', checkResult: 'Check saved result' }}
        prepare={values => {
          const amount = values.get('amount')
          const date = values.get('date')

          if (typeof amount !== 'string' || typeof date !== 'string') return undefined

          return { value: { amount, date },
            changes: [
              { id: 'amount', label: 'Amount COP', before: '100000', after: amount, changed: amount !== '100000' },
              { id: 'date', label: 'Due date', before: '2026-10-06', after: date, changed: date !== '2026-10-06' }
            ] }
        }}
        submit={async proposal => {
          await new Promise<void>(resolve => {
            window.setTimeout(resolve, 50)
          })

          if (outcome === 'failure') return { status: 'failure', message: 'The example rejected this change. Your input is retained.' }

          if (outcome === 'uncertain') return { status: 'uncertain', message: 'The result is unknown. Check its status before trying again.' }

          setSaved(`${proposal.amount} COP · ${proposal.date}`)

          return { status: 'success' }
        }}
        reconcile={() => Promise.resolve({ status: 'success' })}
      >
        {({ errors, pending }: { errors: readonly LumenFormIssue[], pending: boolean }) => (
          <Stack gap="related">
            <Field>
              <Label htmlFor="review-amount">Reviewed amount COP</Label>
              <AmountField id="review-amount" name="amount" locale="es-CO" fractionDigits={0} defaultValue="100000" required disabled={pending} invalidMessage="Enter a complete whole-peso amount." aria-describedby="review-amount-error" />
              <FieldError id="review-amount-error" message={errors.find(error => error.controlId === 'review-amount')?.message} />
            </Field>
            <Field>
              <Label htmlFor="review-date">Reviewed due date</Label>
              <Input id="review-date" name="date" type="date" defaultValue="2026-10-06" required disabled={pending} aria-describedby="review-date-error" />
              <FieldError id="review-date-error" message={errors.find(error => error.controlId === 'review-date')?.message} />
            </Field>
          </Stack>
        )}
      </ReviewWorkflowRecipe>
      <output aria-label="Confirmed example value">{saved}</output>
    </Card>
  )
}

const ImportDemo = () => {
  const [blocking, setBlocking] = useState(true)
  const [confirmed, setConfirmed] = useState(false)

  return (
    <Card>
      <h2>Inspect an import proposal</h2>
      <ImportReviewRecipe
        label="Synthetic import review"
        summary={<p>Two proposed records · Destination: example workspace</p>}
        issues={blocking ? [{ id: 'issue-1', location: 'Sheet A, row 2', message: 'Choose the intended matching record before continuing.', blocking: true }] : []}
        records={records.slice(0, 2).map(record => ({ id: record.id, label: record.name, changes: [{ id: 'amount', label: 'Amount COP', before: 'Unavailable', after: money(record.amount), changed: true }] }))}
        labels={{ ...changeLabels, issues: 'Review findings', records: 'Proposed values', blocking: 'Blocking', warning: 'Warning', empty: 'No proposed records', previous: 'Previous proposal', next: 'Next proposal', confirm: 'Confirm example import', position: (page, count) => `Record ${page} of ${count}` }}
        onConfirm={() => {
          setConfirmed(true)
        }}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setBlocking(previous => !previous)

          setConfirmed(false)
        }}
      >
        {blocking ? 'Resolve example finding' : 'Restore example finding'}
      </Button>
      {confirmed && <p role="status">Example import confirmed. No data was persisted.</p>}
    </Card>
  )
}

export const OperationalWorkflowsDemo = () => (
  <Stack gap="section">
    <RecordViewsDemo />
    <ReviewDemo />
    <ImportDemo />
    <RecordWorkspaceRecipe
      title="Example record workspace"
      headingId="record-workspace-title"
      status={<Badge variant="outline">Active</Badge>}
      facts={[{ label: 'Reference', value: 'EXAMPLE-001' }, { label: 'Amount', value: money(100000) }]}
      historyLabel="Record history"
      emptyHistoryLabel="No recorded events"
      events={[
        { id: 'event-1', dateTime: '2026-10-06', dateLabel: '06/Oct/2026', title: 'Correction recorded', stateLabel: 'Correction', description: 'A new event preserves the original record.', related: <p>Original event: EXAMPLE-EVENT-001</p> },
        { id: 'event-0', dateTime: '2026-10-01', dateLabel: '01/Oct/2026', title: 'Record created', description: 'Synthetic creation event. The application supplies all values.' }
      ]}
    />
  </Stack>
)

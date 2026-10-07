import type { ReactNode } from 'react'
import { useId, useRef, useState } from 'react'

import { Alert, Badge, Button, Card, ChangeSummary, type ChangeSummaryProps, Stack } from '@santi020k/lumen-react'

export interface ImportReviewIssue {
  id: string
  location: string
  message: string
  blocking: boolean
}

export interface ImportReviewRecord {
  id: string
  label: string
  changes: NonNullable<ChangeSummaryProps['items']>
}

export interface ImportReviewRecipeProps {
  label: string
  issues: readonly ImportReviewIssue[]
  records: readonly ImportReviewRecord[]
  /** Already localized counts and destination supplied by the host. */
  summary: ReactNode
  pending?: boolean
  onConfirm: () => void
  /** Application controls parsing, versioned proposals, confirmation and idempotency. */
  onIssue?: (id: string) => void
  labels: {
    issues: string
    records: string
    blocking: string
    warning: string
    empty: string
    previous: string
    next: string
    confirm: string
    before: string
    after: string
    changed: string
    unchanged: string
    position: (page: number, count: number) => string
  }
}

/** Pure review presentation. No CSV parsing, record matching or implicit reconciliation. */
export const ImportReviewRecipe = ({
  label, issues, records, summary, pending = false, onConfirm, onIssue, labels
}: ImportReviewRecipeProps) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const index = Math.max(0, records.findIndex(record => record.id === selectedId))
  const record = records[index]
  const headingId = useId()
  const detailRef = useRef<HTMLElement>(null)

  const move = (next: number) => {
    const target = records[next]

    if (!target) return

    setSelectedId(target.id)

    detailRef.current?.focus()
  }

  return (
    <section aria-label={label} aria-busy={pending}>
      <Stack gap="group">
        {summary}
        {issues.length > 0 && (
          <Alert variant={issues.some(issue => issue.blocking) ? 'warning' : 'default'}>
            <h3>{labels.issues}</h3>
            <ul>
              {issues.map(issue => (
                <li key={issue.id}>
                  <Badge variant={issue.blocking ? 'warning' : 'outline'}>{issue.blocking ? labels.blocking : labels.warning}</Badge>
                  {' '}
                  {onIssue ?
                    (
                      <Button
                        type="button"
                        variant="link"
                        disabled={pending}
                        onClick={() => {
                          onIssue(issue.id)
                        }}
                      >
                        {issue.location}
                      </Button>
                    ) :
                    <strong>{issue.location}</strong>}
                  {' '}
                  {issue.message}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        {record ?
          (
            <Card>
              <section ref={detailRef} tabIndex={-1} aria-labelledby={headingId}>
                <h3 id={headingId}>{record.label}</h3>
                <ChangeSummary
                  label={labels.records}
                  items={record.changes}
                  beforeLabel={labels.before}
                  afterLabel={labels.after}
                  changedLabel={labels.changed}
                  unchangedLabel={labels.unchanged}
                />
              </section>
              <Stack direction="horizontal" wrap gap="related">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || index === 0}
                  onClick={() => {
                    move(index - 1)
                  }}
                >
                  {labels.previous}
                </Button>
                <p role="status">{labels.position(index + 1, records.length)}</p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || index >= records.length - 1}
                  onClick={() => {
                    move(index + 1)
                  }}
                >
                  {labels.next}
                </Button>
              </Stack>
            </Card>
          ) :
          <p role="status">{labels.empty}</p>}
        <Button
          type="button"
          loading={pending}
          disabled={pending || records.length === 0 || issues.some(issue => issue.blocking)}
          onClick={onConfirm}
        >
          {labels.confirm}
        </Button>
      </Stack>
    </section>
  )
}

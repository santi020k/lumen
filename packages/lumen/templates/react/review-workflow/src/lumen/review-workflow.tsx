import type { ReactNode } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import { type LumenChangeSummaryItem } from '@santi020k/lumen-core'
import { Alert, Button, ChangeSummary, ErrorSummary, Form, type LumenFormIssue, type LumenFormWorkflowOptions, type LumenReviewResult, Stack, useLumenFormWorkflow, useLumenReviewWorkflow } from '@santi020k/lumen-react'

export interface ReviewProposal<T> {
  value: T
  changes: readonly LumenChangeSummaryItem[]
}

export interface ReviewWorkflowRecipeProps<T> {
  label: string
  /** Also changes when an external/programmatic draft or server revision changes. */
  revision: string
  children: (state: { pending: boolean, errors: readonly LumenFormIssue[] }) => ReactNode
  prepare: (values: FormData) => ReviewProposal<T> | undefined
  submit: (proposal: T) => Promise<LumenReviewResult>
  /** Check the command outcome at the server; never submit again from this callback. */
  reconcile?: () => Promise<{ status: 'success' } | { status: 'failure', message: string }>
  validation?: LumenFormWorkflowOptions
  labels: {
    errors: string
    review: string
    confirm: string
    edit: string
    success: string
    uncertain: string
    checkResult: string
    before: string
    after: string
    changed: string
    unchanged: string
  }
}

type ReviewController<T> = ReturnType<typeof useLumenReviewWorkflow<ReviewProposal<T>>>

const ResultCheck = ({ reconcile, onResult, label }: {
  reconcile: NonNullable<ReviewWorkflowRecipeProps<unknown>['reconcile']>
  onResult: (result: Awaited<ReturnType<NonNullable<ReviewWorkflowRecipeProps<unknown>['reconcile']>>>) => void
  label: string
}) => {
  const [checking, setChecking] = useState(false)
  const checkingRef = useRef(false)

  const check = async () => {
    if (checkingRef.current) return

    checkingRef.current = true

    setChecking(true)

    try {
      onResult(await reconcile())
    } catch {
      // Keep the visible unknown-outcome guidance and permit another status check.
    } finally {
      checkingRef.current = false

      setChecking(false)
    }
  }

  return (
    <Button
      type="button"
      loading={checking}
      disabled={checking}
      onClick={() => {
        void check()
      }}
    >
      {label}
    </Button>
  )
}

const ReviewActions = <T,>({ workflow, labels, reconcile, edit }: {
  workflow: ReviewController<T>
  labels: ReviewWorkflowRecipeProps<T>['labels']
  reconcile: ReviewWorkflowRecipeProps<T>['reconcile']
  edit: () => void
}) => {
  if (workflow.status === 'editing') return <Button type="submit">{labels.review}</Button>

  if (workflow.status === 'success') return null

  if (workflow.status === 'uncertain') return reconcile ?
    <ResultCheck reconcile={reconcile} onResult={workflow.reconcile} label={labels.checkResult} /> :
    null

  return (
    <Stack direction="horizontal" wrap gap="related">
      <Button
        type="button"
        loading={workflow.status === 'pending'}
        disabled={workflow.status === 'pending'}
        onClick={() => {
          void workflow.confirm()
        }}
      >
        {labels.confirm}
      </Button>
      <Button type="button" variant="outline" disabled={workflow.status === 'pending'} onClick={edit}>{labels.edit}</Button>
    </Stack>
  )
}

/** Supply an explicit allowlist in prepare; never include credentials or uploaded documents in changes. */
export const ReviewWorkflowRecipe = <T,>({
  label, revision, children, prepare, submit, reconcile, validation, labels
}: ReviewWorkflowRecipeProps<T>) => {
  const form = useLumenFormWorkflow(validation)
  const [editRevision, setEditRevision] = useState(0)
  const reviewRef = useRef<HTMLElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  const workflow = useLumenReviewWorkflow<ReviewProposal<T>>({
    revision: `${revision}:${editRevision}`,
    submit: proposal => submit(proposal.value),
    uncertainMessage: labels.uncertain
  })

  const pending = workflow.status === 'pending' || workflow.status === 'uncertain'
  const review = workflow.proposal

  useLayoutEffect(() => {
    if (workflow.status === 'review') reviewRef.current?.focus()
    else if (['failure', 'uncertain', 'success'].includes(workflow.status)) feedbackRef.current?.focus()
  }, [workflow.status])

  const invalidate = () => {
    if (workflow.edit()) setEditRevision(current => current + 1)
  }

  return (
    <Form
      {...form.formProps}
      aria-label={label}
      aria-busy={workflow.status === 'pending'}
      onInput={event => {
        form.formProps.onInput(event)

        invalidate()
      }}
      onChange={event => {
        form.formProps.onChange(event)

        invalidate()
      }}
      onReset={event => {
        if (pending) event.preventDefault()
        else invalidate()

        form.formProps.onReset(event)
      }}
      onSubmit={event => {
        event.preventDefault()

        if (pending || !form.validate(event.currentTarget)) return

        const proposal = prepare(new FormData(event.currentTarget))

        if (proposal) workflow.review(proposal)
      }}
    >
      <ErrorSummary heading={labels.errors} errors={{ fields: [...form.errors], form: [] }} />
      <fieldset disabled={pending} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
        <legend className="sr-only">{label}</legend>
        {children({ pending, errors: form.errors })}
      </fieldset>
      {review && workflow.status !== 'success' && (
        <ChangeSummary
          ref={reviewRef}
          tabIndex={-1}
          label={labels.review}
          items={review.changes}
          beforeLabel={labels.before}
          afterLabel={labels.after}
          changedLabel={labels.changed}
          unchangedLabel={labels.unchanged}
        />
      )}
      <div ref={feedbackRef} tabIndex={-1}>
        {(workflow.status === 'failure' || workflow.status === 'uncertain') &&
          <Alert role="alert" variant="warning">{workflow.message}</Alert>}
        {workflow.status === 'success' && <Alert role="status" variant="success">{labels.success}</Alert>}
      </div>
      <ReviewActions
        workflow={workflow}
        labels={labels}
        reconcile={reconcile}
        edit={() => {
          invalidate()

          form.formRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea')?.focus()
        }}
      />
    </Form>
  )
}

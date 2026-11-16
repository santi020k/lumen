'use client'

import { useRef, useState } from 'react'

import { Badge, Button, Card, Progress, Typography } from '@santi020k/lumen-react'

export type TaskStatus = 'queued' | 'running' | 'complete' | 'failed' | 'canceled'
export interface TaskSnapshot {
  status: TaskStatus
  completed: number
  total: number
  detail: string
}
export type TaskAction = 'cancel' | 'retry'

const taskStatusLabels: Record<TaskStatus, string> = { queued: 'Queued', running: 'In progress', complete: 'Complete', failed: 'Failed', canceled: 'Canceled' }

export interface TaskProgressRecipeProps {
  title: string
  snapshot: TaskSnapshot
  labels?: Record<TaskStatus, string>
  progressLabel?: string
  retryLabel?: string
  cancelLabel?: string
  onAction?: (action: TaskAction) => void | Promise<void>
  actionErrorLabel?: string
}

/** The application supplies every state. Requesting cancellation never marks a task canceled. */

const variants = { queued: 'outline', running: 'outline', complete: 'success', failed: 'destructive', canceled: 'outline' } as const

const TaskActions = ({ snapshot, onAction, retryLabel = 'Retry', cancelLabel = 'Cancel task', actionErrorLabel = 'The action could not be completed. Try again.' }: TaskProgressRecipeProps) => {
  const pendingRef = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<{ snapshot: TaskSnapshot, message: string }>()

  const request = async (action: TaskAction): Promise<void> => {
    if (pendingRef.current || !onAction) return

    pendingRef.current = true

    setPending(true)

    setError(undefined)

    try {
      await onAction(action)
    } catch {
      setError({ snapshot, message: actionErrorLabel })
    } finally {
      pendingRef.current = false

      setPending(false)
    }
  }

  if (!onAction || snapshot.status === 'complete') return null

  const retry = snapshot.status === 'failed' || snapshot.status === 'canceled'

  return (
    <>
      <div className="lumen-task-progress__actions">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => {
            void request(retry ? 'retry' : 'cancel')
          }}
        >
          {retry ? retryLabel : cancelLabel}
        </Button>
      </div>
      <p role="status">{error?.snapshot === snapshot ? error.message : ''}</p>
    </>
  )
}

export const TaskProgressRecipe = (props: TaskProgressRecipeProps) => {
  const { title, snapshot, labels = taskStatusLabels, progressLabel = 'Completed steps' } = props
  const total = Number.isFinite(snapshot.total) && snapshot.total > 0 ? snapshot.total : 1
  const completed = Number.isFinite(snapshot.completed) ? Math.max(0, Math.min(total, snapshot.completed)) : 0

  return (
    <Card className="lumen-task-progress" data-task-status={snapshot.status}>
      <div className="lumen-task-progress__heading">
        <Typography><h3>{title}</h3></Typography>
        <Badge variant={variants[snapshot.status]}>{labels[snapshot.status]}</Badge>
      </div>
      <p className="lumen-task-progress__detail" role="status">{snapshot.detail}</p>
      <Progress value={completed} max={total} aria-label={progressLabel} />
      <span className="lumen-task-progress__count">
        {completed}
        {' '}
        /
        {' '}
        {total}
      </span>
      <TaskActions {...props} />
    </Card>
  )
}

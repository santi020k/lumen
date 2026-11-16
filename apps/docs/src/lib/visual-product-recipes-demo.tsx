import { useState } from 'react'

import '../../../../packages/lumen/templates/shared/card-detail/src/lumen/card-detail.css'
import '../../../../packages/lumen/templates/shared/metric-card/src/lumen/metric-card.css'
import '../../../../packages/lumen/templates/shared/task-progress/src/lumen/task-progress.css'

import { Button, Grid, Stack, Typography } from '@santi020k/lumen-react'

import { CardDetailRecipe } from '../../../../packages/lumen/templates/react/card-detail/src/lumen/card-detail'
import { MetricCardRecipe, type MetricSnapshot } from '../../../../packages/lumen/templates/react/metric-card/src/lumen/metric-card'
import { TaskProgressRecipe, type TaskSnapshot, type TaskStatus } from '../../../../packages/lumen/templates/react/task-progress/src/lumen/task-progress'

const readyMetric: MetricSnapshot = { state: 'ready', value: 184320, values: [118, 126, 132, 148, 162, 184], change: '+12.4%', comparison: 'versus the previous month', trend: 'positive', updatedAt: 'Updated just now' }

const snapshots: Record<TaskStatus, TaskSnapshot> = {
  queued: { status: 'queued', completed: 0, total: 3, detail: 'Waiting for an export worker.' },
  running: { status: 'running', completed: 1, total: 3, detail: 'Rendering the second of three files.' },
  complete: { status: 'complete', completed: 3, total: 3, detail: 'All three files are ready.' },
  failed: { status: 'failed', completed: 1, total: 3, detail: 'The second file could not be rendered. Your source files are preserved.' },
  canceled: { status: 'canceled', completed: 1, total: 3, detail: 'The application confirmed that the export was canceled.' }
}

const states: TaskStatus[] = ['queued', 'running', 'complete', 'failed', 'canceled']

export const VisualProductRecipesDemo = () => {
  const [metric, setMetric] = useState<MetricSnapshot>({ state: 'error', message: 'Revenue could not be refreshed.' })
  const [task, setTask] = useState<TaskSnapshot>(snapshots.running)

  return (
    <Stack gap="section">
      <Typography>
        <h3>Cards that open the details</h3>
        <p>Open a dialog or sheet with a real button. Close it or press Escape to return focus to that button.</p>
      </Typography>
      <Grid minItemWidth="17rem" gap="group">
        <CardDetailRecipe title="Release overview" summary="Review the scope and evidence in a centered dialog."><Typography><p>This fictional release contains three completed features. The compact card and expanded view share their title.</p></Typography></CardDetailRecipe>
        <CardDetailRecipe title="Workspace activity" summary="Keep supporting information in a side sheet." presentation="sheet"><Typography><p>This fictional workspace contains an export request and a review. The application supplies the details.</p></Typography></CardDetailRecipe>
      </Grid>
      <Typography>
        <h3>Metrics with complete states</h3>
        <p>
          The values below are illustrative. Stale data stays visible with a label;
          failed requests provide a recovery action.
        </p>
      </Typography>
      <Grid minItemWidth="15rem" gap="group">
        <MetricCardRecipe label="Monthly revenue" prefix="$" snapshot={readyMetric} />
        <MetricCardRecipe label="Revenue from cache" prefix="$" snapshot={{ ...readyMetric, state: 'stale', updatedAt: 'Updated 12 minutes ago' }} />
        <MetricCardRecipe label="Pending revenue" snapshot={{ state: 'loading' }} />
        <MetricCardRecipe
          label="Revenue recovery"
          prefix="$"
          snapshot={metric}
          onRetry={() => {
            setMetric(readyMetric)
          }}
        />
      </Grid>
      <Typography>
        <h3>Task progress from real state</h3>
        <p>
          These controls simulate application events. The recipe never advances on a timer
          or assumes that a cancellation request succeeded.
        </p>
      </Typography>
      <Stack direction="horizontal" wrap gap="related" role="group" aria-label="Simulate task state">
        {states.map(status => (
          <Button
            key={status}
            variant="outline"
            aria-pressed={task.status === status}
            onClick={() => {
              setTask(snapshots[status])
            }}
          >
            {status}
          </Button>
        ))}
      </Stack>
      <TaskProgressRecipe
        title="Export workspace"
        snapshot={task}
        onAction={action => {
          setTask(action === 'retry' ? snapshots.queued : snapshots.canceled)
        }}
      />
    </Stack>
  )
}

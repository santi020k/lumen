'use client'

import { Button, ErrorState, Progress, Stack } from '@santi020k/lumen-react'

export type MediaProcessingState =
  | { phase: 'idle' | 'cancelled' | 'success', message: string } |
  { phase: 'pending', message: string, progress: number | null } |
  { phase: 'error', message: string, recovery: string }

export interface MediaProcessingRecipeProps {
  cancelLabel: string
  onCancel: () => void
  onRetry: () => void
  onStart: () => void
  progressLabel: string
  retryLabel: string
  startLabel: string
  state: MediaProcessingState
}

/** Host-owned jobs control all transitions; cancellation is complete only after acknowledgement. */
export const MediaProcessingRecipe = ({
  cancelLabel, onCancel, onRetry, onStart, progressLabel, retryLabel, startLabel, state
}: MediaProcessingRecipeProps) => (
  <Stack gap="related">
    {state.phase === 'error' ?
      (
        <ErrorState title={state.message} description={state.recovery} graphic={false} announce="polite" headingLevel={3}>
          <Button onClick={onRetry}>{retryLabel}</Button>
        </ErrorState>
      ) :
      <p role="status">{state.message}</p>}
    {state.phase === 'pending' && (
      <>
        {state.progress !== null && Number.isFinite(state.progress) && (
          <Progress aria-label={progressLabel} value={Math.min(100, Math.max(0, state.progress))} />
        )}
        <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
      </>
    )}
    {state.phase !== 'pending' && state.phase !== 'error' && <Button onClick={onStart}>{startLabel}</Button>}
  </Stack>
)

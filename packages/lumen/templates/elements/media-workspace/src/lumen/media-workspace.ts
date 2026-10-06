// The application accepts requests and renders canonical state; this bridge owns no services.
const updatePreview = (workspace: HTMLElement, control: HTMLElement) => {
  const comparison = workspace.querySelector<HTMLElement>('lumen-image-comparison')
  const viewport = workspace.querySelector<HTMLElement>('lumen-media-viewport')

  if (!comparison || !viewport) return

  const inspect = control.hasAttribute('data-inspect')

  comparison.hidden = inspect

  viewport.hidden = !inspect

  const mode = control.dataset.comparisonMode

  if (mode) comparison.setAttribute('mode', mode)

  for (const button of workspace.querySelectorAll<HTMLElement>('[data-comparison-mode], [data-inspect]')) {
    button.setAttribute('aria-pressed', String(button === control))
  }
}

const updateAdjustment = (field: HTMLElement, slider: HTMLInputElement, announce: boolean) => {
  const output = field.querySelector('output')
  const badge = field.querySelector<HTMLElement>('[data-adjustment-modified]')
  const reset = field.querySelector<HTMLElement>('[data-adjustment-reset]')

  if (!output || !badge || !reset) return

  const value = slider.valueAsNumber

  if (!Number.isFinite(value)) return

  output.textContent = `${value} ${field.dataset.unit ?? 'EV'}`

  slider.ariaValueText = output.textContent

  badge.hidden = value === Number(field.dataset.defaultValue)

  reset.toggleAttribute('disabled', slider.disabled || badge.hidden)

  if (announce) field.dispatchEvent(new CustomEvent('ui:adjustment-change', {
    bubbles: true, detail: { id: field.dataset.mediaAdjustment, value }
  }))
}

for (const workspace of document.querySelectorAll<HTMLElement>('[data-media-workspace]')) {
  workspace.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return

    const control = event.target.closest<HTMLElement>('lumen-button')

    if (!control || control.hasAttribute('disabled') || !workspace.contains(control)) return

    if (control.dataset.comparisonMode || control.hasAttribute('data-inspect')) updatePreview(workspace, control)

    const direction = control.dataset.mediaMove

    if (direction) workspace.dispatchEvent(new CustomEvent('ui:media-move-request', {
      bubbles: true, detail: { id: control.dataset.mediaId, direction }
    }))

    const action = control.dataset.mediaProcessingAction

    if (action) workspace.dispatchEvent(new CustomEvent('ui:media-processing-request', {
      bubbles: true, detail: { action }
    }))
  })

  for (const field of workspace.querySelectorAll<HTMLElement>('[data-media-adjustment]')) {
    const reset = field.querySelector<HTMLElement>('[data-adjustment-reset]')

    field.addEventListener('input', event => {
      if (event.target instanceof HTMLInputElement && !event.target.disabled) {
        updateAdjustment(field, event.target, true)
      }
    })

    reset?.addEventListener('click', () => {
      const slider = field.querySelector<HTMLInputElement>('input[type="range"]')

      if (!slider || slider.disabled || reset.hasAttribute('disabled')) return

      slider.value = field.dataset.defaultValue ?? '0'

      updateAdjustment(field, slider, true)

      slider.focus()
    })
  }
}
// Keep selection canonical and preserve focus by stable media ID after moves. Render job messages
// through textContent. Keep cancellation pending until acknowledged and ignore stale completions.

export type MediaProcessingState =
  | { phase: 'idle' | 'cancelled' | 'success', message: string } |
  { phase: 'pending', message: string, progress: number | null } |
  { phase: 'error', message: string, recovery: string }

const renderProcessingError = (panel: HTMLElement, state: MediaProcessingState): void => {
  const error = panel.querySelector<HTMLElement>('[data-processing-error]')

  if (!error) return

  error.hidden = state.phase !== 'error'

  const title = error.querySelector('[data-processing-error-title]')
  const recovery = error.querySelector('[data-processing-recovery]')

  if (title) title.textContent = state.phase === 'error' ? state.message : ''

  if (recovery) recovery.textContent = state.phase === 'error' ? state.recovery : ''
}

const renderProcessingProgress = (panel: HTMLElement, state: MediaProcessingState): void => {
  const progress = panel.querySelector<HTMLElement>('[data-processing-progress]')

  if (!progress) return

  const value = state.phase === 'pending' ? state.progress : null
  const known = value !== null && Number.isFinite(value)

  progress.hidden = !known

  if (known) progress.setAttribute('value', String(Math.min(100, Math.max(0, value))))
}

const processingActionVisible = (action: string | undefined, phase: MediaProcessingState['phase']): boolean => {
  if (action === 'cancel') return phase === 'pending'

  if (action === 'retry') return phase === 'error'

  return action === 'start' && phase !== 'pending' && phase !== 'error'
}

/** Call after a host transition. The bridge neither starts jobs nor acknowledges cancellation. */
export const renderMediaProcessing = (workspace: HTMLElement, state: MediaProcessingState): void => {
  const panel = workspace.querySelector<HTMLElement>('[data-media-processing]')

  if (!panel) return

  panel.dataset.phase = state.phase

  const message = panel.querySelector<HTMLElement>('[data-processing-message]')

  if (message) {
    message.textContent = state.message

    message.hidden = state.phase === 'error'
  }

  renderProcessingError(panel, state)

  renderProcessingProgress(panel, state)

  for (const button of panel.querySelectorAll<HTMLElement>('[data-media-processing-action]')) {
    const visible = processingActionVisible(button.dataset.mediaProcessingAction, state.phase)

    button.hidden = !visible

    button.toggleAttribute('disabled', !visible)
  }
}

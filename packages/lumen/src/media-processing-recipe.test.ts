// @vitest-environment jsdom
import { expect, test } from 'vitest'

import {
  type MediaProcessingState,
  renderMediaProcessing
} from '../templates/elements/media-workspace/src/lumen/media-workspace.js'

const createWorkspace = (): HTMLElement => {
  const workspace = document.createElement('section')
  workspace.innerHTML = `<section data-media-processing>
    <p data-processing-message></p>
    <lumen-progress data-processing-progress></lumen-progress>
    <lumen-error-state data-processing-error>
      <h3 data-processing-error-title></h3><p data-processing-recovery></p>
    </lumen-error-state>
    <lumen-button data-media-processing-action="start"></lumen-button>
    <lumen-button data-media-processing-action="cancel"></lumen-button>
    <lumen-button data-media-processing-action="retry"></lumen-button>
  </section>`
  return workspace
}

test.each([
  [{ phase: 'idle', message: 'Ready' }, 'start'],
  [{ phase: 'pending', message: 'Working', progress: 20 }, 'cancel'],
  [{ phase: 'error', message: 'Failed', recovery: 'Retry' }, 'retry'],
  [{ phase: 'cancelled', message: 'Cancelled' }, 'start'],
  [{ phase: 'success', message: 'Completed' }, 'start']
] satisfies [MediaProcessingState, string][])('renders host phase %j with one usable action', (state, action) => {
  const workspace = createWorkspace()
  renderMediaProcessing(workspace, state)
  const visible = Array.from(workspace.querySelectorAll<HTMLElement>('[data-media-processing-action]'))
    .filter(button => !button.hidden && !button.hasAttribute('disabled'))
  expect(visible.map(button => button.dataset.mediaProcessingAction)).toEqual([action])
  expect(workspace.querySelector('[data-media-processing]')?.getAttribute('data-phase')).toBe(state.phase)
})

test('bounds known progress, hides unknown progress and renders errors as text', () => {
  const workspace = createWorkspace()
  const progress = workspace.querySelector<HTMLElement>('[data-processing-progress]')
  renderMediaProcessing(workspace, { phase: 'pending', message: 'Working', progress: 150 })
  expect(progress?.getAttribute('value')).toBe('100')
  expect(progress?.hidden).toBe(false)
  renderMediaProcessing(workspace, { phase: 'pending', message: 'Working', progress: Number.NaN })
  expect(progress?.hidden).toBe(true)
  renderMediaProcessing(workspace, { phase: 'error', message: '<img src=x>', recovery: '<script>unsafe</script>' })
  expect(workspace.querySelector('[data-processing-error-title]')?.textContent).toBe('<img src=x>')
  expect(workspace.querySelector('[data-processing-recovery]')?.textContent).toBe('<script>unsafe</script>')
  expect(workspace.querySelector('img, script')).toBeNull()
  renderMediaProcessing(workspace, { phase: 'success', message: 'Completed' })
  expect(workspace.querySelector<HTMLElement>('[data-processing-error]')?.hidden).toBe(true)
  expect(workspace.querySelector('[data-processing-error-title]')?.textContent).toBe('')
})

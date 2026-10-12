import { normalizeLumenProgress } from '@santi020k/lumen-core'

interface ProgressChangeDetail {
  max?: number | undefined
  value?: number | undefined
}

export const readProgressChangeDetail = (detail: unknown): ProgressChangeDetail => {
  if (typeof detail !== 'object' || detail === null) return {}

  const max = 'max' in detail && typeof detail.max === 'number' ? detail.max : undefined
  const value = 'value' in detail && typeof detail.value === 'number' ? detail.value : undefined

  return { max, value }
}

export const updateProgress = (
  root: HTMLElement,
  { max, value }: ProgressChangeDetail
): void => {
  const current = normalizeLumenProgress(
    root.getAttribute('aria-valuemax'), root.getAttribute('aria-valuenow')
  )

  // Omitted or invalid fields keep the current state instead of resetting it.
  const next = normalizeLumenProgress(
    max !== undefined && Number.isFinite(max) && max > 0 ? max : current.max,
    value !== undefined && Number.isFinite(value) ? value : current.value
  )

  const indicator = root.querySelector<HTMLElement>(
    '[data-slot="progress-indicator"]'
  )

  root.setAttribute('aria-valuemax', String(next.max))

  root.setAttribute('aria-valuenow', String(next.value))

  if (indicator) indicator.style.width = `${next.percentage}%`
}

export const initProgress = (scope: ParentNode): void => {
  for (const root of scope.querySelectorAll<HTMLElement>('[data-ui-progress]')) {
    if (root.dataset.uiProgressBound === 'true') continue

    root.dataset.uiProgressBound = 'true'

    root.addEventListener('ui:progress-change', event => {
      updateProgress(root, readProgressChangeDetail(event instanceof CustomEvent ? event.detail : undefined))
    })
  }
}

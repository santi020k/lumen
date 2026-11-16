export type TaskStatus = 'queued' | 'running' | 'complete' | 'failed' | 'canceled'
export interface TaskSnapshot {
  status: TaskStatus
  completed: number
  total: number
  detail: string
}
export type TaskAction = 'cancel' | 'retry'
export const taskStatusLabels: Record<TaskStatus, string> = { queued: 'Queued', running: 'In progress', complete: 'Complete', failed: 'Failed', canceled: 'Canceled' }

const isFiniteNonnegative = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0

export const isTaskSnapshot = (value: unknown): value is TaskSnapshot => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>

  return typeof candidate.status === 'string' && Object.hasOwn(taskStatusLabels, candidate.status) &&
    isFiniteNonnegative(candidate.completed) && isFiniteNonnegative(candidate.total) && candidate.total > 0 &&
    candidate.completed <= candidate.total && typeof candidate.detail === 'string'
}

const allowedAction = (action: string | undefined, status: string | undefined): boolean => {
  if (action === 'retry') return status === 'failed' || status === 'canceled'

  if (action === 'cancel') return status === 'queued' || status === 'running'

  return false
}

const updateProgress = (root: HTMLElement, snapshot: TaskSnapshot): void => {
  const progress = root.querySelector<HTMLElement>('[data-task-progress]')

  if (!progress) return

  if (progress.localName === 'lumen-progress') {
    progress.setAttribute('max', String(snapshot.total))

    progress.setAttribute('value', String(snapshot.completed))

    return
  }

  progress.setAttribute('aria-valuemax', String(snapshot.total))

  progress.setAttribute('aria-valuenow', String(snapshot.completed))

  const bar = progress.querySelector<HTMLElement>('[data-slot="progress-indicator"]')

  if (bar) bar.style.width = `${snapshot.completed / snapshot.total * 100}%`
}

const renderSnapshot = (root: HTMLElement, snapshot: TaskSnapshot): void => {
  root.dataset.taskStatus = snapshot.status

  const detail = root.querySelector<HTMLElement>('[data-task-detail]')

  if (detail) detail.textContent = snapshot.detail

  for (const label of root.querySelectorAll<HTMLElement>('[data-task-status-label]')) label.hidden = label.dataset.taskStatusLabel !== snapshot.status

  updateProgress(root, snapshot)

  const count = root.querySelector<HTMLElement>('[data-task-count]')

  if (count) count.textContent = `${snapshot.completed} / ${snapshot.total}`

  for (const control of root.querySelectorAll<HTMLElement>('[data-task-action]')) {
    control.hidden = !allowedAction(control.dataset.taskAction, snapshot.status)
  }
}

/** The host dispatches ui:task-update after real task events. This binding never advances time. */
export const bindTaskProgress = (root: HTMLElement): (() => void) => {
  const update = (event: Event): void => {
    if (!(event instanceof CustomEvent) || event.target !== root || !isTaskSnapshot(event.detail)) return

    renderSnapshot(root, event.detail)
  }

  const click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return

    const control = event.target.closest<HTMLElement>('[data-task-action]')

    if (control?.closest('[data-task-recipe]') !== root || control.hidden || control.hasAttribute('disabled')) return

    const action = control.dataset.taskAction

    if (!allowedAction(action, root.dataset.taskStatus)) return

    root.dispatchEvent(new CustomEvent('ui:task-action', { bubbles: true, detail: { action } }))
  }

  root.addEventListener('ui:task-update', update)

  root.addEventListener('click', click)

  return () => {
    root.removeEventListener('ui:task-update', update)

    root.removeEventListener('click', click)
  }
}

const mounted = new WeakMap<HTMLElement, () => void>()

export const mountTaskProgress = (scope: ParentNode): (() => void) => {
  const cleanups: (() => void)[] = []

  for (const root of scope.querySelectorAll<HTMLElement>('[data-task-recipe]')) {
    if (mounted.has(root)) continue

    const cleanup = bindTaskProgress(root)

    mounted.set(root, cleanup)

    cleanups.push(() => {
      cleanup()

      mounted.delete(root)
    })
  }

  return () => {
    for (const cleanup of cleanups) cleanup()
  }
}

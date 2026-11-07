import { queryScope } from '../scope.js'

const getRangeState = (start: string, end: string): string => {
  if (start && end) return 'complete'

  return start ? 'selecting-end' : 'empty'
}

const bindDateRangePickers = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  root.dataset.uiBound = 'true'

  const inputs = root.querySelectorAll<HTMLInputElement>('input[type="date"]')
  const start = inputs[0]
  const end = inputs[inputs.length - 1]

  if (!start || !end || start === end) return

  const syncRange = (): void => {
    const datePickers = root.querySelectorAll<HTMLElement>('[data-ui-date-picker]')

    datePickers[0]?.setAttribute('data-range-part', 'start')

    datePickers[datePickers.length - 1]?.setAttribute('data-range-part', 'end')

    if (start.value) {
      end.min = start.value
    } else {
      end.removeAttribute('min')
    }

    if (end.value) {
      start.max = end.value
    } else {
      start.removeAttribute('max')
    }

    if (start.value && end.value && end.value < start.value) {
      end.value = start.value

      end.dispatchEvent(new Event('change', { bubbles: true }))
    }

    root.dataset.rangeState = getRangeState(start.value, end.value)
  }

  start.addEventListener('change', syncRange)

  end.addEventListener('change', syncRange)

  syncRange()
}

export const initDateRangePickers = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-date-range-picker]')) bindDateRangePickers(root)
}

export type LumenStreamStatus = 'idle' | 'streaming' | 'complete' | 'error' | 'canceled'
export type LumenToolStatus = 'queued' | 'running' | 'success' | 'error' | 'canceled'
export type LumenApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface LumenPromptSubmitDetail { text: string }
export interface LumenApprovalResponseDetail { requestId: string, response: 'approve' | 'reject' }

export const readLumenPromptSubmitDetail = (value: unknown): LumenPromptSubmitDetail | undefined => {
  if (typeof value === 'object' && value !== null && 'text' in value && typeof value.text === 'string') return { text: value.text }

  return undefined
}

export const readLumenApprovalResponseDetail = (value: unknown): LumenApprovalResponseDetail | undefined => {
  if (typeof value !== 'object' || value === null || !('requestId' in value) || typeof value.requestId !== 'string' || !('response' in value)) return undefined

  if (value.response === 'approve' || value.response === 'reject') return { requestId: value.requestId, response: value.response }

  return undefined
}

export const normalizeLumenPromptLimit = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return 4000

  return Math.min(2147483647, Math.floor(value))
}

export const canSubmitLumenPrompt = (text: string, limit = 4000): boolean => (
  text.trim().length > 0 && text.length <= normalizeLumenPromptLimit(limit)
)

const hasUnsafeCitationCharacter = (value: string): boolean => {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)

    if (code <= 32 || code === 127 || code === 92) return true
  }

  return false
}

const webCitationHref = (value: string): string | undefined => {
  try {
    const url = new URL(value)

    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password) return url.href
  } catch {
    return undefined
  }

  return undefined
}

/** Citations accept safe web destinations and local absolute paths, never executable schemes. */
export const resolveLumenCitationHref = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined

  if (hasUnsafeCitationCharacter(value)) return undefined

  if (value.startsWith('/') && !value.startsWith('//')) return value

  return webCitationHref(value)
}

const isPlainSubmitKey = (event: KeyboardEvent): boolean => event.key === 'Enter' && !event.defaultPrevented && !event.isComposing &&
  !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey

export interface LumenPromptComposerController {
  destroy(): void

  sync(): void
}

/** Bind an event bridge. A supplied native action keeps its normal POST behavior. */
export const createLumenPromptComposerController = (root: HTMLElement): LumenPromptComposerController => {
  const form = root.matches('form') ? root : root.querySelector('form')
  const input = root.querySelector<HTMLTextAreaElement>('[data-ui-prompt-input]')
  const submit = root.querySelector<HTMLButtonElement>('[data-ui-prompt-send]')
  const stop = root.querySelector<HTMLButtonElement>('[data-ui-prompt-stop]')
  const view = root.ownerDocument.defaultView

  if (!form || !input || !submit || !view) return { destroy: () => undefined, sync: () => undefined }

  const sync = (): void => {
    const pending = root.dataset.pending === 'true'
    const disabled = root.dataset.disabled === 'true'

    input.disabled = disabled

    const limit = input.maxLength > 0 ? input.maxLength : 4000

    submit.disabled = disabled || pending || !canSubmitLumenPrompt(input.value, limit)

    if (stop) {
      stop.hidden = !pending

      stop.disabled = disabled
    }

    form.setAttribute('aria-busy', String(pending))
  }

  const send = (event: Event): void => {
    sync()

    if (submit.disabled) {
      event.preventDefault()

      return
    }

    const detail: LumenPromptSubmitDetail = { text: input.value.trim() }
    const accepted = root.dispatchEvent(new view.CustomEvent('ui:prompt-submit', { bubbles: true, cancelable: true, detail }))

    if (!accepted || !form.hasAttribute('action')) event.preventDefault()
  }

  const keydown = (event: KeyboardEvent): void => {
    if (!isPlainSubmitKey(event)) return

    if (root.dataset.submitOnEnter !== 'true') return

    event.preventDefault()

    sync()

    if (!submit.disabled && form instanceof view.HTMLFormElement) form.requestSubmit(submit)
  }

  const stopRequest = (): void => {
    if (root.dataset.pending !== 'true' || root.dataset.disabled === 'true') return

    root.dispatchEvent(new view.CustomEvent('ui:prompt-stop', { bubbles: true }))
  }

  input.addEventListener('input', sync)

  let resetTimer: number | undefined

  const reset = (event: Event): void => {
    if (resetTimer !== undefined) view.clearTimeout(resetTimer)

    resetTimer = view.setTimeout(() => {
      resetTimer = undefined

      if (!event.defaultPrevented) sync()
    })
  }

  input.addEventListener('keydown', keydown)

  form.addEventListener('submit', send)

  form.addEventListener('reset', reset)

  stop?.addEventListener('click', stopRequest)

  const observer = new view.MutationObserver(sync)

  observer.observe(root, { attributeFilter: ['data-pending', 'data-disabled'], attributes: true })

  sync()

  return {
    destroy: () => {
      observer.disconnect()

      input.removeEventListener('input', sync)

      input.removeEventListener('keydown', keydown)

      form.removeEventListener('submit', send)

      form.removeEventListener('reset', reset)

      if (resetTimer !== undefined) view.clearTimeout(resetTimer)

      stop?.removeEventListener('click', stopRequest)
    },
    sync
  }
}

/** This event requests a decision; the application must still authorize the actual operation. */
export const bindLumenApprovalCard = (root: HTMLElement): (() => void) => {
  const view = root.ownerDocument.defaultView

  if (!view) return () => undefined

  const sync = (): void => {
    const disabled = root.dataset.disabled === 'true' || root.dataset.status !== 'pending' || !root.dataset.requestId

    for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-ui-approval-response]')) {
      if (button.closest('[data-ui-approval-card]') === root) button.disabled = disabled
    }
  }

  const observer = new view.MutationObserver(sync)

  observer.observe(root, { attributeFilter: ['data-disabled', 'data-status', 'data-request-id'], attributes: true })

  sync()

  const click = (event: MouseEvent): void => {
    if (!(event.target instanceof view.Element) || event.defaultPrevented || root.dataset.status !== 'pending') return

    const button = event.target.closest<HTMLButtonElement>('button[data-ui-approval-response]')

    if (!button || button.disabled || button.closest('[data-ui-approval-card]') !== root) return

    const requestId = root.dataset.requestId
    const response = button.dataset.uiApprovalResponse

    if (!requestId || (response !== 'approve' && response !== 'reject')) return

    const detail: LumenApprovalResponseDetail = { requestId, response }

    root.dispatchEvent(new view.CustomEvent('ui:approval-response', { bubbles: true, cancelable: true, detail }))
  }

  root.addEventListener('click', click)

  return () => {
    observer.disconnect()

    root.removeEventListener('click', click)
  }
}

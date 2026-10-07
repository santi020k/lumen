export type LumenAttachmentPreviewState = 'error' | 'loading' | 'ready' | 'unavailable'

export interface LumenAttachmentPreviewLabels {
  error: string
  loading: string
  unavailable: string
}

export const lumenAttachmentPreviewLabels: Readonly<LumenAttachmentPreviewLabels> = {
  error: 'Could not load the preview.',
  loading: 'Loading preview…',
  unavailable: 'A preview is not available for this file.'
}

const isImageContentType = (contentType: unknown): boolean => {
  if (contentType === undefined || contentType === null || contentType === '') return true

  return typeof contentType === 'string' && contentType.trim().toLowerCase().startsWith('image/')
}

export const resolveLumenAttachmentPreviewState = (
  src?: unknown,
  contentType?: unknown,
  state?: LumenAttachmentPreviewState,
  failed = false
): LumenAttachmentPreviewState => {
  if (state === 'loading' || state === 'error' || state === 'unavailable') return state

  if (typeof src !== 'string' || !src.trim() || !isImageContentType(contentType)) return 'unavailable'

  return failed ? 'error' : 'ready'
}

const requestedState = (value: string | null): LumenAttachmentPreviewState | undefined => value === 'error' || value === 'loading' || value === 'ready' || value === 'unavailable' ? value : undefined

export interface LumenAttachmentPreviewController {
  destroy: () => void
  refresh: () => void
}

/** Enhances a browser-owned image; never fetches a file or embeds a document. */
export const createLumenAttachmentPreviewController = (root: HTMLElement): LumenAttachmentPreviewController => {
  const owned = (selector: string): HTMLElement | undefined => Array.from(root.querySelectorAll<HTMLElement>(selector)).find(element => element.closest('[data-ui-attachment-preview]') === root)

  const currentImage = (): HTMLImageElement | undefined => {
    const candidate = owned('[data-ui-attachment-preview-image]')
    const isImage = (element: HTMLElement | undefined): element is HTMLImageElement => element?.namespaceURI === 'http://www.w3.org/1999/xhtml' && element.localName === 'img'

    return isImage(candidate) ? candidate : undefined
  }

  let image = currentImage()
  const abort = new AbortController()
  const cachedFailure = (candidate: HTMLImageElement | undefined): boolean => Boolean(candidate?.getAttribute('src') && candidate.complete && candidate.naturalWidth === 0)
  const attribute = (name: string): string | null => root.getAttribute(name) ?? root.getAttribute(`data-ui-attachment-preview-${name}`)
  let failed = cachedFailure(image)
  let source = image?.getAttribute('src') ?? ''
  let retryKey = attribute('retry-key') ?? ''
  let previous: LumenAttachmentPreviewState | undefined
  let destroyed = false

  const reloadImage = (): void => {
    if (image && source) image.setAttribute('src', source)
  }

  const updateSource = (): void => {
    const nextImage = currentImage()

    if (image !== nextImage) {
      image = nextImage

      failed = cachedFailure(image)
    }

    const nextSource = image?.getAttribute('src') ?? ''
    const nextRetryKey = attribute('retry-key') ?? ''

    if (source === nextSource && retryKey === nextRetryKey) return

    const retry = retryKey !== nextRetryKey

    source = nextSource

    retryKey = nextRetryKey

    failed = !retry && cachedFailure(image)

    if (retry) reloadImage()
  }

  const renderState = (state: LumenAttachmentPreviewState): void => {
    const media = owned('[data-slot="attachment-preview-media"]')
    const message = owned('[data-ui-attachment-preview-message]')

    root.dataset.state = state

    root.setAttribute('aria-busy', String(state === 'loading'))

    if (media) media.hidden = state !== 'ready'

    if (!message) return

    message.hidden = state === 'ready'

    if (state !== 'ready') message.textContent = attribute(`${state}-label`) ?? lumenAttachmentPreviewLabels[state]
  }

  const refresh = (): void => {
    if (destroyed) return

    updateSource()

    const state = resolveLumenAttachmentPreviewState(source, attribute('content-type'), requestedState(attribute('state')), failed)

    renderState(state)

    if (previous !== undefined && previous !== state) {
      const EventConstructor = root.ownerDocument.defaultView?.CustomEvent ?? CustomEvent

      root.dispatchEvent(new EventConstructor('ui:attachment-preview-change', { bubbles: true, detail: { state } }))
    }

    previous = state
  }

  root.addEventListener('error', event => {
    if (!root.isConnected || event.target !== currentImage()) return

    failed = true

    refresh()
  }, { capture: true, signal: abort.signal })

  root.addEventListener('load', event => {
    if (!root.isConnected || event.target !== currentImage()) return

    failed = false

    refresh()
  }, { capture: true, signal: abort.signal })

  const observer = new MutationObserver(records => {
    if (records.some(record => record.type === 'attributes' || Array.from(record.addedNodes).some(node => node.nodeType === 1) || Array.from(record.removedNodes).some(node => node.nodeType === 1))) refresh()
  })

  observer.observe(root, { subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      'src',
      'state',
      'content-type',
      'retry-key',
      'error-label',
      'loading-label',
      'unavailable-label',
      'data-ui-attachment-preview-state',
      'data-ui-attachment-preview-content-type',
      'data-ui-attachment-preview-retry-key',
      'data-ui-attachment-preview-error-label',
      'data-ui-attachment-preview-loading-label',
      'data-ui-attachment-preview-unavailable-label'
    ] })

  refresh()

  return { refresh,
    destroy: () => {
      destroyed = true

      abort.abort()

      observer.disconnect()
    } }
}

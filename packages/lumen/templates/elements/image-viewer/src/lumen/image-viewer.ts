import '@santi020k/lumen-elements/styles/components/button.css'
import '@santi020k/lumen-elements/styles/components/dialog.css'
import '@santi020k/lumen-elements/styles/components/dialog-header.css'
import '@santi020k/lumen-elements/styles/components/dialog-title.css'
import '@santi020k/lumen-elements/styles/components/dialog-body.css'
import '@santi020k/lumen-elements/styles/components/link.css'
import '@santi020k/lumen-elements/styles/components/media-viewport.css'
import './image-viewer.css'

import { defineLumenButton } from '@santi020k/lumen-elements/components/button'
import { defineLumenDialog, defineLumenDialogParts } from '@santi020k/lumen-elements/components/dialog'
import { defineLumenLink } from '@santi020k/lumen-elements/components/link'
import { defineLumenMediaViewport } from '@santi020k/lumen-elements/components/media-viewport'

defineLumenButton()

defineLumenDialog()

defineLumenDialogParts()

defineLumenLink()

defineLumenMediaViewport()

class LumenRecipeImageViewer extends HTMLElement {
  private observer?: MutationObserver
  private connection?: AbortController
  private attempt?: AbortController

  connectedCallback() {
    const dialog = this.querySelector('dialog')
    const status = this.querySelector<HTMLElement>('[data-image-status]')
    const retry = this.querySelector<HTMLElement>('[data-image-retry]')
    const viewport = this.querySelector<HTMLElement>('[data-image-viewport]')
    const mount = this.querySelector<HTMLElement>('[data-image-mount]')
    const template = this.querySelector<HTMLTemplateElement>('[data-image-template]')

    if (!dialog || !status || !retry || !viewport || !mount || !template) return

    this.connection?.abort()

    this.connection = new AbortController()

    const { signal } = this.connection
    let state: 'idle' | 'loading' | 'failed' | 'ready' = 'idle'

    const fail = () => {
      state = 'failed'

      status.textContent = this.dataset.failure ?? ''

      retry.hidden = false
    }

    const load = () => {
      this.attempt?.abort()

      this.attempt = new AbortController()

      const attemptSignal = this.attempt.signal

      state = 'loading'

      status.textContent = this.dataset.loading ?? ''

      retry.hidden = true

      viewport.hidden = true

      const media = document.importNode(template.content, true)
      const image = media.querySelector('img')

      if (!image) {
        fail()

        return
      }

      image.loading = 'eager'

      image.addEventListener('load', () => {
        state = 'ready'

        status.textContent = ''

        viewport.hidden = false
      }, { once: true, signal: attemptSignal })

      image.addEventListener('error', fail, { once: true, signal: attemptSignal })

      mount.replaceChildren(media)
    }

    this.observer = new MutationObserver(() => {
      if (dialog.open && (state === 'idle' || state === 'failed')) load()
      else if (!dialog.open && state === 'loading') {
        this.attempt?.abort()

        state = 'idle'

        mount.replaceChildren()
      }
    })

    this.observer.observe(dialog, { attributes: true, attributeFilter: ['open'] })

    retry.addEventListener('click', () => {
      dialog.querySelector<HTMLElement>('[data-ui-dialog-close]')?.focus()

      load()
    }, { signal })

    if (dialog.open) load()

    this.dataset.imageViewerReady = ''

    this.querySelector<HTMLElement>('.image-viewer-trigger')?.removeAttribute('hidden')
  }

  disconnectedCallback() {
    this.observer?.disconnect()

    this.connection?.abort()

    this.attempt?.abort()

    this.querySelector('dialog')?.close()

    this.removeAttribute('data-image-viewer-ready')
  }
}

if (!customElements.get('lumen-recipe-elements-image-viewer')) {
  customElements.define('lumen-recipe-elements-image-viewer', LumenRecipeImageViewer)
}

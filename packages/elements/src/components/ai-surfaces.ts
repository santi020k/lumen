import { bindLumenApprovalCard, createLumenPromptComposerController, normalizeLumenPromptLimit, resolveLumenCitationHref } from '@santi020k/lumen-core'

import { LumenElement, type LumenElementConfig } from '../element-base.js'

const node = <K extends keyof HTMLElementTagNameMap>(root: HTMLElement, tag: K, className = ''): HTMLElementTagNameMap[K] => {
  const element = root.ownerDocument.createElement(tag)

  element.className = className

  return element
}

const booleanAttribute = (root: HTMLElement, name: string): boolean => root.hasAttribute(name) && root.getAttribute(name) !== 'false'
const approvalDisabled = (root: HTMLElement): boolean => booleanAttribute(root, 'disabled') || root.dataset.status !== 'pending' || !root.dataset.requestId

abstract class LumenAiSurfaceElement extends LumenElement {
  protected cleanup: (() => void) | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    queueMicrotask(() => {
      if (this.isConnected) this.render()
    })
  }

  override disconnectedCallback(): void {
    this.cleanup?.()

    this.cleanup = undefined
  }

  override attributeChangedCallback(): void {
    super.attributeChangedCallback()

    if (this.isConnected) this.render()
  }

  protected abstract render(): void
}

export const lumenPromptComposerElementConfig = {
  baseClassName: 'ui-prompt-composer',
  defaults: { 'data-ui-prompt-composer': '' },
  observedAttributes: ['action', 'disabled', 'label', 'max-length', 'pending', 'send-label', 'stop-label', 'submit-on-enter', 'value'],
  tagName: 'lumen-prompt-composer'
} as const satisfies LumenElementConfig

export class LumenPromptComposerElement extends LumenAiSurfaceElement {
  static override config = lumenPromptComposerElementConfig
  private form: HTMLFormElement | undefined
  private input: HTMLTextAreaElement | undefined
  private label: HTMLLabelElement | undefined
  private send: HTMLButtonElement | undefined
  private stop: HTMLButtonElement | undefined

  get value(): string {
    return this.input?.value ?? this.getAttribute('value') ?? ''
  }

  set value(value: string) {
    this.setAttribute('value', value)
  }

  override attributeChangedCallback(name?: string): void {
    super.attributeChangedCallback()

    if (name === 'value' && this.input) {
      this.input.defaultValue = this.getAttribute('value') ?? ''

      this.input.value = this.input.defaultValue
    }
  }

  protected override render(): void {
    if (!this.form) this.create()

    const elements = this.elements()

    if (!elements) return

    const { form, input, label, send, stop } = elements

    this.cleanup?.()

    this.dataset.pending = String(booleanAttribute(this, 'pending'))

    this.dataset.disabled = String(booleanAttribute(this, 'disabled'))

    this.dataset.submitOnEnter = String(booleanAttribute(this, 'submit-on-enter'))

    const action = this.getAttribute('action')

    if (action !== null) form.setAttribute('action', action)
    else form.removeAttribute('action')

    input.maxLength = normalizeLumenPromptLimit(Number(this.getAttribute('max-length')))

    label.textContent = this.getAttribute('label') ?? 'Message'

    send.textContent = this.getAttribute('send-label') ?? 'Send'

    stop.textContent = this.getAttribute('stop-label') ?? 'Stop'

    const controller = createLumenPromptComposerController(this)

    this.cleanup = () => {
      controller.destroy()
    }
  }

  private elements() {
    if (!this.form || !this.input || !this.label || !this.send || !this.stop) return undefined

    return { form: this.form, input: this.input, label: this.label, send: this.send, stop: this.stop }
  }

  private create(): void {
    const children = [...this.childNodes]

    this.form = node(this, 'form', 'ui-form')

    this.form.method = 'post'

    this.label = node(this, 'label', 'ui-label')

    this.input = node(this, 'textarea', 'ui-textarea')

    this.input.id = `prompt-${this.ownerDocument.defaultView?.crypto.randomUUID() ?? crypto.randomUUID()}`

    this.input.rows = 3

    this.input.defaultValue = this.getAttribute('value') ?? ''

    this.input.required = true

    this.input.name = 'prompt'

    this.input.dataset.uiPromptInput = ''

    this.label.htmlFor = this.input.id

    this.send = node(this, 'button', 'ui-button')

    this.send.type = 'submit'

    this.send.dataset.uiPromptSend = ''

    this.stop = node(this, 'button', 'ui-button ui-button--secondary')

    this.stop.type = 'button'

    this.stop.dataset.uiPromptStop = ''

    const actions = node(this, 'div', 'ui-prompt-composer__actions')

    actions.append(this.send, this.stop)

    this.form.append(this.label, this.input, actions, ...children)

    this.append(this.form)
  }
}

export const lumenStreamMessageElementConfig = {
  baseClassName: 'ui-stream-message ui-message ui-message--assistant',
  observedAttributes: ['label', 'status', 'status-label', 'text'],
  role: 'article',
  tagName: 'lumen-stream-message'
} as const satisfies LumenElementConfig

export class LumenStreamMessageElement extends LumenAiSurfaceElement {
  static override config = lumenStreamMessageElementConfig
  private content: HTMLDivElement | undefined
  private statusText: HTMLSpanElement | undefined

  get text(): string {
    return this.content?.textContent ?? this.getAttribute('text') ?? ''
  }

  set text(value: string) {
    this.setAttribute('text', value)
  }

  protected override render(): void {
    if (!this.content) {
      const children = [...this.childNodes]
      const actions = this.querySelector('[slot="actions"]')
      const sources = this.querySelector('[slot="sources"]')

      this.content = node(this, 'div', 'ui-prose')

      this.content.dataset.uiStreamContent = ''

      this.content.setAttribute('aria-live', 'off')

      this.statusText = node(this, 'span')

      this.statusText.setAttribute('role', 'status')

      this.statusText.setAttribute('aria-live', 'polite')

      const footer = node(this, 'div', 'ui-stream-message__actions')

      footer.append(this.statusText)

      if (actions) footer.append(actions)

      this.content.append(...children.filter(child => child !== actions && child !== sources))

      this.append(this.content, footer)

      if (sources) this.append(sources)
    }

    this.dataset.status = this.getAttribute('status') ?? 'idle'

    this.setAttribute('aria-label', this.getAttribute('label') ?? 'Assistant')

    this.content.setAttribute('aria-busy', String(this.dataset.status === 'streaming'))

    if (this.hasAttribute('text')) this.content.textContent = this.getAttribute('text') ?? ''

    if (this.statusText) this.statusText.textContent = this.getAttribute('status-label') ?? 'Ready'
  }
}

export const lumenSourceCitationElementConfig = {
  baseClassName: 'ui-source-citation',
  observedAttributes: ['href', 'label', 'target'],
  tagName: 'lumen-source-citation'
} as const satisfies LumenElementConfig

export class LumenSourceCitationElement extends LumenAiSurfaceElement {
  static override config = lumenSourceCitationElementConfig

  protected override render(): void {
    const href = resolveLumenCitationHref(this.getAttribute('href') ?? '')
    const label = this.getAttribute('label') ?? 'Source'

    if (href) {
      const anchor = node(this, 'a', 'ui-link')

      anchor.href = href

      anchor.rel = 'noopener noreferrer'

      anchor.target = this.getAttribute('target') === '_blank' ? '_blank' : '_self'

      anchor.textContent = label

      this.replaceChildren(anchor)
    } else this.textContent = label
  }
}

export const lumenToolActivityElementConfig = {
  baseClassName: 'ui-tool-activity',
  observedAttributes: ['label', 'open', 'status', 'status-label'],
  tagName: 'lumen-tool-activity'
} as const satisfies LumenElementConfig

export class LumenToolActivityElement extends LumenAiSurfaceElement {
  static override config = lumenToolActivityElementConfig
  private details: HTMLDetailsElement | undefined
  private summary: HTMLElement | undefined
  private statusText: HTMLSpanElement | undefined

  protected override render(): void {
    if (!this.details) this.create()

    if (!this.details || !this.summary || !this.statusText) return

    this.details.open = this.hasAttribute('open')

    this.summary.textContent = this.getAttribute('label') ?? 'Tool activity'

    this.statusText.textContent = this.getAttribute('status-label') ?? 'Queued'

    this.dataset.status = this.getAttribute('status') ?? 'queued'

    this.cleanup?.()

    const toggle = (): void => {
      this.toggleAttribute('open', this.details?.open ?? false)
    }

    this.details.addEventListener('toggle', toggle)

    this.cleanup = () => {
      this.details?.removeEventListener('toggle', toggle)
    }
  }

  private create(): void {
    const children = [...this.childNodes]

    this.details = node(this, 'details', 'ui-collapsible')

    this.summary = node(this, 'summary')

    this.statusText = node(this, 'span')

    this.statusText.setAttribute('role', 'status')

    this.details.append(this.summary, this.statusText, ...children)

    this.append(this.details)
  }
}

const approvalStatusLabel = (root: HTMLElement): string => root.getAttribute('status-label') ?? `Decision: ${root.getAttribute('status') ?? 'pending'}`

export const lumenApprovalCardElementConfig = {
  baseClassName: 'ui-approval-card ui-card',
  defaults: { 'data-ui-approval-card': '' },
  observedAttributes: ['approve-label', 'disabled', 'label', 'reject-label', 'request-id', 'status', 'status-label'],
  role: 'group',
  tagName: 'lumen-approval-card'
} as const satisfies LumenElementConfig

export class LumenApprovalCardElement extends LumenAiSurfaceElement {
  static override config = lumenApprovalCardElementConfig
  private titleElement: HTMLElement | undefined
  private statusText: HTMLSpanElement | undefined
  private approve: HTMLButtonElement | undefined
  private reject: HTMLButtonElement | undefined

  protected override render(): void {
    if (!this.titleElement) this.create()

    const elements = this.elements()

    if (!elements) return

    const { title, statusText, approve, reject } = elements

    title.textContent = this.getAttribute('label') ?? 'Review action'

    this.setAttribute('aria-label', title.textContent)

    statusText.textContent = approvalStatusLabel(this)

    this.dataset.requestId = this.getAttribute('request-id') ?? ''

    this.dataset.status = this.getAttribute('status') ?? 'pending'

    this.dataset.disabled = String(booleanAttribute(this, 'disabled'))

    const disabled = approvalDisabled(this)

    approve.disabled = disabled

    reject.disabled = disabled

    approve.textContent = this.getAttribute('approve-label') ?? 'Approve'

    reject.textContent = this.getAttribute('reject-label') ?? 'Reject'

    this.cleanup?.()

    this.cleanup = bindLumenApprovalCard(this)
  }

  private elements() {
    if (!this.titleElement || !this.statusText || !this.approve || !this.reject) return undefined

    return { title: this.titleElement, statusText: this.statusText, approve: this.approve, reject: this.reject }
  }

  private create(): void {
    const children = [...this.childNodes]

    this.titleElement = node(this, 'strong')

    this.statusText = node(this, 'span')

    this.statusText.setAttribute('role', 'status')

    this.approve = node(this, 'button', 'ui-button')

    this.approve.type = 'button'

    this.approve.dataset.uiApprovalResponse = 'approve'

    this.reject = node(this, 'button', 'ui-button ui-button--secondary')

    this.reject.type = 'button'

    this.reject.dataset.uiApprovalResponse = 'reject'

    const actions = node(this, 'div', 'ui-approval-card__actions')

    actions.append(this.approve, this.reject)

    this.append(this.titleElement, ...children, this.statusText, actions)
  }
}

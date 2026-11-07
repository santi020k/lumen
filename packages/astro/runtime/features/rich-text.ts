import { executeLumenRichTextCommand, getLumenRichTextShortcut, isLumenRichTextToggleCommand, type LumenRichTextChangeDetail, type LumenRichTextCommandDetail } from '@santi020k/lumen-core'

import { queryScope } from '../scope.js'

interface RichTextCommandDocument {
  execCommand?: (command: string, showUi?: boolean, value?: string) => boolean
  queryCommandState?: (command: string) => boolean
  queryCommandValue?: (command: string) => string
}

const richTextEditorContentSelector = '[data-ui-rich-text-editable], [contenteditable="true"]'

const getRichTextCommandValue = (control: HTMLElement): string | undefined => {
  if (control.dataset.uiEditorValue !== undefined) return control.dataset.uiEditorValue

  if (
    control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement ||
    control instanceof HTMLTextAreaElement
  ) return control.value

  return undefined
}

const syncRichTextControl = (control: HTMLElement): void => {
  const commandDocument: RichTextCommandDocument = document
  const command = control.dataset.uiEditorCommand ?? ''
  const value = getRichTextCommandValue(control)
  let active = false

  if (isLumenRichTextToggleCommand(command)) {
    active = commandDocument.queryCommandState?.(command) ?? false

    control.setAttribute('aria-pressed', String(active))
  } else if (command === 'formatBlock' && value) {
    const currentValue = commandDocument.queryCommandValue?.(command)
      .replaceAll(/[<>]/g, '')
      .toLowerCase()

    active = currentValue === value.replaceAll(/[<>]/g, '').toLowerCase()
  }

  control.dataset.state = active ? 'on' : 'off'
}

const syncRichTextCommandStates = (root: HTMLElement): void => {
  if (root.dataset.uiEditorNativeState === 'false') return

  for (const control of root.querySelectorAll<HTMLElement>('[data-ui-editor-command]')) syncRichTextControl(control)
}

const dispatchRichTextChange = (root: HTMLElement): void => {
  const editable = root.querySelector<HTMLElement>(richTextEditorContentSelector)

  if (!editable) return

  const detail: LumenRichTextChangeDetail = {
    html: editable.innerHTML,
    text: editable.textContent
  }

  root.dispatchEvent(new CustomEvent<LumenRichTextChangeDetail>('ui:editor-change', {
    bubbles: true,
    detail
  }))
}

const executeRichTextCommand = (
  root: HTMLElement,
  command: string,
  value?: string
): boolean => {
  if (!command) return false

  const commandDocument: RichTextCommandDocument = document

  const executed = executeLumenRichTextCommand(root, { command, ...(value === undefined ? {} : { value }) }, () => {
    if (typeof commandDocument.execCommand !== 'function') return false

    return value === undefined ?
      commandDocument.execCommand(command) :
      commandDocument.execCommand(command, false, value)
  })

  const detail: LumenRichTextCommandDetail = {
    command,
    executed,
    ...(value === undefined ? {} : { value })
  }

  root.dispatchEvent(new CustomEvent<LumenRichTextCommandDetail>('ui:editor-command', {
    bubbles: true,
    detail
  }))

  syncRichTextCommandStates(root)

  dispatchRichTextChange(root)

  return executed
}

const bindRichTextEditors = (root: HTMLElement): void => {
  if (root.dataset.uiBound === 'true') return

  root.dataset.uiBound = 'true'

  for (const control of root.querySelectorAll<HTMLElement>('[data-ui-editor-command]')) {
    const execute = () => {
      executeRichTextCommand(
        root, control.dataset.uiEditorCommand ?? '', getRichTextCommandValue(control)
      )
    }

    if (control instanceof HTMLSelectElement) control.addEventListener('change', execute)
    else control.addEventListener('click', execute)
  }

  root.addEventListener('keydown', event => {
    if (!(event.target instanceof HTMLElement) ||
      !event.target.closest(richTextEditorContentSelector)) return

    const command = getLumenRichTextShortcut(event)

    if (!command) return

    event.preventDefault()

    executeRichTextCommand(root, command)
  })

  root.addEventListener('input', event => {
    if (!(event.target instanceof HTMLElement) ||
      !event.target.closest(richTextEditorContentSelector)) return

    syncRichTextCommandStates(root)

    dispatchRichTextChange(root)
  })

  root.addEventListener('keyup', () => {
    syncRichTextCommandStates(root)
  })

  root.addEventListener('mouseup', () => {
    syncRichTextCommandStates(root)
  })

  syncRichTextCommandStates(root)
}

export const initRichTextEditors = (scope: ParentNode): void => {
  for (const root of queryScope(scope, '[data-ui-rich-text-editor]')) bindRichTextEditors(root)
}

import type { ComponentPropsWithRef, JSX, RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'

import {
  executeLumenRichTextCommand,
  getLumenRichTextShortcut,
  isLumenRichTextToggleCommand,
  type LumenRichTextChangeDetail,
  type LumenRichTextCommandDetail as CoreRichTextCommandDetail,
  type LumenRichTextCommandRequest
} from '@santi020k/lumen-core'

type ChangeHandler<T> = (value: T) => void

type LumenProps<Tag extends keyof JSX.IntrinsicElements> = ComponentPropsWithRef<Tag> & Record<`data-${string}`, unknown>

interface RichTextCommandDocument {
  execCommand?: (command: string, showUi?: boolean, value?: string) => boolean
  queryCommandState?: (command: string) => boolean
  queryCommandValue?: (command: string) => string
}

export type RichTextEditorCommandDetail = CoreRichTextCommandDetail

export interface RichTextEditorOptions {
  nativeState?: boolean
  commandHandler?: (request: LumenRichTextCommandRequest) => boolean
  onChange?: ChangeHandler<LumenRichTextChangeDetail> | undefined
  onCommand?: ChangeHandler<RichTextEditorCommandDetail> | undefined
}

export interface RichTextEditorController {
  executeCommand: (
    command: string,
    root?: HTMLElement | null,
    value?: string
  ) => boolean
  getCommandProps: (
    command: string,
    props?: LumenProps<'button'>
  ) => LumenProps<'button'>
  getEditableProps: (props?: ComponentPropsWithRef<'div'>) => LumenProps<'div'>
  rootProps: LumenProps<'section'>
  rootRef: RefObject<HTMLElement | null>
}

const composeHandlers =
  <Event extends { defaultPrevented: boolean },>(
    userHandler: ((event: Event) => void) | undefined,
    lumenHandler: (event: Event) => void
  ) => (event: Event) => {
    userHandler?.(event)

    if (!event.defaultPrevented) lumenHandler(event)
  }

const getCommandState = (control: HTMLElement, commandDocument: RichTextCommandDocument): boolean => {
  const command = control.dataset.uiEditorCommand ?? ''
  const value = control.dataset.uiEditorValue
  let active = false

  if (isLumenRichTextToggleCommand(command)) {
    active = commandDocument.queryCommandState?.(command) ?? false

    control.setAttribute('aria-pressed', String(active))
  } else if (command === 'formatBlock' && value) {
    const currentValue = commandDocument
      .queryCommandValue?.(command)
      .replaceAll(/[<>]/g, '')
      .toLowerCase()

    active = currentValue === value.replaceAll(/[<>]/g, '').toLowerCase()
  }

  return active
}

const richTextEditorContentSelector =
  '[data-ui-rich-text-editable], [contenteditable="true"]'

const getRichTextChangeDetail = (
  root: HTMLElement | null
): LumenRichTextChangeDetail | null => {
  const editable = root?.querySelector<HTMLElement>(
    richTextEditorContentSelector
  )

  if (!editable) return null

  return {
    html: editable.innerHTML,
    text: editable.textContent
  }
}

const executeRichTextDocumentCommand = (
  commandDocument: RichTextCommandDocument | undefined,
  command: string,
  value?: string
): boolean => {
  if (typeof commandDocument?.execCommand !== 'function') return false

  return value === undefined ?
    commandDocument.execCommand(command) :
    commandDocument.execCommand(command, false, value)
}

const syncRichTextCommandStates = (root: HTMLElement | null): void => {
  if (!root || root.dataset.uiEditorNativeState === 'false') return

  const commandDocument: RichTextCommandDocument = root.ownerDocument

  for (const control of root.querySelectorAll<HTMLElement>(
    '[data-ui-editor-command]'
  )) {
    const active = getCommandState(control, commandDocument)

    control.dataset.state = active ? 'on' : 'off'
  }
}

const getRichTextCommandDocument = (root: HTMLElement | null): Document | undefined => {
  if (root) return root.ownerDocument

  return typeof document === 'undefined' ? undefined : document
}

export const useRichTextEditor = ({
  commandHandler,
  nativeState = !commandHandler,
  onChange,
  onCommand
}: RichTextEditorOptions = {}): RichTextEditorController => {
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    syncRichTextCommandStates(rootRef.current)
  }, [nativeState])

  const emitChange = useCallback(
    (root: HTMLElement | null) => {
      const detail = getRichTextChangeDetail(root)

      if (!detail) return

      if (typeof CustomEvent !== 'undefined') {
        root?.dispatchEvent(
          new CustomEvent<LumenRichTextChangeDetail>('ui:editor-change', {
            bubbles: true,
            detail
          })
        )
      }

      onChange?.(detail)
    }, [onChange]
  )

  const executeCommand = useCallback<
    RichTextEditorController['executeCommand']
  >(
    (command, root = rootRef.current, value) => {
      if (!command) return false

      const commandDocument = getRichTextCommandDocument(root)
      const request: LumenRichTextCommandRequest = { command, ...(value === undefined ? {} : { value }) }
      const fallback = () => executeRichTextDocumentCommand(commandDocument, command, value)
      const executed = executeLumenRichTextCommand(root, request, fallback, commandHandler)

      const detail: RichTextEditorCommandDetail = {
        command,
        executed,
        ...(value === undefined ? {} : { value })
      }

      if (root && typeof CustomEvent !== 'undefined') {
        root.dispatchEvent(
          new CustomEvent<RichTextEditorCommandDetail>('ui:editor-command', {
            bubbles: true,
            detail
          })
        )
      }

      onCommand?.(detail)

      syncRichTextCommandStates(root)

      emitChange(root)

      return executed
    }, [commandHandler, emitChange, onCommand]
  )

  const getCommandProps = useCallback<
    RichTextEditorController['getCommandProps']
  >(
    (command, props = {}) => ({
      ...props,
      'data-ui-editor-command': command,
      onClick: composeHandlers(props.onClick, event => {
        const root =
          event.currentTarget.closest<HTMLElement>(
            '[data-ui-rich-text-editor]'
          ) ?? rootRef.current

        executeCommand(
          command, root, event.currentTarget.dataset.uiEditorValue
        )
      }),
      type: props.type ?? 'button'
    }), [executeCommand]
  )

  const getEditableProps = useCallback<
    RichTextEditorController['getEditableProps']
  >(
    (props = {}) => ({
      ...props,
      'aria-multiline': props['aria-multiline'] ?? true,
      contentEditable: props.contentEditable ?? true,
      'data-ui-rich-text-editable': true,
      onInput: composeHandlers(props.onInput, event => {
        const root =
          event.currentTarget.closest<HTMLElement>(
            '[data-ui-rich-text-editor]'
          ) ?? rootRef.current

        syncRichTextCommandStates(root)

        emitChange(root)
      }),
      onKeyDown: composeHandlers(props.onKeyDown, event => {
        const command = getLumenRichTextShortcut(event)

        if (!command) return

        event.preventDefault()

        const root =
          event.currentTarget.closest<HTMLElement>(
            '[data-ui-rich-text-editor]'
          ) ?? rootRef.current

        executeCommand(command, root)
      }),
      onKeyUp: composeHandlers(props.onKeyUp, event => {
        syncRichTextCommandStates(
          event.currentTarget.closest<HTMLElement>(
            '[data-ui-rich-text-editor]'
          ) ?? rootRef.current
        )
      }),
      onMouseUp: composeHandlers(props.onMouseUp, event => {
        syncRichTextCommandStates(
          event.currentTarget.closest<HTMLElement>(
            '[data-ui-rich-text-editor]'
          ) ?? rootRef.current
        )
      }),
      role: props.role ?? 'textbox',
      suppressContentEditableWarning:
        props.suppressContentEditableWarning ?? true
    }), [emitChange, executeCommand]
  )

  return {
    executeCommand,
    getCommandProps,
    getEditableProps,
    rootProps: {
      'data-ui-rich-text-editor': true,
      'data-ui-editor-native-state': String(nativeState),
      ref: rootRef
    },
    rootRef
  }
}

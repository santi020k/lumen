export const lumenRichTextToggleCommands = Object.freeze([
  'bold',
  'italic',
  'strikeThrough',
  'subscript',
  'superscript',
  'underline',
  'insertOrderedList',
  'insertUnorderedList'
] as const)

export type LumenRichTextToggleCommand = typeof lumenRichTextToggleCommands[number]

export interface LumenRichTextCommandDetail {
  command: string
  executed: boolean
  value?: string
}

export interface LumenRichTextCommandRequest {
  command: string
  value?: string
}

export type LumenRichTextCommandRequestEvent = CustomEvent<LumenRichTextCommandDetail>

/** A canceled request belongs to the external engine, including unsuccessful commands. */
export const executeLumenRichTextCommand = (
  root: HTMLElement | null,
  request: LumenRichTextCommandRequest,
  fallback: () => boolean,
  commandHandler?: (request: LumenRichTextCommandRequest) => boolean
): boolean => {
  const detail: LumenRichTextCommandDetail = { ...request, executed: false }

  const event = typeof CustomEvent === 'undefined' ?
    undefined :
    new CustomEvent<LumenRichTextCommandDetail>(
      'ui:editor-command-request', { bubbles: true, cancelable: true, detail }
    )

  if (event && root) {
    root.dispatchEvent(event)

    if (event.defaultPrevented) return detail.executed
  }

  return commandHandler ? commandHandler(request) : fallback()
}

export interface LumenRichTextChangeDetail {
  html: string
  text: string
}

export interface LumenRichTextShortcutEvent {
  altKey: boolean
  code?: string
  ctrlKey: boolean
  key: string
  metaKey: boolean
  shiftKey: boolean
}

const toggleCommands = new Set<string>(lumenRichTextToggleCommands)

const shortcuts: Readonly<Record<string, string>> = {
  b: 'bold',
  i: 'italic',
  u: 'underline',
  z: 'undo'
}

const shiftedKeyShortcuts: Readonly<Record<string, string>> = {
  x: 'strikeThrough',
  z: 'redo'
}

// Shift changes the character a digit key produces (e.g. "&" or "*" on a US
// layout), so the list shortcuts must match the physical key via `code`
// rather than the layout-dependent shifted glyph in `key`.
const shiftedCodeShortcuts: Readonly<Record<string, string>> = {
  Digit7: 'insertOrderedList',
  Digit8: 'insertUnorderedList'
}

export const isLumenRichTextToggleCommand = (
  command: string
): command is LumenRichTextToggleCommand => toggleCommands.has(command)

export const getLumenRichTextShortcut = (
  event: LumenRichTextShortcutEvent
): string | undefined => {
  if ((!event.ctrlKey && !event.metaKey) || event.altKey) return undefined

  const key = event.key.toLowerCase()

  if (!event.shiftKey) return shortcuts[key]

  return (event.code ? shiftedCodeShortcuts[event.code] : undefined) ?? shiftedKeyShortcuts[key]
}

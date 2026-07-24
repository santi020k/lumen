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

export interface LumenRichTextChangeDetail {
  html: string
  text: string
}

export interface LumenRichTextShortcutEvent {
  altKey: boolean
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

const shiftedShortcuts: Readonly<Record<string, string>> = {
  7: 'insertOrderedList',
  8: 'insertUnorderedList',
  x: 'strikeThrough',
  z: 'redo'
}

export const isLumenRichTextToggleCommand = (
  command: string
): command is LumenRichTextToggleCommand => toggleCommands.has(command)

export const getLumenRichTextShortcut = (
  event: LumenRichTextShortcutEvent
): string | undefined => {
  if ((!event.ctrlKey && !event.metaKey) || event.altKey) return undefined

  const key = event.key.toLowerCase()

  return event.shiftKey ? shiftedShortcuts[key] : shortcuts[key]
}

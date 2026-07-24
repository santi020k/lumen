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

export const isLumenRichTextToggleCommand = (
  command: string
): command is LumenRichTextToggleCommand => toggleCommands.has(command)

export const getLumenRichTextShortcut = (
  event: LumenRichTextShortcutEvent
): string | undefined => {
  if ((!event.ctrlKey && !event.metaKey) || event.altKey) return undefined

  const key = event.key.toLowerCase()

  if (event.shiftKey) {
    if (key === '7') return 'insertOrderedList'
    if (key === '8') return 'insertUnorderedList'
    if (key === 'x') return 'strikeThrough'
    if (key === 'z') return 'redo'

    return undefined
  }

  if (key === 'b') return 'bold'
  if (key === 'i') return 'italic'
  if (key === 'u') return 'underline'
  if (key === 'z') return 'undo'

  return undefined
}

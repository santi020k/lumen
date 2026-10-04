export type LumenRichTextFormat = 'bold' | 'italic' | 'underline'

interface LumenRichTextSpan { start: number, end: number, format: LumenRichTextFormat }

export interface LumenRichTextDocument { text: string, spans: readonly LumenRichTextSpan[] }
export interface LumenRichTextSelection { start: number, end: number }

export const normalizeLumenRichTextSelection = (
  text: string, selection: LumenRichTextSelection
): LumenRichTextSelection => {
  const limit = (value: number): number => {
    if (!Number.isFinite(value)) return 0

    return Math.max(0, Math.min(text.length, Math.trunc(value)))
  }

  const start = limit(selection.start)
  const end = limit(selection.end)

  return { start: Math.min(start, end), end: Math.max(start, end) }
}

export const toggleLumenRichTextFormat = (
  document: LumenRichTextDocument, selection: LumenRichTextSelection, format: LumenRichTextFormat
): LumenRichTextDocument => {
  const range = normalizeLumenRichTextSelection(document.text, selection)

  if (range.start === range.end) return document

  const coverage = new Uint8Array(document.text.length)

  for (const span of document.spans) {
    if (span.format === format) coverage.fill(1, Math.max(0, span.start), Math.min(document.text.length, span.end))
  }

  const active = coverage.subarray(range.start, range.end).every(value => value === 1)

  coverage.fill(active ? 0 : 1, range.start, range.end)

  const spans: LumenRichTextSpan[] = document.spans.filter(span => span.format !== format)
  let start = -1

  for (let index = 0; index <= coverage.length; index += 1) {
    if (coverage[index] === 1 && start < 0) start = index

    if (coverage[index] !== 1 && start >= 0) {
      spans.push({ start, end: index, format })

      start = -1
    }
  }

  return { text: document.text, spans }
}

/** Preserve spans around a single native replacement, including IME edits and pasted text. */
export const replaceLumenRichText = (document: LumenRichTextDocument, text: string): LumenRichTextDocument => {
  let start = 0

  while (start < document.text.length && start < text.length && document.text[start] === text[start]) start += 1

  let oldEnd = document.text.length
  let newEnd = text.length

  while (oldEnd > start && newEnd > start && document.text[oldEnd - 1] === text[newEnd - 1]) {
    oldEnd -= 1

    newEnd -= 1
  }

  const delta = newEnd - oldEnd

  const spans = document.spans.flatMap(span => {
    let from = start
    let to = newEnd

    if (span.start < start) from = span.start
    else if (span.start >= oldEnd) from = span.start + delta

    if (span.end <= start) to = span.end
    else if (span.end >= oldEnd) to = span.end + delta

    return to > from ? [{ ...span, start: from, end: to }] : []
  })

  return { text, spans }
}

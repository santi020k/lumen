import { describe, expect, test } from 'vitest'

import { normalizeLumenRichTextSelection, replaceLumenRichText, toggleLumenRichTextFormat } from './rich-text-recipes.js'

describe('portable rich text edits', () => {
  test('formats only the selection and preserves overlapping formats', () => {
    const original = { text: 'hello world', spans: [{ start: 0, end: 5, format: 'italic' as const }] }
    const bold = toggleLumenRichTextFormat(original, { start: 1, end: 4 }, 'bold')
    expect(bold.spans).toEqual([...original.spans, { start: 1, end: 4, format: 'bold' }])
    expect(toggleLumenRichTextFormat(bold, { start: 2, end: 3 }, 'bold').spans).toEqual([
      ...original.spans, { start: 1, end: 2, format: 'bold' }, { start: 3, end: 4, format: 'bold' }
    ])
    expect(original.spans).toHaveLength(1)
  })
  test('does not rewrite the document for a caret and clamps reversed invalid ranges', () => {
    const document = { text: 'abc', spans: [] }
    expect(toggleLumenRichTextFormat(document, { start: 1, end: 1 }, 'bold')).toBe(document)
    expect(normalizeLumenRichTextSelection('abc', { start: 9, end: -2 })).toEqual({ start: 0, end: 3 })
    expect(normalizeLumenRichTextSelection('abc', { start: NaN, end: Infinity })).toEqual({ start: 0, end: 0 })
  })
  test('preserves formatting across insertion, deletion, emoji and replacement', () => {
    const document = { text: 'ab😀cd', spans: [{ start: 2, end: 4, format: 'bold' as const }] }
    expect(replaceLumenRichText(document, 'xab😀cd').spans).toEqual([{ start: 3, end: 5, format: 'bold' }])
    expect(replaceLumenRichText(document, 'abcd').spans).toEqual([])
    expect(replaceLumenRichText(document, 'abOKcd').spans).toEqual([{ start: 2, end: 4, format: 'bold' }])
  })
})

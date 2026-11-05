import { expect, test } from 'vitest'

import { ArchiveArrowUp, ArchiveRestore, Bold, EighthNote, Heading, LetterB, LetterH, Music2 } from './icon-data.generated.js'

test('legacy static icon imports retain their renamed definitions', () => {
  expect(ArchiveRestore).toBe(ArchiveArrowUp)
  expect(Bold).toBe(LetterB)
  expect(Heading).toBe(LetterH)
  expect(Music2).toBe(EighthNote)
})

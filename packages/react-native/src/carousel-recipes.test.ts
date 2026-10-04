import { expect, test } from 'vitest'

import { lumenCarouselTarget, resolveLumenCarousel } from './carousel-recipes.js'

const slides = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]

test('resolves bounded navigation without wrapping or rewriting host selection', () => {
  const first = resolveLumenCarousel(slides, 0)
  expect(first).toEqual({ status: 'ready', count: 3, index: 0, previous: null, next: 1 })
  expect(lumenCarouselTarget(first, -1)).toBeNull()
  expect(lumenCarouselTarget(first, 1)).toBe(1)
  expect(lumenCarouselTarget(first, 0)).toBeNull()
  expect(resolveLumenCarousel(slides, 2)).toEqual({ status: 'ready', count: 3, index: 2, previous: 1, next: null })
  expect(lumenCarouselTarget(first, 3)).toBeNull()
})
test('rejects duplicate and empty IDs and invalid indices, preserving order', () => {
  expect(resolveLumenCarousel([], 0)).toEqual({ status: 'empty' })
  for (const index of [-1, 3, 0.5, Number.NaN, Infinity]) expect(resolveLumenCarousel(slides, index)).toEqual({ status: 'invalid' })
  expect(resolveLumenCarousel([slides[0] ?? { id: '', label: '' }, { id: 'a', label: 'Duplicate' }], 0).status).toBe('invalid')
  expect(resolveLumenCarousel([{ id: '', label: 'Empty' }], 0).status).toBe('invalid')
  expect(resolveLumenCarousel([{ id: 'a|b', label: 'A' }, { id: 'b', label: 'B' }], 1).status).toBe('ready')
  expect(slides.map(slide => slide.id)).toEqual(['a', 'b', 'c'])
})

import { expect, test } from 'vitest'

import {
  applyLumenMediaViewportAction,
  moveLumenMediaItem,
  normalizeLumenMediaViewport,
  panLumenMediaViewport,
  resolveLumenMediaSelection,
  toggleLumenMediaSelection
} from './media-workspace.js'

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c', disabled: true }]

test('moves stable identities without mutating items or their metadata', () => {
  const moved = moveLumenMediaItem(items, 'a', 2)

  expect(moved.map(item => item.id)).toEqual(['b', 'c', 'a'])
  expect(moved[2]).toBe(items[0])
  expect(items.map(item => item.id)).toEqual(['a', 'b', 'c'])
})

test.each([-1, 3, 0.5, NaN, Infinity])('ignores invalid move destination %s', target => {
  expect(moveLumenMediaItem(items, 'a', target)).toEqual(items)
})

test('ignores stale and disabled move requests, including an empty collection', () => {
  expect(moveLumenMediaItem(items, 'missing', 0)).toEqual(items)
  expect(moveLumenMediaItem(items, 'c', 0)).toEqual(items)
  expect(moveLumenMediaItem([], 'a', 0)).toEqual([])
})

test('rejects ambiguous identities instead of selecting or moving the wrong item', () => {
  expect(() => moveLumenMediaItem([{ id: 'a' }, { id: 'a' }], 'a', 0)).toThrow('unique IDs')
  expect(() => resolveLumenMediaSelection([{ id: ' ' }], [])).toThrow('nonempty')
})

test('resolves selection in displayed order, pruning unavailable and duplicate IDs', () => {
  expect(resolveLumenMediaSelection(items, ['b', 'a', 'a', 'missing'])).toEqual(['a', 'b'])
  expect(toggleLumenMediaSelection(items, ['a'], 'b')).toEqual(['a', 'b'])
  expect(toggleLumenMediaSelection(items, ['a', 'b'], 'a')).toEqual(['b'])
  expect(toggleLumenMediaSelection(items, ['a'], 'c')).toEqual(['a'])
  expect(toggleLumenMediaSelection(items, ['a'], 'missing')).toEqual(['a'])
  expect(resolveLumenMediaSelection(items.slice(1), ['a', 'b'])).toEqual(['b'])
})

test('normalizes invalid viewport values, bounded zoom and pan', () => {
  expect(normalizeLumenMediaViewport({ zoom: NaN, x: Infinity, y: -Infinity })).toEqual({ zoom: 1, x: 0, y: 0 })
  expect(normalizeLumenMediaViewport({ zoom: 100, x: 2, y: -2 })).toEqual({ zoom: 4, x: 1, y: -1 })
  expect(normalizeLumenMediaViewport({ zoom: 2, x: 0.5, y: -0.5 }, NaN)).toEqual({ zoom: 2, x: 0.5, y: -0.5 })
  expect(normalizeLumenMediaViewport({ zoom: 2, x: 1 }, 0)).toEqual({ zoom: 1, x: 0, y: 0 })
  expect(normalizeLumenMediaViewport({ zoom: 100 }, 100).zoom).toBe(16)
})

test('malformed decoded viewport containers and members fall back safely', () => {
  for (const value of [null, undefined, 1, 'zoom', [], true]) {
    expect(normalizeLumenMediaViewport(value)).toEqual({ zoom: 1, x: 0, y: 0 })
  }
  expect(normalizeLumenMediaViewport({ zoom: '2', x: {}, y: null })).toEqual({ zoom: 1, x: 0, y: 0 })
  expect(normalizeLumenMediaViewport({ zoom: 2, x: '1', y: 0.5 })).toEqual({ zoom: 2, x: 0, y: 0.5 })
})

test('provides gesture alternatives and returns to the fit origin', () => {
  const origin = normalizeLumenMediaViewport()
  const zoomed = applyLumenMediaViewportAction(origin, 'zoom-in')

  expect(zoomed.zoom).toBe(1.25)
  expect(applyLumenMediaViewportAction(zoomed, 'left').x).toBe(-0.25)
  expect(applyLumenMediaViewportAction(zoomed, 'right').x).toBe(0.25)
  expect(applyLumenMediaViewportAction(zoomed, 'up').y).toBe(-0.25)
  expect(applyLumenMediaViewportAction(zoomed, 'down').y).toBe(0.25)
  expect(applyLumenMediaViewportAction(zoomed, 'zoom-out')).toEqual(origin)
  expect(applyLumenMediaViewportAction({ zoom: 4, x: -1, y: 1 }, 'fit')).toEqual(origin)
  expect(applyLumenMediaViewportAction({ zoom: 4, x: -1, y: 1 }, 'zoom-in').zoom).toBe(4)
})

test('maps dragging to the available pan extent and never permits unbounded translations', () => {
  const current = { zoom: 2, x: 0, y: 0 }

  expect(panLumenMediaViewport(current, 25, -50, 100, 200)).toEqual({ zoom: 2, x: 0.5, y: -0.5 })
  expect(panLumenMediaViewport(current, 10000, -10000, 100, 200)).toEqual({ zoom: 2, x: 1, y: -1 })
  expect(panLumenMediaViewport(current, NaN, Infinity, 100, 200)).toEqual(current)
  expect(panLumenMediaViewport(current, 10, 10, 0, 200)).toEqual(current)
  expect(panLumenMediaViewport({ zoom: 1, x: 0, y: 0 }, 10, 10, 100, 200)).toEqual({ zoom: 1, x: 0, y: 0 })
})

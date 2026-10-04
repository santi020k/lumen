import { expect, test } from 'vitest'

import { isLumenTourStepsValid, type LumenTourStep, moveLumenTourStep, resolveLumenTourLayout, resolveLumenTourStep } from './tour-recipes.js'
const steps: readonly LumenTourStep[] = [
  { id: 'a', targetId: 'same', title: 'A', content: 'First' },
  { id: 'b', targetId: 'same', title: 'B', content: 'Disabled', disabled: true },
  { id: 'c', targetId: 'third', title: 'C', content: 'Last' }
]
test('stable identity, bounds and disabled steps reject ambiguous selections and skip disabled destinations', () => {
  expect(isLumenTourStepsValid(steps)).toBe(true)
  expect(resolveLumenTourStep([...steps, ...steps], 0)).toBeNull()
  expect(resolveLumenTourStep(steps, 0.5)).toBeNull()
  expect(resolveLumenTourStep(steps, -1)).toBeNull()
  expect(resolveLumenTourStep(steps, 3)).toBeNull()
  expect(isLumenTourStepsValid([{ id: ' ', targetId: 'x', title: '', content: '' }])).toBe(false)
  expect(isLumenTourStepsValid([{ id: 'x', targetId: ' ', title: '', content: '' }])).toBe(false)
  expect(moveLumenTourStep(steps, 0, 'next')).toBe(2)
  expect(moveLumenTourStep(steps, 2, 'previous')).toBe(0)
  expect(moveLumenTourStep(steps, 2, 'next')).toBeNull()
  expect(moveLumenTourStep(steps, 1, 'next')).toBeNull()
})
test('highlight is measured, clipped and never overlaps its anchored panel', () => {
  const viewport = { x: 0, y: 0, width: 390, height: 640 }
  const layout = resolveLumenTourLayout({ x: -10, y: 50, width: 120, height: 44 }, viewport)
  expect(layout?.highlight).toEqual({ x: 0, y: 50, width: 110, height: 44 })
  expect(layout?.panel.y).toBe(102)
  const above = resolveLumenTourLayout({ x: 350, y: 580, width: 80, height: 44 }, viewport)
  expect(above?.highlight?.width).toBe(40)
  expect((above?.panel.y ?? 0) + (above?.panel.height ?? 0)).toBeLessThan(580)
})
test('missing, nonfinite, offscreen and cramped targets safely fall back within narrow viewports', () => {
  for (const width of [48, 100, 320, 390, 900]) {
    for (const height of [48, 100, 250, 640]) {
      const anchors = [null,
        { x: 2, y: 2, width: 20, height: 20 },
        { x: 0, y: 0, width, height },
        { x: 2000, y: 2000, width: 44, height: 44 },
        { x: Number.NaN, y: 0, width: 1, height: 1 }]
      for (const anchor of anchors) {
        const layout = resolveLumenTourLayout(anchor, { x: 0, y: 0, width, height })
        expect(layout).not.toBeNull()
        if (!layout) throw new Error('Missing layout')
        expect(layout.panel.x).toBeGreaterThanOrEqual(0)
        expect(layout.panel.y).toBeGreaterThanOrEqual(0)
        expect(layout.panel.x + layout.panel.width).toBeLessThanOrEqual(width)
        expect(layout.panel.y + layout.panel.height).toBeLessThanOrEqual(height)
      }
    }
  }
  expect(resolveLumenTourLayout(null, { x: 0, y: 0, width: Number.POSITIVE_INFINITY, height: 640 })).toBeNull()
  expect(resolveLumenTourLayout(null, { x: 0, y: 0, width: -1, height: 640 })).toBeNull()
})

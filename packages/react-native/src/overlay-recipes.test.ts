import { describe, expect, test } from 'vitest'

import { resolveLumenMenuPosition } from './overlay-recipes.js'

describe('React Native overlay recipes', () => {
  test('keeps anchored menus within the horizontal viewport', () => {
    expect(resolveLumenMenuPosition({
      anchorHeight: 44,
      anchorWidth: 44,
      anchorX: 350,
      anchorY: 40,
      itemCount: 2,
      margin: 16,
      menuWidth: 240,
      windowHeight: 800,
      windowWidth: 390
    })).toEqual({ left: 134, top: 88 })
  })

  test('places a menu above its trigger when the space below is insufficient', () => {
    expect(resolveLumenMenuPosition({
      anchorHeight: 44,
      anchorWidth: 44,
      anchorX: 24,
      anchorY: 700,
      itemCount: 3,
      margin: 16,
      menuWidth: 240,
      windowHeight: 800,
      windowWidth: 390
    })).toEqual({ left: 16, top: 524 })
  })
})

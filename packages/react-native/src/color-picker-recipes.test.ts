import { describe, expect, test } from 'vitest'

import { formatLumenColor, lumenHSVAToRGBA, lumenRGBAToHSVA, parseLumenColor } from './color-picker-recipes.js'

describe('native sRGB contract', () => {
  test('normalizes all hex widths and numeric RGBA without losing transparency', () => {
    for (const [input, output] of [['#123', '#112233ff'],
      ['#1234', '#11223344'],
      ['#ABCDEF', '#abcdefff'],
      ['#11223300', '#11223300'],
      ['rgba(255, 128, 0, .5)', '#ff800080']]) {
      const color = parseLumenColor(input)
      expect(color && formatLumenColor(color, true)).toBe(output)
    }
    expect(formatLumenColor({ red: 0, green: 0, blue: 0, alpha: 0 })).toBeNull()
  })
  test('rejects malformed and adversarial input and invalid channels', () => {
    for (const input of ['',
      '#12',
      '#gg0000',
      'red',
      'rgba(1,2,3,NaN)',
      'rgba(1.2,2,3,1)',
      'rgba(256,2,3,1)',
      'rgba(1,2,3,1e0)',
      'rgba(1,2,3,-1)',
      'rgba(1,2,3,2)',
      '#'.repeat(1000000),
      null]) {
      expect(parseLumenColor(input)).toBeNull()
    }
    expect(formatLumenColor({ red: Number.NaN, green: 0, blue: 0, alpha: 1 })).toBeNull()
    expect(lumenHSVAToRGBA({ hue: Infinity, saturation: 1, value: 1, alpha: 1 })).toBeNull()
  })
  test('round trips byte colors and preserves HSV channels at black and alpha zero', () => {
    for (const red of [0, 51, 128, 255]) for (const green of [0, 51, 128, 255]) for (const blue of [0, 51, 128, 255]) {
      const color = { red, green, blue, alpha: 0 }
      const hsva = lumenRGBAToHSVA(color)
      expect(hsva && lumenHSVAToRGBA(hsva)).toEqual(color)
    }
    const black = { hue: 240, saturation: 1, value: 0, alpha: 0 }
    expect(lumenHSVAToRGBA(black)).toEqual({ red: 0, green: 0, blue: 0, alpha: 0 })
    expect(lumenHSVAToRGBA({ ...black, value: 1 })).toEqual({ red: 0, green: 0, blue: 255, alpha: 0 })
  })
})

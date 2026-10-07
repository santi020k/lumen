import { describe, expect, test } from 'vitest'

import { encodeLumenQRCode, lumenQRCodePath } from './qrcode-recipes.js'

describe('offline QR encoding', () => {
  test('encodes deterministic standard finder patterns with a four-module quiet zone', () => {
    const result = encodeLumenQRCode('HELLO WORLD')
    expect(result).toEqual(encodeLumenQRCode('HELLO WORLD'))
    if (result.status !== 'ready') throw new Error('Expected a QR matrix')
    expect(result.dimension).toBe(29)
    expect(result.modules.slice(0, 4).every(row => row.every(dark => !dark))).toBe(true)
    expect(result.modules[4]?.slice(4, 11)).toEqual([true, true, true, true, true, true, true])
    expect(result.modules[5]?.slice(4, 11)).toEqual([true, false, false, false, false, false, true])
    expect(lumenQRCodePath(result.modules)).toContain('M4 4h1v1h-1z')
  })
  test('preserves Unicode, correction and changed values', () => {
    expect(encodeLumenQRCode('1'.repeat(3000), 'L').status).toBe('ready')
    expect(encodeLumenQRCode('Molina 🌞 日本語').status).toBe('ready')
    expect(encodeLumenQRCode('A')).not.toEqual(encodeLumenQRCode('B'))
    for (const correction of ['L', 'M', 'Q', 'H'] as const) expect(encodeLumenQRCode('HELLO', correction).status).toBe('ready')
  })
  test('rejects invalid options, empty values and adversarial payloads', () => {
    expect(encodeLumenQRCode('')).toEqual({ status: 'error', reason: 'empty' })
    expect(encodeLumenQRCode('A', 'M', 3)).toEqual({ status: 'error', reason: 'options' })
    expect(encodeLumenQRCode('A', 'M', Number.NaN).status).toBe('error')
    expect(encodeLumenQRCode('A'.repeat(100000))).toEqual({ status: 'error', reason: 'capacity' })
    expect(encodeLumenQRCode('🌞'.repeat(1000), 'H').status).toBe('error')
  })
})

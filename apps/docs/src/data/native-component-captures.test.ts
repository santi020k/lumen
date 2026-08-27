import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import { describe, expect, test } from 'vitest'

import {
  findNativeComponentCapture,
  getNativeComponentCapture,
  nativeComponentCaptures
} from './native-component-captures'
import { getNativeComponentsForPlatform } from './native-components'

const platforms = ['react-native', 'apple', 'android'] as const

describe('native component captures', () => {
  test('covers every documented platform component exactly once', () => {
    const expected = platforms.flatMap(platform => (
      getNativeComponentsForPlatform(platform)
        .filter(component => (
          component.implementations[platform]?.packageName !== 'LumenWidgetUI' ||
          findNativeComponentCapture(platform, component.slug) !== undefined
        ))
        .map(component => `${platform}:${component.slug}`)
    ))
    const actual = nativeComponentCaptures.map(capture => `${capture.platform}:${capture.slug}`)

    expect(new Set(actual).size).toBe(actual.length)
    expect([...actual].sort()).toEqual([...expected].sort())
  })

  test('resolves each documented capture through the public lookup', () => {
    for (const platform of platforms) {
      for (const component of getNativeComponentsForPlatform(platform)) {
        const optionalCapture = findNativeComponentCapture(platform, component.slug)

        if (
          component.implementations[platform]?.packageName === 'LumenWidgetUI' &&
          !optionalCapture
        ) {
          continue
        }

        const capture = getNativeComponentCapture(platform, component.slug)

        expect(capture.alt).toContain(component.name)
        expect(capture.device.length).toBeGreaterThan(0)
        expect(capture.height).toBeGreaterThan(0)
        expect(capture.width).toBeGreaterThan(0)
      }
    }
  })

  test('keeps every published image aligned with its manifest digest', async () => {
    const publicRoot = new URL('../../public/', import.meta.url)

    for (const capture of nativeComponentCaptures) {
      const contents = await readFile(new URL(capture.src.slice(1), publicRoot))
      const digest = createHash('sha256').update(contents).digest('hex')

      expect(digest).toBe(capture.sha256)
    }
  })
})

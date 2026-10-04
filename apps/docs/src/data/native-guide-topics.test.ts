import { describe, expect, test } from 'vitest'

import {
  getNativeGuideLegacyDestination,
  getNativeGuideTopic,
  getNativeGuideTopics,
  nativeAiPrompts,
  nativeGuidePlatforms,
  nativeGuideTopics
} from './native-guide-topics'
import { getPlatformGuide } from './platforms'

describe('native guide routes', () => {
  test('publish one focused installation, theming, and AI route for each native platform', () => {
    expect(nativeGuideTopics).toHaveLength(9)
    expect(new Set(nativeGuideTopics.map(topic => topic.href)).size).toBe(9)
    expect(new Set(nativeGuideTopics.map(topic => topic.title)).size).toBe(9)
    expect(new Set(nativeGuideTopics.map(topic => topic.description)).size).toBe(9)

    for (const platform of nativeGuidePlatforms) {
      const guide = getPlatformGuide(platform)
      const topics = getNativeGuideTopics(platform)

      expect(topics.map(topic => topic.id)).toEqual(['installation', 'theming', 'ai'])
      expect(guide.codeExamples.length).toBeGreaterThan(0)
      expect(guide.theme?.examples.length).toBeGreaterThan(0)
      expect(nativeAiPrompts[platform]).toContain('$lumen-ui')

      for (const topic of topics) {
        expect(topic.href).toBe(`${guide.href}/${topic.id}`)
        expect(getNativeGuideTopic(platform, topic.id)).toBe(topic)
        expect(topic.title).toContain(guide.shortLabel)
        expect(topic.description).toContain(guide.label)
      }
    }
  })

  test('map moved native section links without redirecting sections that still live on the overview', () => {
    for (const platform of nativeGuidePlatforms) {
      expect(getNativeGuideLegacyDestination(platform, '#installation')).toBe(`/docs/${platform}/installation`)
      expect(getNativeGuideLegacyDestination(platform, '#theme')).toBe(`/docs/${platform}/theming`)
      expect(getNativeGuideLegacyDestination(platform, '#ai-usage')).toBe(`/docs/${platform}/ai`)
      expect(getNativeGuideLegacyDestination(platform, '#components')).toBe(`/docs/${platform}/components`)
      expect(getNativeGuideLegacyDestination(platform, '#playground')).toBe(`/docs/${platform}/playground`)
      expect(getNativeGuideLegacyDestination(platform, '#principles')).toBeUndefined()
      expect(getNativeGuideLegacyDestination(platform, '#native-preview-title')).toBeUndefined()
      expect(getNativeGuideLegacyDestination(platform, '')).toBeUndefined()
    }
  })
})

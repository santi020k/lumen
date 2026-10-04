import type { NativePlatformId } from './native-components'
import { getPlatformGuide } from './platforms.ts'

export type NativeGuideTopicId = 'installation' | 'theming' | 'ai'

export interface NativeGuideTopic {
  readonly platform: NativePlatformId
  readonly id: NativeGuideTopicId
  readonly href: string
  readonly title: string
  readonly description: string
  readonly icon: string
  readonly legacyHash: string
}

export const nativeGuidePlatforms: readonly NativePlatformId[] = ['react-native', 'apple', 'android']

const topics: readonly Omit<NativeGuideTopic, 'platform' | 'href'>[] = [
  {
    id: 'installation',
    title: 'Installation',
    description: 'Check requirements, install the package, and configure your first native screen.',
    icon: 'download',
    legacyHash: '#installation'
  },
  {
    id: 'theming',
    title: 'Theming',
    description: 'Apply semantic tokens, follow system appearance, and verify light and dark themes.',
    icon: 'palette',
    legacyHash: '#theme'
  },
  {
    id: 'ai',
    title: 'Build with AI',
    description: 'Give your coding agent platform-specific prompts, package context, and accessibility requirements.',
    icon: 'sparkles',
    legacyHash: '#ai-usage'
  }
]

export const nativeGuideTopics: readonly NativeGuideTopic[] = nativeGuidePlatforms.flatMap(platform => {
  const guide = getPlatformGuide(platform)

  return topics.map(topic => ({
    ...topic,
    platform,
    href: `${guide.href}/${topic.id}`,
    title: `${guide.shortLabel} ${topic.title}`,
    description: `${topic.description} Learn how with Lumen for ${guide.label}.`
  }))
})

export const getNativeGuideTopics = (platform: NativePlatformId): readonly NativeGuideTopic[] => (
  nativeGuideTopics.filter(topic => topic.platform === platform)
)

export const getNativeGuideTopic = (platform: NativePlatformId, id: NativeGuideTopicId): NativeGuideTopic => {
  const topic = nativeGuideTopics.find(candidate => candidate.platform === platform && candidate.id === id)

  if (!topic) throw new Error(`Unknown native guide topic: ${platform}/${id}`)

  return topic
}

export const getNativeGuideLegacyDestination = (platform: NativePlatformId, hash: string): string | undefined => {
  const topic = getNativeGuideTopics(platform).find(candidate => candidate.legacyHash === hash)

  if (topic) return topic.href

  if (hash === '#components') return `${getPlatformGuide(platform).href}/components`

  if (hash === '#playground') return `${getPlatformGuide(platform).href}/playground`

  return undefined
}

export const nativeAiPrompts: Readonly<Record<NativePlatformId, string>> = {
  android: `Use $lumen-ui to build this screen with Jetpack Compose.
Use the local lumen-compose module, LumenTheme, and public Compose components.
Preserve Android navigation and state, and include loading, empty, error, and TalkBack behavior.`,
  apple: `Use $lumen-ui to build this screen in SwiftUI.
Use the LumenUI Swift package and public SwiftUI components.
Preserve native navigation and state, and include loading, empty, error, Dynamic Type, and VoiceOver behavior.`,
  'react-native': `Use $lumen-ui to build this screen in the existing React Native app.
Use @santi020k/lumen-react-native and mount one LumenProvider at the app root.
Preserve navigation and state, and include loading, empty, error, and native accessibility behavior.`
}

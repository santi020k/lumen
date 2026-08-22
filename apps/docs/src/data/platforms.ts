export type DocsPlatformId = 'android' | 'apple' | 'foundations' | 'react-native' | 'web'

interface PlatformCodeExample {
  code: string
  label: string
  language: 'bash' | 'kotlin' | 'swift' | 'tsx'
  value: string
}

interface PlatformPrinciple {
  description: string
  title: string
}

interface PlatformLink {
  href: string
  label: string
}

export interface PlatformGuide {
  codeExamples: PlatformCodeExample[]
  componentNote: string
  components: string[]
  eyebrow: string
  href: string
  id: DocsPlatformId
  installNote: string
  label: string
  packageName: string
  principles: PlatformPrinciple[]
  relatedLinks: PlatformLink[]
  shortLabel: string
  status: string
  summary: string
  title: string
}

const sharedNativeComponents = [
  'Theme',
  'Text',
  'Icon',
  'Icon button',
  'Surface',
  'Button',
  'Text field',
  'Badge',
  'Divider',
  'Spinner',
  'Card',
  'Alert',
  'Progress',
  'Avatar'
]

export const platformGuides: PlatformGuide[] = [
  {
    codeExamples: [
      {
        code: 'pnpm add @santi020k/lumen-astro',
        label: 'Astro',
        language: 'bash',
        value: 'astro'
      },
      {
        code: 'pnpm add @santi020k/lumen-react',
        label: 'React',
        language: 'bash',
        value: 'react'
      },
      {
        code: 'pnpm add @santi020k/lumen-elements',
        label: 'Elements',
        language: 'bash',
        value: 'elements'
      }
    ],
    componentNote:
      'The complete web catalog is shared across Astro, React, and standards-based custom elements.',
    components: ['Astro', 'React', 'Web Components', 'Standalone CSS', 'Progressive enhancement'],
    eyebrow: 'Web platform',
    href: '/docs/web',
    id: 'web',
    installNote:
      'Choose the package that matches your application. Every web target uses the same semantic tokens and visual contract.',
    label: 'Web',
    packageName: '@santi020k/lumen-{astro,react,elements}',
    principles: [
      {
        description: 'Astro is the reference implementation for the complete catalog and behavior contract.',
        title: 'Reference surface'
      },
      {
        description: 'React primitives and hooks follow React state and composition conventions.',
        title: 'Framework-native behavior'
      },
      {
        description: 'Custom elements bring the same design language anywhere standards-based HTML runs.',
        title: 'Portable elements'
      }
    ],
    relatedLinks: [
      { href: '/docs/frameworks/astro', label: 'Astro guide' },
      { href: '/docs/frameworks/react', label: 'React guide' },
      { href: '/docs/frameworks/elements', label: 'Elements guide' },
      { href: '/docs/components', label: 'Web components' }
    ],
    shortLabel: 'Web',
    status: 'Full catalog',
    summary:
      'Build accessible interfaces with Astro, React, or Web Components using one stylesheet, token system, and component contract.',
    title: 'Lumen for the web'
  },
  {
    codeExamples: [
      {
        code: 'pnpm add @santi020k/lumen-react-native',
        label: 'Install',
        language: 'bash',
        value: 'install'
      },
      {
        code: `import {
  LumenButton,
  LumenProvider,
  LumenSurface,
  LumenText
} from '@santi020k/lumen-react-native'

export function App() {
  return (
    <LumenProvider scheme="system">
      <LumenSurface>
        <LumenText variant="title">Welcome</LumenText>
        <LumenButton onPress={() => {}}>Continue</LumenButton>
      </LumenSurface>
    </LumenProvider>
  )
}`,
        label: 'App',
        language: 'tsx',
        value: 'app'
      }
    ],
    componentNote:
      'These primitives share semantic intent with Web, SwiftUI, and Compose while retaining React Native props, refs, and accessibility behavior.',
    components: sharedNativeComponents,
    eyebrow: 'React Native',
    href: '/docs/react-native',
    id: 'react-native',
    installNote:
      'Install the package and mount one LumenProvider near the application root. Icons remain application-provided native graphic components.',
    label: 'React Native',
    packageName: '@santi020k/lumen-react-native',
    principles: [
      {
        description: 'Numeric dimensions and hexadecimal colors are generated directly from the canonical token source.',
        title: 'Native foundations'
      },
      {
        description: 'Components use native accessibility roles, states, touch targets, and refs without a DOM runtime.',
        title: 'Native semantics'
      },
      {
        description: 'The provider follows the system color scheme or an explicit light or dark selection.',
        title: 'Theme context'
      }
    ],
    relatedLinks: [
      { href: '/docs/foundations', label: 'Shared foundations' },
      { href: 'https://github.com/santi020k/lumen/tree/main/packages/react-native', label: 'Package source' }
    ],
    shortLabel: 'React Native',
    status: 'Native primitives',
    summary:
      'Use Lumen foundations and native primitives in React Native without depending on CSS, DOM behavior, or the web runtime.',
    title: 'Lumen for React Native'
  },
  {
    codeExamples: [
      {
        code: 'https://github.com/santi020k/lumen',
        label: 'Swift package',
        language: 'bash',
        value: 'package'
      },
      {
        code: `import LumenUI

@main
struct ExampleApp: App {
    var body: some Scene {
        WindowGroup {
            LumenSurface {
                LumenText("Welcome", variant: .title)
                LumenButton("Continue", action: continueFlow)
            }
            .lumenTheme(.light)
        }
    }
}`,
        label: 'SwiftUI',
        language: 'swift',
        value: 'swift'
      }
    ],
    componentNote:
      'The shared native tier is complemented by Apple-specific controls that preserve SwiftUI navigation, focus, and window behavior.',
    components: [
      ...sharedNativeComponents,
      'Toggle',
      'Settings row',
      'Picker',
      'Slider',
      'Search field',
      'Empty state',
      'List row',
      'Banner',
      'Stat',
      'Gauge',
      'Section header',
      'Status bar',
      'Shortcut recorder',
      'Symbol picker'
    ],
    eyebrow: 'Apple platforms',
    href: '/docs/apple',
    id: 'apple',
    installNote:
      'Add the repository through Swift Package Manager and select the LumenUI product. The same APIs support iOS and macOS, with automatic control density.',
    label: 'Apple / SwiftUI',
    packageName: 'LumenUI',
    principles: [
      {
        description: 'The package supports iOS 16, macOS 13, tvOS 16, and watchOS 9 or newer.',
        title: 'Apple platform coverage'
      },
      {
        description: 'Controls automatically use touch-friendly mobile density and compact pointer-friendly Mac density.',
        title: 'Adaptive density'
      },
      {
        description: 'Dynamic Type, SF Symbols, environment values, VoiceOver, and native controls remain first-class.',
        title: 'SwiftUI conventions'
      }
    ],
    relatedLinks: [
      { href: '/docs/foundations', label: 'Shared foundations' },
      { href: 'https://github.com/santi020k/lumen/tree/main/packages/swift', label: 'Package source' }
    ],
    shortLabel: 'Apple',
    status: 'SwiftUI package',
    summary:
      'Share a Lumen design language across iPhone, iPad, Mac, Apple TV, and Apple Watch while keeping SwiftUI behavior native.',
    title: 'Lumen for Apple platforms'
  },
  {
    codeExamples: [
      {
        code: `// settings.gradle.kts
include(":lumen-compose")
project(":lumen-compose").projectDir = file("../lumen/packages/compose")

// app/build.gradle.kts
dependencies {
    implementation(project(":lumen-compose"))
}`,
        label: 'Gradle',
        language: 'kotlin',
        value: 'gradle'
      },
      {
        code: `import com.santi020k.lumen.LumenTheme

LumenTheme {
    LumenSurface {
        LumenText("Welcome", variant = LumenTextVariant.Title)
        LumenButton(onClick = ::continueFlow) {
            Text("Continue")
        }
    }
}`,
        label: 'Compose',
        language: 'kotlin',
        value: 'compose'
      }
    ],
    componentNote:
      'Compose implements the shared native tier using Kotlin and Material 3 conventions rather than translating web markup.',
    components: sharedNativeComponents,
    eyebrow: 'Android platform',
    href: '/docs/android',
    id: 'android',
    installNote:
      'Until a remote Maven release is configured, include the lumen-compose module from a Lumen checkout and wrap application content in LumenTheme.',
    label: 'Android / Compose',
    packageName: 'com.santi020k:lumen-compose',
    principles: [
      {
        description: 'Generated colors, dimensions, typography, motion, and elevation map into Compose-native values.',
        title: 'Generated foundations'
      },
      {
        description: 'LumenTheme maps the shared semantic palette into Material 3 while exposing the full token object.',
        title: 'Material 3 integration'
      },
      {
        description: 'Components preserve native focus, state, input, and TalkBack semantics.',
        title: 'Android accessibility'
      }
    ],
    relatedLinks: [
      { href: '/docs/foundations', label: 'Shared foundations' },
      { href: 'https://github.com/santi020k/lumen/tree/main/packages/compose', label: 'Module source' }
    ],
    shortLabel: 'Android',
    status: 'Compose module',
    summary:
      'Use the shared Lumen foundations through Jetpack Compose and Material 3 while preserving Android interaction and accessibility conventions.',
    title: 'Lumen for Android'
  },
  {
    codeExamples: [
      {
        code: 'pnpm add @santi020k/lumen-tokens',
        label: 'Install tokens',
        language: 'bash',
        value: 'tokens'
      }
    ],
    componentNote:
      'Foundations define shared roles and expectations. Each adapter remains responsible for native rendering, interaction, focus, and navigation.',
    components: ['Color', 'Spacing', 'Radius', 'Typography', 'Motion', 'Elevation', 'Light theme', 'Dark theme'],
    eyebrow: 'Shared design language',
    href: '/docs/foundations',
    id: 'foundations',
    installNote:
      'Most applications should consume tokens through their platform package. Use the platform-neutral token package for tooling and custom adapters.',
    label: 'Foundations',
    packageName: '@santi020k/lumen-tokens',
    principles: [
      {
        description: 'tokens/lumen.tokens.json is the canonical platform-neutral source for every generated adapter.',
        title: 'One token source'
      },
      {
        description: 'Semantic purpose, variants, states, content rules, and accessibility expectations form the shared contract.',
        title: 'Shared intent'
      },
      {
        description: 'Rendering, gestures, navigation, focus systems, and platform conventions stay inside each adapter.',
        title: 'Native implementation'
      }
    ],
    relatedLinks: [
      { href: '/docs/web', label: 'Web documentation' },
      { href: '/docs/react-native', label: 'React Native documentation' },
      { href: '/docs/apple', label: 'Apple documentation' },
      { href: '/docs/android', label: 'Android documentation' }
    ],
    shortLabel: 'Foundations',
    status: 'Canonical tokens',
    summary:
      'Understand the semantic tokens and cross-platform contracts that keep every Lumen implementation recognizably part of one system.',
    title: 'Shared foundations'
  }
]

export const productPlatformGuides = platformGuides.filter(guide => guide.id !== 'foundations')

export const getPlatformGuide = (id: DocsPlatformId): PlatformGuide => {
  const guide = platformGuides.find(candidate => candidate.id === id)

  if (!guide) throw new Error(`Unknown documentation platform: ${id}`)

  return guide
}

const docsPlatformPrefixes: readonly (readonly [string, DocsPlatformId])[] = [
  ['/docs/react-native', 'react-native'],
  ['/docs/apple', 'apple'],
  ['/docs/android', 'android'],
  ['/docs/foundations', 'foundations'],
  ['/docs/web', 'web'],
  ['/docs/components', 'web'],
  ['/docs/frameworks', 'web'],
  ['/docs/forms', 'web'],
  ['/docs/icons', 'web'],
  ['/docs/brand-icons', 'web'],
  ['/docs/theme-playground', 'web']
]

export const getDocsPlatform = (pathname: string): DocsPlatformId | undefined => (
  docsPlatformPrefixes.find(([prefix]) => pathname.startsWith(prefix))?.[1]
)

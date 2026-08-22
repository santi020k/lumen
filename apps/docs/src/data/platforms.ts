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

interface PlatformSetupStep {
  description: string
  title: string
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
  maturity?: 'Beta'
  maturityNote?: string
  packageName: string
  playgroundCommands?: PlatformCodeExample[]
  playgroundNote?: string
  prerequisites?: string[]
  principles: PlatformPrinciple[]
  setupSteps?: PlatformSetupStep[]
  shippingNotes?: string[]
  relatedLinks: PlatformLink[]
  shortLabel: string
  status: string
  summary: string
  title: string
}

const nativeBetaNote =
  'The native adapter is available for testing and early production adoption, but its public API may evolve as Lumen validates it in real applications. Review release notes when upgrading.'

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
        label: 'pnpm',
        language: 'bash',
        value: 'pnpm'
      },
      {
        code: 'npm install @santi020k/lumen-react-native',
        label: 'npm',
        language: 'bash',
        value: 'npm'
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
        label: 'App.tsx',
        language: 'tsx',
        value: 'app'
      },
      {
        code: `# Expo
npx expo start

# React Native Community CLI
npx react-native start`,
        label: 'Run',
        language: 'bash',
        value: 'run'
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
    maturity: 'Beta',
    maturityNote: nativeBetaNote,
    packageName: '@santi020k/lumen-react-native',
    playgroundCommands: [
      {
        code: `git clone https://github.com/santi020k/lumen.git
cd lumen
pnpm install
pnpm playground:react-native`,
        label: 'Expo',
        language: 'bash',
        value: 'expo'
      },
      {
        code: 'pnpm playground:react-native:web',
        label: 'Web',
        language: 'bash',
        value: 'web'
      },
      {
        code: 'pnpm --filter @santi020k/lumen-playground-react-native run build:android:apk',
        label: 'APK',
        language: 'bash',
        value: 'apk'
      }
    ],
    playgroundNote:
      'The Expo gallery is the quickest way to inspect every React Native component. Scan the terminal QR code with Expo Go, press i for the iOS simulator, press a for Android, or launch the web target.',
    prerequisites: [
      'Node.js 22.12 or newer and pnpm',
      'React 19.2 and React Native 0.86.2 or newer',
      'Expo Go, Xcode, or Android Studio for a native runtime'
    ],
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
      { href: '#playground', label: 'Run the playground' },
      { href: 'https://github.com/santi020k/lumen/tree/main/packages/react-native', label: 'Package source' }
    ],
    setupSteps: [
      {
        description: 'Run the install command from an existing Expo or React Native application. React and React Native remain peer dependencies supplied by your app.',
        title: 'Install the native package'
      },
      {
        description: 'Mount one LumenProvider near the application root. Use scheme="system" to follow the device appearance automatically.',
        title: 'Add the theme provider'
      },
      {
        description: 'Start Expo or your native bundler, then open the app on web, an emulator, a simulator, or a physical device.',
        title: 'Run a native target'
      }
    ],
    shippingNotes: [
      'Run eas login and eas init once before the first remote Expo build.',
      'The preview EAS profile produces an installable Android APK.',
      'Production Android and iOS builds require store credentials and signing configured in EAS.'
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
        code: `# Xcode → File → Add Package Dependencies…
https://github.com/santi020k/lumen

# Dependency Rule
Branch: main

# Add this product to your application target
LumenUI`,
        label: 'Xcode',
        language: 'bash',
        value: 'xcode'
      },
      {
        code: `// Package.swift
dependencies: [
    .package(
        url: "https://github.com/santi020k/lumen",
        branch: "main"
    )
],
targets: [
    .target(
        name: "YourApp",
        dependencies: [
            .product(name: "LumenUI", package: "lumen")
        ]
    )
]`,
        label: 'Package.swift',
        language: 'swift',
        value: 'manifest'
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
      'LumenUI installs through Swift Package Manager; no npm package, CocoaPod, or copied source is required. Add the repository URL, use the main branch, and attach the LumenUI product to your application target.',
    label: 'Apple / SwiftUI',
    maturity: 'Beta',
    maturityNote: nativeBetaNote,
    packageName: 'LumenUI',
    playgroundCommands: [
      {
        code: `git clone https://github.com/santi020k/lumen.git
cd lumen
open apps/playground-apple/LumenApplePlayground.xcodeproj`,
        label: 'iOS',
        language: 'bash',
        value: 'ios'
      },
      {
        code: `pnpm playground:apple:build
swift run --package-path apps/playground-apple LumenApplePlayground`,
        label: 'macOS',
        language: 'bash',
        value: 'macos'
      }
    ],
    playgroundNote:
      'The Apple gallery runs as an iOS app from Xcode and as a macOS Swift Package executable. Choose an iPhone simulator and press Run; signing is not required for the simulator.',
    prerequisites: [
      'macOS with Xcode 16 or newer and the iOS 16 or newer SDK',
      'An existing SwiftUI application targeting a supported Apple platform',
      'An Apple Developer account only for physical-device or TestFlight distribution'
    ],
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
      { href: '#playground', label: 'Run the playground' },
      { href: 'https://github.com/santi020k/lumen/tree/main/packages/swift', label: 'Package source' }
    ],
    setupSteps: [
      {
        description: 'In Xcode, choose File → Add Package Dependencies, paste the repository URL, and use the main branch as the dependency rule.',
        title: 'Add the Swift package'
      },
      {
        description: 'Select the LumenUI library product and attach it to the application target that renders your SwiftUI views.',
        title: 'Link LumenUI to the target'
      },
      {
        description: 'Import LumenUI, wrap the root surface in lumenTheme, select a simulator, and press Run.',
        title: 'Import, theme, and run'
      }
    ],
    shippingNotes: [
      'Simulator builds do not require an Apple Developer account or signing.',
      'For a physical device or TestFlight, select your team under Signing & Capabilities.',
      'Archive the playground in Xcode only after choosing the final bundle identifier and signing team.'
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
        code: `git submodule add https://github.com/santi020k/lumen.git Vendor/lumen
git submodule update --init --recursive`,
        label: 'Get Lumen',
        language: 'bash',
        value: 'checkout'
      },
      {
        code: `// settings.gradle.kts
include(":lumen-compose")
project(":lumen-compose").projectDir = file("Vendor/lumen/packages/compose")`,
        label: 'settings.gradle.kts',
        language: 'kotlin',
        value: 'settings'
      },
      {
        code: `// app/build.gradle.kts
dependencies {
    implementation(project(":lumen-compose"))
}`,
        label: 'app/build.gradle.kts',
        language: 'kotlin',
        value: 'dependency'
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
    maturity: 'Beta',
    maturityNote: nativeBetaNote,
    packageName: 'com.santi020k:lumen-compose',
    playgroundCommands: [
      {
        code: `git clone https://github.com/santi020k/lumen.git
cd lumen
pnpm playground:android:build`,
        label: 'Build APK',
        language: 'bash',
        value: 'apk'
      },
      {
        code: 'open apps/playground-android',
        label: 'Android Studio',
        language: 'bash',
        value: 'studio'
      }
    ],
    playgroundNote:
      'Open the Android playground directory in Android Studio, let Gradle sync, select an emulator or connected device, and press Run. The command-line build writes a directly installable debug APK under the app build directory.',
    prerequisites: [
      'Android Studio with JDK 17 or newer',
      'Android SDK 37 and an emulator or USB-debuggable device',
      'A Lumen checkout or Git submodule while the Compose package is distributed as a local Gradle module'
    ],
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
      { href: '#playground', label: 'Run the playground' },
      { href: 'https://github.com/santi020k/lumen/tree/main/packages/compose', label: 'Module source' }
    ],
    setupSteps: [
      {
        description: 'Clone Lumen beside your application or add it as a Git submodule. There is not yet a remote Maven artifact to download.',
        title: 'Make the Compose module available'
      },
      {
        description: 'Point settings.gradle.kts to packages/compose, include the module, and add implementation(project(":lumen-compose")) to the app target.',
        title: 'Connect the Gradle module'
      },
      {
        description: 'Sync Gradle, wrap application content in LumenTheme, then run an emulator or build a debug APK.',
        title: 'Sync, theme, and run'
      }
    ],
    shippingNotes: [
      'Debug APKs can be installed directly and do not require Play Console credentials.',
      'Google Play distribution requires a signed Android App Bundle and a Play Console application.',
      'Configure the release keystore outside source control before creating the production bundle.'
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

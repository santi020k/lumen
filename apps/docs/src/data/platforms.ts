import { getNativeComponentsForPlatform } from './native-components'

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

interface PlatformPlaygroundLaunch {
  compatibilityNote?: string
  url: string
}

interface PlatformLink {
  href: string
  label: string
}

interface PlatformSetupStep {
  description: string
  title: string
}

interface PlatformThemeGuide {
  description: string
  examples: PlatformCodeExample[]
  note: string
  verification: string[]
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
  playgroundCommands?: PlatformCodeExample[]
  playgroundLaunch?: PlatformPlaygroundLaunch
  playgroundNote?: string
  prerequisites?: string[]
  principles: PlatformPrinciple[]
  setupSteps?: PlatformSetupStep[]
  shippingNotes?: string[]
  relatedLinks: PlatformLink[]
  shortLabel: string
  status: string
  summary: string
  theme?: PlatformThemeGuide
  title: string
}

const lumenComposeCoordinate = 'com.santi020k:lumen-compose:0.6.0'
const lumenComposeWearCoordinate = 'com.santi020k:lumen-compose-wear:0.6.0'
const nativeComponentNames = (platform: 'android' | 'apple' | 'react-native'): string[] => getNativeComponentsForPlatform(platform).map(component => component.name)

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
        description:
          'Astro is the reference implementation for the complete catalog and behavior contract.',
        title: 'Reference surface'
      },
      {
        description: 'React primitives and hooks follow React state and composition conventions.',
        title: 'Framework-native behavior'
      },
      {
        description:
          'Custom elements bring the same design language anywhere standards-based HTML runs.',
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
        code: 'pnpm add @santi020k/lumen-react-native react-native-svg @react-native-community/datetimepicker',
        label: 'pnpm',
        language: 'bash',
        value: 'pnpm'
      },
      {
        code: 'npm install @santi020k/lumen-react-native react-native-svg @react-native-community/datetimepicker',
        label: 'npm',
        language: 'bash',
        value: 'npm'
      },
      {
        code: `# Required until Lumen 2 removes the deprecated root date exports
pnpm add @react-native-community/datetimepicker`,
        label: 'Date & time',
        language: 'bash',
        value: 'datetime'
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
    components: nativeComponentNames('react-native'),
    eyebrow: 'React Native',
    href: '/docs/react-native',
    id: 'react-native',
    installNote:
      'Install Lumen with its required react-native-svg and datetime-picker peers, then mount one LumenProvider near the application root. The deprecated root date exports keep the datetime picker required for the pre-v2 stability releases; Lumen 2 makes it optional for consumers that use no /datetime imports.',
    label: 'React Native',
    packageName: '@santi020k/lumen-react-native',
    playgroundCommands: [
      {
        code: 'pnpm playground:react-native:web',
        label: 'Web',
        language: 'bash',
        value: 'web'
      },
      {
        code: `git clone https://github.com/santi020k/lumen.git
cd lumen
pnpm install
pnpm playground:react-native`,
        label: 'Local Expo',
        language: 'bash',
        value: 'expo'
      },
      {
        code: 'pnpm --filter @santi020k/lumen-playground-react-native run build:android:apk',
        label: 'APK',
        language: 'bash',
        value: 'apk'
      }
    ],
    playgroundNote:
      'Use the browser preview for the quickest public tour. Clone the repository for Expo, simulators, emulators, or physical-device validation; the local path avoids advertising an Expo Go QR code that the current public client cannot open.',
    prerequisites: [
      'Node.js 22.12 or newer for consumer applications',
      'Node.js 22.19 or newer and pnpm for the Lumen repository playground',
      'React 19.2 and React Native 0.86.2 or newer',
      'Expo Go, Xcode, or Android Studio for a native runtime'
    ],
    principles: [
      {
        description:
          'Numeric dimensions and hexadecimal colors are generated directly from the canonical token source.',
        title: 'Native foundations'
      },
      {
        description:
          'Components use native accessibility roles, states, touch targets, and refs without a DOM runtime.',
        title: 'Native semantics'
      },
      {
        description:
          'The provider follows the system color scheme or an explicit light or dark selection.',
        title: 'Theme context'
      }
    ],
    relatedLinks: [
      { href: '/docs/react-native/hooks', label: 'React Native hooks' },
      { href: '/docs/foundations', label: 'Shared foundations' },
      { href: '/docs/icons#icon-catalog', label: 'Interface icon names' },
      { href: '/docs/brand-icons#brand-icon-catalog', label: 'Brand icon names' },
      { href: '#playground', label: 'Run the playground' },
      {
        href: 'https://github.com/santi020k/lumen/tree/main/packages/react-native',
        label: 'Package source'
      }
    ],
    setupSteps: [
      {
        description:
          'Run the install command from an existing Expo or React Native application. React and React Native remain peer dependencies supplied by your app; react-native-svg is installed alongside Lumen.',
        title: 'Install the native package'
      },
      {
        description:
          'Mount one LumenProvider near the application root. Use scheme="system" to follow the device appearance automatically.',
        title: 'Add the theme provider'
      },
      {
        description:
          'Start Expo or your native bundler, then open the app on web, an emulator, a simulator, or a physical device.',
        title: 'Run a native target'
      }
    ],
    shippingNotes: [
      'Run the pinned EAS CLI login and init commands once before the first remote Expo build.',
      'The preview EAS profile produces an installable Android APK.',
      'Production Android and iOS builds require store credentials and signing configured in EAS.'
    ],
    shortLabel: 'React Native',
    status: 'Native primitives',
    summary:
      'Use Lumen foundations and native primitives in React Native without depending on CSS, DOM behavior, or the web runtime.',
    theme: {
      description:
        'LumenProvider follows the device appearance by default. Pass light or dark when an in-app preference should override the system, and keep the provider near the application root so every screen receives the same semantic colors and foundation values.',
      examples: [
        {
          code: `<LumenProvider scheme="system">
  <AppNavigation />
</LumenProvider>`,
          label: 'Follow system',
          language: 'tsx',
          value: 'system'
        },
        {
          code: `type Appearance = 'light' | 'dark'

const [appearance, setAppearance] = useState<Appearance>('light')

return (
  <LumenProvider scheme={appearance}>
    <AppNavigation />
  </LumenProvider>
)`,
          label: 'App preference',
          language: 'tsx',
          value: 'preference'
        }
      ],
      note: 'Components consume semantic roles such as canvas, surface, ink, brand, success, warning, and danger. Keep product code on those roles rather than assigning one-off colors to individual components.',
      verification: [
        'Switch the device between light and dark while the app is open.',
        'Check text and icon contrast in default, disabled, error, and loading states.',
        'Test the largest supported font scale and screen-reader labels in both schemes.'
      ]
    },
    title: 'Lumen for React Native'
  },
  {
    codeExamples: [
      {
        code: `# Xcode → File → Add Package Dependencies…
https://github.com/santi020k/lumen

# Dependency Rule
Exact Version: 1.7.0

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
        exact: "1.7.0"
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
      'The shared native tier is complemented by SwiftUI and macOS-specific controls that preserve native navigation, focus, and window behavior.',
    components: nativeComponentNames('apple'),
    eyebrow: 'Apple platforms',
    href: '/docs/apple',
    id: 'apple',
    installNote:
      'LumenUI installs through Swift Package Manager; no npm package, CocoaPod, or copied source is required. Add the repository URL, pin exact version 1.7.0 for reproducible builds, and attach the LumenUI product to your application target.',
    label: 'Apple / SwiftUI',
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
      'macOS with Xcode 16 or newer and the SDK for the Apple platform you target',
      'An existing SwiftUI application targeting a supported Apple platform',
      'An Apple Developer account only for physical-device or TestFlight distribution'
    ],
    principles: [
      {
        description: 'The package supports iOS 16, macOS 13, tvOS 16, visionOS 1, and watchOS 9 or newer.',
        title: 'Apple platform coverage'
      },
      {
        description:
          'Controls automatically use touch-friendly mobile density and compact pointer-friendly Mac density.',
        title: 'Adaptive density'
      },
      {
        description:
          'Dynamic Type, SF Symbols, environment values, VoiceOver, and native controls remain first-class.',
        title: 'SwiftUI conventions'
      }
    ],
    relatedLinks: [
      { href: '/docs/foundations', label: 'Shared foundations' },
      { href: '/docs/icons#icon-catalog', label: 'Interface icon names' },
      { href: '/docs/brand-icons#brand-icon-catalog', label: 'Brand icon names' },
      { href: '#playground', label: 'Run the playground' },
      {
        href: 'https://github.com/santi020k/lumen/tree/main/packages/swift',
        label: 'Package source'
      }
    ],
    setupSteps: [
      {
        description:
          'In Xcode, choose File → Add Package Dependencies, paste the repository URL, and pin exact version 1.7.0 for reproducible builds. Use a compatible-version rule only when the application accepts compatible updates.',
        title: 'Add the Swift package'
      },
      {
        description:
          'Select the LumenUI library product and attach it to the application target that renders your SwiftUI views.',
        title: 'Link LumenUI to the target'
      },
      {
        description:
          'Import LumenUI, wrap the root surface in lumenTheme, select a simulator, and press Run.',
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
    theme: {
      description:
        'Apply one built-in Lumen theme to the root content view. The modifier shares semantic colors through the SwiftUI environment and sets the matching preferred color scheme for native controls, sheets, and system surfaces.',
      examples: [
        {
          code: `WindowGroup {
    AppRoot()
        .lumenTheme(.light)
}`,
          label: 'Light',
          language: 'swift',
          value: 'light'
        },
        {
          code: `@AppStorage("useDarkAppearance") private var useDarkAppearance = false

var body: some Scene {
    WindowGroup {
        AppRoot()
            .lumenTheme(useDarkAppearance ? .dark : .light)
    }
}`,
          label: 'Saved preference',
          language: 'swift',
          value: 'preference'
        }
      ],
      note: 'Use Lumen semantic colors through public components instead of styling each control independently. The selected theme also keeps SF Symbols, native controls, and presented views aligned with the same appearance.',
      verification: [
        'Preview every supported device family in light and dark appearances.',
        'Check sheets, menus, focus rings, and system controls as well as the main view.',
        'Test Dynamic Type, Increase Contrast, and VoiceOver in both themes.'
      ]
    },
    title: 'Lumen for Apple platforms'
  },
  {
    codeExamples: [
      {
        code: `// app/build.gradle.kts
repositories {
    mavenCentral()
}

dependencies {
    implementation("${lumenComposeCoordinate}")
}`,
        label: 'Install',
        language: 'kotlin',
        value: 'install'
      },
      {
        code: `// wear/build.gradle.kts
repositories {
    mavenCentral()
}

dependencies {
    implementation("${lumenComposeWearCoordinate}")
}`,
        label: 'Wear OS',
        language: 'kotlin',
        value: 'wear'
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
      'Compose implements the shared native tier using Kotlin and Material 3 conventions. Watch-only primitives ship separately so phone and tablet applications do not acquire Wear dependencies.',
    components: nativeComponentNames('android'),
    eyebrow: 'Android platform',
    href: '/docs/android',
    id: 'android',
    installNote:
      `Install ${lumenComposeCoordinate} for Android apps. Add ${lumenComposeWearCoordinate} only to a Wear OS module, then wrap content in the appropriate Lumen theme.`,
    label: 'Android / Compose',
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
      'Android Studio with JDK 21 or newer',
      'Android SDK 37 and an emulator or USB-debuggable device',
      'Maven Central enabled in the application repositories'
    ],
    principles: [
      {
        description:
          'Generated colors, dimensions, typography, motion, and elevation map into Compose-native values.',
        title: 'Generated foundations'
      },
      {
        description:
          'LumenTheme maps the shared semantic palette into Material 3 while exposing the full token object.',
        title: 'Material 3 integration'
      },
      {
        description: 'Components preserve native focus, state, input, and TalkBack semantics.',
        title: 'Android accessibility'
      }
    ],
    relatedLinks: [
      { href: '/docs/foundations', label: 'Shared foundations' },
      { href: '/docs/icons#icon-catalog', label: 'Interface icon names' },
      { href: '/docs/brand-icons#brand-icon-catalog', label: 'Brand icon names' },
      { href: '#playground', label: 'Run the playground' },
      {
        href: 'https://github.com/santi020k/lumen/tree/main/packages/compose',
        label: 'Module source'
      }
    ],
    setupSteps: [
      {
        description: `Add implementation("${lumenComposeCoordinate}") to the application module.`,
        title: 'Install from Maven Central'
      },
      {
        description: `For a watch target, add implementation("${lumenComposeWearCoordinate}") to the Wear module. Keep it out of phone and tablet modules that do not render Wear UI.`,
        title: 'Add the Wear artifact when needed'
      },
      {
        description:
          'Wrap application content in LumenTheme. It follows the system appearance by default and keeps Lumen and Material 3 content aligned.',
        title: 'Add the theme provider'
      },
      {
        description:
          'Sync Gradle, then run an emulator, a connected Android device, or build a debug APK.',
        title: 'Sync and run'
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
    theme: {
      description:
        'LumenTheme follows the device appearance by default and maps Lumen semantic colors into Material 3. Pass darkTheme explicitly only when the application offers its own saved appearance preference.',
      examples: [
        {
          code: `LumenTheme {
    AppNavigation()
}`,
          label: 'Follow system',
          language: 'kotlin',
          value: 'system'
        },
        {
          code: `var useDarkTheme by rememberSaveable { mutableStateOf(false) }

LumenTheme(darkTheme = useDarkTheme) {
    AppNavigation()
}`,
          label: 'App preference',
          language: 'kotlin',
          value: 'preference'
        }
      ],
      note: 'LumenTheme provides both LocalLumenTheme and MaterialTheme. Prefer Lumen components and semantic roles so Lumen and Material content stay visually consistent inside the same hierarchy.',
      verification: [
        'Change the emulator or device appearance while the app is running.',
        'Check system bars, dialogs, fields, and disabled or error states in both schemes.',
        'Test large font sizes, high-contrast settings, and TalkBack descriptions.'
      ]
    },
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
    components: [
      'Color',
      'Spacing',
      'Radius',
      'Typography',
      'Motion',
      'Elevation',
      'Light theme',
      'Dark theme'
    ],
    eyebrow: 'Shared design language',
    href: '/docs/foundations',
    id: 'foundations',
    installNote:
      'Most applications should consume tokens through their platform package. Use the platform-neutral token package for tooling and custom adapters.',
    label: 'Foundations',
    packageName: '@santi020k/lumen-tokens',
    principles: [
      {
        description:
          'tokens/lumen.tokens.json is the canonical platform-neutral source for every generated adapter.',
        title: 'One token source'
      },
      {
        description:
          'Semantic purpose, variants, states, content rules, and accessibility expectations form the shared contract.',
        title: 'Shared intent'
      },
      {
        description:
          'Rendering, gestures, navigation, focus systems, and platform conventions stay inside each adapter.',
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

export const getDocsPlatform = (pathname: string): DocsPlatformId | undefined => docsPlatformPrefixes.find(
  ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
)?.[1]

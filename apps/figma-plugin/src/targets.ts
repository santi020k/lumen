export const versions = ['5.0.0', '4.4.0'] as const
export type LumenVersion = typeof versions[number]

const appearanceOptions = {
  project: 'Use project appearance',
  paper: 'Paper',
  field: 'Field',
  studio: 'Studio',
  glass: 'Glass',
  'santi020k-light': 'santi020k Light',
  'santi020k-dark': 'santi020k Dark'
} as const

export type Appearance = keyof typeof appearanceOptions

export type WebPlatform = 'astro' | 'react' | 'elements'
export const isWebPlatform = (value: unknown): value is WebPlatform => value === 'astro' || value === 'react' || value === 'elements'
export const adapterVersion = (platform: WebPlatform, version: LumenVersion) => version === '4.4.0' && platform !== 'astro' ? '4.3.0' : version

export interface WebTarget {
  platform?: WebPlatform
  version: LumenVersion
  appearance: Appearance
}

export const defaultTarget: WebTarget = { platform: 'astro', version: versions[0], appearance: 'project' }

export const platforms = {
  astro: { label: 'Astro', language: 'html', extension: 'astro' },
  react: { label: 'React', language: 'tsx', extension: 'tsx' },
  elements: { label: 'Web Components', language: 'html', extension: 'html' },
  'react-native': { label: 'React Native', language: 'tsx', extension: 'tsx' },
  compose: { label: 'Android · Jetpack Compose', language: 'kotlin', extension: 'kt' },
  'swiftui-ios': { label: 'iPhone · SwiftUI', language: 'swift', extension: 'swift' },
  'swiftui-macos': { label: 'Mac · SwiftUI', language: 'swift', extension: 'swift' }
} as const

export type Platform = keyof typeof platforms
export type NativePlatform = Exclude<Platform, WebPlatform>
export type NativeTarget =
  | { platform: 'react-native' | 'compose', version: '4.1.0', appearance: 'project' } |
  { platform: 'swiftui-ios' | 'swiftui-macos', version: '5.0.0', appearance: 'project' }
export type ExportTarget = WebTarget | NativeTarget
export const isNativeTarget = (target: ExportTarget): target is NativeTarget => {
  const platform = target.platform ?? 'astro'

  return !isWebPlatform(platform)
}
export const isPlatform = (value: unknown): value is Platform => typeof value === 'string' && Object.hasOwn(platforms, value)

export const defaultFor = (platform: Platform): ExportTarget => {
  if (isWebPlatform(platform)) return { ...defaultTarget, platform }

  if (platform === 'react-native' || platform === 'compose') return { platform, version: '4.1.0', appearance: 'project' }

  return { platform, version: '5.0.0', appearance: 'project' }
}

export const nativeBaseline = { 'react-native': 'iOS 15.1+ and Android API 24+', compose: 'Android API 23+', 'swiftui-ios': 'iOS 16+', 'swiftui-macos': 'macOS 13+' }
export const nativeSetup = {
  'react-native': 'Use @santi020k/lumen-react-native 4.1.0 with React 19.2+ and React Native 0.86.2+ (iOS 15.1+ or Android API 24+). Mount LumenProvider with scheme="system" at the app root, or keep the existing provider.',
  compose: 'Use com.santi020k:lumen-compose:4.1.0 in an Android app (API 23+). Place LumenSelection() inside your existing LumenTheme. Add the app package declaration to the generated Kotlin file.',
  'swiftui-ios': 'Link the LumenUI Swift package product (v5.0.0 contract, Swift tools 6.0) to the iPhone app target, iOS 16+. Present LumenSelection() under the existing app theme.',
  'swiftui-macos': 'Link the LumenUI Swift package product (v5.0.0 contract, Swift tools 6.0) to the Mac app target, macOS 13+. Present LumenSelection() under the existing app theme.'
} satisfies Record<NativePlatform, string>

export const isVersion = (value: unknown): value is LumenVersion => versions.some(version => version === value)

export const supportsAppearance = (version: LumenVersion, value: unknown): value is Appearance => typeof value === 'string' && Object.hasOwn(appearanceOptions, value) &&
  (version === '5.0.0' || (value !== 'paper' && value !== 'field'))

export const readTarget = (platform: unknown, version: unknown, appearance: unknown): ExportTarget | null => {
  const web = platform === undefined ? 'astro' : platform

  if (isWebPlatform(web)) {
    if (!isVersion(version) || !supportsAppearance(version, appearance)) return null

    return { platform: web, version, appearance }
  }

  if (!isPlatform(platform)) return null

  const native = defaultFor(platform)

  return version === native.version && appearance === 'project' ? native : null
}

export const appearancesFor = (version: LumenVersion) => Object.entries(appearanceOptions)
  .filter(([value]) => supportsAppearance(version, value))
  .map(([value, label]) => ({ value, label }))

export const layoutFor = ({ appearance, version }: WebTarget) => {
  const imports = ['import UIPrimitives from \'@santi020k/lumen-astro/runtime\'']
  const branded = appearance.startsWith('santi020k-')
  let attribute = ''

  if (appearance !== 'project') {
    attribute = branded ? ` data-theme="${appearance}"` : ` data-lumen-preset="${appearance}"`
  }

  if (version === '4.4.0') {
    imports.push('import \'@santi020k/lumen-astro/styles.css\'')
  } else if (appearance !== 'project') {
    const stylesheet = appearance === 'glass' ? 'effects/glass' : `themes/${branded ? 'santi020k' : appearance}`

    imports.push(`import '@santi020k/lumen-astro/styles/${stylesheet}.css'`)
  }

  return `---\n${imports.join('\n')}\n\ninterface Props { title: string }\n---\n<html lang="en"${attribute}>\n  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>{Astro.props.title}</title></head>\n  <body><slot /><UIPrimitives /></body>\n</html>\n`
}

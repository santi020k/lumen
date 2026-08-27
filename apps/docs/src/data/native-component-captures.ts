import manifest from './native-component-captures.json'
import type { NativePlatformId } from './native-components'

export interface NativeComponentCapture {
  alt: string
  device: string
  height: number
  platform: NativePlatformId
  sha256: string
  slug: string
  src: string
  width: number
}

const captures = manifest.captures as NativeComponentCapture[]

const captureByKey = new Map(
  captures.map(capture => [`${capture.platform}:${capture.slug}`, capture] as const)
)

export const findNativeComponentCapture = (
  platform: NativePlatformId,
  slug: string
): NativeComponentCapture | undefined => captureByKey.get(`${platform}:${slug}`)

export const getNativeComponentCapture = (
  platform: NativePlatformId,
  slug: string
): NativeComponentCapture => {
  const capture = findNativeComponentCapture(platform, slug)

  if (!capture) {
    throw new Error(`Missing native component capture for ${platform}/${slug}`)
  }

  return capture
}

export const nativeComponentCaptures = captures

export type LumenDeviceFrameDevice = 'laptop' | 'desktop' | 'iphone' | 'android' | 'tablet'
export type LumenDeviceFrameOrientation = 'portrait' | 'landscape'
export type LumenDeviceFrameTone = 'light' | 'dark'

export const lumenDeviceFrameSizes = {
  android: [412, 915],
  desktop: [1440, 900],
  iphone: [390, 844],
  laptop: [1280, 800],
  tablet: [820, 1180]
} as const

const dimension = (value: unknown, fallback: number): number => typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 16384 ? value : fallback

export const resolveLumenDeviceFrame = (
  device: LumenDeviceFrameDevice = 'laptop', orientation?: LumenDeviceFrameOrientation,
  width?: number, height?: number
): { width: number, height: number } => {
  const presets: Partial<Record<string, readonly [number, number]>> = lumenDeviceFrameSizes
  const defaults = presets[device] ?? lumenDeviceFrameSizes.laptop
  const first = dimension(width, defaults[0])
  const second = dimension(height, defaults[1])

  if (!orientation) return { height: second, width: first }

  return orientation === 'landscape' ?
    { height: Math.min(first, second), width: Math.max(first, second) } :
    { height: Math.max(first, second), width: Math.min(first, second) }
}

/** Scale iframe viewports without changing their CSS layout width. Slots remain responsive HTML. */
export const observeLumenDeviceFrame = (screen: HTMLElement, width: number): (() => void) => {
  const view = screen.ownerDocument.defaultView

  const update = (): void => {
    const available = screen.clientWidth

    if (available > 0) screen.style.setProperty('--ui-device-frame-scale', String(available / width))
  }

  const observer = view?.ResizeObserver ? new view.ResizeObserver(update) : undefined

  observer?.observe(screen)

  view?.addEventListener('resize', update)

  update()

  return () => {
    observer?.disconnect()

    view?.removeEventListener('resize', update)

    screen.style.removeProperty('--ui-device-frame-scale')
  }
}

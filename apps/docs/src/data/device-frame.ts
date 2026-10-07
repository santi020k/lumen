import type { LumenDeviceFrameDevice, LumenDeviceFrameOrientation } from '@santi020k/lumen-core'

interface DeviceExample {
  device: LumenDeviceFrameDevice
  label: string
  detail: string
  viewport: string
  orientation?: LumenDeviceFrameOrientation
}

export const deviceExamples = [
  { device: 'macbook-pro', label: 'MacBook Pro', detail: 'A notched display, rounded lid, and substantial front edge.', viewport: '1280 × 800' },
  { device: 'macbook-air', label: 'MacBook Air', detail: 'A slim lid, tapered deck, and recessed center grip.', viewport: '1280 × 800' },
  { device: 'imac', label: 'iMac', detail: 'A wide canvas, sculpted chin, and curved aluminum stand.', viewport: '1440 × 810' },
  { device: 'iphone', label: 'iPhone', detail: 'Inset glass, shaped notch, and individually modeled side controls.', viewport: '390 × 844' },
  { device: 'pixel', label: 'Google Pixel', detail: 'A punch-hole camera, soft corners, and a clean side rail.', viewport: '412 × 915' },
  { device: 'ipad-pro', label: 'iPad Pro', detail: 'Flat edges, even bezels, and a landscape camera. No Home button.', viewport: '1194 × 834', orientation: 'landscape' }
] as const satisfies readonly DeviceExample[]

export const deviceFrameQuickStart = `---
import { DeviceFrame } from '@santi020k/lumen-astro'
---

<DeviceFrame device="macbook-pro" color="white">
  <iframe
    src="/device-frame-demo"
    title="Lumen component workspace"
    loading="lazy"
    sandbox=""
  ></iframe>
</DeviceFrame>`

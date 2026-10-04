import { encode } from 'uqr'

export type LumenQRCodeCorrection = 'L' | 'M' | 'Q' | 'H'
export type LumenQRCodeResult =
  | { status: 'ready', modules: readonly (readonly boolean[])[], dimension: number } |
  { status: 'error', reason: 'empty' | 'capacity' | 'options' }

/** Offline UTF-8 QR encoding. Quiet zone is measured in modules, not pixels. */
export const encodeLumenQRCode = (value: string, correction: LumenQRCodeCorrection = 'M', quietZone = 4): LumenQRCodeResult => {
  if (!Number.isInteger(quietZone) || quietZone < 4 || quietZone > 32 || !['L', 'M', 'Q', 'H'].includes(correction)) return { status: 'error', reason: 'options' }

  if (!value.length) return { status: 'error', reason: 'empty' }

  // Bound hostile inputs before invoking the encoder; QR numeric capacity is at most 7089 characters.
  if (value.length > 7089) return { status: 'error', reason: 'capacity' }

  try {
    const result = encode(value, { ecc: correction, boostEcc: false, border: quietZone })

    return { status: 'ready', modules: result.data, dimension: result.size }
  } catch {
    return { status: 'error', reason: 'capacity' }
  }
}

export const lumenQRCodePath = (modules: readonly (readonly boolean[])[]): string => modules.flatMap((row, y) => row.flatMap((dark, x) => dark ? [`M${x} ${y}h1v1h-1z`] : [])).join('')

export const lumenSkeletonShapes = ['rectangle', 'text', 'circle'] as const

export type LumenSkeletonShape = (typeof lumenSkeletonShapes)[number]

export const lumenSkeletonAnimations = ['shimmer', 'pulse', 'none'] as const

export type LumenSkeletonAnimation = (typeof lumenSkeletonAnimations)[number]

export type LumenSkeletonSize = number | string

export interface LumenProgressState {
  max: number
  percentage: number
  value: number
}

export interface LumenLoadingSemanticsInput {
  ariaHidden?: boolean | string | null | undefined
  ariaLabel?: string | null | undefined
  ariaLabelledby?: string | null | undefined
  role?: string | null | undefined
}

export interface LumenLoadingSemantics {
  ariaHidden: 'true' | undefined
  role: 'status' | undefined
}

const defaultProgressMax = 100
const maxSizeLength = 64

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined

  if (typeof value !== 'string' || !value.trim()) return undefined

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Normalizes progress input to finite ARIA values. Non-finite or non-positive maxima fall back to
 * 100, and missing or non-finite values fall back to 0 before clamping.
 */
export const normalizeLumenProgress = (max?: unknown, value?: unknown): LumenProgressState => {
  const finiteMax = toFiniteNumber(max)
  const safeMax = finiteMax !== undefined && finiteMax > 0 ? finiteMax : defaultProgressMax
  const safeValue = Math.min(safeMax, Math.max(0, toFiniteNumber(value) ?? 0))

  return { max: safeMax, percentage: (safeValue / safeMax) * 100, value: safeValue }
}

export const resolveLumenSkeletonShape = (value: unknown): LumenSkeletonShape => (
  lumenSkeletonShapes.find(shape => shape === value) ?? 'rectangle'
)

export const resolveLumenSkeletonAnimation = (value: unknown): LumenSkeletonAnimation => (
  lumenSkeletonAnimations.find(animation => animation === value) ?? 'shimmer'
)

// Letters keep their case because custom property names in var() are case-sensitive.
const isSafeSizeCharacter = (character: string): boolean => (
  (character >= 'a' && character <= 'z') ||
  (character >= 'A' && character <= 'Z') ||
  (character >= '0' && character <= '9') ||
  '%.+-*/(), _'.includes(character)
)

/**
 * Resolves a Skeleton width or height to a CSS length. Finite non-negative numbers become pixels;
 * strings may be lengths, percentages, or math and `var()` expressions, limited to ASCII letters,
 * digits, and math characters so they cannot add declarations.
 */
const toPixelSize = (value: number): string | undefined => (
  Number.isFinite(value) && value >= 0 ? `${value}px` : undefined
)

const isSafeSizeExpression = (size: string): boolean => {
  if (!size || size.length > maxSizeLength) return false

  for (const character of size) {
    if (!isSafeSizeCharacter(character)) return false
  }

  return true
}

export const resolveLumenSkeletonSize = (value: unknown): string | undefined => {
  if (typeof value === 'number') return toPixelSize(value)

  if (typeof value !== 'string') return undefined

  const size = value.trim()

  if (!isSafeSizeExpression(size)) return undefined

  const pixels = toFiniteNumber(size)

  return pixels === undefined ? size : toPixelSize(pixels)
}

/**
 * Loading indicators are decorative unless named. A named indicator becomes a status region, and
 * explicit `aria-hidden` or `role` values always win.
 */
export const resolveLumenLoadingSemantics = ({
  ariaHidden,
  ariaLabel,
  ariaLabelledby,
  role
}: LumenLoadingSemanticsInput): LumenLoadingSemantics => {
  const isNamed = Boolean(ariaLabel?.trim() || ariaLabelledby?.trim())
  const hasExplicitHidden = ariaHidden !== undefined && ariaHidden !== null
  const hasExplicitRole = role !== undefined && role !== null

  return {
    ariaHidden: hasExplicitHidden || isNamed ? undefined : 'true',
    role: hasExplicitRole || !isNamed ? undefined : 'status'
  }
}

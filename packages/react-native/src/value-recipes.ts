export interface LumenSliderValue {
  max: number
  min: number
  percentage: number
  step: number
  value: number
}

const finiteOr = (value: number, fallback: number): number => (
  Number.isFinite(value) ? value : fallback
)

export const resolveLumenSliderValue = (
  value: number,
  min: number,
  max: number,
  step?: number
): LumenSliderValue => {
  const safeMin = finiteOr(min, 0)
  const candidateMax = finiteOr(max, safeMin + 100)
  const safeMax = candidateMax > safeMin ? candidateMax : safeMin + 100
  const range = safeMax - safeMin
  const safeStep = Number.isFinite(step) && (step ?? 0) > 0 ? Math.min(step ?? 1, range) : range / 100
  const finiteValue = finiteOr(value, safeMin)
  const clampedValue = Math.min(safeMax, Math.max(safeMin, finiteValue))
  const stepIndex = Math.round((clampedValue - safeMin) / safeStep)
  const steppedValue = Math.min(safeMax, Math.max(safeMin, safeMin + stepIndex * safeStep))

  return {
    max: safeMax,
    min: safeMin,
    percentage: ((steppedValue - safeMin) / range) * 100,
    step: safeStep,
    value: steppedValue
  }
}

export const resolveLumenSliderPosition = (
  position: number,
  width: number,
  value: LumenSliderValue
): number => {
  if (!Number.isFinite(width) || width <= 0) return value.value

  const safePosition = Math.min(width, Math.max(0, finiteOr(position, 0)))
  const rawValue = value.min + (safePosition / width) * (value.max - value.min)

  return resolveLumenSliderValue(rawValue, value.min, value.max, value.step).value
}

export const stepLumenSliderValue = (
  value: LumenSliderValue,
  direction: 'decrement' | 'increment'
): number => resolveLumenSliderValue(
  value.value + (direction === 'increment' ? value.step : -value.step),
  value.min,
  value.max,
  value.step
).value

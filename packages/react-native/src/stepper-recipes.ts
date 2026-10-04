export type LumenStepState = 'complete' | 'current' | 'upcoming'

/** The final index (length) means every step is complete. */
export const resolveLumenStepState = (index: number, currentStep: number, count: number): LumenStepState => {
  const current = Number.isFinite(currentStep) ? Math.min(count, Math.max(0, Math.trunc(currentStep))) : 0

  if (index < current) return 'complete'

  return index === current ? 'current' : 'upcoming'
}

export type LumenStepState = 'complete' | 'current' | 'upcoming'

/** The final index (length) means every step is complete. */
export const resolveLumenStepState = (index: number, currentStep: number, count: number): LumenStepState => {
  const current = Number.isFinite(currentStep) ? Math.min(count, Math.max(0, Math.trunc(currentStep))) : 0

  if (index < current) return 'complete'

  return index === current ? 'current' : 'upcoming'
}

/** Stable IDs must be nonempty and unique within the displayed progression. */
export const isLumenStepItemsValid = (steps: readonly { readonly id: string }[]): boolean => {
  const ids = new Set<string>()

  for (const step of steps) {
    if (!step.id.trim() || ids.has(step.id)) return false

    ids.add(step.id)
  }

  return true
}

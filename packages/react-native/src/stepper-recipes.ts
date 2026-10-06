export type LumenStepState = 'complete' | 'current' | 'upcoming'

/** The final index (length) means every step is complete. */
export const resolveLumenStepState = (index: number, currentStep: number, count: number): LumenStepState => {
  const current = Number.isFinite(currentStep) ? Math.min(count, Math.max(0, Math.trunc(currentStep))) : 0

  if (index < current) return 'complete'

  return index === current ? 'current' : 'upcoming'
}

const isStepItem = (input: unknown): input is { readonly id: string } => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false

  return 'id' in input && typeof input.id === 'string' &&
    ['title', 'description'].every(key => !(key in input) || Reflect.get(input, key) === undefined || typeof Reflect.get(input, key) === 'string')
}

/** Stable IDs must be nonempty and unique within the displayed progression. */
export const isLumenStepItemsValid = (steps: readonly { readonly id: string }[]): boolean => {
  if (!Array.isArray(steps)) return false

  const ids = new Set<string>()
  const inputs: readonly unknown[] = steps

  for (const input of inputs) {
    if (!isStepItem(input) || !input.id.trim() || ids.has(input.id)) return false

    ids.add(input.id)
  }

  return true
}

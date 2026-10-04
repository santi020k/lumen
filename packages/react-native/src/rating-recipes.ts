/** Whole-star rating; zero denotes unrated. Limit work for untrusted input. */
export const resolveLumenRating = (value: number, max = 5): { max: number, value: number } => {
  const resolvedMax = Number.isFinite(max) ? Math.min(100, Math.max(1, Math.trunc(max))) : 5

  return {
    max: resolvedMax,
    value: Number.isFinite(value) ? Math.min(resolvedMax, Math.max(0, Math.trunc(value))) : 0
  }
}

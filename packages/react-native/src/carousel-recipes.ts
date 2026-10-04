export interface LumenCarouselSlide { id: string, label: string }
export type LumenCarouselState =
  | { status: 'ready', count: number, index: number, previous: number | null, next: number | null } |
  { status: 'empty' | 'invalid' }

export const resolveLumenCarousel = (slides: readonly LumenCarouselSlide[], index: number): LumenCarouselState => {
  if (!slides.length) return { status: 'empty' }

  if (!Number.isInteger(index) || index < 0 || index >= slides.length) return { status: 'invalid' }

  const used = new Set<string>()

  for (const slide of slides) {
    if (!slide.id.length || used.has(slide.id)) return { status: 'invalid' }

    used.add(slide.id)
  }

  return { status: 'ready',
    count: slides.length,
    index,
    previous: index > 0 ? index - 1 : null,
    next: index < slides.length - 1 ? index + 1 : null }
}

export const lumenCarouselTarget = (state: LumenCarouselState, requested: number): number | null => {
  if (state.status !== 'ready' || !Number.isInteger(requested) || requested < 0 ||
    requested >= state.count || requested === state.index) return null

  return requested
}

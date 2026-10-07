export const formats = ['portrait', 'square', 'landscape'] as const
export const duration = 15
export const outroStart = 11.5
export const outroDuration = duration - outroStart

export const appearances = [
  { name: 'Lumen Light', label: 'Light', headline: 'Make room for clarity.', scheme: 'light', preset: 'default', theme: 'lumen-light', start: 0, still: 2 },
  { name: 'Lumen Dark', label: 'Dark', headline: 'Find your focus.', scheme: 'dark', preset: 'default', theme: 'lumen-dark', start: 2.6, still: 3.8 },
  { name: 'Glass', label: 'Glass', headline: 'Let light through.', scheme: 'light', preset: 'glass', theme: 'lumen-light', start: 5, still: 6.6 },
  { name: 'Studio', label: 'Studio', headline: 'Keep it essential.', scheme: 'light', preset: 'studio', theme: 'lumen-light', start: 8, still: 9 }
] as const

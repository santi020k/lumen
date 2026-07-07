import { santi020kShikiThemes } from '@santi020k/theme/shiki'

type CodeThemes = Record<'dark' | 'light', unknown>

const lumenLightTokenColors = [
  {
    scope: ['comment', 'punctuation.definition.comment'],
    settings: { fontStyle: 'italic', foreground: '#64748b' }
  },
  {
    scope: ['constant', 'number', 'support.constant', 'variable.other.constant'],
    settings: { foreground: '#0d9488' }
  },
  {
    scope: ['entity.name.function', 'meta.function-call', 'support.function'],
    settings: { foreground: '#0369a1' }
  },
  {
    scope: ['entity.name.tag', 'keyword', 'storage', 'support.type'],
    settings: { foreground: '#2563eb' }
  },
  {
    scope: ['entity.other.attribute-name', 'variable'],
    settings: { foreground: '#0f766e' }
  },
  {
    scope: ['string', 'string.quoted'],
    settings: { foreground: '#15803d' }
  },
  {
    scope: ['punctuation', 'meta.brace'],
    settings: { foreground: '#475569' }
  }
]

const lumenDarkTokenColors = [
  {
    scope: ['comment', 'punctuation.definition.comment'],
    settings: { fontStyle: 'italic', foreground: '#94a3b8' }
  },
  {
    scope: ['constant', 'number', 'support.constant', 'variable.other.constant'],
    settings: { foreground: '#5eead4' }
  },
  {
    scope: ['entity.name.function', 'meta.function-call', 'support.function'],
    settings: { foreground: '#7dd3fc' }
  },
  {
    scope: ['entity.name.tag', 'keyword', 'storage', 'support.type'],
    settings: { foreground: '#38bdf8' }
  },
  {
    scope: ['entity.other.attribute-name', 'variable'],
    settings: { foreground: '#2dd4bf' }
  },
  {
    scope: ['string', 'string.quoted'],
    settings: { foreground: '#86efac' }
  },
  {
    scope: ['punctuation', 'meta.brace'],
    settings: { foreground: '#cbd5e1' }
  }
]

export const lumenShikiThemes = {
  dark: {
    name: 'lumen dark',
    type: 'dark',
    colors: {
      'editor.background': '#111827',
      'editor.foreground': '#f8fafc'
    },
    semanticHighlighting: true,
    tokenColors: lumenDarkTokenColors
  },
  light: {
    name: 'lumen light',
    type: 'light',
    colors: {
      'editor.background': '#f8fafc',
      'editor.foreground': '#0f172a'
    },
    semanticHighlighting: true,
    tokenColors: lumenLightTokenColors
  }
} as const

export const cachedSanti020kThemes = santi020kShikiThemes as unknown as CodeThemes

export const cachedLumenThemes = lumenShikiThemes as unknown as CodeThemes

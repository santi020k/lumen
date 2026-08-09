/// <reference types="astro/client" />

declare module '@santi020k/theme/shiki' {
  interface Santi020kShikiTheme {
    colors: Record<string, string>
    name: string
    semanticHighlighting?: boolean
    tokenColors: {
      scope?: string | string[]
      settings: {
        background?: string
        fontStyle?: string
        foreground?: string
      }
    }[]
    type: 'dark' | 'light'
  }

  export const santi020kShikiThemes: {
    dark: Santi020kShikiTheme
    hcDark: Santi020kShikiTheme
    hcLight: Santi020kShikiTheme
    light: Santi020kShikiTheme
  }
}

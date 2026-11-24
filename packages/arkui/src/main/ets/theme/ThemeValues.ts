import type { LumenColorPalette } from '../tokens/Tokens.generated'
import { LumenColors } from '../tokens/Tokens.generated'

export enum LumenColorSchemePreference {
  System,
  Light,
  Dark
}

/** The resolved palette and scheme that `LumenTheme` provides to Lumen components. */
export class LumenThemeValues {
  readonly colors: LumenColorPalette
  readonly isDark: boolean

  constructor(colors: LumenColorPalette, isDark: boolean) {
    this.colors = colors

    this.isDark = isDark
  }
}

export const resolveLumenIsDark = (
  preference: LumenColorSchemePreference,
  systemIsDark: boolean
): boolean => {
  if (preference === LumenColorSchemePreference.Dark) return true

  if (preference === LumenColorSchemePreference.Light) return false

  return systemIsDark
}

export const lumenThemeValues = (
  isDark: boolean,
  lightColors: LumenColorPalette = LumenColors.light,
  darkColors: LumenColorPalette = LumenColors.dark
): LumenThemeValues => new LumenThemeValues(isDark ? darkColors : lightColors, isDark)

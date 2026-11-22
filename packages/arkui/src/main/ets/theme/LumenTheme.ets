import { mediaquery } from '@kit.ArkUI'
import { LumenColorPalette, LumenColors } from '../tokens/Tokens.generated'
import {
  LumenColorSchemePreference,
  LumenThemeValues,
  lumenThemeValues,
  resolveLumenIsDark
} from './ThemeValues'

/**
 * Publishes Lumen's semantic palette to every Lumen component in the application. Follows the
 * system color mode unless `colorScheme` forces light or dark. Render one `LumenTheme` at the
 * application root: the palette is application-wide, so a second instance replaces the first.
 * `lightColors` and `darkColors` are read once, when the component appears.
 */
@Component
export struct LumenTheme {
  @Prop @Watch('onColorSchemeChange') colorScheme: LumenColorSchemePreference =
    LumenColorSchemePreference.System
  @Prop fillsParent: boolean = true
  lightColors: LumenColorPalette = LumenColors.light
  darkColors: LumenColorPalette = LumenColors.dark
  private systemIsDark: boolean = false
  private schemeListener?: mediaquery.MediaQueryListener

  @Builder
  emptyContent() {
  }

  @BuilderParam content: () => void = this.emptyContent

  aboutToAppear(): void {
    const listener = this.getUIContext().getMediaQuery().matchMediaSync('(dark-mode: true)')

    this.schemeListener = listener
    this.systemIsDark = listener.matches
    listener.on('change', (result: mediaquery.MediaQueryResult) => {
      this.systemIsDark = result.matches
      this.applyTheme()
    })
    this.applyTheme()
  }

  aboutToDisappear(): void {
    this.schemeListener?.off('change')
  }

  onColorSchemeChange(_propertyName: string): void {
    this.applyTheme()
  }

  private applyTheme(): void {
    AppStorage.setOrCreate<LumenThemeValues>('lumenTheme', lumenThemeValues(
      resolveLumenIsDark(this.colorScheme, this.systemIsDark),
      this.lightColors,
      this.darkColors
    ))
  }

  build() {
    Stack({ alignContent: Alignment.TopStart }) {
      this.content()
    }
    .constraintSize({
      minWidth: this.fillsParent ? '100%' : 0,
      minHeight: this.fillsParent ? '100%' : 0
    })
  }
}

import { LumenThemeValues, lumenThemeValues } from '../theme/ThemeValues'
import { LumenTextTone, LumenTextVariant, lumenTextColor, lumenTextStyle } from './Styles'

/** Body, caption, label, and title text in the active Lumen palette. Sizes follow font scaling. */
@Component
export struct LumenText {
  @Prop text: ResourceStr = ''
  @Prop variant: LumenTextVariant = LumenTextVariant.Body
  @Prop tone: LumenTextTone = LumenTextTone.Default
  @StorageProp('lumenTheme') lumenTheme: LumenThemeValues = lumenThemeValues(false)

  build() {
    Text(this.text)
      .fontSize(lumenTextStyle(this.variant).fontSize)
      .fontWeight(lumenTextStyle(this.variant).fontWeight)
      .fontColor(lumenTextColor(this.lumenTheme.colors, this.tone))
  }
}

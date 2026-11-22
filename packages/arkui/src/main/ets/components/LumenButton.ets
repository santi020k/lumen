import { LumenThemeValues, lumenThemeValues } from '../theme/ThemeValues'
import { LumenRadius, LumenSpacing, LumenTypography } from '../tokens/Tokens.generated'
import {
  LumenButtonIntent,
  LumenControlSize,
  lumenButtonPalette,
  lumenControlMetrics,
  lumenDisabledOpacity
} from './Styles'

/**
 * Text button with Lumen intents and control sizes. While `loading`, the button shows progress,
 * keeps its label, describes the state to assistive technology, and ignores repeat activation.
 */
@Component
export struct LumenButton {
  @Prop label: ResourceStr = ''
  @Prop intent: LumenButtonIntent = LumenButtonIntent.Primary
  @Prop controlSize: LumenControlSize = LumenControlSize.Md
  @Prop loading: boolean = false
  @Prop loadingLabel: string = 'Loading'
  @Prop isDisabled: boolean = false
  onPress: () => void = () => {
  }
  @StorageProp('lumenTheme') lumenTheme: LumenThemeValues = lumenThemeValues(false)

  build() {
    Button({ type: ButtonType.Normal, stateEffect: true }) {
      Row({ space: LumenSpacing.sm }) {
        if (this.loading) {
          LoadingProgress()
            .width(LumenSpacing.lg)
            .height(LumenSpacing.lg)
            .color(lumenButtonPalette(this.lumenTheme.colors, this.intent).foreground)
        }
        Text(this.label)
          .fontSize(LumenTypography.smSize)
          .fontWeight(LumenTypography.semiboldWeight)
          .fontColor(lumenButtonPalette(this.lumenTheme.colors, this.intent).foreground)
      }
      .justifyContent(FlexAlign.Center)
      .padding({
        left: lumenControlMetrics(this.controlSize).horizontalPadding,
        right: lumenControlMetrics(this.controlSize).horizontalPadding,
        top: LumenSpacing.sm,
        bottom: LumenSpacing.sm
      })
    }
    .constraintSize({ minHeight: lumenControlMetrics(this.controlSize).minHeight })
    .backgroundColor(lumenButtonPalette(this.lumenTheme.colors, this.intent).background)
    .borderRadius(LumenRadius.sm)
    .borderWidth(1)
    .borderColor(lumenButtonPalette(this.lumenTheme.colors, this.intent).border)
    .enabled(!this.isDisabled && !this.loading)
    .opacity(this.isDisabled || this.loading ? lumenDisabledOpacity : 1)
    .accessibilityDescription(this.loading ? this.loadingLabel : '')
    .onClick(() => {
      this.onPress()
    })
  }
}

import { LumenThemeValues, lumenThemeValues } from '../theme/ThemeValues'
import {
  LumenCardVariant,
  LumenSurfacePadding,
  LumenSurfaceRadius,
  lumenCardPalette,
  lumenDisabledOpacity,
  lumenSurfacePadding,
  lumenSurfaceRadius
} from './Styles'

/**
 * Neutral or semantic bordered container. Passing `onPress` renders the card as a native button.
 * It hugs its content unless `fillsWidth` is set.
 */
@Component
export struct LumenCard {
  @Prop variant: LumenCardVariant = LumenCardVariant.Default
  @Prop inset: LumenSurfacePadding = LumenSurfacePadding.Xl
  @Prop cornerRadius: LumenSurfaceRadius = LumenSurfaceRadius.Lg
  @Prop isDisabled: boolean = false
  @Prop fillsWidth: boolean = false
  onPress?: () => void
  @StorageProp('lumenTheme') lumenTheme: LumenThemeValues = lumenThemeValues(false)

  @Builder
  emptyContent() {
  }

  @BuilderParam content: () => void = this.emptyContent

  @Styles
  cardFrame() {
    .constraintSize({ minWidth: this.fillsWidth ? '100%' : 0 })
    .backgroundColor(lumenCardPalette(this.lumenTheme.colors, this.variant).background)
    .borderRadius(lumenSurfaceRadius(this.cornerRadius))
    .borderWidth(1)
    .borderColor(lumenCardPalette(this.lumenTheme.colors, this.variant).border)
  }

  build() {
    if (this.onPress === undefined) {
      Column() {
        this.content()
      }
      .alignItems(HorizontalAlign.Start)
      .padding(lumenSurfacePadding(this.inset))
      .cardFrame()
    } else {
      Button({ type: ButtonType.Normal, stateEffect: true }) {
        Column() {
          this.content()
        }
        .alignItems(HorizontalAlign.Start)
        .padding(lumenSurfacePadding(this.inset))
      }
      .cardFrame()
      .enabled(!this.isDisabled)
      .opacity(this.isDisabled ? lumenDisabledOpacity : 1)
      .onClick(() => {
        this.onPress?.()
      })
    }
  }
}

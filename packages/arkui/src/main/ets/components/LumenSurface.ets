import { LumenThemeValues, lumenThemeValues } from '../theme/ThemeValues'
import {
  LumenSurfacePadding,
  LumenSurfaceRadius,
  LumenSurfaceTone,
  lumenSurfaceColor,
  lumenSurfacePadding,
  lumenSurfaceRadius
} from './Styles'

/**
 * Semantic background container with token padding and radius. It hugs its content unless
 * `fillsWidth` is set, because ArkUI ignores universal attributes on trailing-closure components.
 */
@Component
export struct LumenSurface {
  @Prop tone: LumenSurfaceTone = LumenSurfaceTone.Surface
  @Prop inset: LumenSurfacePadding = LumenSurfacePadding.Md
  @Prop cornerRadius: LumenSurfaceRadius = LumenSurfaceRadius.Md
  @Prop fillsWidth: boolean = false
  @StorageProp('lumenTheme') lumenTheme: LumenThemeValues = lumenThemeValues(false)

  @Builder
  emptyContent() {
  }

  @BuilderParam content: () => void = this.emptyContent

  build() {
    Column() {
      this.content()
    }
    .alignItems(HorizontalAlign.Start)
    .constraintSize({ minWidth: this.fillsWidth ? '100%' : 0 })
    .padding(lumenSurfacePadding(this.inset))
    .backgroundColor(lumenSurfaceColor(this.lumenTheme.colors, this.tone))
    .borderRadius(lumenSurfaceRadius(this.cornerRadius))
  }
}

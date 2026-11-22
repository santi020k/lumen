import { LumenThemeValues, lumenThemeValues } from '../theme/ThemeValues'
import { LumenRadius, LumenSpacing, LumenTypography } from '../tokens/Tokens.generated'
import {
  LumenControlSize,
  lumenControlMetrics,
  lumenDisabledOpacity,
  lumenFieldDescription,
  resolveLumenFieldError
} from './Styles'

/**
 * Single-line text entry with a visible label. Assistive technology reads the entered value,
 * then the label and `errorMessage` as the input's description.
 */
@Component
export struct LumenTextField {
  @Prop value: string = ''
  @Prop label: string = ''
  @Prop placeholder: string = ''
  @Prop controlSize: LumenControlSize = LumenControlSize.Md
  @Prop invalid: boolean = false
  @Prop errorMessage: string = ''
  @Prop isDisabled: boolean = false
  @Prop inputType: InputType = InputType.Normal
  onValueChange: (value: string) => void = (_value: string) => {
  }
  @State private focused: boolean = false
  @StorageProp('lumenTheme') lumenTheme: LumenThemeValues = lumenThemeValues(false)

  private fieldBorderColor(): string {
    if (resolveLumenFieldError(this.invalid, this.errorMessage)) {
      return this.lumenTheme.colors.danger
    }

    return this.focused ? this.lumenTheme.colors.brand : this.lumenTheme.colors.line
  }

  build() {
    Column({ space: LumenSpacing.xs }) {
      if (this.label.length > 0) {
        Text(this.label)
          .fontSize(LumenTypography.smSize)
          .fontWeight(LumenTypography.mediumWeight)
          .fontColor(this.lumenTheme.colors.inkSoft)
          .accessibilityLevel('no')
      }

      TextInput({ text: this.value, placeholder: this.placeholder })
        .type(this.inputType)
        .width('100%')
        .constraintSize({ minHeight: lumenControlMetrics(this.controlSize).minHeight })
        .padding({
          left: lumenControlMetrics(this.controlSize).horizontalPadding,
          right: lumenControlMetrics(this.controlSize).horizontalPadding,
          top: LumenSpacing.sm,
          bottom: LumenSpacing.sm
        })
        .fontSize(LumenTypography.mdSize)
        .fontColor(this.lumenTheme.colors.ink)
        .placeholderColor(this.lumenTheme.colors.inkMuted)
        .caretColor(this.lumenTheme.colors.brand)
        .backgroundColor(this.lumenTheme.colors.surface)
        .borderRadius(LumenRadius.sm)
        .borderWidth(1)
        .borderColor(this.fieldBorderColor())
        .enabled(!this.isDisabled)
        .opacity(this.isDisabled ? lumenDisabledOpacity : 1)
        .accessibilityDescription(lumenFieldDescription(this.label, this.errorMessage))
        .onChange((value: string) => {
          this.onValueChange(value)
        })
        .onFocus(() => {
          this.focused = true
        })
        .onBlur(() => {
          this.focused = false
        })

      if (this.errorMessage.length > 0) {
        Text(this.errorMessage)
          .fontSize(LumenTypography.xsSize)
          .fontColor(this.lumenTheme.colors.danger)
          .accessibilityLevel('no')
      }
    }
    .alignItems(HorizontalAlign.Start)
  }
}

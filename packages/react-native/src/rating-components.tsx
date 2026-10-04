import type { ReactElement } from 'react'
import { Pressable, View, type ViewProps } from 'react-native'

import { LumenStarIconGraphic } from './static-icons/star.generated.js'
import { LumenText } from './primitives.js'
import { useLumenRadioKeyboard } from './radio-keyboard.js'
import { resolveLumenRating } from './rating-recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenRatingProps extends Omit<ViewProps, 'children'> {
  label: string
  value: number
  onValueChange: (value: number) => void
  max?: number
  disabled?: boolean
  readOnly?: boolean
  formatOption?: (value: number, max: number) => string
}

const formatRatingOption = (rating: number, total: number): string => `${rating} / ${total}`

export const LumenRating = ({
  label,
  value,
  onValueChange,
  max = 5,
  disabled = false,
  readOnly = false,
  formatOption = formatRatingOption,
  style,
  ...props
}: LumenRatingProps): ReactElement => {
  const theme = useLumenTheme()
  const rating = resolveLumenRating(value, max)

  const keyboard = useLumenRadioKeyboard(Array.from({ length: rating.max }, () => disabled || readOnly), index => {
    if (!disabled && !readOnly) onValueChange(index + 1)
  })

  return (
    <View {...props} style={style}>
      <LumenText>{label}</LumenText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}
      >
        {Array.from({ length: rating.max }, (_, index) => index + 1).map(option => (
          <Pressable
            key={option}
            ref={node => {
              keyboard.setRef(option - 1, node)
            }}
            accessibilityRole="radio"
            accessibilityLabel={formatOption(option, rating.max)}
            aria-checked={rating.value === option}
            aria-disabled={disabled || readOnly}
            accessibilityState={{ checked: rating.value === option,
              disabled: disabled || readOnly,
              selected: rating.value === option }}
            disabled={disabled || readOnly}
            onKeyDown={event => {
              keyboard.onKeyDown(option - 1, event)
            }}
            onPress={() => {
              if (!disabled && !readOnly) onValueChange(option)
            }}
            style={{ alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              minWidth: 44,
              opacity: disabled ? 0.52 : 1 }}
          >
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <LumenStarIconGraphic color={option <= rating.value ? theme.colors.brandSolid : theme.colors.inkMuted} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

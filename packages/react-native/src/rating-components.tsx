import type { ReactElement } from 'react'
import { Pressable, View, type ViewProps } from 'react-native'

import { LumenStarIconGraphic } from './static-icons/star.generated.js'
import { LumenText } from './primitives.js'
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
            accessibilityRole="radio"
            accessibilityLabel={formatOption(option, rating.max)}
            accessibilityState={{ disabled: disabled || readOnly, selected: rating.value === option }}
            disabled={disabled || readOnly}
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

import type { ReactElement } from 'react'
import { ScrollView, Text, View, type ViewProps } from 'react-native'

import { LumenText } from './primitives.js'
import { type LumenStepState, resolveLumenStepState } from './stepper-recipes.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenStepItem {
  id: string
  title: string
  description?: string
}

export interface LumenStepperProps extends Omit<ViewProps, 'children'> {
  label: string
  steps: readonly LumenStepItem[]
  currentStep: number
  orientation?: 'horizontal' | 'vertical'
  formatState?: (state: LumenStepState) => string
}

const formatStepState = (state: LumenStepState): string => ({
  complete: 'Complete', current: 'Current', upcoming: 'Upcoming'
})[state]

export const LumenStepper = ({ label, steps, currentStep, orientation = 'vertical',
  formatState = formatStepState, style, ...props }: LumenStepperProps): ReactElement => {
  const theme = useLumenTheme()
  const horizontal = orientation === 'horizontal'

  const content = (
    <View style={{ flexDirection: horizontal ? 'row' : 'column', gap: theme.spacing.md }}>
      {steps.map((step, index) => {
        const state = resolveLumenStepState(index, currentStep, steps.length)

        return (
          <View
            key={step.id}
            accessible
            accessibilityLabel={`${index + 1} / ${steps.length}, ${step.title}${step.description ? `, ${step.description}` : ''}`}
            accessibilityValue={{ text: formatState(state) }}
            accessibilityState={{ selected: state === 'current' }}
            style={{ alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm, width: horizontal ? 220 : undefined }}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ alignItems: 'center',
                justifyContent: 'center',
                minWidth: 32,
                minHeight: 32,
                borderRadius: theme.radii.full,
                backgroundColor: state === 'upcoming' ? theme.colors.surfaceMuted : theme.colors.brandSolid }}
            >
              <Text style={{ color: state === 'upcoming' ? theme.colors.ink : theme.colors.onBrand }}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <LumenText>{step.title}</LumenText>
              {step.description ? <LumenText>{step.description}</LumenText> : null}
              <LumenText>{formatState(state)}</LumenText>
            </View>
          </View>
        )
      })}
    </View>
  )

  return (
    <View {...props} accessibilityLabel={label} style={style}>
      {horizontal ? <ScrollView horizontal>{content}</ScrollView> : content}
    </View>
  )
}

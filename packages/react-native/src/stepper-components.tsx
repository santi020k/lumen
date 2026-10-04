import type { ReactElement } from 'react'
import { Platform, ScrollView, Text, View, type ViewProps } from 'react-native'

import { LumenText } from './primitives.js'
import { isLumenStepItemsValid, type LumenStepState, resolveLumenStepState } from './stepper-recipes.js'
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
  invalidText?: string
  formatState?: (state: LumenStepState) => string
}

const formatStepState = (state: LumenStepState): string => ({
  complete: 'Complete', current: 'Current', upcoming: 'Upcoming'
})[state]

export const LumenStepper = ({ label, steps, currentStep, orientation = 'vertical',
  formatState = formatStepState, invalidText = 'Steps unavailable', style, ...props }: LumenStepperProps): ReactElement => {
  const theme = useLumenTheme()
  const horizontal = orientation === 'horizontal'

  if (!isLumenStepItemsValid(steps)) {
    return <View {...props} accessibilityLabel={label} style={style}><LumenText accessibilityRole="alert">{invalidText}</LumenText></View>
  }

  const content = (
    <View style={{ flexDirection: horizontal ? 'row' : 'column', gap: theme.spacing.md }}>
      {steps.map((step, index) => {
        const state = resolveLumenStepState(index, currentStep, steps.length)

        return (
          <View
            key={step.id}
            accessible
            role="listitem"
            accessibilityLabel={`${index + 1} / ${steps.length}, ${step.title}${step.description ? `, ${step.description}` : ''}${Platform.OS === 'web' ? `, ${formatState(state)}` : ''}`}
            accessibilityValue={{ text: formatState(state) }}
            aria-current={state === 'current' ? 'step' : undefined}
            accessibilityState={{ selected: state === 'current' }}
            style={{ alignItems: 'flex-start', flexDirection: 'row', gap: theme.spacing.sm, width: horizontal ? 220 : undefined }}
          >
            <View
              aria-hidden
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
            <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flex: 1 }}>
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
    <View {...props} role="list" accessibilityLabel={label} style={style}>
      {horizontal ? <ScrollView horizontal>{content}</ScrollView> : content}
    </View>
  )
}

import { type ReactElement, type ReactNode, useEffect, useRef, useState } from 'react'
import { type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent,
  Platform, Pressable, ScrollView, View, type ViewProps } from 'react-native'

import { type LumenCarouselSlide, lumenCarouselTarget, resolveLumenCarousel } from './carousel-recipes.js'
import { LumenButton, LumenText } from './primitives.js'
import { useLumenRadioKeyboard } from './radio-keyboard.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenCarouselLabels {
  previous: string
  next: string
  empty: string
  invalid: string
  loading: string
  error: string
  position: (slide: LumenCarouselSlide, index: number, count: number) => string
}
export interface LumenCarouselProps extends Omit<ViewProps, 'children'> {
  label: string
  slides: readonly LumenCarouselSlide[]
  index: number
  onIndexChange: (index: number) => void
  renderSlide: (slide: LumenCarouselSlide, index: number) => ReactNode
  height?: number
  disabled?: boolean
  status?: 'ready' | 'loading' | 'error'
  labels?: Partial<LumenCarouselLabels>
}

const defaults: LumenCarouselLabels = {
  previous: 'Previous slide',
  next: 'Next slide',
  empty: 'No slides',
  invalid: 'Invalid carousel selection',
  loading: 'Loading slides',
  error: 'Unable to load slides',
  position: (slide, index, count) => `${slide.label}, slide ${index + 1} of ${count}`
}

export const LumenCarousel = ({ label, slides, index, onIndexChange, renderSlide, height = 200,
  disabled = false, status = 'ready', labels, style, ...props }: LumenCarouselProps): ReactElement => {
  const theme = useLumenTheme()
  const text = { ...defaults, ...labels }
  const state = resolveLumenCarousel(slides, index)
  const [width, setWidth] = useState(0)
  const [settled, setSettled] = useState(0)
  const viewportRef = useRef<ScrollView>(null)
  const validSlides = state.status === 'ready' ? slides : []
  const ids = JSON.stringify(validSlides.map(slide => slide.id))
  const validHeight = Number.isFinite(height) && height > 0 && height <= 4096

  useEffect(() => {
    if (state.status === 'ready' && width > 0) viewportRef.current?.scrollTo({ x: index * width, animated: false })
  }, [index, ids, width, settled, state.status])

  const navigate = (requested: number): void => {
    if (disabled || status !== 'ready') return

    const target = lumenCarouselTarget(state, requested)

    if (target !== null) onIndexChange(target)
  }

  const onLayout = (event: LayoutChangeEvent): void => {
    const next = event.nativeEvent.layout.width

    if (Number.isFinite(next) && next > 0) setWidth(next)
  }

  const finishSwipe = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    if (width <= 0) return

    navigate(Math.round(event.nativeEvent.contentOffset.x / width))

    setSettled(current => current + 1)
  }

  const message = (): string | null => {
    if (status !== 'ready') return text[status]

    if (!validHeight) return text.invalid

    return state.status === 'ready' ? null : text[state.status]
  }

  const announcement = message()
  const radioKeys = useLumenRadioKeyboard(validSlides.map(() => disabled), navigate)

  return (
    <View {...props} style={[{ gap: theme.spacing.sm }, style]} accessibilityLabel={label}>
      {announcement !== null ?
        <LumenText accessibilityRole="alert">{announcement}</LumenText> :
        (
          <>
            <ScrollView
              ref={viewportRef}
              horizontal
              pagingEnabled
              scrollEnabled={!disabled}
              showsHorizontalScrollIndicator={false}
              onLayout={onLayout}
              onMomentumScrollEnd={finishSwipe}
              onScrollEndDrag={event => {
                if (!event.nativeEvent.velocity?.x) finishSwipe(event)
              }}
              style={{ height }}
            >
              {slides.map((slide, slideIndex) => (
                <View
                  key={slide.id}
                  ref={instance => {
                    if (Platform.OS === 'web' && typeof HTMLElement !== 'undefined' && instance instanceof HTMLElement) {
                      instance.inert = slideIndex !== index
                    }
                  }}
                  aria-hidden={slideIndex !== index}
                  style={{ width, height }}
                  accessibilityLabel={text.position(slide, slideIndex, slides.length)}
                  accessibilityElementsHidden={slideIndex !== index}
                  importantForAccessibility={slideIndex === index ? 'auto' : 'no-hide-descendants'}
                >
                  {renderSlide(slide, slideIndex)}
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              <LumenButton
                disabled={disabled || index === 0}
                onPress={() => {
                  navigate(index - 1)
                }}
              >
                {text.previous}
              </LumenButton>
              <LumenButton
                disabled={disabled || index === slides.length - 1}
                onPress={() => {
                  navigate(index + 1)
                }}
              >
                {text.next}
              </LumenButton>
            </View>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={label}
              style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}
            >
              {slides.map((slide, slideIndex) => (
                <Pressable
                  key={slide.id}
                  ref={instance => {
                    radioKeys.setRef(slideIndex, instance)
                  }}
                  onKeyDown={event => {
                    radioKeys.onKeyDown(slideIndex, event)
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={text.position(slide, slideIndex, slides.length)}
                  aria-checked={slideIndex === index}
                  aria-selected={slideIndex === index}
                  aria-disabled={disabled}
                  accessibilityState={{ checked: slideIndex === index, selected: slideIndex === index, disabled }}
                  disabled={disabled}
                  onPress={() => {
                    navigate(slideIndex)
                  }}
                  style={{ minHeight: 44,
                    minWidth: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: theme.radii.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.line,
                    backgroundColor: slideIndex === index ? theme.colors.brandSoft : theme.colors.surface,
                    opacity: disabled ? 0.5 : 1 }}
                >
                  <LumenText>{slideIndex + 1}</LumenText>
                </Pressable>
              ))}
            </View>
          </>
        )}
    </View>
  )
}

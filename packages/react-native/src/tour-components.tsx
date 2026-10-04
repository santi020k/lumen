import { type ReactElement, type ReactNode, type RefObject, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, type HostInstance, Modal, Platform, Pressable, ScrollView, StyleSheet, type Text, useWindowDimensions, View, type ViewProps } from 'react-native'

import { LumenButton, LumenText } from './primitives.js'
import { useLumenTheme } from './theme-context.js'
import { isLumenTourStepsValid, type LumenTourLayout, type LumenTourRect, type LumenTourStep, moveLumenTourStep, resolveLumenTourLayout, resolveLumenTourStep } from './tour-recipes.js'

export interface LumenTourProps extends Pick<ViewProps, 'style' | 'testID'> {
  label: string
  children: ReactNode
  steps: readonly LumenTourStep[]
  anchors: Readonly<Record<string, LumenTourRect>>
  open: boolean
  onOpenChange: (open: boolean) => void
  index: number
  onIndexChange: (index: number) => void
  onFinish: (step: LumenTourStep) => void
  returnFocusRef?: RefObject<HostInstance | null>
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  error?: string | null
  closeLabel?: string
  previousLabel?: string
  nextLabel?: string
  finishLabel?: string
  emptyLabel?: string
  invalidLabel?: string
  disabledLabel?: string
  loadingLabel?: string
  unavailableLabel?: string
  formatProgress?: (index: number, count: number) => string
}

const focusControl = (target: HostInstance | null | undefined): void => {
  if (!target) return

  target.focus()

  if (Platform.OS !== 'web') AccessibilityInfo.sendAccessibilityEvent(target, 'focus')
}

const labels = {
  closeLabel: 'Close tour',
  previousLabel: 'Previous',
  nextLabel: 'Next',
  finishLabel: 'Finish',
  emptyLabel: 'No tour steps',
  invalidLabel: 'Invalid tour step',
  disabledLabel: 'Tour step unavailable',
  loadingLabel: 'Loading tour',
  unavailableLabel: 'Target unavailable',
  formatProgress: (index: number, count: number): string => `${index + 1} / ${count}`
}

const stepStatus = (props: LumenTourProps, step: LumenTourStep | null): string | null => {
  const copy = { ...labels, ...props }

  if (!isLumenTourStepsValid(props.steps)) return copy.invalidLabel

  if (props.steps.length === 0) return copy.emptyLabel

  if (!step) return copy.invalidLabel

  return step.disabled ? copy.disabledLabel : null
}

const tourStatus = (props: LumenTourProps, step: LumenTourStep | null): string | null => {
  if (props.error != null) return props.error

  if (props.loading) return props.loadingLabel ?? labels.loadingLabel

  return stepStatus(props, step)
}

interface TourOrigin { x: number, y: number }

const tourAnchor = (props: LumenTourProps, step: LumenTourStep | null): LumenTourRect | null => {
  if (!step || !Object.hasOwn(props.anchors, step.targetId)) return null

  return props.anchors[step.targetId] ?? null
}

const translateAnchor = (
  anchor: LumenTourRect | null, origin: TourOrigin | null, modal: TourOrigin | null
): LumenTourRect | null => {
  if (!anchor || !origin || !modal) return null

  return { ...anchor, x: origin.x + anchor.x - modal.x, y: origin.y + anchor.y - modal.y }
}

const isTourLocked = (props: LumenTourProps, status: string | null): boolean => {
  const interaction = props.disabled === true || props.readOnly === true

  return !props.open || interaction || status !== null
}

const scrimRects = (viewport: LumenTourRect, target: LumenTourRect | null): readonly LumenTourRect[] => target ?
  [
    { x: 0, y: 0, width: viewport.width, height: target.y },
    { x: 0, y: target.y, width: target.x, height: target.height },
    { x: target.x + target.width, y: target.y, width: viewport.width - target.x - target.width, height: target.height },
    { x: 0, y: target.y + target.height, width: viewport.width, height: viewport.height - target.y - target.height }
  ] :
  [viewport]

interface TourPanelProps {
  props: LumenTourProps
  step: LumenTourStep | null
  status: string | null
  target: LumenTourRect | null
  headingRef: RefObject<Text | null>
  locked: boolean
  previous: number | null
  next: number | null
  close: () => void
  navigate: (target: number | null) => void
  advance: () => void
}

const TourPanel = ({
  props, step, status, target, headingRef, locked, previous, next, close, navigate, advance
}: TourPanelProps): ReactElement => {
  const copy = { ...labels, ...props }
  const theme = useLumenTheme()

  return (
    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
      <LumenText
        ref={headingRef}
        variant="title"
        accessibilityRole="header"
        onLayout={() => {
          focusControl(headingRef.current)
        }}
      >
        {status ?? step?.title ?? props.label}
      </LumenText>
      {status === null && step && (
        <>
          <LumenText>{copy.formatProgress(props.index, props.steps.length)}</LumenText>
          <LumenText>{step.content}</LumenText>
          {!target && <LumenText accessibilityLiveRegion="polite">{copy.unavailableLabel}</LumenText>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <LumenButton
              disabled={locked || previous === null}
              onPress={() => {
                navigate(previous)
              }}
            >
              <LumenText>{copy.previousLabel}</LumenText>
            </LumenButton>
            <LumenButton disabled={locked} onPress={advance}>
              <LumenText>{next === null ? copy.finishLabel : copy.nextLabel}</LumenText>
            </LumenButton>
          </View>
        </>
      )}
      <LumenButton intent="quiet" onPress={close}><LumenText>{copy.closeLabel}</LumenText></LumenButton>
    </ScrollView>
  )
}

interface TourScrimProps { viewport: LumenTourRect, target: LumenTourRect | null, close: () => void }

const TourScrim = ({ viewport, target, close }: TourScrimProps): ReactElement => {
  const theme = useLumenTheme()

  return (
    <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={close}>
      {scrimRects(viewport, target).map(rect => <View key={`${rect.x}:${rect.y}:${rect.width}:${rect.height}`} pointerEvents="none" style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height, backgroundColor: theme.colors.ink, opacity: 0.45 }} />)}
      {target && <View testID="tour-highlight" pointerEvents="none" accessible={false} style={{ position: 'absolute', left: target.x, top: target.y, width: target.width, height: target.height, borderColor: theme.colors.brand, borderWidth: 3, borderRadius: theme.radii.sm }} />}
    </Pressable>
  )
}

interface TourOverlayProps extends TourPanelProps {
  layout: LumenTourLayout | null
  viewport: LumenTourRect
  modalRef: RefObject<View | null>
  onViewport: (rect: LumenTourRect) => void
  onOrigin: (origin: TourOrigin) => void
}

const TourOverlay = ({
  layout, viewport, modalRef, headingRef, close, onViewport, onOrigin,
  props, step, status, target, locked, previous, next, navigate, advance
}: TourOverlayProps): ReactElement => {
  const theme = useLumenTheme()
  const panel = layout?.panel ?? viewport

  return (
    <Modal
      transparent
      visible
      onRequestClose={close}
      onShow={() => {
        focusControl(headingRef.current)
      }}
      animationType="none"
    >
      <View
        ref={modalRef}
        style={{ flex: 1 }}
        accessibilityViewIsModal
        onAccessibilityEscape={close}
        onLayout={event => {
          const { width, height } = event.nativeEvent.layout

          onViewport({ x: 0, y: 0, width, height })

          modalRef.current?.measureInWindow((x, y) => {
            onOrigin({ x, y })
          })
        }}
      >
        <TourScrim viewport={viewport} target={target} close={close} />
        <View accessibilityLabel={props.label} style={{ position: 'absolute', left: panel.x, top: panel.y, width: panel.width, maxHeight: panel.height, backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.sm }}>
          <TourPanel
            props={props}
            step={step}
            status={status}
            target={target}
            headingRef={headingRef}
            locked={locked}
            previous={previous}
            next={next}
            close={close}
            navigate={navigate}
            advance={advance}
          />
        </View>
      </View>
    </Modal>
  )
}

export const LumenTour = (props: LumenTourProps): ReactElement => {
  const [viewport, setViewport] = useState<LumenTourRect>({ x: 0, y: 0, width: 0, height: 0 })
  const rootRef = useRef<View | null>(null)
  const modalRef = useRef<View | null>(null)
  const [origin, setOrigin] = useState<TourOrigin | null>(null)
  const [modalOrigin, setModalOrigin] = useState<TourOrigin | null>(null)
  const window = useWindowDimensions()
  const headingRef = useRef<Text | null>(null)
  const wasOpenRef = useRef(false)
  const step = resolveLumenTourStep(props.steps, props.index)
  const status = tourStatus(props, step)
  const anchor = translateAnchor(tourAnchor(props, step), origin, modalOrigin)
  const layout = resolveLumenTourLayout(status === null ? anchor : null, viewport)
  const locked = isTourLocked(props, status)
  const previous = moveLumenTourStep(props.steps, props.index, 'previous')
  const next = moveLumenTourStep(props.steps, props.index, 'next')

  const measureRoot = (): void => {
    rootRef.current?.measureInWindow((x, y) => {
      setOrigin({ x, y })
    })
  }

  useEffect(() => {
    if (props.open) measureRoot()
  }, [props.open, window.width, window.height])

  useEffect(() => {
    if (props.open) focusControl(headingRef.current)
    else if (wasOpenRef.current) focusControl(props.returnFocusRef?.current)

    wasOpenRef.current = props.open
  }, [props.open, props.index, status, props.returnFocusRef])

  const close = (): void => {
    props.onOpenChange(false)
  }

  const navigate = (target: number | null): void => {
    if (!locked && target !== null) props.onIndexChange(target)
  }

  const advance = (): void => {
    if (locked || !step) return

    if (next !== null) props.onIndexChange(next)
    else props.onFinish(step)
  }

  return (
    <View ref={rootRef} style={props.style} testID={props.testID} onLayout={measureRoot}>
      <View pointerEvents={props.open ? 'none' : 'auto'} accessibilityElementsHidden={props.open} importantForAccessibility={props.open ? 'no-hide-descendants' : 'auto'}>{props.children}</View>
      {props.open && (
        <TourOverlay
          props={props}
          step={step}
          status={status}
          target={layout?.highlight ?? null}
          layout={layout}
          viewport={viewport}
          headingRef={headingRef}
          modalRef={modalRef}
          locked={locked}
          previous={previous}
          next={next}
          close={close}
          navigate={navigate}
          advance={advance}
          onViewport={setViewport}
          onOrigin={setModalOrigin}
        />
      ) }
    </View>
  )
}

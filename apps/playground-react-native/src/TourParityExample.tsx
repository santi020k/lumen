import { type ReactElement, useRef, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenCheckbox, LumenText, LumenTour, type LumenTourRect, type LumenTourStep } from '@santi020k/lumen-react-native'

const steps: readonly LumenTourStep[] = [
  { id: 'preview-step', targetId: 'preview', title: 'Preview', content: 'This control toggles the local preview.' },
  { id: 'save-step', targetId: 'save', title: 'Save', content: 'This control records a local example action.' },
  { id: 'missing-step', targetId: 'missing', title: 'Optional control', content: 'This target is intentionally absent. Guidance remains dismissible.' }
]

export const TourParityExample = (): ReactElement => {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [anchors, setAnchors] = useState<Record<string, LumenTourRect>>({})
  const [preview, setPreview] = useState(false)
  const [message, setMessage] = useState('Start the guided tour')
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const triggerRef = useRef<View | null>(null)

  return (
    <LumenTour
      label="Example tour"
      steps={steps}
      anchors={anchors}
      open={open}
      onOpenChange={setOpen}
      index={index}
      onIndexChange={setIndex}
      returnFocusRef={triggerRef}
      readOnly={readOnly}
      loading={loading}
      error={error ? 'Tour unavailable' : null}
      formatProgress={(current, count) => `Step ${current + 1} of ${count}`}
      onFinish={step => {
        setMessage(`Completed ${step.title}`)

        setOpen(false)
      }}
    >
      <View style={{ minHeight: 520, gap: 12, padding: 12 }}>
        <LumenCheckbox label="Read only" checked={readOnly} onCheckedChange={setReadOnly} />
        <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
        <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
        <LumenButton
          ref={triggerRef}
          onPress={() => {
            setIndex(0)

            setOpen(true)
          }}
        >
          <LumenText>Start tour</LumenText>
        </LumenButton>
        <View onLayout={event => {
          const { x, y, width, height } = event.nativeEvent.layout

          setAnchors(current => ({ ...current, preview: { x, y, width, height } }))
        }}
        >
          <LumenButton onPress={() => {
            setPreview(current => !current)
          }}
          >
            <LumenText>{preview ? 'Preview enabled' : 'Preview disabled'}</LumenText>
          </LumenButton>
        </View>
        <View onLayout={event => {
          const { x, y, width, height } = event.nativeEvent.layout

          setAnchors(current => ({ ...current, save: { x, y, width, height } }))
        }}
        >
          <LumenButton onPress={() => {
            setMessage('Local example saved')
          }}
          >
            <LumenText>Save example</LumenText>
          </LumenButton>
        </View>
        <LumenText>{message}</LumenText>
      </View>
    </LumenTour>
  )
}

// cspell:words edición fotografías Colección ilustrativa seleccionables imagen seleccionada posición Compensación exposición fotografía Intensidad colores
import { useEffect, useRef, useState } from 'react'

import '../../../../packages/lumen/templates/shared/media-workspace/src/lumen/media-workspace.css'

import type { LumenImageComparisonMode, LumenMediaViewportValue } from '@santi020k/lumen-core'
import { Button, Image, ImageComparison, MediaViewport, Stack } from '@santi020k/lumen-react'

import { AdjustmentControlRecipe } from '../../../../packages/lumen/templates/react/media-workspace/src/lumen/adjustment-controls'
import { MediaProcessingRecipe, type MediaProcessingState } from '../../../../packages/lumen/templates/react/media-workspace/src/lumen/media-processing'
import { type MediaWorkspaceItem, MediaWorkspaceRecipe } from '../../../../packages/lumen/templates/react/media-workspace/src/lumen/media-workspace'

const workspaceCopy = {
  en: {
    title: 'Photo workspace',
    collection: 'Illustrative photo collection',
    inspector: 'Image adjustments',
    earlier: 'Move earlier',
    later: 'Move later',
    exposure: 'Exposure',
    resetExposure: 'Reset exposure',
    saturation: 'Saturation',
    resetSaturation: 'Reset saturation'
  },
  es: {
    title: 'Espacio de trabajo para la edición de fotografías',
    collection: 'Colección ilustrativa de fotografías seleccionables',
    inspector: 'Ajustes de la imagen seleccionada',
    earlier: 'Mover a la posición anterior',
    later: 'Mover a la posición siguiente',
    exposure: 'Compensación de la exposición de la fotografía',
    resetExposure: 'Restablecer la exposición original',
    saturation: 'Intensidad de la saturación de los colores',
    resetSaturation: 'Restablecer la saturación original'
  }
} as const

const initialItems: MediaWorkspaceItem[] = [
  { id: 'lake', label: 'Lake landscape', src: '/comparison-after.svg', alt: 'Illustrative lake and mountains', width: 960, height: 600 },
  { id: 'original', label: 'Original landscape', src: '/comparison-before.svg', alt: 'Illustrative landscape before adjustment', width: 960, height: 600 },
  { id: 'second', label: 'Another landscape', src: '/comparison-after.svg', alt: 'Another illustrative landscape', width: 960, height: 600 }
]

const modes: readonly { mode: LumenImageComparisonMode, label: string }[] = [
  { mode: 'reveal', label: 'Reveal' },
  { mode: 'side-by-side', label: 'Side by side' },
  { mode: 'before', label: 'Original' },
  { mode: 'after', label: 'Adjusted' }
]

export const StudioWorkspaceDemo = ({ showTitle = true }: { showTitle?: boolean }) => {
  const [items, setItems] = useState(initialItems)
  const [selectedIds, setSelectedIds] = useState<string[]>(['lake'])
  const [mode, setMode] = useState<LumenImageComparisonMode>('reveal')
  const [inspect, setInspect] = useState(false)
  const [reveal, setReveal] = useState(50)
  const [longLabels, setLongLabels] = useState(false)
  const [failPreparation, setFailPreparation] = useState(false)
  const [viewport, setViewport] = useState<LumenMediaViewportValue>({ zoom: 1, x: 0, y: 0 })
  const [exposure, setExposure] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [processing, setProcessing] = useState<MediaProcessingState>({ phase: 'idle', message: 'Ready to prepare a preview.' })
  const copy = workspaceCopy[longLabels ? 'es' : 'en']
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => () => {
    clearInterval(timerRef.current)
  }, [])

  const start = () => {
    clearInterval(timerRef.current)

    setProcessing({ phase: 'pending', message: 'Preparing the illustrative preview…', progress: 0 })

    let progress = 0

    timerRef.current = setInterval(() => {
      progress += 10

      if (progress >= 100) {
        clearInterval(timerRef.current)

        setProcessing(failPreparation ?
          { phase: 'error', message: 'Illustrative preparation failed.', recovery: 'Your adjustments are retained. Turn off the failure simulation and retry.' } :
          { phase: 'success', message: 'Illustrative preview prepared.' })
      } else setProcessing({ phase: 'pending', message: 'Preparing the illustrative preview…', progress })
    }, 300)
  }

  const cancel = () => {
    clearInterval(timerRef.current)

    setProcessing({ phase: 'cancelled', message: 'Preview preparation cancelled. Your adjustments remain available.' })
  }

  const adjusted = <Image src="/comparison-after.svg" alt="Illustrative landscape with adjustable brightness and saturation" width={960} height={600} radius="none" style={{ filter: `brightness(${2 ** exposure}) saturate(${saturation / 100})` }} />

  return (
    <MediaWorkspaceRecipe
      title={copy.title}
      showTitle={showTitle}
      collectionLabel={copy.collection}
      formatSelection={count => `${count} ${count === 1 ? 'photo' : 'photos'} selected`}
      inspectorLabel={copy.inspector}
      items={items}
      onItemsChange={setItems}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      moveEarlierLabel={copy.earlier}
      moveLaterLabel={copy.later}
      previewLabel="Image preview"
      toolsLabel="Preview tools"
      tools={(
        <>
          {modes.map(item => (
            <Button
              key={item.mode}
              variant="outline"
              aria-pressed={!inspect && mode === item.mode}
              onClick={() => {
                setInspect(false)

                setMode(item.mode)
              }}
            >
              {item.label}
            </Button>
          ))}
          <Button
            variant="outline"
            aria-pressed={inspect}
            onClick={() => {
              setInspect(true)
            }}
          >
            Inspect details
          </Button>
        </>
      )}
      preview={inspect ?
        <MediaViewport label="Inspect the landscape" ratio={1.6} value={viewport} onValueChange={setViewport}>{adjusted}</MediaViewport> :
        (
          <ImageComparison
            mode={mode}
            value={reveal}
            onValueChange={setReveal}
            label="Compare the landscape treatment"
            beforeLabel="Original"
            afterLabel="Adjusted"
            ratio={1.6}
            before={<Image src="/comparison-before.svg" alt="Original illustrative landscape" width={960} height={600} radius="none" />}
            after={adjusted}
          />
        )}
      inspector={(
        <Stack gap="group">
          <AdjustmentControlRecipe label={copy.exposure} value={exposure} defaultValue={0} min={-1} max={1} step={0.1} formatValue={value => `${value.toFixed(1)} EV`} modifiedLabel="Modified" resetLabel={copy.resetExposure} onValueChange={setExposure} />
          <AdjustmentControlRecipe label={copy.saturation} value={saturation} defaultValue={100} min={0} max={200} step={5} formatValue={value => `${value}%`} modifiedLabel="Modified" resetLabel={copy.resetSaturation} onValueChange={setSaturation} />
        </Stack>
      )}
      bottomControls={(
        <Stack gap="group">
          <Stack direction="horizontal" wrap gap="related" aria-label="Illustrative qualification controls">
            <Button
              variant="outline"
              aria-pressed={longLabels}
              onClick={() => {
                setLongLabels(!longLabels)
              }}
            >
              Long Spanish labels
            </Button>
            <Button
              variant="outline"
              aria-pressed={failPreparation}
              disabled={processing.phase === 'pending'}
              onClick={() => {
                setFailPreparation(!failPreparation)
              }}
            >
              Simulate preparation failure
            </Button>
          </Stack>
          <MediaProcessingRecipe state={processing} startLabel="Prepare preview" cancelLabel="Cancel preparation" retryLabel="Retry preparation" progressLabel="Preview preparation" onStart={start} onRetry={start} onCancel={cancel} />
        </Stack>
      )}
    />
  )
}

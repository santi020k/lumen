// cspell:words Cronología ejemplo Eventos detalles Aprobación diseño Revisión compilación Preparación lanzamiento Sin eventos Marcador personalizado Invertir Deshabilitar acciones Restaurar
// cspell:words Acción elegida sintética extenso controles tiene conector
import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenText, LumenTimeline, LumenTimelineItem } from '@santi020k/lumen-react-native'

const copy = {
  en: { label: 'Example timeline',
    titles: ['Design approval', 'Build review', 'Release preparation'],
    descriptions: ['Synthetic design review with long content for narrow screens.\nSecond line: Unicode 😀.',
      'Synthetic build review. Host content retains its own controls.',
      'Synthetic release preparation. The terminal marker has no connector.'],
    action: 'View details',
    empty: 'No events',
    custom: 'Custom marker',
    reverse: 'Reverse order',
    emptyButton: 'Empty',
    disabled: 'Disable actions',
    restore: 'Restore',
    selected: 'Selected action' },
  es: { label: 'Cronología de ejemplo',
    titles: ['Aprobación de diseño', 'Revisión de compilación', 'Preparación del lanzamiento'],
    descriptions: ['Revisión de diseño sintética con contenido extenso para pantallas pequeñas.\nSegunda línea: Unicode 😀.',
      'Revisión de compilación sintética. El contenido conserva sus controles.',
      'Preparación del lanzamiento sintética. El marcador final no tiene conector.'],
    action: 'Ver detalles',
    empty: 'Sin eventos',
    custom: 'Marcador personalizado',
    reverse: 'Invertir orden',
    emptyButton: 'Vacío',
    disabled: 'Deshabilitar acciones',
    restore: 'Restaurar',
    selected: 'Acción elegida' }
}

const events = [{ id: 'design', time: '10:00', slot: 0 },
  { id: 'build', time: '12:20', slot: 1 },
  { id: 'release', time: '14:30', slot: 2 }]

export const TimelineParityExample = (): ReactElement => {
  const [spanish, setSpanish] = useState(false)
  const [custom, setCustom] = useState(false)
  const [reverse, setReverse] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [selected, setSelected] = useState('')
  const text = spanish ? copy.es : copy.en
  const ordered = reverse ? [...events].reverse() : events
  const visible = empty ? [] : ordered

  return (
    <View testID="timeline-parity-example" style={{ gap: 12 }}>
      <LumenButton onPress={() => {
        setSpanish(!spanish)
      }}
      >
        English / Español
      </LumenButton>
      <LumenButton onPress={() => {
        setCustom(!custom)
      }}
      >
        {text.custom}
      </LumenButton>
      <LumenButton onPress={() => {
        setReverse(!reverse)
      }}
      >
        {text.reverse}
      </LumenButton>
      <LumenButton onPress={() => {
        setEmpty(!empty)
      }}
      >
        {text.emptyButton}
      </LumenButton>
      <LumenButton onPress={() => {
        setDisabled(!disabled)
      }}
      >
        {text.disabled}
      </LumenButton>
      <LumenButton onPress={() => {
        setEmpty(false)

        setReverse(false)

        setCustom(false)

        setDisabled(false)

        setSelected('')
      }}
      >
        {text.restore}
      </LumenButton>
      <LumenTimeline label={text.label}>
        {visible.map((event, index) => (
          <LumenTimelineItem
            key={event.id}
            testID={`timeline-event-${event.id}`}
            isLast={index === visible.length - 1}
            dot={custom ? <LumenText variant="caption" accessibilityLabel="Decorative marker">✓</LumenText> : undefined}
          >
            <LumenText variant="title">
              {event.time}
              {' '}
              {text.titles[event.slot]}
            </LumenText>
            <LumenText>{text.descriptions[event.slot]}</LumenText>
            <LumenButton
              disabled={disabled}
              onPress={() => {
                setSelected(event.id)
              }}
            >
              {text.action}
              {' '}
              {event.time}
            </LumenButton>
          </LumenTimelineItem>
        ))}
        {empty && <LumenText>{text.empty}</LumenText>}
      </LumenTimeline>
      <LumenText>
        {text.selected}
        :
        {' '}
        {selected}
      </LumenText>
    </View>
  )
}

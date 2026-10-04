// cspell:words Índice Diapositivas Diapositiva anterior siguiente Vacío inválido Restaurar Deshabilitado cargando
import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenCard, LumenCarousel, type LumenCarouselSlide, LumenText } from '@santi020k/lumen-react-native'

const fixture: readonly LumenCarouselSlide[] = [
  { id: 'dashboard', label: 'Dashboard' }, { id: 'portfolio', label: 'Portfolio' }, { id: 'storefront', label: 'Storefront' }
]

export const CarouselParityExample = (): ReactElement => {
  const [index, setIndex] = useState(0)
  const [lastAction, setLastAction] = useState('none')
  const [spanish, setSpanish] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready')

  return (
    <View testID="carousel-parity-example" style={{ gap: 12 }}>
      <LumenButton onPress={() => {
        setSpanish(!spanish)
      }}
      >
        English / Español
      </LumenButton>
      <LumenButton onPress={() => {
        setDisabled(!disabled)
      }}
      >
        {spanish ? 'Deshabilitado' : 'Disabled'}
        :
        {' '}
        {String(disabled)}
      </LumenButton>
      <LumenButton onPress={() => {
        setEmpty(!empty)
      }}
      >
        {spanish ? 'Vacío' : 'Empty'}
        :
        {' '}
        {String(empty)}
      </LumenButton>
      <LumenButton onPress={() => {
        setStatus(status === 'loading' ? 'ready' : 'loading')
      }}
      >
        {spanish ? 'Cargando' : 'Loading'}
      </LumenButton>
      <LumenButton onPress={() => {
        setStatus(status === 'error' ? 'ready' : 'error')
      }}
      >
        Error
      </LumenButton>
      <LumenButton onPress={() => {
        setIndex(99)
      }}
      >
        {spanish ? 'Índice inválido' : 'Invalid index'}
      </LumenButton>
      <LumenButton onPress={() => {
        setIndex(0)

        setEmpty(false)

        setStatus('ready')
      }}
      >
        {spanish ? 'Restaurar' : 'Restore'}
      </LumenButton>
      <LumenCarousel
        label={spanish ? 'Diapositivas de ejemplo' : 'Example slides'}
        slides={empty ? [] : fixture}
        index={index}
        onIndexChange={setIndex}
        disabled={disabled}
        status={status}
        labels={spanish ?
          { previous: 'Diapositiva anterior',
            next: 'Diapositiva siguiente',
            empty: 'Sin diapositivas',
            invalid: 'Índice inválido',
            loading: 'Cargando diapositivas',
            error: 'No se pudieron cargar las diapositivas',
            position: (slide: LumenCarouselSlide, page: number, count: number) => `${slide.label}, diapositiva ${page + 1} de ${count}` } :
          undefined}
        renderSlide={(slide: LumenCarouselSlide) => (
          <LumenCard style={{ flex: 1, justifyContent: 'center' }}>
            <LumenText>{slide.label}</LumenText>
            <LumenButton onPress={() => {
              setLastAction(slide.id)
            }}
            >
              {`Open ${slide.label}`}
            </LumenButton>
          </LumenCard>
        )}
      />
      <LumenText>{String(index)}</LumenText>
      <LumenText>{`Slide action: ${lastAction}`}</LumenText>
    </View>
  )
}

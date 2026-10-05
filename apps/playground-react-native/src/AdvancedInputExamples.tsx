// cspell:words Limpiar seleccionadas Quitar
import { type ReactElement, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  LumenAutocomplete, LumenButton, LumenImageComparison, LumenInputOTP,   LumenMultiSelect, LumenNumberField,
  LumenPasswordField, LumenSegmentedControl, LumenText, LumenToggle
} from '@santi020k/lumen-react-native'
import { LumenTimeField, type LumenTimeSelection } from '@santi020k/lumen-react-native/datetime'

const beforeImage = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAIAAAAUMWhjAAAAJElEQVR4nGPIy6ugKWIYtWDUglELRi0YtWDUglELRi0YGhYAAMra/C7UGJC5AAAAAElFTkSuQmCC' }
const afterImage = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAIAAAAUMWhjAAAAJElEQVR4nGPQSLlEU8QwasGoBaMWjFowasGoBaMWjFowNCwAAFrDGj0TBRDqAAAAAElFTkSuQmCC' }

const copies = {
  en: {
    amount: 'Quantity',
    city: 'City',
    code: 'One-time code',
    compare: 'Compare images',
    decrease: 'Decrease value',
    increase: 'Increase value',
    invalid: 'Enter a valid number',
    range: 'Enter a number between 0 and 100',
    password: 'Example password',
    show: 'Show password',
    hide: 'Hide password',
    time: 'Appointment time',
    choose: 'Choose a time',
    confirm: 'Confirm',
    cancel: 'Cancel',
    timeRange: 'Choose a time between 09:00 and 17:00',
    loading: 'Loading results',
    empty: 'No results',
    retry: 'Retry',
    error: 'Could not load cities',
    close: 'Close results',
    before: 'Before',
    after: 'After',
    readOnly: 'Read-only examples',
    state: 'Result state',
    reset: 'Show result error',
    ready: 'Ready',
    pending: 'Loading',
    noResults: 'Empty'
  },
  es: {
    amount: 'Cantidad',
    city: 'Ciudad',
    code: 'Código de un solo uso',
    compare: 'Comparar imágenes',
    decrease: 'Disminuir valor',
    increase: 'Aumentar valor',
    invalid: 'Ingresa un número válido',
    range: 'Ingresa un número entre 0 y 100',
    password: 'Contraseña de ejemplo',
    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',
    time: 'Hora de la cita',
    choose: 'Elige una hora',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    timeRange: 'Elige una hora entre las 09:00 y las 17:00',
    loading: 'Cargando resultados',
    empty: 'Sin resultados',
    retry: 'Reintentar',
    error: 'No se pudieron cargar las ciudades',
    close: 'Cerrar resultados',
    before: 'Antes',
    after: 'Después',
    readOnly: 'Ejemplos de solo lectura',
    state: 'Estado de resultados',
    reset: 'Mostrar error',
    ready: 'Listo',
    pending: 'Cargando',
    noResults: 'Vacío'
  }
}

const exampleLocale = (spanish: boolean): string => spanish ? 'es-CO' : 'en-US'

const cityResults = (state: string, query: string) => {
  const cities = [{ label: 'Bogotá', value: 'bogota' }, { label: 'Medellín', value: 'medellin' }]

  return state === 'empty' ? [] : cities.filter(option => option.label.toLowerCase().includes(query.toLowerCase()))
}

const MultiSelectExample = ({ spanish, readOnly, visible }: {
  spanish: boolean
  readOnly: boolean
  visible: boolean
}): ReactElement | null => {
  const safeAreaInsets = useSafeAreaInsets()
  const [values, setValues] = useState<ReadonlySet<string>>(() => new Set(['bogota', 'retained-city']))
  const [query, setQuery] = useState('')
  const [state, setState] = useState('ready')
  const copy = copies[spanish ? 'es' : 'en']

  if (!visible) return null

  return (
    <View testID="component-multi-select">
      <LumenSegmentedControl
        label={copy.state}
        value={state}
        options={[{ label: copy.ready, value: 'ready' },
          { label: copy.pending, value: 'loading' },
          { label: copy.noResults, value: 'empty' },
          { label: 'Error', value: 'error' }]}
        onValueChange={setState}
      />
      <LumenMultiSelect
        label={copy.city}
        safeAreaInsets={safeAreaInsets}
        values={values}
        onValuesChange={setValues}
        query={query}
        onQueryChange={setQuery}
        options={cityResults(state, query)}
        loading={state === 'loading'}
        {...(state === 'error' ? { resultsErrorMessage: copy.error } : {})}
        onRetry={() => {
          setState('ready')
        }}
        readOnly={readOnly}
        chooseLabel={spanish ? 'Elegir ciudades' : 'Choose cities'}
        searchLabel={spanish ? 'Buscar ciudades' : 'Search cities'}
        clearSearchLabel={spanish ? 'Limpiar búsqueda' : 'Clear search'}
        doneLabel={spanish ? 'Listo' : 'Done'}
        selectionLabel={count => spanish ? `${count} seleccionadas` : `${count} selected`}
        removeLabel={label => spanish ? `Quitar ${label}` : `Remove ${label}`}
        emptyLabel={copy.empty}
        loadingLabel={copy.loading}
        retryLabel={copy.retry}
      />
    </View>
  )
}

export const AdvancedInputExamples = ({ isVisible }: { isVisible: (name: string) => boolean }): ReactElement => {
  const [spanish, setSpanish] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [amount, setAmount] = useState('12.5')
  const [password, setPassword] = useState('synthetic-example')
  const [code, setCode] = useState('')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('ready')
  const [time, setTime] = useState<LumenTimeSelection | null>({ hour: 9, minute: 30 })
  const [comparison, setComparison] = useState(0.5)
  const copy = copies[spanish ? 'es' : 'en']
  const locale = exampleLocale(spanish)
  const results = cityResults(state, query)

  return (
    <>
      <LumenSegmentedControl
        label="Language / Idioma"
        value={spanish ? 'es' : 'en'}
        options={[{ label: 'English', value: 'en' }, { label: 'Español', value: 'es' }]}
        onValueChange={value => {
          setSpanish(value === 'es')

          setAmount(value === 'es' ? '12,5' : '12.5')
        }}
      />
      <LumenToggle label={copy.readOnly} value={readOnly} onValueChange={setReadOnly} />
      {isVisible('Number field') ? <View testID="component-number-field"><LumenNumberField label={copy.amount} value={amount} onValueChange={setAmount} locale={locale} min="0" max="100" step="0.1" incrementLabel={copy.increase} decrementLabel={copy.decrease} invalidNumberLabel={copy.invalid} outOfRangeLabel={copy.range} readOnly={readOnly} /></View> : null}
      {isVisible('Password field') ? <View testID="component-password-field"><LumenPasswordField label={copy.password} value={password} onValueChange={setPassword} showLabel={copy.show} hideLabel={copy.hide} newPassword readOnly={readOnly} /></View> : null}
      {isVisible('Input OTP') ? <View testID="component-input-otp"><LumenInputOTP label={copy.code} value={code} onValueChange={setCode} readOnly={readOnly} /></View> : null}
      {isVisible('Time field') ? <View testID="component-time-field"><LumenTimeField label={copy.time} value={time} onValueChange={setTime} locale={locale} minTime={{ hour: 9, minute: 0 }} maxTime={{ hour: 17, minute: 0 }} placeholder={copy.choose} confirmLabel={copy.confirm} dismissLabel={copy.cancel} rangeErrorLabel={copy.timeRange} readOnly={readOnly} /></View> : null}
      <MultiSelectExample spanish={spanish} readOnly={readOnly} visible={isVisible('Multi select')} />
      {isVisible('Autocomplete') ?
        (
          <>
            <LumenSegmentedControl label={copy.state} value={state} options={[{ label: copy.ready, value: 'ready' }, { label: copy.pending, value: 'loading' }, { label: copy.noResults, value: 'empty' }, { label: 'Error', value: 'error' }]} onValueChange={setState} />
            <View testID="component-autocomplete">
              <LumenAutocomplete
                label={copy.city}
                query={query}
                onQueryChange={value => {
                  setQuery(value)

                  setCity('')
                }}
                value={city}
                onValueChange={setCity}
                options={results}
                loading={state === 'loading'}
                {...(state === 'error' ? { resultsErrorMessage: copy.error } : {})}
                onRetry={() => {
                  setState('ready')
                }}
                loadingLabel={copy.loading}
                emptyLabel={copy.empty}
                retryLabel={copy.retry}
                dismissLabel={copy.close}
                readOnly={readOnly}
              />
            </View>
            <LumenButton
              intent="quiet"
              onPress={() => {
                setState('error')
              }}
            >
              {copy.reset}
            </LumenButton>
            <LumenText>{city}</LumenText>
          </>
        ) :
        null}
      {isVisible('Image comparison') ? <View testID="component-image-comparison"><LumenImageComparison label={copy.compare} before={beforeImage} after={afterImage} value={comparison} onValueChange={setComparison} beforeLabel={copy.before} afterLabel={copy.after} locale={locale} enabled={!readOnly} /></View> : null}
    </>
  )
}

import { type ComponentRef, type ReactElement, useEffect, useRef, useState } from 'react'
import { BackHandler, FlatList, Platform, ScrollView, type TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  LumenBarChart, LumenButton, LumenButtonGroup, LumenEmptyState, LumenErrorState,
  LumenFieldGroup, LumenSearchField, LumenSegmentedControl, LumenSheet, LumenSpinner,
  LumenStatusBar, LumenText, LumenTextarea, LumenTextField, useLumenTheme
} from '@santi020k/lumen-react-native'

import { filterWorkspaceRecords, updateWorkspaceRecord, type WorkspaceRecord, workspaceRecords } from './workspace-model'

type WorkspaceState = 'empty' | 'error' | 'loading' | 'success'

const isWorkspaceState = (value: string): value is WorkspaceState => (
  ['success', 'loading', 'empty', 'error'].includes(value)
)

const copy = {
  en: {
    back: 'Back',
    cancel: 'Cancel',
    clear: 'Clear search',
    edit: 'Edit record',
    empty: 'No records found',
    error: 'Records could not load',
    invalid: 'Enter a name.',
    language: 'Language',
    list: 'Records',
    loading: 'Loading',
    name: 'Name',
    note: 'Notes',
    required: 'required',
    retry: 'Retry',
    save: 'Save',
    saved: 'Changes saved locally',
    search: 'Search records',
    states: 'Example state',
    title: 'Workspace',
    chart: 'Weekly activity',
    chartDescription: 'Changes per day',
    chartDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    chartSummary: 'Weekly activity, five values.',
    chartLabels: { viewData: 'View chart data', chartData: 'Chart data', chartLegend: 'Legend', category: 'Category', series: 'Series', value: 'Value', notAvailable: 'Not available', empty: 'No data available.' },
    series: 'Changes',
    direction: 'Preview direction',
    stateLabels: { success: 'Ready', loading: 'Loading', empty: 'Empty', error: 'Error' }
  },
  es: {
    back: 'Volver',
    cancel: 'Cancelar',
    clear: 'Borrar búsqueda',
    edit: 'Editar registro',
    empty: 'No se encontraron registros',
    error: 'No se pudieron cargar los registros',
    invalid: 'Introduce un nombre.',
    language: 'Idioma',
    list: 'Registros',
    loading: 'Cargando',
    name: 'Nombre',
    note: 'Notas',
    required: 'obligatorio',
    retry: 'Reintentar',
    save: 'Guardar',
    saved: 'Cambios guardados localmente',
    search: 'Buscar registros',
    states: 'Estado del ejemplo',
    title: 'Espacio de trabajo',
    chart: 'Actividad semanal',
    chartDescription: 'Cambios por día',
    chartDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    chartSummary: 'Actividad semanal, cinco valores.',
    chartLabels: { viewData: 'Ver datos del gráfico', chartData: 'Datos del gráfico', chartLegend: 'Leyenda', category: 'Categoría', series: 'Serie', value: 'Valor', notAvailable: 'No disponible', empty: 'No hay datos disponibles.' },
    series: 'Cambios',
    direction: 'Vista de dirección',
    stateLabels: { success: 'Listo', loading: 'Cargando', empty: 'Vacío', error: 'Error' }
  }
}

const cleanWorkspaceDraft = (draft: WorkspaceRecord | null): WorkspaceRecord | null => (
  draft?.name.trim() ? { ...draft, name: draft.name.trim() } : null
)

const useWideWorkspace = (): boolean => {
  const { width, fontScale } = useWindowDimensions()

  return width >= 840 && fontScale < 2
}

const showWorkspaceList = (wide: boolean, selected: WorkspaceRecord | null): boolean => wide || !selected

const getWorkspaceRecords = (state: WorkspaceState, records: WorkspaceRecord[], query: string): WorkspaceRecord[] => (
  state === 'success' ? filterWorkspaceRecords(records, query) : []
)

const WorkspacePlaceholder = ({ state, text, onRetry }: {
  state: WorkspaceState
  text: typeof copy.en
  onRetry: () => void
}): ReactElement => {
  if (state === 'loading') return <LumenSpinner accessibilityLabel={text.loading} />

  if (state === 'error') {
    return <LumenErrorState title={text.error} actions={<LumenButton onPress={onRetry}>{text.retry}</LumenButton>} />
  }

  return <LumenEmptyState title={text.empty} />
}

const useWorkspaceBackNavigation = (
  selected: WorkspaceRecord | null,
  wide: boolean,
  draft: WorkspaceRecord | null,
  onBack: () => void
): void => {
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!selected || wide || draft) return false

      onBack()

      return true
    })

    return () => {
      subscription.remove()
    }
  }, [draft, onBack, selected, wide])
}

/** App-owned navigation, safe areas, virtualized data, and form state around public Lumen primitives. */
export const WorkspaceExample = ({ onBack }: { onBack: () => void }): ReactElement => {
  const theme = useLumenTheme()
  const insets = useSafeAreaInsets()
  const wide = useWideWorkspace()
  const [locale, setLocale] = useState<'en' | 'es'>('en')
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr')
  const [state, setState] = useState<WorkspaceState>('success')
  const [records, setRecords] = useState(workspaceRecords)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<WorkspaceRecord | null>(null)
  const [draft, setDraft] = useState<WorkspaceRecord | null>(null)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null)
  const editRef = useRef<ComponentRef<typeof View>>(null)
  const text = copy[locale]
  const visibleRecords = getWorkspaceRecords(state, records, query)

  useWorkspaceBackNavigation(selected, wide, draft, () => {
    setSelected(null)
  })

  const save = (): void => {
    const updated = cleanWorkspaceDraft(draft)

    if (!updated) return

    setRecords(current => updateWorkspaceRecord(current, updated))

    setSelected(updated)

    setDraft(null)

    setSaved(true)
  }

  const controls = (
    <View style={{ gap: theme.spacing.md, padding: theme.spacing.md }}>
      <LumenButton intent="quiet" onPress={onBack}>{text.back}</LumenButton>
      <LumenText variant="title">{text.title}</LumenText>
      <LumenSegmentedControl
        label={text.language}
        value={locale}
        options={[{ label: 'English', value: 'en' }, { label: 'Español', value: 'es' }]}
        onValueChange={value => {
          if (value === 'en' || value === 'es') setLocale(value)
        }}
      />
      <LumenSegmentedControl
        label={text.direction}
        value={direction}
        options={[{ label: 'LTR', value: 'ltr' }, { label: 'RTL', value: 'rtl' }]}
        onValueChange={value => {
          if (value === 'ltr' || value === 'rtl') setDirection(value)
        }}
      />
      <LumenSegmentedControl
        label={text.states}
        value={state}
        options={(['success', 'loading', 'empty', 'error'] as const).map(value => ({
          label: text.stateLabels[value],
          value
        }))}
        onValueChange={value => {
          if (isWorkspaceState(value)) setState(value)
        }}
      />
      <LumenSearchField
        accessibilityLabel={text.search}
        clearLabel={text.clear}
        prompt={text.search}
        value={query}
        onChangeText={setQuery}
      />
    </View>
  )

  const empty = (
    <WorkspacePlaceholder
      state={state}
      text={text}
      onRetry={() => {
        setState('success')
      }}
    />
  )

  return (
    <View style={{ flex: 1, direction, backgroundColor: theme.colors.canvas }}>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column' }}>
        {showWorkspaceList(wide, selected) && (
          <FlatList
            accessibilityLabel={text.list}
            data={visibleRecords}
            keyExtractor={record => record.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={empty}
            ListHeaderComponent={controls}
            contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.lg }}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <LumenButton
                intent={selected?.id === item.id ? 'primary' : 'quiet'}
                onPress={() => {
                  setSelected(item)

                  setSaved(false)
                }}
              >
                {item.name}
              </LumenButton>
            )}
          />
        )}
        {selected && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: theme.spacing.lg, padding: theme.spacing.md }} keyboardShouldPersistTaps="handled">
            {!wide && (
              <LumenButton
                intent="quiet"
                onPress={() => {
                  setSelected(null)
                }}
              >
                {text.back}
              </LumenButton>
            )}
            <LumenText variant="title">{selected.name}</LumenText>
            {saved && <LumenStatusBar message={text.saved} tone="success" />}
            <LumenButton
              ref={editRef}
              onPress={() => {
                setDraft({ ...selected })

                setSaved(false)
              }}
            >
              {text.edit}
            </LumenButton>
            <LumenText>{selected.note}</LumenText>
            {state === 'success' ?
              (
                <LumenBarChart
                  heading={text.chart}
                  description={text.chartDescription}
                  label={text.chart}
                  summary={text.chartSummary}
                  labels={text.chartLabels}
                  series={[{ id: 'activity', label: text.series, data: [3, 7, 4, 8, 5].map((y, index) => ({ x: String(index + 1), xLabel: text.chartDays[index] ?? String(index + 1), y })) }]}
                />
              ) :
              empty}
          </ScrollView>
        )}
      </View>
      <LumenSheet
        title={text.edit}
        visible={draft !== null}
        onDismiss={() => {
          setDraft(null)
        }}
        dismissible={false}
        avoidKeyboard
        presentation="adaptive"
        safeAreaInsets={insets}
        initialFocusRef={inputRef}
        returnFocusRef={editRef}
        actions={(
          <LumenButtonGroup>
            <LumenButton
              intent="quiet"
              onPress={() => {
                setDraft(null)
              }}
            >
              {text.cancel}
            </LumenButton>
            <LumenButton disabled={!cleanWorkspaceDraft(draft)} onPress={save}>{text.save}</LumenButton>
          </LumenButtonGroup>
        )}
      >
        {draft && (
          <View style={{ gap: theme.spacing.lg, direction }}>
            <LumenFieldGroup label={text.name} required requiredLabel={text.required}>
              <LumenTextField
                ref={inputRef}
                accessibilityLabel={text.name}
                value={draft.name}
                onChangeText={name => {
                  setDraft({ ...draft, name })
                }}
              />
            </LumenFieldGroup>
            {!draft.name.trim() && <LumenText accessibilityLiveRegion="polite" tone="danger">{text.invalid}</LumenText>}
            <LumenTextarea
              label={text.note}
              value={draft.note}
              onChangeText={note => {
                setDraft({ ...draft, note })
              }}
            />
          </View>
        )}
      </LumenSheet>
    </View>
  )
}

import { type ReactElement, useState } from 'react'

import { LumenCheckbox, LumenDataTable, type LumenTableColumn, type LumenTableRow,
  type LumenTableSort, LumenText } from '@santi020k/lumen-react-native'

const english = {
  package: 'Package',
  target: 'Target',
  downloads: 'Downloads',
  status: 'Status',
  ready: 'Ready',
  review: 'In review',
  elementsTarget: 'Custom elements for responsive product interfaces',
  locked: 'Locked archive',
  archive: 'Archive',
  syntheticArchive: 'Synthetic archived package',
  astroDownloads: '24,800',
  reactDownloads: '8,450',
  elementsDownloads: '5,120',
  localSort: 'Sort locally',
  horizontal: 'Horizontal table',
  hideReact: 'Hide React',
  readOnly: 'Read only',
  disable: 'Disable table',
  loading: 'Loading',
  error: 'Error',
  empty: 'Empty records',
  selected: 'Selected IDs',
  unsorted: 'Unsorted',
  ascending: 'Ascending',
  descending: 'Descending',
  label: 'Synthetic packages',
  loadingPackages: 'Loading packages',
  errorPackages: 'Packages unavailable',
  retry: 'Retry packages',
  emptyPackages: 'No packages',
  missing: 'Unavailable',
  selectAll: 'Select visible packages',
  deselectAll: 'Deselect visible packages',
  locale: 'en'
}

const spanish = {
  ...english,
  package: 'Paquete',
  target: 'Plataforma',
  downloads: 'Descargas',
  status: 'Estado',
  ready: 'Listo',
  review: 'En revisión',
  elementsTarget: 'Elementos personalizados para interfaces adaptables',
  locked: 'Archivo bloqueado',
  archive: 'Archivo',
  syntheticArchive: 'Paquete sintético archivado',
  astroDownloads: '24.800',
  reactDownloads: '8.450',
  elementsDownloads: '5.120',
  localSort: 'Ordenar aquí',
  horizontal: 'Tabla horizontal',
  hideReact: 'Ocultar React',
  readOnly: 'Solo lectura',
  disable: 'Deshabilitar tabla',
  loading: 'Cargando',
  empty: 'Sin registros',
  selected: 'IDs seleccionados',
  unsorted: 'Sin orden',
  ascending: 'Ascendente',
  descending: 'Descendente',
  label: 'Paquetes sintéticos',
  loadingPackages: 'Cargando paquetes',
  errorPackages: 'Paquetes no disponibles',
  retry: 'Reintentar paquetes',
  emptyPackages: 'No hay paquetes',
  missing: 'Sin datos',
  selectAll: 'Seleccionar visibles',
  deselectAll: 'Deseleccionar visibles',
  locale: 'es'
}

const rowsForLocale = (copy: typeof english): readonly LumenTableRow[] => [
  { id: 'astro',
    label: 'Astro',
    cells: {
      package: { text: '@santi020k/lumen-astro' },
      target: { text: 'Astro' },
      downloads: { text: copy.astroDownloads, sortValue: 24800 },
      status: { text: copy.ready }
    } },
  { id: 'react',
    label: 'React',
    cells: {
      package: { text: '@santi020k/lumen-react' },
      target: { text: 'React' },
      downloads: { text: copy.reactDownloads, sortValue: 8450 },
      status: { text: copy.review }
    } },
  { id: 'elements',
    label: 'Elements',
    cells: {
      package: { text: '@santi020k/lumen-elements' },
      target: { text: copy.elementsTarget },
      downloads: { text: copy.elementsDownloads, sortValue: 5120 },
      status: { text: copy.ready }
    } },
  { id: 'archived',
    label: copy.locked,
    disabled: true,
    cells: {
      package: { text: copy.syntheticArchive }, target: { text: copy.archive }, downloads: { text: '—', sortValue: null }
    } }
]

const sortDescription = (copy: typeof english, sort: LumenTableSort | null): string => {
  if (!sort) return copy.unsorted

  return sort.direction === 'ascending' ? copy.ascending : copy.descending
}

export const DataTableParityExample = (): ReactElement => {
  const [sort, setSort] = useState<LumenTableSort | null>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(['archived', 'filtered-out']))
  const [client, setClient] = useState(true)
  const [scroll, setScroll] = useState(false)
  const [hideReact, setHideReact] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [useSpanish, setUseSpanish] = useState(false)
  const copy = useSpanish ? spanish : english

  const columns: readonly LumenTableColumn[] = [
    { key: 'package', label: copy.package, sortable: true },
    { key: 'target', label: copy.target },
    { key: 'downloads', label: copy.downloads, sortable: true },
    { key: 'status', label: copy.status }
  ]

  const rows = empty ? [] : rowsForLocale(copy).filter(row => !hideReact || row.id !== 'react')
  const formatSort = (value: LumenTableSort | null): string => sortDescription(copy, value)

  return (
    <>
      <LumenCheckbox label={copy.localSort} checked={client} onCheckedChange={setClient} />
      <LumenCheckbox label={copy.horizontal} checked={scroll} onCheckedChange={setScroll} />
      <LumenCheckbox label={copy.hideReact} checked={hideReact} onCheckedChange={setHideReact} />
      <LumenCheckbox label={copy.readOnly} checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label={copy.disable} checked={disabled} onCheckedChange={setDisabled} />
      <LumenCheckbox label={copy.loading} checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label={copy.error} checked={error} onCheckedChange={setError} />
      <LumenCheckbox label={copy.empty} checked={empty} onCheckedChange={setEmpty} />
      <LumenCheckbox label="Español" checked={useSpanish} onCheckedChange={setUseSpanish} />
      <LumenText>{`${copy.selected}: ${[...selected].sort().join(', ')}`}</LumenText>
      <LumenText>{`${client ? 'Client' : 'Manual'}: ${sortDescription(copy, sort)}`}</LumenText>
      <LumenDataTable
        label={copy.label}
        columns={columns}
        rows={rows}
        layout={scroll ? 'scroll' : 'records'}
        sort={sort}
        onSortChange={setSort}
        sortMode={client ? 'client' : 'manual'}
        selectedIds={selected}
        onSelectionChange={setSelected}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        loadingLabel={copy.loadingPackages}
        error={error ? copy.errorPackages : null}
        onRetry={() => {
          setError(false)
        }}
        retryLabel={copy.retry}
        emptyLabel={copy.emptyPackages}
        missingLabel={copy.missing}
        selectAllLabel={copy.selectAll}
        deselectAllLabel={copy.deselectAll}
        formatSort={formatSort}
        locale={copy.locale}
      />
    </>
  )
}

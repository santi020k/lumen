// cspell:words Descripción notas varias líneas Responsable región Estado Registros Desplazamiento Vacío inválidos Restaurar
// cspell:words Faltante pantallas pequeñas Segunda línea ingeniería Verificación etiquetas extensas truncar Identidades inválidas
import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenTable, type LumenTableColumn, type LumenTableRow } from '@santi020k/lumen-react-native'

const copy = {
  en: { description: 'Description and multiline notes',
    owner: 'Owner / region',
    status: 'Status',
    design: 'Design record',
    engineering: 'Engineering record',
    designText: 'Design system review for narrow screens.\nSecond line: synthetic example 😀.',
    engineeringText: 'Verification of long labels and content without truncation.',
    designStatus: 'In review',
    engineeringStatus: 'Pending',
    label: 'Example records',
    empty: 'No records',
    invalid: 'Invalid record identities',
    missing: 'Missing',
    records: 'Records',
    scroll: 'Scroll',
    emptyButton: 'Empty',
    invalidButton: 'Invalid data',
    restore: 'Restore' },
  es: { description: 'Descripción y notas en varias líneas',
    owner: 'Responsable / región',
    status: 'Estado',
    design: 'Registro de diseño',
    engineering: 'Registro de ingeniería',
    designText: 'Revisión del sistema de diseño para pantallas pequeñas.\nSegunda línea: ejemplo sintético 😀.',
    engineeringText: 'Verificación de etiquetas extensas y contenido sin truncar.',
    designStatus: 'En revisión',
    engineeringStatus: 'Pendiente',
    label: 'Registros de ejemplo',
    empty: 'Sin registros',
    invalid: 'Identidades de registros inválidas',
    missing: 'Faltante',
    records: 'Registros',
    scroll: 'Desplazamiento',
    emptyButton: 'Vacío',
    invalidButton: 'Datos inválidos',
    restore: 'Restaurar' }
}

type TableCopy = (typeof copy)[keyof typeof copy]

const columnsFor = (text: TableCopy): readonly LumenTableColumn[] => [
  { key: 'description', label: text.description }, { key: 'owner', label: text.owner }, { key: 'status', label: text.status }
]

const rowsFor = (text: TableCopy): readonly [LumenTableRow, LumenTableRow] => [
  { id: 'design',
    label: text.design,
    cells: {
      description: { text: text.designText }, owner: { text: 'Alex — Bogotá / Design' }, status: { text: text.designStatus }
    } },
  { id: 'engineering',
    label: text.engineering,
    cells: {
      description: { text: text.engineeringText }, status: { text: text.engineeringStatus }
    } }
]

const displayedRows = (rows: readonly [LumenTableRow, LumenTableRow], empty: boolean,
  invalid: boolean): readonly LumenTableRow[] => {
  if (invalid) return [...rows, rows[0]]

  return empty ? [] : rows
}

export const TableParityExample = (): ReactElement => {
  const [spanish, setSpanish] = useState(false)
  const [scroll, setScroll] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const text = spanish ? copy.es : copy.en
  const columns = columnsFor(text)
  const rows = displayedRows(rowsFor(text), empty, invalid)

  return (
    <View testID="table-parity-example" style={{ gap: 12 }}>
      <LumenButton onPress={() => {
        setSpanish(!spanish)
      }}
      >
        English / Español
      </LumenButton>
      <LumenButton onPress={() => {
        setScroll(!scroll)
      }}
      >
        {scroll ? text.scroll : text.records}
      </LumenButton>
      <LumenButton onPress={() => {
        setEmpty(!empty)
      }}
      >
        {text.emptyButton}
      </LumenButton>
      <LumenButton onPress={() => {
        setInvalid(!invalid)
      }}
      >
        {text.invalidButton}
      </LumenButton>
      <LumenButton onPress={() => {
        setEmpty(false)

        setInvalid(false)

        setScroll(false)
      }}
      >
        {text.restore}
      </LumenButton>
      <LumenTable
        label={text.label}
        columns={columns}
        rows={rows}
        layout={scroll ? 'scroll' : 'records'}
        emptyLabel={text.empty}
        invalidLabel={text.invalid}
        missingLabel={text.missing}
      />
    </View>
  )
}

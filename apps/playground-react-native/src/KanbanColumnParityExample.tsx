import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenCheckbox, type LumenKanbanCard, LumenKanbanColumn, type LumenKanbanColumnData, LumenText } from '@santi020k/lumen-react-native'

export const KanbanColumnParityExample = (): ReactElement => {
  const [column, setColumn] = useState<LumenKanbanColumnData>({ id: 'todo',
    label: 'To do',
    capacity: 3,
    cards: [
      { id: 'todo', label: 'Design mobile column' }, { id: 'test', label: 'Test accessible reorder' }
    ] })

  const [disabled, setDisabled] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [opened, setOpened] = useState('No card opened')

  return (
    <View>
      <LumenCheckbox label="Disable column" checked={disabled} onCheckedChange={setDisabled} />
      <LumenCheckbox label="Read-only column" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenKanbanColumn
        column={column}
        onColumnChange={setColumn}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        error={error ? 'Column unavailable' : null}
        onCardPress={setOpened}
        onAdd={() => {
          setColumn(current => ({ ...current, cards: [...current.cards, { id: 'review', label: 'Review results' }] }))
        }}
        renderCard={(card: LumenKanbanCard) => <LumenText>{`${card.label} · App-owned content`}</LumenText>}
      />
      <LumenText>{`Opened card: ${opened}`}</LumenText>
    </View>
  )
}

import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenCheckbox, LumenKanbanBoard, type LumenKanbanColumnData } from '@santi020k/lumen-react-native'

export const KanbanBoardParityExample = (): ReactElement => {
  const [columns, setColumns] = useState<readonly LumenKanbanColumnData[]>([
    { id: 'todo', label: 'To do', cards: [{ id: 'design', label: 'Design mobile board' }, { id: 'test', label: 'Test keyboard moves' }] },
    { id: 'done', label: 'Done (capacity 1)', cards: [], capacity: 1 }
  ])

  const [disabled, setDisabled] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  return (
    <View>
      <LumenCheckbox label="Disable board" checked={disabled} onCheckedChange={setDisabled} />
      <LumenCheckbox label="Empty board" checked={empty} onCheckedChange={setEmpty} />
      <LumenCheckbox label="Read-only board" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenKanbanBoard
        label="Project board"
        columns={empty ? [] : columns}
        onColumnsChange={setColumns}
        disabled={disabled}
        readOnly={readOnly}
        loading={loading}
        error={error ? 'Board unavailable' : null}
      />
    </View>
  )
}

import { Field, Input, Label } from './components.js'
import type { DataTableViewRange } from './data-table-range-model.js'

interface RangeControlsProps {
  columns: readonly { key: string, label: string, rangeFilter?: 'number' | 'date' }[]
  ranges: readonly DataTableViewRange[]
  id: string
  disabled: boolean
  fromLabel: (label: string) => string
  toLabel: (label: string) => string
  onChange: (ranges: DataTableViewRange[]) => void
}

export const DataTableRangeControls = ({
  columns, ranges, id, disabled, fromLabel, toLabel, onChange
}: RangeControlsProps) => columns.filter(column => column.rangeFilter).map((column, index) => (
  <fieldset key={column.key} className="ui-data-table-view__range" disabled={disabled}>
    <legend>{column.label}</legend>
    {(['from', 'to'] as const).map(bound => (
      <Field key={bound} controlId={`${id}-range-${index}-${bound}`}>
        <Label htmlFor={`${id}-range-${index}-${bound}`}>{(bound === 'from' ? fromLabel : toLabel)(column.label)}</Label>
        <Input
          id={`${id}-range-${index}-${bound}`}
          type={column.rangeFilter === 'date' ? 'date' : 'number'}
          step={column.rangeFilter === 'number' ? 'any' : undefined}
          value={ranges.find(range => range.id === column.key)?.[bound] ?? ''}
          onChange={event => {
            const existing = ranges.find(range => range.id === column.key) ?? { id: column.key, from: '', to: '' }
            const next = { ...existing, [bound]: event.currentTarget.value }
            const remaining = ranges.filter(range => range.id !== column.key)

            onChange(next.from || next.to ? [...remaining, next] : remaining)
          }}
        />
      </Field>
    ))}
  </fieldset>
))

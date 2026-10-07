'use client'

import { useId, useState } from 'react'

import { Button, Field, Input, Label, NativeSelect } from './components.js'
import { parseDataTableViewState } from './data-table-state.js'
import type { DataTableViewState } from './data-table-view.js'

export interface DataTableSavedView {
  id: string
  label: string
  state: DataTableViewState
}

export interface DataTableSavedViewsProps {
  views: readonly DataTableSavedView[]
  state: DataTableViewState
  activeId?: string | undefined
  resetState: DataTableViewState
  onApply: (state: DataTableViewState, id: string | undefined) => void
  onSave: (label: string, state: DataTableViewState) => void
  onUpdate?: (id: string, state: DataTableViewState) => void
  onRemove?: (id: string) => void
  disabled?: boolean
  labels?: Partial<{
    region: string
    view: string
    custom: string
    name: string
    save: string
    update: string
    remove: string
    reset: string
  }>
}

const labels = {
  region: 'Saved record views',
  view: 'Saved view',
  custom: 'Custom view',
  name: 'New view name',
  save: 'Save new view',
  update: 'Update view',
  remove: 'Remove view',
  reset: 'Reset view'
}

const savedState = (state: DataTableViewState): DataTableViewState => {
  const copied = parseDataTableViewState(state)

  return { ...copied, pagination: { ...copied.pagination, pageIndex: 0 } }
}

const assertSavedViews = (views: readonly DataTableSavedView[]): void => {
  const ids = views.map(view => view.id)

  if (ids.some(value => typeof value !== 'string' || !value.trim()) || new Set(ids).size !== ids.length)
    throw new TypeError('Saved views require unique, nonempty IDs.')
}

/** Persistence and account scoping are explicit host callbacks. No browser storage is accessed. */
export const DataTableSavedViews = ({
  views, state, activeId, resetState, onApply, onSave, onUpdate, onRemove, disabled = false, labels: overrides
}: DataTableSavedViewsProps) => {
  const id = useId()
  const [name, setName] = useState('')
  const text = { ...labels, ...overrides }

  assertSavedViews(views)

  const active = views.find(view => view.id === activeId)

  return (
    <section className="ui-data-table-view__saved" aria-label={text.region} aria-busy={disabled}>
      <Field controlId={`${id}-view`}>
        <Label htmlFor={`${id}-view`}>{text.view}</Label>
        <NativeSelect
          id={`${id}-view`}
          value={active?.id ?? ''}
          disabled={disabled}
          onChange={event => {
            const view = views.find(item => item.id === event.currentTarget.value)

            if (view) onApply(savedState(view.state), view.id)
          }}
        >
          <option value="" disabled>{text.custom}</option>
          {views.map(view => <option key={view.id} value={view.id}>{view.label}</option>)}
        </NativeSelect>
      </Field>
      <Field controlId={`${id}-name`}>
        <Label htmlFor={`${id}-name`}>{text.name}</Label>
        <Input
          id={`${id}-name`}
          value={name}
          maxLength={120}
          disabled={disabled}
          onChange={event => {
            setName(event.currentTarget.value)
          }}
        />
      </Field>
      <Button
        type="button"
        disabled={disabled || !name.trim()}
        onClick={() => {
          onSave(name.trim(), savedState(state))
        }}
      >
        {text.save}
      </Button>
      {onUpdate && (
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !active}
          onClick={() => {
            if (active) onUpdate(active.id, savedState(state))
          }}
        >
          {text.update}
        </Button>
      )}
      {onRemove && (
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !active}
          onClick={() => {
            if (active) onRemove(active.id)
          }}
        >
          {text.remove}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          onApply(savedState(resetState), undefined)
        }}
      >
        {text.reset}
      </Button>
    </section>
  )
}

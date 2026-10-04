import { type ComponentRef, type ReactElement, useRef, useState } from 'react'
import { FlatList, type TextInput, View } from 'react-native'

import { LumenFieldGroup } from './additional-components.js'
import type { LumenAutocompleteOption } from './advanced-form-components.js'
import { LumenSearchField } from './form-components.js'
import { LumenButton, LumenText } from './foundation-primitives.js'
import { LumenSheet } from './overlay-components.js'
import { LumenCheckbox } from './selection-components.js'

export interface LumenMultiSelectProps {
  chooseLabel?: string
  clearSearchLabel?: string
  description?: string
  doneLabel?: string
  emptyLabel?: string
  enabled?: boolean
  errorMessage?: string
  label: string
  loading?: boolean
  loadingLabel?: string
  onQueryChange: (query: string) => void
  onRetry?: () => void
  onValuesChange: (values: Set<string>) => void
  options: readonly LumenAutocompleteOption[]
  query: string
  readOnly?: boolean
  removeLabel?: (label: string) => string
  resultsErrorMessage?: string
  retryLabel?: string
  searchLabel?: string
  selectionLabel?: (count: number) => string
  values: ReadonlySet<string>
}

const validateOptions = (options: readonly LumenAutocompleteOption[]): void => {
  if (options.some(option => !option.value.trim() || !option.label.trim()) ||
    new Set(options.map(option => option.value)).size !== options.length) {
    throw new Error('MultiSelect options require unique, nonempty values and nonempty labels')
  }
}

const Results = (props: LumenMultiSelectProps): ReactElement => {
  if (props.loading) return <LumenText accessibilityLiveRegion="polite">{props.loadingLabel ?? 'Loading options'}</LumenText>

  if (props.resultsErrorMessage) return (
    <View>
      <LumenText accessibilityLiveRegion="polite">{props.resultsErrorMessage}</LumenText>
      {props.onRetry ?
        (
          <LumenButton onPress={() => {
            if (props.enabled !== false && !props.readOnly) props.onRetry?.()
          }}
          >
            {props.retryLabel ?? 'Retry'}
          </LumenButton>
        ) :
        null}
    </View>
  )

  return (
    <FlatList
      data={props.options}
      style={{ maxHeight: 280, flexShrink: 1 }}
      keyExtractor={option => option.value}
      ListEmptyComponent={<LumenText>{props.emptyLabel ?? 'No matching options'}</LumenText>}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <LumenCheckbox
          accessibilityLabel={item.label}
          aria-label={item.label}
          checked={props.values.has(item.value)}
          aria-checked={props.values.has(item.value)}
          aria-disabled={item.disabled ?? false}
          disabled={item.disabled ?? false}
          label={item.label}
          {...(item.description === undefined ? {} : { description: item.description })}
          onCheckedChange={() => {
            if (item.disabled || props.enabled === false || props.readOnly) return

            const proposal = new Set(props.values)

            if (proposal.has(item.value)) proposal.delete(item.value)
            else proposal.add(item.value)

            props.onValuesChange(proposal)
          }}
        />
      )}
    />
  )
}

const SelectedValues = (props: LumenMultiSelectProps & { editable: boolean }): ReactElement => {
  const removeLabel = props.removeLabel ?? (label => `Remove ${label}`)

  return (
    <>
      {Array.from(props.values, value => {
        const option = props.options.find(candidate => candidate.value === value)
        const label = option?.label ?? value

        return (
          <LumenButton
            accessibilityLabel={removeLabel(label)}
            disabled={!props.editable || (option?.disabled ?? false)}
            intent="quiet"
            key={value}
            onPress={() => {
              if (!props.editable || option?.disabled) return

              const proposal = new Set(props.values)

              proposal.delete(value)

              props.onValuesChange(proposal)
            }}
          >
            {removeLabel(label)}
          </LumenButton>
        )
      })}
    </>
  )
}

const fieldGroupProps = (props: LumenMultiSelectProps) => ({
  label: props.label,
  ...(props.description === undefined ? {} : { description: props.description }),
  ...(props.errorMessage === undefined ? {} : { errorMessage: props.errorMessage })
})

const MultiSelectControl = (props: LumenMultiSelectProps): ReactElement => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<ComponentRef<typeof View>>(null)
  const searchRef = useRef<ComponentRef<typeof TextInput>>(null)
  const editable = props.enabled !== false && !props.readOnly
  const selectionLabel = props.selectionLabel ?? (count => `${count} selected`)

  validateOptions(props.options)

  return (
    <LumenFieldGroup
      {...fieldGroupProps(props)}
    >
      <LumenButton
        disabled={!editable}
        ref={triggerRef}
        intent="secondary"
        onPress={() => {
          if (editable) setOpen(true)
        }}
      >
        {`${props.chooseLabel ?? 'Choose options'} · ${selectionLabel(props.values.size)}`}
      </LumenButton>
      <SelectedValues {...props} editable={editable} />
      <LumenSheet
        avoidKeyboard
        initialFocusRef={searchRef}
        returnFocusRef={triggerRef}
        title={props.label}
        visible={open && editable}
        onDismiss={() => {
          setOpen(false)
        }}
        scrollable={false}
        actions={(
          <LumenButton onPress={() => {
            setOpen(false)
          }}
          >
            {props.doneLabel ?? 'Done'}
          </LumenButton>
        )}
      >
        <LumenSearchField
          ref={searchRef}
          accessibilityLabel={props.searchLabel ?? 'Search options'}
          clearLabel={props.clearSearchLabel ?? 'Clear search'}
          prompt={props.searchLabel ?? 'Search options'}
          value={props.query}
          onChangeText={query => {
            if (editable) props.onQueryChange(query)
          }}
        />
        <Results {...props} />
      </LumenSheet>
    </LumenFieldGroup>
  )
}

/** Controlled selection and search; switching to a blocked state closes the transient sheet. */
export const LumenMultiSelect = (props: LumenMultiSelectProps): ReactElement => (
  <MultiSelectControl key={`${props.enabled ?? true}-${props.readOnly ?? false}`} {...props} />
)

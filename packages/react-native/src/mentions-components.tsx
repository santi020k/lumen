import { type ReactElement, type RefObject, useEffect, useRef, useState } from 'react'
import { type BlurEvent, Platform, Pressable, type TextInput, type TextInputEndEditingEvent,
  type TextInputKeyPressEvent,
  type TextInputSelectionChangeEvent, View, type ViewProps } from 'react-native'

import { filterLumenMentionOptions, insertLumenMention, isLumenMentionsSelectionValid,
  type LumenMentionOption, type LumenMentionsValue, resolveLumenMentionQuery } from './mentions-recipes.js'
import { LumenText, LumenTextField } from './primitives.js'
import { useLumenTheme } from './theme-context.js'

export interface LumenMentionsLabels {
  suggestions: string
  empty: string
  loading: string
  error: string
  invalid: string
  readOnly: string
}
export interface LumenMentionsProps extends Omit<ViewProps, 'children'> {
  label: string
  value: LumenMentionsValue
  onValueChange: (value: LumenMentionsValue) => void
  options: readonly LumenMentionOption[]
  trigger?: string
  disabled?: boolean
  readOnly?: boolean
  isComposing?: boolean
  status?: 'ready' | 'loading' | 'error'
  placeholder?: string
  labels?: Partial<LumenMentionsLabels>
}

const defaults: LumenMentionsLabels = {
  suggestions: 'Mention suggestions',
  empty: 'No matching mentions',
  loading: 'Loading suggestions',
  error: 'Unable to load suggestions',
  invalid: 'Invalid text selection',
  readOnly: 'Read-only'
}

const signature = (value: LumenMentionsValue): string => (
  JSON.stringify([value.text, value.selection.start, value.selection.end])
)

const eventComposing = (event: TextInputKeyPressEvent): boolean => {
  const nativeEvent = event.nativeEvent

  return ('isComposing' in nativeEvent && nativeEvent.isComposing === true) ||
    ('keyCode' in nativeEvent && nativeEvent.keyCode === 229)
}

const keyboardOption = (name: string, options: readonly LumenMentionOption[], activeId?: string) => {
  if (name === 'Home') return options[0]

  if (name === 'End') return options.at(-1)

  if (name !== 'ArrowDown' && name !== 'ArrowUp') return undefined

  const current = options.findIndex(option => option.id === activeId)
  const offset = name === 'ArrowDown' ? 1 : -1

  return options[(current + offset + options.length) % options.length]
}

const canInteract = (editable: boolean, ready: boolean, composing: boolean, waiting: boolean): boolean => (
  editable && ready && !composing && !waiting
)

interface PendingMention { id: string, source: string }

const useMentionsInput = (value: LumenMentionsValue, emit: (value: LumenMentionsValue) => void,
  options: readonly LumenMentionOption[], trigger: string, editable: boolean, isComposing: boolean, ready: boolean,
  inputRef: RefObject<TextInput | null>) => {
  const nativeValueRef = useRef(value)
  const pendingMentionRef = useRef<PendingMention | null>(null)
  const insertedValueRef = useRef<{ source: string, value: LumenMentionsValue } | null>(null)
  const [focused, setFocused] = useState(false)
  const [waitingSelection, setWaitingSelection] = useState(false)
  const [nativeText, setNativeText] = useState(value.text)
  const [acceptedSource, setAcceptedSource] = useState(() => signature(value))
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const source = signature(value)

  if (!isComposing && !waitingSelection && acceptedSource !== source) {
    setAcceptedSource(source)

    setNativeText(value.text)
  }

  useEffect(() => {
    if (!isComposing && !waitingSelection) nativeValueRef.current = value
  }, [value, isComposing, waitingSelection])

  useEffect(() => {
    const pending = insertedValueRef.current

    if (!pending) return

    if (signature(pending.value) === signature(value)) {
      insertedValueRef.current = null

      inputRef.current?.focus()
    } else if (signature(value) !== pending.source) insertedValueRef.current = null
  }, [value, attempt, inputRef])

  const interactive = canInteract(editable, ready, isComposing, waitingSelection)
  const visible = focused && dismissed !== source
  const query = interactive && visible ? resolveLumenMentionQuery(value, trigger) : null
  const matches = filterLumenMentionOptions(options, query)
  const enabledOptions = matches.filter(option => !option.disabled)
  const active = enabledOptions.find(option => option.id === activeId) ?? enabledOptions[0]

  const begin = (id: string): void => {
    if (!interactive || !focused || pendingMentionRef.current || signature(nativeValueRef.current) !== source) return

    const option = matches.find(item => item.id === id)

    if (!option || option.disabled) return

    insertedValueRef.current = null

    pendingMentionRef.current = { id, source }

    inputRef.current?.blur()
  }

  const finish = (text: string): void => {
    const pending = pendingMentionRef.current

    pendingMentionRef.current = null

    setFocused(false)

    setWaitingSelection(false)

    if (!pending || !editable || !ready || isComposing || pending.source !== source) return

    if (text !== value.text || signature(nativeValueRef.current) !== source) return

    const option = filterLumenMentionOptions(options, resolveLumenMentionQuery(value, trigger))
      .find(item => item.id === pending.id)

    const next = option ? insertLumenMention(value, option, trigger) : null

    if (!next) return

    insertedValueRef.current = { source, value: next }

    emit(next)

    setAttempt(current => current + 1)
  }

  const changeText = (text: string): void => {
    if (!editable) return

    nativeValueRef.current = { ...nativeValueRef.current, text }

    setNativeText(text)

    setWaitingSelection(true)
  }

  const changeSelection = (event: TextInputSelectionChangeEvent): void => {
    if (!editable) return

    nativeValueRef.current = { ...nativeValueRef.current, selection: event.nativeEvent.selection }

    setWaitingSelection(false)

    emit(nativeValueRef.current)
  }

  const key = (event: TextInputKeyPressEvent): void => {
    if (!interactive || !query || eventComposing(event)) return

    const name = event.nativeEvent.key

    if (name === 'Escape') {
      event.preventDefault()

      setDismissed(source)

      return
    }

    if (name === 'Enter' && active) {
      event.preventDefault()

      begin(active.id)

      return
    }

    const next = keyboardOption(name, enabledOptions, active?.id)

    if (next) {
      event.preventDefault()

      setActiveId(next.id)
    }
  }

  return {
    matches,
    active,
    query,
    nativeText,
    waitingSelection,
    begin,
    end: (event: TextInputEndEditingEvent): void => {
      finish(event.nativeEvent.text)
    },
    key,
    changeText,
    changeSelection,
    focus: (): void => {
      nativeValueRef.current = value

      setNativeText(value.text)

      setFocused(true)

      setDismissed(null)
    },
    blur: (event: BlurEvent): void => {
      setFocused(false)

      // RN Web delivers final text on blur and does not implement onEndEditing.
      if (Platform.OS !== 'web') return

      const nativeEvent = event.nativeEvent

      if ('text' in nativeEvent && typeof nativeEvent.text === 'string') finish(nativeEvent.text)
    } }
}

type MentionsState = ReturnType<typeof useMentionsInput>

const displayText = (value: LumenMentionsValue, state: MentionsState, composing: boolean): string => (
  composing || state.waitingSelection ? state.nativeText : value.text
)

const selectionProps = (value: LumenMentionsValue, composing: boolean, waiting: boolean, valid = true) => (
  valid && isLumenMentionsSelectionValid(value) && !composing && !waiting ? { selection: value.selection } : {}
)

const MentionsSuggestions = ({ state, label }: { state: MentionsState, label: string }): ReactElement | null => {
  const theme = useLumenTheme()

  if (!state.matches.length) return null

  return (
    <View accessibilityRole="menu" accessibilityLabel={label}>
      {state.matches.map(option => (
        <Pressable
          key={option.id}
          accessibilityRole="menuitem"
          accessibilityLabel={option.label}
          accessibilityState={{ disabled: Boolean(option.disabled), selected: state.active?.id === option.id }}
          aria-disabled={Boolean(option.disabled)}
          disabled={option.disabled}
          onPointerDown={event => {
            if (Platform.OS === 'web') event.preventDefault()
          }}
          onPress={() => {
            state.begin(option.id)
          }}
          style={{ minHeight: 44,
            justifyContent: 'center',
            paddingHorizontal: theme.spacing.md,
            backgroundColor: state.active?.id === option.id ? theme.colors.brandSoft : theme.colors.surface,
            opacity: option.disabled ? 0.5 : 1 }}
        >
          <LumenText>{option.label}</LumenText>
        </Pressable>
      ))}
    </View>
  )
}

const MentionsMessages = ({ valid, status, state, labels }: {
  valid: boolean
  status: 'ready' | 'loading' | 'error'
  state: MentionsState
  labels: LumenMentionsLabels
}): ReactElement => (
  <>
    {!valid && <LumenText accessibilityRole="alert" tone="danger">{labels.invalid}</LumenText>}
    {status !== 'ready' && <LumenText accessibilityRole="alert">{labels[status]}</LumenText>}
    {state.query && state.matches.length === 0 && <LumenText accessibilityRole="alert">{labels.empty}</LumenText>}
  </>
)

const mentionsText = (input: unknown): string => (
  typeof input === 'object' && input !== null && 'text' in input && typeof input.text === 'string' ? input.text : ''
)

const safeMentionsValue = (value: LumenMentionsValue, valid: boolean): LumenMentionsValue => (
  valid ? value : { text: mentionsText(value), selection: { start: 0, end: 0 } }
)

export const LumenMentions = ({ label, value, onValueChange, options, trigger = '@', disabled = false,
  readOnly = false, isComposing = false, status = 'ready', placeholder, labels, style, ...props }: LumenMentionsProps): ReactElement => {
  const theme = useLumenTheme()
  const text = { ...defaults, ...labels }
  const valid = isLumenMentionsSelectionValid(value)
  const safeValue = safeMentionsValue(value, valid)
  const editable = valid && !disabled && !readOnly
  const inputRef = useRef<TextInput>(null)
  const state = useMentionsInput(safeValue, onValueChange, options, trigger, editable, isComposing, status === 'ready', inputRef)

  return (
    <View {...props} style={[{ gap: theme.spacing.sm }, style]}>
      <LumenText>{label}</LumenText>
      <LumenTextField
        ref={inputRef}
        value={displayText(safeValue, state, isComposing)}
        {...selectionProps(safeValue, isComposing, state.waitingSelection, valid)}
        accessibilityLabel={label}
        accessibilityRole="combobox"
        accessibilityState={{ disabled, expanded: state.matches.length > 0, busy: status === 'loading' }}
        aria-expanded={state.matches.length > 0}
        aria-busy={status === 'loading'}
        aria-disabled={disabled}
        accessibilityHint={readOnly ? text.readOnly : text.suggestions}
        placeholder={placeholder}
        editable={editable}
        multiline
        style={{ minHeight: 120, textAlignVertical: 'top' }}
        autoCorrect={false}
        onChangeText={state.changeText}
        onSelectionChange={state.changeSelection}
        onFocus={state.focus}
        onBlur={state.blur}
        onEndEditing={state.end}
        onKeyPress={state.key}
        submitBehavior={state.active ? 'blurAndSubmit' : 'newline'}
        onSubmitEditing={() => {
          if (state.active) state.begin(state.active.id)
        }}
        error={!valid}
      />
      <MentionsMessages valid={valid} status={status} state={state} labels={text} />
      <MentionsSuggestions state={state} label={text.suggestions} />
    </View>
  )
}

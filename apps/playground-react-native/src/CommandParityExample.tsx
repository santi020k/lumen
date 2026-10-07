import { type ReactElement, useState } from 'react'
import { View } from 'react-native'

import { LumenButton, LumenCheckbox, LumenCommand, type LumenCommandGroup, type LumenCommandItem, LumenSheet, LumenText } from '@santi020k/lumen-react-native'

const groups: readonly LumenCommandGroup[] = [
  { id: 'navigation',
    label: 'Navigation',
    items: [
      { id: 'note', label: 'Show documentation note', detail: 'Read local guidance', keywords: ['guide', 'manual'], shortcut: '⌘D' }
    ] },
  { id: 'actions',
    label: 'Actions',
    items: [
      { id: 'preview', label: 'Toggle preview' },
      { id: 'reset', label: 'Reset example' },
      { id: 'unavailable', label: 'Unavailable command', disabled: true }
    ] }
]

export const CommandParityExample = (): ReactElement => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>('note')
  const [readOnly, setReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [preview, setPreview] = useState(false)
  const [message, setMessage] = useState('Choose a command')

  const select = (item: LumenCommandItem): void => {
    if (item.id === 'preview') setPreview(current => !current)

    if (item.id === 'reset') {
      setPreview(false)

      setQuery('')

      setActiveId(null)
    }

    setMessage(item.id === 'note' ? 'Documentation: search for a component and inspect its public contract.' : `Selected ${item.label}`)

    setOpen(false)
  }

  return (
    <View>
      <LumenCheckbox label="Read only" checked={readOnly} onCheckedChange={setReadOnly} />
      <LumenCheckbox label="Loading" checked={loading} onCheckedChange={setLoading} />
      <LumenCheckbox label="Error" checked={error} onCheckedChange={setError} />
      <LumenCheckbox label="Empty" checked={empty} onCheckedChange={setEmpty} />
      <LumenButton onPress={() => {
        setOpen(true)
      }}
      >
        <LumenText>Open commands</LumenText>
      </LumenButton>
      <LumenSheet
        visible={open}
        onDismiss={() => {
          setOpen(false)
        }}
        avoidKeyboard
        presentation="adaptive"
      >
        <LumenCommand
          label="Project commands"
          groups={empty ? [] : groups}
          open={open}
          onOpenChange={setOpen}
          query={query}
          onQueryChange={next => {
            setQuery(next)

            setActiveId(null)
          }}
          activeId={activeId}
          onActiveIdChange={setActiveId}
          onSelect={select}
          readOnly={readOnly}
          loading={loading}
          error={error ? 'Commands unavailable' : null}
          formatCount={count => `${count} commands`}
        />
      </LumenSheet>
      <LumenText>{message}</LumenText>
      <LumenText>{preview ? 'Preview enabled' : 'Preview disabled'}</LumenText>
    </View>
  )
}

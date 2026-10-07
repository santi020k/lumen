'use client'

import { useRef, useState } from 'react'

import { Command, Input, Typography } from '@santi020k/lumen-react'

export type WorkspaceCommand = 'search' | 'create' | 'review'

const commands: readonly { id: WorkspaceCommand, label: string }[] = [
  { id: 'search', label: 'Search project documentation' },
  { id: 'create', label: 'Create a task draft' },
  { id: 'review', label: 'Review pending proposals' }
]

export const CommandCenterRecipe = ({ onCommand }: { onCommand?: (command: WorkspaceCommand) => void }) => {
  const [selected, setSelected] = useState('')
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([])
  const matches = commands.filter(command => command.label.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <section aria-label="Workspace commands">
      <Typography>
        <h2>What would you like to do?</h2>
        <p>Search with the keyboard, then choose a command.</p>
      </Typography>
      <Command>
        <Input
          ref={inputRef}
          type="search"
          aria-label="Search workspace commands"
          placeholder="Search commands…"
          value={query}
          onChange={event => {
            setQuery(event.currentTarget.value)
          }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' && matches.length > 0) {
              event.preventDefault()

              itemsRef.current[0]?.focus()
            }
          }}
        />
        {matches.map((command, index) => (
          <button
            key={command.id}
            ref={element => {
              itemsRef.current[index] = element
            }}
            data-ui-command-item
            type="button"
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.preventDefault()

                inputRef.current?.focus()
              } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault()

                let next = (index + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length

                if (event.key === 'Home') next = 0

                if (event.key === 'End') next = matches.length - 1

                itemsRef.current[next]?.focus()
              }
            }}
            onClick={() => {
              setSelected(command.label)

              onCommand?.(command.id)
            }}
          >
            {command.label}
          </button>
        ))}
        {matches.length === 0 && <Typography><p role="status">No matching commands. Try another search.</p></Typography>}
      </Command>
      <p role="status">{selected ? `Selected: ${selected}` : 'Choose a command.'}</p>
    </section>
  )
}

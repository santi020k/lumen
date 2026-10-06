'use client'

import { useState } from 'react'

import { Command, Input, Typography } from '@santi020k/lumen-react'

export type WorkspaceCommand = 'search' | 'create' | 'review'

const commands: readonly { id: WorkspaceCommand, label: string }[] = [
  { id: 'search', label: 'Search project documentation' },
  { id: 'create', label: 'Create a task draft' },
  { id: 'review', label: 'Review pending proposals' }
]

export const CommandCenterRecipe = ({ onCommand }: { onCommand?: (command: WorkspaceCommand) => void }) => {
  const [selected, setSelected] = useState('')

  return (
    <section aria-label="Workspace commands">
      <Typography>
        <h2>What would you like to do?</h2>
        <p>Search with the keyboard, then choose a command.</p>
      </Typography>
      <Command>
        <Input type="search" aria-label="Search workspace commands" placeholder="Search commands…" />
        {commands.map(command => (
          <button
            key={command.id}
            data-ui-command-item
            type="button"
            onClick={() => {
              setSelected(command.label)

              onCommand?.(command.id)
            }}
          >
            {command.label}
          </button>
        ))}
      </Command>
      <p role="status">{selected ? `Selected: ${selected}` : 'Choose a command.'}</p>
    </section>
  )
}

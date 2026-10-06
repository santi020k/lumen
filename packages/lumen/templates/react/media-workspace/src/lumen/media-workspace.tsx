'use client'

import type { ReactNode } from 'react'

import { moveLumenMediaItem, resolveLumenMediaSelection, toggleLumenMediaSelection } from '@santi020k/lumen-core/media-workspace'
import { Button, Card, Image, MediaFilmstrip, MediaThumbnail, Stack, Toolbar } from '@santi020k/lumen-react'

// Import the installed media-workspace.css once at the application's style boundary.

export interface MediaWorkspaceItem {
  alt: string
  disabled?: boolean
  height: number
  id: string
  label: string
  src: string
  width: number
}

export interface MediaWorkspaceRecipeProps {
  bottomControls?: ReactNode
  collectionLabel: string
  formatSelection: (count: number) => string
  inspector: ReactNode
  inspectorLabel: string
  items: readonly MediaWorkspaceItem[]
  moveEarlierLabel: string
  moveLaterLabel: string
  onItemsChange: (items: MediaWorkspaceItem[]) => void
  onSelectionChange: (ids: string[]) => void
  preview: ReactNode
  previewLabel: string
  selectedIds: readonly string[]
  showTitle?: boolean
  title: string
  tools: ReactNode
  toolsLabel: string
}

/** Compose a preview, supporting controls and inspector without owning photo services or drafts. */
export const MediaWorkspaceRecipe = ({
  bottomControls, collectionLabel, formatSelection, inspector, inspectorLabel, items,
  moveEarlierLabel, moveLaterLabel, onItemsChange, onSelectionChange, preview, previewLabel,
  selectedIds, showTitle = true, title, tools, toolsLabel
}: MediaWorkspaceRecipeProps) => {
  const selection = resolveLumenMediaSelection(items, selectedIds)

  return (
    <section className="lumen-media-workspace" aria-label={title}>
      {showTitle && <h2>{title}</h2>}
      <div className="lumen-media-workspace__layout">
        <div className="lumen-media-workspace__preview" role="group" aria-label={previewLabel}>{preview}</div>
        <Card className="lumen-media-workspace__inspector" aria-label={inspectorLabel}>{inspector}</Card>
      </div>
      <Card glass="subtle" className="lumen-media-workspace__tools">
        <Toolbar aria-label={toolsLabel}>{tools}</Toolbar>
      </Card>
      <MediaFilmstrip label={collectionLabel} selectionLabel={formatSelection(selection.length)}>
        {items.map((item, index) => (
          <li key={item.id}>
            <MediaThumbnail
              label={item.label}
              order={index + 1}
              selected={selection.includes(item.id)}
              disabled={item.disabled}
              onClick={() => {
                onSelectionChange(toggleLumenMediaSelection(items, selection, item.id))
              }}
            >
              <Image src={item.src} alt={item.alt} width={item.width} height={item.height} />
            </MediaThumbnail>
            <Stack gap="related">
              <Button
                variant="outline"
                aria-label={`${moveEarlierLabel}: ${item.label}`}
                disabled={item.disabled === true || index === 0}
                onClick={() => {
                  onItemsChange(moveLumenMediaItem(items, item.id, index - 1))
                }}
              >
                {moveEarlierLabel}
              </Button>
              <Button
                variant="outline"
                aria-label={`${moveLaterLabel}: ${item.label}`}
                disabled={item.disabled === true || index === items.length - 1}
                onClick={() => {
                  onItemsChange(moveLumenMediaItem(items, item.id, index + 1))
                }}
              >
                {moveLaterLabel}
              </Button>
            </Stack>
          </li>
        ))}
      </MediaFilmstrip>
      {bottomControls && <Card className="lumen-media-workspace__bottom">{bottomControls}</Card>}
    </section>
  )
}

'use client'

import { type ReactNode, useId } from 'react'

import { Button, Card, Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle, Sheet, Typography, useDialog } from '@santi020k/lumen-react'

export interface CardDetailRecipeProps {
  title: string
  summary: string
  children?: ReactNode
  openLabel?: string
  closeLabel?: string
  presentation?: 'dialog' | 'sheet'
}

/** A real button opens the details; the public modal controller restores focus on dismissal. */
export const CardDetailRecipe = ({ title, summary, children, openLabel = 'View details', closeLabel = 'Close details', presentation = 'dialog' }: CardDetailRecipeProps) => {
  const id = useId()
  const dialog = useDialog()

  const content = (
    <>
      <DialogHeader><DialogTitle id={`${id}-title`}>{title}</DialogTitle></DialogHeader>
      <DialogBody>{children}</DialogBody>
      <DialogFooter><Button variant="outline" {...dialog.closeProps}>{closeLabel}</Button></DialogFooter>
    </>
  )

  return (
    <>
      <Card className="lumen-card-detail">
        <Typography><h3>{title}</h3></Typography>
        <p className="lumen-card-detail__summary">{summary}</p>
        <Button variant="outline" aria-controls={id} aria-expanded={dialog.open} {...dialog.triggerProps}>{openLabel}</Button>
      </Card>
      {presentation === 'sheet' ?
        (
          <Sheet
            {...dialog.dialogProps}
            id={id}
            aria-labelledby={`${id}-title`}
            className="lumen-card-detail__surface"
          >
            {content}
          </Sheet>
        ) :
        (
          <Dialog
            id={id}
            open={dialog.open}
            onOpenChange={dialog.setOpen}
            aria-labelledby={`${id}-title`}
            className="lumen-card-detail__surface"
          >
            {content}
          </Dialog>
        )}
    </>
  )
}

'use client'

import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import '@santi020k/lumen-react/styles/components/button.css'
import '@santi020k/lumen-react/styles/components/dialog.css'
import '@santi020k/lumen-react/styles/components/dialog-header.css'
import '@santi020k/lumen-react/styles/components/dialog-title.css'
import '@santi020k/lumen-react/styles/components/dialog-body.css'
import '@santi020k/lumen-react/styles/components/dialog-close.css'
import '@santi020k/lumen-react/styles/components/link.css'
import '@santi020k/lumen-react/styles/components/media-viewport.css'
import './image-viewer.css'

import { Button } from '@santi020k/lumen-react/components/button'
import { Dialog, DialogBody, DialogClose, DialogHeader, DialogTitle } from '@santi020k/lumen-react/components/dialog'
import { Link } from '@santi020k/lumen-react/components/link'
import { MediaViewport, type MediaViewportProps } from '@santi020k/lumen-react/components/media-viewport'

const defaultLabels = {
  close: 'Close',
  failure: 'The image could not be loaded.',
  loading: 'Loading image…',
  open: 'View larger image',
  original: 'Open original image',
  retry: 'Retry'
}

const subscribeHydration = () => () => undefined
const hydrated = () => true
const serverSnapshot = () => false

export interface ImageViewerProps {
  id: string
  href: string
  title: string
  image: ReactNode
  caption?: ReactNode
  ratio?: number
  locale?: string
  viewportLabels?: MediaViewportProps['labels']
  labels?: Partial<typeof defaultLabels>
}

interface ImageContentProps {
  image: ReactNode
  copy: typeof defaultLabels
  title: string
  ratio: number
  locale: string | undefined
  viewportLabels: MediaViewportProps['labels']
}

const imageStatus = (state: 'loading' | 'failed' | 'ready', copy: typeof defaultLabels): string => {
  if (state === 'loading') return copy.loading

  if (state === 'failed') return copy.failure

  return ''
}

const ImageContent = ({ image, copy, title, ratio, locale, viewportLabels }: ImageContentProps) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'failed' | 'ready'>('loading')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const img = mountRef.current?.querySelector('img')
    const connection = new AbortController()

    const inspect = () => {
      if (connection.signal.aborted) return

      if (!img) {
        setState('failed')

        return
      }

      if (!img.complete) {
        setState('loading')

        return
      }

      setState(img.naturalWidth > 0 ? 'ready' : 'failed')
    }

    if (img) {
      img.loading = 'eager'

      img.addEventListener('load', inspect, { signal: connection.signal })

      img.addEventListener('error', inspect, { signal: connection.signal })
    }

    queueMicrotask(inspect)

    return () => {
      connection.abort()
    }
  }, [image, revision])

  return (
    <>
      <p role="status">{imageStatus(state, copy)}</p>
      {state === 'failed' && (
        <Button onClick={() => {
          mountRef.current?.closest('dialog')?.querySelector<HTMLButtonElement>('button')?.focus()

          setRevision(value => value + 1)
        }}
        >
          {copy.retry}
        </Button>
      )}
      <div ref={mountRef} key={revision} hidden={state !== 'ready'}>
        <MediaViewport
          label={title}
          ratio={ratio}
          {...(locale === undefined ? {} : { locale })}
          labels={viewportLabels ?? {}}
        >
          {image}
        </MediaViewport>
      </div>
    </>
  )
}

export const ImageViewer = ({
  id, href, title, image, caption, ratio = 16 / 9, locale, viewportLabels, labels
}: ImageViewerProps) => {
  const copy = { ...defaultLabels, ...labels }
  const [open, setOpen] = useState(false)
  const ready = useSyncExternalStore(subscribeHydration, hydrated, serverSnapshot)

  return (
    <div className="image-viewer">
      {ready ?
        (
          <Button
            aria-haspopup="dialog"
            aria-controls={id}
            onClick={event => {
              event.currentTarget.focus({ preventScroll: true })

              setOpen(true)
            }}
          >
            {copy.open}
          </Button>
        ) :
        <Link href={href}>{copy.open}</Link>}
      <Dialog id={id} aria-labelledby={id + '-title'} open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle id={id + '-title'}>{title}</DialogTitle>
          <DialogClose autoFocus>{copy.close}</DialogClose>
        </DialogHeader>
        <DialogBody>
          {open && (
            <ImageContent
              key={href}
              image={image}
              copy={copy}
              title={title}
              ratio={ratio}
              locale={locale}
              viewportLabels={viewportLabels}
            />
          )}
          {caption}
          <Link href={href}>{copy.original}</Link>
        </DialogBody>
      </Dialog>
    </div>
  )
}

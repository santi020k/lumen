'use client'

import type { ComponentPropsWithRef, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  composeClassName,
  type LumenAttachmentPreviewLabels,
  lumenAttachmentPreviewLabels,
  type LumenAttachmentPreviewState,
  resolveLumenAttachmentPreviewState
} from '@santi020k/lumen-core'

import { Image } from './components.js'

export interface AttachmentPreviewProps extends ComponentPropsWithRef<'figure'> {
  actions?: ReactNode
  alt: string
  caption?: ReactNode
  contentType?: string
  labels?: Partial<LumenAttachmentPreviewLabels>
  onStateChange?: (state: LumenAttachmentPreviewState) => void
  retryKey?: number | string
  src?: string
  state?: LumenAttachmentPreviewState
}

export const AttachmentPreview = ({
  actions, alt, caption, children, className, contentType, labels, onStateChange, retryKey,
  src, state: requested, ...props
}: AttachmentPreviewProps) => {
  const [failure, setFailure] = useState<{ src: string | undefined, key: number | string | undefined } | null>(null)
  const failed = failure !== null && failure.src === src && failure.key === retryKey
  const state = resolveLumenAttachmentPreviewState(src, contentType, requested, failed)
  const previousStateRef = useRef(state)

  useEffect(() => {
    if (previousStateRef.current !== state) {
      previousStateRef.current = state

      onStateChange?.(state)
    }
  }, [onStateChange, state])

  const canPreview = resolveLumenAttachmentPreviewState(src, contentType) === 'ready'
  const copy = { ...lumenAttachmentPreviewLabels, ...labels }

  return (
    <figure {...props} className={composeClassName('ui-attachment-preview', className)} aria-busy={state === 'loading'} data-state={state}>
      <div data-slot="attachment-preview-media" hidden={state !== 'ready'}>
        {canPreview && (
          <Image
            key={`${src ?? ''}:${retryKey ?? ''}`}
            src={src}
            alt={alt}
            fit="contain"
            radius="none"
            loading="eager"
            onError={() => {
              setFailure({ src, key: retryKey })
            }}
          />
        )}
      </div>
      <p role="status" data-slot="attachment-preview-fallback" hidden={state === 'ready'}>{state === 'ready' ? '' : copy[state]}</p>
      {caption && <figcaption>{caption}</figcaption>}
      {children}
      {actions && <div data-slot="attachment-preview-actions">{actions}</div>}
    </figure>
  )
}

export type AttachmentListProps = ComponentPropsWithRef<'ul'>
export const AttachmentList = ({ className, ...props }: AttachmentListProps) => (
  <ul {...props} className={composeClassName('ui-attachment-list', className)} data-slot="attachment-list" />
)

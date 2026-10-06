'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

import {
  bindLumenApprovalCard,
  canSubmitLumenPrompt,
  composeClassName,
  createLumenPromptComposerController,
  type LumenApprovalResponseDetail,
  type LumenApprovalStatus,
  type LumenPromptComposerController,
  type LumenPromptSubmitDetail,
  type LumenStreamStatus,
  type LumenToolStatus,
  normalizeLumenPromptLimit,
  readLumenApprovalResponseDetail,
  readLumenPromptSubmitDetail,
  resolveLumenCitationHref
} from '@santi020k/lumen-core'

import { Button, Card, Collapsible, Form, Label, Link, Message, Prose, Stack, Textarea } from './components.js'

export interface PromptComposerProps extends Omit<ComponentPropsWithoutRef<'form'>, 'defaultValue'> {
  actions?: ReactNode
  defaultValue?: string
  disabled?: boolean
  label?: string
  maxLength?: number
  onPromptSubmit?: (detail: LumenPromptSubmitDetail) => void
  onStop?: () => void
  onValueChange?: (value: string) => void
  pending?: boolean
  sendLabel?: string
  stopLabel?: string
  submitOnEnter?: boolean
  value?: string
}

const promptLabels = (label?: string, sendLabel?: string, stopLabel?: string) => ({
  label: label ?? 'Message', sendLabel: sendLabel ?? 'Send', stopLabel: stopLabel ?? 'Stop'
})

export const PromptComposer = ({
  actions, children, className, defaultValue = '', disabled = false, id, label, maxLength,
  onPromptSubmit, onStop, onValueChange, pending = false, sendLabel, stopLabel, submitOnEnter = false,
  value, onReset, ...props
}: PromptComposerProps) => {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [draft, setDraft] = useState(defaultValue)
  const text = value ?? draft
  const limit = normalizeLumenPromptLimit(maxLength)
  const formRef = useRef<HTMLFormElement>(null)
  const controllerRef = useRef<LumenPromptComposerController>(null)
  const labels = promptLabels(label, sendLabel, stopLabel)

  useEffect(() => {
    const form = formRef.current

    if (!form) return

    controllerRef.current = createLumenPromptComposerController(form)

    const submit = (event: Event): void => {
      if (!('detail' in event)) return

      const detail = readLumenPromptSubmitDetail(event.detail)

      if (detail && onPromptSubmit) {
        event.preventDefault()

        onPromptSubmit(detail)
      }
    }

    const stop = (): void => {
      onStop?.()
    }

    form.addEventListener('ui:prompt-submit', submit)

    form.addEventListener('ui:prompt-stop', stop)

    return () => {
      controllerRef.current?.destroy()

      controllerRef.current = null

      form.removeEventListener('ui:prompt-submit', submit)

      form.removeEventListener('ui:prompt-stop', stop)
    }
  }, [onPromptSubmit, onStop])

  useEffect(() => {
    controllerRef.current?.sync()
  }, [text, limit, disabled, pending])

  return (
    <Form
      {...props}
      ref={formRef}
      className={composeClassName('ui-prompt-composer', className)}
      data-disabled={String(disabled)}
      data-pending={String(pending)}
      data-submit-on-enter={String(submitOnEnter)}
      data-ui-prompt-composer
      enhance={false}
      method="post"
      onReset={event => {
        onReset?.(event)

        if (!event.defaultPrevented && value === undefined) {
          setDraft(defaultValue)

          onValueChange?.(defaultValue)
        }
      }}
      status={pending ? 'submitting' : 'idle'}
    >
      <Label htmlFor={inputId}>{labels.label}</Label>
      <Textarea
        id={inputId}
        data-ui-prompt-input
        disabled={disabled}
        maxLength={limit}
        name="prompt"
        onChange={event => {
          if (value === undefined) setDraft(event.currentTarget.value)

          onValueChange?.(event.currentTarget.value)
        }}
        rows={3}
        required
        value={text}
      />
      <Stack direction="horizontal" gap="related" wrap>
        {actions}
        <Button data-ui-prompt-send disabled={disabled || pending || !canSubmitLumenPrompt(text, limit)} type="submit">{labels.sendLabel}</Button>
        <Button data-ui-prompt-stop disabled={disabled} hidden={!pending} type="button" variant="secondary">{labels.stopLabel}</Button>
      </Stack>
      {children}
    </Form>
  )
}

export interface StreamMessageProps extends ComponentPropsWithoutRef<'article'> {
  actions?: ReactNode
  label?: string
  sources?: ReactNode
  status?: LumenStreamStatus
  statusLabel: string
}

export const StreamMessage = ({ actions, children, className, label = 'Assistant', sources, status = 'idle', statusLabel, ...props }: StreamMessageProps) => (
  <Message {...props} aria-label={label} className={composeClassName('ui-stream-message', className)} data-status={status} from="assistant">
    <Prose aria-busy={status === 'streaming'} aria-live="off" data-ui-stream-content>{children}</Prose>
    <Stack direction="horizontal" gap="related" wrap>
      <span aria-live="polite" role="status">{statusLabel}</span>
      {actions}
    </Stack>
    {sources}
  </Message>
)

export interface SourceCitationProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> { href: string, label: string }

export const SourceCitation = ({ children, className, href, label, ...props }: SourceCitationProps) => {
  const safeHref = resolveLumenCitationHref(href)

  return safeHref ?
    (
      <Link {...props} className={composeClassName('ui-source-citation', className)} href={safeHref} rel="noopener noreferrer">
        {label}
        {children}
      </Link>
    ) :
    (
      <span className={composeClassName('ui-source-citation', className)}>
        {label}
        {children}
      </span>
    )
}

export interface ToolActivityProps extends ComponentPropsWithoutRef<'details'> { label: string, status?: LumenToolStatus, statusLabel: string }

export const ToolActivity = ({ children, className, label, status = 'queued', statusLabel, ...props }: ToolActivityProps) => (
  <Collapsible {...props} className={composeClassName('ui-tool-activity', className)} data-status={status}>
    <summary>{label}</summary>
    <Stack gap="related">
      <span role="status">{statusLabel}</span>
      {children}
    </Stack>
  </Collapsible>
)

export interface ApprovalCardProps extends ComponentPropsWithoutRef<'div'> {
  approveLabel?: string
  disabled?: boolean
  label: string
  onResponse?: (detail: LumenApprovalResponseDetail) => void
  rejectLabel?: string
  requestId: string
  status?: LumenApprovalStatus
  statusLabel: string
}

export const ApprovalCard = ({ approveLabel = 'Approve', children, className, disabled = false, label, onResponse, rejectLabel = 'Reject', requestId, status = 'pending', statusLabel, ...props }: ApprovalCardProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current

    if (!root) return

    const cleanup = bindLumenApprovalCard(root)

    const respond = (event: Event): void => {
      if (!('detail' in event)) return

      const detail = readLumenApprovalResponseDetail(event.detail)

      if (detail) onResponse?.(detail)
    }

    root.addEventListener('ui:approval-response', respond)

    return () => {
      cleanup()

      root.removeEventListener('ui:approval-response', respond)
    }
  }, [onResponse])

  return (
    <Card {...props} ref={ref} aria-label={label} className={composeClassName('ui-approval-card', className)} data-disabled={String(disabled)} data-request-id={requestId} data-status={status} data-ui-approval-card>
      <Stack gap="group">
        <strong>{label}</strong>
        {children}
        <span role="status">{statusLabel}</span>
        <Stack direction="horizontal" gap="related" wrap>
          <Button data-ui-approval-response="approve" disabled={disabled || status !== 'pending'} type="button">{approveLabel}</Button>
          <Button data-ui-approval-response="reject" disabled={disabled || status !== 'pending'} type="button" variant="secondary">{rejectLabel}</Button>
        </Stack>
      </Stack>
    </Card>
  )
}

'use client'

import { useLayoutEffect, useRef, useState } from 'react'

export type LumenReviewResult = { status: 'success' } | { status: 'failure', message: string } | { status: 'uncertain', message: string }
export type LumenReviewStatus = 'editing' | 'review' | 'pending' | LumenReviewResult['status']

export interface LumenReviewWorkflowOptions<T> {
  /** Change after every edit or server revision. Never reuse an earlier revision for a new draft. */
  revision: string
  submit: (proposal: T) => Promise<LumenReviewResult>
  /** Safe localized fallback when a thrown error leaves the commit outcome unknown. */
  uncertainMessage: string
}

/** Review immutable application-owned proposals. No requests, persistence or automatic retries. */
export const useLumenReviewWorkflow = <T>({ revision, submit, uncertainMessage }: LumenReviewWorkflowOptions<T>) => {
  const latestRef = useRef({ revision, submit, uncertainMessage })
  const snapshotRef = useRef<{ revision: string, proposal: T } | undefined>(undefined)
  const phaseRef = useRef<LumenReviewStatus>('editing')
  const mountedRef = useRef(false)
  const [status, setStatus] = useState<LumenReviewStatus>('editing')
  const [message, setMessage] = useState('')
  const [reviewedSnapshot, setReviewedSnapshot] = useState<{ revision: string, proposal: T } | undefined>(undefined)

  useLayoutEffect(() => {
    latestRef.current = { revision, submit, uncertainMessage }
  })

  useLayoutEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  const changeStatus = (next: LumenReviewStatus, text = '') => {
    phaseRef.current = next

    if (mountedRef.current) {
      setStatus(next)

      setMessage(text)
    }
  }

  const locked = () => phaseRef.current === 'pending' || phaseRef.current === 'uncertain'
  const stale = reviewedSnapshot !== undefined && reviewedSnapshot.revision !== revision
  const visibleStatus = stale && status !== 'pending' && status !== 'uncertain' ? 'editing' : status

  return {
    status: visibleStatus,
    message: visibleStatus === 'editing' ? '' : message,
    proposal: visibleStatus === 'editing' ? undefined : reviewedSnapshot?.proposal,
    revision: reviewedSnapshot?.revision,
    review: (proposal: T): boolean => {
      if (locked()) return false

      snapshotRef.current = { revision: latestRef.current.revision, proposal }

      setReviewedSnapshot(snapshotRef.current)

      changeStatus('review')

      return true
    },
    edit: (): boolean => {
      if (locked()) return false

      snapshotRef.current = undefined

      setReviewedSnapshot(undefined)

      changeStatus('editing')

      return true
    },
    confirm: async (): Promise<boolean> => {
      const reviewed = snapshotRef.current

      if (!mountedRef.current || locked() || reviewed?.revision !== latestRef.current.revision ||
        (phaseRef.current !== 'review' && phaseRef.current !== 'failure')) return false

      changeStatus('pending')

      let result: LumenReviewResult

      try {
        result = await latestRef.current.submit(reviewed.proposal)
      } catch {
        result = { status: 'uncertain', message: latestRef.current.uncertainMessage }
      }

      changeStatus(result.status, result.status === 'success' ? '' : result.message)

      return result.status === 'success'
    },
    /** Call only after the application has checked the durable command outcome. */
    reconcile: (result: Exclude<LumenReviewResult, { status: 'uncertain' }>): boolean => {
      if (phaseRef.current !== 'uncertain') return false

      changeStatus(result.status, result.status === 'success' ? '' : result.message)

      return true
    }
  }
}
